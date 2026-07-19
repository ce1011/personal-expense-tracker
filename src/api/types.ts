import type {
  AppDataPayload,
  BudgetCycle,
  CategoryDraft,
  CombinedTransaction,
  CycleDraft,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseTransaction,
  IncomeCategory,
  IncomeDraft,
  IncomeTransaction,
  SavingChallenge,
  SavingDraft,
  SavingRecord,
  SupportedCurrency,
  TargetExpenseLimit,
  TripDraft,
  TripSession,
} from '@/types/app-data'

/**
 * Request/response wire shapes for the Elysia backend.
 *
 * The backend returns rows serialized to the same snake_case shapes declared in
 * `src/types/app-data.ts` (see `backend/src/domain/serializers.ts`), so response
 * types are simply the domain types. The request bodies below mirror the
 * TypeBox schemas in `backend/src/routes/*.routes.ts`.
 */

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface RegisterBody {
  email: string
  password: string
  name?: string
}

/** Shared multi-currency fields accepted by every transaction mutation. */
export interface MoneyBody {
  amount: number
  currency_code?: SupportedCurrency
  exchange_rate_hkd?: number
}

export interface ExpenseBody extends MoneyBody {
  category_id: string
  name: string
  date: number
  trip_id?: string
  recurring?: boolean
  recurring_frequency?: 'weekly' | 'monthly' | 'yearly'
  recurring_day?: number
}

export interface IncomeBody extends MoneyBody {
  category_id: string
  name: string
  date: number
  trip_id?: string
}

export interface SavingBody extends MoneyBody {
  description: string
  date: number
  category_id?: string
  challenge_id?: string
  trip_id?: string
}

export interface ImportRecord extends MoneyBody {
  type: 'expense' | 'income' | 'saving'
  name: string
  date: number
  category_id?: string
  trip_id?: string
}

export interface ImportBody {
  records: ImportRecord[]
}

export interface CycleBody {
  cycle_code: string
  income_day: number
  income: number
  saving_target: number
}

export interface TargetExpenseBody {
  cycle_id: string
  category_id: string
  amount: number
}

export interface ChallengeBody {
  name?: string
  target_amount?: number
  status?: 'active' | 'completed' | 'paused'
}

export interface TripBody {
  name: string
  destination: string
  start_date: number
  end_date: number
  budget_amount: number
  budget_currency: SupportedCurrency
  status: 'planned' | 'active' | 'completed'
  notes: string
}

export interface SettingBody {
  parameter: string
}

export interface SnapshotSummaryRecord {
  snapshot_id: string
  created_at: number
  reason: string
}

export type {
  AppDataPayload,
  BudgetCycle,
  CategoryDraft,
  CycleDraft,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseTransaction,
  IncomeCategory,
  IncomeDraft,
  IncomeTransaction,
  SavingChallenge,
  SavingDraft,
  SavingRecord,
  TargetExpenseLimit,
  TripDraft,
  TripSession,
}

// ---------------------------------------------------------------------------
// Per-page aggregate responses (mirror backend/src/services/*.ts)
// ---------------------------------------------------------------------------

export interface CycleWindow {
  start: number
  end: number
  label: string
}

export interface SafeToSpendResult {
  safeToSpendToday: number
  projectedSurplus: number
  isOverToday: boolean
}

export interface OverspendForecast {
  spentSoFar: number
  elapsedDays: number
  remainingDays: number
  averageDailySpend: number
  projectedVariableSpend: number
  projectedFixedSpend: number
  projectedTotalSpend: number
  projectedRemainingBudget: number
  projectedOverspendAmount: number
  projectedSurplusAmount: number
  isProjectedToOverspend: boolean
  paceRatio: number
}

export interface SpendingStreak {
  currentNoSpendDays: number
  longestNoSpendDays: number
  currentLowSpendDays: number
  longestLowSpendDays: number
  lowSpendThreshold: number
}

export interface WeeklyReview {
  weekStart: number
  weekEnd: number
  totalSpent: number
  totalIncome: number
  totalSavings: number
  netCashflow: number
  transactionCount: number
  topCategory: { category_id: string; name: string; amount: number } | null
  largestExpense: { category_id: string; name: string; amount: number } | null
  vsPreviousWeek: { spentDelta: number; spentDeltaPercent: number } | null
  brief: string[]
}

export interface QuickAddSuggestion {
  kind: 'expense' | 'income' | 'saving'
  category_id: string
  name: string
  amount?: number
}

export interface ChallengeProgress {
  challenge_id: string
  name: string
  target_amount: number
  current_amount: number
  percentage: number
  status: 'active' | 'completed' | 'paused'
}

export interface UpcomingBill {
  transaction_id: string
  name: string
  amount: number
  dueTimestamp: number
  daysUntilDue: number
}

