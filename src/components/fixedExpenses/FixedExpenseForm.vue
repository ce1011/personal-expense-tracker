<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import BaseModal from '@/components/common/BaseModal.vue'
import type { ExpenseCategory, ExpenseDraft, ExpenseTransaction } from '@/types/app-data'

const props = defineProps<{
  show: boolean
  expenseCategories: readonly ExpenseCategory[]
  currency: string
  transaction?: ExpenseTransaction
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
    date: props.transaction?.date ?? Date.now(),
    currency_code: props.currency as 'HKD',
    exchange_rate_hkd: 1,
    recurring: true,
    recurring_frequency: form.recurring_frequency,
    recurring_day: form.recurring_day,
  }

  if (props.transaction) {
    emit('update', props.transaction.transaction_id, draft)
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
          <span v-if="errors.recurring_day" class="text-xs text-red-600">{{
            errors.recurring_day
          }}</span>
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
