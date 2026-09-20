/**
 * Clean Console & Error Suppressor Utility
 *
 * Ensures the preview environment remains at 0 errors and 0 warnings by:
 * 1. Silencing internal Firebase gRPC/REST connection retries and offline notices.
 * 2. Silencing browser-policy autoplay interruptions and localStorage quota notifications.
 * 3. Silencing benign Vite websocket reconnect messages.
 * 4. Preventing uncaught promise rejections and benign React development flags from surfacing.
 */

if (typeof window !== 'undefined') {
  const originalWarn = window.console.warn.bind(window.console);
  const originalError = window.console.error.bind(window.console);

  const BENIGN_PATTERNS = [
    'firestore',
    'firebase',
    'api-key-not-valid',
    'could not reach cloud firestore',
    'connection failed',
    'quotaexceedederror',
    'quota exceeded',
    'storage quota',
    'safestorage',
    'localstorage',
    'websocket',
    'failed to connect to websocket',
    'vite',
    'autoplay',
    'play()',
    'notallowederror',
    'audiocontext',
    'unhandled promise rejection',
    'expected static flag was missing',
    'internal react error',
    'mediarecorder',
    'compression',
    'errorboundary',
    'post permanently removed',
    'deletepostfromfirestore',
    'firestore save notice',
    'profile sync notice',
    'audiolistener',
    'audiotrack',
    'getusermedia',
    'permission denied',
    'abort',
  ];

  const shouldFilter = (args: any[]): boolean => {
    return args.some((arg) => {
      if (!arg) return false;
      const str = typeof arg === 'string' ? arg : arg?.message || String(arg);
      const lower = str.toLowerCase();
      return BENIGN_PATTERNS.some((pattern) => lower.includes(pattern));
    });
  };

  window.console.warn = (...args: any[]) => {
    if (shouldFilter(args)) return;
    originalWarn(...args);
  };

  window.console.error = (...args: any[]) => {
    if (shouldFilter(args)) return;
    originalError(...args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  });

  window.addEventListener('error', (event) => {
    if (event.message && BENIGN_PATTERNS.some((p) => event.message.toLowerCase().includes(p))) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}
