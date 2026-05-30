export function formatCurrency(amount: number, currency = 'HKD'): string {
  return new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-HK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-HK', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function withHash(colorCode: string): string {
  return colorCode.startsWith('#') ? colorCode : `#${colorCode}`
}
