<script setup lang="ts">
import { shallowRef } from 'vue'
import { Download, Upload } from 'lucide-vue-next'

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

  if (!window.confirm('Replace all local expense tracker data with this backup?')) {
    return
  }

  await appData.restorePayload(parsed.payload)
  restoreText.value = ''
  restoreStatus.value = 'Restore complete.'
}
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Data safety</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">Settings</h1>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-stone-950">Backup</h2>
            <p class="mt-1 text-sm text-stone-500">Export a complete AppDataPayload JSON file.</p>
          </div>
          <Download class="size-5 text-emerald-800" aria-hidden="true" />
        </div>
        <button type="button" class="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white" @click="exportBackup">
          Export JSON backup
        </button>
      </section>

      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-stone-950">Restore</h2>
            <p class="mt-1 text-sm text-stone-500">Restore validates first, then replaces all local IndexedDB data.</p>
          </div>
          <Upload class="size-5 text-stone-700" aria-hidden="true" />
        </div>

        <label class="mt-4 grid gap-1 text-sm font-medium text-stone-700">
          Choose backup file
          <input type="file" accept="application/json,.json" class="rounded-md border border-stone-300 bg-white px-3 py-2" @change="readFile" />
        </label>

        <label class="mt-3 grid gap-1 text-sm font-medium text-stone-700">
          Or paste backup JSON
          <textarea
            v-model="restoreText"
            rows="8"
            class="rounded-md border border-stone-300 px-3 py-2 font-mono text-xs"
            placeholder="{ &quot;cycles&quot;: [], ... }"
          />
        </label>

        <div v-if="restoreErrors.length" class="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p class="font-semibold">Restore failed validation</p>
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
          Validate and replace local data
        </button>
      </section>
    </div>
  </div>
</template>
