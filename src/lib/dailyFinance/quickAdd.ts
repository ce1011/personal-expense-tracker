import type { CombinedTransaction } from '@/types/app-data'

export interface QuickAddSuggestion {
  kind: 'expense' | 'income' | 'saving'
  category_id: string
  name: string
  amount?: number
}

export interface ParsedQuickAdd {
  name: string
  amount: number
  category_id?: string
}

export interface SpareChangeResult {
  roundedAmount: number
  spareChange: number
}

const DAY_MS = 86_400_000

export function getFrequentTransactions(
  transactions: CombinedTransaction[],
  limit: number,
  now = Date.now(),
): QuickAddSuggestion[] {
  const cutoff = now - 90 * DAY_MS
  const groups = new Map<string, { suggestion: QuickAddSuggestion; count: number }>()

  for (const transaction of transactions) {
    if (transaction.date < cutoff) {
      continue
    }

    const key = `${transaction.name}|${transaction.category_id}`
    const existing = groups.get(key)

    if (existing) {
      existing.count++
      continue
    }

    groups.set(key, {
      suggestion: {
        kind: transaction.kind,
        category_id: transaction.category_id,
        name: transaction.name,
      },
      count: 1,
    })
  }

  return [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.suggestion)
}

export function parseQuickAddText(
  text: string,
  categories: readonly { category_id: string; name_en: string; name_tc: string }[],
): ParsedQuickAdd | null {
  const normalized = text.trim()

  if (normalized === '') {
    return null
  }

  const match = normalized.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*$/)

  if (!match) {
    return null
  }

  const name = match[1]!.trim()
  const amount = Number(match[2])
  const category = categories.find(
    (entry) => entry.name_en.toLowerCase() === name.toLowerCase() || entry.name_tc === name,
  )

  return {
    name,
    amount,
    category_id: category?.category_id,
  }
}

export function calculateSpareChange(amount: number): SpareChangeResult {
  const roundedAmount = Math.ceil(amount / 10) * 10

  return {
    roundedAmount,
    spareChange: Number((roundedAmount - amount).toFixed(2)),
  }
}
