import { api, ApiError } from '@/api/client'
import { parseBackupJson } from '@/lib/backup'
import { summarizeRestoreImpact, validateSnapshotPayload } from '@/lib/recovery'
import type { ImportTransactionRecord } from '@/lib/transactionImport'
import type {
  AppDataPayload,
  AppSetting,
  BudgetCycle,
  CategoryDraft,
  CycleDraft,
  ExpenseCategory,
  ExpenseDraft,
  IncomeCategory,
  IncomeDraft,
  SavingChallenge,
  SavingDraft,
  SupportedCurrency,
  TripDraft,
  TripSession,
} from '@/types/app-data'

/**
 * Persistence layer.
 *
 * Delegates to the Elysia backend via the Eden client (`@/api/client`).
 *
 * Server-side behavior worth noting:
 * - Amounts are stored in HKD; create/update bodies send `currency_code` +
 *   `exchange_rate_hkd` and the server derives `amount = original × rate`.
 * - Every mutation writes a full-payload snapshot server-side (trimmed to the
 *   newest 20), so the client no longer maintains local snapshots.
 * - FX rates are synced by the backend (`GET /data/sync`), so
 *   `syncFxRatesIfNeeded` is a no-op here.
 * - Page *reads* no longer go through the monolithic `/data/export`; each page
 *   calls its own aggregate endpoint (see `src/composables/use*Data.ts`). This
 *   module only fetches the small shared "context" lists (categories, trips,
 *   saving-challenges) plus the full payload exclusively for backup/restore.
 */

const ACTIVE_TRIP_SETTING_NAME = 'active_trip_id'

let settingsRequest: Promise<AppSetting[]> | null = null

/** Share the in-flight settings read used by the initial context bootstrap. */
function listSettings(): Promise<AppSetting[]> {
  if (!settingsRequest) {
    settingsRequest = api.settings.list().finally(() => {
      settingsRequest = null
    })
  }

  return settingsRequest
}

type ImportTransactionRecordWithTrip = ImportTransactionRecord & { trip_id?: string }
type TripSaveMetadata = {
  trip_id: string
  created_at: number
}

export async function ensureSeedData(): Promise<void> {
  // Seeding happens server-side: new accounts are provisioned with the same
  // defaults the frontend used to seed locally. Nothing to do here.
}

// ---------------------------------------------------------------------------
// Shared "context" reads (small lists used across the shell + quick-add).
// ---------------------------------------------------------------------------

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const categories = await api.categories.expenses.list()
  return [...categories].sort((a, b) => a.name_en.localeCompare(b.name_en))
}

export async function listIncomeCategories(): Promise<IncomeCategory[]> {
  const categories = await api.categories.incomes.list()
  return [...categories].sort((a, b) => a.name_en.localeCompare(b.name_en))
}

export async function listTrips(): Promise<TripSession[]> {
  const trips = await api.trips.list()
  return [...trips].sort((a, b) => a.start_date - b.start_date)
}

export async function listSavingChallenges(): Promise<SavingChallenge[]> {
  const challenges = await api.savingChallenges.list()
  return [...challenges].sort((a, b) => b.updated_at - a.updated_at)
}

/** Fetch the currency setting (falls back to HKD when unset). */
export async function getCurrency(): Promise<string> {
  const settings = await listSettings()
  return settings.find((setting) => setting.name === 'currency')?.parameter ?? 'HKD'
}

/** Full-payload export — used ONLY for the Settings backup download. */
export async function exportBackup(): Promise<AppDataPayload> {
  return api.data.export()
}

export interface FxContext {
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
  latestFxDate: string
}

/** FX rates for quick-add conversion (HKD base, plus the latest source date). */
export async function getFxContext(): Promise<FxContext> {
  const rates = await api.fxRates.list()
  const entries = rates.map((rate) => [rate.currency_code, rate.rate_to_hkd] as const)
  const fxRateMap = new Map<SupportedCurrency, number>([['HKD', 1], ...entries])
  const latestFxDate = [...rates].sort((a, b) => b.source_date.localeCompare(a.source_date))[0]
    ?.source_date
  return { fxRateMap, latestFxDate: latestFxDate ?? '' }
}

/** Overwrite the whole dataset (import / restore). */
export async function replaceAllData(payload: AppDataPayload): Promise<void> {
  const validation = validateSnapshotPayload(payload)

  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'))
  }

  await api.data.import(payload)
}

export async function replaceAllDataWithSnapshot(payload: AppDataPayload): Promise<void> {
  // The backend already snapshots the current state before overwriting on
  // import ("restore:before"), so no extra client-side snapshot is needed.
  await replaceAllData(payload)
}

