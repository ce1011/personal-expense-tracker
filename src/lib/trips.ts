import type { CombinedTransaction, TripSession } from '@/types/app-data'

export interface TripDayBucket<TTransaction> {
  date: number
  transactions: TTransaction[]
}

export function filterTransactionsByTrip<
  TTransaction extends {
    trip_id?: string
  },
>(transactions: readonly TTransaction[], tripId: string): TTransaction[] {
  return transactions.filter((transaction) => transaction.trip_id === tripId)
}

export function getTripDayBuckets<TTransaction extends { date: number }>(
  trip: Pick<TripSession, 'start_date' | 'end_date'>,
  transactions: readonly TTransaction[],
): TripDayBucket<TTransaction>[] {
  const startDay = toUtcDayStart(trip.start_date)
  const endDay = toUtcDayStart(trip.end_date)
  const buckets = new Map<number, TTransaction[]>()

  for (const transaction of transactions) {
    const day = toUtcDayStart(transaction.date)

    if (day < startDay || day > endDay) {
      continue
    }

    const existing = buckets.get(day)

    if (existing) {
      existing.push(transaction)
      continue
    }

    buckets.set(day, [transaction])
  }

  const days: TripDayBucket<TTransaction>[] = []
  for (let day = startDay; day <= endDay; day += DAY_IN_MS) {
    days.push({
      date: day,
      transactions: buckets.get(day) ?? [],
    })
  }

  return days
}

export function getTripRemainingBudget(
  budget: number,
  transactions: readonly Pick<CombinedTransaction, 'kind' | 'amount'>[],
): number {
  return transactions.reduce((remaining, transaction) => {
    if (transaction.kind === 'income') {
      return remaining + transaction.amount
    }

    return remaining - transaction.amount
  }, budget)
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

function toUtcDayStart(timestamp: number): number {
  const date = new Date(timestamp)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}
