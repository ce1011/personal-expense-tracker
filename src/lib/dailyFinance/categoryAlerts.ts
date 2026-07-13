import type { CycleWindow } from '@/lib/budgetCycle'
import { isInCycleWindow } from '@/lib/budgetCycle'
import type { ExpenseCategory, ExpenseTransaction, TargetExpenseLimit } from '@/types/app-data'

export interface CategoryAlert {
  category_id: string
  category_name: string
  color_code: string
  target: number
  spent: number
  remaining: number
  percentage: number
  severity: 'ok' | 'warning' | 'danger'
}

export function getCategoryAlerts(
  expenses: ExpenseTransaction[],
  targetLimits: TargetExpenseLimit[],
  categories: ExpenseCategory[],
  cycleWindow: CycleWindow,
  cycleId: string,
): CategoryAlert[] {
  const cycleExpenses = expenses.filter((expense) => isInCycleWindow(expense.date, cycleWindow))

  return targetLimits
    .filter((target) => target.cycle_id === cycleId)
    .map((target) => {
      const category = categories.find((c) => c.category_id === target.category_id)
      const spent = cycleExpenses
        .filter((expense) => expense.category_id === target.category_id)
        .reduce((sum, expense) => sum + expense.amount, 0)
      const percentage = target.amount > 0 ? (spent / target.amount) * 100 : 0
      let severity: CategoryAlert['severity'] = 'ok'

      if (percentage > 100) {
        severity = 'danger'
      } else if (percentage >= 80) {
        severity = 'warning'
      }

      return {
        category_id: target.category_id,
        category_name: category?.name_tc ?? category?.name_en ?? target.category_id,
        color_code: category?.color_code ?? '000000',
        target: target.amount,
        spent,
        remaining: target.amount - spent,
        percentage,
        severity,
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
}
