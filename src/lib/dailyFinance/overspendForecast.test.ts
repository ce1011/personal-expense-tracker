import { describe, expect, test } from 'vitest'

import type { CycleWindow } from '@/lib/budgetCycle'
import { getOverspendForecast } from './overspendForecast'

const cycleWindow: CycleWindow = {
  start: new Date(2026, 6, 1).getTime(),
  end: new Date(2026, 7, 1).getTime(),
  label: 'Jul 1 - Jul 31',
}

describe('getOverspendForecast', () => {
  test('projects an overspend when spending pace plus upcoming fixed expenses exceed budget', () => {
    const forecast = getOverspendForecast({
      cycleWindow,
      remainingBudget: 900,
      cycleExpenseTotal: 2100,
      fixedExpensesTotal: 600,
      now: new Date(2026, 6, 21).getTime(),
    })

    expect(forecast).toMatchObject({
      spentSoFar: 2100,
      elapsedDays: 21,
      remainingDays: 10,
      averageDailySpend: 100,
      projectedVariableSpend: 1000,
      projectedFixedSpend: 600,
      projectedTotalSpend: 3700,
      projectedRemainingBudget: -700,
      projectedOverspendAmount: 700,
      isProjectedToOverspend: true,
      paceRatio: 1.2,
    })
  })

  test('returns a projected surplus when current pace is sustainable', () => {
    const forecast = getOverspendForecast({
      cycleWindow,
      remainingBudget: 1600,
      cycleExpenseTotal: 1400,
      fixedExpensesTotal: 300,
      now: new Date(2026, 6, 21).getTime(),
    })

    expect(forecast.isProjectedToOverspend).toBe(false)
    expect(forecast.projectedRemainingBudget).toBeCloseTo(633.33, 2)
    expect(forecast.projectedOverspendAmount).toBe(0)
    expect(forecast.projectedSurplusAmount).toBeCloseTo(633.33, 2)
  })

  test('clamps elapsed and remaining days inside the cycle window', () => {
    const forecastBeforeStart = getOverspendForecast({
      cycleWindow,
      remainingBudget: 2000,
      cycleExpenseTotal: 0,
      fixedExpensesTotal: 500,
      now: new Date(2026, 5, 28).getTime(),
    })

    const forecastAfterEnd = getOverspendForecast({
      cycleWindow,
      remainingBudget: 400,
      cycleExpenseTotal: 2600,
      fixedExpensesTotal: 0,
      now: new Date(2026, 7, 5).getTime(),
    })

    expect(forecastBeforeStart.elapsedDays).toBe(1)
    expect(forecastBeforeStart.remainingDays).toBe(30)
    expect(forecastAfterEnd.elapsedDays).toBe(31)
    expect(forecastAfterEnd.remainingDays).toBe(0)
  })
})
