import { getCycleWindow, isInCycleWindow } from '@/lib/budgetCycle'
import type {
  AccountBalance,
  AccountKind,
  AssetAccount,
  BudgetCycle,
  CombinedTransaction,
  ExpenseCategory,
  SpendingNature,
  TargetExpenseLimit,
} from '@/types/app-data'

export type HistoryRangePreset = '6m' | '12m' | 'ytd' | 'all'
export type ShareDimension = 'category' | 'subcategory' | 'payment' | 'merchant' | 'tag'
export type CostFlexibility = 'fixed' | 'variable'

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: '現金' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'debit_card', label: '扣帳卡' },
  { value: 'octopus', label: '八達通' },
  { value: 'alipay', label: 'AlipayHK' },
  { value: 'wechat', label: 'WeChat Pay' },
  { value: 'fps', label: 'FPS' },
  { value: 'payme', label: 'PayMe' },
  { value: 'bank_transfer', label: '銀行轉帳' },
  { value: 'other', label: '其他' },
] as const

export const SUGGESTED_TAGS = ['旅遊', '專案', '送禮', '外送', '聚餐'] as const

const NEED_CATEGORY_IDS = new Set([
  'expense-food',
  'expense-transport',
  'expense-home',
  'expense-health',
])

const FIXED_NAME_PATTERN =
  /房租|租金|rent|按揭|mortgage|保險|insurance|訂閱|subscription|netflix|spotify|youtube|icloud|gym|會籍|管理費|寬頻|上網|電費|水費|煤氣|電話費/i

const SEASON_LABELS: Record<number, string> = {
  1: '新年／農曆新年',
  2: '農曆新年',
  4: '稅季',
  5: '稅季',
  7: '暑假旅遊季',
  8: '暑假旅遊季',
  9: '開學季',
  12: '年終／聖誕',
}

const CHART_COLORS = ['#7c3aed', '#14b8a6', '#f59e0b', '#3b82f6', '#fb7185', '#8b5cf6', '#0d9488']

export interface ShareSlice {
  key: string
  label: string
  amount: number
  percentage: number
  color: string
  children?: ShareSlice[]
}

export interface NeedsWantsSplit {
  needsAmount: number
  wantsAmount: number
  unclassifiedAmount: number
  savingsAmount: number
  incomeAmount: number
  needsShareOfIncome: number
  wantsShareOfIncome: number
  savingsShareOfIncome: number
  needsShareOfSpend: number
  wantsShareOfSpend: number
  rule50: boolean
  rule30: boolean
  rule20: boolean
}

export interface CostStream {
  key: string
  label: string
  amount: number
  flexibility: CostFlexibility
  categoryName: string
}

export interface FixedVariableSplit {
  fixedAmount: number
  variableAmount: number
  fixedShare: number
  variableShare: number
  adjustableItems: CostStream[]
}

export interface CategoryDelta {
  category_id: string
  name: string
  currentAmount: number
  previousAmount: number
  delta: number
  deltaPercent: number
}

export interface PeriodComparison {
  currentLabel: string
  previousLabel: string
  currentTotal: number
  previousTotal: number
  delta: number
  deltaPercent: number
  movers: CategoryDelta[]
}

export interface CashflowPoint {
  monthKey: string
  label: string
  income: number
  expense: number
  saving: number
  net: number
}

export interface SeasonalPeak {
  monthIndex: number
  label: string
  seasonLabel: string
  averageAmount: number
  overallAverage: number
  liftPercent: number
}

export interface NetWorthPoint {
  monthKey: string
  label: string
  assets: number
  liabilities: number
  netWorth: number
  cash: number
  investment: number
}

export interface AllocationPoint {
  monthKey: string
  label: string
  cashShare: number
  investmentShare: number
  liabilityShare: number
}

export interface BudgetVarianceRow {
  cycleCode: string
  label: string
  category_id: string
  categoryName: string
  target: number
  spent: number
  variance: number
  attainment: number
  overspent: boolean
}

export interface SavingsHealth {
  averageSavingsRate: number
  latestSavingsRate: number
  averageMonthlyExpense: number
  liquidBuffer: number
  emergencyMonths: number
}

export interface OutlierExpense {
  id: string
  name: string
  categoryName: string
  amount: number
  date: number
  baseline: number
  multiplier: number
}

export interface FinancialInsight {
  id: string
  tone: 'info' | 'warning' | 'success'
  text: string
}

export interface WrappedReport {
  periodKind: 'month' | 'year'
  periodLabel: string
  incomeTotal: number
  expenseTotal: number
  savingTotal: number
  savingsRate: number
  transactionCount: number
  largestExpense: { name: string; amount: number; date: number } | null
  topMerchant: { name: string; count: number; amount: number } | null
  topCategory: { name: string; amount: number } | null
  milestone: string
}

