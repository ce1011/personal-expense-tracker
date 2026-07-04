import { flushPromises, mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { describe, expect, test, vi } from 'vitest'

import DashboardView from './DashboardView.vue'
import { useAppData } from '@/composables/useAppData'
import type { AppDataPayload, CombinedTransaction } from '@/types/app-data'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

vi.mock('@/composables/useAppData', () => ({
  useAppData: vi.fn(),
}))

const basePayload: AppDataPayload = {
  cycles: [],
  expenseCategories: [],
  incomeCategories: [],
  expenses: [],
  incomes: [],
  targetExpenses: [],
  savings: [],
  settings: [],
  trips: [],
  fxRates: [],
  savingChallenges: [],
}

function createMockAppData(
  overrides: {
    loading?: boolean
    error?: string
    activeTrip?: boolean
    transactions?: CombinedTransaction[]
  } = {},
) {
  const loading = ref(overrides.loading ?? false)
  const error = ref(overrides.error ?? '')
  const data = ref(basePayload)
  const transactions = ref(overrides.transactions ?? [])
  const activeTrip = ref(
    overrides.activeTrip
      ? {
          trip_id: 'trip-1',
          name: 'Tokyo Trip',
          destination: 'Tokyo',
          start_date: new Date(2026, 6, 1).getTime(),
          end_date: new Date(2026, 6, 10).getTime(),
          budget_amount: 10000,
          budget_currency: 'JPY',
          status: 'active' as const,
          notes: '',
          created_at: Date.now(),
          updated_at: Date.now(),
        }
      : undefined,
  )

  return {
    data,
    loading,
    error,
    activeTrip: computed(() => activeTrip.value),
    currentWindow: computed(() => ({
      start: new Date(2026, 6, 1).getTime(),
      end: new Date(2026, 6, 31).getTime(),
      label: '2026-07',
    })),
    combinedTransactions: computed(() => transactions.value),
    tripTransactions: computed(() => transactions.value),
    currency: computed(() => 'HKD'),
    remainingBudget: computed(() => 5000),
    cycleIncomeTotal: computed(() => 15000),
    cycleExpenseTotal: computed(() => 10000),
    dailySafeToSpend: computed(() => ({
      safeToSpendToday: 200,
      projectedSurplus: 100,
      isOverToday: false,
    })),
    todaySpent: computed(() => 50),
    currentCycle: computed(() => ({
      cycle_id: 'cycle-1',
      cycle_code: '2026-07',
      income_day: 25,
      income: 15000,
      saving_target: 2000,
    })),
    cycleFixedExpensesTotal: computed(() => 3000),
    upcomingBills: computed(() => []),
    quickAddSuggestions: computed(() => []),
    activeExpenseCategories: computed(() => data.value.expenseCategories),
    activeIncomeCategories: computed(() => data.value.incomeCategories),
    fxRateMap: computed(() => new Map([['HKD', 1]])),
    activeChallenges: computed(() => []),
    categoryAlerts: computed(() => []),
    weeklyReview: computed(() => ({
      weekStart: new Date(2026, 5, 28).getTime(),
      weekEnd: new Date(2026, 6, 4).getTime(),
      totalSpent: 1000,
      topCategory: null,
      transactionCount: 5,
      averageTransaction: 200,
      daysComparedToLastWeek: 0,
      lastWeekTotal: 1000,
    })),
    addExpense: vi.fn(),
    addIncome: vi.fn(),
    addSaving: vi.fn(),
    addSavingChallenge: vi.fn(),
    updateSavingChallenge: vi.fn(),
    deleteSavingChallenge: vi.fn(),
  }
}

const mockedUseAppData = vi.mocked(useAppData)

function mountDashboard(overrides: Parameters<typeof createMockAppData>[0] = {}) {
  mockedUseAppData.mockReturnValue(
    createMockAppData(overrides) as unknown as ReturnType<typeof useAppData>,
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
        WeeklyReviewModal: true,
        BaseToast: true,
      },
    },
  })
}

describe('DashboardView', () => {
  test('shows loading skeletons while data is loading', () => {
    const wrapper = mountDashboard({ loading: true })
    expect(wrapper.find('[data-testid="hero-card"]').exists()).toBe(false)
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  test('shows dashboard sections when loaded outside trip mode', () => {
    const wrapper = mountDashboard()
    expect(wrapper.find('[data-testid="hero-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="kpi-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quick-add"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="challenges"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="recurring"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="alerts"]').exists()).toBe(true)
  })

  test('renders recent transactions when present', async () => {
    const transactions: CombinedTransaction[] = [
      {
        id: 'expense-1',
        kind: 'expense',
        category_id: 'food',
        name: 'Lunch',
        amount: 120,
        date: new Date(2026, 6, 3, 12, 0, 0).getTime(),
      },
    ]
    const wrapper = mountDashboard({ transactions })
    await flushPromises()
    expect(wrapper.text()).toContain('最近交易')
    expect(wrapper.text()).toContain('Lunch')
    expect(wrapper.text()).toContain('HK$120')
  })

  test('shows empty state when no transactions exist', async () => {
    const wrapper = mountDashboard({ transactions: [] })
    await flushPromises()
    expect(wrapper.text()).toContain('還沒有交易紀錄')
  })

  test('shows trip mode card when active trip is set', async () => {
    const wrapper = mountDashboard({ activeTrip: true })
    await flushPromises()
    expect(wrapper.text()).toContain('旅程模式')
    expect(wrapper.text()).toContain('Tokyo Trip')
    expect(wrapper.text()).toContain('旅程最近交易')
  })
})
