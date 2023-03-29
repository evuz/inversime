type Factory<T, K> = (deps: T) => K
type Factories<T> = Record<string, Factory<T, any>>
type Instances<T extends Factories<any>> = {
  [P in keyof T]?: ReturnType<T[P]>;
}

function injector (container: Inversime<any, any>) {
  return new Proxy({} as any, {
    get: (_, key) => {
      return container.get(key)
    }
  })
}

export class Inversime<T extends Factories<any>, K = Instances<T>> {
  static singleton<V, P> (fn: (deps: V) => P): Factory<V, P> {
    let instance: P | undefined

    return (deps: V) => {
      if (!instance) {
        instance = fn(deps)
      }
      return instance
    }
  }

  static transient<V, P> (fn: (deps: V) => P): Factory<V, P> {
    return fn
  }

  constructor (protected factories: T) {}

  get<V extends keyof K> (key: V): K[V] {
    const factory = this.factories[key as any]
    if (!factory) {
      throw Error(`Inversime: ${key.toString()} doesn't exist`)
    }

    return factory(injector(this))
  }
}

export function inversime<T extends Factories<any>> (factories: T) {
  return new Inversime(factories)
}
