import { startOfLocalDay } from '@/lib/date'
import type { CycleWindow } from '@/lib/budgetCycle'

export interface OverspendForecastInput {
  cycleWindow: CycleWindow
  remainingBudget: number
  cycleExpenseTotal: number
  fixedExpensesTotal: number
  now?: number | Date
}

export interface OverspendForecast {
  spentSoFar: number
  elapsedDays: number
  remainingDays: number
  averageDailySpend: number
  projectedVariableSpend: number
  projectedFixedSpend: number
  projectedTotalSpend: number
  projectedRemainingBudget: number
  projectedOverspendAmount: number
  projectedSurplusAmount: number
  isProjectedToOverspend: boolean
  paceRatio: number
}

const DAY_IN_MS = 86_400_000

export function getOverspendForecast(input: OverspendForecastInput): OverspendForecast {
  const nowTimestamp = input.now instanceof Date ? input.now.getTime() : (input.now ?? Date.now())
  const cycleStart = startOfLocalDay(new Date(input.cycleWindow.start))
  const cycleEndExclusive = startOfLocalDay(new Date(input.cycleWindow.end))
  const totalDays = Math.max(1, Math.round((cycleEndExclusive - cycleStart) / DAY_IN_MS))
  const today = startOfLocalDay(new Date(nowTimestamp))
  const clampedToday = Math.min(Math.max(today, cycleStart), cycleEndExclusive)
  const elapsedDays = Math.max(
    1,
    Math.min(totalDays, Math.floor((clampedToday - cycleStart) / DAY_IN_MS) + 1),
  )
  const remainingDays = Math.max(0, totalDays - elapsedDays)
  const averageDailySpend = input.cycleExpenseTotal / elapsedDays
  const projectedVariableSpend = averageDailySpend * remainingDays
  const projectedFixedSpend = input.fixedExpensesTotal
  const projectedTotalSpend = input.cycleExpenseTotal + projectedVariableSpend + projectedFixedSpend
  const projectedRemainingBudget =
    input.remainingBudget - projectedVariableSpend - projectedFixedSpend
  const projectedOverspendAmount = Math.max(-projectedRemainingBudget, 0)
  const projectedSurplusAmount = Math.max(projectedRemainingBudget, 0)
  const currentPlannedTotal = input.cycleExpenseTotal + input.remainingBudget
  const paceRatio =
    currentPlannedTotal > 0 ? Number((projectedTotalSpend / currentPlannedTotal).toFixed(1)) : 0

  return {
    spentSoFar: input.cycleExpenseTotal,
    elapsedDays,
    remainingDays,
    averageDailySpend,
    projectedVariableSpend,
    projectedFixedSpend,
    projectedTotalSpend,
    projectedRemainingBudget,
    projectedOverspendAmount,
    projectedSurplusAmount,
    isProjectedToOverspend: projectedRemainingBudget < 0,
    paceRatio,
  }
}
