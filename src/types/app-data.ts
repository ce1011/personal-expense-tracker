export interface AppDataPayload {
  cycles: BudgetCycle[]
  expenseCategories: ExpenseCategory[]
  incomeCategories: IncomeCategory[]
  expenses: ExpenseTransaction[]
  incomes: IncomeTransaction[]
  targetExpenses: TargetExpenseLimit[]
  savings: SavingRecord[]
  settings: AppSetting[]
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
}

export interface TargetExpenseLimit {
  target_expense_id: string
  cycle_id: string
  category_id: string
  amount: number
}

export interface SavingRecord {
  saving_id: string
  amount: number
  date: number
  description: string
}

export interface AppSetting {
  setting_id: string
  name: string
  parameter: string
}

export type TransactionKind = 'expense' | 'income'

export interface CombinedTransaction {
  id: string
  kind: TransactionKind
  category_id: string
  name: string
  amount: number
  date: number
}

export interface ExpenseDraft {
  category_id: string
  name: string
  amount: number
  date: number
}

export interface IncomeDraft {
  category_id: string
  name: string
  amount: number
  date: number
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
