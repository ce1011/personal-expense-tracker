# Fixed Expenses Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent `/fixed-expenses` page with list, CRUD modal form, and summary statistics, reusing the existing recurring `ExpenseTransaction` model.

**Architecture:** Add pure display helpers to `src/lib/dailyFinance/recurringExpenses.ts`. Create a dedicated view and two presentational components. Wire the route and sidebar. All persistence goes through existing `useAppData` actions.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS v4, Vue Router, Dexie.js via `useAppData`.

## Global Constraints

- No new Dexie tables or schema changes.
- Amounts are shown in the app base currency (`HKD`).
- Delete actions require `confirm()`.
- Follow existing `<script setup>` + Composition API patterns.
- Reuse shared components: `BaseModal`, `MetricCard`, `EmptyState`.

---

### Task 1: Add Frequency Display Helpers

**Files:**
- Modify: `src/lib/dailyFinance/recurringExpenses.ts`
- Test: `src/lib/dailyFinance/recurringExpenses.test.ts`

**Interfaces:**
- Produces: `getFrequencyLabel(frequency)` and `getRecurringDayLabel(frequency, day)`.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/dailyFinance/recurringExpenses.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  getCycleFixedExpensesTotal,
  getFrequencyLabel,
  getRecurringDayLabel,
  getUpcomingBills,
} from './recurringExpenses'

// ... existing tests ...

describe('getFrequencyLabel', () => {
  it('returns Chinese labels', () => {
    expect(getFrequencyLabel('weekly')).toBe('每週')
    expect(getFrequencyLabel('monthly')).toBe('每月')
    expect(getFrequencyLabel('yearly')).toBe('每年')
  })
})

