import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Lock,
  SlidersHorizontal,
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
  compressVideo,
  validateVideoFileSize,
  formatBytes,
  MAX_VIDEO_UPLOAD_SIZE_BYTES,
  MAX_VIDEO_UPLOAD_SIZE_MB,
} from '../utils/videoCompressor';
import {
  UGCCommunityGuidelinesModal,
  hasUserConsentedToUGC,
} from './UGCCommunityGuidelinesModal';
import {
  auth,
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
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');

  // Cloud Storage upload states for persistent video URLs
  const [isCloudUploading, setIsCloudUploading] = useState(false);
  const [cloudUploadProgress, setCloudUploadProgress] = useState(0);
  const [cloudUploadStatus, setCloudUploadStatus] = useState('');

  // Custom Thumbnail / Video Cover states
  const [thumbnailSourceType, setThumbnailSourceType] = useState<'auto' | 'frame' | 'custom'>('auto');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [scrubberTime, setScrubberTime] = useState<number>(0);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const customThumbnailInputRef = useRef<HTMLInputElement>(null);

  // Helper to capture a frame from video at a specific timestamp
  const captureVideoFrameAt = useCallback((url: string, timeSec: number): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const vid = document.createElement('video');
        vid.muted = true;
        vid.playsInline = true;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          vid.crossOrigin = 'anonymous';
        }
        vid.preload = 'auto';
        vid.src = url;

        let resolved = false;
        const doCapture = () => {
          if (resolved) return;
          resolved = true;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(vid.videoWidth || 480, 640);
            canvas.height = Math.min(vid.videoHeight || 480, 1140);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
              return;
            }
          } catch {}
          resolve(createVideoFallbackDataUrl('Video Reel'));
        };

        vid.onloadedmetadata = () => {
          try {
            vid.currentTime = Math.min(timeSec, (vid.duration || timeSec) - 0.1);
          } catch {
            doCapture();
          }
        };

        vid.onseeked = () => {
          doCapture();
        };

        vid.onerror = () => {
          resolve(createVideoFallbackDataUrl('Video Reel'));
        };

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(createVideoFallbackDataUrl('Video Reel'));
          }
        }, 3500);
      } catch {
        resolve(createVideoFallbackDataUrl('Video Reel'));
      }
    });
  }, []);

  // Extract snapshot candidate frames across video duration
  const extractSnapshotFrames = useCallback(async (url: string, duration: number) => {
    if (!url || duration <= 0) return;
    setIsExtractingFrames(true);
    try {
      const timestamps = [
        Math.max(0.1, duration * 0.1),
        duration * 0.25,
        duration * 0.5,
        duration * 0.75,
        Math.max(0.2, duration * 0.9),
      ];
      const frames: string[] = [];
      for (const t of timestamps) {
        try {
          const f = await captureVideoFrameAt(url, t);
          if (f && !f.startsWith('data:image/svg')) {
            frames.push(f);
          }
        } catch {}
      }
      if (frames.length > 0) {
        setExtractedFrames(frames);
      }
    } catch (e) {
      console.warn('Frame snapshots extraction error:', e);
    } finally {
      setIsExtractingFrames(false);
    }
  }, [captureVideoFrameAt]);

  // Capture frame from the live preview video element
  const captureFrameFromLivePreview = useCallback(() => {
    const vid = previewVideoRef.current;
    if (!vid) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(vid.videoWidth || 480, 640);
      canvas.height = Math.min(vid.videoHeight || 480, 1140);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setThumbnailDataUrl(dataUrl);
        setThumbnailSourceType('frame');
        if (onShowToast) onShowToast('📸 Captured frame set as reel thumbnail!');
      }
    } catch (err) {
      console.error('Frame capture error:', err);
    }
  }, [onShowToast]);

  // Handle custom image file upload for thumbnail
  const handleCustomThumbnailFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 640, 1140, 0.85);
      setThumbnailDataUrl(compressed);
      setThumbnailSourceType('custom');
      if (onShowToast) onShowToast('🖼️ Custom thumbnail image uploaded!');
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setThumbnailDataUrl(reader.result);
          setThumbnailSourceType('custom');
          if (onShowToast) onShowToast('🖼️ Custom thumbnail applied!');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onShowToast]);

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

  const processSelectedVideo = async (file: File | Blob, customThumbnail?: string, customAudio?: string) => {
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

    setMediaType('video');
    setStep('edit');

    if (customAudio) {
      setSelectedAudio(customAudio);
    }

    // Create immediate local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setSelectedMediaUrl(previewUrl);

    // Extract thumbnail
    if (customThumbnail) {
      setThumbnailDataUrl(customThumbnail);
    } else {
      try {
        const thumb = await generateVideoThumbnail(
          file instanceof File ? file : new File([file], 'reel-preview.mp4', { type: file.type || 'video/mp4' }),
          640,
          640,
          0.7
        );
        setThumbnailDataUrl(thumb);
      } catch {
        setThumbnailDataUrl(createVideoFallbackDataUrl('Video Reel'));
      }
    }

    // Set initial pending file
    setPendingUploadFile(file);

    // 2. Automatic client-side video compression to 720p with optimized bitrate
    const abortCtrl = new AbortController();
    compressionAbortRef.current = abortCtrl;
    setVideoCompression({
      isCompressing: true,
      percent: 0,
      status: 'Compressing video to 720p...',
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

      // Update pending upload file with compressed blob
      setPendingUploadFile(result.blob);
      const compressedUrl = URL.createObjectURL(result.blob);
      setSelectedMediaUrl(compressedUrl);

      // Convert to base64 if small for direct offline feed support
      if (result.compressedSize <= 3 * 1024 * 1024) {
        fileToDataUrl(result.blob).then((b64) => {
          setSelectedMediaUrl(b64);
        }).catch(() => {});
      }

      if (result.wasCompressed) {
        const savedPct = Math.round((1 - result.compressionRatio) * 100);
        if (onShowToast) {
          onShowToast(
            `🎬 Optimized to 720p: ${formatBytes(result.originalSize)} ➔ ${formatBytes(
              result.compressedSize
            )} (${savedPct > 0 ? `${savedPct}% smaller` : 'optimized'})`
          );
        }
      }
    } catch (compErr: any) {
      console.warn('Client-side video compression notice:', compErr?.message);
      // 3. If compression fails or file is too large, show user warning alert
      if (file.size > MAX_VIDEO_UPLOAD_SIZE_BYTES) {
        setVideoAlert({
          title: 'Video Too Large (Max 25MB)',
          message: `Compression failed and original video (${formatBytes(file.size)}) exceeds the 25MB upload limit: ${compErr?.message || 'File could not be compressed.'}`,
          details: 'Please choose a shorter or smaller video clip under 25MB.',
          type: 'error',
        });
        setPendingUploadFile(null);
        setSelectedMediaUrl('');
        setStep('upload');
      } else {
        // Under 25MB limit: notify user but allow proceeding with original video
        setPendingUploadFile(file);
        setVideoAlert({
          title: 'Compression Notice',
          message: `Using original video (${formatBytes(file.size)}): ${compErr?.message || 'Compression could not be completed'}. File is within the 25MB limit.`,
          type: 'warning',
        });
      }
    } finally {
      setVideoCompression(null);
      compressionAbortRef.current = null;
    }
  };

  const handleVideoRecorded = async (
    videoBlob: Blob,
    videoUrl: string,
    thumbnail?: string,
    audioTitle?: string
  ) => {
    setMediaType('video');
    setShareAsReel(true);
    setIsCameraOpen(false);
    await processSelectedVideo(videoBlob, thumbnail, audioTitle);
    if (onShowToast) {
      onShowToast('🎬 Reel ready!');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');

      if (isVideo) {
        await processSelectedVideo(file);
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
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (isVideo) {
        await processSelectedVideo(file);
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

    const fbAuth = auth.currentUser;
    const resolvedUserId = (fbAuth?.uid || currentUser.id || '').trim();
    const resolvedEmail = (fbAuth?.email || currentUser.email || '').trim().toLowerCase();

    const newPost: Post = {
      id: postId,
      userId: resolvedUserId,
      userEmail: resolvedEmail,
      privacy: privacy,
      isPrivate: privacy === 'private',
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
        userId: resolvedUserId,
        userEmail: resolvedEmail,
        privacy: privacy,
        isPrivate: privacy === 'private',
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

    // 1. Ensure permanent cloud storage persistence for videos/photos so they never turn black
    let permanentMediaUrl = selectedMediaUrl || '';
    const isBlobUrl = permanentMediaUrl.startsWith('blob:') || !permanentMediaUrl;

    if (pendingUploadFile || isBlobUrl) {
      setIsCloudUploading(true);
      setCloudUploadProgress(10);
      setCloudUploadStatus('Connecting to Firebase Cloud Storage...');

      try {
        let fileOrBlobToUpload = pendingUploadFile;
        if (!fileOrBlobToUpload && permanentMediaUrl.startsWith('blob:')) {
          setCloudUploadStatus('Reading video data for cloud persistence...');
          const resp = await fetch(permanentMediaUrl);
          fileOrBlobToUpload = await resp.blob();
        }

        if (fileOrBlobToUpload) {
          setCloudUploadStatus('Uploading permanent video to Firebase Storage...');
          const uploadedUrl = await uploadMediaToStorage(
            fileOrBlobToUpload,
            mediaType === 'video' ? 'reels' : 'photos',
            (pct) => {
              setCloudUploadProgress(Math.max(10, pct));
              setCloudUploadStatus(`Uploading to Cloud Storage... ${pct}%`);
            },
            postId
          );
          if (uploadedUrl) {
            permanentMediaUrl = uploadedUrl;
          }
        }
      } catch (uploadErr: any) {
        console.warn('[CreatePostModal] Cloud Storage upload notice:', uploadErr);
      } finally {
        setIsCloudUploading(false);
      }
    }

    // Direct and instant: save permanent URLs to Firestore posts collection
    try {
      newPost.mediaUrl = permanentMediaUrl;
      if (newReel) {
        newReel.videoUrl = permanentMediaUrl;
      }

      // Save post document to Cloud Firestore
      try {
        await savePostToFirestore(newPost);
      } catch (firestoreErr: any) {
        console.warn('[Firestore] Notice during savePostToFirestore:', firestoreErr?.message);
      }

      // Immediately trigger post creation and close modal
      onPostCreated(newPost, newReel);
      onClose();

      if (onShowToast) {
        onShowToast(newReel ? '🎬 Reel saved & shared globally!' : '📸 Post shared to Cloud Feed!');
      }
    } catch (generalErr: any) {
      newPost.mediaUrl = permanentMediaUrl;
      if (newReel) newReel.videoUrl = permanentMediaUrl;
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
        {/* Firebase Cloud Storage Upload Progress Overlay */}
        {isCloudUploading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-in fade-in">
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700/80 rounded-2xl p-6 text-center text-white shadow-2xl space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Storing to Cloud Storage</h4>
                <p className="text-xs text-neutral-400">{cloudUploadStatus || 'Uploading permanent video URL for all users...'}</p>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden border border-neutral-700">
                <div
                  className="bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${cloudUploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Permanent Video Storage</span>
                <span className="font-semibold text-rose-400">{cloudUploadProgress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* User Warning Alert Dialog if Video is Too Large or Compression Fails */}
        {videoAlert && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-neutral-900 border border-amber-500/50 rounded-2xl p-5 shadow-2xl text-white">
              <div className="flex items-start gap-3 mb-3.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    videoAlert.type === 'error'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                      : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-base font-bold flex items-center gap-2 ${
                      videoAlert.type === 'error' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {videoAlert.title}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {videoAlert.message}
                  </p>
                  {videoAlert.details && (
                    <p className="text-[11px] text-neutral-400 mt-2 bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800">
                      {videoAlert.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setVideoAlert(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition active:scale-95 cursor-pointer"
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
            <div className="w-full max-w-sm bg-neutral-900 border border-sky-500/40 rounded-2xl p-5 shadow-2xl text-white text-center">
              <div className="w-12 h-12 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center mx-auto mb-3">
                <Clapperboard className="w-6 h-6 text-sky-400 animate-pulse" />
              </div>

              <h4 className="text-sm font-bold text-white mb-1">
                Optimizing Video to 720p
              </h4>
              <p className="text-xs text-neutral-400 mb-3">
                Reducing resolution to 720p & optimizing bitrate directly in browser...
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-200"
                  style={{ width: `${videoCompression.percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-neutral-400 mb-4 font-mono">
                <span>{videoCompression.status}</span>
                <span className="font-bold text-sky-400">{videoCompression.percent}%</span>
              </div>

              <div className="text-[11px] text-neutral-500 mb-4 bg-neutral-950/70 py-1.5 px-3 rounded-lg border border-neutral-800">
                Max limit: 25MB • Original: {formatBytes(videoCompression.originalSize)}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (compressionAbortRef.current) {
                    compressionAbortRef.current.abort();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancel Compression
              </button>
            </div>
          </div>
        )}

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
                    ? 'Max 25MB • Auto-compressed to 720p with optimized bitrate'
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
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration;
                        if (dur) {
                          setVideoDuration(dur);
                          extractSnapshotFrames(selectedMediaUrl, dur);
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                    {/* Floating Controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                      <button
                        type="button"
                        onClick={captureFrameFromLivePreview}
                        className="px-2.5 py-1.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md transition text-xs font-semibold flex items-center gap-1 border border-white/20 shadow-md cursor-pointer"
                        title="Set current video moment as cover thumbnail"
                      >
                        <Camera className="w-3.5 h-3.5 text-rose-400" />
                        <span>Use Frame</span>
                      </button>
                      <button
                        type="button"
                        onClick={togglePreviewPlay}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
                        aria-label={previewPlaying ? 'Pause video' : 'Play video'}
                      >
                        {previewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMuted((prev) => !prev)}
                        className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
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

                    {/* Custom Thumbnail / Reel Cover Selector */}
                    <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                            Reel Cover / Thumbnail
                          </h4>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {thumbnailSourceType === 'custom'
                            ? '🖼️ Custom Image'
                            : thumbnailSourceType === 'frame'
                            ? '📸 Video Frame'
                            : '⚡ Auto Cover'}
                        </span>
                      </div>

                      {/* Active Cover Preview & Action Buttons */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex-shrink-0 shadow-xs">
                          <img
                            src={thumbnailDataUrl || createVideoFallbackDataUrl('Video Reel')}
                            alt="Cover Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 text-center py-0.5 text-[8px] text-white font-bold">
                            Cover
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                            Choose the best video frame or upload a custom image thumbnail.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={captureFrameFromLivePreview}
                              className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Capture current playing frame"
                            >
                              <Camera className="w-3 h-3 text-rose-500" />
                              <span>Use Frame</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => customThumbnailInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>Upload Photo</span>
                            </button>

                            <input
                              ref={customThumbnailInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCustomThumbnailFileChange}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Video Timeline Scrubber */}
                      {videoDuration > 0 && (
                        <div className="pt-1 border-t border-neutral-200 dark:border-neutral-700/60">
                          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-medium mb-1">
                            <span className="flex items-center gap-1">
                              <SlidersHorizontal className="w-3 h-3 text-amber-500" />
                              Scrub Video Timeline:
                            </span>
                            <span>{scrubberTime.toFixed(1)}s / {videoDuration.toFixed(1)}s</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={Math.max(1, videoDuration)}
                            step="0.1"
                            value={scrubberTime}
                            onChange={async (e) => {
                              const val = parseFloat(e.target.value);
                              setScrubberTime(val);
                              if (previewVideoRef.current) {
                                previewVideoRef.current.currentTime = val;
                              }
                              if (selectedMediaUrl) {
                                const f = await captureVideoFrameAt(selectedMediaUrl, val);
                                if (f && !f.startsWith('data:image/svg')) {
                                  setThumbnailDataUrl(f);
                                  setThumbnailSourceType('frame');
                                }
                              }
                            }}
                            className="w-full accent-rose-500 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Snapshots Grid */}
                      {extractedFrames.length > 0 && (
                        <div>
                          <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                            Or pick candidate frame:
                          </span>
                          <div className="grid grid-cols-5 gap-1.5">
                            {extractedFrames.map((frame, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setThumbnailDataUrl(frame);
                                  setThumbnailSourceType('frame');
                                  if (onShowToast) onShowToast(`Selected frame #${idx + 1}`);
                                }}
                                className={`relative aspect-[9/16] rounded-md overflow-hidden border-2 transition cursor-pointer ${
                                  thumbnailDataUrl === frame
                                    ? 'border-rose-500 scale-102 shadow-md ring-2 ring-rose-500/30'
                                    : 'border-transparent hover:border-neutral-400 opacity-75 hover:opacity-100'
                                }`}
                              >
                                <img src={frame} alt={`Frame ${idx}`} className="w-full h-full object-cover" />
                                {thumbnailDataUrl === frame && (
                                  <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-rose-500 text-white flex items-center justify-center">
                                    <Check className="w-2 h-2 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
                    {thumbnailDataUrl ? (
                      <img
                        src={thumbnailDataUrl}
                        alt="Reel Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={selectedMediaUrl}
                        muted
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1">
                      <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reel Cover</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('edit')}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[11px] font-bold backdrop-blur-md border border-white/20 transition cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <Camera className="w-3 h-3 text-rose-400" />
                      <span>Change Cover</span>
                    </button>
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

                {/* Reel Cover selection summary for Video */}
                {mediaType === 'video' && (
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-11 rounded-md overflow-hidden bg-neutral-900 flex-shrink-0 border border-neutral-300 dark:border-neutral-600">
                        <img
                          src={thumbnailDataUrl || createVideoFallbackDataUrl('Video Reel')}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          Cover Thumbnail
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate">
                          {thumbnailSourceType === 'custom'
                            ? 'Custom Image'
                            : thumbnailSourceType === 'frame'
                            ? 'Chosen Video Frame'
                            : 'Auto Generated'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => customThumbnailInputRef.current?.click()}
                        className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('edit')}
                        className="px-2 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Pick Frame
                      </button>
                    </div>
                  </div>
                )}

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

                {/* Video & Post Privacy Toggle (Public vs Private) */}
                <div
                  id="create-post-privacy-container"
                  className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          privacy === 'private'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {privacy === 'private' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          Video Privacy / प्राइवेसी
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              privacy === 'private'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {privacy === 'private' ? '🔒 Private' : '🌐 Public'}
                          </span>
                        </span>
                        <p className="text-[11px] text-neutral-500">
                          {privacy === 'private'
                            ? 'Only you can see this in your profile Videos folder'
                            : 'Anyone on Jhalak feed & explore can watch'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Public / Private Selector Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      id="upload-privacy-public-btn"
                      onClick={() => setPrivacy('public')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                        privacy === 'public'
                          ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>🌐 Public (Sabhi ke liye)</span>
                    </button>
                    <button
                      type="button"
                      id="upload-privacy-private-btn"
                      onClick={() => setPrivacy('private')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                        privacy === 'private'
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                          : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>🔒 Private (Sirf mere liye)</span>
                    </button>
                  </div>
                </div>

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
