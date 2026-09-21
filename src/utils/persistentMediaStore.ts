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

  // 2. Clean out giant base64 video payloads from LocalStorage
  try {
    if (window.localStorage) {
      const keysToClean: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('ig_user_posts_') || key.startsWith('jhalak_') || key === 'ig_current_user')) {
          const val = window.localStorage.getItem(key);
          if (val && (val.includes('data:video/') || val.length > 250000)) {
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
            const sanitizeItem = (item: any) => {
              if (!item || typeof item !== 'object') return item;
              if (typeof item.mediaUrl === 'string' && item.mediaUrl.startsWith('data:video/')) {
                item.mediaUrl = '';
              }
              if (typeof item.videoUrl === 'string' && item.videoUrl.startsWith('data:video/')) {
                item.videoUrl = '';
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
              window.localStorage.setItem(k, JSON.stringify(parsed));
            }
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

// Automatically execute purge on module initialization
if (typeof window !== 'undefined') {
  setTimeout(() => {
    purgeOfflineMediaStorage().catch(() => {});
  }, 100);
}

/**
 * Converts a small Blob (e.g. thumbnail photo) into a base64 Data URL if <= 300KB
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    // Guard: Never convert large video blobs to base64
    if (blob.size > 500 * 1024) {
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

/**
 * Creates an in-memory session Object URL for preview purposes without caching to IndexedDB.
 */
export async function saveMediaBlob(
  id: string,
  blob: Blob,
  _mimeType?: string
): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  activeObjectUrlCache.set(id, objectUrl);
  return objectUrl;
}

/**
 * Legacy getter: returns null as IndexedDB media caching has been disabled.
 */
export async function getMediaBlob(_id: string): Promise<Blob | null> {
  return null;
}

/**
 * Resolves a reliable, playable media stream URL for a given post/reel.
 */
export async function resolvePlayableMediaUrl(id: string, mediaUrl: string): Promise<string> {
  if (
    mediaUrl &&
    (mediaUrl.startsWith('https://') ||
      mediaUrl.startsWith('http://') ||
      mediaUrl.startsWith('data:image/'))
  ) {
    return mediaUrl;
  }

  // Check in-memory session cache
  if (activeObjectUrlCache.has(id)) {
    return activeObjectUrlCache.get(id)!;
  }

  return mediaUrl || '';
}
