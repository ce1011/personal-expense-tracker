import { savingCategories } from '@/lib/savingCategories'
import type { ExpenseCategory, IncomeCategory, SupportedCurrency } from '@/types/app-data'

export interface ImportTransactionRecord {
  type: 'expense' | 'income' | 'saving'
  category_id: string
  name: string
  amount: number
  date: number
  currency_code: SupportedCurrency
  exchange_rate_hkd: number
}

export interface ImportPreviewSummary {
  total: number
  expenseCount: number
  incomeCount: number
  savingCount: number
  currencies: SupportedCurrency[]
}

export interface ParseTransactionImportOptions {
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  fxRateMap: ReadonlyMap<SupportedCurrency, number>
}

export interface ParseTransactionImportResult {
  transactions: ImportTransactionRecord[]
  errors: string[]
  summary?: ImportPreviewSummary
}

const supportedCurrencies: SupportedCurrency[] = ['HKD', 'USD', 'CNY', 'JPY', 'TWD', 'THB']
const minTimestampInMs = 10_000_000_000

export function parseTransactionImportJson(
  json: string,
  options: ParseTransactionImportOptions,
): ParseTransactionImportResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    return {
      transactions: [],
      errors: ['JSON 格式無效'],
    }
  }

  if (!Array.isArray(parsed)) {
    return {
      transactions: [],
      errors: ['JSON 內容必須是陣列'],
    }
  }

  const expenseCategoryIds = new Set(
    options.expenseCategories.map((category) => category.category_id),
  )
  const incomeCategoryIds = new Set(
    options.incomeCategories.map((category) => category.category_id),
  )
  const savingCategoryIds = new Set(savingCategories.map((category) => category.category_id))
  const errors: string[] = []
  const transactions: ImportTransactionRecord[] = []

  parsed.forEach((entry, index) => {
    const path = `第 ${index + 1} 筆`

    if (!isRecord(entry)) {
      errors.push(`${path}：必須是物件`)
      return
    }

    const type = entry.type

    if (type !== 'expense' && type !== 'income' && type !== 'saving') {
      errors.push(`${path}：type 必須是 expense、income 或 saving`)
      return
    }

    const categoryId = entry.category_id
    const name = entry.name
    const amount = entry.amount
    const date = entry.date
    const currencyCode = entry.currency_code
    const explicitRate = entry.exchange_rate_hkd

    if (typeof categoryId !== 'string' || categoryId.trim() === '') {
      errors.push(`${path}：category_id 為必填`)
      return
    }

    if (typeof name !== 'string' || name.trim() === '') {
      errors.push(`${path}：name 為必填`)
      return
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      errors.push(`${path}：amount 必須是大於 0 的數字`)
      return
    }

    if (
      typeof date !== 'number' ||
      !Number.isFinite(date) ||
      !Number.isInteger(date) ||
      date < minTimestampInMs
    ) {
      errors.push(`${path}：date 必須是毫秒 Unix timestamp`)
      return
    }

    if (
      typeof currencyCode !== 'string' ||
      !supportedCurrencies.includes(currencyCode as SupportedCurrency)
    ) {
      errors.push(`${path}：currency_code 必須是 ${supportedCurrencies.join('/')}`)
      return
    }

    if (
      !isCategoryAllowed(type, categoryId, expenseCategoryIds, incomeCategoryIds, savingCategoryIds)
    ) {
      errors.push(`${path}：category_id 不存在或不屬於該交易類型`)
      return
    }

    let exchangeRate = 0

    if (explicitRate !== undefined) {
      if (typeof explicitRate !== 'number' || !Number.isFinite(explicitRate) || explicitRate <= 0) {
        errors.push(`${path}：exchange_rate_hkd 必須是大於 0 的數字`)
        return
      }

      exchangeRate = explicitRate
    } else {
      exchangeRate = options.fxRateMap.get(currencyCode as SupportedCurrency) ?? 0

      if (exchangeRate <= 0) {
        errors.push(
          `${path}：缺少 ${currencyCode} 的匯率，請先讓 app 更新匯率或在 JSON 提供 exchange_rate_hkd`,
        )
        return
      }
    }

    transactions.push({
      type,
      category_id: categoryId,
      name: name.trim(),
      amount,
      date,
      currency_code: currencyCode as SupportedCurrency,
      exchange_rate_hkd: exchangeRate,
    })
  })

  if (errors.length > 0) {
    return {
      transactions: [],
      errors,
    }
  }

  return {
    transactions,
    errors: [],
    summary: buildSummary(transactions),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCategoryAllowed(
  type: ImportTransactionRecord['type'],
  categoryId: string,
  expenseCategoryIds: Set<string>,
  incomeCategoryIds: Set<string>,
  savingCategoryIds: Set<string>,
): boolean {
  if (type === 'expense') {
    return expenseCategoryIds.has(categoryId)
  }

  if (type === 'income') {
    return incomeCategoryIds.has(categoryId)
  }

  return savingCategoryIds.has(categoryId)
}

function buildSummary(transactions: readonly ImportTransactionRecord[]): ImportPreviewSummary {
  return {
    total: transactions.length,
    expenseCount: transactions.filter((transaction) => transaction.type === 'expense').length,
    incomeCount: transactions.filter((transaction) => transaction.type === 'income').length,
    savingCount: transactions.filter((transaction) => transaction.type === 'saving').length,
    currencies: [
      ...new Set(transactions.map((transaction) => transaction.currency_code)),
    ].sort() as SupportedCurrency[],
  }
}