export interface HistoryReviewInput {
  expenses: readonly CombinedTransaction[]
  incomes: readonly CombinedTransaction[]
  savings: readonly CombinedTransaction[]
  categories: readonly ExpenseCategory[]
  cycles: readonly BudgetCycle[]
  targets: readonly TargetExpenseLimit[]
  accounts?: readonly AssetAccount[]
  balances?: readonly AccountBalance[]
  range?: HistoryRangePreset
  now?: number | Date
}

export interface HistoryReviewReport {
  range: HistoryRangePreset
  rangeLabel: string
  rangeStart: number
  rangeEnd: number
  incomeTotal: number
  expenseTotal: number
  savingTotal: number
  netCashflow: number
  healthScore: number
  breakdowns: Record<ShareDimension, ShareSlice[]>
  needsWants: NeedsWantsSplit
  fixedVariable: FixedVariableSplit
  mom: PeriodComparison
  yoy: PeriodComparison
  cashflow: CashflowPoint[]
  seasonalPeaks: SeasonalPeak[]
  netWorth: NetWorthPoint[]
  allocation: AllocationPoint[]
  netWorthIsProxy: boolean
  budgetVariance: BudgetVarianceRow[]
  chronicOverspend: { category_id: string; name: string; months: number }[]
  savingsHealth: SavingsHealth
  outliers: OutlierExpense[]
  insights: FinancialInsight[]
  wrappedMonth: WrappedReport
  wrappedYear: WrappedReport
}

export function paymentMethodLabel(value?: string): string {
  if (!value) {
    return '未指定'
  }

  return PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function resolveSpendingNature(
  expense: Pick<CombinedTransaction, 'category_id' | 'spending_nature'>,
): SpendingNature | 'unclassified' {
  if (expense.spending_nature === 'need' || expense.spending_nature === 'want') {
    return expense.spending_nature
  }

  if (expense.category_id === 'expense-investing') {
    return 'unclassified'
  }

  if (NEED_CATEGORY_IDS.has(expense.category_id)) {
    return 'need'
  }

  if (expense.category_id === 'expense-other') {
    return 'want'
  }

  return 'unclassified'
}

export function resolveCostFlexibility(
  expense: Pick<CombinedTransaction, 'name' | 'recurring'>,
): CostFlexibility {
  if (expense.recurring) {
    return 'fixed'
  }

  return FIXED_NAME_PATTERN.test(expense.name) ? 'fixed' : 'variable'
}

export function resolveRangeWindow(
  range: HistoryRangePreset,
  now: Date,
): { start: number; end: number; label: string } {
  const end = now.getTime()

  if (range === 'all') {
    return { start: 0, end, label: '全部紀錄' }
  }

  if (range === 'ytd') {
    const start = new Date(now.getFullYear(), 0, 1).getTime()
    return { start, end, label: `${now.getFullYear()} 年至今` }
  }

  const months = range === '12m' ? 12 : 6
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).getTime()
  return { start, end, label: range === '12m' ? '近 12 個月' : '近 6 個月' }
}

export function buildHistoryReview(input: HistoryReviewInput): HistoryReviewReport {
  const nowDate = input.now instanceof Date ? input.now : new Date(input.now ?? Date.now())
  const range = input.range ?? '6m'
  const window = resolveRangeWindow(range, nowDate)
  const categories = input.categories
  const expenses = inRange(input.expenses, window.start, window.end)
  const incomes = inRange(input.incomes, window.start, window.end)
  const savings = inRange(input.savings, window.start, window.end)
  const incomeTotal = sum(incomes)
  const expenseTotal = sum(expenses)
  const savingTotal = sum(savings)
  const needsWants = buildNeedsWants(expenses, savings, incomeTotal)
  const fixedVariable = buildFixedVariable(expenses, categories)
  const cashflow = buildCashflow(input.expenses, input.incomes, input.savings, window.start, window.end)
  const savingsHealth = buildSavingsHealth(
    cashflow,
    input.accounts ?? [],
    input.balances ?? [],
    input.savings,
  )
  const budgetVariance = buildBudgetVariance(input.cycles, input.targets, input.expenses, categories)
  const outliers = buildOutliers(expenses, categories)
  const netWorthResult = buildNetWorth(
    input.accounts ?? [],
    input.balances ?? [],
    input.savings,
    window.start,
    window.end,
    nowDate,
  )
  const mom = buildPeriodComparison(input.expenses, categories, monthWindow(nowDate, 0), monthWindow(nowDate, -1))
  const yoy = buildPeriodComparison(input.expenses, categories, monthWindow(nowDate, 0), monthWindow(nowDate, -12))
  const insights = buildInsights({
    expenses,
    categories,
    needsWants,
    fixedVariable,
    mom,
    savingsHealth,
    cashflow,
    now: nowDate,
  })

  return {
    range,
    rangeLabel: window.label,
    rangeStart: window.start,
    rangeEnd: window.end,
    incomeTotal,
    expenseTotal,
    savingTotal,
    netCashflow: incomeTotal - expenseTotal - savingTotal,
    healthScore: scoreHealth(needsWants, savingsHealth, budgetVariance),
    breakdowns: {
      category: buildShare(expenses, categories, 'category'),
      subcategory: buildShare(expenses, categories, 'subcategory'),
      payment: buildShare(expenses, categories, 'payment'),
      merchant: buildShare(expenses, categories, 'merchant'),
      tag: buildShare(expenses, categories, 'tag'),
    },
    needsWants,
    fixedVariable,
    mom,
    yoy,
    cashflow,
    seasonalPeaks: buildSeasonalPeaks(input.expenses),
    netWorth: netWorthResult.points,
    allocation: netWorthResult.allocation,
    netWorthIsProxy: netWorthResult.isProxy,
    budgetVariance,
    chronicOverspend: buildChronicOverspend(budgetVariance),
    savingsHealth,
    outliers,
    insights,
    wrappedMonth: buildWrapped('month', expenses, incomes, savings, categories, nowDate),
    wrappedYear: buildWrapped('year', expenses, incomes, savings, categories, nowDate),
  }
}

