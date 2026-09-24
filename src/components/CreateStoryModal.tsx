import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Film,
  Image as ImageIcon,
  Sparkles,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Globe,
  RefreshCw,
  Link2,
} from 'lucide-react';
import { SupportedLanguage, translations } from '../translations';
import { User } from '../types';
import { compressImage } from '../utils/imageCompressor';
import {
  compressVideo,
  validateVideoFileSize,
  formatBytes,
  MAX_VIDEO_UPLOAD_SIZE_BYTES,
} from '../utils/videoCompressor';
import {
  uploadMediaToStorage,
  verifyFirebaseConfig,
  FirebaseDiagnosticStatus,
} from '../services/firebase';
import { pauseAllMedia } from '../utils/mediaCoordinator';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlide?: (mediaUrl: string, mediaType: 'image' | 'video', caption: string) => void;
  onAddStory?: (mediaUrl: string, mediaType: 'image' | 'video', caption: string) => void;
  currentUser?: User;
  currentLanguage?: SupportedLanguage;
}

const SAMPLE_STORY_MEDIA = [
  {
    title: 'Festive Celebration 🪔',
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
    type: 'image' as const,
  },
  {
    title: 'Stage Performance 🎬',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-performing-a-trick-in-a-skatepark-42861-large.mp4',
    type: 'video' as const,
  },
  {
    title: 'Dholak Folk Beats 🥁',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-a-traditional-drum-42415-large.mp4',
    type: 'video' as const,
  },
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onAddSlide,
  onAddStory,
  currentUser,
  currentLanguage = 'en',
}) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [pendingFile, setPendingFile] = useState<File | Blob | null>(null);
  const [videoCompression, setVideoCompression] = useState<{
    isCompressing: boolean;
    percent: number;
    status: string;
    originalSize: number;
  } | null>(null);
  const [videoAlert, setVideoAlert] = useState<{
    title: string;
    message: string;
    details?: string;
    type: 'error' | 'warning';
  } | null>(null);
  const compressionAbortRef = useRef<AbortController | null>(null);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [firebaseDiagnostics, setFirebaseDiagnostics] = useState<FirebaseDiagnosticStatus | null>(null);
  const [storageWarning, setStorageWarning] = useState<{
    title: string;
    message: string;
    code?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeObjectUrlRef = useRef<string | null>(null);

  const t = translations[currentLanguage];

  // Pause all background media when opening story creator
  useEffect(() => {
    if (isOpen) {
      pauseAllMedia();
    }
  }, [isOpen]);

  // Cleanup object URL on unmount or reset
  useEffect(() => {
    return () => {
      if (activeObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(activeObjectUrlRef.current);
        } catch {}
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStorageWarning(null);
    setVideoAlert(null);

    const isVideo = file.type.startsWith('video');
    setMediaType(isVideo ? 'video' : 'image');

    // Revoke any previous preview URL
    if (activeObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(activeObjectUrlRef.current);
      } catch {}
      activeObjectUrlRef.current = null;
    }

    if (isVideo) {
      // 1. Initial size validation against 25MB limit
      const validation = validateVideoFileSize(file, MAX_VIDEO_UPLOAD_SIZE_BYTES);
      if (!validation.valid) {
        setVideoAlert({
          title: 'Video Exceeds 25MB Limit',
          message: validation.error || `Selected video (${validation.sizeMB} MB) is too large for upload.`,
          details: 'Maximum file size allowed is 25 MB. Please trim your video or choose a smaller clip.',
          type: 'error',
        });
        return;
      }

      setPendingFile(file);
      const objUrl = URL.createObjectURL(file);
      activeObjectUrlRef.current = objUrl;
      setMediaUrl(objUrl);

      // 2. Automatic client-side video compression to 720p with optimized bitrate
      const abortCtrl = new AbortController();
      compressionAbortRef.current = abortCtrl;
      setVideoCompression({
        isCompressing: true,
        percent: 0,
        status: 'Compressing story video to 720p...',
        originalSize: file.size,
      });

      try {
        const result = await compressVideo(file, {
          maxDimension: 720,
          targetBitrate: 2_000_000,
          maxSizeBytes: MAX_VIDEO_UPLOAD_SIZE_BYTES,
          signal: abortCtrl.signal,
          onProgress: (p) => {
            setVideoCompression((prev) =>
              prev ? { ...prev, percent: p.percent, status: p.status } : null
            );
          },
        });

        setPendingFile(result.blob);
        const compressedUrl = URL.createObjectURL(result.blob);
        if (activeObjectUrlRef.current) {
          try {
            URL.revokeObjectURL(activeObjectUrlRef.current);
          } catch {}
        }
        activeObjectUrlRef.current = compressedUrl;
        setMediaUrl(compressedUrl);
      } catch (compErr: any) {
        console.warn('Story video compression notice:', compErr?.message);
        if (file.size > MAX_VIDEO_UPLOAD_SIZE_BYTES) {
          setVideoAlert({
            title: 'Video Too Large (Max 25MB)',
            message: `Compression failed and original video (${formatBytes(file.size)}) exceeds the 25MB upload limit.`,
            details: 'Please choose a shorter or smaller video clip under 25MB.',
            type: 'error',
          });
          setPendingFile(null);
          setMediaUrl('');
        } else {
          setPendingFile(file);
          setVideoAlert({
            title: 'Compression Notice',
            message: `Using original video (${formatBytes(file.size)}): ${compErr?.message || 'Compression skipped'}. File is within the 25MB limit.`,
            type: 'warning',
          });
        }
      } finally {
        setVideoCompression(null);
        compressionAbortRef.current = null;
      }
    } else {
      setPendingFile(file);
      try {
        // Automatically compress image for fast upload
        const compressed = await compressImage(file, 1080, 1080, 0.75);
        setMediaUrl(compressed);
      } catch {
        const objUrl = URL.createObjectURL(file);
        activeObjectUrlRef.current = objUrl;
        setMediaUrl(objUrl);
      }
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    const isVideo = urlInput.endsWith('.mp4') || urlInput.endsWith('.webm');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaUrl(urlInput.trim());
    setPendingFile(null);
    setUrlInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;

    const finalMediaUrl = mediaUrl;

    const addFn = onAddStory || onAddSlide;
    if (addFn) {
      addFn(finalMediaUrl, mediaType, caption.trim());
    }

    // Optional non-blocking background upload (zero retry delay, doesn't block the UI)
    if (pendingFile) {
      uploadMediaToStorage(pendingFile, 'stories').catch(() => {});
    }

    setMediaUrl('');
    setCaption('');
    setPendingFile(null);
    onClose();
  };

  return (
    <div
      id="create-story-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* User Warning Alert Dialog if Video is Too Large or Compression Fails */}
        {videoAlert && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-neutral-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl text-white">
              <div className="flex items-start gap-2.5 mb-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    videoAlert.type === 'error'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                      : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4
                    className={`text-sm font-bold flex items-center gap-1.5 ${
                      videoAlert.type === 'error' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {videoAlert.title}
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {videoAlert.message}
                  </p>
                  {videoAlert.details && (
                    <p className="text-[10px] text-neutral-400 mt-1.5 bg-neutral-950/80 p-2 rounded-lg border border-neutral-800">
                      {videoAlert.details}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setVideoAlert(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition active:scale-95 cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Automatic 720p Video Compression Progress Indicator */}
        {videoCompression && videoCompression.isCompressing && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-xs bg-neutral-900 border border-sky-500/40 rounded-2xl p-4 shadow-2xl text-white text-center">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center mx-auto mb-2.5">
                <Film className="w-5 h-5 text-sky-400 animate-pulse" />
              </div>

              <h4 className="text-xs font-bold text-white mb-0.5">
                Optimizing Story Video to 720p
              </h4>
              <p className="text-[11px] text-neutral-400 mb-2.5">
                Reducing resolution & bitrate for fast mobile streaming...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-200"
                  style={{ width: `${videoCompression.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-3 font-mono">
                <span>{videoCompression.status}</span>
                <span className="font-bold text-sky-400">{videoCompression.percent}%</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (compressionAbortRef.current) {
                    compressionAbortRef.current.abort();
                  }
                }}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel Compression
              </button>
            </div>
          </div>
        )}

        {/* Storage Warning Modal Banner if Bucket is Unreachable */}
        {storageWarning && (
          <div className="p-4 bg-amber-500/15 border-b border-amber-500/30 text-neutral-900 dark:text-white">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {storageWarning.title}
                </h4>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                  {storageWarning.message}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsTestingStorage(true);
                      const diag = await verifyFirebaseConfig();
                      setFirebaseDiagnostics(diag);
                      setIsTestingStorage(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-semibold flex items-center gap-1 hover:bg-sky-500/30 transition cursor-pointer"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{isTestingStorage ? 'Checking...' : 'Check Firebase Status'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageWarning(null)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold hover:opacity-80 transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>

                {/* Quick alternative verified sample stories */}
                <div className="mt-2.5 pt-2 border-t border-amber-500/20">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                    Or select high-speed sample story:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_STORY_MEDIA.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => {
                          setMediaUrl(s.url);
                          setMediaType(s.type);
                          setPendingFile(null);
                          setStorageWarning(null);
                        }}
                        className="text-[10px] px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                {firebaseDiagnostics && (
                  <div className="mt-2 p-2 rounded bg-black/40 text-[10px] font-mono text-neutral-300 space-y-0.5">
                    <div>Bucket: {firebaseDiagnostics.storageBucket}</div>
                    <div className={firebaseDiagnostics.storageReachable ? 'text-emerald-400' : 'text-amber-400'}>
                      Storage: {firebaseDiagnostics.storageStatusMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 flex items-center justify-center p-[2px]">
              <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-rose-500" />
              </div>
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Add to Your Story
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close story creation"
            className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Media Preview or Upload Area */}
          {!mediaUrl ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-8 text-center bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/80 transition">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="story-file-input"
              />
              <div className="w-14 h-14 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                Upload Photo or Video
              </h4>
              <p className="text-xs text-neutral-500 mb-4 max-w-xs">
                Uploads directly to Cloud Storage. No offline browser quota limits.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Choose Media</span>
              </button>

              <div className="w-full flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
                <span className="text-[10px] uppercase font-semibold text-neutral-400">or sample story</span>
                <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {SAMPLE_STORY_MEDIA.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => {
                      setMediaUrl(s.url);
                      setMediaType(s.type);
                      setPendingFile(null);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              <div className="w-full flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim()}
                  className="px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Load
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative aspect-[9/16] max-h-[360px] w-full rounded-2xl overflow-hidden bg-black mx-auto flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setPendingFile(null);
                    setStorageWarning(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer"
                  title="Remove and choose different media"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Caption Input */}
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Story Caption (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add text or thought to your story..."
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                  maxLength={120}
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          {mediaUrl && (
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white font-semibold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Share to Your Story</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
