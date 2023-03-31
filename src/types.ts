export type Constructor<T, K extends any[]> = {
    new (...args: K): T;
}

/* From https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3 */
export type Paths<T extends Object> = {
  [K in Extract<keyof T, string>]: T[K] extends Array<any>
  ? K : T[K] extends Record<string, unknown> ? `${K}` | `${K}.${Paths<T[K]>}` : K
}[Extract<keyof T, string>]
