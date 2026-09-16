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
 * Notify user and system about quota issue.
 */
function notifyStorageIssue(key: string, error: unknown, isQuota: boolean) {
  const message = isQuota
    ? '⚠️ Storage quota exceeded. Recent changes may not be saved offline.'
    : '⚠️ Unable to write to browser local storage.';

  if (activeToastHandler) {
    activeToastHandler(message);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<StorageQuotaDetail>(STORAGE_QUOTA_EVENT, {
        detail: { key, isQuota, message, error },
      })
    );
  }
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
    window.localStorage.setItem(key, value);
    return true;
  } catch (error: unknown) {
    const quotaHit = isQuotaExceeded(error);
    console.warn(
      `[safeStorage] setItem("${key}") failed with ${quotaHit ? 'QuotaExceededError' : 'Error'}:`,
      error
    );
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
  } catch (error) {
    console.warn(`[safeStorage] getItem("${key}") failed:`, error);
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
  } catch (error) {
    console.warn(`[safeStorage] removeItem("${key}") failed:`, error);
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
        console.warn(
          `[localStorage.setItem Guard] Caught ${quotaHit ? 'QuotaExceededError' : 'StorageError'} on key "${key}"`,
          err
        );
        notifyStorageIssue(key, err, quotaHit);
      }
    };
  } catch (patchErr) {
    console.warn('[safeStorage] Could not attach defensive localStorage patch:', patchErr);
  }
}
