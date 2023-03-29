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
  useCase: GetBooksUseCase
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
  constructor (private deps: Pick<Container, 'bookApiClient' | 'store'>) {}

  async get () {
    const books = await this.deps.bookApiClient.get()
    this.deps.store.set(books)
    return books
  }
}

class GetBooksUseCase {
  constructor (private deps: Pick<Container, 'service'>) {}
  execute () {
    return this.deps.service.get()
  }
}

describe('Inversime', () => {
  test('should emit values', async () => {
    const container = inversime<Container>({
      store: Inversime.singleton(() => new Store()),
      service: Inversime.fromClass(BookService),
      bookApiClient: Inversime.fromClass(BookApiClient),
      useCase: Inversime.fromClass(GetBooksUseCase)
    })

    const books = await container.get('useCase').execute()
    const store = container.get('store')
    expect(books).toBe(store.get())
  })

  test('should throw an error when getting an unregistered dependency', async () => {
    const container = inversime<Container>({
      store: Inversime.singleton(() => new Store()),
      service: Inversime.fromClass(BookService),
      bookApiClient: Inversime.fromClass(BookApiClient),
      useCase: Inversime.fromClass(GetBooksUseCase)
    })

    function error () {
      container.get('book' as any)
    }

    expect(error).toThrowError(/book/)
  })
})
