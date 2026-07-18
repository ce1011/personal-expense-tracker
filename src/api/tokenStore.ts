const TOKEN_STORAGE_KEY = 'expense-tracker.access-token'

let memoryToken: string | null = null

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
  memoryToken = token

  if (storageAvailable()) {
    globalThis.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

/** Discard the access token (logout / 401 handling). */
export function clearToken(): void {
  memoryToken = null

  if (storageAvailable()) {
    globalThis.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}
