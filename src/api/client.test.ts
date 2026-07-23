import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockTreaty, mockHttpRequest } = vi.hoisted(() => {
  const mockHttpRequest = vi.fn(() =>
    Promise.resolve({ data: { currency: 'HKD' }, error: null, status: 200 }),
  )
  const proxy = new Proxy(() => undefined, {
    get: (_, property) => (property === 'then' ? undefined : proxy),
    apply: () => mockHttpRequest(),
  })

  return {
    mockTreaty: vi.fn(() => proxy),
    mockHttpRequest,
  }
})

vi.mock('@elysiajs/eden', () => ({
  treaty: mockTreaty,
}))

import { clearRequestCache } from './requestCache'
import { api } from './client'

beforeEach(() => {
  clearRequestCache()
  mockHttpRequest.mockClear()
})

describe('Eden client configuration', () => {
  test('preserves API wire-format date strings', () => {
    expect(mockTreaty).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ parseDate: false }),
    )
  })

  test('collapses concurrent dashboard aggregate reads', async () => {
    const first = api.dashboard.get()
    const second = api.dashboard.get()

    expect(second).toBe(first)
    expect(mockHttpRequest).toHaveBeenCalledOnce()
    await Promise.all([first, second])
  })
})
