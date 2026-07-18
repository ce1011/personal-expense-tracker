import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { api, ApiError } from '@/api/client'
import { clearToken, getToken, setToken } from '@/api/tokenStore'
import type { AuthUser } from '@/api/types'

/**
 * Authentication state backed by the Elysia backend's JWT Bearer auth.
 *
 * The access token is persisted in localStorage (see `api/tokenStore`); this
 * store mirrors "is there a token" into a reactive ref (`hasToken`) so the
 * router guard and components react to login/logout. `localStorage` itself is
 * not reactive, so we must never compute auth state straight from `getToken()`.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const ready = ref(false)
  // Reactive mirror of token presence — seeded from storage, updated on every
  // login/logout/unauthorized so dependents (the router guard) re-evaluate.
  const hasToken = ref(getToken() !== null)

  const isAuthenticated = computed(() => hasToken.value)

  /** Restore the session from the persisted token (called once on boot). */
  async function restore(): Promise<void> {
    if (ready.value) {
      return
    }

    if (!hasToken.value) {
      ready.value = true
      return
    }

    try {
      const { user: me } = await api.auth.me()
      user.value = { id: me.id, email: me.email }
    } catch (caught) {
      // A 401 means the stored token is invalid/expired — drop it.
      if (caught instanceof ApiError && caught.status === 401) {
        clearSession()
      } else {
        user.value = null
      }
    } finally {
      ready.value = true
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await api.auth.login({ email, password })
    setToken(response.accessToken)
    hasToken.value = true
    user.value = response.user
  }

  async function register(email: string, password: string, name?: string): Promise<void> {
    const response = await api.auth.register({ email, password, name })
    setToken(response.accessToken)
    hasToken.value = true
    user.value = response.user
  }

  async function logout(): Promise<void> {
    try {
      await api.auth.logout()
    } catch {
      // Stateless JWT: even if the call fails, the client discards the token.
    }

    clearSession()
  }

  /** Force-clear local session state (e.g. after a 401 from any request). */
  function handleUnauthorized(): void {
    clearSession()
  }

  function clearSession(): void {
    clearToken()
    hasToken.value = false
    user.value = null
  }

  /** Test seam: reset the restored-session flag so the guard re-evaluates. */
  function _resetReady(): void {
    ready.value = false
  }

  /** Test seam: mark the session authenticated without a network round-trip. */
  function _setAuthenticated(token = 'test-token', authUser: AuthUser | null = null): void {
    setToken(token)
    hasToken.value = true
    user.value = authUser ?? { id: 'user-1', email: 'test@example.com' }
  }

  return {
    user,
    ready,
    isAuthenticated,
    restore,
    login,
    register,
    logout,
    handleUnauthorized,
    _resetReady,
    _setAuthenticated,
  }
})
