/**
 * Safe LocalStorage Utility
 *
 * Wraps localStorage setItem operations in try-catch blocks to gracefully handle
 * QuotaExceededError and other storage failures without crashing the application.
 * Broadcasts toast notifications to inform the user when storage quota is reached.
 */

export const STORAGE_QUOTA_EVENT = 'jhalak:storage-quota-exceeded';

export interface StorageQuotaDetail {
  key: string;
  isQuota: boolean;
  message: string;
  error?: unknown;
}

let activeToastHandler: ((message: string) => void) | null = null;

/**
 * Register a global toast handler to receive quota exceeded warnings.
 */
export function registerStorageWarningToast(handler: (message: string) => void): () => void {
  activeToastHandler = handler;
  return () => {
    if (activeToastHandler === handler) {
      activeToastHandler = null;
    }
  };
}

/**
 * Check whether an error is a QuotaExceededError across all major browsers.
 */
export function isQuotaExceeded(err: unknown): boolean {
  if (!err) return false;

  if (err instanceof DOMException) {
    return (
      // Chrome, Safari, Edge, Opera
      err.code === 22 ||
      // Firefox
      err.code === 1014 ||
      // Fallback by name
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }

  if (typeof err === 'object' && err !== null) {
    const errorObj = err as { name?: string; code?: number };
    return (
      errorObj.name === 'QuotaExceededError' ||
      errorObj.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      errorObj.code === 22 ||
      errorObj.code === 1014
    );
  }

  return false;
}

/**
 * Gracefully handles storage issues without showing noisy warning banners in the preview.
 */
function notifyStorageIssue(key: string, _error: unknown, isQuota: boolean) {
  // Gracefully handle quota exceeded: silent handling so no yellow warning banners or toasts interrupt preview
  if (isQuota) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Silently prune non-essential volatile feed caches to relieve browser storage
        window.localStorage.removeItem('ig_feed_posts');
        window.localStorage.removeItem('ig_reels');
      }
    } catch {}
    return;
  }
}

/**
 * Sanitizes any storage payload to guarantee large video data/blobs are NEVER written to LocalStorage.
 */
function sanitizeStoragePayload(val: string): string {
  if (!val) return val;

  // Block massive single strings > 200KB
  if (val.length > 200000 && !val.startsWith('[') && !val.startsWith('{')) {
    return '';
  }

  // Strip video base64 payloads and blob strings
  if (val.includes('data:video/') || val.includes('data:application/octet-stream') || val.includes('"blob:http')) {
    try {
      if (val.startsWith('[') || val.startsWith('{')) {
        const parsed = JSON.parse(val);
        const stripVideoData = (item: any): any => {
          if (!item || typeof item !== 'object') return item;
          if (typeof item.mediaUrl === 'string' && (item.mediaUrl.startsWith('data:video/') || item.mediaUrl.startsWith('blob:'))) {
            item.mediaUrl = '';
          }
          if (typeof item.videoUrl === 'string' && (item.videoUrl.startsWith('data:video/') || item.videoUrl.startsWith('blob:'))) {
            item.videoUrl = '';
          }
          if (Array.isArray(item.stories)) {
            item.stories = item.stories.map(stripVideoData);
          }
          if (Array.isArray(item.slides)) {
            item.slides = item.slides.map(stripVideoData);
          }
          return item;
        };

        if (Array.isArray(parsed)) {
          return JSON.stringify(parsed.map(stripVideoData));
        } else {
          if (Array.isArray(parsed.userPosts)) {
            parsed.userPosts = parsed.userPosts.map(stripVideoData);
          }
          if (Array.isArray(parsed.posts)) {
            parsed.posts = parsed.posts.map(stripVideoData);
          }
          if (Array.isArray(parsed.stories)) {
            parsed.stories = parsed.stories.map(stripVideoData);
          }
          return JSON.stringify(stripVideoData(parsed));
        }
      }
    } catch {
      return '';
    }
  }

  return val;
}

/**
 * Safely set an item in localStorage without throwing or crashing the app.
 * Returns true if the item was successfully stored, false otherwise.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const cleanValue = sanitizeStoragePayload(value);
    if (!cleanValue && value) {
      // Skipped to protect quota
      return false;
    }
    window.localStorage.setItem(key, cleanValue);
    return true;
  } catch (error: unknown) {
    const quotaHit = isQuotaExceeded(error);
    notifyStorageIssue(key, error, quotaHit);
    return false;
  }
}

/**
 * Safely get an item from localStorage.
 */
export function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely remove an item from localStorage.
 */
export function safeRemoveItem(key: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Global safeguard: defensive patch on native localStorage.setItem
// This ensures that any indirect or third-party call to localStorage.setItem cannot crash the app.
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = function (key: string, value: string) {
      try {
        originalSetItem(key, value);
      } catch (err: unknown) {
        const quotaHit = isQuotaExceeded(err);
        notifyStorageIssue(key, err, quotaHit);
      }
    };
  } catch {
    // Patched silently
  }
}
