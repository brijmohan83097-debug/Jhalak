/**
 * Client-Side Video Compressor & File Size Validator
 *
 * Compresses large video files directly in the browser before uploading to Firebase/server:
 * 1. Scales down high-resolution videos (1080p, 4K) to 720p (720x1280 for portrait Reels, 1280x720 for landscape).
 * 2. Optimizes bitrate using HTML5 Canvas + MediaRecorder (target ~2 Mbps for crisp 720p video).
 * 3. Enforces a strict maximum file size limit (25MB default).
 * 4. Provides progress tracking, cancellation, and detailed compression statistics.
 */

export const MAX_VIDEO_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_VIDEO_UPLOAD_SIZE_MB = 25;

export interface VideoCompressionOptions {
  /** Maximum dimension for the short edge (default: 720 for 720p) */
  maxDimension?: number;
  /** Target video bitrate in bits per second (default: 2_000_000 = 2 Mbps) */
  targetBitrate?: number;
  /** Maximum allowed size in bytes (default: 25MB) */
  maxSizeBytes?: number;
  /** Callback for compression progress (0 - 100) */
  onProgress?: (progress: {
    percent: number;
    currentTime: number;
    duration: number;
    status: string;
  }) => void;
  /** Abort signal to cancel ongoing compression */
  signal?: AbortSignal;
}

export interface VideoCompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
  duration: number;
  savedBytes: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

export interface VideoValidationResult {
  valid: boolean;
  sizeMB: number;
  limitMB: number;
  requiresCompression: boolean;
  error?: string;
}

/**
 * Format bytes to human-readable string (e.g. "14.2 MB", "850 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates whether a video file is within initial upload constraints.
 */
export function validateVideoFileSize(
  file: File | Blob,
  maxSizeBytes = MAX_VIDEO_UPLOAD_SIZE_BYTES
): VideoValidationResult {
  const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2));
  const limitMB = Math.round(maxSizeBytes / (1024 * 1024));

  if (file.size > maxSizeBytes * 4) {
    // Over 100MB is too large for client-side canvas compression in browser memory
    return {
      valid: false,
      sizeMB,
      limitMB,
      requiresCompression: true,
      error: `File is too large (${sizeMB} MB). Maximum allowed video size is ${limitMB} MB. Please trim your video.`,
    };
  }

  const requiresCompression = file.size > 8 * 1024 * 1024 || file.size > maxSizeBytes;

  return {
    valid: true,
    sizeMB,
    limitMB,
    requiresCompression,
  };
}

/**
 * Detect the best supported video mimeType for MediaRecorder in current browser
 */
function getSupportedMimeType(): string {
  const candidates = [
    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    'video/mp4',
    'video/webm; codecs=vp9,opus',
    'video/webm; codecs=vp8,opus',
    'video/webm',
  ];

  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return 'video/webm';
  }

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}

/**
 * Compresses a video File or Blob client-side to 720p resolution and optimized bitrate.
 */
