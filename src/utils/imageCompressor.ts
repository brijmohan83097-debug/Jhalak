/**
 * Image Compression and Resizing Utility using HTML5 Canvas
 *
 * Automatically resizes images to a maximum width and height (default: 800px)
 * while preserving aspect ratio, and exports to JPEG with quality 0.7.
 * This drastically reduces file size (typically from several megabytes down to ~40-80KB)
 * preventing browser memory bloat and localStorage QuotaExceededError crashes.
 */

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
  } catch (error) {
    console.warn('[processMediaFile] Canvas compression failed, reading as standard DataURL:', error);
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