function inRange<T extends { date: number }>(items: readonly T[], start: number, end: number): T[] {
  return items.filter((item) => item.date >= start && item.date <= end)
}

function sum(items: readonly { amount: number }[]): number {
  return items.reduce((total, item) => total + item.amount, 0)
}

function categoryName(categories: readonly ExpenseCategory[], categoryId: string): string {
  const category = categories.find((entry) => entry.category_id === categoryId)
  return category?.name_tc || category?.name_en || categoryId
}

function categoryColor(categories: readonly ExpenseCategory[], categoryId: string, index: number): string {
  const category = categories.find((entry) => entry.category_id === categoryId)
  if (category?.color_code) {
    return category.color_code.startsWith('#') ? category.color_code : `#${category.color_code}`
  }

  return CHART_COLORS[index % CHART_COLORS.length] ?? '#7c3aed'
}

function merchantOf(expense: CombinedTransaction): string {
  const merchant = expense.merchant?.trim()
  return merchant || expense.name.trim() || '未命名'
}

export function buildShare(
  expenses: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
  dimension: ShareDimension,
): ShareSlice[] {
  if (expenses.length === 0) {
    return []
  }

  const totals = new Map<string, { label: string; amount: number; color: string; children: Map<string, number> }>()

  for (const expense of expenses) {
    const groups = dimensionKeys(expense, categories, dimension)

    for (const group of groups) {
      const current = totals.get(group.key) ?? {
        label: group.label,
        amount: 0,
        color: group.color,
        children: new Map<string, number>(),
      }
      current.amount += expense.amount
      if (group.childKey) {
        current.children.set(group.childKey, (current.children.get(group.childKey) ?? 0) + expense.amount)
      }
      totals.set(group.key, current)
    }
  }

  const total = dimension === 'tag' ? [...totals.values()].reduce((sumAmount, entry) => sumAmount + entry.amount, 0) : sum(expenses)

  return [...totals.entries()]
    .map(([key, entry], index) => ({
      key,
      label: entry.label,
      amount: entry.amount,
      percentage: total > 0 ? (entry.amount / total) * 100 : 0,
      color: entry.color || CHART_COLORS[index % CHART_COLORS.length] || '#7c3aed',
      children: [...entry.children.entries()]
        .map(([childKey, amount]) => ({
          key: childKey,
          label: childKey,
          amount,
          percentage: entry.amount > 0 ? (amount / entry.amount) * 100 : 0,
          color: entry.color,
        }))
        .sort((left, right) => right.amount - left.amount),
    }))
    .sort((left, right) => right.amount - left.amount)
}

