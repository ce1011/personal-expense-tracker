import type { CycleWindow } from '@/lib/budgetCycle'
import type { ExpenseTransaction } from '@/types/app-data'

export interface RecurringExpense {
  transaction_id: string
  name: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  recurring_day: number
}

export interface UpcomingBill {
  transaction_id: string
  name: string
  amount: number
  dueTimestamp: number
  daysUntilDue: number
}

export function getRecurringExpenses(expenses: ExpenseTransaction[]): RecurringExpense[] {
  return expenses
    .filter(
      (expense) =>
        expense.recurring === true &&
        expense.recurring_frequency &&
        expense.recurring_day !== undefined,
    )
    .map((expense) => ({
      transaction_id: expense.transaction_id,
      name: expense.name,
      amount: expense.amount,
      frequency: expense.recurring_frequency!,
      recurring_day: expense.recurring_day!,
    }))
}

export function getCycleFixedExpensesTotal(
  expenses: ExpenseTransaction[],
  cycleWindow: CycleWindow,
): number {
  const recurring = getRecurringExpenses(expenses)

  return recurring.reduce((sum, expense) => {
    if (expense.frequency === 'monthly') {
      return sum + expense.amount
    }

    if (expense.frequency === 'yearly') {
      const start = new Date(cycleWindow.start)
      const due = new Date(start.getFullYear(), start.getMonth(), expense.recurring_day)
      if (due.getTime() >= cycleWindow.start && due.getTime() < cycleWindow.end) {
        return sum + expense.amount
      }
    }

    if (expense.frequency === 'weekly') {
      return (
        sum +
        expense.amount *
          countWeekdayOccurrences(expense.recurring_day, cycleWindow.start, cycleWindow.end)
      )
    }

    return sum
  }, 0)
}

function countWeekdayOccurrences(weekday: number, start: number, end: number): number {
  let count = 0
  const current = new Date(start)

  while (current.getTime() < end) {
    if (current.getDay() === weekday) {
      count++
    }

    current.setDate(current.getDate() + 1)
  }

  return count
}

export function getUpcomingBills(
  expenses: ExpenseTransaction[],
  now: number,
  lookAheadDays: number,
): UpcomingBill[] {
  const recurring = getRecurringExpenses(expenses)
  const nowDate = new Date(now)
  const bills: UpcomingBill[] = []

  for (const expense of recurring) {
    let due = new Date(nowDate.getFullYear(), nowDate.getMonth(), expense.recurring_day)

    if (expense.frequency === 'weekly') {
      const currentDay = nowDate.getDay()
      const diff = expense.recurring_day - currentDay
      due = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + diff)
    }

    if (due.getTime() < now) {
      if (expense.frequency === 'weekly') {
        due = new Date(due.getFullYear(), due.getMonth(), due.getDate() + 7)
      } else if (expense.frequency === 'monthly') {
        due = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, expense.recurring_day)
      } else if (expense.frequency === 'yearly') {
        due = new Date(nowDate.getFullYear() + 1, nowDate.getMonth(), expense.recurring_day)
      }
    }

    const daysUntilDue = Math.round((due.getTime() - startOfDay(now)) / 86_400_000)

    if (daysUntilDue >= 0 && daysUntilDue <= lookAheadDays) {
      bills.push({
        transaction_id: expense.transaction_id,
        name: expense.name,
        amount: expense.amount,
        dueTimestamp: due.getTime(),
        daysUntilDue,
      })
    }
  }

  return bills.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const weeklyDayLabels = ['日', '一', '二', '三', '四', '五', '六']

export function getFrequencyLabel(frequency: 'weekly' | 'monthly' | 'yearly'): string {
  switch (frequency) {
    case 'weekly':
      return '每週'
    case 'monthly':
      return '每月'
    case 'yearly':
      return '每年'
  }
}

export function getRecurringDayLabel(
  frequency: 'weekly' | 'monthly' | 'yearly',
  day: number,
): string {
  if (frequency === 'weekly') {
    return `每週${weeklyDayLabels[day] ?? day}`
  }

  return `每${frequency === 'yearly' ? '年' : '月'} ${day} 日`
}
