import { clearRequestCache } from './requestCache'

const TOKEN_STORAGE_KEY = 'expense-tracker.access-token'

let memoryToken: string | null = null
const unauthorizedListeners = new Set<() => void>()

function storageAvailable(): boolean {
  try {
    return typeof globalThis.localStorage !== 'undefined'
  } catch {
    return false
  }
}

/** Read the persisted access token (falls back to in-memory for tests/SSR). */
export function getToken(): string | null {
  if (memoryToken !== null) {
    return memoryToken
  }

  if (storageAvailable()) {
    return globalThis.localStorage.getItem(TOKEN_STORAGE_KEY)
  }

  return null
}

/** Persist the access token. */
export function setToken(token: string): void {
  if (token !== getToken()) {
    clearRequestCache()
  }
  memoryToken = token

  if (storageAvailable()) {
    globalThis.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

/** Discard the access token (logout / 401 handling). */
export function clearToken(): void {
  clearRequestCache()
  memoryToken = null

  if (storageAvailable()) {
    globalThis.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

/** Subscribe to runtime authentication failures from the API client. */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

/** Clear credentials and notify auth-scoped state owners exactly once per session. */
export function notifyUnauthorized(): void {
  if (getToken() === null) return
  clearToken()
  for (const listener of unauthorizedListeners) listener()
}