function dimensionKeys(
  expense: CombinedTransaction,
  categories: readonly ExpenseCategory[],
  dimension: ShareDimension,
): Array<{ key: string; label: string; color: string; childKey?: string }> {
  if (dimension === 'category') {
    return [
      {
        key: expense.category_id,
        label: categoryName(categories, expense.category_id),
        color: categoryColor(categories, expense.category_id, 0),
        childKey: expense.subcategory?.trim() || undefined,
      },
    ]
  }

  if (dimension === 'subcategory') {
    const parent = categoryName(categories, expense.category_id)
    const child = expense.subcategory?.trim()
    const label = child ? `${parent}／${child}` : parent
    return [
      {
        key: `${expense.category_id}:${child ?? ''}`,
        label,
        color: categoryColor(categories, expense.category_id, 0),
      },
    ]
  }

  if (dimension === 'payment') {
    const key = expense.payment_method || 'unspecified'
    return [{ key, label: paymentMethodLabel(expense.payment_method), color: '#7c3aed' }]
  }

  if (dimension === 'merchant') {
    const merchant = merchantOf(expense)
    return [{ key: merchant, label: merchant, color: '#14b8a6' }]
  }

  const tags = expense.tags?.map((tag) => tag.trim()).filter(Boolean) ?? []
  if (tags.length === 0) {
    return [{ key: 'untagged', label: '未標籤', color: '#a78bca' }]
  }

  return tags.map((tag) => ({ key: tag, label: tag, color: '#3b82f6' }))
}

export function buildNeedsWants(
  expenses: readonly CombinedTransaction[],
  savings: readonly CombinedTransaction[],
  incomeAmount: number,
): NeedsWantsSplit {
  let needsAmount = 0
  let wantsAmount = 0
  let unclassifiedAmount = 0

  for (const expense of expenses) {
    const nature = resolveSpendingNature(expense)
    if (nature === 'need') {
      needsAmount += expense.amount
    } else if (nature === 'want') {
      wantsAmount += expense.amount
    } else {
      unclassifiedAmount += expense.amount
    }
  }

  const savingsAmount = sum(savings)
  const spendTotal = needsAmount + wantsAmount + unclassifiedAmount
  const needsShareOfIncome = incomeAmount > 0 ? needsAmount / incomeAmount : 0
  const wantsShareOfIncome = incomeAmount > 0 ? wantsAmount / incomeAmount : 0
  const savingsShareOfIncome = incomeAmount > 0 ? savingsAmount / incomeAmount : 0

  return {
    needsAmount,
    wantsAmount,
    unclassifiedAmount,
    savingsAmount,
    incomeAmount,
    needsShareOfIncome,
    wantsShareOfIncome,
    savingsShareOfIncome,
    needsShareOfSpend: spendTotal > 0 ? needsAmount / spendTotal : 0,
    wantsShareOfSpend: spendTotal > 0 ? wantsAmount / spendTotal : 0,
    rule50: incomeAmount > 0 && needsShareOfIncome <= 0.5,
    rule30: incomeAmount > 0 && wantsShareOfIncome <= 0.3,
    rule20: incomeAmount > 0 && savingsShareOfIncome >= 0.2,
  }
}

export function buildFixedVariable(
  expenses: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
): FixedVariableSplit {
  const streams = new Map<string, CostStream>()

  for (const expense of expenses) {
    const flexibility = resolveCostFlexibility(expense)
    const key = `${flexibility}:${expense.name.trim().toLowerCase()}`
    const current = streams.get(key)
    if (current) {
      current.amount += expense.amount
    } else {
      streams.set(key, {
        key,
        label: expense.name,
        amount: expense.amount,
        flexibility,
        categoryName: categoryName(categories, expense.category_id),
      })
    }
  }

  const items = [...streams.values()].sort((left, right) => right.amount - left.amount)
  const fixedAmount = items.filter((item) => item.flexibility === 'fixed').reduce((total, item) => total + item.amount, 0)
  const variableAmount = items
    .filter((item) => item.flexibility === 'variable')
    .reduce((total, item) => total + item.amount, 0)
  const total = fixedAmount + variableAmount

  return {
    fixedAmount,
    variableAmount,
    fixedShare: total > 0 ? fixedAmount / total : 0,
    variableShare: total > 0 ? variableAmount / total : 0,
    adjustableItems: items.filter((item) => item.flexibility === 'variable').slice(0, 6),
  }
}

function monthWindow(now: Date, offsetMonths: number): { start: number; end: number; label: string } {
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  return {
    start: start.getTime(),
    end: end.getTime(),
    label: `${start.getFullYear()} 年 ${start.getMonth() + 1} 月`,
  }
}

export function buildPeriodComparison(
  expenses: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
  current: { start: number; end: number; label: string },
  previous: { start: number; end: number; label: string },
): PeriodComparison {
  const currentItems = expenses.filter((item) => item.date >= current.start && item.date < current.end)
  const previousItems = expenses.filter((item) => item.date >= previous.start && item.date < previous.end)
  const currentTotal = sum(currentItems)
  const previousTotal = sum(previousItems)
  const currentByCategory = totalsByCategory(currentItems)
  const previousByCategory = totalsByCategory(previousItems)
  const keys = new Set([...currentByCategory.keys(), ...previousByCategory.keys()])
  const movers = [...keys]
    .map((categoryId) => {
      const currentAmount = currentByCategory.get(categoryId) ?? 0
      const previousAmount = previousByCategory.get(categoryId) ?? 0
      const delta = currentAmount - previousAmount
      return {
        category_id: categoryId,
        name: categoryName(categories, categoryId),
        currentAmount,
        previousAmount,
        delta,
        deltaPercent: previousAmount > 0 ? (delta / previousAmount) * 100 : currentAmount > 0 ? 100 : 0,
      }
    })
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))

  const delta = currentTotal - previousTotal

  return {
    currentLabel: current.label,
    previousLabel: previous.label,
    currentTotal,
    previousTotal,
    delta,
    deltaPercent: previousTotal > 0 ? (delta / previousTotal) * 100 : currentTotal > 0 ? 100 : 0,
    movers,
  }
}

