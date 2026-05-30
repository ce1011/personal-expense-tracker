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
  })

  payload.settings.forEach((setting, index) => {
    requireString(setting, 'setting_id', `settings[${index}]`, errors)
    requireString(setting, 'name', `settings[${index}]`, errors)
    requireString(setting, 'parameter', `settings[${index}]`, errors)
  })

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
