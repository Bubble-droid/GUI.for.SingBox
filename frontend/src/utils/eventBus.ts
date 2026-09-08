interface EventMap {
  profileChange: { id: string }
  subscriptionChange: { id: string }
  subscriptionsChange: null
  rulesetChange: { id: string }
  rulesetsChange: null
}

class TypedEventBus<Events extends Record<string, any>> {
  private handlers: {
    [K in keyof Events]?: ((data: Events[K]) => void)[]
  } = {}

  public on<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    const list = this.handlers[event] || []
    list.push(handler)
    this.handlers[event] = list
  }

  public off<K extends keyof Events>(event: K, handler: (data: Events[K]) => void) {
    const list = this.handlers[event]
    if (!list) {
      return
    }
    this.handlers[event] = list.filter((h) => h !== handler)
  }

  public emit<K extends keyof Events>(event: K, data: Events[K]) {
    const list = this.handlers[event]
    if (!list) {
      return
    }
    list.forEach((h) => h(data))
  }
}

export const eventBus = new TypedEventBus<EventMap>()
