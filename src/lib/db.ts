export type Word = {
  id: string
  english: string
  chinese: string
  createdAt: number
  reviewCount: number
  knownCount: number
}

const DB_NAME = 'miewords'
const STORE_NAME = 'words'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = action(transaction.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
  })
}

export const wordDatabase = {
  getAll: () => transact<Word[]>('readonly', (store) => store.getAll()),
  save: (word: Word) => transact<IDBValidKey>('readwrite', (store) => store.put(word)),
  remove: (id: string) => transact<undefined>('readwrite', (store) => store.delete(id)),
  clear: () => transact<undefined>('readwrite', (store) => store.clear()),
}
