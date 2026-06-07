import { describe, expect, test } from 'vitest'

import type { CombinedTransaction, TripSession } from '@/types/app-data'
import {
  filterTransactionsByTrip,
  getTripDayBuckets,
  getTripRemainingBudget,
} from './trips'

const day1 = Date.UTC(2026, 5, 10, 0, 0, 0, 0)
const day2 = Date.UTC(2026, 5, 11, 0, 0, 0, 0)
const day3 = Date.UTC(2026, 5, 12, 0, 0, 0, 0)

const trip: TripSession = {
  trip_id: 'trip-tokyo',
  name: 'Tokyo',
  destination: 'Tokyo, Japan',
  start_date: day1,
  end_date: Date.UTC(2026, 5, 12, 23, 59, 59, 999),
  budget_amount: 1000,
  budget_currency: 'HKD',
  status: 'active',
  notes: 'Food-first itinerary',
  created_at: Date.UTC(2026, 4, 1, 9, 0, 0, 0),
  updated_at: Date.UTC(2026, 4, 2, 9, 0, 0, 0),
}

const tripTransactions: CombinedTransaction[] = [
  {
    id: 'expense-1',
    kind: 'expense',
    category_id: 'food',
    name: 'Ramen',
    amount: 120,
    date: Date.UTC(2026, 5, 10, 15, 30, 0, 0),
    trip_id: 'trip-tokyo',
  },
  {
    id: 'income-1',
    kind: 'income',
    category_id: 'refund',
    name: 'Flight credit',
    amount: 80,
    date: Date.UTC(2026, 5, 12, 9, 0, 0, 0),
    trip_id: 'trip-tokyo',
  },
  {
    id: 'saving-1',
    kind: 'saving',
    category_id: 'saving-cash',
    name: 'Pocket cash',
    amount: 50,
    date: Date.UTC(2026, 5, 12, 11, 0, 0, 0),
    trip_id: 'trip-tokyo',
  },
  {
    id: 'expense-2',
    kind: 'expense',
    category_id: 'food',
    name: 'Local lunch',
    amount: 30,
    date: Date.UTC(2026, 5, 11, 13, 0, 0, 0),
  },
]

describe('filterTransactionsByTrip', () => {
  test('returns only trip-linked transactions for the requested trip', () => {
    const result = filterTransactionsByTrip(tripTransactions, 'trip-tokyo')

    expect(result.map((transaction) => transaction.id)).toEqual([
      'expense-1',
      'income-1',
      'saving-1',
    ])
  })
})

describe('getTripDayBuckets', () => {
  test('includes every day in the trip range, including empty days', () => {
    const result = getTripDayBuckets(trip, filterTransactionsByTrip(tripTransactions, trip.trip_id))

    expect(result).toHaveLength(3)
    expect(result.map((bucket) => bucket.date)).toEqual([day1, day2, day3])
    expect(result.map((bucket) => bucket.transactions.map((transaction) => transaction.id))).toEqual([
      ['expense-1'],
      [],
      ['income-1', 'saving-1'],
    ])
  })

  test('does not place out-of-range transactions into any bucket', () => {
    const result = getTripDayBuckets(trip, [
      ...filterTransactionsByTrip(tripTransactions, trip.trip_id),
      {
        id: 'expense-out-of-range',
        kind: 'expense',
        category_id: 'transport',
        name: 'Airport train',
        amount: 40,
        date: Date.UTC(2026, 5, 13, 8, 0, 0, 0),
        trip_id: 'trip-tokyo',
      },
    ])

    expect(result.map((bucket) => bucket.transactions.map((transaction) => transaction.id))).toEqual([
      ['expense-1'],
      [],
      ['income-1', 'saving-1'],
    ])
  })

  test('keeps transactions at day edges in the correct UTC day bucket', () => {
    const result = getTripDayBuckets(trip, [
      {
        id: 'expense-start-edge',
        kind: 'expense',
        category_id: 'food',
        name: 'Breakfast',
        amount: 20,
        date: Date.UTC(2026, 5, 10, 0, 0, 0, 0),
        trip_id: 'trip-tokyo',
      },
      {
        id: 'expense-end-edge',
        kind: 'expense',
        category_id: 'food',
        name: 'Late snack',
        amount: 25,
        date: Date.UTC(2026, 5, 12, 23, 59, 59, 999),
        trip_id: 'trip-tokyo',
      },
    ])

    expect(result.map((bucket) => bucket.transactions.map((transaction) => transaction.id))).toEqual([
      ['expense-start-edge'],
      [],
      ['expense-end-edge'],
    ])
  })
})

describe('getTripRemainingBudget', () => {
  test('adds trip-linked income to budget and subtracts non-income spend', () => {
    const result = getTripRemainingBudget(
      trip.budget_amount,
      filterTransactionsByTrip(tripTransactions, trip.trip_id),
    )

    expect(result).toBe(910)
  })
})
