<script setup lang="ts">
import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { History } from 'lucide-vue-next'

import BaseCard from '@/components/base/BaseCard.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatCurrency } from '@/lib/formatters'

const props = defineProps<{
  remainingBudget: number
  incomeTotal: number
  expenseTotal: number
  savingTotal: number
  currency: string
  cycleLabel?: string
}>()

const emit = defineEmits<{
  weeklyReview: []
}>()

const spendingPercentage = computed(() =>
  props.incomeTotal > 0 ? (props.expenseTotal / props.incomeTotal) * 100 : 0,
)
const isOverBudget = computed(() => props.remainingBudget < 0)
const displayedRemaining = shallowRef(0)
let animationFrame: number | undefined

function animateRemaining(target: number): void {
  if (animationFrame !== undefined) {
    window.cancelAnimationFrame(animationFrame)
  }

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion || typeof window.requestAnimationFrame !== 'function') {
    displayedRemaining.value = target
    return
  }

  const from = displayedRemaining.value
  const startedAt = performance.now()
  const duration = 720

  function step(now: number): void {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = 1 - Math.pow(1 - progress, 4)
    displayedRemaining.value = from + (target - from) * eased

    if (progress < 1) {
      animationFrame = window.requestAnimationFrame(step)
    }
  }

  animationFrame = window.requestAnimationFrame(step)
}

watch(
  () => props.remainingBudget,
  (value) => animateRemaining(value),
  { immediate: true },
)

onUnmounted(() => {
  if (animationFrame !== undefined) {
    window.cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <BaseCard variant="primary" class="hero-card relative overflow-hidden">
    <div class="hero-card__orbit hero-card__orbit--one" aria-hidden="true" />
    <div class="hero-card__orbit hero-card__orbit--two" aria-hidden="true" />
    <button
      type="button"
      class="hero-card__history absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center rounded-full text-primary-2"
      aria-label="上週回顧"
      @click="emit('weeklyReview')"
    >
      <History class="size-5" aria-hidden="true" />
    </button>

    <div class="relative z-[1]">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-2">本期結餘</p>
      <p
        class="money-figure mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
        :class="isOverBudget ? 'text-danger' : 'text-text'"
      >
        {{ formatCurrency(displayedRemaining, currency) }}
      </p>
      <p class="mt-1 text-sm text-text-2">
        收入 {{ formatCurrency(incomeTotal, currency) }} − 支出
        {{ formatCurrency(expenseTotal, currency) }}
      </p>
      <p v-if="savingTotal > 0" class="mt-1 text-sm text-text-2">
        − 儲蓄 {{ formatCurrency(savingTotal, currency) }}
      </p>
      <p v-if="cycleLabel" class="mt-1 text-xs text-text-3">{{ cycleLabel }}</p>

      <div class="mt-4">
        <ProgressBar
          :percentage="spendingPercentage"
          color-class="bg-primary"
          size="md"
          :label="`支出佔收入 ${Math.round(spendingPercentage)}%`"
        />
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.hero-card {
  min-height: 13rem;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 82%), rgb(243 232 255 / 72%)), var(--color-surface);
  box-shadow:
    0 24px 60px rgb(91 33 182 / 12%),
    inset 0 1px 0 white;
}

.hero-card__orbit {
  position: absolute;
  border: 1px solid rgb(124 58 237 / 10%);
  border-radius: 999px;
  pointer-events: none;
}

.hero-card__orbit--one {
  top: -7rem;
  right: -4rem;
  width: 17rem;
  height: 17rem;
  animation: hero-orbit 14s linear infinite;
}

.hero-card__orbit--two {
  top: -3.2rem;
  right: -0.2rem;
  width: 9rem;
  height: 9rem;
  border-color: rgb(45 212 191 / 18%);
  animation: hero-orbit 10s linear infinite reverse;
}

.hero-card__orbit::after {
  position: absolute;
  top: 50%;
  left: -0.22rem;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: var(--color-primary);
  box-shadow: 0 0 0 5px rgb(124 58 237 / 8%);
  content: '';
}

.hero-card__orbit--two::after {
  background: var(--color-success);
  box-shadow: 0 0 0 5px rgb(20 184 166 / 8%);
}

.hero-card__history {
  background: rgb(255 255 255 / 48%);
  backdrop-filter: blur(12px);
  transition:
    background-color 180ms ease,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-card__history:hover {
  background: rgb(124 58 237 / 10%);
  transform: rotate(-12deg) scale(1.06);
}

@keyframes hero-orbit {
  to {
    transform: rotate(1turn);
  }
}
</style>
