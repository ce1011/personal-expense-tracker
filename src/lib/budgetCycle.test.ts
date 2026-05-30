import { describe, expect, test } from 'vitest'

import { getCycleWindow } from './budgetCycle'

describe('getCycleWindow', () => {
  test('groups a May cycle by the income day window', () => {
    const window = getCycleWindow('202605', 25)

    expect(window.start).toEqual(new Date(2026, 3, 25, 0, 0, 0, 0).getTime())
    expect(window.end).toEqual(new Date(2026, 4, 25, 0, 0, 0, 0).getTime())
    expect(window.label).toBe('Apr 25 - May 24')
  })

  test('clamps cycle boundaries for shorter months', () => {
    const window = getCycleWindow('202603', 31)

    expect(window.start).toEqual(new Date(2026, 1, 28, 0, 0, 0, 0).getTime())
    expect(window.end).toEqual(new Date(2026, 2, 31, 0, 0, 0, 0).getTime())
    expect(window.label).toBe('Feb 28 - Mar 30')
  })
})
