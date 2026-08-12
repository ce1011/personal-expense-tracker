import type { AppDataPayload } from '@/types/app-data'

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

export function validateAppDataPayload(_payload: unknown): ValidationResult {
  const errors: string[] = []

  if (!isRecord(_payload)) {
    return {
      ok: false,
      errors: ['Backup file must contain an object'],
    }
  }

  const arrayKeys: Array<keyof AppDataPayload> = [
    'cycles',
    'expenseCategories',
    'incomeCategories',
    'expenses',
    'incomes',
    'targetExpenses',
    'savings',
    'settings',
  ]

  for (const key of arrayKeys) {
    if (!Array.isArray(_payload[key])) {
      errors.push(`${key} must be an array`)
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const payload = _payload as unknown as AppDataPayload
  payload.cycles.forEach((cycle, index) => {
    requireString(cycle, 'cycle_id', `cycles[${index}]`, errors)
    requireString(cycle, 'cycle_code', `cycles[${index}]`, errors)
    requireNumber(cycle, 'income_day', `cycles[${index}]`, errors)
    requireNumber(cycle, 'income', `cycles[${index}]`, errors)
    requireNumber(cycle, 'saving_target', `cycles[${index}]`, errors)
  })

  payload.expenseCategories.forEach((category, index) => {
    validateCategory(category, `expenseCategories[${index}]`, errors)
  })

  payload.incomeCategories.forEach((category, index) => {
    validateCategory(category, `incomeCategories[${index}]`, errors)
  })

  payload.expenses.forEach((transaction, index) => {
    requireString(transaction, 'transaction_id', `expenses[${index}]`, errors)
    requireString(transaction, 'category_id', `expenses[${index}]`, errors)
    requireString(transaction, 'name', `expenses[${index}]`, errors)
    requireNumber(transaction, 'amount', `expenses[${index}]`, errors)
    requireNumber(transaction, 'date', `expenses[${index}]`, errors)
    requireNumber(transaction, 'create_date', `expenses[${index}]`, errors)
    requireNumber(transaction, 'edit_date', `expenses[${index}]`, errors)
    requireBoolean(transaction, 'synced', `expenses[${index}]`, errors)
    requireOptionalString(transaction, 'reminder_parameter', `expenses[${index}]`, errors)
    requireOptionalString(transaction, 'trip_id', `expenses[${index}]`, errors)
    requireOptionalSupportedCurrency(transaction, 'original_currency', `expenses[${index}]`, errors)
    requireOptionalNumber(transaction, 'original_amount', `expenses[${index}]`, errors)
    requireOptionalNumber(transaction, 'exchange_rate_hkd', `expenses[${index}]`, errors)
    requireOptionalBoolean(transaction, 'recurring', `expenses[${index}]`, errors)
    requireOptionalEnum(
      transaction,
      'recurring_frequency',
      RECURRING_FREQUENCIES,
      `expenses[${index}]`,
      errors,
    )
    requireOptionalNumber(transaction, 'recurring_day', `expenses[${index}]`, errors)
    requireOptionalEnum(
      transaction,
      'spending_nature',
      SPENDING_NATURES,
      `expenses[${index}]`,
      errors,
    )
    requireOptionalString(transaction, 'payment_method', `expenses[${index}]`, errors)
    requireOptionalString(transaction, 'merchant', `expenses[${index}]`, errors)
    requireOptionalString(transaction, 'subcategory', `expenses[${index}]`, errors)
    requireOptionalStringArray(transaction, 'tags', `expenses[${index}]`, errors)
  })

  payload.incomes.forEach((transaction, index) => {
    requireString(transaction, 'transaction_id', `incomes[${index}]`, errors)
    requireString(transaction, 'category_id', `incomes[${index}]`, errors)
    requireString(transaction, 'name', `incomes[${index}]`, errors)
    requireNumber(transaction, 'amount', `incomes[${index}]`, errors)
    requireNumber(transaction, 'date', `incomes[${index}]`, errors)
    requireNumber(transaction, 'create_date', `incomes[${index}]`, errors)
    requireNumber(transaction, 'edit_date', `incomes[${index}]`, errors)
    requireBoolean(transaction, 'synced', `incomes[${index}]`, errors)
    requireOptionalString(transaction, 'trip_id', `incomes[${index}]`, errors)
    requireOptionalSupportedCurrency(transaction, 'original_currency', `incomes[${index}]`, errors)
    requireOptionalNumber(transaction, 'original_amount', `incomes[${index}]`, errors)
    requireOptionalNumber(transaction, 'exchange_rate_hkd', `incomes[${index}]`, errors)
  })

  payload.targetExpenses.forEach((target, index) => {
    requireString(target, 'target_expense_id', `targetExpenses[${index}]`, errors)
    requireString(target, 'cycle_id', `targetExpenses[${index}]`, errors)
    requireString(target, 'category_id', `targetExpenses[${index}]`, errors)
    requireNumber(target, 'amount', `targetExpenses[${index}]`, errors)
  })

  payload.savings.forEach((saving, index) => {
    requireString(saving, 'saving_id', `savings[${index}]`, errors)
    requireNumber(saving, 'amount', `savings[${index}]`, errors)
    requireNumber(saving, 'date', `savings[${index}]`, errors)
    requireString(saving, 'description', `savings[${index}]`, errors)
    requireOptionalString(saving, 'category_id', `savings[${index}]`, errors)
    requireOptionalString(saving, 'challenge_id', `savings[${index}]`, errors)
    requireOptionalNumber(saving, 'create_date', `savings[${index}]`, errors)
    requireOptionalNumber(saving, 'edit_date', `savings[${index}]`, errors)
    requireOptionalBoolean(saving, 'synced', `savings[${index}]`, errors)
    requireOptionalString(saving, 'trip_id', `savings[${index}]`, errors)
    requireOptionalSupportedCurrency(saving, 'original_currency', `savings[${index}]`, errors)
    requireOptionalNumber(saving, 'original_amount', `savings[${index}]`, errors)
    requireOptionalNumber(saving, 'exchange_rate_hkd', `savings[${index}]`, errors)
  })

  payload.settings.forEach((setting, index) => {
    requireString(setting, 'setting_id', `settings[${index}]`, errors)
    requireString(setting, 'name', `settings[${index}]`, errors)
    requireString(setting, 'parameter', `settings[${index}]`, errors)
  })

  if (payload.trips !== undefined) {
    if (!Array.isArray(payload.trips)) {
      errors.push('trips must be an array')
    } else {
      payload.trips.forEach((trip, index) => {
        requireString(trip, 'trip_id', `trips[${index}]`, errors)
        requireString(trip, 'name', `trips[${index}]`, errors)
        requireString(trip, 'destination', `trips[${index}]`, errors)
        requireNumber(trip, 'start_date', `trips[${index}]`, errors)
        requireNumber(trip, 'end_date', `trips[${index}]`, errors)
        requireNumber(trip, 'budget_amount', `trips[${index}]`, errors)
        requireSupportedCurrency(trip, 'budget_currency', `trips[${index}]`, errors)
        requireTripStatus(trip, 'status', `trips[${index}]`, errors)
        requireString(trip, 'notes', `trips[${index}]`, errors)
        requireNumber(trip, 'created_at', `trips[${index}]`, errors)
        requireNumber(trip, 'updated_at', `trips[${index}]`, errors)
      })
    }
  }

  if (payload.fxRates !== undefined) {
    if (!Array.isArray(payload.fxRates)) {
      errors.push('fxRates must be an array')
    } else {
      payload.fxRates.forEach((rate, index) => {
        requireString(rate, 'rate_id', `fxRates[${index}]`, errors)
        requireSupportedCurrency(rate, 'currency_code', `fxRates[${index}]`, errors)
        requireNumber(rate, 'rate_to_hkd', `fxRates[${index}]`, errors)
        requireString(rate, 'source_date', `fxRates[${index}]`, errors)
        requireNumber(rate, 'fetched_at', `fxRates[${index}]`, errors)
      })
    }
  }

  if (payload.savingChallenges !== undefined) {
    if (!Array.isArray(payload.savingChallenges)) {
      errors.push('savingChallenges must be an array')
    } else {
      payload.savingChallenges.forEach((challenge, index) => {
        requireString(challenge, 'challenge_id', `savingChallenges[${index}]`, errors)
        requireString(challenge, 'name', `savingChallenges[${index}]`, errors)
        requireNumber(challenge, 'target_amount', `savingChallenges[${index}]`, errors)
        requireNumber(challenge, 'current_amount', `savingChallenges[${index}]`, errors)
        requireChallengeStatus(challenge, 'status', `savingChallenges[${index}]`, errors)
        requireNumber(challenge, 'created_at', `savingChallenges[${index}]`, errors)
        requireNumber(challenge, 'updated_at', `savingChallenges[${index}]`, errors)
      })
    }
  }

  if (payload.assetAccounts !== undefined) {
    if (!Array.isArray(payload.assetAccounts)) {
      errors.push('assetAccounts must be an array')
    } else {
      payload.assetAccounts.forEach((account, index) => {
        requireString(account, 'account_id', `assetAccounts[${index}]`, errors)
        requireString(account, 'name', `assetAccounts[${index}]`, errors)
        requireOptionalEnum(account, 'kind', ACCOUNT_KINDS, `assetAccounts[${index}]`, errors)
        if (isRecord(account) && account.kind === undefined) {
          errors.push(`assetAccounts[${index}].kind must be one of ${ACCOUNT_KINDS.join(', ')}`)
        }
        requireNumber(account, 'created_at', `assetAccounts[${index}]`, errors)
        requireNumber(account, 'updated_at', `assetAccounts[${index}]`, errors)
      })
    }
  }

  if (payload.accountBalances !== undefined) {
    if (!Array.isArray(payload.accountBalances)) {
      errors.push('accountBalances must be an array')
    } else {
      payload.accountBalances.forEach((balance, index) => {
        requireString(balance, 'balance_id', `accountBalances[${index}]`, errors)
        requireString(balance, 'account_id', `accountBalances[${index}]`, errors)
        requireNumber(balance, 'amount', `accountBalances[${index}]`, errors)
        requireNumber(balance, 'date', `accountBalances[${index}]`, errors)
        requireOptionalString(balance, 'note', `accountBalances[${index}]`, errors)
      })
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export function isAppDataPayload(payload: unknown): payload is AppDataPayload {
  return validateAppDataPayload(payload).ok
}

export function parseBackupJson(json: string): { payload?: AppDataPayload; errors: string[] } {
  try {
    const parsed = JSON.parse(json) as unknown
    const result = validateAppDataPayload(parsed)
    return result.ok ? { payload: parsed as AppDataPayload, errors: [] } : { errors: result.errors }
  } catch {
    return { errors: ['Backup file is not valid JSON'] }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateCategory(value: unknown, path: string, errors: string[]): void {
  requireString(value, 'category_id', path, errors)
  requireString(value, 'name_en', path, errors)
  requireString(value, 'name_tc', path, errors)
  requireString(value, 'color_code', path, errors)
  requireString(value, 'icon_image_name', path, errors)
  requireBoolean(value, 'custom', path, errors)
  requireBoolean(value, 'deleted', path, errors)
}

function requireString(value: unknown, key: string, path: string, errors: string[]): void {
  if (!isRecord(value) || typeof value[key] !== 'string') {
    errors.push(`${path}.${key} must be a string`)
  }
}

function requireNumber(value: unknown, key: string, path: string, errors: string[]): void {
  if (!isRecord(value) || typeof value[key] !== 'number' || !Number.isFinite(value[key])) {
    errors.push(`${path}.${key} must be a number`)
  }
}

function requireBoolean(value: unknown, key: string, path: string, errors: string[]): void {
  if (!isRecord(value) || typeof value[key] !== 'boolean') {
    errors.push(`${path}.${key} must be a boolean`)
  }
}

function requireOptionalString(value: unknown, key: string, path: string, errors: string[]): void {
  if (isRecord(value) && value[key] !== undefined && typeof value[key] !== 'string') {
    errors.push(`${path}.${key} must be a string`)
  }
}

function requireOptionalNumber(value: unknown, key: string, path: string, errors: string[]): void {
  if (
    isRecord(value) &&
    value[key] !== undefined &&
    (typeof value[key] !== 'number' || !Number.isFinite(value[key]))
  ) {
    errors.push(`${path}.${key} must be a number`)
  }
}

function requireOptionalBoolean(value: unknown, key: string, path: string, errors: string[]): void {
  if (isRecord(value) && value[key] !== undefined && typeof value[key] !== 'boolean') {
    errors.push(`${path}.${key} must be a boolean`)
  }
}

function requireOptionalStringArray(value: unknown, key: string, path: string, errors: string[]): void {
  if (!isRecord(value) || value[key] === undefined) {
    return
  }

  if (!Array.isArray(value[key]) || value[key].some((entry) => typeof entry !== 'string')) {
    errors.push(`${path}.${key} must be an array of strings`)
  }
}

function requireOptionalEnum<T extends string>(
  value: unknown,
  key: string,
  allowed: readonly T[],
  path: string,
  errors: string[],
): void {
  if (isRecord(value) && value[key] !== undefined && !allowed.includes(value[key] as T)) {
    errors.push(`${path}.${key} must be one of ${allowed.join(', ')}`)
  }
}

const SUPPORTED_CURRENCIES = ['HKD', 'USD', 'CNY', 'JPY', 'TWD', 'THB'] as const
const TRIP_STATUSES = ['planned', 'active', 'completed'] as const
const RECURRING_FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const
const CHALLENGE_STATUSES = ['active', 'completed', 'paused'] as const
const SPENDING_NATURES = ['need', 'want'] as const
const ACCOUNT_KINDS = ['cash', 'investment', 'liability'] as const

function requireSupportedCurrency(
  value: unknown,
  key: string,
  path: string,
  errors: string[],
): void {
  if (
    !isRecord(value) ||
    !SUPPORTED_CURRENCIES.includes(value[key] as (typeof SUPPORTED_CURRENCIES)[number])
  ) {
    errors.push(`${path}.${key} must be one of ${SUPPORTED_CURRENCIES.join(', ')}`)
  }
}

function requireOptionalSupportedCurrency(
  value: unknown,
  key: string,
  path: string,
  errors: string[],
): void {
  if (isRecord(value) && value[key] !== undefined) {
    requireSupportedCurrency(value, key, path, errors)
  }
}

function requireTripStatus(value: unknown, key: string, path: string, errors: string[]): void {
  if (!isRecord(value) || !TRIP_STATUSES.includes(value[key] as (typeof TRIP_STATUSES)[number])) {
    errors.push(`${path}.${key} must be one of ${TRIP_STATUSES.join(', ')}`)
  }
}

function requireChallengeStatus(value: unknown, key: string, path: string, errors: string[]): void {
  if (
    !isRecord(value) ||
    !CHALLENGE_STATUSES.includes(value[key] as (typeof CHALLENGE_STATUSES)[number])
  ) {
    errors.push(`${path}.${key} must be one of ${CHALLENGE_STATUSES.join(', ')}`)
  }
}
