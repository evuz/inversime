import { test, expect, describe } from 'vitest'

import { Inversime, inversime } from '../inversime'

type Book = {
  name: string
  read: boolean
}

interface IBookService {
  get(): Promise<Book[]>
}

class BookStore {
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

describe('Inversime', () => {
  type Container = {
    store: BookStore;
    service: IBookService
    bookApiClient: BookApiClient
    useCase: GetBooksUseCase
  };

  class BookService implements IBookService {
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

  test('should emit values', async () => {
    const container = inversime<Container>({
      store: Inversime.singleton(() => new BookStore()),
      service: Inversime.fromClass(BookService),
      bookApiClient: Inversime.fromClass(BookApiClient),
      useCase: Inversime.fromClass(GetBooksUseCase)
    })

    const books = await container.get('useCase').execute()
    const store = container.get('store')
    expect(books).toBe(store.get())
  })

  test('should throw an error when getting an unregistered dependency', () => {
    const container = inversime<Container>({
      store: Inversime.singleton(() => new BookStore()),
      service: Inversime.fromClass(BookService),
      bookApiClient: Inversime.fromClass(BookApiClient),
      useCase: Inversime.fromClass(GetBooksUseCase)
    })

    function error () {
      container.get('book' as any)
    }

    expect(error).toThrowError(/book/)
  })

  test('should register a new factory', async () => {
    const container = inversime<Container>({
      service: Inversime.fromClass(BookService),
      bookApiClient: Inversime.fromClass(BookApiClient),
      useCase: Inversime.fromClass(GetBooksUseCase)
    })

    container.register('store', Inversime.singleton(Inversime.fromClass(BookStore)))

    const books = await container.get('useCase').execute()
    const store = container.get('store')
    expect(books).toBe(store.get())
  })

  describe('context', () => {
    type Container = {
      books: {
        apiClient: BookApiClient
        service: BookService
        store: BookStore;
      },
      useCase: GetBooksUseCase
    }

    class BookService {
      constructor (private deps: Pick<Container, 'books'>) {}

      async get () {
        const books = await this.deps.books.apiClient.get()
        this.deps.books.store.set(books)
        return books
      }
    }

    class GetBooksUseCase {
      constructor (private deps: Pick<Container, 'books'>) {}
      execute () {
        return this.deps.books.service.get()
      }
    }

    test('should register a context', async () => {
      const container = inversime<Container>({
        books: Inversime.context({
          service: Inversime.fromClass(BookService),
          apiClient: Inversime.fromClass(BookApiClient),
          store: Inversime.singleton(() => new BookStore())
        }),
        useCase: Inversime.fromClass(GetBooksUseCase)
      })

      const books = await container.get('useCase').execute()
      const store = container.get('books').store
      expect(books).toBe(store.get())
    })
  })

  describe('extract', () => {
    class BookService implements IBookService {
      constructor (private apiClient: BookApiClient, private store: BookStore) {}

      async get () {
        const books = await this.apiClient.get()
        this.store.set(books)
        return books
      }
    }

    test('should extract arguments and inject them', async () => {
      const container = inversime<Container>({
        store: Inversime.singleton(() => new BookStore()),
        service: Inversime.extract(Inversime.fromClass(BookService), ['bookApiClient', 'store']),
        bookApiClient: Inversime.fromClass(BookApiClient),
        useCase: Inversime.fromClass(GetBooksUseCase)
      })

      const books = await container.get('useCase').execute()
      const store = container.get('store')
      expect(books).toBe(store.get())
    })

    test('should extract arguments from context', async () => {
      type Container = {
        books: {
          apiClient: BookApiClient
          store: BookStore;
        },
        service: BookService
        useCase: GetBooksUseCase
      }

      const container = inversime<Container>({
        books: Inversime.context({
          apiClient: Inversime.fromClass(BookApiClient),
          store: Inversime.singleton(() => new BookStore())
        }),
        service: Inversime.extract(Inversime.fromClass(BookService), ['books.apiClient', 'books.store']),
        useCase: Inversime.fromClass(GetBooksUseCase)
      })

      const books = await container.get('useCase').execute()
      const store = container.get('books').store
      expect(books).toBe(store.get())
    })
  })
})
