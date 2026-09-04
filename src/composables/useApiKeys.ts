import { onMounted, readonly, shallowRef } from 'vue'

import { api, ApiError } from '@/api/client'
import type { ApiKeyCreated, ApiKeySummary, CreateApiKeyBody } from '@/api/types'

function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return '已達 API 金鑰數量上限'
    }
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '操作失敗，請稍後再試'
}

export function useApiKeys() {
  const keys = shallowRef<ApiKeySummary[]>([])
  const loading = shallowRef(false)
  const creating = shallowRef(false)
  const revokingId = shallowRef('')
  const error = shallowRef('')
  const createdSecret = shallowRef<ApiKeyCreated | null>(null)
  let requestVersion = 0

  async function refresh(): Promise<void> {
    const version = ++requestVersion
    loading.value = true
    error.value = ''

    try {
      const nextKeys = await api.apiKeys.list()
      if (version === requestVersion) {
        keys.value = nextKeys
      }
    } catch (caught) {
      if (version === requestVersion) {
        error.value = toUserMessage(caught)
      }
    } finally {
      if (version === requestVersion) {
        loading.value = false
      }
    }
  }

  async function create(body: CreateApiKeyBody): Promise<boolean> {
    creating.value = true
    error.value = ''

    try {
      const created = await api.apiKeys.create(body)
      createdSecret.value = created
      await refresh()
      return true
    } catch (caught) {
      error.value = toUserMessage(caught)
      return false
    } finally {
      creating.value = false
    }
  }

  async function revoke(id: string): Promise<boolean> {
    revokingId.value = id
    error.value = ''

    try {
      await api.apiKeys.revoke(id)
      await refresh()
      return true
    } catch (caught) {
      error.value = toUserMessage(caught)
      return false
    } finally {
      revokingId.value = ''
    }
  }

  function dismissSecret(): void {
    createdSecret.value = null
  }

  onMounted(() => {
    void refresh()
  })

  return {
    keys: readonly(keys),
    loading: readonly(loading),
    creating: readonly(creating),
    revokingId: readonly(revokingId),
    error: readonly(error),
    createdSecret: readonly(createdSecret),
    refresh,
    create,
    revoke,
    dismissSecret,
  }
}
