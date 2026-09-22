import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Hash,
  ArrowLeft,
  Check,
  UploadCloud,
  Clapperboard,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Film,
  Radio,
  ShoppingBag,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Link2,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { Post, User, Reel } from '../types';
import { GoLiveStudio } from './GoLiveStudio';
import { ReelsCamera } from './ReelsCamera';
import { ErrorBoundary } from './ErrorBoundary';
import { ReelsAudioSelector } from './ReelsAudioSelector';
import { moderationService } from '../services/moderationService';
import { inferCategory } from '../services/recommendationEngine';
import {
  compressImage,
  compressImageToBlob,
  compressVideoToBlob,
  prepareMediaForUpload,
  dataUrlToBlob,
  generateVideoThumbnail,
  createVideoFallbackDataUrl,
  fileToDataUrl,
} from '../utils/imageCompressor';
import {
  UGCCommunityGuidelinesModal,
  hasUserConsentedToUGC,
} from './UGCCommunityGuidelinesModal';
import {
  uploadMediaToStorage,
  checkAndIncrementDailyUpload,
  savePostToFirestore,
  verifyFirebaseConfig,
  FirebaseDiagnosticStatus,
} from '../services/firebase';
import { pauseAllMedia } from '../utils/mediaCoordinator';

export const SAMPLE_REEL_VIDEOS = [
  {
    title: 'Heritage & Festivals',
    desc: 'Festive celebration & lights',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    title: 'Dance & Beats',
    desc: 'Rhythm and motion reel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    title: 'Nature & Serenity',
    desc: 'Cinematic landscape capture',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  },
  {
    title: 'Creative Reel Clip',
    desc: 'High-speed showcase video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
];

interface CreatePostModalProps {
  currentUser: User;
  onClose: () => void;
  onPostCreated: (newPost: Post, newReel?: Reel) => void;
  initialSelectedAudio?: string;
  initialMediaType?: 'image' | 'video' | 'live';
  onShowToast?: (message: string) => void;
  onOpenLegalPolicy?: (tab: 'privacy' | 'terms' | 'ugc') => void;
}

const filterOptions = [
  { name: 'Normal', class: '' },
  { name: 'Clarendon', class: 'contrast-125 saturate-125' },
  { name: 'Vintage', class: 'sepia-[0.35] contrast-110 brightness-95' },
  { name: 'Vivid', class: 'saturate-150 contrast-115' },
  { name: 'Noir', class: 'grayscale contrast-125' },
  { name: 'Warm', class: 'sepia-[0.2] hue-rotate-[-10deg] brightness-105' },
];

const defaultTrendingAudios = [
  'Original Audio • Original Track',
  'Lollypop Lagelu • Pawan Singh',
  'Pudina Ae Hasina • Pawan Singh',
  'Nathuniya • Khesari Lal Yadav',
  'Pagal Banaibe Ka Re Patarki • Khesari Lal',
  'Raja Ji Ke Dilwa • Shilpi Raj',
  'Relia Re • Shilpi Raj',
  'Dhibari Me Rahue Na Tel • Pawan Singh & Shilpi Raj',
  'Le Le Aayi Coca Cola • Pawan Singh',
  'Saiya Ke Roti • Khesari Lal Yadav',
  'Kamar Kamra Ba • Shilpi Raj',
  'Ara Jila Ghar Ba • Folk Dholak Bass',
  'Kesariya • Acoustic Soul (Brahmāstra)',
  'Chaleya • Jawan Beats',
  'Brown Munde • AP Dhillon & Gurinder Gill',
];

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
  initialSelectedAudio,
  initialMediaType,
  onShowToast,
  onOpenLegalPolicy,
}) => {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'live'>(
    initialMediaType || (initialSelectedAudio ? 'video' : 'image')
  );
  const [step, setStep] = useState<'upload' | 'edit' | 'caption'>('upload');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedAudio, setSelectedAudio] = useState(
    initialSelectedAudio || 'Original Audio'
  );
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<{
    id: string;
    title: string;
    artist: string;
    audioUrl?: string;
    coverUrl?: string;
  } | null>(null);
  const [customAudio, setCustomAudio] = useState('');
  const [isCustomAudioActive, setIsCustomAudioActive] = useState(false);
  const [shareAsReel, setShareAsReel] = useState(true);
  const [caption, setCaption] = useState('');
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [hasProductTag, setHasProductTag] = useState(false);
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Handcrafted & Local');
  const [productWhatsapp, setProductWhatsapp] = useState('919876543210');
  const [isDragging, setIsDragging] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);

  // Combine initialSelectedAudio with trending options
  const trendingAudioOptions = React.useMemo(() => {
    if (initialSelectedAudio && !defaultTrendingAudios.includes(initialSelectedAudio)) {
      return [initialSelectedAudio, ...defaultTrendingAudios];
    }
    return defaultTrendingAudios;
  }, [initialSelectedAudio]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAudioSelectorOpen, setIsAudioSelectorOpen] = useState(false);
  const [isUgcConsentModalOpen, setIsUgcConsentModalOpen] = useState(false);
  const [pendingActionAfterConsent, setPendingActionAfterConsent] = useState<
    'camera' | 'upload' | 'share' | null
  >(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | Blob | null>(null);
  const [storageWarning, setStorageWarning] = useState<{
    title: string;
    message: string;
    code?: string;
    isStorageDown?: boolean;
  } | null>(null);
  const [directUrlInput, setDirectUrlInput] = useState('');
  const [showDirectUrlBox, setShowDirectUrlBox] = useState(false);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [firebaseDiagnostics, setFirebaseDiagnostics] = useState<FirebaseDiagnosticStatus | null>(null);

  // Immediately stop any playing feed videos when create modal opens
  useEffect(() => {
    pauseAllMedia();
  }, []);

  const handleRequestCamera = () => {
    if (!hasUserConsentedToUGC()) {
      setPendingActionAfterConsent('camera');
      setIsUgcConsentModalOpen(true);
      return;
    }
    pauseAllMedia();
    setIsCameraOpen(true);
  };

  const handleRequestUpload = () => {
    if (!hasUserConsentedToUGC()) {
      setPendingActionAfterConsent('upload');
      setIsUgcConsentModalOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleConsentAgreed = () => {
    setIsUgcConsentModalOpen(false);
    const action = pendingActionAfterConsent;
    setPendingActionAfterConsent(null);
    if (action === 'camera') {
      pauseAllMedia();
      setIsCameraOpen(true);
    } else if (action === 'upload') {
      fileInputRef.current?.click();
    } else if (action === 'share') {
      handleShare();
    }
  };

  const handleConsentDeclined = () => {
    setIsUgcConsentModalOpen(false);
    setPendingActionAfterConsent(null);
  };

  const handleVideoRecorded = async (
    videoBlob: Blob,
    videoUrl: string,
    thumbnail?: string,
    audioTitle?: string
  ) => {
    setMediaType('video');
    const directUrl = videoUrl || URL.createObjectURL(videoBlob);
    setSelectedMediaUrl(directUrl);
    setShareAsReel(true);
    setIsCameraOpen(false);

    if (audioTitle) {
      setSelectedAudio(audioTitle);
    }

    if (thumbnail) {
      setThumbnailDataUrl(thumbnail);
    } else {
      try {
        const thumb = await generateVideoThumbnail(
          new File([videoBlob], 'recorded-reel.mp4', {
            type: videoBlob.type || 'video/mp4',
          }),
          640,
          640,
          0.7
        );
        setThumbnailDataUrl(thumb);
      } catch {
        setThumbnailDataUrl(createVideoFallbackDataUrl('Recorded Reel'));
      }
    }

    // Convert to base64 if small for direct offline and feed persistence
    if (videoBlob.size <= 3 * 1024 * 1024) {
      fileToDataUrl(videoBlob).then((b64) => {
        setSelectedMediaUrl(b64);
      }).catch(() => {});
    }

    setStep('edit');
    setPendingUploadFile(videoBlob);
    if (onShowToast) {
      onShowToast('🎬 Reel ready!');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingUploadFile(file);
      const isVideo = file.type.startsWith('video/');

      if (isVideo) {
        const objectUrl = URL.createObjectURL(file);
        setMediaType('video');
        setSelectedMediaUrl(objectUrl);
        setStep('edit');

        // Extract thumbnail
        try {
          const thumb = await generateVideoThumbnail(file, 640, 640, 0.7);
          setThumbnailDataUrl(thumb);
        } catch {
          setThumbnailDataUrl(createVideoFallbackDataUrl(file.name || 'Video Reel'));
        }

        // Convert to base64 for direct offline feed support if under 3MB
        if (file.size <= 3 * 1024 * 1024) {
          fileToDataUrl(file).then((b64) => {
            setSelectedMediaUrl(b64);
          }).catch(() => {});
        }
      } else {
        setMediaType('image');
        setIsCompressingPhoto(true);
        try {
          // Aggressively compress/resize image to max 800px width/height and JPEG 0.72 quality (~40-90KB)
          const compressed = await compressImage(file, 800, 800, 0.72);
          setSelectedMediaUrl(compressed);
          setThumbnailDataUrl(compressed);
          setPendingUploadFile(dataUrlToBlob(compressed));
          setStep('edit');
        } catch {
          try {
            const dataUrl = await fileToDataUrl(file);
            setSelectedMediaUrl(dataUrl);
            setThumbnailDataUrl(dataUrl);
            setPendingUploadFile(dataUrlToBlob(dataUrl));
            setStep('edit');
          } catch {
            const objectUrl = URL.createObjectURL(file);
            setSelectedMediaUrl(objectUrl);
            setThumbnailDataUrl(objectUrl);
            setStep('edit');
          }
        } finally {
          setIsCompressingPhoto(false);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPendingUploadFile(file);
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (isVideo) {
        const objectUrl = URL.createObjectURL(file);
        setMediaType('video');
        setSelectedMediaUrl(objectUrl);
        setStep('edit');

        // Extract thumbnail
        try {
          const thumb = await generateVideoThumbnail(file, 640, 640, 0.7);
          setThumbnailDataUrl(thumb);
        } catch {
          setThumbnailDataUrl(createVideoFallbackDataUrl(file.name || 'Video Reel'));
        }

        // Convert to base64 for direct offline feed support if under 3MB
        if (file.size <= 3 * 1024 * 1024) {
          fileToDataUrl(file).then((b64) => {
            setSelectedMediaUrl(b64);
          }).catch(() => {});
        }
      } else if (isImage) {
        setMediaType('image');
        setIsCompressingPhoto(true);
        try {
          const compressed = await compressImage(file, 800, 800, 0.72);
          setSelectedMediaUrl(compressed);
          setThumbnailDataUrl(compressed);
          setPendingUploadFile(dataUrlToBlob(compressed));
          setStep('edit');
        } catch {
          try {
            const dataUrl = await fileToDataUrl(file);
            setSelectedMediaUrl(dataUrl);
            setThumbnailDataUrl(dataUrl);
            setPendingUploadFile(dataUrlToBlob(dataUrl));
            setStep('edit');
          } catch {
            const objectUrl = URL.createObjectURL(file);
            setSelectedMediaUrl(objectUrl);
            setThumbnailDataUrl(objectUrl);
            setStep('edit');
          }
        } finally {
          setIsCompressingPhoto(false);
        }
      }
    }
  };

  const togglePreviewPlay = () => {
    if (!previewVideoRef.current) return;
    if (previewVideoRef.current.paused) {
      previewVideoRef.current.play().then(() => {
        setPreviewPlaying(true);
      }).catch(() => {
        setPreviewPlaying(false);
      });
    } else {
      previewVideoRef.current.pause();
      setPreviewPlaying(false);
    }
  };

  const finalAudioTitle = isCustomAudioActive && customAudio.trim()
    ? customAudio.trim()
    : selectedAudio;

  const handleShare = async () => {
    if (!selectedMediaUrl) return;

    // Policy Compliance Check: Ensure creator consent has been granted
    if (!hasUserConsentedToUGC()) {
      setPendingActionAfterConsent('share');
      setIsUgcConsentModalOpen(true);
      return;
    }

    // Automatic Text Moderation (Banned Words Filter)
    const moderationCheck = moderationService.validateContent(caption);
    if (!moderationCheck.isValid) {
      const errorMsg = 'Post cannot be published. Content violates our community guidelines regarding explicit or inappropriate language.';
      setModerationWarning(errorMsg);
      if (onShowToast) {
        onShowToast(errorMsg);
      }
      return;
    }

    setModerationWarning(null);

    const parsedTags = tagsInput
      .split(/[, #]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const productTag =
      hasProductTag && productTitle.trim()
        ? {
            id: `prod-${Date.now()}`,
            title: productTitle.trim(),
            price: Math.max(1, parseFloat(productPrice) || 499),
            currency: '₹',
            whatsappNumber: productWhatsapp.trim() || '919876543210',
            category: productCategory,
          }
        : undefined;

    const now = Date.now();
    const postId = `post-${now}`;
    const persistedThumbnail =
      thumbnailDataUrl ||
      (mediaType === 'image'
        ? selectedMediaUrl
        : createVideoFallbackDataUrl(caption || 'Video Reel'));

    const parsedCategory = inferCategory({
      caption,
      tags: parsedTags,
      audioTitle: finalAudioTitle,
      location,
    });

    const newPost: Post = {
      id: postId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      isVerified: currentUser.isVerified,
      location: location.trim() || undefined,
      mediaUrl: selectedMediaUrl,
      thumbnailUrl: persistedThumbnail,
      mediaType: mediaType === 'video' ? 'video' : 'image',
      caption: caption.trim() || (mediaType === 'video' ? 'New Reel' : 'No caption'),
      tags: parsedTags,
      category: parsedCategory,
      likesCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      timestamp: 'Just now',
      filter: mediaType === 'image' ? selectedFilter : undefined,
      audioTitle: mediaType === 'video' ? finalAudioTitle : undefined,
      audioArtist: mediaType === 'video' ? (selectedAudioTrack?.artist || (finalAudioTitle.includes('•') ? finalAudioTitle.split('•')[1].trim() : currentUser.username)) : undefined,
      audioUrl: mediaType === 'video' ? selectedAudioTrack?.audioUrl : undefined,
      audioCover: mediaType === 'video' ? selectedAudioTrack?.coverUrl : undefined,
      viewsCount: mediaType === 'video' ? 1 : undefined,
      productTag,
      createdAt: now,
      isUserCreated: true,
    };

    let newReel: Reel | undefined;
    if (mediaType === 'video' && shareAsReel) {
      newReel = {
        id: postId,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
        videoUrl: selectedMediaUrl,
        thumbnailUrl: persistedThumbnail,
        caption: caption.trim() || 'New Reel',
        category: parsedCategory,
        audioTitle: finalAudioTitle,
        audioArtist: selectedAudioTrack?.artist || (finalAudioTitle.includes('•') ? finalAudioTitle.split('•')[1].trim() : currentUser.username),
        audioUrl: selectedAudioTrack?.audioUrl,
        audioCover: selectedAudioTrack?.coverUrl,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: false,
        isSaved: false,
        comments: [],
        tags: parsedTags,
        timestamp: 'Just now',
        productTag,
        createdAt: now,
        isUserCreated: true,
      };
    }

    // Direct and instant: save immediately to Firestore posts feed and local feed
    try {
      let finalMediaUrl = selectedMediaUrl || '';
      if (!finalMediaUrl && pendingUploadFile) {
        finalMediaUrl = URL.createObjectURL(pendingUploadFile);
      }

      newPost.mediaUrl = finalMediaUrl;
      if (newReel) {
        newReel.videoUrl = finalMediaUrl;
      }

      // Save post document to Cloud Firestore immediately
      try {
        savePostToFirestore(newPost).catch((firestoreErr: any) => {
          console.warn('[Firestore] Notice during savePostToFirestore:', firestoreErr?.message);
        });
      } catch {}

      // Optional background cloud upload attempt (completely non-blocking, zero delays or retries)
      if (pendingUploadFile) {
        uploadMediaToStorage(
          pendingUploadFile,
          mediaType === 'video' ? 'reels' : 'photos',
          undefined,
          newPost.id
        )
          .then((cloudUrl) => {
            if (cloudUrl) {
              savePostToFirestore({ ...newPost, mediaUrl: cloudUrl }).catch(() => {});
            }
          })
          .catch(() => {
            // Ignored silently: post is already saved and visible in the feed
          });
      }

      // Immediately trigger post creation and close modal
      onPostCreated(newPost, newReel);
      onClose();

      if (onShowToast) {
        onShowToast(newReel ? '🎬 Reel posted instantly to feed!' : '📸 Post shared instantly to feed!');
      }
    } catch (generalErr: any) {
      onPostCreated(newPost, newReel);
      onClose();
    }
  };

  return (
    <div
      id="create-post-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh]">
        {/* Clear Firebase Storage Warning Dialog if Storage or Bucket is Unreachable */}
        {storageWarning && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-neutral-900 border border-amber-500/50 rounded-2xl p-5 shadow-2xl text-white">
              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                    {storageWarning.title}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {storageWarning.message}
                  </p>
                </div>
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 mb-4 text-xs text-neutral-400 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Browser Storage Protected:</span>
                </div>
                <p className="text-neutral-400">
                  Large video blobs are no longer cached inside browser IndexedDB or LocalStorage to avoid quota limits. All media uploads directly to Firebase Storage.
                </p>
                {storageWarning.code && (
                  <p className="text-[11px] text-amber-400/90 font-mono">
                    Status / Code: {storageWarning.code}
                  </p>
                )}
              </div>

              {/* Direct Media URL Alternative */}
              <div className="mb-4 bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-3">
                <label className="block text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Post with Direct HTTPS Media URL / Sample:</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://.../video.mp4"
                    value={directUrlInput}
                    onChange={(e) => setDirectUrlInput(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (directUrlInput.trim()) {
                        setSelectedMediaUrl(directUrlInput.trim());
                        setPendingUploadFile(null);
                        setStorageWarning(null);
                        setStep('edit');
                      }
                    }}
                    disabled={!directUrlInput.trim()}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Use URL
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-700/40">
                  <span className="text-[11px] text-neutral-400 font-medium block mb-1.5">
                    Or select verified high-speed CDN Reel:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SAMPLE_REEL_VIDEOS.map((sample) => (
                      <button
                        key={sample.title}
                        type="button"
                        onClick={() => {
                          setSelectedMediaUrl(sample.url);
                          setPendingUploadFile(null);
                          setStorageWarning(null);
                          setStep('edit');
                        }}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/50 hover:border-sky-500/50 transition cursor-pointer"
                      >
                        <div className="text-[11px] font-semibold text-neutral-200 truncate">
                          {sample.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">{sample.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingStorage(true);
                    const diag = await verifyFirebaseConfig();
                    setFirebaseDiagnostics(diag);
                    setIsTestingStorage(false);
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isTestingStorage ? 'Checking...' : 'Check Firebase Status'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStorageWarning(null)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Upload</span>
                  </button>
                </div>
              </div>

              {/* Diagnostic detail popup */}
              {firebaseDiagnostics && (
                <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-neutral-800 text-[11px] space-y-1 font-mono">
                  <div className="text-neutral-300">Project: {firebaseDiagnostics.projectId}</div>
                  <div className="text-neutral-300">Bucket: {firebaseDiagnostics.storageBucket}</div>
                  <div className={firebaseDiagnostics.firestoreConnected ? 'text-emerald-400' : 'text-rose-400'}>
                    Firestore: {firebaseDiagnostics.firestoreConnected ? 'Connected (OK)' : 'Disconnected'}
                  </div>
                  <div className={firebaseDiagnostics.storageReachable ? 'text-emerald-400' : 'text-amber-400'}>
                    Storage: {firebaseDiagnostics.storageStatusMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-12">
            {step !== 'upload' ? (
              <button
                id="create-post-back-btn"
                onClick={() => setStep(step === 'caption' ? 'edit' : 'upload')}
                className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}
          </div>

          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            {mediaType === 'live'
              ? 'Go Live Studio 🔴'
              : step === 'upload'
              ? 'Create new post'
              : step === 'edit'
              ? mediaType === 'video'
                ? 'Reel & Audio settings'
                : 'Select filter'
              : 'New post details'}
          </h2>

          <div className="w-16 flex justify-end">
            {(step === 'upload' || mediaType === 'live') && (
              <button
                id="create-post-close-btn"
                onClick={onClose}
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {mediaType !== 'live' && step === 'edit' && (
              <button
                id="create-post-next-btn"
                onClick={() => setStep('caption')}
                className="text-sm font-semibold text-sky-500 hover:text-sky-600"
              >
                Next
              </button>
            )}
            {mediaType !== 'live' && step === 'caption' && (
              <button
                id="create-post-share-btn"
                onClick={handleShare}
                className="text-sm font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Share
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          {mediaType === 'live' ? (
            <div className="flex flex-col h-full">
              {/* Media Type Switcher Tab Bar */}
              <div className="flex items-center justify-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-3 self-center">
                <button
                  id="tab-select-photo"
                  onClick={() => setMediaType('image')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo Post</span>
                </button>
                <button
                  id="tab-select-video"
                  onClick={() => setMediaType('video')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
                >
                  <Clapperboard className="w-4 h-4 text-amber-500" />
                  <span>Video / Reel</span>
                </button>
                <button
                  id="tab-open-camera"
                  type="button"
                  onClick={() => {
                    pauseAllMedia();
                    setIsCameraOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                  title="Record video with Reels Camera"
                >
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Camera</span>
                </button>
                <button
                  id="tab-select-live"
                  onClick={() => setMediaType('live')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white shadow-sm transition"
                >
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                  <span>Go Live 🔴</span>
                </button>
              </div>

              {/* Full Go Live Studio Screen */}
              <GoLiveStudio currentUser={currentUser} onClose={onClose} />
            </div>
          ) : (
            <>
              {step === 'upload' && (
                <div className="flex flex-col items-center justify-center min-h-[380px]">
              {/* Active Audio Banner when "Use Audio" was tapped */}
              {initialSelectedAudio && (
                <div className="w-full max-w-lg mb-4 py-2 px-3.5 rounded-xl bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-amber-500/15 border border-rose-500/30 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <Music className="w-4 h-4 text-rose-500 flex-shrink-0 animate-pulse" />
                    <div className="truncate">
                      <span className="font-semibold text-rose-500 mr-1.5">Using Audio:</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {initialSelectedAudio}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-rose-500/80 bg-rose-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    Reel Sound
                  </span>
                </div>
              )}

              {/* Media Type Switcher (Photo vs Video/Reel vs Go Live) */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-4">
                <button
                  id="tab-select-photo"
                  onClick={() => setMediaType('image')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    mediaType === 'image'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo Post</span>
                </button>
                <button
                  id="tab-select-video"
                  onClick={() => setMediaType('video')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    mediaType === 'video'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Clapperboard className="w-4 h-4 text-amber-500" />
                  <span>Video / Reel</span>
                </button>
                <button
                  id="tab-select-camera"
                  type="button"
                  onClick={handleRequestCamera}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                  title="Record with Reels Camera"
                >
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Camera</span>
                </button>
                <button
                  id="tab-select-live"
                  onClick={() => setMediaType('live')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    (mediaType as string) === 'live'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400'
                  }`}
                >
                  <Radio className="w-4 h-4 text-rose-500 group-hover:text-white" />
                  <span>Go Live 🔴</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleRequestUpload}
                className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3 text-neutral-600 dark:text-neutral-400">
                  {isCompressingPhoto ? (
                    <Loader2 className="w-7 h-7 text-sky-500 animate-spin" />
                  ) : mediaType === 'video' ? (
                    <Film className="w-7 h-7 text-rose-500" />
                  ) : (
                    <UploadCloud className="w-7 h-7 text-sky-500" />
                  )}
                </div>
                <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1">
                  {isCompressingPhoto
                    ? 'Resizing & optimizing image...'
                    : `Drag ${mediaType === 'video' ? 'videos (MP4, WEBM)' : 'photos (JPG, PNG, WEBP)'} here`}
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  {isCompressingPhoto
                    ? 'Applying canvas resizing to max 800px & 0.7 JPEG quality'
                    : mediaType === 'video'
                    ? 'High definition vertical Reels or horizontal clips'
                    : 'Supports high-res photography (auto-optimized)'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    id="select-computer-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Select from computer
                  </button>
                  <button
                    id="open-camera-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      pauseAllMedia();
                      setIsCameraOpen(true);
                    }}
                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    title="Open Reels Camera to record video"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>
                </div>

                {/* Prominent '🎵 Add Music' feature button on upload screen for video / reels */}
                {mediaType === 'video' && (
                  <div className="w-full max-w-sm mt-4 pt-3 border-t border-neutral-200/80 dark:border-neutral-800">
                    <button
                      id="upload-add-music-prominent-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAudioSelectorOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                    >
                      <Music className="w-4 h-4 text-white animate-pulse" />
                      <span>{selectedAudio ? `🎵 Attached: ${selectedAudio}` : '🎵 Add Music (Royalty-Free & Trending)'}</span>
                    </button>
                    {selectedAudio && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-lg">
                        <span className="truncate max-w-[220px] font-semibold text-rose-500">
                          Track: {selectedAudio}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAudio(null);
                          }}
                          className="text-neutral-400 hover:text-rose-500 font-semibold transition"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Direct Media URL & High-Speed Sample Videos */}
              <div className="w-full max-w-lg mt-3.5">
                <button
                  type="button"
                  onClick={() => setShowDirectUrlBox(!showDirectUrlBox)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-neutral-100 dark:bg-neutral-800/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>Or paste Direct Media URL / Use Sample Reels</span>
                  </span>
                  <span className="text-[10px] text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
                    {showDirectUrlBox ? 'Hide' : 'Direct CDN'}
                  </span>
                </button>

                {showDirectUrlBox && (
                  <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs space-y-2.5 animate-in fade-in">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://.../video.mp4 or photo.jpg"
                        value={directUrlInput}
                        onChange={(e) => setDirectUrlInput(e.target.value)}
                        className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (directUrlInput.trim()) {
                            setSelectedMediaUrl(directUrlInput.trim());
                            setPendingUploadFile(null);
                            setStep('edit');
                          }
                        }}
                        disabled={!directUrlInput.trim()}
                        className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-semibold rounded-lg transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1.5">
                        High-Definition Preset Reels:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {SAMPLE_REEL_VIDEOS.map((sample) => (
                          <button
                            key={sample.title}
                            type="button"
                            onClick={() => {
                              setSelectedMediaUrl(sample.url);
                              setPendingUploadFile(null);
                              setStep('edit');
                            }}
                            className="text-left p-2 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 border border-neutral-200 dark:border-neutral-700 transition cursor-pointer"
                          >
                            <div className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                              {sample.title}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate">{sample.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'edit' && selectedMediaUrl && (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Media Preview */}
              <div className="relative w-full md:w-3/5 aspect-square bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center group">
                {mediaType === 'video' ? (
                  <>
                    <video
                      ref={previewVideoRef}
                      src={selectedMediaUrl}
                      autoPlay
                      loop
                      playsInline
                      muted={previewMuted}
                      className="w-full h-full object-cover"
                    />
                    {/* Floating Controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                        aria-label={previewPlaying ? 'Pause video' : 'Play video'}
                      >
                        {previewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMuted((prev) => !prev)}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                        aria-label={previewMuted ? 'Unmute video' : 'Mute video'}
                      >
                        {previewMuted ? (
                          <VolumeX className="w-4 h-4 text-white/90" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <img
                    src={selectedMediaUrl}
                    alt="Edit preview"
                    className={`w-full h-full object-cover ${selectedFilter}`}
                  />
                )}
              </div>

              {/* Settings Column: Filters for image, or Audio & Reel toggles for video */}
              <div className="w-full md:w-2/5 flex flex-col gap-4">
                {mediaType === 'image' ? (
                  <>
                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Choose a Filter
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      {filterOptions.map((f) => (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFilter(f.class)}
                          className={`flex flex-col items-center p-1.5 rounded-lg border transition ${
                            selectedFilter === f.class
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                          }`}
                        >
                          <div className="w-14 h-14 rounded overflow-hidden mb-1">
                            <img
                              src={selectedMediaUrl}
                              alt={f.name}
                              className={`w-full h-full object-cover ${f.class}`}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                            {f.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Audio Track Picker */}
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Music className="w-4 h-4 text-rose-500" />
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                            Select Audio Track
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAudioSelectorOpen(true)}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          Browse Library →
                        </button>
                      </div>

                      {/* Prominent Browse Songs Button */}
                      <button
                        id="open-bhojpuri-audio-selector-btn"
                        type="button"
                        onClick={() => setIsAudioSelectorOpen(true)}
                        className="w-full mb-2.5 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>Search & Pick Bhojpuri Song (Pawan, Khesari, Shilpi) 🎵</span>
                      </button>

                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {trendingAudioOptions.map((track) => (
                          <button
                            key={track}
                            type="button"
                            onClick={() => {
                              setSelectedAudio(track);
                              setIsCustomAudioActive(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between border transition ${
                              !isCustomAudioActive && selectedAudio === track
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                            }`}
                          >
                            <span className="truncate">{track}</span>
                            {!isCustomAudioActive && selectedAudio === track && (
                              <Check className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Custom Audio input */}
                      <div className="mt-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Or type custom track name..."
                            value={customAudio}
                            onFocus={() => setIsCustomAudioActive(true)}
                            onChange={(e) => {
                              setCustomAudio(e.target.value);
                              setIsCustomAudioActive(true);
                            }}
                            className="flex-1 bg-neutral-50 dark:bg-neutral-800 text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reels sharing toggle */}
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Clapperboard className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                            Share to Reels Tab
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            Also display in full-screen Reels feed
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={shareAsReel}
                        onChange={(e) => setShareAsReel(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'caption' && selectedMediaUrl && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Media Thumbnail */}
              <div className="relative w-full md:w-1/2 aspect-square rounded-xl overflow-hidden bg-neutral-900">
                {mediaType === 'video' ? (
                  <>
                    <video
                      src={selectedMediaUrl}
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                      <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reel</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] truncate flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="truncate">{finalAudioTitle}</span>
                    </div>
                  </>
                ) : (
                  <img
                    src={selectedMediaUrl}
                    alt="Post preview"
                    className={`w-full h-full object-cover ${selectedFilter}`}
                  />
                )}
              </div>

              {/* Post Details Form */}
              <div className="w-full md:w-1/2 flex flex-col gap-3.5">
                {/* User author info */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {currentUser.username}
                  </span>
                </div>

                {/* Caption input */}
                <div>
                  <textarea
                    id="post-caption-textarea"
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={
                      mediaType === 'video'
                        ? 'Write a catchy reel caption...'
                        : 'Write a caption...'
                    }
                    className="w-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 resize-none"
                  />
                  <span className="text-[11px] text-neutral-400 text-right block mt-0.5">
                    {caption.length}/2,200
                  </span>
                </div>

                {/* Location input */}
                <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  <input
                    id="post-location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location (e.g. Marine Drive, Mumbai)"
                    className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Tags input */}
                <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2">
                  <Hash className="w-4 h-4 text-neutral-400" />
                  <input
                    id="post-tags-input"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Tags separated by commas (e.g. reels, mumbai, goa, jhalak)"
                    className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                {/* Business & Product Tagging (D2C / Small Business) */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                          Product Tagging / उत्पाद टैग
                          <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                            D2C & WhatsApp
                          </span>
                        </span>
                        <p className="text-[11px] text-neutral-500">
                          Tag a product with price in ₹ and direct WhatsApp CTA
                        </p>
                      </div>
                    </div>
                    <input
                      id="toggle-product-tag-input"
                      type="checkbox"
                      checked={hasProductTag}
                      onChange={(e) => setHasProductTag(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  {hasProductTag && (
                    <div className="space-y-2.5 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                            Product Title / उत्पाद का नाम
                          </label>
                          <input
                            id="product-tag-title-input"
                            type="text"
                            placeholder="e.g. Pure Silk Banarasi Saree"
                            value={productTitle}
                            onChange={(e) => setProductTitle(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                            Price in ₹ / मूल्य (रुपये)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                              ₹
                            </span>
                            <input
                              id="product-tag-price-input"
                              type="number"
                              min="1"
                              placeholder="e.g. 1499"
                              value={productPrice}
                              onChange={(e) => setProductPrice(e.target.value)}
                              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                          WhatsApp Business Number (with country code)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                            +
                          </span>
                          <input
                            id="product-tag-whatsapp-input"
                            type="text"
                            placeholder="919876543210"
                            value={productWhatsapp}
                            onChange={(e) => setProductWhatsapp(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Moderation Warning Banner (if text violated community rules) */}
                {moderationWarning && (
                  <div
                    id="post-moderation-warning"
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-0.5">Content Moderation Notice</p>
                      <p>{moderationWarning}</p>
                    </div>
                  </div>
                )}

                {/* 3. Strict Safety Disclaimer on Post Upload Screen */}
                <div
                  id="create-post-safety-disclaimer"
                  className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-bold">Zero tolerance for nudity, harassment, or abusive media. Violations will result in an immediate permanent account ban.</span>
                  </p>
                </div>

                {/* Primary Publish Button */}
                <button
                  id="create-post-publish-main-btn"
                  type="button"
                  onClick={handleShare}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white font-bold text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Publish {mediaType === 'video' ? 'Reel' : 'Post'}</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>

    {/* Reels Camera Modal */}
    {isCameraOpen && (
      <ErrorBoundary
        fallbackTitle="Reels Camera Error"
        onReset={() => setIsCameraOpen(false)}
      >
        <ReelsCamera
          currentUser={currentUser}
          onCaptureVideo={handleVideoRecorded}
          onClose={() => setIsCameraOpen(false)}
        />
      </ErrorBoundary>
    )}

    {/* Dedicated Bhojpuri & Pixabay ReelsAudioSelector Modal */}
    {isAudioSelectorOpen && (
      <ReelsAudioSelector
        isOpen={isAudioSelectorOpen}
        onClose={() => setIsAudioSelectorOpen(false)}
        currentTrackTitle={selectedAudio}
        onSelectTrack={(track) => {
          setSelectedAudio(`${track.title} • ${track.artist}`);
          setSelectedAudioTrack({
            id: track.id,
            title: track.title,
            artist: track.artist,
            audioUrl: track.audioUrl || track.previewUrl,
            coverUrl: track.coverUrl,
          });
          setIsCustomAudioActive(false);
          setIsAudioSelectorOpen(false);
          if (onShowToast) {
            onShowToast(`Selected sound: ${track.title} 🎵`);
          }
        }}
      />
    )}

    {/* UGC Community Guidelines & Creator Safety Consent Dialog */}
    <UGCCommunityGuidelinesModal
      isOpen={isUgcConsentModalOpen}
      onAccept={handleConsentAgreed}
      onDecline={handleConsentDeclined}
      onOpenFullPolicy={onOpenLegalPolicy}
    />
  </div>
</div>
  );
};
