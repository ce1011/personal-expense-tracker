import type { AppDataPayload, AppSnapshot } from '@/types/app-data'
import { parseBackupJson, validateAppDataPayload } from '@/lib/backup'

export interface SnapshotSummary {
  snapshotId: string
  createdAt: number
  reason: string
}

export interface RestoreImpactSummary {
  cycles: number
  expenseCategories: number
  incomeCategories: number
  expenses: number
  incomes: number
  targetExpenses: number
  savings: number
  settings: number
  trips: number
  fxRates: number
  savingChallenges: number
}

export interface IntegrityValidationResult {
  ok: boolean
  errors: string[]
}

export function createSnapshotRecord(
  payload: AppDataPayload,
  reason: string,
  now: number,
): AppSnapshot {
  return {
    snapshot_id: `snapshot-${now}`,
    created_at: now,
    reason: reason.trim(),
    payload_json: JSON.stringify(payload),
  }
}

export function summarizeSnapshots(snapshots: readonly AppSnapshot[]): SnapshotSummary[] {
  return [...snapshots]
    .sort((left, right) => right.created_at - left.created_at)
    .map((snapshot) => ({
      snapshotId: snapshot.snapshot_id,
      createdAt: snapshot.created_at,
      reason: snapshot.reason,
    }))
}

export function trimSnapshots(
  snapshots: readonly AppSnapshot[],
  keepCount: number,
): { keep: AppSnapshot[]; remove: AppSnapshot[] } {
  const sorted = [...snapshots].sort((left, right) => right.created_at - left.created_at)
  return {
    keep: sorted.slice(0, keepCount),
    remove: sorted.slice(keepCount),
  }
}

export function summarizeRestoreImpact(payload: AppDataPayload): RestoreImpactSummary {
  return {
    cycles: payload.cycles.length,
    expenseCategories: payload.expenseCategories.length,
    incomeCategories: payload.incomeCategories.length,
    expenses: payload.expenses.length,
    incomes: payload.incomes.length,
    targetExpenses: payload.targetExpenses.length,
    savings: payload.savings.length,
    settings: payload.settings.length,
    trips: payload.trips?.length ?? 0,
    fxRates: payload.fxRates?.length ?? 0,
    savingChallenges: payload.savingChallenges?.length ?? 0,
  }
}

export function validateSnapshotPayload(payload: AppDataPayload): IntegrityValidationResult {
  const schemaResult = validateAppDataPayload(payload)

  if (!schemaResult.ok) {
    return schemaResult
  }

  const errors: string[] = []
  const expenseCategoryIds = new Set(payload.expenseCategories.map((category) => category.category_id))
  const incomeCategoryIds = new Set(payload.incomeCategories.map((category) => category.category_id))
  const cycleIds = new Set(payload.cycles.map((cycle) => cycle.cycle_id))
  const tripIds = new Set((payload.trips ?? []).map((trip) => trip.trip_id))
  const challengeIds = new Set((payload.savingChallenges ?? []).map((challenge) => challenge.challenge_id))
  const activeTripIds = payload.settings
    .filter((setting) => setting.name === 'active_trip_id')
    .map((setting) => setting.parameter)

  for (const expense of payload.expenses) {
    if (!expenseCategoryIds.has(expense.category_id)) {
      errors.push(`Expense ${expense.transaction_id} references unknown category ${expense.category_id}`)
    }

    if (expense.trip_id && !tripIds.has(expense.trip_id)) {
      errors.push(`Expense ${expense.transaction_id} references unknown trip ${expense.trip_id}`)
    }
  }

  for (const income of payload.incomes) {
    if (!incomeCategoryIds.has(income.category_id)) {
      errors.push(`Income ${income.transaction_id} references unknown category ${income.category_id}`)
    }

    if (income.trip_id && !tripIds.has(income.trip_id)) {
      errors.push(`Income ${income.transaction_id} references unknown trip ${income.trip_id}`)
    }
  }

  for (const saving of payload.savings) {
    if (saving.category_id && saving.category_id !== 'saving-cash' && !expenseCategoryIds.has(saving.category_id)) {
      errors.push(`Saving ${saving.saving_id} references unknown category ${saving.category_id}`)
    }

    if (saving.trip_id && !tripIds.has(saving.trip_id)) {
      errors.push(`Saving ${saving.saving_id} references unknown trip ${saving.trip_id}`)
    }

    if (saving.challenge_id && !challengeIds.has(saving.challenge_id)) {
      errors.push(`Saving ${saving.saving_id} references unknown challenge ${saving.challenge_id}`)
    }
  }

  for (const target of payload.targetExpenses) {
    if (!cycleIds.has(target.cycle_id)) {
      errors.push(`Target expense ${target.target_expense_id} references unknown cycle ${target.cycle_id}`)
    }

    if (!expenseCategoryIds.has(target.category_id)) {
      errors.push(
        `Target expense ${target.target_expense_id} references unknown category ${target.category_id}`,
      )
    }
  }

  for (const activeTripId of activeTripIds) {
    if (activeTripId && !tripIds.has(activeTripId)) {
      errors.push(`Setting active_trip_id references unknown trip ${activeTripId}`)
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export function parseSnapshotJson(json: string): { payload?: AppDataPayload; errors: string[] } {
  return parseBackupJson(json)
}
