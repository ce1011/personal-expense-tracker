import { db, createInitialPayload } from '@/db/database'
import { validateAppDataPayload } from '@/lib/backup'
import {
  convertToHkd,
  getFxRefreshDateKey,
  parseHkdFxApiResponse,
  shouldRefreshFxRates,
} from '@/lib/fx'
import { createChallenge } from '@/lib/dailyFinance/savingChallenges'
import type { ImportTransactionRecord } from '@/lib/transactionImport'
import type {
  AppDataPayload,
  AppSetting,
  BudgetCycle,
  CategoryDraft,
  CycleDraft,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseTransaction,
  FxRateRecord,
  IncomeCategory,
  IncomeDraft,
  IncomeTransaction,
  SavingChallenge,
  SavingDraft,
  SavingRecord,
  SupportedCurrency,
  TargetExpenseLimit,
  TripDraft,
  TripSession,
} from '@/types/app-data'

const FX_API_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/hkd.json'
const ACTIVE_TRIP_SETTING_ID = 'setting-active-trip-id'
const ACTIVE_TRIP_SETTING_NAME = 'active_trip_id'
type ImportTransactionRecordWithTrip = ImportTransactionRecord & { trip_id?: string }
type TripSaveMetadata = {
  trip_id: string
  created_at: number
}
type TripLinkedPersistenceInput = {
  amount: number
  currency_code: SupportedCurrency
  exchange_rate_hkd: number
  trip_id?: string
}

export async function ensureSeedData(): Promise<void> {
  const cycleCount = await db.cycles.count()

  if (cycleCount > 0) {
    return
  }

  await replaceAllData(createInitialPayload())
}

export async function loadAppData(): Promise<AppDataPayload> {
  await ensureSeedData()
  await syncFxRatesIfNeeded()

  const [
    cycles,
    expenseCategories,
    incomeCategories,
    expenses,
    incomes,
    targetExpenses,
    savings,
    settings,
    trips,
    fxRates,
    savingChallenges,
  ] = await Promise.all([
    db.cycles.toArray(),
    db.expenseCategories.toArray(),
    db.incomeCategories.toArray(),
    db.expenses.toArray(),
    db.incomes.toArray(),
    db.targetExpenses.toArray(),
    db.savings.toArray(),
    db.settings.toArray(),
    db.trips.toArray(),
    db.fxRates.toArray(),
    db.savingChallenges.toArray(),
  ])

  return {
    cycles: cycles.sort((a, b) => b.cycle_code.localeCompare(a.cycle_code)),
    expenseCategories: expenseCategories.sort((a, b) => a.name_en.localeCompare(b.name_en)),
    incomeCategories: incomeCategories.sort((a, b) => a.name_en.localeCompare(b.name_en)),
    expenses: expenses.sort((a, b) => b.date - a.date),
    incomes: incomes.sort((a, b) => b.date - a.date),
    targetExpenses,
    savings: savings.sort((a, b) => b.date - a.date),
    settings,
    trips: trips.sort((a, b) => b.updated_at - a.updated_at),
    fxRates: fxRates.sort((a, b) => a.currency_code.localeCompare(b.currency_code)),
    savingChallenges: savingChallenges.sort((a, b) => b.updated_at - a.updated_at),
  }
}

