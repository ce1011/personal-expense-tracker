import type { SupportedCurrency } from '@/types/app-data'

export interface FxRateMap {
  HKD: number
  USD: number
  CNY: number
  JPY: number
  TWD: number
  THB: number
}

export interface ParsedFxResponse {
  date: string
  rates: FxRateMap
}

const supportedCurrencies: SupportedCurrency[] = ['HKD', 'USD', 'CNY', 'JPY', 'TWD', 'THB']

export function parseHkdFxApiResponse(payload: unknown): ParsedFxResponse {
  if (!isRecord(payload) || typeof payload.date !== 'string' || !isRecord(payload.hkd)) {
    throw new Error('Invalid FX response')
  }

  const rates = {} as FxRateMap

  for (const currency of supportedCurrencies) {
    if (currency === 'HKD') {
      rates.HKD = 1
      continue
    }

    const apiKey = currency.toLowerCase()
    const apiRate = payload.hkd[apiKey]

    if (typeof apiRate !== 'number' || apiRate <= 0) {
      throw new Error(`Missing FX rate for ${currency}`)
    }

    rates[currency] = 1 / apiRate
  }

  return {
    date: payload.date,
    rates,
  }
}

export function shouldRefreshFxRates(
  cachedDayKey: string | undefined,
  currentDayKey: string,
): boolean {
  return !cachedDayKey || cachedDayKey !== currentDayKey
}

export function convertToHkd(amount: number, rateToHkd: number): number {
  return Number((amount * rateToHkd).toFixed(2))
}

export function getFxRefreshDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
