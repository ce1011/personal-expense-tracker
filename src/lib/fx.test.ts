import { describe, expect, test } from 'vitest'

import {
  convertToHkd,
  getFxRefreshDateKey,
  parseHkdFxApiResponse,
  shouldRefreshFxRates,
} from './fx'

describe('parseHkdFxApiResponse', () => {
  test('maps supported currencies into HKD conversion rates', () => {
    const parsed = parseHkdFxApiResponse({
      date: '2026-05-30',
      hkd: {
        hkd: 1,
        usd: 0.1276095,
        cny: 0.86347088,
        jpy: 20.32628839,
        twd: 4.01267569,
        thb: 4.15438151,
      },
    })

    expect(parsed.date).toBe('2026-05-30')
    expect(parsed.rates.USD).toBeCloseTo(7.836407164, 6)
    expect(parsed.rates.CNY).toBeCloseTo(1.158116739, 6)
    expect(parsed.rates.JPY).toBeCloseTo(0.049197437, 6)
    expect(parsed.rates.TWD).toBeCloseTo(0.249210253, 6)
    expect(parsed.rates.THB).toBeCloseTo(0.24070972, 5)
    expect(parsed.rates.HKD).toBe(1)
  })
})

describe('shouldRefreshFxRates', () => {
  test('refreshes when there is no cached day key', () => {
    expect(shouldRefreshFxRates(undefined, '2026-05-31')).toBe(true)
  })

  test('does not refresh twice on the same local day', () => {
    expect(shouldRefreshFxRates('2026-05-31', '2026-05-31')).toBe(false)
  })
})

describe('convertToHkd', () => {
  test('converts and rounds source amounts into HKD', () => {
    expect(convertToHkd(10, 7.8364103737)).toBe(78.36)
  })
})

describe('getFxRefreshDateKey', () => {
  test('creates a local YYYY-MM-DD key', () => {
    expect(getFxRefreshDateKey(new Date(2026, 4, 31, 9, 15))).toBe('2026-05-31')
  })
})
