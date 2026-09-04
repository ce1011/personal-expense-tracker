<script setup lang="ts">
import { KeyRound, Trash2 } from 'lucide-vue-next'

import type { ApiKeySummary } from '@/api/types'
import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { formatDate } from '@/lib/formatters'

defineProps<{
  keys: readonly ApiKeySummary[]
  revokingId: string
}>()

const emit = defineEmits<{
  revoke: [id: string]
}>()

const { confirmDanger } = useConfirmDialog()

async function confirmRevoke(key: ApiKeySummary): Promise<void> {
  const confirmed = await confirmDanger({
    title: '撤銷 API 金鑰',
    description: `確定要撤銷「${key.name}」嗎？撤銷後無法再使用。`,
    confirmLabel: '撤銷',
  })
  if (confirmed) {
    emit('revoke', key.api_key_id)
  }
}

function expiryLabel(key: ApiKeySummary): string {
  return key.expires_at ? formatDate(key.expires_at) : '永不逾期'
}

function lastUsedLabel(key: ApiKeySummary): string {
  return key.last_used_at ? formatDate(key.last_used_at) : '尚未使用'
}
</script>

<template>
  <BaseCard>
    <h2 class="text-h3 font-semibold text-text">已建立的金鑰</h2>
    <p class="mt-1 text-body-sm text-text-2">完整密鑰不會再次顯示，請妥善保存。</p>

    <EmptyState
      v-if="keys.length === 0"
      class="mt-4"
      :icon="KeyRound"
      title="尚未建立 API 金鑰"
      message="建立金鑰後，可在此查看名稱、前綴、到期日與最近使用時間。"
    />

    <div v-else class="mt-4 grid gap-2">
      <div
        v-for="key in keys"
        :key="key.api_key_id"
        class="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-3"
      >
        <div class="min-w-0">
          <p class="truncate text-body-sm font-semibold text-text">{{ key.name }}</p>
          <p class="mt-0.5 font-mono text-caption text-text-2">{{ key.prefix }}…</p>
          <p class="mt-2 text-caption text-text-3">
            建立於 {{ formatDate(key.created_at) }} · 到期 {{ expiryLabel(key) }}
          </p>
          <p class="text-caption text-text-3">最近使用：{{ lastUsedLabel(key) }}</p>
        </div>
        <button
          type="button"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-danger transition hover:bg-danger/10 disabled:opacity-50"
          :disabled="revokingId === key.api_key_id"
          :aria-label="`撤銷 ${key.name}`"
          @click="confirmRevoke(key)"
        >
          <Trash2 class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </BaseCard>
</template>
