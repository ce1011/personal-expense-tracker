import { describe, expect, test } from 'vitest'

import { getDaysUntilNextIncomeDay } from './date'

describe('getDaysUntilNextIncomeDay', () => {
  test('counts local days until the next income day in the same month', () => {
    expect(getDaysUntilNextIncomeDay(25, new Date(2026, 5, 1, 9, 30))).toBe(24)
  })

  test('rolls into the next month after the income day has passed', () => {
    expect(getDaysUntilNextIncomeDay(25, new Date(2026, 5, 26, 12, 0))).toBe(29)
  })

  test('returns 1 on the income day to avoid divide by zero', () => {
    expect(getDaysUntilNextIncomeDay(25, new Date(2026, 5, 25, 8, 0))).toBe(1)
  })

  test('clamps long income days for short months', () => {
    expect(getDaysUntilNextIncomeDay(31, new Date(2026, 3, 30, 18, 0))).toBe(1)
  })
})
