type Instances = Record<string, any>
type Factory<T, K> = (deps: T) => K
type Factories<T extends Instances> = {
  [P in keyof T]?: Factory<T, T[P]>
}

function injector (container: Inversime<any>) {
  return new Proxy({} as any, {
    get: (_, key) => {
      return container.get(key)
    }
  })
}

export class Inversime<T extends Object> {
  static singleton<T, K> (fn: Factory<T, K>): Factory<T, K> {
    let instance: K | undefined

    return (deps: T) => {
      if (!instance) {
        instance = fn(deps)
      }
      return instance
    }
  }

  static transient<T, K> (fn: Factory<T, K>): Factory<T, K> {
    return fn
  }

  constructor (protected factories: Factories<T>) {}

  get<K extends keyof T> (key: K): T[K] {
    const factory = this.factories[key]
    if (!factory) {
      throw Error(`Inversime: ${key.toString()} doesn't exist`)
    }

    return factory(injector(this))
  }
}

export function inversime<T extends Object> (factories: Factories<T>) {
  return new Inversime<T>(factories)
}
