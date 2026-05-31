import type {
  ExpenseCategory,
  ExpenseTransaction,
  TargetExpenseLimit,
} from '@/types/app-data'

export interface CategoryProgressRow {
  category: ExpenseCategory
  target: number
  spent: number
  ratio: number
}

export function buildCategoryProgressRows(
  categories: readonly ExpenseCategory[],
  expenses: readonly ExpenseTransaction[],
  targetExpenses: readonly TargetExpenseLimit[],
  cycleId?: string,
  targetDivisor = 1,
): CategoryProgressRow[] {
  const totals = new Map<string, number>()

  for (const expense of expenses) {
    totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + expense.amount)
  }

  return categories.map((category) => {
    const rawTarget =
      targetExpenses.find(
        (limit) => limit.cycle_id === cycleId && limit.category_id === category.category_id,
      )?.amount ?? 0
    const target = rawTarget > 0 ? rawTarget / Math.max(1, targetDivisor) : 0
    const spent = totals.get(category.category_id) ?? 0
    const ratio = target > 0 ? Math.min(1, spent / target) : 0

    return { category, target, spent, ratio }
  })
}
