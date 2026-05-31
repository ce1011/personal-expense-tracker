<script setup lang="ts">
import { shallowRef } from 'vue'
import { Download, RefreshCw, Upload } from 'lucide-vue-next'

import { useAppData } from '@/composables/useAppData'
import { parseBackupJson } from '@/lib/backup'

const appData = useAppData()
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
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">資料安全</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">設定</h1>
    </section>

    <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-stone-950">App 更新</h2>
          <p class="mt-1 text-sm text-stone-500">重新載入目前頁面並加上更新參數，盡量抓取 GitHub Pages 的最新版本。</p>
          <p class="mt-2 text-xs text-stone-400">在 iPhone 主畫面 Web App 上，若仍看到舊版本，可能還需要完全關閉 App 再打開一次。</p>
        </div>
        <RefreshCw class="size-5 text-stone-700" aria-hidden="true" />
      </div>

      <button
        type="button"
        class="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
        @click="refreshAppVersion"
      >
        重新載入最新版本
      </button>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-stone-950">備份</h2>
            <p class="mt-1 text-sm text-stone-500">匯出完整的 AppDataPayload JSON 檔案。</p>
          </div>
          <Download class="size-5 text-emerald-800" aria-hidden="true" />
        </div>
        <button type="button" class="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white" @click="exportBackup">
          匯出 JSON 備份
        </button>
      </section>

      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-stone-950">還原</h2>
            <p class="mt-1 text-sm text-stone-500">會先驗證內容，通過後才整體覆蓋本機 IndexedDB 資料。</p>
          </div>
          <Upload class="size-5 text-stone-700" aria-hidden="true" />
        </div>

        <label class="mt-4 grid gap-1 text-sm font-medium text-stone-700">
          選擇備份檔
          <input type="file" accept="application/json,.json" class="rounded-md border border-stone-300 bg-white px-3 py-2" @change="readFile" />
        </label>

        <label class="mt-3 grid gap-1 text-sm font-medium text-stone-700">
          或直接貼上備份 JSON
          <textarea
            v-model="restoreText"
            rows="8"
            class="rounded-md border border-stone-300 px-3 py-2 font-mono text-xs"
            placeholder="{ &quot;cycles&quot;: [], ... }"
          />
        </label>

        <div v-if="restoreErrors.length" class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p class="font-semibold">還原驗證失敗</p>
          <ul class="mt-1 list-disc pl-5">
            <li v-for="error in restoreErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <p v-if="restoreStatus" class="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          {{ restoreStatus }}
        </p>

        <button
          type="button"
          class="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
          :disabled="!restoreText.trim()"
          @click="restoreBackup"
        >
          驗證並覆蓋本機資料
        </button>
      </section>
    </div>
  </div>
</template>
