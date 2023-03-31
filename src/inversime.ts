import { Constructor } from './types'

type Instances = Record<string, any>
type Factory<T, K> = (deps: T) => K
export type Factories<T extends Instances, K = T> = {
  [P in keyof T]: Factory<K, T[P]>
}

function injector (container: Inversime<any>) {
  return new Proxy({} as any, {
    get: (_, key) => {
      return container.get(key)
    }
  })
}

export class Inversime<T extends Object> {
  static singleton<T, K extends any[]> (fn: (...deps: K) => T) {
    let instance: T | undefined

    return (...deps: K) => {
      if (!instance) {
        instance = fn(...deps)
      }
      return instance
    }
  }

  static fromClass<T, K extends any[]> (Clazz: Constructor<T, K>) {
    return (...deps: K) => new Clazz(...deps)
  }

  static fromValue<T, K> (value: K): Factory<T, K> {
    return () => value
  }

  static context<T, K extends Object> (value: Factories<K, T>): Factory<T, K> {
    return (deps: T) => {
      const container = new Inversime(value as any)
      container.deps = deps as any

      return injector(container)
    }
  }

  private deps: T

  constructor (protected factories: Partial<Factories<T>>) {
    this.deps = injector(this)
  }

  register<K extends keyof T> (key: K, factory: Factory<T, T[K]>) {
    this.factories[key] = factory
    return this
  }

  get<K extends keyof T> (key: K): T[K] {
    const factory = this.factories[key]
    if (!factory) {
      throw Error(`Inversime: ${key.toString()} not registered`)
    }

    return factory(this.deps)
  }
}

export function inversime<T extends Object> (factories: Partial<Factories<T>>) {
  return new Inversime<T>(factories)
}