export async function replaceAllData(payload: AppDataPayload): Promise<void> {
  const validation = validateAppDataPayload(payload)

  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'))
  }

  await db.transaction(
    'rw',
    [
      db.cycles,
      db.expenseCategories,
      db.incomeCategories,
      db.expenses,
      db.incomes,
      db.targetExpenses,
      db.savings,
      db.settings,
      db.trips,
      db.fxRates,
      db.savingChallenges,
    ],
    async () => {
      await Promise.all([
        db.cycles.clear(),
        db.expenseCategories.clear(),
        db.incomeCategories.clear(),
        db.expenses.clear(),
        db.incomes.clear(),
        db.targetExpenses.clear(),
        db.savings.clear(),
        db.settings.clear(),
        db.trips.clear(),
        db.fxRates.clear(),
        db.savingChallenges.clear(),
      ])

      await Promise.all([
        db.cycles.bulkPut(payload.cycles),
        db.expenseCategories.bulkPut(payload.expenseCategories),
        db.incomeCategories.bulkPut(payload.incomeCategories),
        db.expenses.bulkPut(payload.expenses),
        db.incomes.bulkPut(payload.incomes),
        db.targetExpenses.bulkPut(payload.targetExpenses),
        db.savings.bulkPut(payload.savings),
        db.settings.bulkPut(payload.settings),
        db.trips.bulkPut(payload.trips ?? []),
        db.fxRates.bulkPut(payload.fxRates ?? []),
        db.savingChallenges.bulkPut(payload.savingChallenges ?? []),
      ])
    },
  )
}

export async function createExpense(draft: ExpenseDraft): Promise<void> {
  const now = Date.now()
  const persistedFields = await buildTripLinkedPersistenceFields(draft)
  const transaction: ExpenseTransaction = {
    transaction_id: makeId('expense'),
    category_id: draft.category_id,
    name: draft.name.trim(),
    date: draft.date,
    create_date: now,
    edit_date: now,
    recurring: draft.recurring,
    recurring_frequency: draft.recurring_frequency,
    recurring_day: draft.recurring_day,
    ...persistedFields,
  }

  await db.expenses.add(transaction)
}

export async function createIncome(draft: IncomeDraft): Promise<void> {
  const now = Date.now()
  const persistedFields = await buildTripLinkedPersistenceFields(draft)
  const transaction: IncomeTransaction = {
    transaction_id: makeId('income'),
    category_id: draft.category_id,
    name: draft.name.trim(),
    date: draft.date,
    create_date: now,
    edit_date: now,
    ...persistedFields,
  }

  await db.incomes.add(transaction)
}

export async function createSaving(draft: SavingDraft): Promise<void> {
  const now = Date.now()
  const persistedFields = await buildTripLinkedPersistenceFields(draft)
  const record: SavingRecord = {
    saving_id: makeId('saving'),
    category_id: draft.category_id,
    date: draft.date,
    description: draft.name.trim(),
    challenge_id: draft.challenge_id,
    create_date: now,
    edit_date: now,
    ...persistedFields,
  }

  await db.savings.add(record)
}

export async function importTransactions(
  records: readonly ImportTransactionRecordWithTrip[],
): Promise<void> {
  const now = Date.now()

  await db.transaction('rw', [db.expenses, db.incomes, db.savings], async () => {
    for (const record of records) {
      const persistedFields = await buildTripLinkedPersistenceFields(record)

      if (record.type === 'expense') {
        await db.expenses.add({
          transaction_id: makeId('expense'),
          category_id: record.category_id,
          name: record.name.trim(),
          date: record.date,
          create_date: now,
          edit_date: now,
          ...persistedFields,
        })
        continue
      }

      if (record.type === 'income') {
        await db.incomes.add({
          transaction_id: makeId('income'),
          category_id: record.category_id,
          name: record.name.trim(),
          date: record.date,
          create_date: now,
          edit_date: now,
          ...persistedFields,
        })
        continue
      }

      await db.savings.add({
        saving_id: makeId('saving'),
        category_id: record.category_id,
        date: record.date,
        description: record.name.trim(),
        create_date: now,
        edit_date: now,
        ...persistedFields,
      })
    }
  })
}

export async function updateExpense(transactionId: string, draft: ExpenseDraft): Promise<void> {
  const persistedFields = await buildTripLinkedPersistenceFields(draft)

  await db.expenses.update(transactionId, {
    category_id: draft.category_id,
    name: draft.name.trim(),
    date: draft.date,
    edit_date: Date.now(),
    recurring: draft.recurring,
    recurring_frequency: draft.recurring_frequency,
    recurring_day: draft.recurring_day,
    ...persistedFields,
  })
}

