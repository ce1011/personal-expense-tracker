<script setup lang="ts">
import {
  CalendarDays,
  Download,
  FileText,
  Globe,
  LayoutGrid,
  Receipt,
  RefreshCw,
  Tag,
  Upload,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { shallowRef } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { useAppData } from '@/composables/useAppData'
import { parseBackupJson } from '@/lib/backup'

const appData = useAppData()
const router = useRouter()

const menuItems = [
  { label: '預算週期', to: '/budgets', icon: CalendarDays, color: 'bg-primary/10 text-primary' },
  { label: '分類管理', to: '/categories', icon: Tag, color: 'bg-primary/10 text-primary' },
  { label: '固定開支', to: '/fixed-expenses', icon: Receipt, color: 'bg-warning/10 text-warning' },
  { label: '旅程', to: '/trips', icon: Globe, color: 'bg-info/10 text-info' },
  {
    label: '每月快照',
    to: '/monthly-snapshot',
    icon: FileText,
    color: 'bg-primary/10 text-primary',
  },
  {
    label: 'JSON 匯入',
    to: '/import-transactions',
    icon: Upload,
    color: 'bg-primary/10 text-primary',
  },
]

const restoreText = shallowRef('')
const restoreErrors = shallowRef<string[]>([])
const restoreStatus = shallowRef('')

function exportBackup(): void {
  const json = JSON.stringify(appData.data.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

async function readFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  restoreText.value = await file.text()
}

async function restoreBackup(): Promise<void> {
  restoreStatus.value = ''
  const parsed = parseBackupJson(restoreText.value)
  restoreErrors.value = parsed.errors

  if (!parsed.payload) {
    return
  }

  if (!window.confirm('確定要用這份備份完整覆蓋本機收支資料嗎？')) {
    return
  }

  await appData.restorePayload(parsed.payload)
  restoreText.value = ''
  restoreStatus.value = '還原完成。'
}

function refreshAppVersion(): void {
  const url = new URL(window.location.href)
  url.searchParams.set('refresh', String(Date.now()))
  window.location.replace(url.toString())
}
</script>

<template>
  <div class="grid gap-4">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">更多</p>
      <h1 class="mt-1 text-h1 font-bold text-text">設定與資料</h1>
      <p class="mt-1 text-body-sm text-text-2">預算週期、分類、固定開支、旅程與資料維護入口。</p>
    </header>

    <BaseCard>
      <div class="flex items-center gap-2">
        <LayoutGrid class="size-5 text-primary" aria-hidden="true" />
        <h2 class="text-h3 font-semibold text-text">快速入口</h2>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          v-for="item in menuItems"
          :key="item.to"
          type="button"
          class="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center transition hover:border-primary/50"
          @click="router.push(item.to)"
        >
          <span
            class="inline-flex size-11 items-center justify-center rounded-full"
            :class="item.color"
          >
            <component :is="item.icon" class="size-5" aria-hidden="true" />
          </span>
          <span class="text-body-sm font-semibold text-text">{{ item.label }}</span>
        </button>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-2">
          <RefreshCw class="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 class="text-h3 font-semibold text-text">App 更新</h2>
            <p class="text-body-sm text-text-2">
              重新載入目前頁面並加上更新參數，盡量抓取 GitHub Pages 的最新版本。
            </p>
          </div>
        </div>
      </div>
      <p class="mt-3 text-caption text-text-3">
        在 iPhone 主畫面 Web App 上，若仍看到舊版本，可能還需要完全關閉 App 再打開一次。
      </p>
      <BaseButton class="mt-4" @click="refreshAppVersion">
        <RefreshCw class="size-4" aria-hidden="true" />
        重新載入最新版本
      </BaseButton>
    </BaseCard>

    <div class="grid gap-4 md:grid-cols-2">
      <BaseCard>
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-2">
            <Download class="size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 class="text-h3 font-semibold text-text">備份</h2>
              <p class="text-body-sm text-text-2">匯出完整的 AppDataPayload JSON 檔案。</p>
            </div>
          </div>
        </div>
        <BaseButton class="mt-4" @click="exportBackup">
          <Download class="size-4" aria-hidden="true" />
          匯出 JSON 備份
        </BaseButton>
      </BaseCard>

      <BaseCard>
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-2">
            <Upload class="size-5 text-primary" aria-hidden="true" />
            <div>
              <h2 class="text-h3 font-semibold text-text">還原</h2>
              <p class="text-body-sm text-text-2">
                會先驗證內容，通過後才整體覆蓋本機 IndexedDB 資料。
              </p>
            </div>
          </div>
        </div>

        <label class="mt-4 grid gap-1 text-sm font-medium text-text-2">
          選擇備份檔
          <input
            type="file"
            accept="application/json,.json"
            class="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-body-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            @change="readFile"
          />
        </label>

        <label class="mt-3 grid gap-1 text-sm font-medium text-text-2">
          或直接貼上備份 JSON
          <textarea
            v-model="restoreText"
            rows="6"
            class="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder='{ "cycles": [], ... }'
          />
        </label>

        <div
          v-if="restoreErrors.length"
          class="mt-3 rounded-xl border border-danger/20 bg-danger/5 p-3 text-body-sm text-danger"
        >
          <p class="font-semibold">還原驗證失敗</p>
          <ul class="mt-1 list-disc pl-5">
            <li v-for="error in restoreErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <p
          v-if="restoreStatus"
          class="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-body-sm text-primary"
        >
          {{ restoreStatus }}
        </p>

        <BaseButton class="mt-4" :disabled="!restoreText.trim()" @click="restoreBackup">
          驗證並覆蓋本機資料
        </BaseButton>
      </BaseCard>
    </div>
  </div>
</template>
