export type Word = {
  id: string
  english: string
  chinese: string
  createdAt: number
  reviewCount: number
  knownCount: number
}

export type PersonalList = {
  id: string
  name: string
  wordIds: string[]
  createdAt: number
}

export type ReviewStat = {
  knownCount: number
  unknownCount: number
  lastReviewedAt: number
}

export type ReviewProgress = {
  id: string
  round: number
  queue: string[]
  passed: string[]
  stats: Record<string, ReviewStat>
}

export type AppSettings = {
  id: 'settings'
  activeListId: string
}

export type MieWordsBackup = {
  version: 2
  words: Word[]
  lists: PersonalList[]
  progress: ReviewProgress[]
  settings: AppSettings
}

export const DEFAULT_LIST_ID = 'default'

const DB_NAME = 'miewords'
const DB_VERSION = 2
const stores = {
  words: 'words',
  lists: 'lists',
  progress: 'progress',
  settings: 'settings',
} as const

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      Object.values(stores).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' })
        }
      })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    const request = action(transaction.objectStore(storeName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
  })
}

const getAll = <T,>(storeName: string) =>
  transact<T[]>(storeName, 'readonly', (store) => store.getAll())
const put = <T,>(storeName: string, value: T) =>
  transact<IDBValidKey>(storeName, 'readwrite', (store) => store.put(value))
const remove = (storeName: string, id: string) =>
  transact<undefined>(storeName, 'readwrite', (store) => store.delete(id))

export const wordDatabase = {
  getAll: () => getAll<Word>(stores.words),
  save: (word: Word) => put(stores.words, word),
  remove: (id: string) => remove(stores.words, id),
}

export const listDatabase = {
  getAll: () => getAll<PersonalList>(stores.lists),
  save: (list: PersonalList) => put(stores.lists, list),
  remove: (id: string) => remove(stores.lists, id),
}

export const progressDatabase = {
  getAll: () => getAll<ReviewProgress>(stores.progress),
  save: (progress: ReviewProgress) => put(stores.progress, progress),
}

export const settingsDatabase = {
  get: () => transact<AppSettings | undefined>(stores.settings, 'readonly', (store) => store.get('settings')),
  save: (settings: AppSettings) => put(stores.settings, settings),
}

export async function initializePersonalData() {
  const [words, savedLists, savedSettings, progress] = await Promise.all([
    wordDatabase.getAll(),
    listDatabase.getAll(),
    settingsDatabase.get(),
    progressDatabase.getAll(),
  ])

  let lists = savedLists
  if (!lists.length) {
    const defaultList: PersonalList = {
      id: DEFAULT_LIST_ID,
      name: '默认词库',
      wordIds: words.map((word) => word.id),
      createdAt: Date.now(),
    }
    await listDatabase.save(defaultList)
    lists = [defaultList]
  }

  const activeListId = lists.some((list) => list.id === savedSettings?.activeListId)
    ? savedSettings!.activeListId
    : lists[0].id
  const settings: AppSettings = { id: 'settings', activeListId }
  if (savedSettings?.activeListId !== activeListId) await settingsDatabase.save(settings)

  return { words, lists, settings, progress }
}
