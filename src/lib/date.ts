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
