/* https://javascript.plainenglish.io/advanced-typescript-type-level-nested-object-paths-7f3d8901f29a */
type Primitive = string | number | symbol;
type GenericObject = Record<Primitive, unknown>;

export type NestedPaths<T extends Object> = {
    [K in Extract<keyof T, string>]: T[K] extends Array<any>
    ? K : T[K] extends Record<string, unknown> ? `${K}` | `${K}.${NestedPaths<T[K]>}` : K
  }[Extract<keyof T, string>]

export type TypeFromPath<
  T extends GenericObject,
  Path extends string,
> = {
  [K in Path]: K extends keyof T
    ? T[K]
    : K extends `${infer P}.${infer S}`
      ? T[P] extends GenericObject
        ? TypeFromPath<T[P], S>
        : never
      : never;
}[Path];

export type TypesFromPaths<T extends Record<string, unknown>, K extends Array<string>> = { [I in keyof K]: TypeFromPath<T, K[I]> }
