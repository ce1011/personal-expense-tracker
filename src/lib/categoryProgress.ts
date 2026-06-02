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
  remaining: number
}

export function buildCategoryProgressRows(
  categories: readonly ExpenseCategory[],
  expenses: readonly ExpenseTransaction[],
  targetExpenses: readonly TargetExpenseLimit[],
  cycleId?: string,
  targetDivisor = 1,
  cycleExpenses: readonly ExpenseTransaction[] = expenses,
  useRemainingTarget = false,
): CategoryProgressRow[] {
  const totals = new Map<string, number>()
  const cycleTotals = new Map<string, number>()

  for (const expense of expenses) {
    totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + expense.amount)
  }

  for (const expense of cycleExpenses) {
    cycleTotals.set(expense.category_id, (cycleTotals.get(expense.category_id) ?? 0) + expense.amount)
  }

  return categories.map((category) => {
    const rawTarget =
      targetExpenses.find(
        (limit) => limit.cycle_id === cycleId && limit.category_id === category.category_id,
      )?.amount ?? 0
    const remainingTarget = Math.max(0, rawTarget - (cycleTotals.get(category.category_id) ?? 0))
    const effectiveTarget = useRemainingTarget ? remainingTarget : rawTarget
    const target = rawTarget > 0 ? effectiveTarget / Math.max(1, targetDivisor) : 0
    const spent = totals.get(category.category_id) ?? 0
    const ratio = target > 0 ? Math.min(1, spent / target) : 0
    const remaining = Math.max(0, target - spent)

    return { category, target, spent, ratio, remaining }
  })
}
