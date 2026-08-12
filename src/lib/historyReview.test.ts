import { describe, expect, test } from 'vitest'

import type {
  AccountBalance,
  AssetAccount,
  BudgetCycle,
  CombinedTransaction,
  ExpenseCategory,
  TargetExpenseLimit,
} from '@/types/app-data'
import {
  buildCashflow,
  buildFixedVariable,
  buildHistoryReview,
  buildNeedsWants,
  buildOutliers,
  buildPeriodComparison,
  buildSeasonalPeaks,
  buildShare,
  buildWrapped,
  resolveCostFlexibility,
  resolveSpendingNature,
} from './historyReview'

const categories: ExpenseCategory[] = [
  category('expense-food', '餐飲', 'b5392a'),
  category('expense-home', '家居', '496b91'),
  category('expense-other', '其他', '6f6a61'),
  category('expense-transport', '交通', '2f6f66'),
]

function category(id: string, name: string, color: string): ExpenseCategory {
  return {
    category_id: id,
    name_en: id,
    name_tc: name,
    color_code: color,
    icon_image_name: 'circle',
    custom: false,
    deleted: false,
  }
}

function expense(
  partial: Partial<CombinedTransaction> & Pick<CombinedTransaction, 'amount' | 'date'>,
): CombinedTransaction {
  return {
    id: partial.id ?? `expense-${partial.date}-${partial.amount}`,
    kind: 'expense',
    category_id: partial.category_id ?? 'expense-food',
    name: partial.name ?? 'Lunch',
    amount: partial.amount,
    date: partial.date,
    trip_id: partial.trip_id,
    recurring: partial.recurring,
    spending_nature: partial.spending_nature,
    payment_method: partial.payment_method,
    merchant: partial.merchant,
    tags: partial.tags,
    subcategory: partial.subcategory,
  }
}

function income(amount: number, date: number): CombinedTransaction {
  return {
    id: `income-${date}`,
    kind: 'income',
    category_id: 'income-salary',
    name: '薪金',
    amount,
    date,
  }
}

function saving(amount: number, date: number): CombinedTransaction {
  return {
    id: `saving-${date}`,
    kind: 'saving',
    category_id: 'saving-cash',
    name: '存款',
    amount,
    date,
  }
}

describe('resolveSpendingNature', () => {
  test('uses explicit tags first, then category defaults', () => {
    expect(resolveSpendingNature({ category_id: 'expense-other', spending_nature: 'need' })).toBe(
      'need',
    )
    expect(resolveSpendingNature({ category_id: 'expense-food' })).toBe('need')
    expect(resolveSpendingNature({ category_id: 'expense-other' })).toBe('want')
    expect(resolveSpendingNature({ category_id: 'expense-investing' })).toBe('unclassified')
  })
})

describe('resolveCostFlexibility', () => {
  test('treats recurring and rent-like names as fixed', () => {
    expect(resolveCostFlexibility({ name: 'Netflix', recurring: true })).toBe('fixed')
    expect(resolveCostFlexibility({ name: '房租' })).toBe('fixed')
    expect(resolveCostFlexibility({ name: '午餐' })).toBe('variable')
  })
})

describe('buildShare', () => {
  test('groups by category, merchant, payment and tags', () => {
    const now = new Date(2026, 7, 12).getTime()
    const expenses = [
      expense({
        amount: 300,
        date: now,
        category_id: 'expense-food',
        merchant: 'Deliveroo',
        payment_method: 'credit_card',
        tags: ['外送'],
        subcategory: '午餐',
      }),
      expense({
        amount: 100,
        date: now,
        category_id: 'expense-food',
        merchant: 'Cafe',
        payment_method: 'octopus',
        tags: ['聚餐'],
      }),
      expense({
        amount: 200,
        date: now,
        category_id: 'expense-transport',
        name: 'MTR',
        payment_method: 'octopus',
      }),
    ]

    const byCategory = buildShare(expenses, categories, 'category')
    expect(byCategory[0]?.label).toBe('餐飲')
    expect(byCategory[0]?.percentage).toBeCloseTo(400 / 6, 5)

    const byMerchant = buildShare(expenses, categories, 'merchant')
    expect(byMerchant.map((slice) => slice.label)).toEqual(['Deliveroo', 'MTR', 'Cafe'])

    const byPayment = buildShare(expenses, categories, 'payment')
    expect(byPayment.find((slice) => slice.key === 'octopus')?.amount).toBe(300)

    const byTag = buildShare(expenses, categories, 'tag')
    expect(byTag.find((slice) => slice.key === '外送')?.amount).toBe(300)
  })
})

