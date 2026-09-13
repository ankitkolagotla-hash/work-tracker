/**
 * Lightweight IndexedDB wrapper for binary media — ACT screenshot intakes,
 * past-paper PDFs, recruiting video clips — that would blow past
 * localStorage's ~5MB quota if stored as base64 there. Everything here is a
 * thin promise wrapper over the native IndexedDB API; no external library.
 */

const DB_NAME = 'chronoflow-media';
const DB_VERSION = 1;
const STORE_NAME = 'media';

export interface MediaRecord {
  key: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  createdAt: string;
  tag: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putMedia(file: File | Blob, opts: { tag: string; fileName?: string }): Promise<string> {
  const db = await openDb();
  const key = `media-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const record: MediaRecord = {
    key,
    blob: file,
    fileName: opts.fileName ?? (file instanceof File ? file.name : 'upload'),
    mimeType: file.type || 'application/octet-stream',
    createdAt: new Date().toISOString(),
    tag: opts.tag,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return key;
}

export async function getMedia(key: string): Promise<MediaRecord | null> {
  const db = await openDb();
  const record = await new Promise<MediaRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as MediaRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return record;
}

export async function listMedia(tag?: string): Promise<MediaRecord[]> {
  const db = await openDb();
  const all = await new Promise<MediaRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as MediaRecord[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return tag ? all.filter((r) => r.tag === tag) : all;
}

export async function deleteMedia(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
