import Dexie, { type Table } from 'dexie'

import { getCurrentCycleCode } from '@/lib/date'
import type {
  AppDataPayload,
  AppSetting,
  BudgetCycle,
  ExpenseCategory,
  ExpenseTransaction,
  IncomeCategory,
  IncomeTransaction,
  SavingRecord,
  TargetExpenseLimit,
} from '@/types/app-data'

export class ExpenseTrackerDatabase extends Dexie {
  cycles!: Table<BudgetCycle, string>
  expenseCategories!: Table<ExpenseCategory, string>
  incomeCategories!: Table<IncomeCategory, string>
  expenses!: Table<ExpenseTransaction, string>
  incomes!: Table<IncomeTransaction, string>
  targetExpenses!: Table<TargetExpenseLimit, string>
  savings!: Table<SavingRecord, string>
  settings!: Table<AppSetting, string>

  constructor() {
    super('personal-expense-tracker')

    this.version(1).stores({
      cycles: 'cycle_id, cycle_code',
      expenseCategories: 'category_id, name_en, deleted',
      incomeCategories: 'category_id, name_en, deleted',
      expenses: 'transaction_id, category_id, date',
      incomes: 'transaction_id, category_id, date',
      targetExpenses: 'target_expense_id, cycle_id, category_id, [cycle_id+category_id]',
      savings: 'saving_id, date',
      settings: 'setting_id, name',
    })
  }
}

export const db = new ExpenseTrackerDatabase()

export const defaultExpenseCategories: ExpenseCategory[] = [
  category('expense-food', 'Food', '餐飲', 'b5392a', 'utensils'),
  category('expense-transport', 'Transport', '交通', '2f6f66', 'train'),
  category('expense-home', 'Home', '家居', '496b91', 'home'),
  category('expense-health', 'Health', '健康', '9b5b45', 'heart-pulse'),
  category('expense-investing', 'Investing', '投資', '7b6d3d', 'line-chart'),
  category('expense-other', 'Other', '其他', '6f6a61', 'circle-dot'),
]

export const defaultIncomeCategories: IncomeCategory[] = [
  category('income-salary', 'Salary', '薪金', '2f6f66', 'wallet'),
  category('income-bonus', 'Bonus', '花紅', '496b91', 'badge-dollar-sign'),
  category('income-other', 'Other Income', '其他收入', '7b6d3d', 'circle-plus'),
]

export function createInitialPayload(now = new Date()): AppDataPayload {
  return {
    cycles: [
      {
        cycle_id: `cycle-${getCurrentCycleCode(now)}`,
        cycle_code: getCurrentCycleCode(now),
        income_day: 25,
        income: 50000,
        saving_target: 10000,
      },
    ],
    expenseCategories: defaultExpenseCategories,
    incomeCategories: defaultIncomeCategories,
    expenses: [],
    incomes: [],
    targetExpenses: [],
    savings: [],
    settings: [
      {
        setting_id: 'setting-currency',
        name: 'currency',
        parameter: 'HKD',
      },
    ],
  }
}

function category(
  category_id: string,
  name_en: string,
  name_tc: string,
  color_code: string,
  icon_image_name: string,
): ExpenseCategory {
  return {
    category_id,
    name_en,
    name_tc,
    color_code,
    icon_image_name,
    custom: false,
    deleted: false,
  }
}
