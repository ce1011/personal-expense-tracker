<script setup lang="ts">
import { Pause, Play, Plus, Trash2 } from 'lucide-vue-next'
import { computed, shallowRef } from 'vue'

import type { ChallengeProgress } from '@/lib/dailyFinance/savingChallenges'
import { formatCurrency } from '@/lib/formatters'
import ProgressBar from '@/components/common/ProgressBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { SavingChallenge } from '@/types/app-data'

defineProps<{
  challenges: readonly ChallengeProgress[]
  currency: string
}>()

const emit = defineEmits<{
  create: [name: string, target_amount: number]
  updateStatus: [challengeId: string, status: SavingChallenge['status']]
  delete: [challengeId: string]
}>()

const isCreating = shallowRef(false)
const newName = shallowRef('')
const newTarget = shallowRef('')

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

function confirmDelete(challengeId: string): void {
  if (confirm('確定要刪除這個儲蓄挑戰嗎？相關紀錄將一併移除。')) {
    emit('delete', challengeId)
  }
}

function statusColorClass(status: SavingChallenge['status']): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-600'
    case 'paused':
      return 'bg-amber-500'
    case 'completed':
      return 'bg-stone-400'
  }
}
</script>

<template>
  <article class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold text-stone-950">儲蓄挑戰</h2>
        <p class="mt-1 text-sm text-stone-500">追蹤小目標進度，儲蓄可綁定挑戰累積</p>
      </div>
      <button
        v-if="!isCreating"
        type="button"
        class="inline-flex items-center gap-1 rounded-md bg-emerald-800 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-900"
        @click="startCreate"
      >
        <Plus class="size-3.5" aria-hidden="true" />
        新增
      </button>
    </div>

    <form
      v-if="isCreating"
      class="mb-4 space-y-3 rounded-md border border-dashed border-stone-200 bg-stone-50 p-3"
    >
      <div>
        <label for="challenge-name" class="block text-xs font-medium text-stone-700"
          >挑戰名稱</label
        >
        <input
          id="challenge-name"
          v-model="newName"
          type="text"
          class="mt-1 block w-full rounded-md border border-stone-300 px-2.5 py-1.5 text-sm focus:border-emerald-800 focus:outline-none"
          placeholder="例如：旅行基金"
        />
      </div>
      <div>
        <label for="challenge-target" class="block text-xs font-medium text-stone-700"
          >目標金額</label
        >
        <input
          id="challenge-target"
          v-model="newTarget"
          type="number"
          min="1"
          step="1"
          class="mt-1 block w-full rounded-md border border-stone-300 px-2.5 py-1.5 text-sm focus:border-emerald-800 focus:outline-none"
          placeholder="0"
        />
      </div>
      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
          @click="cancelCreate"
        >
          取消
        </button>
        <button
          type="submit"
          class="rounded-md bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50"
          :disabled="!canCreate"
          @click.prevent="submitCreate"
        >
          建立
        </button>
      </div>
    </form>

    <div v-if="challenges.length" class="space-y-4">
      <div v-for="challenge in challenges" :key="challenge.challenge_id" class="space-y-2">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="font-medium text-stone-900">{{ challenge.name }}</span>
          <div class="flex items-center gap-2">
            <span
              class="text-xs font-semibold"
              :class="{
                'text-emerald-700': challenge.status === 'active',
                'text-amber-700': challenge.status === 'paused',
                'text-stone-500': challenge.status === 'completed',
              }"
            >
              {{
                challenge.status === 'active'
                  ? '進行中'
                  : challenge.status === 'paused'
                    ? '已暫停'
                    : '已完成'
              }}
            </span>
            <button
              type="button"
              class="rounded-md p-1 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
              :aria-label="challenge.status === 'active' ? '暫停挑戰' : '繼續挑戰'"
              :title="challenge.status === 'active' ? '暫停' : '繼續'"
              @click="toggleStatus(challenge)"
            >
              <Pause v-if="challenge.status === 'active'" class="size-3.5" aria-hidden="true" />
              <Play v-else class="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded-md p-1 text-stone-500 transition hover:bg-red-50 hover:text-red-700"
              aria-label="刪除挑戰"
              title="刪除"
              @click="confirmDelete(challenge.challenge_id)"
            >
              <Trash2 class="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <ProgressBar
          :percentage="challenge.percentage"
          :color-class="statusColorClass(challenge.status)"
        />

        <p class="text-right text-xs text-stone-500">
          {{ formatCurrency(challenge.current_amount, currency) }} /
          {{ formatCurrency(challenge.target_amount, currency) }} ·
          {{ Math.round(challenge.percentage) }}%
        </p>
      </div>
    </div>

    <EmptyState v-else title="目前沒有儲蓄挑戰" message="新增一個小目標，開始累積進度。" />
  </article>
</template>
