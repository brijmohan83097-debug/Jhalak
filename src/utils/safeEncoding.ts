/**
 * Safe URI Encoding and Unicode String Utilities
 *
 * Prevents "URIError: URI malformed" by:
 * 1. Safely slicing strings by Unicode code points (avoiding splitting surrogate pairs).
 * 2. Replacing lone/unpaired UTF-16 surrogates with standard replacement characters.
 * 3. Polyfilling/guarding encodeURIComponent, decodeURIComponent, and decodeURI globally.
 */

/**
 * Safely slices a string by Unicode code points instead of raw UTF-16 code units.
 * This guarantees emojis (e.g. 🥁, 🌸, 🇮🇳) and regional characters are never split into lone surrogates.
 */
export function safeSlice(str: string | undefined | null, length: number): string {
  if (!str) return '';
  return Array.from(str).slice(0, length).join('');
}

/**
 * Ensures a string is well-formed UTF-16 without lone or unpaired surrogates.
 */
export function toWellFormedString(str: string | undefined | null): string {
  if (!str) return '';
  const val = String(str);
  if (typeof (val as any).toWellFormed === 'function') {
    return (val as any).toWellFormed();
  }
  // Replace lone high surrogates not followed by low surrogates, or lone low surrogates
  return val.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
}

/**
 * Safely encode a URI component without throwing URIError: URI malformed.
 */
export function safeEncodeURIComponent(str: string | number | boolean | undefined | null): string {
  if (str === undefined || str === null) return '';
  try {
    const wellFormed = toWellFormedString(String(str));
    return encodeURIComponent(wellFormed);
  } catch {
    try {
      return encodeURIComponent(String(str).replace(/[\uD800-\uDFFF]/g, ''));
    } catch {
      return '';
    }
  }
}

/**
 * Safely decode a URI component without throwing URIError: URI malformed.
 */
export function safeDecodeURIComponent(str: string | undefined | null): string {
  if (!str) return '';
  try {
    return decodeURIComponent(str);
  } catch {
    try {
      // Escape standalone % that are not followed by 2 hex digits
      return decodeURIComponent(String(str).replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
    } catch {
      return String(str);
    }
  }
}

/**
 * Safely decode a full URI without throwing URIError: URI malformed.
 */
export function safeDecodeURI(str: string | undefined | null): string {
  if (!str) return '';
  try {
    return decodeURI(str);
  } catch {
    try {
      return decodeURI(String(str).replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
    } catch {
      return String(str);
    }
  }
}

// Global runtime defense against Uncaught URIError: URI malformed
if (typeof window !== 'undefined') {
  try {
    const nativeEncodeURIComponent = window.encodeURIComponent;
    window.encodeURIComponent = function (uriComponent: string | number | boolean): string {
      try {
        const wellFormed = toWellFormedString(String(uriComponent));
        return nativeEncodeURIComponent(wellFormed);
      } catch {
        try {
          return nativeEncodeURIComponent(String(uriComponent).replace(/[\uD800-\uDFFF]/g, ''));
        } catch {
          return '';
        }
      }
    };

    const nativeDecodeURIComponent = window.decodeURIComponent;
    window.decodeURIComponent = function (encodedURI: string): string {
      try {
        return nativeDecodeURIComponent(encodedURI);
      } catch {
        try {
          return nativeDecodeURIComponent(String(encodedURI).replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
        } catch {
          return String(encodedURI);
        }
      }
    };

    const nativeDecodeURI = window.decodeURI;
    window.decodeURI = function (encodedURI: string): string {
      try {
        return nativeDecodeURI(encodedURI);
      } catch {
        try {
          return nativeDecodeURI(String(encodedURI).replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
        } catch {
          return String(encodedURI);
        }
      }
    };
  } catch (err) {
    console.warn('[safeEncoding] Could not attach global URI safeguards:', err);
  }
}
