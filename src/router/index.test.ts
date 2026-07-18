import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import router from './index'
import { clearToken } from '@/api/tokenStore'
import { useAuthStore } from '@/stores/auth'

// The router guard calls `auth.restore()` → `api.auth.me()`; mock it so session
// restoration resolves deterministically without a real network request.
const mockAuthMe = vi.hoisted(() => vi.fn())
const mockAuthLogin = vi.hoisted(() => vi.fn())

vi.mock('@/api/client', () => ({
  api: {
    auth: {
      me: mockAuthMe,
      login: mockAuthLogin,
    },
  },
  ApiError: class ApiError extends Error {
    constructor(
      public readonly status: number,
      public readonly value: unknown,
    ) {
      super(`status ${status}`)
      this.name = 'ApiError'
    }
  },
}))

describe('router', () => {
  beforeEach(() => {
    // Fresh Pinia per test; reset the auth store's restored-session flag so the
    // guard re-evaluates auth from the (cleared) token store on each navigation.
    setActivePinia(createPinia())
    clearToken()
    mockAuthMe.mockReset()
    mockAuthMe.mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com' } })
    mockAuthLogin.mockReset()
    useAuthStore()._resetReady()
  })

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
  ])('resolves $path to route $name when authenticated', async ({ path, name }) => {
    useAuthStore()._setAuthenticated()
    await router.push(path)
    await router.isReady()
    expect(router.currentRoute.value.name).toBe(name)
  })

  test('registers a public login route', () => {
    const login = router.getRoutes().find((route) => route.name === 'login')
    expect(login).toBeDefined()
    expect(login?.meta.public).toBe(true)
  })

  // Regression test for the login-redirect bug: the guard must see the user as
  // authenticated immediately after login() (reactive auth state), so the
  // post-login navigation to '/' is not bounced back to '/login'.
  test('after login, navigating to / resolves to dashboard (not back to login)', async () => {
    clearToken()
    useAuthStore()._resetReady()

    // Boot unauthenticated at '/', guard redirects to /login.
    await router.push('/')
    await router.isReady()
    for (let i = 0; i < 12; i += 1) {
      await Promise.resolve()
    }
    expect(router.currentRoute.value.name).toBe('login')

    // Successful login stores the token and updates reactive auth state.
    const auth = useAuthStore()
    mockAuthLogin.mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com' }, accessToken: 'tok' })
    await auth.login('test@example.com', 'password123')
    expect(auth.isAuthenticated).toBe(true)

    await router.replace('/')
    await router.isReady()
    for (let i = 0; i < 12; i += 1) {
      await Promise.resolve()
    }
    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})
