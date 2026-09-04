interface RequestCacheOptions {
  ttlMs: number
  tags: readonly string[]
}

interface RequestCacheEntry<T = unknown> {
  value?: T
  request?: Promise<T>
  expiresAt: number
  lastAccessedAt: number
  tags: ReadonlySet<string>
}

const MAX_CACHE_ENTRIES = 64
const entries = new Map<string, RequestCacheEntry>()

/**
 * Small, session-scoped cache for authenticated aggregate reads.
 *
 * It deliberately lives in browser memory rather than Cache Storage,
 * localStorage, or Vercel's shared CDN. Financial data therefore disappears
 * with the tab/session and can be invalidated synchronously after mutations.
 */
export function cachedRequest<T>(
  key: string,
  loader: () => Promise<T>,
  options: RequestCacheOptions,
): Promise<T> {
  const now = Date.now()
  const existing = entries.get(key) as RequestCacheEntry<T> | undefined

  if (existing?.request) {
    existing.lastAccessedAt = now
    return existing.request
  }

  if (existing?.value !== undefined && existing.expiresAt > now) {
    existing.lastAccessedAt = now
    return Promise.resolve(existing.value)
  }

  const entry: RequestCacheEntry<T> = {
    expiresAt: now + options.ttlMs,
    lastAccessedAt: now,
    tags: new Set(options.tags),
  }

  const request = loader()
    .then((value) => {
      // An invalidation may have removed this entry while the request was in
      // flight. Return the value to its original caller without re-caching it.
      if (entries.get(key) === entry) {
        entry.value = value
        entry.request = undefined
        entry.expiresAt = Date.now() + options.ttlMs
        entry.lastAccessedAt = Date.now()
      }
      return value
    })
    .catch((error: unknown) => {
      if (entries.get(key) === entry) {
        entries.delete(key)
      }
      throw error
    })

  entry.request = request
  entries.set(key, entry)
  evictLeastRecentlyUsedEntries()
  return request
}

/** Remove entries affected by the supplied mutation scopes. */
export function invalidateRequestCache(tags: readonly string[]): void {
  const invalidatedTags = new Set(tags)

  for (const [key, entry] of entries) {
    if ([...entry.tags].some((tag) => invalidatedTags.has(tag))) {
      entries.delete(key)
    }
  }
}

/** Clear all authenticated data on logout, 401, restore, or account switch. */
export function clearRequestCache(): void {
  entries.clear()
}

/** Deterministic cache key for flat query parameter objects. */
export function requestCacheKey(namespace: string, params: object = {}): string {
  const normalized = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))

  return `${namespace}:${JSON.stringify(normalized)}`
}

function evictLeastRecentlyUsedEntries(): void {
  if (entries.size <= MAX_CACHE_ENTRIES) {
    return
  }

  const oldest = [...entries.entries()].sort(
    ([, left], [, right]) => left.lastAccessedAt - right.lastAccessedAt,
  )

  for (const [key] of oldest.slice(0, entries.size - MAX_CACHE_ENTRIES)) {
    entries.delete(key)
  }
}
