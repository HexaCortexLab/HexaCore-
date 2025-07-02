import fetch from 'node-fetch'
import { sleep } from './utils'

export async function backoffFetch(
  url: string,
  options: any = {},
  retries = 5,
  baseDelay = 200
): Promise<any> {
  let attempt = 0
  while (true) {
    try {
      const res = await fetch(url, options)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (++attempt > retries) throw err
      const delay = baseDelay * 2 ** (attempt - 1)
      await sleep(delay)
    }
  }
}
