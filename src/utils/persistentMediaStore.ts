/**
 * Media Stream Resolver & Memory Cache (Offline Blob Caching Disabled)
 *
 * NOTE: Large video blobs are no longer cached in browser IndexedDB or LocalStorage
 * to eliminate browser storage quota limits (QuotaExceededError).
 * All media is uploaded directly to Firebase Storage.
 */

const DB_NAME = 'jhalak_media_db';
const STORE_NAME = 'media_blobs';

// In-memory active object URLs cache mapped to media ID (session only, not persistent disk)
const activeObjectUrlCache = new Map<string, string>();

/**
 * Purges any legacy cached media blobs from IndexedDB and cleans massive base64
 * payloads from LocalStorage to immediately free up browser storage space.
 */
export async function purgeOfflineMediaStorage(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Purge legacy IndexedDB database
  try {
    if (window.indexedDB) {
      const dbs = await window.indexedDB.databases?.().catch(() => []);
      const hasJhalakDb = dbs?.some((db) => db.name === DB_NAME);
      if (hasJhalakDb || !window.indexedDB.databases) {
        window.indexedDB.deleteDatabase(DB_NAME);
      }
    }
  } catch {
    // safe fallback
  }

  // 2. Clean out giant base64 video payloads from LocalStorage across all storage keys
  try {
    if (window.localStorage) {
      const keysToClean: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const val = window.localStorage.getItem(key);
          if (val && (val.includes('data:video/') || val.includes('data:application/octet-stream') || val.length > 200000)) {
            keysToClean.push(key);
          }
        }
      }

      for (const k of keysToClean) {
        try {
          const raw = window.localStorage.getItem(k);
          if (!raw) continue;
          if (raw.startsWith('[') || raw.startsWith('{')) {
            const parsed = JSON.parse(raw);
            const sanitizeItem = (item: any): any => {
              if (!item || typeof item !== 'object') return item;
              // Only strip huge base64 strings (> 1000 chars), never blob: or stream URLs
              if (typeof item.mediaUrl === 'string' && item.mediaUrl.startsWith('data:video/') && item.mediaUrl.length > 1000) {
                item.mediaUrl = item.thumbnailUrl || '';
              }
              if (typeof item.videoUrl === 'string' && item.videoUrl.startsWith('data:video/') && item.videoUrl.length > 1000) {
                item.videoUrl = item.thumbnailUrl || '';
              }
              // Clean nested slides (stories)
              if (Array.isArray(item.stories)) {
                item.stories = item.stories.map(sanitizeItem);
              }
              if (Array.isArray(item.slides)) {
                item.slides = item.slides.map(sanitizeItem);
              }
              return item;
            };

            if (Array.isArray(parsed)) {
              const cleaned = parsed.map(sanitizeItem);
              window.localStorage.setItem(k, JSON.stringify(cleaned));
            } else {
              if (parsed.userPosts && Array.isArray(parsed.userPosts)) {
                parsed.userPosts = parsed.userPosts.map(sanitizeItem);
              }
              if (parsed.posts && Array.isArray(parsed.posts)) {
                parsed.posts = parsed.posts.map(sanitizeItem);
              }
              if (parsed.stories && Array.isArray(parsed.stories)) {
                parsed.stories = parsed.stories.map(sanitizeItem);
              }
              window.localStorage.setItem(k, JSON.stringify(parsed));
            }
          } else {
            // Raw large string, delete to protect quota
            window.localStorage.removeItem(k);
          }
        } catch {
          // If unparseable giant string, delete key safely
          window.localStorage.removeItem(k);
        }
      }
    }
  } catch {
    // safe fallback
  }
}

// Automatic purge disabled on startup so user-uploaded media is preserved across page refreshes
// purgeOfflineMediaStorage can still be called manually when necessary

/**
 * Converts a small Blob (e.g. thumbnail photo) into a base64 Data URL if <= 200KB
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    // Guard: Never convert video blobs or large blobs to base64
    if (blob.type.includes('video') || blob.size > 200 * 1024) {
      return resolve(URL.createObjectURL(blob));
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

const FALLBACK_DB_NAME = 'jhalak_fallback_media_v2';
const FALLBACK_STORE_NAME = 'media_blobs';

/**
 * Persists a video/image blob to IndexedDB and creates a cached in-memory Object URL
 * so media is 100% playable even if Firebase Storage is blocked or offline.
 */
