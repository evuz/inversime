export type Constructor<T, K extends any[]> = {
    new (...args: K): T;
}
