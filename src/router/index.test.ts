import { describe, expect, test } from 'vitest'

import router from './index'

describe('router', () => {
  test.each([
    { path: '/', name: 'dashboard' },
    { path: '/transactions', name: 'transactions' },
    { path: '/import-transactions', name: 'import-transactions' },
    { path: '/budgets', name: 'budgets' },
    { path: '/category-budget', name: 'category-budget' },
    { path: '/categories', name: 'categories' },
    { path: '/fixed-expenses', name: 'fixed-expenses' },
    { path: '/trips', name: 'trips' },
    { path: '/monthly-snapshot', name: 'monthly-snapshot' },
    { path: '/settings', name: 'settings' },
  ])('resolves $path to route $name', async ({ path, name }) => {
    await router.push(path)
    await router.isReady()
    expect(router.currentRoute.value.name).toBe(name)
  })
})
