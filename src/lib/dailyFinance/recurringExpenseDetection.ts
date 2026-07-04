import type { ExpenseTransaction } from '@/types/app-data'

export interface DetectedRecurringExpense {
  name: string
  averageAmount: number
  confidence: number
  frequency: 'monthly'
  recurringDay: number
  nextDueTimestamp: number
  sampleCount: number
}

export interface DetectedRecurringExpensesInput {
  now?: number | Date
  minSamples?: number
  amountVarianceRatio?: number
  cadenceToleranceDays?: number
}

export function getDetectedRecurringExpenses(
  expenses: ExpenseTransaction[],
  input: DetectedRecurringExpensesInput = {},
): DetectedRecurringExpense[] {
  const nowTimestamp = input.now instanceof Date ? input.now.getTime() : (input.now ?? Date.now())
  const minSamples = input.minSamples ?? 3
  const amountVarianceRatio = input.amountVarianceRatio ?? 0.08
  const cadenceToleranceDays = input.cadenceToleranceDays ?? 3
  const grouped = new Map<string, ExpenseTransaction[]>()

  for (const expense of expenses) {
    const existing = grouped.get(expense.name)

    if (existing) {
      existing.push(expense)
      continue
    }

    grouped.set(expense.name, [expense])
  }

  const detected: DetectedRecurringExpense[] = []

  for (const [name, transactions] of grouped.entries()) {
    const sorted = [...transactions].sort((left, right) => left.date - right.date)

    if (sorted.length < minSamples) {
      continue
    }

    const recurringDay = new Date(sorted[0]?.date ?? nowTimestamp).getDate()
    const averageAmount = roundToWhole(
      sorted.reduce((sum, transaction) => sum + transaction.amount, 0) / sorted.length,
    )
    const maxVarianceRatio = Math.max(
      ...sorted.map((transaction) => Math.abs(transaction.amount - averageAmount) / averageAmount),
    )

    if (maxVarianceRatio > amountVarianceRatio) {
      continue
    }

    const matchesCadence = sorted.every((transaction, index) => {
      if (index === 0) {
        return true
      }

      const previous = sorted[index - 1]
      const previousDate = new Date(previous?.date ?? nowTimestamp)
      const currentDate = new Date(transaction.date)
      const monthDiff =
        (currentDate.getFullYear() - previousDate.getFullYear()) * 12 +
        (currentDate.getMonth() - previousDate.getMonth())
      const dayDiff = Math.abs(currentDate.getDate() - previousDate.getDate())

      return monthDiff === 1 && dayDiff <= cadenceToleranceDays
    })

    if (!matchesCadence) {
      continue
    }

    const lastDate = new Date(sorted[sorted.length - 1]?.date ?? nowTimestamp)
    const nextDueTimestamp = new Date(
      lastDate.getFullYear(),
      lastDate.getMonth() + 1,
      recurringDay,
    ).getTime()

    detected.push({
      name,
      averageAmount,
      confidence: 1,
      frequency: 'monthly',
      recurringDay,
      nextDueTimestamp,
      sampleCount: sorted.length,
    })
  }

  return detected.sort((left, right) => left.nextDueTimestamp - right.nextDueTimestamp)
}

function roundToWhole(value: number): number {
  return Math.round(value)
}
