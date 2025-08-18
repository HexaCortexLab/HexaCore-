import NodeCache from 'node-cache'

export interface CacheOptions {
  ttl?: number // time to live in seconds
}

export class HexaMetricsCache {
  private readonly cache: NodeCache

  constructor(defaultTtlSeconds = 60) {
    this.cache = new NodeCache({ stdTTL: defaultTtlSeconds, checkperiod: defaultTtlSeconds * 0.2 })
  }

  /**
   * Get a cached value by key
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): boolean {
    return this.cache.set(key, value, options?.ttl)
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Remove a key from cache
   */
  del(key: string): number {
    return this.cache.del(key)
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.flushAll()
  }

  /**
   * Get all active keys
   */
  keys(): string[] {
    return this.cache.keys()
  }

  /**
   * Expose cache statistics
   */
  stats(): NodeCache.Stats {
    return this.cache.getStats()
  }

  /**
   * Fetch JSON from URL and cache it with optional TTL
   */
  async fetchJson<T>(url: string, options?: CacheOptions): Promise<T> {
    const key = `json:${url}`
    const cached = this.get<T>(key)
    if (cached) return cached

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)
    }

    const data = await res.json() as T
    this.set(key, data, options)
    return data
  }
}
