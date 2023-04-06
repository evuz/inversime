export type { NestedPaths as Paths, TypeFromPath, TypesFromPaths } from './utils.types'

export type Constructor<T, K extends any[]> = {
    new (...args: K): T;
}
