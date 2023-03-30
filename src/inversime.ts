import { Constructor } from './types'

type Instances = Record<string, any>
type Factory<T, K> = (deps: T) => K
export type Factories<T extends Instances> = {
  [P in keyof T]: Factory<T, T[P]>
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

  static fromClass<T, K> (Clazz: Constructor<K>): Factory<T, K> {
    return (deps: T) => new Clazz(deps)
  }

  static fromValue<T, K> (value: K): Factory<T, K> {
    return () => value
  }

  constructor (protected factories: Partial<Factories<T>>) {}

  register<K extends keyof T> (key: K, factory: Factory<T, T[K]>): void {
    this.factories[key] = factory
  }

  get<K extends keyof T> (key: K): T[K] {
    const factory = this.factories[key]
    if (!factory) {
      throw Error(`Inversime: ${key.toString()} not registered`)
    }

    return factory(injector(this))
  }
}

export function inversime<T extends Object> (factories: Partial<Factories<T>>) {
  return new Inversime<T>(factories)
}
