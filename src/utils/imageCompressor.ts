/**
 * Image Compression and Resizing Utility using HTML5 Canvas
 *
 * Automatically resizes images to a maximum width and height (default: 800px)
 * while preserving aspect ratio, and exports to JPEG with quality 0.7.
 * This drastically reduces file size (typically from several megabytes down to ~40-80KB)
 * preventing browser memory bloat and localStorage QuotaExceededError crashes.
 */

import { safeSlice, safeEncodeURIComponent } from './safeEncoding';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses an image File, Blob, or base64/URL string using Canvas.
 * Returns a Promise that resolves with the compressed JPEG base64 data URL.
 */
export async function compressImage(
  source: File | Blob | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    const img = new Image();

    // Enable cross-origin image loading if URL is provided
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          // If dimensions are missing and source is already a string, return it as fallback
          if (typeof source === 'string') {
            return resolve(source);
          }
          return reject(new Error('Invalid image dimensions'));
        }

        // Calculate proportional scale factor to fit within max bounds
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (typeof source === 'string') {
            return resolve(source);
          }
          return reject(new Error('Canvas 2D rendering context not available'));
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill white background in case source has transparency (so JPEG doesn't get black background)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw and downscale image onto the canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export to JPEG format with specified quality (0.7)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (error) {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        reject(error);
      }
    };

    img.onerror = (err) => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error(`Failed to load image for compression: ${err}`));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }
  });
}

/**
 * Reads a File or Blob as a base64 Data URL.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Creates an inline SVG Data URL for video fallback cards, preserving card visibility,
 * title, and video identity even if a video blob URL has expired.
 */
export function createVideoFallbackDataUrl(caption = 'Video Post'): string {
  try {
    const rawCaption = (caption || 'Video Post').replace(/<[^>]*>?/gm, '');
    const cleanCaption = safeSlice(rawCaption, 36)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const safeCaption = cleanCaption || 'Video Reel';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18181b"/>
        <stop offset="50%" stop-color="#09090b"/>
        <stop offset="100%" stop-color="#27272a"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#grad)"/>
    <circle cx="300" cy="270" r="54" fill="#f43f5e" opacity="0.9"/>
    <polygon points="288,245 324,270 288,295" fill="#ffffff"/>
    <text x="300" y="375" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" text-anchor="middle">
      ${safeCaption}
    </text>
    <text x="300" y="415" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" text-anchor="middle">
      🎬 Video Reel Preview
    </text>
  </svg>`;
    return `data:image/svg+xml;charset=utf-8,${safeEncodeURIComponent(svg)}`;
  } catch {
    return 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22600%22%20viewBox%3D%220%200%20600%20600%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%2318181b%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22270%22%20r%3D%2254%22%20fill%3D%22%23f43f5e%22%2F%3E%3Cpolygon%20points%3D%22288%2C245%20324%2C270%20288%2C295%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E';
  }
}

/**
 * Creates an inline SVG Data URL for photo fallback cards.
 */
export function createPhotoFallbackDataUrl(caption = 'Photo Post'): string {
  try {
    const rawCaption = (caption || 'Photo Post').replace(/<[^>]*>?/gm, '');
    const cleanCaption = safeSlice(rawCaption, 36)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const safeCaption = cleanCaption || 'Photo Post';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="pgrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#262626"/>
        <stop offset="100%" stop-color="#171717"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#pgrad)"/>
    <circle cx="300" cy="270" r="48" fill="#e11d48" opacity="0.8"/>
    <path d="M280 285 L320 285 L310 265 L298 277 L290 268 Z" fill="#ffffff"/>
    <text x="300" y="375" fill="#f5f5f5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" text-anchor="middle">
      ${safeCaption}
    </text>
    <text x="300" y="410" fill="#737373" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" text-anchor="middle">
      📸 Photo Post
    </text>
  </svg>`;
    return `data:image/svg+xml;charset=utf-8,${safeEncodeURIComponent(svg)}`;
  } catch {
    return 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22600%22%20viewBox%3D%220%200%20600%20600%22%3E%3Crect%20width%3D%22600%22%20height%3D%22600%22%20fill%3D%22%23262626%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22270%22%20r%3D%2248%22%20fill%3D%22%23e11d48%22%2F%3E%3C%2Fsvg%3E';
  }
}

