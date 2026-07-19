import { describe, expect, test, vi } from 'vitest'

const { mockTreaty } = vi.hoisted(() => {
  const proxy = new Proxy(() => undefined, {
    get: (_, property) => (property === 'then' ? undefined : proxy),
    apply: () => Promise.resolve({ data: null, error: null, status: 200 }),
  })

  return {
    mockTreaty: vi.fn(() => proxy),
  }
})

vi.mock('@elysiajs/eden', () => ({
  treaty: mockTreaty,
}))

import './client'

describe('Eden client configuration', () => {
  test('preserves API wire-format date strings', () => {
    expect(mockTreaty).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ parseDate: false }),
    )
  })
})
