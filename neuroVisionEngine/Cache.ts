import NodeCache from 'node-cache'

export class HexaMetricsCache {
  private cache = new NodeCache({ stdTTL: 60 })

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }

  set<T>(key: string, value: T) {
    this.cache.set(key, value)
  }

  async fetchJson<T>(url: string): Promise<T> {
    const key = `json:${url}`
    const cached = this.get<T>(key)
    if (cached) return cached
    const res = await fetch(url)
    const data = await res.json() as T
    this.set(key, data)
    return data
  }
}
