export interface AppDataPayload {
  cycles: BudgetCycle[]
  expenseCategories: ExpenseCategory[]
  incomeCategories: IncomeCategory[]
  expenses: ExpenseTransaction[]
  incomes: IncomeTransaction[]
  targetExpenses: TargetExpenseLimit[]
  savings: SavingRecord[]
  settings: AppSetting[]
  trips?: TripSession[]
  fxRates?: FxRateRecord[]
}

export type TripStatus = 'planned' | 'active' | 'completed'

export interface TripSession {
  trip_id: string
  name: string
  destination: string
  start_date: number
  end_date: number
  budget_amount: number
  budget_currency: SupportedCurrency
  status: TripStatus
  notes: string
  created_at: number
  updated_at: number
}

export interface BudgetCycle {
  cycle_id: string
  cycle_code: string
  income_day: number
  income: number
  saving_target: number
}

export interface ExpenseCategory {
  category_id: string
  name_en: string
  name_tc: string
  color_code: string
  icon_image_name: string
  custom: boolean
  deleted: boolean
}

export interface IncomeCategory {
  category_id: string
  name_en: string
  name_tc: string
  color_code: string
  icon_image_name: string
  custom: boolean
  deleted: boolean
}

export interface ExpenseTransaction {
  transaction_id: string
  category_id: string
  name: string
  amount: number
  date: number
  create_date: number
  edit_date: number
  synced: boolean
  reminder_parameter?: string
  trip_id?: string
  original_currency?: SupportedCurrency
  original_amount?: number
  exchange_rate_hkd?: number
}

export interface IncomeTransaction {
  transaction_id: string
  category_id: string
  name: string
  amount: number
  date: number
  create_date: number
  edit_date: number
  synced: boolean
  trip_id?: string
  original_currency?: SupportedCurrency
  original_amount?: number
  exchange_rate_hkd?: number
}

export interface TargetExpenseLimit {
  target_expense_id: string
  cycle_id: string
  category_id: string
  amount: number
}

export interface SavingRecord {
  saving_id: string
  category_id?: string
  amount: number
  date: number
  description: string
  create_date?: number
  edit_date?: number
  synced?: boolean
  trip_id?: string
  original_currency?: SupportedCurrency
  original_amount?: number
  exchange_rate_hkd?: number
}

export interface AppSetting {
  setting_id: string
  name: string
  parameter: string
}

export type SupportedCurrency = 'HKD' | 'USD' | 'CNY' | 'JPY' | 'TWD' | 'THB'

export interface FxRateRecord {
  rate_id: string
  currency_code: SupportedCurrency
  rate_to_hkd: number
  source_date: string
  fetched_at: number
}

export type TransactionKind = 'expense' | 'income' | 'saving'

export interface CombinedTransaction {
  id: string
  kind: TransactionKind
  category_id: string
  name: string
  amount: number
  date: number
  trip_id?: string
  original_currency?: SupportedCurrency
  original_amount?: number
  exchange_rate_hkd?: number
}

export interface ExpenseDraft {
  category_id: string
  name: string
  amount: number
  date: number
  trip_id?: string
  currency_code: SupportedCurrency
  exchange_rate_hkd: number
}

export interface IncomeDraft {
  category_id: string
  name: string
  amount: number
  date: number
  trip_id?: string
  currency_code: SupportedCurrency
  exchange_rate_hkd: number
}

export interface SavingDraft {
  category_id: string
  name: string
  amount: number
  date: number
  trip_id?: string
  currency_code: SupportedCurrency
  exchange_rate_hkd: number
}

export interface TripDraft {
  name: string
  destination: string
  start_date: number
  end_date: number
  budget_amount: number
  budget_currency: SupportedCurrency
  status: TripStatus
  notes: string
}

export interface CycleDraft {
  cycle_code: string
  income_day: number
  income: number
  saving_target: number
}

export interface CategoryDraft {
  name_en: string
  name_tc: string
  color_code: string
  icon_image_name: string
}
