<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { Check, Cloud, CloudOff, RefreshCw, TriangleAlert } from 'lucide-vue-next'

import { useAppData } from '@/composables/useAppData'

const props = defineProps<{
  pageLoading?: boolean
}>()

const appData = useAppData()
const isOnline = shallowRef(true)

const isSyncing = computed(() =>
  Boolean(props.pageLoading || appData.loading.value || appData.pendingActions.value > 0),
)
const hasError = computed(() => Boolean(appData.error.value))

const state = computed(() => {
  if (!isOnline.value) {
    return {
      label: '離線',
      detail: '重新連線後再同步',
      icon: CloudOff,
      tone: 'offline',
    } as const
  }

  if (hasError.value) {
    return {
      label: '同步受阻',
      detail: appData.error.value,
      icon: TriangleAlert,
      tone: 'error',
    } as const
  }

  if (isSyncing.value) {
    return {
      label: appData.pendingActions.value > 0 ? '正在安全儲存' : '正在取得最新資料',
      detail: '連接伺服器',
      icon: RefreshCw,
      tone: 'syncing',
    } as const
  }

  if (appData.lastSyncedAt.value) {
    return {
      label: '已同步',
      detail: '所有變更已儲存',
      icon: Check,
      tone: 'synced',
    } as const
  }

  return {
    label: '雲端連線',
    detail: '登入後自動同步',
    icon: Cloud,
    tone: 'idle',
  } as const
})

function updateOnlineStatus(): void {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  updateOnlineStatus()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<template>
  <div
    class="sync-pulse"
    :class="`sync-pulse--${state.tone}`"
    role="status"
    aria-live="polite"
    :title="state.detail"
  >
    <span class="sync-pulse__signal" aria-hidden="true">
      <span class="sync-pulse__halo" />
      <component :is="state.icon" class="sync-pulse__icon" />
    </span>
    <span class="sync-pulse__copy">
      <span class="sync-pulse__label">{{ state.label }}</span>
      <span class="sync-pulse__detail">{{ state.detail }}</span>
    </span>
  </div>
</template>

<style scoped>
.sync-pulse {
  --sync-color: var(--color-primary);
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid color-mix(in srgb, var(--sync-color) 18%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, white 84%, transparent);
  padding: 0.35rem 0.65rem 0.35rem 0.4rem;
  color: var(--color-text-2);
  box-shadow: 0 8px 24px rgb(67 40 119 / 8%);
  backdrop-filter: blur(16px);
  transition:
    border-color 220ms ease,
    box-shadow 220ms ease,
    transform 220ms ease;
}

.sync-pulse:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgb(67 40 119 / 13%);
}

.sync-pulse--synced {
  --sync-color: var(--color-success);
}

.sync-pulse--offline,
.sync-pulse--error {
  --sync-color: var(--color-danger);
}

.sync-pulse__signal {
  position: relative;
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sync-color) 12%, white);
  color: var(--sync-color);
}

.sync-pulse__halo {
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--sync-color) 50%, transparent);
  border-radius: inherit;
  opacity: 0;
}

.sync-pulse--syncing .sync-pulse__halo {
  animation: sync-halo 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.sync-pulse__icon {
  width: 0.9rem;
  height: 0.9rem;
  stroke-width: 2.4;
}

.sync-pulse--syncing .sync-pulse__icon {
  animation: sync-spin 1.15s linear infinite;
}

.sync-pulse__copy {
  display: grid;
  min-width: 0;
  line-height: 1.05;
}

.sync-pulse__label {
  overflow: hidden;
  max-width: 9.5rem;
  font-size: 0.7rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sync-pulse__detail {
  display: none;
  margin-top: 0.2rem;
  color: var(--color-text-3);
  font-size: 0.6rem;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .sync-pulse__detail {
    display: block;
  }
}

@media (max-width: 390px) {
  .sync-pulse {
    padding-right: 0.5rem;
  }

  .sync-pulse__copy {
    display: none;
  }
}

@keyframes sync-halo {
  0% {
    opacity: 0.75;
    transform: scale(0.45);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@keyframes sync-spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