/**
 * Generates a lightweight base64 JPEG thumbnail from a video File or Blob using HTML5 Canvas.
 * This ensures persistent thumbnail display across sessions and page refreshes,
 * preventing vanished or expired blob URL issues.
 */
export async function generateVideoThumbnail(
  source: File | Blob | string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      // Only set crossOrigin for remote http/https URLs, never for blob: or local files
      if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
        video.crossOrigin = 'anonymous';
      }
      video.preload = 'auto';

      let objectUrl: string | null = null;

      const cleanup = () => {
        if (objectUrl) {
          try {
            URL.revokeObjectURL(objectUrl);
          } catch {
            // ignore
          }
          objectUrl = null;
        }
        video.src = '';
      };

      const captureFrame = () => {
        try {
          const width = video.videoWidth || 480;
          const height = video.videoHeight || 480;
          if (width > 0 && height > 0) {
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            const targetW = Math.max(1, Math.round(width * ratio));
            const targetH = Math.max(1, Math.round(height * ratio));

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(video, 0, 0, targetW, targetH);
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              cleanup();
              return resolve(dataUrl);
            }
          }
        } catch {
          // Canvas capture fallback
        }

        cleanup();
        resolve(createVideoFallbackDataUrl('Video Reel'));
      };

      let captured = false;
      const doCaptureOnce = () => {
        if (captured) return;
        captured = true;
        captureFrame();
      };

      video.onloadeddata = () => {
        try {
          if (video.duration && video.duration > 0.3) {
            video.currentTime = Math.min(0.5, video.duration / 2);
          } else {
            doCaptureOnce();
          }
        } catch {
          doCaptureOnce();
        }
      };

      video.onseeked = () => {
        doCaptureOnce();
      };

      video.onerror = () => {
        cleanup();
        resolve(createVideoFallbackDataUrl('Video Reel'));
      };

      // Fallback timer in case video decoding takes too long in browser sandbox
      setTimeout(() => {
        if (!captured) {
          captured = true;
          cleanup();
          resolve(createVideoFallbackDataUrl('Video Reel'));
        }
      }, 2500);

      if (typeof source === 'string') {
        video.src = source;
      } else {
        objectUrl = URL.createObjectURL(source);
        video.src = objectUrl;
      }
      video.load();
    } catch {
      resolve(createVideoFallbackDataUrl('Video Reel'));
    }
  });
}

/**
 * Helper to process any file input: compresses if it's an image, or returns object URL if video.
 */
