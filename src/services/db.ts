import type { Attempt } from './types';

const DB_NAME = 'polski-b1';
const STORE = 'attempts';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('finishedAt', 'finishedAt');
        store.createIndex('kind', 'kind');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export async function allAttempts(): Promise<Attempt[]> {
  return ((await tx('readonly', (s) => s.getAll())) as Attempt[] | undefined) ?? [];
}

export function saveAttempt(a: Attempt): Promise<unknown> {
  return tx('readwrite', (s) => s.put(a));
}

/** Adds attempts by id, so importing the same backup twice changes nothing. */
export function putAttempts(list: Attempt[]): Promise<unknown> {
  return tx('readwrite', (s) => {
    list.forEach((a) => s.put(a));
  });
}

export async function deleteAttempts(filter: (a: Attempt) => boolean): Promise<number> {
  const all = await allAttempts();
  const doomed = all.filter(filter);
  await tx('readwrite', (s) => {
    doomed.forEach((a) => s.delete(a.id));
  });
  return doomed.length;
}

export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}