describe('getRecurringDayLabel', () => {
  it('returns weekly labels', () => {
    expect(getRecurringDayLabel('weekly', 0)).toBe('每週日')
    expect(getRecurringDayLabel('weekly', 6)).toBe('每週六')
  })

  it('returns monthly labels', () => {
    expect(getRecurringDayLabel('monthly', 1)).toBe('每月 1 日')
    expect(getRecurringDayLabel('monthly', 31)).toBe('每月 31 日')
  })

  it('returns yearly labels', () => {
    expect(getRecurringDayLabel('yearly', 15)).toBe('每年 15 日')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test:unit src/lib/dailyFinance/recurringExpenses.test.ts`

Expected: FAIL with "getFrequencyLabel is not defined" or "getRecurringDayLabel is not defined".

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/dailyFinance/recurringExpenses.ts` after the existing helpers:

```ts
const weeklyDayLabels = ['日', '一', '二', '三', '四', '五', '六']

export function getFrequencyLabel(frequency: 'weekly' | 'monthly' | 'yearly'): string {
  switch (frequency) {
    case 'weekly':
      return '每週'
    case 'monthly':
      return '每月'
    case 'yearly':
      return '每年'
  }
}

export function getRecurringDayLabel(
  frequency: 'weekly' | 'monthly' | 'yearly',
  day: number,
): string {
  if (frequency === 'weekly') {
    return `每週${weeklyDayLabels[day] ?? day}`
  }

  return `每${frequency === 'yearly' ? '年' : '月'} ${day} 日`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test:unit src/lib/dailyFinance/recurringExpenses.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dailyFinance/recurringExpenses.ts src/lib/dailyFinance/recurringExpenses.test.ts
git commit -m "feat: add fixed-expense frequency display helpers"
```

---

### Task 2: Add Route and Sidebar Navigation

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/components/AppShell.vue`

**Interfaces:**
- Produces: `/fixed-expenses` route and sidebar item labeled **固定開支** with `Receipt` icon.

- [ ] **Step 1: Modify router**

Add the import and route in `src/router/index.ts`:

```ts
import FixedExpensesView from '@/views/FixedExpensesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/transactions', name: 'transactions', component: TransactionsView },
    {
      path: '/import-transactions',
      name: 'import-transactions',
      component: ImportTransactionsView,
    },
    { path: '/budgets', name: 'budgets', component: BudgetsView },
    { path: '/category-budget', name: 'category-budget', component: CategoryBudgetView },
    { path: '/categories', name: 'categories', component: CategoriesView },
    { path: '/fixed-expenses', name: 'fixed-expenses', component: FixedExpensesView },
    { path: '/trips', name: 'trips', component: TripsView },
    { path: '/monthly-snapshot', name: 'monthly-snapshot', component: MonthlySnapshotView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})
```

- [ ] **Step 2: Modify sidebar**

In `src/components/AppShell.vue`, add `Receipt` to the Lucide imports and insert the new item in `secondaryNavItems`:

```ts
import {
  ArchiveRestore,
  BarChart3,
  Braces,
  ChartNoAxesCombined,
  ChartPie,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Plane,
  Receipt,
} from 'lucide-vue-next'

const secondaryNavItems = [
  { label: '分類', to: '/categories', icon: FolderKanban },
  { label: '固定開支', to: '/fixed-expenses', icon: Receipt },
  { label: 'JSON 匯入', to: '/import-transactions', icon: Braces },
  { label: '設定', to: '/settings', icon: ArchiveRestore },
]
```

- [ ] **Step 3: Verify dev server compiles**

Run: `bun run build`

Expected: FAIL because `FixedExpensesView.vue` does not exist yet. This is expected; the next tasks create it.

- [ ] **Step 4: Commit**

```bash
git add src/router/index.ts src/components/AppShell.vue
git commit -m "feat: add fixed-expenses route and sidebar item"
```

---

### Task 3: Create FixedExpenseForm Component

**Files:**
- Create: `src/components/fixedExpenses/FixedExpenseForm.vue`

**Interfaces:**
- Consumes: `expenseCategories`, `transaction` (optional), `currency`.
- Produces: emits `create`/`update` with `ExpenseDraft` and `close`.

- [ ] **Step 1: Create the component file**

```vue
<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import BaseModal from '@/components/common/BaseModal.vue'
import type { CombinedTransaction, ExpenseCategory, ExpenseDraft } from '@/types/app-data'

const props = defineProps<{
  show: boolean
  expenseCategories: readonly ExpenseCategory[]
  currency: string
  transaction?: CombinedTransaction
}>()

const emit = defineEmits<{
  close: []
  create: [draft: ExpenseDraft]
  update: [transactionId: string, draft: ExpenseDraft]
}>()

const form = reactive({
  category_id: '',
  name: '',
  amount: 0,
  recurring_frequency: 'monthly' as 'weekly' | 'monthly' | 'yearly',
  recurring_day: 1,
})

const errors = reactive<Record<string, string>>({})
const isEditing = computed(() => Boolean(props.transaction))

const frequencyOptions: { value: 'weekly' | 'monthly' | 'yearly'; label: string }[] = [
  { value: 'weekly', label: '每週' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
]

const weeklyDayOptions = [
  { value: 0, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
]

const dayMin = computed(() => (form.recurring_frequency === 'weekly' ? 0 : 1))
const dayMax = computed(() => (form.recurring_frequency === 'weekly' ? 6 : 31))

watch(
  () => props.transaction,
  (transaction) => {
    if (transaction) {
      form.category_id = transaction.category_id
      form.name = transaction.name
      form.amount = transaction.amount
      form.recurring_frequency = transaction.recurring_frequency ?? 'monthly'
      form.recurring_day = transaction.recurring_day ?? 1
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

watch(
  () => props.expenseCategories,
  (categories) => {
    if (!categories.some((category) => category.category_id === form.category_id)) {
      form.category_id = categories[0]?.category_id ?? ''
    }
  },
  { immediate: true },
)

function resetForm(): void {
  form.category_id = props.expenseCategories[0]?.category_id ?? ''
  form.name = ''
  form.amount = 0
  form.recurring_frequency = 'monthly'
  form.recurring_day = 1
}

function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key])

  if (form.category_id === '') {
    errors.category_id = '請選擇分類'
  }

  if (form.name.trim() === '') {
    errors.name = '請輸入名稱'
  }

  if (Number(form.amount) <= 0) {
    errors.amount = '金額必須大於 0'
  }

  if (form.recurring_day < dayMin.value || form.recurring_day > dayMax.value) {
    errors.recurring_day = `到期日必須在 ${dayMin.value}–${dayMax.value} 之間`
  }

  return Object.keys(errors).length === 0
}

function submit(): void {
  if (!validate()) {
    return
  }

  const draft: ExpenseDraft = {
    category_id: form.category_id,
    name: form.name.trim(),
    amount: Number(form.amount),
    date: Date.now(),
    currency_code: props.currency as 'HKD',
    exchange_rate_hkd: 1,
    recurring: true,
    recurring_frequency: form.recurring_frequency,
    recurring_day: form.recurring_day,
  }

  if (props.transaction) {
    emit('update', props.transaction.id, draft)
  } else {
    emit('create', draft)
  }
}

function close(): void {
  emit('close')
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="isEditing ? '修改固定開支' : '新增固定開支'"
    :subtitle="isEditing ? '更新這筆固定開支的內容' : '建立一筆會定期發生的開支'"
    max-width="max-w-lg"
    @close="close"
  >
    <form class="grid gap-4" @submit.prevent="submit">
      <label class="grid gap-1 text-sm font-medium text-stone-700">
        名稱
        <input
          v-model.trim="form.name"
          type="text"
          class="rounded-md border border-stone-300 px-3 py-2"
          :class="errors.name ? 'border-red-300' : ''"
          placeholder="例如：租金、水電費、會員費"
        />
        <span v-if="errors.name" class="text-xs text-red-600">{{ errors.name }}</span>
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        金額 ({{ currency }})
        <input
          v-model.number="form.amount"
          type="number"
          min="0.01"
          step="0.01"
          class="rounded-md border border-stone-300 px-3 py-2"
          :class="errors.amount ? 'border-red-300' : ''"
          placeholder="0.00"
        />
        <span v-if="errors.amount" class="text-xs text-red-600">{{ errors.amount }}</span>
      </label>

      <label class="grid gap-1 text-sm font-medium text-stone-700">
        分類
        <select
          v-model="form.category_id"
          class="rounded-md border border-stone-300 bg-white px-3 py-2"
          :class="errors.category_id ? 'border-red-300' : ''"
        >
          <option
            v-for="category in expenseCategories"
            :key="category.category_id"
            :value="category.category_id"
          >
            {{ category.name_tc || category.name_en }}
          </option>
        </select>
        <span v-if="errors.category_id" class="text-xs text-red-600">{{ errors.category_id }}</span>
      </label>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="grid gap-1 text-sm font-medium text-stone-700">
          週期
          <select
            v-model="form.recurring_frequency"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option v-for="option in frequencyOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="grid gap-1 text-sm font-medium text-stone-700">
          <template v-if="form.recurring_frequency === 'weekly'">星期</template>
          <template v-else>到期日</template>
          <select
            v-if="form.recurring_frequency === 'weekly'"
            v-model.number="form.recurring_day"
            class="rounded-md border border-stone-300 bg-white px-3 py-2"
          >
            <option v-for="option in weeklyDayOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input
            v-else
            v-model.number="form.recurring_day"
            type="number"
            :min="dayMin"
            :max="dayMax"
            class="rounded-md border border-stone-300 px-3 py-2"
            :class="errors.recurring_day ? 'border-red-300' : ''"
          />
          <span v-if="errors.recurring_day" class="text-xs text-red-600">{{ errors.recurring_day }}</span>
        </label>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          @click="close"
        >
          取消
        </button>
        <button
          type="submit"
          class="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          {{ isEditing ? '儲存修改' : '新增固定開支' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
```

- [ ] **Step 2: Type-check the new component**

Run: `bun run build`

Expected: FAIL because `FixedExpensesView.vue` and `FixedExpensesList.vue` are not yet created and imported. This is expected.

- [ ] **Step 3: Commit**

```bash
git add src/components/fixedExpenses/FixedExpenseForm.vue
git commit -m "feat: add fixed-expense form modal component"
```

---

### Task 4: Create FixedExpensesList Component

**Files:**
- Create: `src/components/fixedExpenses/FixedExpensesList.vue`

**Interfaces:**
- Consumes: `fixedExpenses` (filtered `ExpenseTransaction[]`), `expenseCategories`, `currency`.
- Produces: emits `edit`, `delete`.

- [ ] **Step 1: Create the component file**

```vue
<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import {
  getFrequencyLabel,
  getRecurringDayLabel,
} from '@/lib/dailyFinance/recurringExpenses'
import { formatCurrency } from '@/lib/formatters'
import type { ExpenseCategory, ExpenseTransaction } from '@/types/app-data'

const props = defineProps<{
  fixedExpenses: readonly ExpenseTransaction[]
  expenseCategories: readonly ExpenseCategory[]
  currency: string
}>()

const emit = defineEmits<{
  edit: [transaction: ExpenseTransaction]
  delete: [transactionId: string]
}>()

const categoryMap = computed(() => {
  const map = new Map<string, ExpenseCategory>()
  for (const category of props.expenseCategories) {
    map.set(category.category_id, category)
  }
  return map
})

function getCategory(transaction: ExpenseTransaction): ExpenseCategory | undefined {
  return categoryMap.value.get(transaction.category_id)
}

function confirmDelete(transaction: ExpenseTransaction): void {
  if (confirm(`確定要刪除「${transaction.name}」這個固定開支嗎？`)) {
    emit('delete', transaction.transaction_id)
  }
}
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-stone-950">固定開支列表</h2>
        <p class="mt-1 text-sm text-stone-500">管理會定期發生的支出</p>
      </div>
    </div>

    <div v-if="fixedExpenses.length" class="divide-y divide-stone-100">
      <div
        v-for="expense in fixedExpenses"
        :key="expense.transaction_id"
        class="flex items-center justify-between gap-4 py-3"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 text-sm font-medium text-stone-900">
            <span
              class="inline-block size-3 shrink-0 rounded-full"
              :style="{ backgroundColor: `#${getCategory(expense)?.color_code ?? '78716c'}` }"
              aria-hidden="true"
            />
            <span class="truncate">{{ expense.name }}</span>
          </div>
          <p class="mt-1 text-xs text-stone-500">
            {{ getFrequencyLabel(expense.recurring_frequency ?? 'monthly') }} ·
            {{ getRecurringDayLabel(expense.recurring_frequency ?? 'monthly', expense.recurring_day ?? 1) }}
            <template v-if="getCategory(expense)">
              · {{ getCategory(expense)?.name_tc || getCategory(expense)?.name_en }}
            </template>
          </p>
        </div>

        <div class="flex items-center gap-4">
          <p class="text-right text-sm font-semibold text-stone-950">
            {{ formatCurrency(expense.amount, currency) }}
          </p>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded-md p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
              aria-label="修改固定開支"
              title="修改"
              @click="emit('edit', expense)"
            >
              <Pencil class="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded-md p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-700"
              aria-label="刪除固定開支"
              title="刪除"
              @click="confirmDelete(expense)"
            >
              <Trash2 class="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      title="目前沒有固定開支"
      message="新增固定開支後，它們會顯示在這裡並自動計入本期預算。"
    />
  </article>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/fixedExpenses/FixedExpensesList.vue
git commit -m "feat: add fixed-expenses list component"
```

---

### Task 5: Create FixedExpensesView Page

**Files:**
- Create: `src/views/FixedExpensesView.vue`

**Interfaces:**
- Consumes: `useAppData` computed values and actions.
- Produces: renders summary cards, list, and form modal.

- [ ] **Step 1: Create the view file**

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Plus } from 'lucide-vue-next'

import EmptyState from '@/components/common/EmptyState.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import FixedExpenseForm from '@/components/fixedExpenses/FixedExpenseForm.vue'
import FixedExpensesList from '@/components/fixedExpenses/FixedExpensesList.vue'
import { useAppData } from '@/composables/useAppData'
import { formatCurrency } from '@/lib/formatters'
import type { ExpenseDraft, ExpenseTransaction } from '@/types/app-data'

const appData = useAppData()
const isFormOpen = shallowRef(false)
const editingTransaction = shallowRef<ExpenseTransaction | undefined>(undefined)

const fixedExpenses = computed(() =>
  appData.data.value.expenses.filter((expense) => expense.recurring === true),
)

const averageAmount = computed(() => {
  if (fixedExpenses.value.length === 0) {
    return 0
  }

  return (
    fixedExpenses.value.reduce((sum, expense) => sum + expense.amount, 0) /
    fixedExpenses.value.length
  )
})

function openCreate(): void {
  editingTransaction.value = undefined
  isFormOpen.value = true
}

function openEdit(transaction: ExpenseTransaction): void {
  editingTransaction.value = transaction
  isFormOpen.value = true
}

function closeForm(): void {
  isFormOpen.value = false
  editingTransaction.value = undefined
}

async function createExpense(draft: ExpenseDraft): Promise<void> {
  await appData.addExpense(draft)
  closeForm()
}

async function updateExpense(transactionId: string, draft: ExpenseDraft): Promise<void> {
  await appData.updateExpense(transactionId, draft)
  closeForm()
}

async function deleteExpense(transactionId: string): Promise<void> {
  await appData.deleteExpense(transactionId)
}
</script>

<template>
  <div class="grid gap-6">
    <section class="grid gap-4">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">資料維護</p>
          <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">固定開支</h1>
          <p class="mt-2 text-sm text-stone-600">管理會定期發生的支出，並查看本期預估總額。</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
          @click="openCreate"
        >
          <Plus class="size-4" aria-hidden="true" />
          新增固定開支
        </button>
      </div>

      <p v-if="appData.error.value" class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ appData.error.value }}
      </p>
    </section>

    <section class="grid gap-3 md:grid-cols-3">
      <MetricCard
        label="本期固定支出總額"
        :value="formatCurrency(appData.cycleFixedExpensesTotal.value, appData.currency.value)"
        :detail="`本期週期內預估固定支出`"
      />
      <MetricCard
        label="即將到期帳單"
        :value="`${appData.upcomingBills.value.length} 筆`"
        :detail="`未來 14 天內到期的固定開支`"
      />
      <MetricCard
        label="平均每筆固定開支"
        :value="formatCurrency(averageAmount, appData.currency.value)"
        :detail="`共 ${fixedExpenses.length} 筆固定開支`"
      />
    </section>

    <FixedExpensesList
      :fixed-expenses="fixedExpenses"
      :expense-categories="appData.activeExpenseCategories.value"
      :currency="appData.currency.value"
      @edit="openEdit"
      @delete="deleteExpense"
    />

    <FixedExpenseForm
      :show="isFormOpen"
      :expense-categories="appData.activeExpenseCategories.value"
      :currency="appData.currency.value"
      :transaction="editingTransaction"
      @close="closeForm"
      @create="createExpense"
      @update="updateExpense"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/FixedExpensesView.vue
git commit -m "feat: add fixed-expenses view page"
```

---

### Task 6: Link Dashboard Summary to Fixed Expenses Page

**Files:**
- Modify: `src/components/dailyFinance/RecurringExpensesSummary.vue`

**Interfaces:**
- Consumes: Vue Router.
- Produces: clickable header link to `/fixed-expenses`.

- [ ] **Step 1: Add router link to summary card**

Modify the header area of `src/components/dailyFinance/RecurringExpensesSummary.vue`:

```vue
<script setup lang="ts">
import { CalendarClock, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { UpcomingBill } from '@/lib/dailyFinance/recurringExpenses'

const props = defineProps<{
  fixedTotal: number
  upcomingBills: readonly UpcomingBill[]
  currency: string
}>()

const router = useRouter()

function goToFixedExpenses(): void {
  void router.push('/fixed-expenses')
}
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-stone-950">固定支出</h2>
        <p class="mt-1 text-sm text-stone-500">本期預估固定支出總額</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
        @click="goToFixedExpenses"
      >
        管理
        <ChevronRight class="size-3.5" aria-hidden="true" />
      </button>
    </div>

    <!-- ... rest unchanged ... -->
  </article>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dailyFinance/RecurringExpensesSummary.vue
git commit -m "feat: add manage link from dashboard fixed-expenses summary"
```

---

### Task 7: Verify Build, Tests, and Lint

**Files:**
- All modified/created files.

**Interfaces:**
- Produces: passing `bun test:unit`, `bun run build`, `bun lint`.

- [ ] **Step 1: Run unit tests**

Run: `bun test:unit`

Expected: PASS for all tests including the new helper tests.

- [ ] **Step 2: Run production build**

Run: `bun run build`

Expected: PASS with no TypeScript or Vue template errors.

- [ ] **Step 3: Run linter**

Run: `bun lint`

Expected: PASS with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify fixed-expenses page build and lint"
```

---

## Spec Coverage Checklist

| Spec Section | Task |
|---|---|
| Independent `/fixed-expenses` route | Task 2 |
| Sidebar placement in 資料維護 | Task 2 |
| Summary cards (total, upcoming, average) | Task 5 |
| Fixed expense list with edit/delete | Task 4 + Task 5 |
| Dedicated modal form | Task 3 + Task 5 |
| Reuse existing recurring model | Tasks 1–5 |
| Error handling / delete confirm | Task 3 + Task 4 |
| Testing helpers | Task 1 |

## Placeholder Scan

No TBD, TODO, or vague instructions remain. Every step includes file paths, code, and commands.

## Type Consistency Check

- `ExpenseDraft` uses `currency_code` and `exchange_rate_hkd` consistently with existing `TransactionForm.vue`.
- `getFrequencyLabel` and `getRecurringDayLabel` signatures match their usage in `FixedExpensesList.vue`.
- `CombinedTransaction` is used for the optional `transaction` prop in `FixedExpenseForm.vue` to reuse dashboard patterns.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-04-fixed-expenses-page.md`.

This is a small, focused feature. Inline execution in this session is sufficient.
