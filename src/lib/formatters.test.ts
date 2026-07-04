import { describe, expect, test } from 'vitest'

import { formatCurrency, formatDate, formatPercent, formatShortDate, withHash } from './formatters'

describe('formatCurrency', () => {
  test('formats HKD amount with zero fraction digits', () => {
    expect(formatCurrency(1234.5, 'HKD')).toBe('HK$1,235')
  })

  test('formats zero as currency', () => {
    expect(formatCurrency(0, 'HKD')).toBe('HK$0')
  })

  test('formats negative amounts', () => {
    expect(formatCurrency(-500, 'HKD')).toBe('-HK$500')
  })

  test('formats foreign currency', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('US$100')
  })
})

describe('formatDate', () => {
  test('formats timestamp as zh-HK long date', () => {
    const timestamp = new Date(2026, 6, 4, 12, 0, 0).getTime()
    expect(formatDate(timestamp)).toBe('2026年7月4日')
  })
})

describe('formatShortDate', () => {
  test('formats timestamp as zh-HK short date', () => {
    const timestamp = new Date(2026, 6, 4, 12, 0, 0).getTime()
    expect(formatShortDate(timestamp)).toBe('7月4日')
  })
})

describe('formatPercent', () => {
  test('rounds decimal to whole percent', () => {
    expect(formatPercent(0.155)).toBe('16%')
  })

  test('formats one as one hundred percent', () => {
    expect(formatPercent(1)).toBe('100%')
  })

  test('formats zero as zero percent', () => {
    expect(formatPercent(0)).toBe('0%')
  })
})

describe('withHash', () => {
  test('returns color code that already has hash', () => {
    expect(withHash('#ff0000')).toBe('#ff0000')
  })

  test('prefixes color code without hash', () => {
    expect(withHash('ff0000')).toBe('#ff0000')
  })
})
