import { describe, expect, test } from 'vitest'
import { getSafeToSpend } from './safeToSpend'

describe('getSafeToSpend', () => {
  test('distributes remaining budget evenly after committed expenses', () => {
    const result = getSafeToSpend({
      remainingBudget: 10000,
      daysUntilNextIncome: 10,
      fixedExpensesTotal: 3000,
      todaySpent: 200,
      savingTarget: 2000,
    })

    // available = 10000 - 3000 - 2000 = 5000
    // daily = 5000 / 10 = 500
    // safe today = 500 - 200 = 300
    expect(result.safeToSpendToday).toBe(300)
    expect(result.projectedSurplus).toBe(5000)
    expect(result.isOverToday).toBe(false)
  })

  test('flags overspend for today', () => {
    const result = getSafeToSpend({
      remainingBudget: 10000,
      daysUntilNextIncome: 10,
      fixedExpensesTotal: 3000,
      todaySpent: 600,
      savingTarget: 2000,
    })

    expect(result.safeToSpendToday).toBe(-100)
    expect(result.isOverToday).toBe(true)
  })

  test('returns zero when nothing is left', () => {
    const result = getSafeToSpend({
      remainingBudget: 1000,
      daysUntilNextIncome: 5,
      fixedExpensesTotal: 1000,
      todaySpent: 0,
      savingTarget: 0,
    })

    expect(result.safeToSpendToday).toBe(0)
    expect(result.projectedSurplus).toBe(0)
  })
})
