<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import BaseBottomSheet from '@/components/base/BaseBottomSheet.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
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

const categoryOptions = computed(() =>
  props.expenseCategories.map((category) => ({
    value: category.category_id,
    label: category.name_tc || category.name_en,
  })),
)

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
  <BaseBottomSheet
    :show="show"
    :title="isEditing ? '修改固定開支' : '新增固定開支'"
    :subtitle="isEditing ? '更新這筆固定開支的內容' : '建立一筆會定期發生的開支'"
    @close="close"
  >
    <form class="grid gap-4" @submit.prevent="submit">
      <BaseInput
        v-model.trim="form.name"
        label="名稱"
        placeholder="例如：租金、水電費、會員費"
        :error="errors.name"
        autocomplete="off"
      />

      <BaseInput
        v-model.number="form.amount"
        label="金額 ({{ currency }})"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="0.00"
        :error="errors.amount"
      />

      <BaseSelect
        v-model="form.category_id"
        label="分類"
        :options="categoryOptions"
        :error="errors.category_id"
      />

      <div class="grid gap-4 md:grid-cols-2">
        <BaseSelect v-model="form.recurring_frequency" label="週期" :options="frequencyOptions" />

        <BaseSelect
          v-if="form.recurring_frequency === 'weekly'"
          v-model.number="form.recurring_day"
          label="星期"
          :options="weeklyDayOptions"
          :error="errors.recurring_day"
        />
        <BaseInput
          v-else
          v-model.number="form.recurring_day"
          label="到期日"
          type="number"
          :min="dayMin"
          :max="dayMax"
          :error="errors.recurring_day"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <BaseButton variant="secondary" type="button" @click="close">取消</BaseButton>
        <BaseButton type="submit">{{ isEditing ? '儲存修改' : '新增固定開支' }}</BaseButton>
      </div>
    </form>
  </BaseBottomSheet>
</template>
