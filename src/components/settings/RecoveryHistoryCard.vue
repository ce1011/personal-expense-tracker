<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatDate } from '@/lib/formatters'

export interface RecoveryHistoryItem {
  snapshotId: string
  createdAt: number
  reason: string
}

defineProps<{
  snapshots: readonly RecoveryHistoryItem[]
  restoringSnapshotId?: string
}>()

const emit = defineEmits<{
  restore: [snapshotId: string]
}>()

function formatReason(reason: string): string {
  switch (reason) {
    case 'expense:create':
      return '新增支出後自動快照'
    case 'income:create':
      return '新增收入後自動快照'
    case 'saving:create':
      return '新增儲蓄後自動快照'
    case 'transactions:import':
      return '批量匯入後自動快照'
    case 'restore:before':
      return '還原前保護快照'
    default:
      return reason
  }
}
</script>

<template>
  <BaseCard>
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-h3 font-semibold text-text">最近快照</h2>
        <p class="mt-1 text-body-sm text-text-2">保留最近自動保存版本，可用作本機回復。</p>
      </div>
      <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
        {{ snapshots.length }} 個
      </span>
    </div>

    <div v-if="snapshots.length" class="mt-4 space-y-3">
      <div
        v-for="snapshot in snapshots"
        :key="snapshot.snapshotId"
        class="rounded-xl border border-border bg-surface px-3 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-text">{{ formatReason(snapshot.reason) }}</p>
            <p class="mt-1 text-xs text-text-3">{{ formatDate(snapshot.createdAt) }}</p>
          </div>
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="restoringSnapshotId === snapshot.snapshotId"
            @click="emit('restore', snapshot.snapshotId)"
          >
            {{ restoringSnapshotId === snapshot.snapshotId ? '還原中...' : '還原此版本' }}
          </BaseButton>
        </div>
      </div>
    </div>

    <p v-else class="mt-4 text-body-sm text-text-3">暫時未有可用快照。</p>
  </BaseCard>
</template>
