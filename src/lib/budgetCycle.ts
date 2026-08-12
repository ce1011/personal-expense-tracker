export interface CycleWindow {
  start: number
  end: number
  label: string
}

import { startOfLocalDay, getDaysInMonth } from './date'
import { formatShortDate } from './formatters'

function parseCycleCode(cycleCode: string): { year: number; monthIndex: number } {
  if (!/^\d{6}$/.test(cycleCode)) {
    throw new Error(`Invalid cycle code: ${cycleCode}`)
  }

  const year = Number(cycleCode.slice(0, 4))
  const monthIndex = Number(cycleCode.slice(4, 6)) - 1

  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid cycle month: ${cycleCode}`)
  }

  return { year, monthIndex }
}

function boundaryDate(year: number, monthIndex: number, incomeDay: number): Date {
  const clampedDay = Math.min(Math.max(incomeDay, 1), getDaysInMonth(year, monthIndex))
  return new Date(year, monthIndex, clampedDay, 0, 0, 0, 0)
}

export function getCycleWindow(cycleCode: string, incomeDay: number): CycleWindow {
  const { year, monthIndex } = parseCycleCode(cycleCode)
  const startMonth = monthIndex - 1
  const startYear = startMonth < 0 ? year - 1 : year
  const normalizedStartMonth = (startMonth + 12) % 12
  const startDate = boundaryDate(startYear, normalizedStartMonth, incomeDay)
  const endDate = boundaryDate(year, monthIndex, incomeDay)
  const inclusiveEndDate = new Date(endDate.getTime() - 1)

  return {
    start: startDate.getTime(),
    end: endDate.getTime(),
    label: `${formatShortDate(startDate.getTime())} - ${formatShortDate(inclusiveEndDate.getTime())}`,
  }
}

export function isInCycleWindow(timestamp: number, window: CycleWindow): boolean {
  return timestamp >= window.start && timestamp < window.end
}

export function getRemainingCycleDays(window: CycleWindow, now = Date.now()): number {
  const today = startOfLocalDay(new Date(now))
  const cycleEndDay = startOfLocalDay(new Date(window.end - 1))
  const diffDays = Math.round((cycleEndDay - today) / 86_400_000)

  return Math.max(1, diffDays + 1)
}

/** Shift a `YYYYMM` or `YYYY-MM` cycle code by `deltaMonths`, preserving the original separator. */
export function shiftCycleCode(cycleCode: string, deltaMonths: number): string {
  const compact = cycleCode.replace('-', '')
  const year = Number(compact.slice(0, 4))
  const month = Number(compact.slice(4, 6))
  const total = year * 12 + (month - 1) + deltaMonths
  const nextYear = Math.floor(total / 12)
  const nextMonth = (total % 12) + 1
  const separator = cycleCode.includes('-') ? '-' : ''
  return `${nextYear}${separator}${String(nextMonth).padStart(2, '0')}`
}

export function getPreviousCycleCode(cycleCode: string): string {
  return shiftCycleCode(cycleCode, -1)
}

export function getNextCycleCode(cycleCode: string): string {
  return shiftCycleCode(cycleCode, 1)
}
