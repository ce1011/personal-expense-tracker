<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

import ApiKeyCreateForm from '@/components/apiKeys/ApiKeyCreateForm.vue'
import ApiKeySecretDialog from '@/components/apiKeys/ApiKeySecretDialog.vue'
import ApiKeysList from '@/components/apiKeys/ApiKeysList.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SkeletonList from '@/components/base/SkeletonList.vue'
import { useApiKeys } from '@/composables/useApiKeys'
import { useToast } from '@/composables/useToast'
import type { CreateApiKeyBody } from '@/api/types'

const router = useRouter()
const { toast } = useToast()
const { keys, loading, creating, revokingId, error, createdSecret, create, revoke, dismissSecret } =
  useApiKeys()

const secretDialogOpen = computed({
  get() {
    return createdSecret.value !== null
  },
  set(open: boolean) {
    if (!open) {
      dismissSecret()
    }
  },
})

async function handleCreate(payload: CreateApiKeyBody): Promise<void> {
  const ok = await create(payload)
  if (ok) {
    toast({ description: '已建立 API 金鑰' })
  }
}

async function handleRevoke(id: string): Promise<void> {
  const ok = await revoke(id)
  if (ok) {
    toast({ description: '已撤銷 API 金鑰' })
  }
}
</script>

<template>
  <div class="grid gap-4">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">帳戶</p>
      <h1 class="mt-1 text-h1 font-bold text-text">API 金鑰</h1>
      <p class="mt-1 text-body-sm text-text-2">
        為個人腳本建立具名稱與到期日的金鑰。登入後的網站功能仍使用原本的 JWT。
      </p>
      <BaseButton class="mt-3" variant="ghost" @click="router.push({ name: 'settings' })">
        <ChevronLeft class="size-4" aria-hidden="true" />
        返回設定
      </BaseButton>
    </header>

    <p v-if="error" class="rounded-xl bg-danger/5 px-3 py-2 text-body-sm text-danger">
      {{ error }}
    </p>

    <ApiKeyCreateForm :submitting="creating" @create="handleCreate" />

    <SkeletonList v-if="loading && keys.length === 0" :rows="3" />
    <ApiKeysList v-else :keys="keys" :revoking-id="revokingId" @revoke="handleRevoke" />

    <ApiKeySecretDialog
      v-model:open="secretDialogOpen"
      :name="createdSecret?.name ?? ''"
      :secret="createdSecret?.secret ?? ''"
    />
  </div>
</template>