export async function updateIncome(transactionId: string, draft: IncomeDraft): Promise<void> {
  const persistedFields = await buildTripLinkedPersistenceFields(draft)

  await db.incomes.update(transactionId, {
    category_id: draft.category_id,
    name: draft.name.trim(),
    date: draft.date,
    edit_date: Date.now(),
    ...persistedFields,
  })
}

export async function updateSaving(transactionId: string, draft: SavingDraft): Promise<void> {
  const persistedFields = await buildTripLinkedPersistenceFields(draft)

  await db.savings.update(transactionId, {
    category_id: draft.category_id,
    description: draft.name.trim(),
    date: draft.date,
    challenge_id: draft.challenge_id,
    edit_date: Date.now(),
    ...persistedFields,
  })
}

export async function deleteExpense(transactionId: string): Promise<void> {
  await db.expenses.delete(transactionId)
}

export async function deleteIncome(transactionId: string): Promise<void> {
  await db.incomes.delete(transactionId)
}

export async function deleteSaving(transactionId: string): Promise<void> {
  await db.savings.delete(transactionId)
}

export async function createSavingChallenge(name: string, target_amount: number): Promise<void> {
  const now = Date.now()
  const challenge: SavingChallenge = createChallenge(name, target_amount, now)

  await db.savingChallenges.add(challenge)
}

export async function updateSavingChallenge(
  challengeId: string,
  draft: Pick<SavingChallenge, 'name' | 'target_amount' | 'status'>,
): Promise<void> {
  await db.savingChallenges.update(challengeId, {
    name: draft.name.trim(),
    target_amount: draft.target_amount,
    status: draft.status,
    updated_at: Date.now(),
  })
}

export async function deleteSavingChallenge(challengeId: string): Promise<void> {
  await db.savingChallenges.delete(challengeId)
}

export async function getTrips(): Promise<TripSession[]> {
  const trips = await db.trips.toArray()

  return trips.sort((a, b) => b.updated_at - a.updated_at)
}

export async function saveTrip(
  draft: TripDraft,
  existing?: Partial<TripSaveMetadata>,
): Promise<void> {
  const now = Date.now()
  const storedTrip = existing?.trip_id ? await db.trips.get(existing.trip_id) : undefined
  const trip: TripSession = {
    trip_id: existing?.trip_id ?? makeId('trip'),
    name: draft.name.trim(),
    destination: draft.destination.trim(),
    start_date: draft.start_date,
    end_date: draft.end_date,
    budget_amount: draft.budget_amount,
    budget_currency: draft.budget_currency,
    status: draft.status,
    notes: draft.notes.trim(),
    created_at: existing?.created_at ?? storedTrip?.created_at ?? now,
    updated_at: now,
  }

  await db.trips.put(trip)
}

export async function getActiveTripId(): Promise<string | undefined> {
  const setting = await findActiveTripSetting()

  return setting?.parameter || undefined
}

export async function setActiveTripId(tripId?: string): Promise<void> {
  await assertTripExists(tripId)
  const existing = await findActiveTripSetting()

  if (!tripId) {
    await db.settings.delete(existing?.setting_id ?? ACTIVE_TRIP_SETTING_ID)
    return
  }

  const setting: AppSetting = {
    setting_id: existing?.setting_id ?? ACTIVE_TRIP_SETTING_ID,
    name: ACTIVE_TRIP_SETTING_NAME,
    parameter: tripId,
  }

  await db.settings.put(setting)
}

export async function saveCycle(draft: CycleDraft, cycleId?: string): Promise<void> {
  const cycle: BudgetCycle = {
    cycle_id: cycleId ?? makeId('cycle'),
    cycle_code: draft.cycle_code,
    income_day: draft.income_day,
    income: draft.income,
    saving_target: draft.saving_target,
  }

  await db.cycles.put(cycle)
}