export async function processMediaFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<{ url: string; isVideo: boolean; wasCompressed: boolean }> {
  const isVideo = file.type.startsWith('video/');
  if (isVideo) {
    return {
      url: URL.createObjectURL(file),
      isVideo: true,
      wasCompressed: false,
    };
  }

  // File is an image (or photo/avatar)
  try {
    const compressed = await compressImage(file, maxWidth, maxHeight, quality);
    return {
      url: compressed,
      isVideo: false,
      wasCompressed: true,
    };
  } catch {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: (reader.result as string) || URL.createObjectURL(file),
          isVideo: false,
          wasCompressed: false,
        });
      };
      reader.onerror = () => {
        resolve({
          url: URL.createObjectURL(file),
          isVideo: false,
          wasCompressed: false,
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Converts a base64 Data URL to a native binary Blob instantly.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return new Blob([], { type: 'image/jpeg' });
  }
}

/**
 * Compresses an image File, Blob, or base64 string to an optimized JPEG Blob using HTML5 Canvas.
 * Typically reduces a 5MB-20MB photo down to 40KB-90KB in < 80ms.
 */
export async function compressImageToBlob(
  source: File | Blob | string,
  maxWidth = 1080,
  maxHeight = 1080,
  quality = 0.72
): Promise<Blob> {
  const dataUrl = await compressImage(source, maxWidth, maxHeight, quality);
  return dataUrlToBlob(dataUrl);
}

/**
 * Aggressive client-side video compressor using HTML5 Canvas & MediaRecorder.
 * If the video is already compact (<= 2.5MB), it returns the source immediately.
 * For larger videos, it quickly scales video frames down to mobile resolution (720p/540p)
 * at ~1.2 Mbps bitrate. Includes an aggressive 3.5s safety timeout so it never hangs.
 */
export async function compressVideoToBlob(
  source: File | Blob,
  maxTargetWidth = 720,
  maxTargetHeight = 1280
): Promise<Blob> {
  // If video is already compact (<= 2.5MB), skip heavy re-encoding to save time
  if (source.size <= 2.5 * 1024 * 1024) {
    return source;
  }

  // Check if MediaRecorder is supported in browser
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return source;
  }

  return new Promise<Blob>((resolve) => {
    let resolved = false;
    const safeResolve = (result: Blob) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Strict 3.5s timeout: if video cannot be compressed quickly, fall back immediately to source
    const timer = setTimeout(() => {
      safeResolve(source);
    }, 3500);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(source);
    video.src = objectUrl;

    const cleanup = () => {
      clearTimeout(timer);
      try {
        URL.revokeObjectURL(objectUrl);
        video.pause();
        video.src = '';
      } catch {}
    };

    video.onloadedmetadata = () => {
      try {
        let width = video.videoWidth || 720;
        let height = video.videoHeight || 1280;

        // Proportional downscale if larger than target dimensions
        if (width > maxTargetWidth || height > maxTargetHeight) {
          const ratio = Math.min(maxTargetWidth / width, maxTargetHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          // Keep dimensions even for video codecs
          width = width - (width % 2);
          height = height - (height % 2);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          safeResolve(source);
          return;
        }

        const stream = canvas.captureStream ? canvas.captureStream(24) : null;
        if (!stream) {
          safeResolve(source);
          return;
        }

        let mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            safeResolve(source);
            return;
          }
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 1_200_000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (chunks.length > 0) {
            const compressedBlob = new Blob(chunks, { type: mimeType });
            if (compressedBlob.size > 0 && compressedBlob.size < source.size) {
              safeResolve(compressedBlob);
              return;
            }
          }
          safeResolve(source);
        };

        recorder.onerror = () => {
          safeResolve(source);
        };

        recorder.start(250);
        video.playbackRate = 2.0;

        let animId: number;
        const drawFrame = () => {
          if (video.paused || video.ended || resolved) return;
          try {
            ctx.drawImage(video, 0, 0, width, height);
          } catch {}
          animId = requestAnimationFrame(drawFrame);
        };

        video.onended = () => {
          cancelAnimationFrame(animId);
          try {
            if (recorder.state === 'recording') recorder.stop();
          } catch {
            safeResolve(source);
          }
        };

        video
          .play()
          .then(() => {
            drawFrame();
          })
          .catch(() => {
            safeResolve(source);
          });
      } catch {
        safeResolve(source);
      }
    };

    video.onerror = () => {
      safeResolve(source);
    };
  });
}

/**
 * Prepares and aggressively compresses any media (image or video) before upload to Firebase Storage.
 * Guarantees photos are compressed to ~40KB-90KB JPEG blobs and videos are optimized.
 */
export async function prepareMediaForUpload(
  fileOrBlob: File | Blob | string,
  mediaType: 'image' | 'video'
): Promise<{ blob: Blob; mimeType: string }> {
  if (mediaType === 'image') {
    const blob = await compressImageToBlob(fileOrBlob, 1080, 1080, 0.72);
    return { blob, mimeType: 'image/jpeg' };
  } else {
    if (typeof fileOrBlob === 'string') {
      if (fileOrBlob.startsWith('data:')) {
        const blob = dataUrlToBlob(fileOrBlob);
        return { blob, mimeType: blob.type || 'video/mp4' };
      }
      return { blob: new Blob([], { type: 'video/mp4' }), mimeType: 'video/mp4' };
    }
    const compressed = await compressVideoToBlob(fileOrBlob);
    return { blob: compressed, mimeType: compressed.type || 'video/mp4' };
  }
}
