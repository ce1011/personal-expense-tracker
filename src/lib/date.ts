export function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function toDateInputValue(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateInputValue(value: string): number {
  const parts = value.split('-').map(Number)
  const year = parts[0] ?? new Date().getFullYear()
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  return new Date(year, month - 1, day).getTime()
}

export function getCurrentCycleCode(date = new Date()): string {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function getDaysUntilNextIncomeDay(incomeDay: number, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const currentMonthIncomeDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    Math.min(Math.max(incomeDay, 1), getDaysInMonth(now.getFullYear(), now.getMonth())),
  )

  let nextIncomeDate = currentMonthIncomeDate

  if (today.getTime() > currentMonthIncomeDate.getTime()) {
    const nextMonthIndex = now.getMonth() + 1
    const nextMonthDate = new Date(now.getFullYear(), nextMonthIndex, 1)
    nextIncomeDate = new Date(
      nextMonthDate.getFullYear(),
      nextMonthDate.getMonth(),
      Math.min(
        Math.max(incomeDay, 1),
        getDaysInMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth()),
      ),
    )
  }

  const diffDays = Math.round((nextIncomeDate.getTime() - today.getTime()) / 86_400_000)
  return Math.max(1, diffDays)
}
