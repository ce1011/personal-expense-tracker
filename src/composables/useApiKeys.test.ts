import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockList, mockCreate, mockRevoke } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockRevoke: vi.fn(),
}))

vi.mock('@/api/client', () => {
  class ApiError extends Error {
    constructor(
      public readonly status: number,
      public readonly value: unknown,
    ) {
      super(`status ${status}`)
      this.name = 'ApiError'
    }
  }

  return {
    api: {
      apiKeys: {
        list: mockList,
        create: mockCreate,
        revoke: mockRevoke,
      },
    },
    ApiError,
  }
})

import { ApiError } from '@/api/client'
import { useApiKeys } from './useApiKeys'

function captureApiKeys() {
  let apiKeys: ReturnType<typeof useApiKeys> | undefined
  const Host = defineComponent({
    setup() {
      apiKeys = useApiKeys()
      return () => null
    },
  })
  const wrapper = mount(Host)
  return { apiKeys: apiKeys!, wrapper }
}

describe('useApiKeys', () => {
  beforeEach(() => {
    mockList.mockReset()
    mockCreate.mockReset()
    mockRevoke.mockReset()
    mockList.mockResolvedValue([])
  })

  test('loads keys on mount', async () => {
    mockList.mockResolvedValue([
      {
        api_key_id: 'api-key-1',
        name: 'cli',
        prefix: 'pet_ak_abcd',
        created_at: 1,
      },
    ])

    const { apiKeys, wrapper } = captureApiKeys()
    await flushPromises()

    expect(mockList).toHaveBeenCalledOnce()
    expect(apiKeys.keys.value).toHaveLength(1)
    expect(apiKeys.keys.value[0]?.name).toBe('cli')
    wrapper.unmount()
  })

  test('create stores the one-time secret and refreshes the list', async () => {
    const created = {
      api_key_id: 'api-key-2',
      name: 'bot',
      prefix: 'pet_ak_efgh',
      created_at: 2,
      secret: 'pet_ak_secret',
    }
    mockCreate.mockResolvedValue(created)
    mockList.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        api_key_id: created.api_key_id,
        name: created.name,
        prefix: created.prefix,
        created_at: created.created_at,
      },
    ])

    const { apiKeys, wrapper } = captureApiKeys()
    await flushPromises()

    const ok = await apiKeys.create({ name: 'bot' })
    await flushPromises()

    expect(ok).toBe(true)
    expect(apiKeys.createdSecret.value?.secret).toBe('pet_ak_secret')
    expect(apiKeys.keys.value).toHaveLength(1)
    wrapper.unmount()
  })

  test('maps a 409 create error to a Chinese limit message', async () => {
    mockCreate.mockRejectedValue(new ApiError(409, { error: { message: 'API key limit reached' } }))

    const { apiKeys, wrapper } = captureApiKeys()
    await flushPromises()

    const ok = await apiKeys.create({ name: 'overflow' })
    expect(ok).toBe(false)
    expect(apiKeys.error.value).toBe('已達 API 金鑰數量上限')
    wrapper.unmount()
  })

  test('revoke refreshes the remaining keys', async () => {
    mockList
      .mockResolvedValueOnce([
        { api_key_id: 'api-key-1', name: 'cli', prefix: 'pet_ak_abcd', created_at: 1 },
      ])
      .mockResolvedValueOnce([])
    mockRevoke.mockResolvedValue({ revoked: true })

    const { apiKeys, wrapper } = captureApiKeys()
    await flushPromises()

    const ok = await apiKeys.revoke('api-key-1')
    await flushPromises()

    expect(ok).toBe(true)
    expect(mockRevoke).toHaveBeenCalledWith('api-key-1')
    expect(apiKeys.keys.value).toEqual([])
    wrapper.unmount()
  })
})
