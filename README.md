# Inversime

[![npm version](https://badgen.net/npm/v/inversime)](https://www.npmjs.com/package/inversime)
![downloads](https://badgen.net/npm/dt/inversime)
![download size](https://badgen.net/bundlephobia/min/inversime)

## About
Inversime is simple inject dependencies library.

## Installation
You can install inversime using npm:
```
$ npm install inversime
```

# Usage
```typescript
type Container = {
  service: IBookService
  bookApiClient: BookApiClient
  useCase: GetBooksUseCase
};

type Book = {
  name: string
  read: boolean
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
  constructor (private deps: Pick<Container, 'bookApiClient'>) {}

  async get () {
    const books = await this.deps.bookApiClient.get()
    return books
  }
}

class GetBooksUseCase {
  constructor (private deps: Pick<Container, 'service'>) {}
  execute () {
    return this.deps.service.get()
  }
}

const container = inversime<Container>({
  service: Inversime.fromClass(BookService),
  bookApiClient: Inversime.fromClass(BookApiClient),
  useCase: Inversime.fromClass(GetBooksUseCase)
})

const books = await container.get('useCase').execute()
console.log(books.length) // 4
```

## Singleton
You can add a book store in the previous code and you need keep a singleton instance.

```typescript
type Container = {
  // Add store in the container type
  store: BookStore;
  service: IBookService
  bookApiClient: BookApiClient
  useCase: GetBooksUseCase
};

// Create the store
class BookStore {
  books: Book[]
  set (books: Book[]) {
    this.books = books
  }

  get () {
    return this.books
  }
}

class BookService {
  constructor (private deps: Pick<Container, 'bookApiClient'>) {}

  async get () {
    const books = await this.deps.bookApiClient.get()
    // Save books in the store
    this.deps.books.store.set(books)
    return books
  }
}

const container = inversime<Container>({
  service: Inversime.fromClass(BookService),
  bookApiClient: Inversime.fromClass(BookApiClient),
  useCase: Inversime.fromClass(GetBooksUseCase)
})

await container.get('useCase').execute()
const store = container.get('books').store

console.log(store.books.length) // 4
```

## Context
Yo can group dependencies by differents contexts. For example we can create a book context.

```typescript
type Container = {
  // Create group in the container type
  books: {
    apiClient: BookApiClient
    service: BookService
  },
  useCase: GetBooksUseCase
}

class BookService {
  // Use the books context
  constructor (private deps: Pick<Container, 'books'>) {}
  async get () {
    const books = await this.deps.books.apiClient.get()
    return books
  }
}

class GetBooksUseCase {
  // Use the books context
  constructor (private deps: Pick<Container, 'books'>) {}
  execute () {
    return this.deps.books.service.get()
  }
}

const container = inversime<Container>({
  // Create the context 
  books: Inversime.context({
    service: Inversime.fromClass(BookService),
    apiClient: Inversime.fromClass(BookApiClient),
  }),
  useCase: Inversime.fromClass(GetBooksUseCase)
})

const books = await container.get('useCase').execute()
console.log(store.books.length) // 4
```

## Extract dependencies
You can have a class with dependencies as arguments and you don't have to modify the class.

```typescript
type Container = {
  books: {
    store: BookStore;
  },
  apiClient: BookApiClient
  service: BookService
  useCase: GetBooksUseCase
}

class BookService implements IBookService {
  // Split dependencies in two arguments
  constructor (private apiClient: BookApiClient, private store: BookStore) {}

  async get () {
    const books = await this.apiClient.get()
    this.store.set(books)
    return books
  }
}

const container = inversime<Container>({
  books: Inversime.context({
    store: Inversime.singleton(() => new BookStore())
  }),
  apiClient: Inversime.fromClass(BookApiClient),
  // Extract dependencies with `Inversime.extract`
  service: Inversime.extract(Inversime.fromClass(BookService), ['apiClient', 'books.store']),
  useCase: Inversime.fromClass(GetBooksUseCase)
})

const books = await container.get('useCase').execute()
console.log(books.length) // 4
```