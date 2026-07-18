import type {
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
