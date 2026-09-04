<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

import BaseButton from '@/components/base/BaseButton.vue'
import UiDialog from '@/components/ui/UiDialog.vue'

const props = defineProps<{
  open: boolean
  name: string
  secret: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const copied = shallowRef(false)

const isOpen = computed({
  get() {
    return props.open
  },
  set(value: boolean) {
    if (!value) {
      copied.value = false
    }
    emit('update:open', value)
  },
})

async function copySecret(): Promise<void> {
  if (!props.secret) {
    return
  }
  try {
    await navigator.clipboard.writeText(props.secret)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <UiDialog
    v-model:open="isOpen"
    title="請立即複製金鑰"
    subtitle="此密鑰只會顯示一次，關閉後無法再查看。"
  >
    <p class="text-body-sm text-text-2">{{ name }}</p>
    <p
      class="mt-3 break-all rounded-xl border border-border bg-accent px-3 py-2 font-mono text-sm text-text"
    >
      {{ secret }}
    </p>
    <div class="mt-4 flex justify-end gap-2">
      <BaseButton variant="secondary" @click="copySecret">
        <Check v-if="copied" class="size-4" aria-hidden="true" />
        <Copy v-else class="size-4" aria-hidden="true" />
        {{ copied ? '已複製' : '複製金鑰' }}
      </BaseButton>
      <BaseButton @click="isOpen = false">完成</BaseButton>
    </div>
  </UiDialog>
</template>
