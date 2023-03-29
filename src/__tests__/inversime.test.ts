import { test, expect, describe } from 'vitest'

import { Inversime, inversime } from '../inversime'

type Book = {
  name: string
  read: boolean
}

type Container = {
  store: Store;
  service: BookService
  bookApiClient: BookApiClient
};

class Store {
  books: Book[]
  set (books: Book[]) {
    this.books = books
  }

  get () {
    return this.books
  }
}

class BookApiClient {
  async get (): Promise<Book[]> {
    return [
      { name: 'The name of the wind', read: true },
      { name: "The Wise Man's Fear", read: false },
      { name: 'The way of kings', read: true },
      { name: 'Word of radiance', read: false }
    ]
  }
}

class BookService {
  constructor (private deps: Container) {}

  async get () {
    const books = await this.deps.bookApiClient.get()
    this.deps.store.set(books)
    return books
  }
}

class GetBooksUseCase {
  constructor (private deps: Container) {}
  execute () {
    return this.deps.service.get()
  }
}

describe('Inversime', () => {
  test('should emit values', async () => {
    const container = inversime({
      store: Inversime.singleton(() => new Store()),
      service: Inversime.transient((d) => new BookService(d)),
      bookApiClient: Inversime.transient(() => new BookApiClient()),
      useCase: Inversime.transient(d => new GetBooksUseCase(d))
    })

    const books = await container.get('useCase')?.execute()
    const store = container.get('store')
    expect(books).toBe(store?.get())
  })
})
