import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { DashboardData } from '@/api/types'
import type { CombinedTransaction, SupportedCurrency, TripSession } from '@/types/app-data'
import { useAppData } from '@/composables/useAppData'
import { useDashboardData } from '@/composables/useDashboardData'
import DashboardView from './DashboardView.vue'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

vi.mock('@/composables/useAppData', () => ({
  useAppData: vi.fn(),
}))

vi.mock('@/composables/useDashboardData', () => ({
  useDashboardData: vi.fn(),
}))

const tokyoTrip: TripSession = {
  trip_id: 'trip-1',
  name: 'Tokyo Trip',
  destination: 'Tokyo',
  start_date: new Date(2026, 6, 1).getTime(),
  end_date: new Date(2026, 6, 10).getTime(),
  budget_amount: 10000,
  budget_currency: 'JPY',
  status: 'active',
  notes: '',
  created_at: Date.now(),
  updated_at: Date.now(),
}

function createDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    currency: 'HKD',
    currentCycle: {
      cycle_id: 'cycle-1',
      cycle_code: '2026-07',
      income_day: 25,
      income: 15000,
      saving_target: 2000,
    },
    currentWindow: {
      start: new Date(2026, 6, 1).getTime(),
      end: new Date(2026, 6, 31).getTime(),
      label: '2026-07',
    },
    cycleIncomeTotal: 15000,
    cycleExpenseTotal: 10000,
    cycleSavingTotal: 2000,
    remainingBudget: 5000,
    daysUntilNextIncome: 6,
    cycleFixedExpensesTotal: 3000,
    todaySpent: 50,
    averageDailyBudgetUntilIncome: 800,
    dailySafeToSpend: { safeToSpendToday: 200, projectedSurplus: 100, isOverToday: false },
    overspendForecast: {
      spentSoFar: 10000,
      elapsedDays: 20,
      remainingDays: 10,
      averageDailySpend: 100,
      projectedVariableSpend: 1000,
      projectedFixedSpend: 0,
      projectedTotalSpend: 11000,
      projectedRemainingBudget: -700,
      projectedOverspendAmount: 700,
      projectedSurplusAmount: 0,
      isProjectedToOverspend: true,
      paceRatio: 1.1,
    },
    spendingStreak: {
      currentNoSpendDays: 3,
      longestNoSpendDays: 5,
      currentLowSpendDays: 6,
      longestLowSpendDays: 6,
      lowSpendThreshold: 80,
    },
    weeklyReview: {
      weekStart: new Date(2026, 5, 28).getTime(),
      weekEnd: new Date(2026, 6, 4).getTime(),
      totalSpent: 1000,
      totalIncome: 1600,
      totalSavings: 50,
      netCashflow: 550,
      transactionCount: 5,
      topCategory: null,
      largestExpense: null,
      vsPreviousWeek: null,
      brief: ['本週淨現金流為 +$550。'],
    },
    weeklyCashflowBrief: ['本週淨現金流為 +$550。'],
    quickAddSuggestions: [],
    activeChallenges: [],
    upcomingBills: [],
    unusualExpenseAlerts: [],
    categoryAlerts: [],
    activeExpenseCategories: [],
    activeIncomeCategories: [],
    expenseCategories: [],
    incomeCategories: [],
    savingChallenges: [],
    trips: [],
    activeTripId: '',
    activeTrip: undefined,
    fxRateMap: { HKD: 1 },
    latestFxDate: '2026-07-01',
    recentTransactions: [],
    isTripMode: false,
    ...overrides,
  }
}

function createMockDashboard(
  overrides: { loading?: boolean; error?: string; data?: DashboardData } = {},
) {
  const data = ref<DashboardData | undefined>(overrides.data)
  return {
    dashboard: computed(() => data.value),
    isTripMode: computed(() => data.value?.isTripMode ?? false),
    loading: ref(overrides.loading ?? false),
    error: ref(overrides.error ?? ''),
    refresh: vi.fn(),
  }
}

