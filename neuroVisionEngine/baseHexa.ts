import { EventEmitter } from 'events'

export abstract class BaseHexaAction extends EventEmitter {
  constructor(public readonly name: string) {
    super()
  }

  async run(...args: any[]): Promise<void> {
    this.emit('start', { name: this.name })
    try {
      await this.execute(...args)
      this.emit('complete', { name: this.name })
    } catch (err) {
      this.emit('failure', { name: this.name, error: err })
      throw err
    }
  }

  protected abstract execute(...args: any[]): Promise<void>
}