import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  cachedRequest,
  clearRequestCache,
  invalidateRequestCache,
  requestCacheKey,
} from './requestCache'

beforeEach(() => {
  clearRequestCache()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('requestCache', () => {
  test('shares an in-flight request and reuses its value during the TTL', async () => {
    let resolveRequest: (value: string) => void = () => undefined
    const pending = new Promise<string>((resolve) => {
      resolveRequest = resolve
    })
    const loader = vi.fn(() => pending)

    const first = cachedRequest('dashboard', loader, { ttlMs: 10_000, tags: ['dashboard'] })
    const second = cachedRequest('dashboard', loader, { ttlMs: 10_000, tags: ['dashboard'] })

    expect(second).toBe(first)
    expect(loader).toHaveBeenCalledOnce()

    resolveRequest('fresh')
    await expect(first).resolves.toBe('fresh')
    await expect(
      cachedRequest('dashboard', loader, { ttlMs: 10_000, tags: ['dashboard'] }),
    ).resolves.toBe('fresh')
    expect(loader).toHaveBeenCalledOnce()
  })

  test('reloads expired entries', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-24T00:00:00Z'))
    const loader = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    await cachedRequest('summary', loader, { ttlMs: 1_000, tags: ['budgets'] })
    vi.advanceTimersByTime(1_001)

    await expect(
      cachedRequest('summary', loader, { ttlMs: 1_000, tags: ['budgets'] }),
    ).resolves.toBe('second')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  test('invalidates only entries matching a mutation tag', async () => {
    const dashboardLoader = vi.fn().mockResolvedValue('dashboard')
    const budgetsLoader = vi.fn().mockResolvedValue('budgets')

    await cachedRequest('dashboard', dashboardLoader, {
      ttlMs: 10_000,
      tags: ['dashboard'],
    })
    await cachedRequest('budgets', budgetsLoader, { ttlMs: 10_000, tags: ['budgets'] })

    invalidateRequestCache(['dashboard'])
    await cachedRequest('dashboard', dashboardLoader, {
      ttlMs: 10_000,
      tags: ['dashboard'],
    })
    await cachedRequest('budgets', budgetsLoader, { ttlMs: 10_000, tags: ['budgets'] })

    expect(dashboardLoader).toHaveBeenCalledTimes(2)
    expect(budgetsLoader).toHaveBeenCalledOnce()
  })

  test('does not re-cache an in-flight result invalidated by a mutation', async () => {
    let resolveRequest: (value: string) => void = () => undefined
    const pending = new Promise<string>((resolve) => {
      resolveRequest = resolve
    })
    const loader = vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce('after-mutation')

    const staleRequest = cachedRequest('dashboard', loader, {
      ttlMs: 10_000,
      tags: ['dashboard'],
    })
    invalidateRequestCache(['dashboard'])
    resolveRequest('before-mutation')
    await staleRequest

    await expect(
      cachedRequest('dashboard', loader, { ttlMs: 10_000, tags: ['dashboard'] }),
    ).resolves.toBe('after-mutation')
    expect(loader).toHaveBeenCalledTimes(2)
  })

  test('does not cache failures', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('recovered')

    await expect(
      cachedRequest('dashboard', loader, { ttlMs: 10_000, tags: ['dashboard'] }),
    ).rejects.toThrow('offline')
    await expect(
      cachedRequest('dashboard', loader, { ttlMs: 10_000, tags: ['dashboard'] }),
    ).resolves.toBe('recovered')
  })

  test('normalizes query keys independent of property order and undefined values', () => {
    expect(requestCacheKey('transactions', { kind: 'all', q: undefined, limit: 50 })).toBe(
      requestCacheKey('transactions', { limit: 50, kind: 'all' }),
    )
  })
})
