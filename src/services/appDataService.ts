import { db, createInitialPayload } from '@/db/database'
import { validateAppDataPayload } from '@/lib/backup'
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
  TargetExpenseLimit,
} from '@/types/app-data'

export async function ensureSeedData(): Promise<void> {
  const cycleCount = await db.cycles.count()

  if (cycleCount > 0) {
    return
  }

  await replaceAllData(createInitialPayload())
}

export async function loadAppData(): Promise<AppDataPayload> {
  await ensureSeedData()

  const [
    cycles,
    expenseCategories,
    incomeCategories,
    expenses,
    incomes,
    targetExpenses,
    savings,
    settings,
  ] = await Promise.all([
    db.cycles.toArray(),
    db.expenseCategories.toArray(),
    db.incomeCategories.toArray(),
    db.expenses.toArray(),
    db.incomes.toArray(),
    db.targetExpenses.toArray(),
    db.savings.toArray(),
    db.settings.toArray(),
  ])

  return {
    cycles: cycles.sort((a, b) => b.cycle_code.localeCompare(a.cycle_code)),
    expenseCategories: expenseCategories.sort((a, b) => a.name_en.localeCompare(b.name_en)),
    incomeCategories: incomeCategories.sort((a, b) => a.name_en.localeCompare(b.name_en)),
    expenses: expenses.sort((a, b) => b.date - a.date),
    incomes: incomes.sort((a, b) => b.date - a.date),
    targetExpenses,
    savings: savings.sort((a, b) => b.date - a.date),
    settings,
  }
}

export async function replaceAllData(payload: AppDataPayload): Promise<void> {
  const validation = validateAppDataPayload(payload)

  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'))
  }

  await db.transaction(
    'rw',
    [
      db.cycles,
      db.expenseCategories,
      db.incomeCategories,
      db.expenses,
      db.incomes,
      db.targetExpenses,
      db.savings,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.cycles.clear(),
        db.expenseCategories.clear(),
        db.incomeCategories.clear(),
        db.expenses.clear(),
        db.incomes.clear(),
        db.targetExpenses.clear(),
        db.savings.clear(),
        db.settings.clear(),
      ])

      await Promise.all([
        db.cycles.bulkPut(payload.cycles),
        db.expenseCategories.bulkPut(payload.expenseCategories),
        db.incomeCategories.bulkPut(payload.incomeCategories),
        db.expenses.bulkPut(payload.expenses),
        db.incomes.bulkPut(payload.incomes),
        db.targetExpenses.bulkPut(payload.targetExpenses),
        db.savings.bulkPut(payload.savings),
        db.settings.bulkPut(payload.settings),
      ])
    },
  )
}

export async function createExpense(draft: ExpenseDraft): Promise<void> {
  const now = Date.now()
  const transaction: ExpenseTransaction = {
    transaction_id: makeId('expense'),
    category_id: draft.category_id,
    name: draft.name.trim(),
    amount: draft.amount,
    date: draft.date,
    create_date: now,
    edit_date: now,
    synced: false,
  }

  await db.expenses.add(transaction)
}

export async function createIncome(draft: IncomeDraft): Promise<void> {
  const now = Date.now()
  const transaction: IncomeTransaction = {
    transaction_id: makeId('income'),
    category_id: draft.category_id,
    name: draft.name.trim(),
    amount: draft.amount,
    date: draft.date,
    create_date: now,
    edit_date: now,
    synced: false,
  }

  await db.incomes.add(transaction)
}

export async function saveCycle(draft: CycleDraft, cycleId?: string): Promise<void> {
  const cycle: BudgetCycle = {
    cycle_id: cycleId ?? makeId('cycle'),
    cycle_code: draft.cycle_code,
    income_day: draft.income_day,
    income: draft.income,
    saving_target: draft.saving_target,
  }

  await db.cycles.put(cycle)
}

export async function saveTargetLimit(
  cycle_id: string,
  category_id: string,
  amount: number,
): Promise<void> {
  const existing = await db.targetExpenses.where('[cycle_id+category_id]').equals([cycle_id, category_id]).first()
  const target: TargetExpenseLimit = {
    target_expense_id: existing?.target_expense_id ?? makeId('target'),
    cycle_id,
    category_id,
    amount,
  }

  await db.targetExpenses.put(target)
}

export async function saveExpenseCategory(
  draft: CategoryDraft,
  categoryId?: string,
): Promise<void> {
  await db.expenseCategories.put(toCategory(draft, categoryId, 'expense-category') as ExpenseCategory)
}

export async function saveIncomeCategory(draft: CategoryDraft, categoryId?: string): Promise<void> {
  await db.incomeCategories.put(toCategory(draft, categoryId, 'income-category') as IncomeCategory)
}

export async function softDeleteExpenseCategory(categoryId: string): Promise<void> {
  await db.expenseCategories.update(categoryId, { deleted: true })
}

export async function softDeleteIncomeCategory(categoryId: string): Promise<void> {
  await db.incomeCategories.update(categoryId, { deleted: true })
}

function toCategory(
  draft: CategoryDraft,
  categoryId: string | undefined,
  prefix: string,
): ExpenseCategory | IncomeCategory {
  return {
    category_id: categoryId ?? makeId(prefix),
    name_en: draft.name_en.trim(),
    name_tc: draft.name_tc.trim(),
    color_code: draft.color_code.replace('#', ''),
    icon_image_name: draft.icon_image_name.trim(),
    custom: true,
    deleted: false,
  }
}

function makeId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
}