export async function getRecoverySnapshotSummaries() {
  const snapshots = await api.data.snapshots.list()

  return snapshots
    .map((snapshot) => ({
      snapshotId: snapshot.snapshot_id,
      createdAt: snapshot.created_at,
      reason: snapshot.reason,
    }))
    .sort((left, right) => right.createdAt - left.createdAt)
}

export async function getRestorePreview(json: string): Promise<{
  payload?: AppDataPayload
  impact?: ReturnType<typeof summarizeRestoreImpact>
  integrity?: ReturnType<typeof validateSnapshotPayload>
  errors: string[]
}> {
  const parsed = parseBackupJson(json)

  if (!parsed.payload) {
    return { errors: parsed.errors }
  }

  const integrity = validateSnapshotPayload(parsed.payload)

  return {
    payload: parsed.payload,
    impact: summarizeRestoreImpact(parsed.payload),
    integrity,
    errors: integrity.ok ? [] : integrity.errors,
  }
}

export async function restoreFromSnapshot(snapshotId: string): Promise<void> {
  await api.data.snapshots.restore(snapshotId)
}

export async function createExpense(draft: ExpenseDraft): Promise<void> {
  await api.transactions.expenses.create({
    category_id: draft.category_id,
    name: draft.name.trim(),
    amount: draft.amount,
    date: draft.date,
    trip_id: draft.trip_id,
    currency_code: draft.currency_code,
    exchange_rate_hkd: draft.exchange_rate_hkd,
    recurring: draft.recurring,
    recurring_frequency: draft.recurring_frequency,
    recurring_day: draft.recurring_day,
  })
}

export async function createIncome(draft: IncomeDraft): Promise<void> {
  await api.transactions.incomes.create({
    category_id: draft.category_id,
    name: draft.name.trim(),
    amount: draft.amount,
    date: draft.date,
    trip_id: draft.trip_id,
    currency_code: draft.currency_code,
    exchange_rate_hkd: draft.exchange_rate_hkd,
  })
}

export async function createSaving(draft: SavingDraft): Promise<void> {
  await api.transactions.savings.create({
    description: draft.name.trim(),
    date: draft.date,
    amount: draft.amount,
    category_id: draft.category_id,
    challenge_id: draft.challenge_id,
    trip_id: draft.trip_id,
    currency_code: draft.currency_code,
    exchange_rate_hkd: draft.exchange_rate_hkd,
  })
}

export async function importTransactions(
  records: readonly ImportTransactionRecordWithTrip[],
): Promise<void> {
  await api.transactions.import({
    records: records.map((record) => ({
      type: record.type,
      name: record.name.trim(),
      amount: record.amount,
      date: record.date,
      category_id: record.category_id,
      trip_id: record.trip_id,
      currency_code: record.currency_code,
      exchange_rate_hkd: record.exchange_rate_hkd,
    })),
  })
}

export async function updateExpense(transactionId: string, draft: ExpenseDraft): Promise<void> {
  await api.transactions.expenses.update(transactionId, {
    category_id: draft.category_id,
    name: draft.name.trim(),
    amount: draft.amount,
    date: draft.date,
    trip_id: draft.trip_id,
    currency_code: draft.currency_code,
    exchange_rate_hkd: draft.exchange_rate_hkd,
    recurring: draft.recurring,
    recurring_frequency: draft.recurring_frequency,
    recurring_day: draft.recurring_day,
  })
}

export async function updateIncome(transactionId: string, draft: IncomeDraft): Promise<void> {
  await api.transactions.incomes.update(transactionId, {
    category_id: draft.category_id,
    name: draft.name.trim(),
    amount: draft.amount,
    date: draft.date,
    trip_id: draft.trip_id,
    currency_code: draft.currency_code,
    exchange_rate_hkd: draft.exchange_rate_hkd,
  })
}

export async function updateSaving(transactionId: string, draft: SavingDraft): Promise<void> {
  await api.transactions.savings.update(transactionId, {
    description: draft.name.trim(),
    date: draft.date,
    amount: draft.amount,
    category_id: draft.category_id,
    challenge_id: draft.challenge_id,
    trip_id: draft.trip_id,
    currency_code: draft.currency_code,
    exchange_rate_hkd: draft.exchange_rate_hkd,
  })
}

export async function deleteExpense(transactionId: string): Promise<void> {
  await api.transactions.expenses.remove(transactionId)
}

export async function deleteIncome(transactionId: string): Promise<void> {
  await api.transactions.incomes.remove(transactionId)
}

export async function deleteSaving(transactionId: string): Promise<void> {
  await api.transactions.savings.remove(transactionId)
}

export async function createSavingChallenge(name: string, target_amount: number): Promise<void> {
  await api.savingChallenges.create({ name: name.trim(), target_amount })
}