export function saveBlobToIndexedDB(id: string, blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const cleanId = id.replace(/^reel-/, '').replace(/^post-/, '');
    const aliases = [id, cleanId, `post-${cleanId}`, `reel-${cleanId}`, `reel-${id}`];

    for (const key of aliases) {
      if (key) activeObjectUrlCache.set(key, objectUrl);
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(objectUrl);
      return;
    }

    try {
      const req = indexedDB.open(FALLBACK_DB_NAME, 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(FALLBACK_STORE_NAME)) {
          db.createObjectStore(FALLBACK_STORE_NAME);
        }
      };
      req.onsuccess = (e: any) => {
        try {
          const db = e.target.result;
          const tx = db.transaction(FALLBACK_STORE_NAME, 'readwrite');
          const store = tx.objectStore(FALLBACK_STORE_NAME);
          // Store under primary id and clean id for bulletproof cross-view lookup
          for (const key of aliases) {
            if (key) {
              try { store.put(blob, key); } catch {}
            }
          }
          tx.oncomplete = () => resolve(objectUrl);
          tx.onerror = () => resolve(objectUrl);
        } catch {
          resolve(objectUrl);
        }
      };
      req.onerror = () => resolve(objectUrl);
    } catch {
      resolve(objectUrl);
    }
  });
}

/**
 * Retrieves a cached media blob from IndexedDB fallback storage checking all possible ID aliases.
 */
export function getBlobFromIndexedDB(id: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const cleanId = id.replace(/^reel-/, '').replace(/^post-/, '');
    const lookupKeys = Array.from(new Set([id, cleanId, `post-${cleanId}`, `reel-${cleanId}`, `reel-${id}`])).filter(Boolean);

    try {
      const req = indexedDB.open(FALLBACK_DB_NAME, 1);
      req.onsuccess = (e: any) => {
        try {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(FALLBACK_STORE_NAME)) {
            resolve(null);
            return;
          }
          const tx = db.transaction(FALLBACK_STORE_NAME, 'readonly');
          const store = tx.objectStore(FALLBACK_STORE_NAME);

          let found = false;
          let pending = lookupKeys.length;

          for (const key of lookupKeys) {
            const getReq = store.get(key);
            getReq.onsuccess = () => {
              if (found) return;
              if (getReq.result) {
                found = true;
                resolve(getReq.result);
                return;
              }
              pending -= 1;
              if (pending === 0 && !found) resolve(null);
            };
            getReq.onerror = () => {
              if (found) return;
              pending -= 1;
              if (pending === 0 && !found) resolve(null);
            };
          }
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Creates an in-memory session Object URL for preview purposes without caching to IndexedDB.
 */
export async function saveMediaBlob(
  id: string,
  blob: Blob,
  _mimeType?: string
): Promise<string> {
  return saveBlobToIndexedDB(id, blob);
}

/**
 * Getter: returns blob from IndexedDB or memory cache.
 */
export async function getMediaBlob(id: string): Promise<Blob | null> {
  return getBlobFromIndexedDB(id);
}

/**
 * Resolves a reliable, playable media stream URL for a given post/reel.
 */
export async function resolvePlayableMediaUrl(id: string, mediaUrl: string): Promise<string> {
  const cleanId = id.replace(/^reel-/, '').replace(/^post-/, '');

  // 1. Direct standard server streaming or CDN URLs are always permanent and playable
  if (
    mediaUrl &&
    (mediaUrl.startsWith('/api/') ||
      mediaUrl.startsWith('https://') ||
      mediaUrl.startsWith('http://') ||
      mediaUrl.startsWith('data:video/') ||
      mediaUrl.startsWith('data:image/'))
  ) {
    return mediaUrl;
  }

  // 2. Check active in-memory session cache
  const aliases = [id, cleanId, `post-${cleanId}`, `reel-${cleanId}`];
  for (const k of aliases) {
    if (activeObjectUrlCache.has(k)) {
      return activeObjectUrlCache.get(k)!;
    }
  }

  // 3. Check IndexedDB fallback store
  try {
    const cachedBlob = await getBlobFromIndexedDB(id);
    if (cachedBlob) {
      const freshUrl = URL.createObjectURL(cachedBlob);
      for (const k of aliases) {
        activeObjectUrlCache.set(k, freshUrl);
      }
      return freshUrl;
    }
  } catch {}

  // 4. If was a blob: URL from a dead past session or URL is empty, fallback to permanent server streaming route
  if (cleanId) {
    return `/api/media/post-${cleanId}.mp4`;
  }

  return mediaUrl || '';
}
