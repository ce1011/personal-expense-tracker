import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'

import { api, ApiError } from '@/api/client'
import type { PasskeyCredentialSummary } from '@/api/types'
import { clearAppContext } from '@/composables/useAppData'
import { clearToken, getToken, onUnauthorized, setToken } from '@/api/tokenStore'
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
  const supportsPasskeys = computed(() => {
    try {
      return browserSupportsWebAuthn()
    } catch {
      return false
    }
  })

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

  function applyAuthResponse(response: { user: AuthUser; accessToken: string }): void {
    // Prevent a successful account switch from retaining the previous user's
    // context while the app watcher initializes the new session.
    clearAppContext()
    setToken(response.accessToken)
    hasToken.value = true
    user.value = response.user
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await api.auth.login({ email, password })
    applyAuthResponse(response)
  }

  async function register(email: string, password: string, name?: string): Promise<void> {
    const response = await api.auth.register({ email, password, name })
    applyAuthResponse(response)
  }

  /**
   * Complete a WebAuthn authentication ceremony and store the resulting JWT.
   * When `email` is provided, options are scoped to that account; otherwise a
   * discoverable (usernameless) ceremony is requested.
   */
  async function loginWithPasskey(options?: {
    email?: string
    useBrowserAutofill?: boolean
  }): Promise<void> {
    const optionsJSON = await api.auth.passkey.loginOptions(
      options?.email ? { email: options.email } : {},
    )
    const assertion = await startAuthentication({
      optionsJSON: optionsJSON as never,
      useBrowserAutofill: options?.useBrowserAutofill === true,
    })
    const response = await api.auth.passkey.loginVerify(assertion as never)
    applyAuthResponse(response)
  }

  async function registerPasskey(friendlyName?: string): Promise<PasskeyCredentialSummary> {
    const optionsJSON = await api.auth.passkey.registerOptions()
    const attestation = await startRegistration({
      optionsJSON: optionsJSON as never,
    })
    return api.auth.passkey.registerVerify({
      response: attestation as never,
      friendly_name: friendlyName,
    })
  }

  async function listPasskeys(): Promise<PasskeyCredentialSummary[]> {
    return api.auth.passkeys.list()
  }

  async function renamePasskey(credentialId: string, friendlyName: string): Promise<PasskeyCredentialSummary> {
    return api.auth.passkeys.rename(credentialId, friendlyName)
  }

  async function removePasskey(credentialId: string): Promise<void> {
    await api.auth.passkeys.remove(credentialId)
  }

  async function supportsPasskeyAutofill(): Promise<boolean> {
    try {
      return await browserSupportsWebAuthnAutofill()
    } catch {
      return false
    }
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
    clearAppContext()
    clearToken()
    hasToken.value = false
    user.value = null
  }

  // The API layer owns status handling; the store owns reactive session teardown.
  onUnauthorized(clearSession)

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
    supportsPasskeys,
    restore,
    login,
    register,
    loginWithPasskey,
    registerPasskey,
    listPasskeys,
    renamePasskey,
    removePasskey,
    supportsPasskeyAutofill,
    logout,
    handleUnauthorized,
    _resetReady,
    _setAuthenticated,
  }
})
