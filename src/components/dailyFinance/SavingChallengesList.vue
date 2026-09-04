<script setup lang="ts">
import { Pause, Play, Plus, Trash2 } from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'

import BaseCard from '@/components/base/BaseCard.vue'
import UiNumberField from '@/components/ui/UiNumberField.vue'
import UiProgress from '@/components/ui/UiProgress.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import EmptyState from '@/components/base/EmptyState.vue'
import type { ChallengeProgress } from '@/lib/dailyFinance/savingChallenges'
import { formatCurrency } from '@/lib/formatters'
import type { SavingChallenge } from '@/types/app-data'

defineProps<{
  challenges: readonly ChallengeProgress[]
  currency: string
}>()

const { confirmDanger } = useConfirmDialog()

const emit = defineEmits<{
  create: [name: string, target_amount: number]
  updateStatus: [challengeId: string, status: SavingChallenge['status']]
  delete: [challengeId: string]
}>()

const isCreating = shallowRef(false)
const newName = shallowRef('')
const newTarget = shallowRef('')

const newTargetNumber = computed({
  get() {
    const parsed = Number(newTarget.value)
    return Number.isFinite(parsed) ? parsed : 0
  },
  set(value: number) {
    newTarget.value = String(value || '')
  },
})

const canCreate = computed(() => newName.value.trim() !== '' && Number(newTarget.value) > 0)

function startCreate(): void {
  isCreating.value = true
}

function cancelCreate(): void {
  isCreating.value = false
  newName.value = ''
  newTarget.value = ''
}

function submitCreate(): void {
  if (!canCreate.value) {
    return
  }

  emit('create', newName.value.trim(), Number(newTarget.value))
  cancelCreate()
}

function toggleStatus(challenge: ChallengeProgress): void {
  const next = challenge.status === 'active' ? 'paused' : 'active'
  emit('updateStatus', challenge.challenge_id, next)
}

async function confirmDelete(challengeId: string): Promise<void> {
  const confirmed = await confirmDanger({
    title: '刪除儲蓄挑戰',
    description: '確定要刪除這個儲蓄挑戰嗎？相關紀錄將一併移除。',
    confirmLabel: '刪除',
  })
  if (confirmed) {
    emit('delete', challengeId)
  }
}

function statusColorClass(status: SavingChallenge['status']): string {
  switch (status) {
    case 'active':
      return 'bg-primary'
    case 'paused':
      return 'bg-warning'
    case 'completed':
      return 'bg-text-3'
  }
}

function statusTextClass(status: SavingChallenge['status']): string {
  switch (status) {
    case 'active':
      return 'text-primary'
    case 'paused':
      return 'text-warning'
    case 'completed':
      return 'text-text-3'
  }
}

function statusLabel(status: SavingChallenge['status']): string {
  switch (status) {
    case 'active':
      return '進行中'
    case 'paused':
      return '已暫停'
    case 'completed':
      return '已完成'
  }
}
</script>

<template>
  <BaseCard>
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-text">儲蓄挑戰</h2>
        <p class="mt-1 text-sm text-text-2">追蹤小目標進度，儲蓄可綁定挑戰累積</p>
      </div>
      <button
        v-if="!isCreating"
        type="button"
        class="inline-flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-2"
        @click="startCreate"
      >
        <Plus class="size-3.5" aria-hidden="true" />
        新增
      </button>
    </div>

    <form
      v-if="isCreating"
      class="mb-4 space-y-3 rounded-xl border border-dashed border-border bg-accent p-3"
      @submit.prevent="submitCreate"
    >
      <div>
        <label for="challenge-name" class="block text-xs font-medium text-text-2">挑戰名稱</label>
        <input
          id="challenge-name"
          v-model="newName"
          type="text"
          class="input-base mt-1"
          placeholder="例如：旅行基金"
        />
      </div>
      <UiNumberField v-model="newTargetNumber" label="目標金額" :min="1" :step="1" />
      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:bg-accent"
          @click="cancelCreate"
        >
          取消
        </button>
        <button
          type="submit"
          class="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-2 disabled:opacity-50"
          :disabled="!canCreate"
        >
          建立
        </button>
      </div>
    </form>

    <div v-if="challenges.length" class="space-y-4">
      <div v-for="challenge in challenges" :key="challenge.challenge_id" class="space-y-2">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="font-medium text-text">{{ challenge.name }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold" :class="statusTextClass(challenge.status)">
              {{ statusLabel(challenge.status) }}
            </span>
            <button
              type="button"
              class="inline-flex size-8 items-center justify-center rounded-full text-text-3 transition hover:bg-accent hover:text-text"
              :aria-label="challenge.status === 'active' ? '暫停挑戰' : '繼續挑戰'"
              :title="challenge.status === 'active' ? '暫停' : '繼續'"
              @click="toggleStatus(challenge)"
            >
              <Pause v-if="challenge.status === 'active'" class="size-3.5" aria-hidden="true" />
              <Play v-else class="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="inline-flex size-8 items-center justify-center rounded-full text-text-3 transition hover:bg-danger/5 hover:text-danger"
              aria-label="刪除挑戰"
              title="刪除"
              @click="confirmDelete(challenge.challenge_id)"
            >
              <Trash2 class="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <UiProgress
          :percentage="challenge.percentage"
          :color-class="statusColorClass(challenge.status)"
        />

        <p class="text-right text-xs text-text-2">
          {{ formatCurrency(challenge.current_amount, currency) }} /
          {{ formatCurrency(challenge.target_amount, currency) }} ·
          {{ Math.round(challenge.percentage) }}%
        </p>
      </div>
    </div>

    <EmptyState
      v-else
      :icon="Plus"
      title="目前沒有儲蓄挑戰"
      message="新增一個小目標，開始累積進度。"
    />
  </BaseCard>
</template>