export interface UnusualExpenseAlert {
  transactionId: string
  merchantName: string
  categoryId: string
  amount: number
  baselineAmount: number
  multiplier: number
  message: string
}

export interface CategoryAlert {
  category_id: string
  category_name: string
  color_code: string
  target: number
  spent: number
  remaining: number
  percentage: number
  severity: 'ok' | 'warning' | 'danger'
}

export interface MonthlySnapshot {
  cycleWindow: { start: number; end: number; label: string }
  incomeTotal: number
  expenseTotal: number
  savingTotal: number
  savingsRate: number
  topExpenseCategories: { category_id: string; name: string; amount: number; percentage: number }[]
  remainingBudget: number
  dailyAverageSpent: number
  vsLastCycle: {
    expenseDelta: number
    expenseDeltaPercent: number
    savingDelta: number
  } | null
}

export interface TripBudgetHelper {
  daysRemaining: number
  dailyAllowance: number
  projectedTripBalance: number
  remainingBudget: number
  spentTotal: number
  isOffPace: boolean
}

export interface SavingCategoryOption {
  category_id: string
  name_en: string
  name_tc: string
  color_code: string
  icon_image_name: string
}

/** One call = everything the homepage renders. */
export interface DashboardData {
  currency: string
  currentCycle?: BudgetCycle
  currentWindow?: CycleWindow
  cycleIncomeTotal: number
  cycleExpenseTotal: number
  cycleSavingTotal: number
  remainingBudget: number
  daysUntilNextIncome: number
  cycleFixedExpensesTotal: number
  todaySpent: number
  averageDailyBudgetUntilIncome: number
  dailySafeToSpend: SafeToSpendResult
  overspendForecast?: OverspendForecast
  spendingStreak: SpendingStreak
  weeklyReview: WeeklyReview
  weeklyCashflowBrief: string[]
  quickAddSuggestions: QuickAddSuggestion[]
  activeChallenges: ChallengeProgress[]
  upcomingBills: UpcomingBill[]
  unusualExpenseAlerts: UnusualExpenseAlert[]
  categoryAlerts: CategoryAlert[]
  activeExpenseCategories: ExpenseCategory[]
  activeIncomeCategories: IncomeCategory[]
  expenseCategories: ExpenseCategory[]
  incomeCategories: IncomeCategory[]
  savingChallenges: SavingChallenge[]
  trips: TripSession[]
  activeTripId: string
  activeTrip?: TripSession
  fxRateMap: Record<string, number>
  latestFxDate: string
  recentTransactions: CombinedTransaction[]
  isTripMode: boolean
}

export interface TransactionsQueryParams {
  q?: string
  kind?: 'all' | 'expense' | 'income' | 'saving'
  category_id?: string
  trip_id?: string
  date_preset?: 'all' | 'today' | 'cycle' | 'previous' | 'future' | 'custom'
  from_date?: string
  to_date?: string
}

export interface TransactionGroup {
  label: string
  items: CombinedTransaction[]
}

export interface TransactionsQueryResult {
  transactions: CombinedTransaction[]
  groups: TransactionGroup[]
  options: {
    trips: TripSession[]
    expenseCategories: ExpenseCategory[]
    incomeCategories: IncomeCategory[]
    savingCategories: SavingCategoryOption[]
    activeTripId: string
  }
  currency: string
  expenseCategories: ExpenseCategory[]
  incomeCategories: IncomeCategory[]
  savingChallenges: SavingChallenge[]
  currentWindow?: CycleWindow
  fxRateMap: Record<string, number>
  latestFxDate: string
}

export interface BudgetsSummary {
  cycles: BudgetCycle[]
  targetExpenses: TargetExpenseLimit[]
  activeExpenseCategories: ExpenseCategory[]
  currency: string
}

export interface CategoryBudgetSummary {
  currentCycle?: BudgetCycle
  currentWindow?: CycleWindow
  remainingCycleDays: number
  cycleExpenses: ExpenseTransaction[]
  todayExpenses: ExpenseTransaction[]
  targetExpenses: TargetExpenseLimit[]
  activeExpenseCategories: ExpenseCategory[]
  currency: string
}

export interface FixedExpensesSummary {
  fixedExpenses: ExpenseTransaction[]
  cycleFixedExpensesTotal: number
  upcomingBills: UpcomingBill[]
  activeExpenseCategories: ExpenseCategory[]
  currency: string
}

export interface TripsSummary {
  trips: TripSession[]
  activeTripId: string
  activeTrip?: TripSession
  tripBudgetHelper?: TripBudgetHelper
  spentByTrip: Record<string, number>
  currency: string
}

export interface MonthlySnapshotSummary {
  monthlySnapshot: MonthlySnapshot
  currency: string
}
