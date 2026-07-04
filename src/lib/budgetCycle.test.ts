import { describe, expect, test } from 'vitest'

import { getCycleWindow, getRemainingCycleDays } from './budgetCycle'

describe('getCycleWindow', () => {
  test('groups a May cycle by the income day window', () => {
    const window = getCycleWindow('202605', 25)

    expect(window.start).toEqual(new Date(2026, 3, 25, 0, 0, 0, 0).getTime())
    expect(window.end).toEqual(new Date(2026, 4, 25, 0, 0, 0, 0).getTime())
    expect(window.label).toBe('4月25日 - 5月24日')
  })

  test('clamps cycle boundaries for shorter months', () => {
    const window = getCycleWindow('202603', 31)

    expect(window.start).toEqual(new Date(2026, 1, 28, 0, 0, 0, 0).getTime())
    expect(window.end).toEqual(new Date(2026, 2, 31, 0, 0, 0, 0).getTime())
    expect(window.label).toBe('2月28日 - 3月30日')
  })
})

describe('getRemainingCycleDays', () => {
  test('counts remaining cycle days including today', () => {
    const window = getCycleWindow('202605', 25)

    expect(getRemainingCycleDays(window, new Date(2026, 4, 10, 14, 0).getTime())).toBe(15)
  })

  test('returns one day on the last day of the cycle', () => {
    const window = getCycleWindow('202605', 25)

    expect(getRemainingCycleDays(window, new Date(2026, 4, 24, 9, 0).getTime())).toBe(1)
  })
})