describe('buildNeedsWants', () => {
  test('scores 50/30/20 against income', () => {
    const now = new Date(2026, 7, 1).getTime()
    const split = buildNeedsWants(
      [
        expense({ amount: 4000, date: now, category_id: 'expense-home', name: '房租' }),
        expense({ amount: 2000, date: now, category_id: 'expense-other', name: '電影' }),
      ],
      [saving(3000, now)],
      10000,
    )

    expect(split.needsShareOfIncome).toBeCloseTo(0.4)
    expect(split.wantsShareOfIncome).toBeCloseTo(0.2)
    expect(split.savingsShareOfIncome).toBeCloseTo(0.3)
    expect(split.rule50).toBe(true)
    expect(split.rule30).toBe(true)
    expect(split.rule20).toBe(true)
  })
})

describe('buildFixedVariable', () => {
  test('splits recurring rent from daily spend', () => {
    const now = new Date(2026, 7, 1).getTime()
    const split = buildFixedVariable(
      [
        expense({ amount: 12000, date: now, name: '房租', recurring: true, category_id: 'expense-home' }),
        expense({ amount: 80, date: now, name: '咖啡' }),
      ],
      categories,
    )

    expect(split.fixedAmount).toBe(12000)
    expect(split.variableAmount).toBe(80)
    expect(split.adjustableItems[0]?.label).toBe('咖啡')
  })
})

describe('buildPeriodComparison', () => {
  test('flags the category with the largest MoM swing', () => {
    const current = new Date(2026, 7, 10).getTime()
    const previous = new Date(2026, 6, 10).getTime()
    const comparison = buildPeriodComparison(
      [
        expense({ amount: 800, date: current, category_id: 'expense-food' }),
        expense({ amount: 100, date: previous, category_id: 'expense-food' }),
        expense({ amount: 50, date: current, category_id: 'expense-transport' }),
        expense({ amount: 50, date: previous, category_id: 'expense-transport' }),
      ],
      categories,
      { start: new Date(2026, 7, 1).getTime(), end: new Date(2026, 8, 1).getTime(), label: '8月' },
      { start: new Date(2026, 6, 1).getTime(), end: new Date(2026, 7, 1).getTime(), label: '7月' },
    )

    expect(comparison.movers[0]?.name).toBe('餐飲')
    expect(comparison.movers[0]?.delta).toBe(700)
    expect(comparison.delta).toBe(700)
  })
})

describe('buildCashflow', () => {
  test('nets income against expenses and savings by month', () => {
    const points = buildCashflow(
      [expense({ amount: 3000, date: new Date(2026, 6, 8).getTime() })],
      [income(10000, new Date(2026, 6, 1).getTime())],
      [saving(2000, new Date(2026, 6, 20).getTime())],
      new Date(2026, 6, 1).getTime(),
      new Date(2026, 6, 31).getTime(),
    )

    expect(points).toHaveLength(1)
    expect(points[0]?.net).toBe(5000)
  })
})

describe('buildSeasonalPeaks', () => {
  test('marks months that sit well above the yearly average', () => {
    const expenses = [
      expense({ amount: 1000, date: new Date(2025, 2, 1).getTime() }),
      expense({ amount: 1000, date: new Date(2025, 3, 1).getTime() }),
      expense({ amount: 4000, date: new Date(2025, 11, 20).getTime() }),
      expense({ amount: 1000, date: new Date(2026, 2, 1).getTime() }),
      expense({ amount: 1000, date: new Date(2026, 3, 1).getTime() }),
      expense({ amount: 5000, date: new Date(2026, 11, 18).getTime() }),
    ]

    const peaks = buildSeasonalPeaks(expenses)
    expect(peaks[0]?.monthIndex).toBe(11)
    expect(peaks[0]?.seasonLabel).toBe('年終／聖誕')
  })
})

describe('buildOutliers', () => {
  test('isolates a one-off appliance purchase from daily spend', () => {
    const now = new Date(2026, 7, 1).getTime()
    const expenses = [
      ...Array.from({ length: 8 }, (_, index) =>
        expense({ id: `daily-${index}`, amount: 80, date: now + index * 86_400_000, name: '午餐' }),
      ),
      expense({ id: 'appliance', amount: 8000, date: now + 9 * 86_400_000, name: '雪櫃' }),
    ]

    const outliers = buildOutliers(expenses, categories)
    expect(outliers[0]?.name).toBe('雪櫃')
    expect(outliers[0]?.id).toBe('appliance')
  })
})

