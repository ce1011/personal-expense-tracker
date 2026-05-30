export interface CycleWindow {
  start: number
  end: number
  label: string
}

import { formatShortDate } from './formatters'
import { getDaysInMonth } from './date'

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