function totalsByCategory(expenses: readonly CombinedTransaction[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const expense of expenses) {
    totals.set(expense.category_id, (totals.get(expense.category_id) ?? 0) + expense.amount)
  }
  return totals
}

export function buildCashflow(
  expenses: readonly CombinedTransaction[],
  incomes: readonly CombinedTransaction[],
  savings: readonly CombinedTransaction[],
  start: number,
  end: number,
): CashflowPoint[] {
  const months = enumerateMonths(start, end)
  return months.map((month) => {
    const income = sum(inRange(incomes, month.start, month.end - 1))
    const expense = sum(inRange(expenses, month.start, month.end - 1))
    const saving = sum(inRange(savings, month.start, month.end - 1))
    return {
      monthKey: month.key,
      label: month.label,
      income,
      expense,
      saving,
      net: income - expense - saving,
    }
  })
}

function enumerateMonths(start: number, end: number): Array<{ key: string; label: string; start: number; end: number }> {
  const cursor = start > 0 ? new Date(start) : new Date(end)
  if (start > 0) {
    cursor.setDate(1)
  } else {
    cursor.setMonth(cursor.getMonth() - 11, 1)
  }

  const months: Array<{ key: string; label: string; start: number; end: number }> = []
  while (cursor.getTime() <= end) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    months.push({
      key: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      label: `${monthStart.getMonth() + 1}月`,
      start: monthStart.getTime(),
      end: monthEnd.getTime(),
    })
    cursor.setMonth(cursor.getMonth() + 1)
    if (months.length > 36) {
      break
    }
  }

  return months
}

export function buildSeasonalPeaks(expenses: readonly CombinedTransaction[]): SeasonalPeak[] {
  if (expenses.length === 0) {
    return []
  }

  const yearly = new Map<string, number>()

  for (const expense of expenses) {
    const date = new Date(expense.date)
    const monthIndex = date.getMonth()
    const yearKey = `${date.getFullYear()}-${monthIndex}`
    yearly.set(yearKey, (yearly.get(yearKey) ?? 0) + expense.amount)
  }

  const monthlyTotals = new Map<number, number[]>()
  for (const [yearKey, amount] of yearly) {
    const monthIndex = Number(yearKey.split('-')[1])
    const bucket = monthlyTotals.get(monthIndex) ?? []
    bucket.push(amount)
    monthlyTotals.set(monthIndex, bucket)
  }

  const averages = [...monthlyTotals.entries()].map(([monthIndex, amounts]) => ({
    monthIndex,
    averageAmount: amounts.reduce((total, amount) => total + amount, 0) / amounts.length,
  }))
  const overallAverage = averages.reduce((total, entry) => total + entry.averageAmount, 0) / Math.max(1, averages.length)

  return averages
    .filter((entry) => overallAverage > 0 && entry.averageAmount >= overallAverage * 1.2)
    .map((entry) => ({
      monthIndex: entry.monthIndex,
      label: `${entry.monthIndex + 1}月`,
      seasonLabel: SEASON_LABELS[entry.monthIndex + 1] ?? '季節性高峰',
      averageAmount: entry.averageAmount,
      overallAverage,
      liftPercent: ((entry.averageAmount - overallAverage) / overallAverage) * 100,
    }))
    .sort((left, right) => right.liftPercent - left.liftPercent)
}