describe('buildWrapped', () => {
  test('summarises the largest spend and favourite merchant', () => {
    const now = new Date(2026, 7, 12)
    const report = buildWrapped(
      'month',
      [
        expense({ amount: 90, date: now.getTime(), merchant: '星巴克', name: '咖啡' }),
        expense({ amount: 90, date: now.getTime() - 86_400_000, merchant: '星巴克', name: '咖啡' }),
        expense({ amount: 1200, date: now.getTime(), name: '耳機' }),
      ],
      [income(20000, now.getTime())],
      [saving(4000, now.getTime())],
      categories,
      now,
    )

    expect(report.largestExpense?.name).toBe('耳機')
    expect(report.topMerchant?.name).toBe('星巴克')
    expect(report.topMerchant?.count).toBe(2)
    expect(report.savingsRate).toBeCloseTo(0.2)
  })
})

describe('buildHistoryReview', () => {
  test('assembles health, trends, net worth proxy and insights', () => {
    const now = new Date(2026, 7, 12)
    const cycles: BudgetCycle[] = [
      { cycle_id: 'cycle-202608', cycle_code: '202608', income_day: 1, income: 20000, saving_target: 4000 },
      { cycle_id: 'cycle-202607', cycle_code: '202607', income_day: 1, income: 20000, saving_target: 4000 },
    ]
    const targets: TargetExpenseLimit[] = [
      { target_expense_id: 't1', cycle_id: 'cycle-202608', category_id: 'expense-food', amount: 2000 },
      { target_expense_id: 't2', cycle_id: 'cycle-202607', category_id: 'expense-food', amount: 2000 },
    ]

    const report = buildHistoryReview({
      now,
      range: '6m',
      categories,
      cycles,
      targets,
      expenses: [
        expense({
          amount: 2500,
          date: new Date(2026, 6, 4).getTime(),
          category_id: 'expense-food',
          name: 'Foodpanda 晚餐',
          tags: ['外送'],
        }),
        expense({
          amount: 2500,
          date: new Date(2026, 5, 4).getTime(),
          category_id: 'expense-food',
          name: 'Foodpanda 晚餐',
          tags: ['外送'],
        }),
        expense({
          amount: 12000,
          date: new Date(2026, 7, 1).getTime(),
          category_id: 'expense-home',
          name: '房租',
          recurring: true,
        }),
      ],
      incomes: [
        income(20000, new Date(2026, 7, 1).getTime()),
        income(20000, new Date(2026, 6, 1).getTime()),
      ],
      savings: [
        saving(2000, new Date(2026, 7, 5).getTime()),
        saving(2000, new Date(2026, 6, 5).getTime()),
      ],
    })

    expect(report.rangeLabel).toBe('近 6 個月')
    expect(report.breakdowns.category[0]?.label).toBe('家居')
    expect(report.fixedVariable.fixedAmount).toBe(12000)
    expect(report.netWorthIsProxy).toBe(true)
    expect(report.chronicOverspend[0]?.name).toBe('餐飲')
    expect(report.insights.length).toBeGreaterThan(0)
    expect(report.wrappedMonth.periodKind).toBe('month')
  })

  test('uses recorded account balances for net worth instead of savings proxy', () => {
    const now = new Date(2026, 7, 12)
    const accounts: AssetAccount[] = [
      { account_id: 'cash-1', name: '支票', kind: 'cash', created_at: 1, updated_at: 1 },
      { account_id: 'inv-1', name: '指數', kind: 'investment', created_at: 1, updated_at: 1 },
      { account_id: 'debt-1', name: '卡數', kind: 'liability', created_at: 1, updated_at: 1 },
    ]
    const balances: AccountBalance[] = [
      { balance_id: 'b1', account_id: 'cash-1', amount: 40000, date: new Date(2026, 6, 1).getTime() },
      { balance_id: 'b2', account_id: 'inv-1', amount: 60000, date: new Date(2026, 6, 1).getTime() },
      { balance_id: 'b3', account_id: 'debt-1', amount: 10000, date: new Date(2026, 6, 1).getTime() },
    ]

    const report = buildHistoryReview({
      now,
      categories,
      cycles: [],
      targets: [],
      expenses: [],
      incomes: [],
      savings: [],
      accounts,
      balances,
    })

    expect(report.netWorthIsProxy).toBe(false)
    const latest = report.netWorth.at(-1)
    expect(latest?.netWorth).toBe(90000)
    expect(latest?.assets).toBe(100000)
    expect(latest?.liabilities).toBe(10000)
  })
})