export async function updateSavingChallenge(
  challengeId: string,
  draft: Pick<SavingChallenge, 'name' | 'target_amount' | 'status'>,
): Promise<void> {
  await api.savingChallenges.update(challengeId, {
    name: draft.name.trim(),
    target_amount: draft.target_amount,
    status: draft.status,
  })
}

export async function deleteSavingChallenge(challengeId: string): Promise<void> {
  await api.savingChallenges.remove(challengeId)
}

export async function getTrips(): Promise<TripSession[]> {
  const trips = await api.trips.list()
  return [...trips].sort((a, b) => b.updated_at - a.updated_at)
}

export async function saveTrip(
  draft: TripDraft,
  existing?: Partial<TripSaveMetadata>,
): Promise<void> {
  const body = {
    name: draft.name.trim(),
    destination: draft.destination.trim(),
    start_date: draft.start_date,
    end_date: draft.end_date,
    budget_amount: draft.budget_amount,
    budget_currency: draft.budget_currency,
    status: draft.status,
    notes: draft.notes.trim(),
  }

  if (existing?.trip_id) {
    await api.trips.update(existing.trip_id, body)
    return
  }

  await api.trips.create(body)
}

export async function getActiveTripId(): Promise<string | undefined> {
  const settings = await listSettings()
  const setting = settings.find((entry) => entry.name === ACTIVE_TRIP_SETTING_NAME)

  return setting?.parameter || undefined
}

export async function setActiveTripId(tripId?: string): Promise<void> {
  if (!tripId) {
    try {
      await api.settings.remove(ACTIVE_TRIP_SETTING_NAME)
    } catch (caught) {
      // Deleting a setting that does not exist is fine — treat 404 as cleared.
      if (!(caught instanceof ApiError && caught.status === 404)) {
        throw caught
      }
    }
    return
  }

  await assertTripExists(tripId)
  await api.settings.set(ACTIVE_TRIP_SETTING_NAME, { parameter: tripId })
}

export async function saveCycle(draft: CycleDraft, cycleId?: string): Promise<void> {
  // POST /cycles upserts by cycle_code but ignores cycle_id, so an explicit
  // update must go through PUT /cycles/:id.
  if (cycleId) {
    await api.cycles.update(cycleId, {
      cycle_code: draft.cycle_code,
      income_day: draft.income_day,
      income: draft.income,
      saving_target: draft.saving_target,
    })
    return
  }

  // New cycle: if one already exists for this cycle_code, update it; otherwise
  // create it. This preserves the old put-by-code semantics.
  const existing = await findCycleByCode(draft.cycle_code)

  if (existing) {
    await api.cycles.update(existing.cycle_id, {
      income_day: draft.income_day,
      income: draft.income,
      saving_target: draft.saving_target,
    })
    return
  }

  await api.cycles.create({
    cycle_code: draft.cycle_code,
    income_day: draft.income_day,
    income: draft.income,
    saving_target: draft.saving_target,
  })
}

export async function saveTargetLimit(
  cycle_id: string,
  category_id: string,
  amount: number,
): Promise<void> {
  await api.targetExpenses.upsert({ cycle_id, category_id, amount })
}

export async function saveExpenseCategory(
  draft: CategoryDraft,
  categoryId?: string,
): Promise<void> {
  const body = toCategoryBody(draft)

  if (categoryId) {
    await api.categories.expenses.update(categoryId, body)
    return
  }

  await api.categories.expenses.create(body)
}

export async function saveIncomeCategory(draft: CategoryDraft, categoryId?: string): Promise<void> {
  const body = toCategoryBody(draft)

  if (categoryId) {
    await api.categories.incomes.update(categoryId, body)
    return
  }

  await api.categories.incomes.create(body)
}

export async function softDeleteExpenseCategory(categoryId: string): Promise<void> {
  await api.categories.expenses.remove(categoryId)
}

export async function softDeleteIncomeCategory(categoryId: string): Promise<void> {
  await api.categories.incomes.remove(categoryId)
}

export async function syncFxRatesIfNeeded(): Promise<void> {
  // FX rates are synced by the backend (see `GET /data/sync` / `POST
  // /fx-rates/refresh`). No client-side fetching is required anymore.
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toCategoryBody(draft: CategoryDraft) {
  return {
    name_en: draft.name_en.trim(),
    name_tc: draft.name_tc.trim(),
    color_code: draft.color_code.replace('#', ''),
    icon_image_name: draft.icon_image_name.trim(),
  }
}

async function findCycleByCode(cycleCode: string): Promise<BudgetCycle | undefined> {
  const cycles = await api.cycles.list()
  return cycles.find((cycle) => cycle.cycle_code === cycleCode)
}

async function assertTripExists(tripId: string): Promise<void> {
  const trips = await api.trips.list()

  if (!trips.some((trip) => trip.trip_id === tripId)) {
    throw new Error(`Unknown trip_id: ${tripId}`)
  }
}
