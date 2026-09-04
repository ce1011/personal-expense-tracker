<script setup lang="ts">
import { computed, shallowRef } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import UiDatePicker from '@/components/ui/UiDatePicker.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import { fromDateInputValue, toDateInputValue } from '@/lib/date'

const props = defineProps<{
  submitting: boolean
}>()

const emit = defineEmits<{
  create: [payload: { name: string; expires_at?: number }]
}>()

type ExpiryPreset = 'never' | '30' | '90' | '365' | 'custom'

const name = shallowRef('')
const expiryPreset = shallowRef<ExpiryPreset>('never')
const customDate = shallowRef(toDateInputValue(Date.now() + 30 * 24 * 60 * 60 * 1000))

const expiryOptions = [
  { value: 'never', label: '永不逾期' },
  { value: '30', label: '30 日' },
  { value: '90', label: '90 日' },
  { value: '365', label: '1 年' },
  { value: 'custom', label: '自訂日期' },
] as const

const DAY_MS = 24 * 60 * 60 * 1000

const expiresAt = computed(() => {
  if (expiryPreset.value === 'never') {
    return undefined
  }
  if (expiryPreset.value === 'custom') {
    if (!customDate.value) {
      return undefined
    }
    return fromDateInputValue(customDate.value) + DAY_MS - 1
  }
  return Date.now() + Number(expiryPreset.value) * DAY_MS
})

const canSubmit = computed(() => {
  if (props.submitting || name.value.trim() === '') {
    return false
  }
  if (expiryPreset.value === 'custom') {
    return Boolean(customDate.value) && (expiresAt.value ?? 0) > Date.now()
  }
  return true
})

function submit(): void {
  if (!canSubmit.value) {
    return
  }

  emit('create', {
    name: name.value.trim(),
    expires_at: expiresAt.value,
  })
  name.value = ''
  expiryPreset.value = 'never'
}
</script>

<template>
  <BaseCard>
    <h2 class="text-h3 font-semibold text-text">新增 API 金鑰</h2>
    <p class="mt-1 text-body-sm text-text-2">
      金鑰只會在建立時顯示一次。現有頁面仍使用登入 token，不會接受 API 金鑰。
    </p>
    <form class="mt-4 grid gap-3" @submit.prevent="submit">
      <BaseInput v-model="name" label="名稱" name="api-key-name" placeholder="例如：個人腳本" />
      <UiSelect
        v-model="expiryPreset"
        label="有效期"
        name="api-key-expiry"
        :options="[...expiryOptions]"
      />
      <UiDatePicker v-if="expiryPreset === 'custom'" v-model="customDate" label="到期日" />
      <div class="flex justify-end">
        <BaseButton type="submit" :disabled="!canSubmit" :loading="submitting">
          建立金鑰
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>
