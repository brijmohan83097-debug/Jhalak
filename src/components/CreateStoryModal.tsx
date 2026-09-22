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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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
    setPendingFile(file);

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
      // Direct in-memory session object URL; NEVER convert large video blobs to base64!
      const objUrl = URL.createObjectURL(file);
      activeObjectUrlRef.current = objUrl;
      setMediaUrl(objUrl);
    } else {
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
