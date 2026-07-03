export interface SafeToSpendInput {
  remainingBudget: number
  daysUntilNextIncome: number
  fixedExpensesTotal: number
  todaySpent: number
  savingTarget: number
}

export interface SafeToSpendResult {
  safeToSpendToday: number
  projectedSurplus: number
  isOverToday: boolean
}

export function getSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const available = input.remainingBudget - input.fixedExpensesTotal - input.savingTarget
  const daily = Math.max(available, 0) / Math.max(input.daysUntilNextIncome, 1)
  const safeToSpendToday = daily - input.todaySpent

  return {
    safeToSpendToday,
    projectedSurplus: available,
    isOverToday: safeToSpendToday < 0,
  }
}
