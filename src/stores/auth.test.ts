import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { clearToken, setToken } from '@/api/tokenStore'
import { useAuthStore } from '@/stores/auth'

const mockAuthMe = vi.hoisted(() => vi.fn())
const mockLogin = vi.hoisted(() => vi.fn())
const mockRegister = vi.hoisted(() => vi.fn())
const mockLogout = vi.hoisted(() => vi.fn())
const mockLoginOptions = vi.hoisted(() => vi.fn())
const mockLoginVerify = vi.hoisted(() => vi.fn())
const mockRegisterOptions = vi.hoisted(() => vi.fn())
const mockRegisterVerify = vi.hoisted(() => vi.fn())
const mockPasskeysList = vi.hoisted(() => vi.fn())
const mockStartAuthentication = vi.hoisted(() => vi.fn())
const mockStartRegistration = vi.hoisted(() => vi.fn())
const mockBrowserSupportsWebAuthn = vi.hoisted(() => vi.fn(() => true))
const mockBrowserSupportsWebAuthnAutofill = vi.hoisted(() => vi.fn(async () => false))

vi.mock('@/api/client', () => ({
  api: {
    auth: {
      me: mockAuthMe,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      passkey: {
        loginOptions: mockLoginOptions,
        loginVerify: mockLoginVerify,
        registerOptions: mockRegisterOptions,
        registerVerify: mockRegisterVerify,
      },
      passkeys: {
        list: mockPasskeysList,
        rename: vi.fn(),
        remove: vi.fn(),
      },
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

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: mockBrowserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill: mockBrowserSupportsWebAuthnAutofill,
  startAuthentication: mockStartAuthentication,
  startRegistration: mockStartRegistration,
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearToken()
    mockAuthMe.mockReset()
    mockLogin.mockReset()
    mockRegister.mockReset()
    mockLogout.mockReset()
    mockLoginOptions.mockReset()
    mockLoginVerify.mockReset()
    mockRegisterOptions.mockReset()
    mockRegisterVerify.mockReset()
    mockPasskeysList.mockReset()
    mockStartAuthentication.mockReset()
    mockStartRegistration.mockReset()
    mockBrowserSupportsWebAuthn.mockReturnValue(true)
    mockBrowserSupportsWebAuthnAutofill.mockResolvedValue(false)
  })

  test('starts unauthenticated with no token and restore marks it ready', async () => {
    const auth = useAuthStore()
    auth._resetReady()

    expect(auth.isAuthenticated).toBe(false)

    await auth.restore()

    expect(auth.ready).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
    expect(mockAuthMe).not.toHaveBeenCalled()
  })

  test('restore loads the current user when a valid token exists', async () => {
    setToken('stored-token')
    mockAuthMe.mockResolvedValue({ user: { id: 'user-1', email: 'a@b.com' } })

    const auth = useAuthStore()
    auth._resetReady()
    await auth.restore()

    expect(mockAuthMe).toHaveBeenCalledTimes(1)
    expect(auth.user).toEqual({ id: 'user-1', email: 'a@b.com' })
    expect(auth.isAuthenticated).toBe(true)
  })

  test('restore drops an invalid token on 401', async () => {
    setToken('stale-token')
    const { ApiError } = await import('@/api/client')
    mockAuthMe.mockRejectedValue(new ApiError(401, {}))

    const auth = useAuthStore()
    auth._resetReady()
    await auth.restore()

    expect(auth.user).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  test('login stores the token and user', async () => {
    mockLogin.mockResolvedValue({
      user: { id: 'user-2', email: 'c@d.com' },
      accessToken: 'new-token',
    })

    const auth = useAuthStore()
    await auth.login('c@d.com', 'password123')

    expect(mockLogin).toHaveBeenCalledWith({ email: 'c@d.com', password: 'password123' })
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.email).toBe('c@d.com')
  })

  // Root cause of the login-redirect bug: isAuthenticated must react to login()
  // /logout() without re-reading (non-reactive) localStorage.
  test('isAuthenticated is reactive across login and logout', async () => {
    mockLogin.mockResolvedValue({
      user: { id: 'user-3', email: 'x@y.com' },
      accessToken: 'reactive-token',
    })
    mockLogout.mockResolvedValue({ ok: true })

    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)

    await auth.login('x@y.com', 'password123')
    expect(auth.isAuthenticated).toBe(true)

    await auth.logout()
    expect(auth.isAuthenticated).toBe(false)
  })

  test('logout clears the token and user', async () => {
    setToken('token')
    mockLogout.mockResolvedValue({ ok: true })

    const auth = useAuthStore()
    await auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  test('loginWithPasskey completes the ceremony and stores the session', async () => {
    mockLoginOptions.mockResolvedValue({ challenge: 'abc', rpId: 'localhost' })
    mockStartAuthentication.mockResolvedValue({
      id: 'cred-1',
      rawId: 'cred-1',
      type: 'public-key',
      response: {},
    })
    mockLoginVerify.mockResolvedValue({
      user: { id: 'user-9', email: 'passkey@test.dev' },
      accessToken: 'passkey-token',
    })

    const auth = useAuthStore()
    await auth.loginWithPasskey()

    expect(mockLoginOptions).toHaveBeenCalledWith({})
    expect(mockStartAuthentication).toHaveBeenCalledWith({
      optionsJSON: { challenge: 'abc', rpId: 'localhost' },
      useBrowserAutofill: false,
    })
    expect(mockLoginVerify).toHaveBeenCalled()
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.email).toBe('passkey@test.dev')
  })

  test('loginWithPasskey can scope options by email', async () => {
    mockLoginOptions.mockResolvedValue({ challenge: 'scoped' })
    mockStartAuthentication.mockResolvedValue({ id: 'cred-2', type: 'public-key', response: {} })
    mockLoginVerify.mockResolvedValue({
      user: { id: 'user-10', email: 'scoped@test.dev' },
      accessToken: 'scoped-token',
    })

    const auth = useAuthStore()
    await auth.loginWithPasskey({ email: 'scoped@test.dev' })

    expect(mockLoginOptions).toHaveBeenCalledWith({ email: 'scoped@test.dev' })
    expect(auth.isAuthenticated).toBe(true)
  })

  test('registerPasskey runs registration ceremony', async () => {
    mockRegisterOptions.mockResolvedValue({ challenge: 'reg' })
    mockStartRegistration.mockResolvedValue({ id: 'new-cred', type: 'public-key', response: {} })
    mockRegisterVerify.mockResolvedValue({
      id: 'new-cred',
      friendly_name: 'Laptop',
      device_type: 'singleDevice',
      backed_up: false,
      transports: ['internal'],
      created_at: 1,
      last_used_at: null,
    })

    const auth = useAuthStore()
    auth._setAuthenticated()
    const created = await auth.registerPasskey('Laptop')

    expect(mockRegisterOptions).toHaveBeenCalled()
    expect(mockStartRegistration).toHaveBeenCalled()
    expect(mockRegisterVerify).toHaveBeenCalledWith({
      response: { id: 'new-cred', type: 'public-key', response: {} },
      friendly_name: 'Laptop',
    })
    expect(created.friendly_name).toBe('Laptop')
  })
})