export function buildNetWorth(
  accounts: readonly AssetAccount[],
  balances: readonly AccountBalance[],
  savings: readonly CombinedTransaction[],
  start: number,
  end: number,
  now: Date,
): { points: NetWorthPoint[]; allocation: AllocationPoint[]; isProxy: boolean } {
  const activeAccounts = accounts.filter((account) => !account.archived)
  const isProxy = activeAccounts.length === 0
  const months = enumerateMonths(start || new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime(), end)

  if (isProxy) {
    let cumulative = 0
    const points: NetWorthPoint[] = months.map((month) => {
      cumulative += sum(inRange(savings, month.start, month.end - 1))
      return {
        monthKey: month.key,
        label: month.label,
        assets: cumulative,
        liabilities: 0,
        netWorth: cumulative,
        cash: cumulative,
        investment: 0,
      }
    })
    return {
      points,
      allocation: points.map((point) => ({
        monthKey: point.monthKey,
        label: point.label,
        cashShare: 1,
        investmentShare: 0,
        liabilityShare: 0,
      })),
      isProxy: true,
    }
  }

  const points = months.map((month) => {
    const byKind: Record<AccountKind, number> = { cash: 0, investment: 0, liability: 0 }
    for (const account of activeAccounts) {
      byKind[account.kind] += latestBalance(account.account_id, balances, month.end - 1)
    }
    const assets = byKind.cash + byKind.investment
    const liabilities = byKind.liability
    return {
      monthKey: month.key,
      label: month.label,
      assets,
      liabilities,
      netWorth: assets - liabilities,
      cash: byKind.cash,
      investment: byKind.investment,
    }
  })

  return {
    points,
    allocation: points.map((point) => {
      const total = point.cash + point.investment + point.liabilities
      return {
        monthKey: point.monthKey,
        label: point.label,
        cashShare: total > 0 ? point.cash / total : 0,
        investmentShare: total > 0 ? point.investment / total : 0,
        liabilityShare: total > 0 ? point.liabilities / total : 0,
      }
    }),
    isProxy: false,
  }
}

function latestBalance(accountId: string, balances: readonly AccountBalance[], asOf: number): number {
  const matching = balances
    .filter((balance) => balance.account_id === accountId && balance.date <= asOf)
    .sort((left, right) => right.date - left.date)
  return matching[0]?.amount ?? 0
}

export function buildBudgetVariance(
  cycles: readonly BudgetCycle[],
  targets: readonly TargetExpenseLimit[],
  expenses: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
): BudgetVarianceRow[] {
  const rows: BudgetVarianceRow[] = []

  for (const cycle of cycles) {
    let window: ReturnType<typeof getCycleWindow>
    try {
      window = getCycleWindow(cycle.cycle_code, cycle.income_day)
    } catch {
      continue
    }

    const cycleExpenses = expenses.filter((expense) => isInCycleWindow(expense.date, window))
    const spentByCategory = totalsByCategory(cycleExpenses)
    const cycleTargets = targets.filter((target) => target.cycle_id === cycle.cycle_id)
    const categoryIds = new Set([...cycleTargets.map((target) => target.category_id), ...spentByCategory.keys()])

    for (const categoryId of categoryIds) {
      const target = cycleTargets.find((entry) => entry.category_id === categoryId)?.amount ?? 0
      const spent = spentByCategory.get(categoryId) ?? 0
      if (target <= 0 && spent <= 0) {
        continue
      }

      rows.push({
        cycleCode: cycle.cycle_code,
        label: window.label,
        category_id: categoryId,
        categoryName: categoryName(categories, categoryId),
        target,
        spent,
        variance: spent - target,
        attainment: target > 0 ? spent / target : spent > 0 ? 2 : 0,
        overspent: target > 0 && spent > target,
      })
    }
  }

  return rows.sort((left, right) => right.variance - left.variance)
}

function buildChronicOverspend(
  rows: readonly BudgetVarianceRow[],
): { category_id: string; name: string; months: number }[] {
  const counts = new Map<string, { name: string; months: number }>()
  for (const row of rows) {
    if (!row.overspent) {
      continue
    }
    const current = counts.get(row.category_id) ?? { name: row.categoryName, months: 0 }
    current.months += 1
    counts.set(row.category_id, current)
  }

  return [...counts.entries()]
    .filter(([, value]) => value.months >= 2)
    .map(([category_id, value]) => ({ category_id, name: value.name, months: value.months }))
    .sort((left, right) => right.months - left.months)
}

export function buildSavingsHealth(
  cashflow: readonly CashflowPoint[],
  accounts: readonly AssetAccount[],
  balances: readonly AccountBalance[],
  savings: readonly CombinedTransaction[],
): SavingsHealth {
  const activeMonths = cashflow.filter((point) => point.income > 0 || point.expense > 0 || point.saving > 0)
  const incomeTotal = activeMonths.reduce((total, point) => total + point.income, 0)
  const savingTotal = activeMonths.reduce((total, point) => total + point.saving, 0)
  const expenseTotal = activeMonths.reduce((total, point) => total + point.expense, 0)
  const latest = [...activeMonths].reverse().find((point) => point.income > 0)
  const averageMonthlyExpense = activeMonths.length > 0 ? expenseTotal / activeMonths.length : 0
  const cashAccounts = accounts.filter((account) => account.kind === 'cash' && !account.archived)
  const liquidFromAccounts = cashAccounts.reduce(
    (total, account) => total + latestBalance(account.account_id, balances, Date.now()),
    0,
  )
  const liquidBuffer = cashAccounts.length > 0 ? liquidFromAccounts : sum(savings)

  return {
    averageSavingsRate: incomeTotal > 0 ? savingTotal / incomeTotal : 0,
    latestSavingsRate: latest && latest.income > 0 ? latest.saving / latest.income : 0,
    averageMonthlyExpense,
    liquidBuffer,
    emergencyMonths: averageMonthlyExpense > 0 ? liquidBuffer / averageMonthlyExpense : 0,
  }
}