function createMockAppData() {
  return {
    currency: computed(() => 'HKD'),
    fxRateMap: computed(() => new Map<SupportedCurrency, number>([['HKD', 1]])),
    addExpense: vi.fn(),
    addIncome: vi.fn(),
    addSaving: vi.fn(),
    addSavingChallenge: vi.fn(),
    updateSavingChallenge: vi.fn(),
    deleteSavingChallenge: vi.fn(),
  }
}

const mockedUseAppData = vi.mocked(useAppData)
const mockedUseDashboardData = vi.mocked(useDashboardData)

function mountDashboard(
  overrides: { loading?: boolean; error?: string; data?: DashboardData } = {},
) {
  mockedUseAppData.mockReturnValue(createMockAppData() as unknown as ReturnType<typeof useAppData>)
  mockedUseDashboardData.mockReturnValue(
    createMockDashboard(overrides) as unknown as ReturnType<typeof useDashboardData>,
  )

  return mount(DashboardView, {
    global: {
      stubs: {
        HeroCard: { template: '<div data-testid="hero-card">HeroCard</div>' },
        KpiGrid: { template: '<div data-testid="kpi-grid">KpiGrid</div>' },
        QuickAddShortcuts: { template: '<div data-testid="quick-add">QuickAdd</div>' },
        SavingChallengesList: { template: '<div data-testid="challenges">Challenges</div>' },
        RecurringExpensesSummary: {
          template: '<div data-testid="recurring">Recurring</div>',
        },
        CategoryAlertsList: { template: '<div data-testid="alerts">Alerts</div>' },
        OverspendForecastCard: { template: '<div data-testid="overspend">Overspend</div>' },
        SpendingStreakCard: { template: '<div data-testid="streak">Streak</div>' },
        WeeklyCashflowCard: { template: '<div data-testid="weekly-brief">WeeklyBrief</div>' },
        UnusualExpenseAlertsList: { template: '<div data-testid="unusual">Unusual</div>' },
        WeeklyReviewModal: true,
        BaseToast: true,
      },
    },
  })
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows loading skeletons while data is loading', () => {
    const wrapper = mountDashboard({ loading: true })
    expect(wrapper.find('[data-testid="hero-card"]').exists()).toBe(false)
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  test('shows dashboard sections when loaded outside trip mode', () => {
    const wrapper = mountDashboard({ data: createDashboardData() })
    expect(wrapper.find('[data-testid="hero-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="kpi-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="overspend"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="streak"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="weekly-brief"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="unusual"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quick-add"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="challenges"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="recurring"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="alerts"]').exists()).toBe(true)
  })

  test('renders recent transactions when present', async () => {
    const recentTransactions: CombinedTransaction[] = [
      {
        id: 'expense-1',
        kind: 'expense',
        category_id: 'food',
        name: 'Lunch',
        amount: 120,
        date: new Date(2026, 6, 3, 12, 0, 0).getTime(),
      },
    ]
    const wrapper = mountDashboard({ data: createDashboardData({ recentTransactions }) })
    await flushPromises()
    expect(wrapper.text()).toContain('最近交易')
    expect(wrapper.text()).toContain('Lunch')
    expect(wrapper.text()).toContain('HK$120')
  })

  test('shows empty state when no transactions exist', async () => {
    const wrapper = mountDashboard({ data: createDashboardData({ recentTransactions: [] }) })
    await flushPromises()
    expect(wrapper.text()).toContain('還沒有交易紀錄')
  })

  test('shows trip mode card when active trip is set', async () => {
    const wrapper = mountDashboard({
      data: createDashboardData({
        isTripMode: true,
        activeTrip: tokyoTrip,
        activeTripId: tokyoTrip.trip_id,
        trips: [tokyoTrip],
      }),
    })
    await flushPromises()
    expect(wrapper.text()).toContain('旅程模式')
    expect(wrapper.text()).toContain('Tokyo Trip')
    expect(wrapper.text()).toContain('旅程最近交易')
  })
})
