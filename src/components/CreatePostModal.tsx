import React, { useState, useRef } from 'react';
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
  generateVideoThumbnail,
  createVideoFallbackDataUrl,
  fileToDataUrl,
} from '../utils/imageCompressor';
import {
  UGCCommunityGuidelinesModal,
  hasUserConsentedToUGC,
} from './UGCCommunityGuidelinesModal';
import {
  checkDailyLimit,
  recordDailyUpload,
} from '../services/monetizationService';
import { DailyLimitModal } from './DailyLimitModal';
import {
  uploadMediaToStorage,
  checkAndIncrementDailyUpload,
  savePostToFirestore,
} from '../services/firebase';

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
  const [isPosting, setIsPosting] = useState(false);
  const [postingProgress, setPostingProgress] = useState(0);
  const [postingCompleted, setPostingCompleted] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | Blob | null>(null);
  const [dailyLimitModalType, setDailyLimitModalType] = useState<'photo' | 'reel' | null>(null);

  const handleRequestCamera = () => {
    // Check 24-hour daily limit for reels (max 3 reels per 24 hours)
    const limitStatus = checkDailyLimit(currentUser.id, 'reel');
    if (!limitStatus.allowed) {
      setDailyLimitModalType('reel');
      return;
    }

    if (!hasUserConsentedToUGC()) {
      setPendingActionAfterConsent('camera');
      setIsUgcConsentModalOpen(true);
      return;
    }
    setIsCameraOpen(true);
  };

  const handleRequestUpload = () => {
    // Check 24-hour daily limit for selected media type (max 3 reels or max 3 photos)
    const targetType = mediaType === 'video' ? 'reel' : 'photo';
    const limitStatus = checkDailyLimit(currentUser.id, targetType);
    if (!limitStatus.allowed) {
      setDailyLimitModalType(targetType);
      return;
    }

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
    setSelectedMediaUrl(videoUrl);
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

    if (videoBlob.size <= 1.8 * 1024 * 1024) {
      try {
        const dataUrl = await fileToDataUrl(
          new File([videoBlob], 'recorded-reel.mp4', {
            type: videoBlob.type || 'video/mp4',
          })
        );
        setSelectedMediaUrl(dataUrl);
      } catch {
        // Keep object URL
      }
    }

    setStep('edit');
    setPendingUploadFile(videoBlob);
    if (onShowToast) {
      onShowToast('🎬 Reel video recorded and added directly!');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingUploadFile(file);
      const isVideo = file.type.startsWith('video/');
      const uploadType = isVideo ? 'reel' : 'photo';
      const limitStatus = checkDailyLimit(currentUser.id, uploadType);
      if (!limitStatus.allowed) {
        setDailyLimitModalType(uploadType);
        if (e.target) e.target.value = '';
        return;
      }

      if (isVideo) {
        const objectUrl = URL.createObjectURL(file);
        setMediaType('video');
        setSelectedMediaUrl(objectUrl);
        setStep('edit');

        // Extract persistent lightweight base64 thumbnail from the video
        try {
          const thumb = await generateVideoThumbnail(file, 640, 640, 0.7);
          setThumbnailDataUrl(thumb);
        } catch {
          setThumbnailDataUrl(createVideoFallbackDataUrl(file.name || 'Video Reel'));
        }

        // If video file is small (<= 1.8MB), convert video to persistent base64 data URL
        if (file.size <= 1.8 * 1024 * 1024) {
          try {
            const dataUrl = await fileToDataUrl(file);
            setSelectedMediaUrl(dataUrl);
          } catch {
            // Keep objectUrl for session playback
          }
        }
      } else {
        setMediaType('image');
        setIsCompressingPhoto(true);
        try {
          // Automatically compress/resize image to max 800px width/height and JPEG 0.7 quality
          const compressed = await compressImage(file, 800, 800, 0.7);
          setSelectedMediaUrl(compressed);
          setThumbnailDataUrl(compressed);
          setStep('edit');
        } catch (err) {
          console.warn('Canvas compression fallback on image upload, using base64:', err);
          try {
            const dataUrl = await fileToDataUrl(file);
            setSelectedMediaUrl(dataUrl);
            setThumbnailDataUrl(dataUrl);
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
      const uploadType = isVideo ? 'reel' : 'photo';
      const limitStatus = checkDailyLimit(currentUser.id, uploadType);
      if (!limitStatus.allowed) {
        setDailyLimitModalType(uploadType);
        return;
      }
      if (isVideo) {
        const objectUrl = URL.createObjectURL(file);
        setMediaType('video');
        setSelectedMediaUrl(objectUrl);
        setStep('edit');

        // Extract persistent lightweight base64 thumbnail from the video
        try {
          const thumb = await generateVideoThumbnail(file, 640, 640, 0.7);
          setThumbnailDataUrl(thumb);
        } catch {
          setThumbnailDataUrl(createVideoFallbackDataUrl(file.name || 'Video Reel'));
        }

        // If video file is small (<= 1.8MB), convert video to persistent base64 data URL
        if (file.size <= 1.8 * 1024 * 1024) {
          try {
            const dataUrl = await fileToDataUrl(file);
            setSelectedMediaUrl(dataUrl);
          } catch {
            // Keep objectUrl for session playback
          }
        }
      } else if (isImage) {
        setMediaType('image');
        setIsCompressingPhoto(true);
        try {
          // Automatically compress/resize image to max 800px width/height and JPEG 0.7 quality
          const compressed = await compressImage(file, 800, 800, 0.7);
          setSelectedMediaUrl(compressed);
          setThumbnailDataUrl(compressed);
          setStep('edit');
        } catch (err) {
          console.warn('Canvas compression fallback on drop, using base64:', err);
          try {
            const dataUrl = await fileToDataUrl(file);
            setSelectedMediaUrl(dataUrl);
            setThumbnailDataUrl(dataUrl);
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

    // Daily Limit Enforcement: Max 3 reels and max 3 photo posts per 24 hours
    const uploadType = (mediaType === 'video' || shareAsReel) ? 'reel' : 'photo';
    const limitStatus = checkDailyLimit(currentUser.id, uploadType);
    if (!limitStatus.allowed) {
      setDailyLimitModalType(uploadType);
      return;
    }

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
      viewsCount: mediaType === 'video' ? 1 : undefined,
      productTag,
      createdAt: now,
      isUserCreated: true,
    };

    let newReel: Reel | undefined;
    if (mediaType === 'video' && shareAsReel) {
      newReel = {
        id: `reel-${now}`,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
        videoUrl: selectedMediaUrl,
        thumbnailUrl: persistedThumbnail,
        caption: caption.trim() || 'New Reel',
        category: parsedCategory,
        audioTitle: finalAudioTitle,
        audioArtist: currentUser.username,
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

    // Top progress bar with real Firebase Storage & Firestore sync
    setIsPosting(true);
    setPostingProgress(15);
    setPostingCompleted(false);

    try {
      let finalMediaUrl = selectedMediaUrl;

      // Real Firebase Storage upload with live progress tracking
      if (pendingUploadFile) {
        try {
          finalMediaUrl = await uploadMediaToStorage(
            pendingUploadFile,
            mediaType === 'video' ? 'reels' : 'photos',
            (pct) => {
              setPostingProgress(Math.max(15, Math.min(88, Math.round(15 + pct * 0.73))));
            }
          );
        } catch (storageErr) {
          console.warn('Firebase Storage upload notice, falling back to cached media URL:', storageErr);
        }
      }

      newPost.mediaUrl = finalMediaUrl;
      if (newReel) {
        newReel.videoUrl = finalMediaUrl;
      }

      setPostingProgress(92);

      // Save post document to Cloud Firestore
      try {
        await savePostToFirestore(newPost);
      } catch (firestoreErr) {
        console.warn('Firestore save notice:', firestoreErr);
      }

      // Increment daily upload counter in Firestore & localStorage
      try {
        await checkAndIncrementDailyUpload(currentUser.id, uploadType === 'reel' ? 'video' : 'photo');
      } catch {
        // Safe fallback
      }
      recordDailyUpload(currentUser.id, uploadType);

      setPostingProgress(100);
      setPostingCompleted(true);

      setTimeout(() => {
        onPostCreated(newPost, newReel);
        onClose();
      }, 500);
    } catch (err) {
      console.warn('Post share pipeline notice:', err);
      setPostingProgress(100);
      setPostingCompleted(true);
      recordDailyUpload(currentUser.id, uploadType);
      setTimeout(() => {
        onPostCreated(newPost, newReel);
        onClose();
      }, 500);
    }
  };

  return (
    <div
      id="create-post-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh]">
        {/* 1.5s Top Progress Bar with Green Checkmark */}
        {isPosting && (
          <div className="absolute top-0 inset-x-0 z-50 overflow-hidden">
            {/* Top progress track */}
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800">
              <div
                className={`h-full transition-all duration-75 ease-out ${
                  postingCompleted
                    ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]'
                    : 'bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-500'
                }`}
                style={{ width: `${postingProgress}%` }}
              />
            </div>

            {/* Notification banner with green checkmark */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/95 border-b border-neutral-800 text-white shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold">
                {postingCompleted ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    </div>
                    <span>Posted to Jhalak successfully!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-neutral-200">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span>Sharing post... {postingProgress}%</span>
                  </div>
                )}
              </div>

              {postingCompleted && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> Done
                </span>
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
                  onClick={() => setIsCameraOpen(true)}
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
                      setIsCameraOpen(true);
                    }}
                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    title="Open Reels Camera to record video"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileChange}
                  className="hidden"
                />
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

    {/* Dedicated Bhojpuri ReelsAudioSelector Modal */}
    {isAudioSelectorOpen && (
      <ReelsAudioSelector
        isOpen={isAudioSelectorOpen}
        onClose={() => setIsAudioSelectorOpen(false)}
        currentTrackTitle={selectedAudio}
        onSelectTrack={(track) => {
          setSelectedAudio(`${track.title} • ${track.artist}`);
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

    {/* Daily Posting Limits Modal (Max 3 reels & max 3 photos / 24 hrs) */}
    <DailyLimitModal
      isOpen={!!dailyLimitModalType}
      userId={currentUser.id}
      type={dailyLimitModalType || 'photo'}
      onClose={() => setDailyLimitModalType(null)}
    />
  </div>
</div>
  );
};