export async function compressVideo(
  source: File | Blob,
  options?: VideoCompressionOptions
): Promise<VideoCompressionResult> {
  const maxSizeBytes = options?.maxSizeBytes || MAX_VIDEO_UPLOAD_SIZE_BYTES;
  const maxDim = options?.maxDimension || 720;
  const targetBitrate = options?.targetBitrate || 2_000_000; // 2 Mbps
  const originalSize = source.size;

  // Verify MediaRecorder & Canvas stream capture support
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasCaptureStream = typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;

  // Create temporary video element to read dimensions and duration
  const objectUrl = URL.createObjectURL(source);
  const video = document.createElement('video');
  video.src = objectUrl;
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  (video as any).webkitPlaysInline = true;

  try {
    // 1. Wait for video metadata to load
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Failed to load video metadata for compression'));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout loading video metadata'));
      }, 15000);

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
        clearTimeout(timeout);
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
    });

    const originalWidth = video.videoWidth || 720;
    const originalHeight = video.videoHeight || 1280;
    const duration = video.duration || 1;

    // Calculate 720p target dimensions preserving aspect ratio
    const isPortrait = originalHeight >= originalWidth;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (isPortrait) {
      // Portrait Reel: short edge is width (max 720), long edge is height (max 1280)
      if (originalWidth > maxDim) {
        const ratio = maxDim / originalWidth;
        targetWidth = maxDim;
        targetHeight = Math.round(originalHeight * ratio);
      }
      if (targetHeight > 1280) {
        const ratio = 1280 / targetHeight;
        targetHeight = 1280;
        targetWidth = Math.round(targetWidth * ratio);
      }
    } else {
      // Landscape: short edge is height (max 720), long edge is width (max 1280)
      if (originalHeight > maxDim) {
        const ratio = maxDim / originalHeight;
        targetHeight = maxDim;
        targetWidth = Math.round(originalWidth * ratio);
      }
      if (targetWidth > 1280) {
        const ratio = 1280 / targetWidth;
        targetWidth = 1280;
        targetHeight = Math.round(targetHeight * ratio);
      }
    }

    // Codecs (H.264 / VP8 / VP9) strictly require even dimensions
    targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
    targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

    // Check if compression can be skipped (file is already tiny <= 4MB and <= 720p)
    const isAlreadySmall = originalSize <= 4 * 1024 * 1024;
    const isAlready720p = originalWidth <= targetWidth && originalHeight <= targetHeight;

    if (isAlreadySmall && isAlready720p && originalSize <= maxSizeBytes) {
      return {
        blob: source,
        originalSize,
        compressedSize: originalSize,
        originalWidth,
        originalHeight,
        targetWidth,
        targetHeight,
        duration,
        savedBytes: 0,
        compressionRatio: 1,
        wasCompressed: false,
      };
    }

    // If browser lacks MediaRecorder or Canvas captureStream, handle fallback
    if (!hasMediaRecorder || !hasCaptureStream) {
      if (originalSize <= maxSizeBytes) {
        return {
          blob: source,
          originalSize,
          compressedSize: originalSize,
          originalWidth,
          originalHeight,
          targetWidth: originalWidth,
          targetHeight: originalHeight,
          duration,
          savedBytes: 0,
          compressionRatio: 1,
          wasCompressed: false,
        };
      } else {
        throw new Error(
          `Video size (${formatBytes(originalSize)}) exceeds ${formatBytes(maxSizeBytes)} limit and your browser does not support client-side video encoding. Please choose a smaller video.`
        );
      }
    }

    // 2. Setup Canvas & Audio routing
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // Capture canvas stream at 30 fps
    const canvasStream = canvas.captureStream(30);

    // Capture audio track from video if present
    let audioTrack: MediaStreamTrack | null = null;
    try {
      const vStream =
        (video as any).captureStream ? (video as any).captureStream() :
        (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
      if (vStream && vStream.getAudioTracks && vStream.getAudioTracks().length > 0) {
        audioTrack = vStream.getAudioTracks()[0];
      }
    } catch {}

    const streamTracks: MediaStreamTrack[] = [canvasStream.getVideoTracks()[0]];
    if (audioTrack) {
      streamTracks.push(audioTrack);
    }
    const combinedStream = new MediaStream(streamTracks);

    // 3. Initialize MediaRecorder with optimized bitrate and chosen mimeType
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: targetBitrate,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // 4. Run recording loop while playing video
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      let isCompleted = false;
      let animId: number | null = null;

      const finish = (resultBlob?: Blob, err?: Error) => {
        if (isCompleted) return;
        isCompleted = true;

        if (animId !== null) cancelAnimationFrame(animId);
        video.pause();

        combinedStream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });

        if (err) {
          reject(err);
        } else if (resultBlob) {
          resolve(resultBlob);
        }
      };

      recorder.onstop = () => {
        if (chunks.length === 0) {
          finish(undefined, new Error('No video data chunks captured during compression'));
          return;
        }
        const outputBlob = new Blob(chunks, { type: mimeType });
        finish(outputBlob);
      };

      recorder.onerror = (e: any) => {
        finish(undefined, new Error(`MediaRecorder error: ${e?.error?.message || 'Unknown recording error'}`));
      };

      // Watch for external cancellation via AbortSignal
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          try {
            recorder.stop();
          } catch {}
          finish(undefined, new Error('Video compression was cancelled by user'));
        });
      }

      // Start recording
      recorder.start(250); // collect chunks every 250ms

      const drawLoop = () => {
        if (isCompleted) return;

        try {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        } catch {}

        const currentTime = video.currentTime;
        const dur = video.duration || 1;
        const rawPct = Math.min(99, Math.round((currentTime / dur) * 100));

        if (options?.onProgress) {
          options.onProgress({
            percent: rawPct,
            currentTime,
            duration: dur,
            status: `Compressing to 720p (${rawPct}%)...`,
          });
        }

        animId = requestAnimationFrame(drawLoop);
      };

      video.onended = () => {
        if (options?.onProgress) {
          options.onProgress({
            percent: 100,
            currentTime: video.duration,
            duration: video.duration,
            status: 'Finalizing compressed 720p video...',
          });
        }
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      // Play video to push frames
      video.currentTime = 0;
      video.playbackRate = 1.0;
      video
        .play()
        .then(() => {
          drawLoop();
        })
        .catch((playErr) => {
          // If playback failed, reject
          finish(undefined, new Error(`Playback failed during compression: ${playErr.message}`));
        });

      // Safety timeout (max 45 seconds)
      const maxWaitMs = Math.min(60000, Math.max(15000, (duration + 5) * 1000));
      setTimeout(() => {
        if (!isCompleted) {
          if (recorder.state === 'recording') {
            recorder.stop();
          } else {
            finish(undefined, new Error('Compression timed out'));
          }
        }
      }, maxWaitMs);
    });

    const compressedSize = compressedBlob.size;

    // Check if compressed video exceeds limit
    if (compressedSize > maxSizeBytes) {
      throw new Error(
        `Compressed video (${formatBytes(compressedSize)}) still exceeds the ${formatBytes(maxSizeBytes)} limit. Please choose a shorter clip.`
      );
    }

    const savedBytes = Math.max(0, originalSize - compressedSize);
    const compressionRatio = Number((compressedSize / originalSize).toFixed(2));

    return {
      blob: compressedBlob,
      originalSize,
      compressedSize,
      originalWidth,
      originalHeight,
      targetWidth,
      targetHeight,
      duration,
      savedBytes,
      compressionRatio,
      wasCompressed: true,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
