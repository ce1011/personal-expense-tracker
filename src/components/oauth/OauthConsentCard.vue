<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'

defineProps<{
  clientName: string
  accountEmail: string
  submitting: boolean
}>()

const emit = defineEmits<{
  allow: []
  deny: []
}>()
</script>

<template>
  <BaseCard class="p-5 sm:p-6">
    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grok 連接器</p>
    <h1 class="mt-2 text-2xl font-bold tracking-tight text-text">授權 {{ clientName }}</h1>
    <p class="mt-2 text-body-sm leading-6 text-text-2">
      目前登入為
      <span class="font-semibold text-text">{{ accountEmail || '你的帳戶' }}</span>
      。允許後，Grok 可以代你記帳與查詢開支，不會取得你的密碼。
    </p>

    <ul class="mt-4 grid gap-2 text-body-sm text-text-2">
      <li class="rounded-xl bg-accent px-3 py-2">讀取分類、預算與交易</li>
      <li class="rounded-xl bg-accent px-3 py-2">新增、修改或刪除開支、收入與儲蓄</li>
    </ul>

    <div class="mt-5 grid gap-2 sm:grid-cols-2">
      <BaseButton variant="secondary" :disabled="submitting" @click="emit('deny')">拒絕</BaseButton>
      <BaseButton :loading="submitting" :disabled="submitting" @click="emit('allow')">允許</BaseButton>
    </div>
  </BaseCard>
</template>