export function buildOutliers(
  expenses: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
): OutlierExpense[] {
  if (expenses.length < 4) {
    return []
  }

  const amounts = [...expenses.map((expense) => expense.amount)].sort((left, right) => left - right)
  const q1 = percentile(amounts, 0.25)
  const q3 = percentile(amounts, 0.75)
  const iqr = q3 - q1
  const fence = q3 + 1.5 * Math.max(iqr, 0)
  const median = percentile(amounts, 0.5)
  const threshold = Math.max(fence, median * 3)

  return expenses
    .filter((expense) => expense.amount >= threshold && expense.amount > 0)
    .map((expense) => ({
      id: expense.id,
      name: expense.name,
      categoryName: categoryName(categories, expense.category_id),
      amount: expense.amount,
      date: expense.date,
      baseline: median,
      multiplier: median > 0 ? expense.amount / median : 0,
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 8)
}

function percentile(sorted: readonly number[], ratio: number): number {
  if (sorted.length === 0) {
    return 0
  }

  const index = (sorted.length - 1) * ratio
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const lowerValue = sorted[lower] ?? 0
  const upperValue = sorted[upper] ?? lowerValue
  if (lower === upper) {
    return lowerValue
  }

  return lowerValue + (upperValue - lowerValue) * (index - lower)
}

function scoreHealth(
  needsWants: NeedsWantsSplit,
  savingsHealth: SavingsHealth,
  variance: readonly BudgetVarianceRow[],
): number {
  let score = 40
  if (needsWants.rule50) score += 15
  else score -= Math.min(15, Math.round((needsWants.needsShareOfIncome - 0.5) * 40))
  if (needsWants.rule30) score += 10
  else score -= Math.min(10, Math.round((needsWants.wantsShareOfIncome - 0.3) * 30))
  if (needsWants.rule20) score += 20
  else score += Math.round(Math.min(0.2, needsWants.savingsShareOfIncome) * 80)
  if (savingsHealth.emergencyMonths >= 3) score += 10
  else if (savingsHealth.emergencyMonths >= 1) score += 5
  const overspendRatio =
    variance.length > 0 ? variance.filter((row) => row.overspent).length / variance.length : 0
  score -= Math.round(overspendRatio * 15)
  return Math.max(0, Math.min(100, score))
}

function buildInsights(input: {
  expenses: readonly CombinedTransaction[]
  categories: readonly ExpenseCategory[]
  needsWants: NeedsWantsSplit
  fixedVariable: FixedVariableSplit
  mom: PeriodComparison
  savingsHealth: SavingsHealth
  cashflow: readonly CashflowPoint[]
  now: Date
}): FinancialInsight[] {
  const insights: FinancialInsight[] = []
  const food = input.expenses.filter((expense) => expense.category_id === 'expense-food')
  const delivery = food.filter((expense) => /外送|deliveroo|foodpanda|uber|keeta/i.test(`${expense.name} ${(expense.tags ?? []).join(' ')}`))
  const foodTotal = sum(food)
  const deliveryTotal = sum(delivery)

  if (foodTotal > 0 && deliveryTotal > 0) {
    const share = deliveryTotal / foodTotal
    insights.push({
      id: 'delivery-share',
      tone: share >= 0.25 ? 'warning' : 'info',
      text: `你在這段期間「外送／平台」花費佔餐飲的 ${Math.round(share * 100)}%，共 ${Math.round(deliveryTotal)}。`,
    })
  }

  const topMover = input.mom.movers[0]
  if (topMover && Math.abs(topMover.delta) > 0) {
    const direction = topMover.delta > 0 ? '上升' : '下降'
    insights.push({
      id: 'top-mover',
      tone: topMover.delta > 0 ? 'warning' : 'success',
      text: `${input.mom.currentLabel}「${topMover.name}」較 ${input.mom.previousLabel} ${direction} ${Math.abs(Math.round(topMover.deltaPercent))}%，差額 ${Math.round(Math.abs(topMover.delta))}。`,
    })
  }

  if (input.needsWants.incomeAmount > 0) {
    const parts = [
      input.needsWants.rule50 ? '必要支出符合 50%' : `必要支出佔收入 ${Math.round(input.needsWants.needsShareOfIncome * 100)}%，高於 50% 原則`,
      input.needsWants.rule30 ? '想要消費符合 30%' : `想要消費佔收入 ${Math.round(input.needsWants.wantsShareOfIncome * 100)}%`,
      input.needsWants.rule20 ? '儲蓄達到 20%' : `儲蓄率 ${Math.round(input.needsWants.savingsShareOfIncome * 100)}%，低於 20% 目標`,
    ]
    insights.push({
      id: '502030',
      tone: input.needsWants.rule50 && input.needsWants.rule30 && input.needsWants.rule20 ? 'success' : 'warning',
      text: `50/30/20 檢視：${parts.join('；')}。`,
    })
  }

  if (input.fixedVariable.variableShare > 0) {
    insights.push({
      id: 'flexibility',
      tone: 'info',
      text: `變動支出佔 ${Math.round(input.fixedVariable.variableShare * 100)}%，是最有調整彈性的一塊；固定支出則為 ${Math.round(input.fixedVariable.fixedShare * 100)}%。`,
    })
  }

  if (input.savingsHealth.emergencyMonths > 0) {
    const months = input.savingsHealth.emergencyMonths
    insights.push({
      id: 'emergency',
      tone: months >= 3 ? 'success' : 'warning',
      text:
        months >= 3
          ? `以歷史平均支出估算，目前流動資金可支撐約 ${months.toFixed(1)} 個月，緊急預備金已達建議水位。`
          : `目前流動資金約可支撐 ${months.toFixed(1)} 個月支出，建議逐步拉到 3 個月以上。`,
    })
  }

  const recent = input.cashflow.slice(-3)
  if (recent.length === 3 && recent.every((point) => point.net < 0)) {
    insights.push({
      id: 'cashflow-streak',
      tone: 'warning',
      text: '最近三個月淨現金流都是負數，收入被支出與儲蓄吃掉，適合先檢視變動消費。',
    })
  }

  return insights.slice(0, 6)
}

export function buildWrapped(
  kind: 'month' | 'year',
  expenses: readonly CombinedTransaction[],
  incomes: readonly CombinedTransaction[],
  savings: readonly CombinedTransaction[],
  categories: readonly ExpenseCategory[],
  now: Date,
): WrappedReport {
  const start =
    kind === 'year'
      ? new Date(now.getFullYear(), 0, 1).getTime()
      : new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = now.getTime()
  const periodExpenses = inRange(expenses, start, end)
  const periodIncomes = inRange(incomes, start, end)
  const periodSavings = inRange(savings, start, end)
  const incomeTotal = sum(periodIncomes)
  const expenseTotal = sum(periodExpenses)
  const savingTotal = sum(periodSavings)
  const largest = [...periodExpenses].sort((left, right) => right.amount - left.amount)[0]
  const merchants = new Map<string, { count: number; amount: number }>()
  for (const expense of periodExpenses) {
    const name = merchantOf(expense)
    const current = merchants.get(name) ?? { count: 0, amount: 0 }
    current.count += 1
    current.amount += expense.amount
    merchants.set(name, current)
  }
  const topMerchantEntry = [...merchants.entries()].sort((left, right) => right[1].count - left[1].count)[0]
  const topCategory = buildShare(periodExpenses, categories, 'category')[0]
  const savingsRate = incomeTotal > 0 ? savingTotal / incomeTotal : 0
  const milestone =
    savingsRate >= 0.2
      ? '儲蓄率達標，為未來自己預留了空間'
      : savingTotal > 0
        ? '有持續儲蓄，下一步是把比例再拉高'
        : '這段期間尚未留下儲蓄紀錄'

  return {
    periodKind: kind,
    periodLabel: kind === 'year' ? `${now.getFullYear()} 年回顧` : `${now.getFullYear()} 年 ${now.getMonth() + 1} 月回顧`,
    incomeTotal,
    expenseTotal,
    savingTotal,
    savingsRate,
    transactionCount: periodExpenses.length + periodIncomes.length + periodSavings.length,
    largestExpense: largest ? { name: largest.name, amount: largest.amount, date: largest.date } : null,
    topMerchant: topMerchantEntry
      ? { name: topMerchantEntry[0], count: topMerchantEntry[1].count, amount: topMerchantEntry[1].amount }
      : null,
    topCategory: topCategory ? { name: topCategory.label, amount: topCategory.amount } : null,
    milestone,
  }
}

export function filterRoutineExpenses(
  expenses: readonly CombinedTransaction[],
  outliers: readonly OutlierExpense[],
): CombinedTransaction[] {
  const outlierIds = new Set(outliers.map((item) => item.id))
  return expenses.filter((expense) => !outlierIds.has(expense.id))
}
