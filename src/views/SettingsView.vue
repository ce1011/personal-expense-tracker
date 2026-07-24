<script setup lang="ts">
import {
  CalendarDays,
  Download,
  FileText,
  Fingerprint,
  Globe,
  LayoutGrid,
  LogOut,
  Pencil,
  Receipt,
  RefreshCw,
  Tag,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { computed, onMounted, shallowRef } from 'vue'
import { WebAuthnError } from '@simplewebauthn/browser'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import type { PasskeyCredentialSummary } from '@/api/types'
import { ApiError } from '@/api/client'
import RecoveryHistoryCard from '@/components/settings/RecoveryHistoryCard.vue'
import RestoreImpactCard from '@/components/settings/RestoreImpactCard.vue'
import { useAppData } from '@/composables/useAppData'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useAuthStore } from '@/stores/auth'

const appData = useAppData()
const { confirmDanger } = useConfirmDialog()
const auth = useAuthStore()
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

const passkeys = shallowRef<PasskeyCredentialSummary[]>([])
const passkeysLoading = shallowRef(false)
const passkeyBusy = shallowRef(false)
const passkeyError = shallowRef('')
const passkeyStatus = shallowRef('')
const newPasskeyName = shallowRef('')
const renamingId = shallowRef<string | null>(null)
const renameValue = shallowRef('')
const restoreStatus = shallowRef('')
const restoreImpact = shallowRef<{
  cycles: number
  expenseCategories: number
  incomeCategories: number
  expenses: number
  incomes: number
  targetExpenses: number
  savings: number
  settings: number
  trips: number
  fxRates: number
  savingChallenges: number
}>()
const isPreviewingRestore = shallowRef(false)
const isRestoringSnapshotId = shallowRef('')
const restoreIntegrityErrors = computed(() => restoreErrors.value)

onMounted(() => {
  void appData.loadRecoverySnapshots()
  void loadPasskeys()
})

async function exportBackup(): Promise<void> {
  const payload = await appData.exportBackupPayload()
  const json = JSON.stringify(payload, null, 2)
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
  restoreImpact.value = undefined
  isPreviewingRestore.value = true

  try {
    const preview = await appData.getRestorePreview(restoreText.value)
    restoreErrors.value = preview.errors
    restoreImpact.value = preview.impact

    if (!preview.payload || preview.errors.length > 0) {
      return
    }

    const confirmed = await confirmDanger({
      title: '還原備份',
      description: `將覆蓋 ${preview.impact?.expenses ?? 0} 筆支出、${preview.impact?.expenseCategories ?? 0} 個支出分類、${preview.impact?.cycles ?? 0} 個預算週期。確定繼續？`,
      confirmLabel: '還原',
    })

    if (!confirmed) {
      restoreStatus.value = '已取消還原。'
      return
    }

    await appData.restorePayload(preview.payload)
    restoreText.value = ''
    restoreStatus.value = '還原完成，並已先保存一份可回復快照。'
    await appData.loadRecoverySnapshots()
  } finally {
    isPreviewingRestore.value = false
  }
}

async function restoreSnapshot(snapshotId: string): Promise<void> {
  restoreStatus.value = ''
  isRestoringSnapshotId.value = snapshotId

  try {
    const confirmed = await confirmDanger({
      title: '還原版本',
      description: '還原此版本前，系統會先保存目前資料作保護快照。確定繼續？',
      confirmLabel: '還原',
    })

    if (!confirmed) {
      return
    }

    await appData.restoreSnapshot(snapshotId)
    restoreStatus.value = '已還原指定版本，並已保存目前版本作回復保護。'
    await appData.loadRecoverySnapshots()
  } finally {
    isRestoringSnapshotId.value = ''
  }
}

function refreshAppVersion(): void {
  const url = new URL(window.location.href)
  url.searchParams.set('refresh', String(Date.now()))
  window.location.replace(url.toString())
}