export async function saveTargetLimit(
  cycle_id: string,
  category_id: string,
  amount: number,
): Promise<void> {
  const existing = await db.targetExpenses
    .where('[cycle_id+category_id]')
    .equals([cycle_id, category_id])
    .first()
  const target: TargetExpenseLimit = {
    target_expense_id: existing?.target_expense_id ?? makeId('target'),
    cycle_id,
    category_id,
    amount,
  }

  await db.targetExpenses.put(target)
}

export async function saveExpenseCategory(
  draft: CategoryDraft,
  categoryId?: string,
): Promise<void> {
  await db.expenseCategories.put(
    toCategory(draft, categoryId, 'expense-category') as ExpenseCategory,
  )
}

export async function saveIncomeCategory(draft: CategoryDraft, categoryId?: string): Promise<void> {
  await db.incomeCategories.put(toCategory(draft, categoryId, 'income-category') as IncomeCategory)
}

export async function softDeleteExpenseCategory(categoryId: string): Promise<void> {
  await db.expenseCategories.update(categoryId, { deleted: true })
}

export async function softDeleteIncomeCategory(categoryId: string): Promise<void> {
  await db.incomeCategories.update(categoryId, { deleted: true })
}

export async function syncFxRatesIfNeeded(now = new Date()): Promise<void> {
  const todayKey = getFxRefreshDateKey(now)
  const cachedRates = await db.fxRates.toArray()
  const latestSourceDate = cachedRates[0]?.source_date

  if (!shouldRefreshFxRates(latestSourceDate, todayKey)) {
    return
  }

  try {
    const response = await fetch(FX_API_URL)

    if (!response.ok) {
      throw new Error(`FX request failed with status ${response.status}`)
    }

    const parsed = parseHkdFxApiResponse((await response.json()) as unknown)
    await saveFxRates(parsed.date, parsed.rates, Date.now())
  } catch {
    if (cachedRates.length === 0) {
      await saveFxRates(todayKey, { HKD: 1 }, Date.now())
    }
  }
}

function toCategory(
  draft: CategoryDraft,
  categoryId: string | undefined,
  prefix: string,
): ExpenseCategory | IncomeCategory {
  return {
    category_id: categoryId ?? makeId(prefix),
    name_en: draft.name_en.trim(),
    name_tc: draft.name_tc.trim(),
    color_code: draft.color_code.replace('#', ''),
    icon_image_name: draft.icon_image_name.trim(),
    custom: true,
    deleted: false,
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}

async function saveFxRates(
  sourceDate: string,
  rates: Partial<Record<SupportedCurrency, number>>,
  fetchedAt: number,
): Promise<void> {
  const records: FxRateRecord[] = Object.entries(rates)
    .filter((entry): entry is [SupportedCurrency, number] => typeof entry[1] === 'number')
    .map(([currencyCode, rateToHkd]) => ({
      rate_id: `fx-${currencyCode}`,
      currency_code: currencyCode,
      rate_to_hkd: rateToHkd,
      source_date: sourceDate,
      fetched_at: fetchedAt,
    }))

  await db.fxRates.bulkPut(records)
}

async function findActiveTripSetting(): Promise<AppSetting | undefined> {
  return db.settings.where('name').equals(ACTIVE_TRIP_SETTING_NAME).first()
}

async function buildTripLinkedPersistenceFields(
  input: TripLinkedPersistenceInput,
): Promise<
  Pick<
    ExpenseTransaction,
    'amount' | 'synced' | 'trip_id' | 'original_currency' | 'original_amount' | 'exchange_rate_hkd'
  >
> {
  await assertTripExists(input.trip_id)

  return {
    amount: convertToHkd(input.amount, input.exchange_rate_hkd),
    synced: false,
    trip_id: input.trip_id,
    original_currency: input.currency_code,
    original_amount: input.amount,
    exchange_rate_hkd: input.exchange_rate_hkd,
  }
}

async function assertTripExists(tripId?: string): Promise<void> {
  if (!tripId) {
    return
  }

  const trip = await db.trips.get(tripId)

  if (!trip) {
    throw new Error(`Unknown trip_id: ${tripId}`)
  }
}