function formatPasskeyDate(value: number | null | undefined): string {
  if (!value) return '尚未使用'
  return new Date(value).toLocaleString('zh-HK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadPasskeys(): Promise<void> {
  if (!auth.isAuthenticated) {
    passkeys.value = []
    return
  }

  passkeysLoading.value = true
  passkeyError.value = ''
  try {
    passkeys.value = await auth.listPasskeys()
  } catch (caught) {
    passkeyError.value =
      caught instanceof ApiError
        ? caught.message || '無法載入 Passkey 列表。'
        : '無法載入 Passkey 列表。'
  } finally {
    passkeysLoading.value = false
  }
}

async function addPasskey(): Promise<void> {
  if (passkeyBusy.value) return
  passkeyBusy.value = true
  passkeyError.value = ''
  passkeyStatus.value = ''
  try {
    const created = await auth.registerPasskey(newPasskeyName.value.trim() || undefined)
    newPasskeyName.value = ''
    passkeyStatus.value = `已新增 Passkey「${created.friendly_name}」。`
    await loadPasskeys()
  } catch (caught) {
    if (caught instanceof WebAuthnError && caught.name === 'NotAllowedError') {
      passkeyError.value = '已取消 Passkey 註冊。'
    } else if (caught instanceof ApiError) {
      passkeyError.value = caught.message || '新增 Passkey 失敗。'
    } else if (caught instanceof Error && /not allowed|abort/i.test(caught.message)) {
      passkeyError.value = '已取消 Passkey 註冊。'
    } else {
      passkeyError.value = '新增 Passkey 失敗，請確認裝置支援後再試。'
    }
  } finally {
    passkeyBusy.value = false
  }
}

function beginRename(passkey: PasskeyCredentialSummary): void {
  renamingId.value = passkey.id
  renameValue.value = passkey.friendly_name
  passkeyError.value = ''
  passkeyStatus.value = ''
}

function cancelRename(): void {
  renamingId.value = null
  renameValue.value = ''
}

async function saveRename(credentialId: string): Promise<void> {
  if (passkeyBusy.value) return
  const name = renameValue.value.trim()
  if (!name) {
    passkeyError.value = '請輸入 Passkey 名稱。'
    return
  }

  passkeyBusy.value = true
  passkeyError.value = ''
  try {
    await auth.renamePasskey(credentialId, name)
    cancelRename()
    passkeyStatus.value = '已更新 Passkey 名稱。'
    await loadPasskeys()
  } catch (caught) {
    passkeyError.value =
      caught instanceof ApiError ? caught.message || '重新命名失敗。' : '重新命名失敗。'
  } finally {
    passkeyBusy.value = false
  }
}

async function deletePasskey(passkey: PasskeyCredentialSummary): Promise<void> {
  const confirmed = await confirmDanger({
    title: '移除 Passkey',
    description: `確定移除「${passkey.friendly_name}」？此裝置將不能再用它登入。`,
    confirmLabel: '移除',
  })
  if (!confirmed) return

  passkeyBusy.value = true
  passkeyError.value = ''
  passkeyStatus.value = ''
  try {
    await auth.removePasskey(passkey.id)
    passkeyStatus.value = '已移除 Passkey。'
    await loadPasskeys()
  } catch (caught) {
    passkeyError.value =
      caught instanceof ApiError ? caught.message || '移除失敗。' : '移除失敗。'
  } finally {
    passkeyBusy.value = false
  }
}

async function logout(): Promise<void> {
  await auth.logout()
  await router.replace({ name: 'login' })
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

        <RestoreImpactCard
          v-if="restoreImpact"
          class="mt-4"
          :impact="restoreImpact"
          :integrity-errors="restoreIntegrityErrors"
        />

        <p
          v-if="restoreStatus"
          class="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-body-sm text-primary"
        >
          {{ restoreStatus }}
        </p>

        <BaseButton
          class="mt-4"
          :disabled="!restoreText.trim() || isPreviewingRestore"
          @click="restoreBackup"
        >
          {{ isPreviewingRestore ? '驗證中...' : '驗證並覆蓋本機資料' }}
        </BaseButton>
      </BaseCard>
    </div>

    <RecoveryHistoryCard
      :snapshots="appData.recoverySnapshots.value"
      :restoring-snapshot-id="isRestoringSnapshotId"
      @restore="restoreSnapshot"
    />

    <BaseCard>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <Fingerprint class="size-5 text-primary" aria-hidden="true" />
          <div>
            <h2 class="text-h3 font-semibold text-text">帳戶</h2>
            <p class="text-body-sm text-text-2">
              {{ auth.user?.email ? `目前已登入：${auth.user.email}` : '管理你的登入狀態。' }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-5 border-t border-border/70 pt-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-body font-semibold text-text">Passkeys</h3>
            <p class="mt-1 text-body-sm text-text-2">
              用 Face ID、Touch ID 或裝置鎖定快速登入。密碼登入仍然可用。
            </p>
          </div>
        </div>

        <p v-if="passkeysLoading" class="mt-3 text-body-sm text-text-3">載入中…</p>

        <ul v-else-if="passkeys.length" class="mt-3 grid gap-2">
          <li
            v-for="passkey in passkeys"
            :key="passkey.id"
            class="rounded-xl border border-border/80 bg-surface px-3 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <template v-if="renamingId === passkey.id">
                  <BaseInput
                    v-model="renameValue"
                    label="名稱"
                    name="passkey-name"
                    autocomplete="off"
                  />
                  <div class="mt-2 flex flex-wrap gap-2">
                    <BaseButton
                     
                      :disabled="passkeyBusy"
                      @click="saveRename(passkey.id)"
                    >
                      儲存
                    </BaseButton>
                    <BaseButton variant="ghost" :disabled="passkeyBusy" @click="cancelRename">
                      取消
                    </BaseButton>
                  </div>
                </template>
                <template v-else>
                  <p class="truncate font-semibold text-text">{{ passkey.friendly_name }}</p>
                  <p class="mt-1 text-caption text-text-3">
                    {{ passkey.backed_up ? '已同步' : '此裝置' }}
                    · 建立於 {{ formatPasskeyDate(passkey.created_at) }}
                    · 最近使用 {{ formatPasskeyDate(passkey.last_used_at) }}
                  </p>
                </template>
              </div>
              <div v-if="renamingId !== passkey.id" class="flex shrink-0 gap-1">
                <BaseButton
                 
                  variant="ghost"
                  :disabled="passkeyBusy"
                  :aria-label="`重新命名 ${passkey.friendly_name}`"
                  @click="beginRename(passkey)"
                >
                  <Pencil class="size-4" aria-hidden="true" />
                </BaseButton>
                <BaseButton
                 
                  variant="ghost"
                  :disabled="passkeyBusy"
                  :aria-label="`移除 ${passkey.friendly_name}`"
                  @click="deletePasskey(passkey)"
                >
                  <Trash2 class="size-4 text-danger" aria-hidden="true" />
                </BaseButton>
              </div>
            </div>
          </li>
        </ul>

        <p v-else class="mt-3 rounded-xl bg-accent/50 px-3 py-2 text-body-sm text-text-2">
          尚未新增 Passkey。新增後，登入頁可一鍵使用生物辨識。
        </p>

        <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <BaseInput
            v-model="newPasskeyName"
            label="新 Passkey 名稱（選填）"
            name="new-passkey-name"
            autocomplete="off"
            placeholder="例如：iPhone、MacBook"
            :disabled="passkeyBusy || !auth.supportsPasskeys"
          />
          <BaseButton
            class="sm:mb-0.5"
            :loading="passkeyBusy"
            :disabled="!auth.supportsPasskeys"
            @click="addPasskey"
          >
            <Fingerprint class="size-4" aria-hidden="true" />
            新增 Passkey
          </BaseButton>
        </div>

        <p v-if="!auth.supportsPasskeys" class="mt-2 text-caption text-text-3">
          此瀏覽器不支援 Passkey。
        </p>
        <p
          v-if="passkeyError"
          class="mt-3 rounded-xl border border-danger/20 bg-danger/5 p-3 text-body-sm text-danger"
          role="alert"
        >
          {{ passkeyError }}
        </p>
        <p
          v-if="passkeyStatus"
          class="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-body-sm text-primary"
        >
          {{ passkeyStatus }}
        </p>
      </div>

      <BaseButton class="mt-5" variant="secondary" @click="logout">
        <LogOut class="size-4" aria-hidden="true" />
        登出
      </BaseButton>
    </BaseCard>
  </div>
</template>
