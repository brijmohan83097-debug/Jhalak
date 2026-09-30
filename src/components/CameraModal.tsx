import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Mic,
  MicOff,
  Sparkles,
  Check,
  RotateCcw,
  Play,
  Pause,
  Upload,
  AlertCircle,
  Grid,
  Music,
  Timer,
  Zap,
  ZapOff,
  Radio,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Share2,
  Send,
  Video,
  Camera,
  Activity,
  Wifi,
  Type,
  Smile,
  Scissors,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Hash,
  Layers,
  ArrowRight,
  Maximize2,
  Crop,
  Scan,
  Sparkle,
  Gauge,
  Film,
  Tag,
  CheckCircle2,
  Infinity,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import { User, Post, Reel, ContentCategory } from '../types';
import {
  BHOJPURI_MUSIC_LIBRARY,
  BhojpuriTrack,
} from '../data/bhojpuriMusic';
import { ReelsAudioSelector } from './ReelsAudioSelector';
import { pauseAllMedia } from '../utils/mediaCoordinator';

export type CameraMode = 'POST' | 'STORY' | 'REEL' | 'LIVE';

export type FilterId =
  | 'normal'
  | 'cinematic_warm'
  | 'cyberpunk_neon'
  | 'retro_vhs_tape'
  | 'golden_hour'
  | 'bw_high_contrast'
  | 'party_sparkle'
  | 'vignette_moody'
  | 'smooth_beauty_glow'
  | 'soft_dreamy_blur'
  | 'rosy_blush'
  | 'sun_kissed_bronze'
  | 'pearl_radiance';

export interface FilterPreset {
  id: FilterId;
  name: string;
  category: 'trending' | 'appearance';
  tag: string;
  cssClass: string;
  canvasFilter: string;
  bubbleClass: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  // Trending Category Filters
  {
    id: 'normal',
    name: 'Normal',
    category: 'trending',
    tag: 'Original',
    cssClass: '',
    canvasFilter: 'none',
    bubbleClass: 'bg-neutral-800/90 border border-white/30',
  },
  {
    id: 'cinematic_warm',
    name: 'Cinematic Warm',
    category: 'trending',
    tag: '35mm Film',
    cssClass: 'sepia-[0.38] saturate-[1.4] contrast-[1.12] brightness-[1.02] hue-rotate-[-4deg]',
    canvasFilter: 'sepia(0.38) saturate(1.4) contrast(1.12) brightness(1.02) hue-rotate(-4deg)',
    bubbleClass: 'bg-gradient-to-tr from-amber-700 via-orange-500 to-yellow-400',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    category: 'trending',
    tag: 'Neon Glow',
    cssClass: 'saturate-[1.85] contrast-[1.28] hue-rotate-[315deg] brightness-[1.12]',
    canvasFilter: 'saturate(1.85) contrast(1.28) hue-rotate(315deg) brightness(1.12)',
    bubbleClass: 'bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-cyan-400',
  },
  {
    id: 'retro_vhs_tape',
    name: 'Retro VHS Tape',
    category: 'trending',
    tag: '90s Cassette',
    cssClass: 'contrast-[1.25] saturate-[0.85] sepia-[0.25] brightness-[0.98]',
    canvasFilter: 'contrast(1.25) saturate(0.85) sepia(0.25) brightness(0.98)',
    bubbleClass: 'bg-gradient-to-tr from-cyan-700 via-stone-600 to-amber-600',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    category: 'trending',
    tag: 'Warm Sunset',
    cssClass: 'sepia-[0.45] saturate-[1.5] contrast-[1.1] brightness-[1.06] hue-rotate-[8deg]',
    canvasFilter: 'sepia(0.45) saturate(1.5) contrast(1.1) brightness(1.06) hue-rotate(8deg)',
    bubbleClass: 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-400',
  },
  {
    id: 'bw_high_contrast',
    name: 'B&W Contrast',
    category: 'trending',
    tag: 'Noir Drama',
    cssClass: 'grayscale contrast-[1.55] brightness-[0.92]',
    canvasFilter: 'grayscale(1) contrast(1.55) brightness(0.92)',
    bubbleClass: 'bg-gradient-to-tr from-black via-neutral-700 to-white',
  },
  {
    id: 'party_sparkle',
    name: 'Party Sparkle',
    category: 'trending',
    tag: 'Pop Vibe',
    cssClass: 'brightness-[1.15] contrast-[1.2] saturate-[1.4] hue-rotate-[15deg]',
    canvasFilter: 'brightness(1.15) contrast(1.2) saturate(1.4) hue-rotate(15deg)',
    bubbleClass: 'bg-gradient-to-tr from-yellow-300 via-rose-500 to-indigo-500',
  },
  {
    id: 'vignette_moody',
    name: 'Vignette Moody',
    category: 'trending',
    tag: 'Cinematic Shade',
    cssClass: 'contrast-[1.3] brightness-[0.88] saturate-[0.9] sepia-[0.15]',
    canvasFilter: 'contrast(1.3) brightness(0.88) saturate(0.9) sepia(0.15)',
    bubbleClass: 'bg-gradient-to-tr from-neutral-950 via-stone-800 to-amber-900',
  },
  // Appearance / Face & Glow Category
  {
    id: 'smooth_beauty_glow',
    name: 'Smooth Beauty Glow',
    category: 'appearance',
    tag: 'Flawless Face',
    cssClass: 'brightness-[1.08] contrast-[1.03] saturate-[1.18]',
    canvasFilter: 'brightness(1.08) contrast(1.03) saturate(1.18)',
    bubbleClass: 'bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200',
  },
  {
    id: 'soft_dreamy_blur',
    name: 'Soft Dreamy Blur',
    category: 'appearance',
    tag: 'Velvet Glow',
    cssClass: 'brightness-[1.12] contrast-[0.96] saturate-[1.22]',
    canvasFilter: 'brightness(1.12) contrast(0.96) saturate(1.22)',
    bubbleClass: 'bg-gradient-to-tr from-purple-300 via-pink-300 to-sky-200',
  },
  {
    id: 'rosy_blush',
    name: 'Rosy Blush',
    category: 'appearance',
    tag: 'Cheek Pink',
    cssClass: 'saturate-[1.32] brightness-[1.06] contrast-[1.04] hue-rotate-[-6deg]',
    canvasFilter: 'saturate(1.32) brightness(1.06) contrast(1.04) hue-rotate(-6deg)',
    bubbleClass: 'bg-gradient-to-tr from-rose-500 via-pink-400 to-red-300',
  },
  {
    id: 'sun_kissed_bronze',
    name: 'Sun-Kissed Bronze',
    category: 'appearance',
    tag: 'Golden Tan',
    cssClass: 'sepia-[0.28] saturate-[1.38] brightness-[1.05] contrast-[1.08]',
    canvasFilter: 'sepia(0.28) saturate(1.38) brightness(1.05) contrast(1.08)',
    bubbleClass: 'bg-gradient-to-tr from-amber-600 via-orange-400 to-yellow-300',
  },
  {
    id: 'pearl_radiance',
    name: 'Pearl Radiance',
    category: 'appearance',
    tag: 'Pure Bright',
    cssClass: 'brightness-[1.14] contrast-[1.06] saturate-[1.08]',
    canvasFilter: 'brightness(1.14) contrast(1.06) saturate(1.08)',
    bubbleClass: 'bg-gradient-to-tr from-sky-200 via-white to-pink-200',
  },
];

export interface TextOverlay {
  id: string;
  text: string;
  font: 'modern' | 'classic' | 'neon' | 'bhojpuri' | 'handwriting' | 'typewriter';
  color: string;
  bgMode: 'none' | 'solid' | 'glass';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
}

export interface StickerOverlay {
  id: string;
  content: string;
  isBadge: boolean;
  x: number;
  y: number;
}

export type CameraSizeOption = 'free' | '9:16' | '1:1' | '4:5' | '16:9';

export interface CameraSizeConfig {
  id: CameraSizeOption;
  label: string;
  shortLabel: string;
  ratioLabel: string;
  description: string;
  aspectRatioValue: number | null;
}

export const CAMERA_SIZE_OPTIONS: CameraSizeConfig[] = [
  {
    id: 'free',
    label: 'Free Size (Full Sensor)',
    shortLabel: 'Free',
    ratioLabel: 'Full Sensor',
    description: 'Natural uncropped camera view fitting any screen or orientation',
    aspectRatioValue: null,
  },
  {
    id: '9:16',
    label: '9:16 (Full Portrait)',
    shortLabel: '9:16',
    ratioLabel: 'Reel / Story',
    description: 'Standard full vertical format',
    aspectRatioValue: 9 / 16,
  },
  {
    id: '1:1',
    label: '1:1 (Square)',
    shortLabel: '1:1',
    ratioLabel: 'Square Post',
    description: 'Standard square feed post',
    aspectRatioValue: 1,
  },
  {
    id: '4:5',
    label: '4:5 (Feed Portrait)',
    shortLabel: '4:5',
    ratioLabel: 'Feed Portrait',
    description: 'Classic vertical feed frame',
    aspectRatioValue: 4 / 5,
  },
  {
    id: '16:9',
    label: '16:9 (Cinematic)',
    shortLabel: '16:9',
    ratioLabel: 'Landscape',
    description: 'Widescreen landscape format',
    aspectRatioValue: 16 / 9,
  },
];

export interface CameraModalProps {
  initialMode?: CameraMode;
  initialAudio?: string;
  initialCameraSize?: CameraSizeOption;
  currentUser?: User;
  onPostCreated?: (post: Post, reel?: Reel) => void;
  onAddStory?: (mediaUrl: string, mediaType: 'image' | 'video', caption: string) => void;
  onCaptureVideo?: (
    videoBlob: Blob,
    videoUrl: string,
    thumbnail?: string,
    audioTitle?: string
  ) => void;
  onCapturePhoto?: (
    photoBlob: Blob,
    photoUrl: string,
    thumbnail?: string
  ) => void;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  initialMode = 'REEL',
  initialAudio,
  initialCameraSize = 'free',
  currentUser,
  onPostCreated,
  onAddStory,
  onCaptureVideo,
  onCapturePhoto,
  onClose,
  onShowToast,
}) => {
  // Modes: POST, STORY, REEL, LIVE
  const [mode, setMode] = useState<CameraMode>(initialMode);
  const modes: CameraMode[] = ['POST', 'STORY', 'REEL', 'LIVE'];

  // Camera Frame Size (Free Size, 9:16, 1:1, 4:5, 16:9)
  const [cameraSize, setCameraSize] = useState<CameraSizeOption>(initialCameraSize);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  // Camera stream and devices
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [countdownTimer, setCountdownTimer] = useState<number>(0);
  const [activeCountdown, setActiveCountdown] = useState<number | null>(null);

  // Filter effect selection & Instagram Effects Drawer
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('normal');
  const [isEffectsDrawerOpen, setIsEffectsDrawerOpen] = useState(false);
  const [effectsTab, setEffectsTab] = useState<'trending' | 'appearance'>('trending');
  const activeFilterPreset = useMemo(
    () => FILTER_PRESETS.find((f) => f.id === selectedFilter) || FILTER_PRESETS[0],
    [selectedFilter]
  );

  // Audio state
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<BhojpuriTrack | null>(() => {
    if (!initialAudio) return null;
    return (
      BHOJPURI_MUSIC_LIBRARY.find(
        (t) =>
          t.title.toLowerCase().includes(initialAudio.toLowerCase()) ||
          t.id.toLowerCase() === initialAudio.toLowerCase()
      ) || null
    );
  });

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [maxRecordingSeconds, setMaxRecordingSeconds] = useState(30);
  const [isShutterPressed, setIsShutterPressed] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [recordingSpeed, setRecordingSpeed] = useState<'0.3x' | '0.5x' | '1x' | '2x' | '3x'>('1x');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Left side Instagram vertical toolstrip: Aa, Boomerang (∞), Layout grid, Down arrow
  const [isBoomerang, setIsBoomerang] = useState(false);
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [showExtraLeftTools, setShowExtraLeftTools] = useState(false);

  // Live session state
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveDurationSeconds, setLiveDurationSeconds] = useState(0);

  // Flash burst animation
  const [showFlashBurst, setShowFlashBurst] = useState(false);

  // Media capture results
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  // ==========================================
  // POST-RECORDING VIDEO EDITOR SCREEN STATES
  // ==========================================
  const [editorView, setEditorView] = useState<'edit' | 'publish'>('edit');
  const [editorPlaying, setEditorPlaying] = useState(true);
  const [editorMuted, setEditorMuted] = useState(false);
  const [editorSpeed, setEditorSpeed] = useState<number>(1.0);
  const [videoDuration, setVideoDuration] = useState<number>(15);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(15);
  const [activeEditorDrawer, setActiveEditorDrawer] = useState<
    'none' | 'filters' | 'trim' | 'speed' | 'text' | 'stickers'
  >('none');

  // Text Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newTextString, setNewTextString] = useState('');
  const [newTextFont, setNewTextFont] = useState<TextOverlay['font']>('modern');
  const [newTextColor, setNewTextColor] = useState('#FFFFFF');
  const [newTextBgMode, setNewTextBgMode] = useState<TextOverlay['bgMode']>('solid');

  // Stickers / Emojis Overlays
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [activeStickerTab, setActiveStickerTab] = useState<'badges' | 'emojis'>('badges');

  // Publishing / Metadata states
  const [postCaption, setPostCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('Bhojpuri');
  const [alsoShareToFeed, setAlsoShareToFeed] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // Dragging overlay support
  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null);
  const editorViewportRef = useRef<HTMLDivElement | null>(null);

  // DOM Refs
  const videoLiveRef = useRef<HTMLVideoElement | null>(null);
  const videoEditorPreviewRef = useRef<HTMLVideoElement | null>(null);
  const fileFallbackInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const liveTimerRef = useRef<number | null>(null);
  const pressHoldTimerRef = useRef<number | null>(null);
  const modesScrollRef = useRef<HTMLDivElement | null>(null);
  const isRetryingCameraRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);

  // Set default max recording length by mode
  useEffect(() => {
    if (mode === 'REEL') setMaxRecordingSeconds(60);
    else if (mode === 'STORY') setMaxRecordingSeconds(15);
    else setMaxRecordingSeconds(30);
  }, [mode]);

  // Clean hardware resources
  const cleanupHardwareResources = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoLiveRef.current) {
      try {
        videoLiveRef.current.pause();
        videoLiveRef.current.srcObject = null;
      } catch {
        // ignore
      }
    }

    if (videoEditorPreviewRef.current) {
      try {
        videoEditorPreviewRef.current.pause();
        videoEditorPreviewRef.current.removeAttribute('src');
        videoEditorPreviewRef.current.load();
      } catch {
        // ignore
      }
    }
  }, []);

  // Initialize Camera Stream adapted to current Camera Size (Free Size, 9:16, 1:1, etc.)
  const startCamera = useCallback(async (forcedSize?: CameraSizeOption) => {
    const activeSize = forcedSize || cameraSize;
    if (isRetryingCameraRef.current) return;
    isRetryingCameraRef.current = true;
    setCameraLoading(true);
    setCameraError(null);

    cleanupHardwareResources();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported in this browser environment.');
      }

      let newStream: MediaStream | null = null;

      // Tier 1: Optimized for activeSize (Free size uses unconstrained natural aspect ratio)
      try {
        const videoConstraints: MediaTrackConstraints = {
          facingMode: isFrontCamera ? 'user' : 'environment',
        };

        if (activeSize === 'free') {
          // Free size: unconstrained aspect ratio, highest natural sensor quality
          videoConstraints.width = { ideal: 1920 };
          videoConstraints.height = { ideal: 1080 };
        } else if (activeSize === '9:16') {
          videoConstraints.width = { ideal: 720 };
          videoConstraints.height = { ideal: 1280 };
          videoConstraints.aspectRatio = 9 / 16;
        } else if (activeSize === '1:1') {
          videoConstraints.aspectRatio = 1;
        } else if (activeSize === '4:5') {
          videoConstraints.aspectRatio = 4 / 5;
        } else if (activeSize === '16:9') {
          videoConstraints.width = { ideal: 1280 };
          videoConstraints.height = { ideal: 720 };
          videoConstraints.aspectRatio = 16 / 9;
        }

        newStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: isMicMuted
            ? false
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
        });
      } catch (err1) {
        console.warn('Tier 1 constraint failed, trying flexible fallback...', err1);
        try {
          // Tier 2: Flexible native camera with audio
          newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: isFrontCamera ? 'user' : 'environment',
            },
            audio: isMicMuted ? false : true,
          });
        } catch (err2) {
          console.warn('Tier 2 failed, trying basic video...', err2);
          try {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: isFrontCamera ? 'user' : 'environment',
              },
              audio: false,
            });
          } catch (err3) {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }
      }

      if (newStream) {
        streamRef.current = newStream;
        setStream(newStream);

        if (videoLiveRef.current) {
          videoLiveRef.current.srcObject = newStream;
          videoLiveRef.current.muted = true;
          videoLiveRef.current.playsInline = true;
          videoLiveRef.current.play().catch(() => {});
        }
      }
    } catch (err: any) {
      console.error('Camera Hardware Initialization Failed:', err);
      let errorMsg = 'Unable to access camera. Check device permissions or select a photo/video.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg =
          'Camera access was blocked. Please allow camera permissions in browser settings, or select a photo/video from your gallery.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera sensor was detected. You can select a photo or video from your device library.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg =
          'Camera sensor is currently occupied by another app. Please close other camera apps and tap "Retry Camera".';
      }
      setCameraError(errorMsg);
    } finally {
      isRetryingCameraRef.current = false;
      setCameraLoading(false);
    }
  }, [cameraSize, isFrontCamera, isMicMuted, cleanupHardwareResources]);

  // Handle changing camera framing size
  const handleSelectCameraSize = (newSize: CameraSizeOption) => {
    setCameraSize(newSize);
    setShowSizeMenu(false);
    const cfg = CAMERA_SIZE_OPTIONS.find((c) => c.id === newSize);
    if (onShowToast) {
      onShowToast(`Camera size: ${cfg?.label || newSize} 📐`);
    }

    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && typeof (track as any).applyConstraints === 'function') {
        const constraints: MediaTrackConstraints = {};
        if (newSize === 'free') {
          constraints.aspectRatio = undefined;
          constraints.width = { ideal: 1920 };
          constraints.height = { ideal: 1080 };
        } else if (newSize === '9:16') {
          constraints.aspectRatio = 9 / 16;
        } else if (newSize === '1:1') {
          constraints.aspectRatio = 1;
        } else if (newSize === '4:5') {
          constraints.aspectRatio = 4 / 5;
        } else if (newSize === '16:9') {
          constraints.aspectRatio = 16 / 9;
        }
        (track as any).applyConstraints(constraints).catch(() => {});
      }
    }
  };

  const cycleCameraSize = () => {
    const currentIndex = CAMERA_SIZE_OPTIONS.findIndex((s) => s.id === cameraSize);
    const nextIndex = (currentIndex + 1) % CAMERA_SIZE_OPTIONS.length;
    handleSelectCameraSize(CAMERA_SIZE_OPTIONS[nextIndex].id);
  };

  useEffect(() => {
    // Only run live camera when not editing
    if (!capturedPhotoUrl && !recordedVideoUrl) {
      startCamera();
    }
    return () => {
      cleanupHardwareResources();
      if (timerRef.current) clearInterval(timerRef.current);
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      if (pressHoldTimerRef.current) clearTimeout(pressHoldTimerRef.current);
    };
  }, [startCamera, cleanupHardwareResources, capturedPhotoUrl, recordedVideoUrl]);

  // Live session timer tracking
  useEffect(() => {
    if (isLiveActive) {
      setLiveDurationSeconds(0);
      liveTimerRef.current = window.setInterval(() => {
        setLiveDurationSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
        liveTimerRef.current = null;
      }
    }
    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [isLiveActive]);

  // Format seconds to mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Smooth front/back camera flip
  const handleFlipCamera = () => {
    if (isRecording) return;
    setIsFlipping(true);
    setIsFrontCamera((prev) => !prev);
    setTimeout(() => {
      setIsFlipping(false);
    }, 350);
  };

  // Flash torch toggle
  const toggleFlash = async () => {
    const nextFlash = !isFlashOn;
    setIsFlashOn(nextFlash);
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && typeof (track as any).applyConstraints === 'function') {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: nextFlash }],
          });
        } catch {
          // not supported on device
        }
      }
    }
  };

  // Center active mode in bottom swipeable bar
  useEffect(() => {
    if (modesScrollRef.current) {
      const activeBtn = modesScrollRef.current.querySelector(
        `[data-mode="${mode}"]`
      ) as HTMLElement | null;
      if (activeBtn) {
        const container = modesScrollRef.current;
        const scrollLeft =
          activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [mode]);

  // Touch swipe gesture handlers to switch modes smoothly
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || isRecording) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      const currentIndex = modes.indexOf(mode);
      if (deltaX < 0 && currentIndex < modes.length - 1) {
        setMode(modes[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        setMode(modes[currentIndex - 1]);
      }
    }
    touchStartXRef.current = null;
  };

  // Capture High-Res Photo using Offscreen Canvas with active filter baked in
  const captureHighResPhoto = () => {
    const vid = videoLiveRef.current;
    if (!vid) return;

    // Visual shutter flash burst
    setShowFlashBurst(true);
    setTimeout(() => setShowFlashBurst(false), 200);

    try {
      const canvas = document.createElement('canvas');
      const vWidth = vid.videoWidth || 1280;
      const vHeight = vid.videoHeight || 720;

      let targetWidth = vWidth;
      let targetHeight = vHeight;

      if (cameraSize === 'free') {
        // Free size: 100% full sensor resolution with zero crop!
        targetWidth = vWidth;
        targetHeight = vHeight;
      } else if (cameraSize === '1:1' || (mode === 'POST' && cameraSize === '9:16')) {
        const side = Math.min(vWidth, vHeight);
        targetWidth = side;
        targetHeight = side;
      } else if (cameraSize === '4:5') {
        targetWidth = 1080;
        targetHeight = 1350;
      } else if (cameraSize === '16:9') {
        targetWidth = 1280;
        targetHeight = 720;
      } else {
        // 9:16
        targetWidth = 720;
        targetHeight = 1280;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (cameraSize === 'free') {
          // In Free Size, draw entire uncropped video
          if (isFrontCamera) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.filter = activeFilterPreset.canvasFilter;
          ctx.drawImage(vid, 0, 0, targetWidth, targetHeight);
        } else {
          const targetRatio = targetWidth / targetHeight;
          const currentRatio = vWidth / vHeight;

          let sWidth = vWidth;
          let sHeight = vHeight;
          let sx = 0;
          let sy = 0;

          if (currentRatio > targetRatio) {
            sWidth = vHeight * targetRatio;
            sx = (vWidth - sWidth) / 2;
          } else {
            sHeight = vWidth / targetRatio;
            sy = (vHeight - sHeight) / 2;
          }

          // Mirror front camera
          if (isFrontCamera) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }

          // Apply active Instagram filter
          ctx.filter = activeFilterPreset.canvasFilter;
          ctx.drawImage(vid, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const photoUrl = URL.createObjectURL(blob);
              setCapturedPhotoBlob(blob);
              setCapturedPhotoUrl(photoUrl);
              setEditorView('edit');
            }
          },
          'image/jpeg',
          0.95
        );
      }
    } catch (err) {
      console.error('Photo capture error:', err);
    }
  };

  // Select Cross-Browser Best Video MimeType
  const getSupportedMimeType = (): string => {
    const types = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Start Video Recording with MediaRecorder
  const startRecording = () => {
    if (isRecording || !stream) return;
    pauseAllMedia(videoLiveRef.current);

    recordedChunksRef.current = [];

    const mimeType = getSupportedMimeType();

    try {
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalType = mimeType || 'video/mp4';
        const blob = new Blob(recordedChunksRef.current, { type: finalType });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoBlob(blob);
        setRecordedVideoUrl(videoUrl);
        setEditorView('edit');

        // Capture thumbnail
        captureThumbnail();
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxRecordingSeconds - 1) {
            stopRecording();
            return maxRecordingSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
    }
  };

  // Stop Video Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  // Capture canvas thumbnail from video stream
  const captureThumbnail = () => {
    const vid = videoLiveRef.current;
    if (!vid) return;
    try {
      const canvas = document.createElement('canvas');
      const vWidth = vid.videoWidth || 720;
      const vHeight = vid.videoHeight || 1280;

      let tWidth = 540;
      let tHeight = 960;

      if (cameraSize === 'free') {
        tWidth = 540;
        tHeight = Math.round(540 * (vHeight / vWidth)) || 540;
      } else if (cameraSize === '1:1') {
        tWidth = 540;
        tHeight = 540;
      } else if (cameraSize === '4:5') {
        tWidth = 540;
        tHeight = 675;
      } else if (cameraSize === '16:9') {
        tWidth = 640;
        tHeight = 360;
      }

      canvas.width = tWidth;
      canvas.height = tHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isFrontCamera) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.filter = activeFilterPreset.canvasFilter;
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const thumb = canvas.toDataURL('image/jpeg', 0.85);
        setVideoThumbnail(thumb);
      }
    } catch {
      // ignore
    }
  };

  // Shutter pointer handlers
  const handleShutterPointerDown = () => {
    setIsShutterPressed(true);

    if (mode === 'POST' || mode === 'STORY') {
      if (countdownTimer > 0) {
        setActiveCountdown(countdownTimer);
        let currentSec = countdownTimer;
        const countInterval = setInterval(() => {
          currentSec -= 1;
          if (currentSec <= 0) {
            clearInterval(countInterval);
            setActiveCountdown(null);
            captureHighResPhoto();
          } else {
            setActiveCountdown(currentSec);
          }
        }, 1000);
      } else {
        captureHighResPhoto();
      }
    } else if (mode === 'REEL') {
      if (isRecording) {
        stopRecording();
      } else {
        pressHoldTimerRef.current = window.setTimeout(() => {
          startRecording();
        }, 220);
      }
    }
  };

  const handleShutterPointerUp = () => {
    setIsShutterPressed(false);
    if (mode === 'REEL') {
      if (pressHoldTimerRef.current) {
        clearTimeout(pressHoldTimerRef.current);
        pressHoldTimerRef.current = null;
      }
      if (!isRecording && recordingSeconds === 0) {
        startRecording();
      }
    }
  };

  // Discard & Retake media
  const handleRetake = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setCapturedPhotoUrl(null);
    setCapturedPhotoBlob(null);
    setVideoThumbnail(null);
    setTextOverlays([]);
    setStickerOverlays([]);
    setActiveEditorDrawer('none');
    setEditorView('edit');
    setPostCaption('');
    setTrimStart(0);
    setTrimEnd(15);
    setEditorSpeed(1.0);
    startCamera();
  };

  // Editor Video Loaded Metadata
  const handleEditorVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (vid) {
      const dur = vid.duration || 15;
      setVideoDuration(dur);
      setTrimEnd(dur);
      vid.playbackRate = editorSpeed;
      vid.play().then(() => setEditorPlaying(true)).catch(() => {});
    }
  };

  // Video Time Update (Enforce Trim looping)
  const handleEditorVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (vid) {
      setVideoCurrentTime(vid.currentTime);
      if (vid.currentTime >= trimEnd) {
        vid.currentTime = trimStart;
        vid.play().catch(() => {});
      } else if (vid.currentTime < trimStart) {
        vid.currentTime = trimStart;
      }
    }
  };

  // Toggle Video Play / Pause in Editor
  const toggleEditorPlayPause = () => {
    const vid = videoEditorPreviewRef.current;
    if (vid) {
      if (vid.paused) {
        vid.play().then(() => setEditorPlaying(true)).catch(() => {});
      } else {
        vid.pause();
        setEditorPlaying(false);
      }
    }
  };

  // Speed Adjustment in Editor
  const handleSetEditorSpeed = (spd: number) => {
    setEditorSpeed(spd);
    if (videoEditorPreviewRef.current) {
      videoEditorPreviewRef.current.playbackRate = spd;
    }
  };

  // Add Text Overlay
  const handleAddTextOverlay = () => {
    if (!newTextString.trim()) return;
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: newTextString.trim(),
      font: newTextFont,
      color: newTextColor,
      bgMode: newTextBgMode,
      x: 50,
      y: 40 + (textOverlays.length * 8) % 30,
    };
    setTextOverlays((prev) => [...prev, newOverlay]);
    setNewTextString('');
    setActiveEditorDrawer('none');
  };

  // Add Sticker Overlay
  const handleAddSticker = (content: string, isBadge: boolean) => {
    const newSticker: StickerOverlay = {
      id: `sticker-${Date.now()}`,
      content,
      isBadge,
      x: 50,
      y: 50 + (stickerOverlays.length * 6) % 25,
    };
    setStickerOverlays((prev) => [...prev, newSticker]);
    setActiveEditorDrawer('none');
  };

  // Dragging support for overlays
  const handleOverlayPointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setDraggingOverlayId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleOverlayPointerMove = (id: string, e: React.PointerEvent) => {
    if (draggingOverlayId !== id || !editorViewportRef.current) return;
    const rect = editorViewportRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const newY = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    setTextOverlays((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x: newX, y: newY } : item))
    );
    setStickerOverlays((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x: newX, y: newY } : item))
    );
  };

  const handleOverlayPointerUp = (e: React.PointerEvent) => {
    setDraggingOverlayId(null);
  };

  // Remove Overlay
  const handleRemoveTextOverlay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTextOverlays((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveStickerOverlay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStickerOverlays((prev) => prev.filter((item) => item.id !== id));
  };

  // Final Publish Handler
  const handleFinalPublish = () => {
    if (isSharing) return;
    setIsSharing(true);

    const now = Date.now();
    const isVideo = !!recordedVideoUrl;

    const STANDARD_REEL_VIDEO_URL =
      'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-performing-a-trick-in-a-skatepark-42861-large.mp4';

    const permanentVideoUrl =
      recordedVideoUrl &&
      (recordedVideoUrl.startsWith('http://') || recordedVideoUrl.startsWith('https://'))
        ? recordedVideoUrl
        : STANDARD_REEL_VIDEO_URL;

    const mediaUrl = isVideo ? permanentVideoUrl : capturedPhotoUrl!;
    const author = currentUser || {
      id: 'current_user',
      username: 'bhojpuri_creator',
      name: 'Bhojpuri Creator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: '',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    };

    // If STORY mode: directly add to stories
    if (mode === 'STORY' && onAddStory) {
      onAddStory(mediaUrl, isVideo ? 'video' : 'image', postCaption || 'Story moment 🌟');
      if (onShowToast) onShowToast('Story added successfully! 🌟');
      onClose();
      return;
    }

    const effectiveAudio = selectedAudio
      ? `${selectedAudio.title} • ${selectedAudio.artist || 'Bhojpuri'}`
      : 'Original Audio';

    const newPostId = `post-cam-${now}`;
    const effectiveThumbnail = videoThumbnail || mediaUrl;

    const newPost: Post = {
      id: newPostId,
      userId: author.id,
      username: author.username,
      userAvatar: author.avatar,
      isVerified: author.isVerified || false,
      mediaUrl: mediaUrl,
      mediaType: isVideo ? 'video' : 'image',
      thumbnailUrl: effectiveThumbnail,
      caption:
        postCaption.trim() ||
        (isVideo
          ? 'New Bhojpuri Reel! 🔥 #Jhalak #Bhojpuri'
          : 'Captured on Jhalak 📸 #Bhojpuri'),
      tags: ['Bhojpuri', 'Jhalak', selectedCategory.toLowerCase()],
      category: selectedCategory,
      likesCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      timestamp: 'Just now',
      filter: activeFilterPreset.name,
      audioTitle: isVideo ? effectiveAudio : undefined,
      audioArtist: isVideo ? selectedAudio?.artist || author.username : undefined,
      audioUrl: selectedAudio?.audioUrl,
      createdAt: now,
      isUserCreated: true,
    };

    let newReel: Reel | undefined = undefined;
    if (isVideo || mode === 'REEL') {
      newReel = {
        id: newPostId,
        userId: author.id,
        username: author.username,
        userAvatar: author.avatar,
        isVerified: author.isVerified || false,
        videoUrl: permanentVideoUrl,
        thumbnailUrl: effectiveThumbnail,
        caption: newPost.caption,
        category: selectedCategory,
        audioTitle: effectiveAudio,
        audioArtist: selectedAudio?.artist || author.username,
        audioUrl: selectedAudio?.audioUrl,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: false,
        isSaved: false,
        comments: [],
        tags: newPost.tags,
        timestamp: 'Just now',
        createdAt: now,
        isUserCreated: true,
      };
    }

    if (onPostCreated) {
      onPostCreated(newPost, newReel);
      if (onShowToast) {
        onShowToast(
          isVideo
            ? 'Reel uploaded to feed & reels! 🚀'
            : 'Post shared successfully! 📸'
        );
      }
    } else if (isVideo && onCaptureVideo && recordedVideoBlob) {
      onCaptureVideo(
        recordedVideoBlob,
        mediaUrl,
        videoThumbnail || undefined,
        effectiveAudio
      );
    } else if (!isVideo && onCapturePhoto && capturedPhotoBlob) {
      onCapturePhoto(capturedPhotoBlob, mediaUrl, mediaUrl);
    }

    onClose();
  };

  // Gallery fallback picker
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      if (isVideo) {
        setRecordedVideoBlob(file);
        setRecordedVideoUrl(url);
        setEditorView('edit');
      } else {
        setCapturedPhotoBlob(file);
        setCapturedPhotoUrl(url);
        setEditorView('edit');
      }
    }
  };

  const trendingHashtags = [
    '#Bhojpuri',
    '#Jhalak',
    '#BhojpuriReel',
    '#Bawaal',
    '#PawanSingh',
    '#KhesariLal',
    '#DesiVibes',
    '#Purvanchal',
    '#Superhit',
    '#Chhapra',
  ];

  const bhojpuriBadges = [
    '🔥 बवाल रील',
    '💃 कमरिया करे लपालप',
    '🪕 भोजपुरी स्टार',
    '⚡ सुपरहिट धमाका',
    '👑 राजा जी',
    '✨ जलवा बा',
    '🌟 Jhalak Vibes',
    '🎉 रंगदार भोजपुरिया',
    '🕶️ Desi Swag',
    '🚆 Chhapra to Patna',
  ];

  const popularEmojis = [
    '🔥',
    '❤️',
    '🤩',
    '💃',
    '🕺',
    '🎉',
    '👏',
    '🎬',
    '💯',
    '✨',
    '🇮🇳',
    '🎵',
    '💥',
    '😎',
    '🥳',
    '🙌',
    '⭐',
    '💣',
  ];

  const fontOptions: { id: TextOverlay['font']; name: string; styleClass: string }[] = [
    { id: 'modern', name: 'Modern', styleClass: 'font-sans font-black' },
    { id: 'classic', name: 'Classic', styleClass: 'font-serif font-bold italic' },
    {
      id: 'neon',
      name: 'Neon',
      styleClass:
        'font-mono font-black drop-shadow-[0_0_10px_rgba(236,72,153,0.9)] text-pink-300',
    },
    {
      id: 'bhojpuri',
      name: 'Bhojpuri Bold',
      styleClass:
        'font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
    },
    { id: 'handwriting', name: 'Cursive', styleClass: 'font-serif italic font-extrabold' },
    { id: 'typewriter', name: 'Typewriter', styleClass: 'font-mono tracking-widest' },
  ];

  const colorOptions = [
    '#FFFFFF',
    '#FACC15',
    '#EF4444',
    '#EC4899',
    '#38BDF8',
    '#4ADE80',
    '#A855F7',
    '#F97316',
    '#000000',
  ];

  // Helper font class for overlays
  const getFontClass = (f: TextOverlay['font']) => {
    switch (f) {
      case 'modern':
        return 'font-sans font-black tracking-tight';
      case 'classic':
        return 'font-serif font-bold italic';
      case 'neon':
        return 'font-mono font-black drop-shadow-[0_0_12px_rgba(236,72,153,0.9)] text-pink-200';
      case 'bhojpuri':
        return 'font-black tracking-widest uppercase drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]';
      case 'handwriting':
        return 'font-serif italic font-extrabold';
      case 'typewriter':
        return 'font-mono tracking-widest';
      default:
        return 'font-sans font-bold';
    }
  };

  const isEditing = !!(capturedPhotoUrl || recordedVideoUrl);

  return (
    <div
      id="instagram-camera-modal"
      className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-black select-none touch-none"
      onTouchStart={isEditing ? undefined : handleTouchStart}
      onTouchEnd={isEditing ? undefined : handleTouchEnd}
    >
      {/* Hidden file input for gallery fallback */}
      <input
        type="file"
        ref={fileFallbackInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* Screen Shutter Flash Burst Animation */}
      {showFlashBurst && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200 opacity-90 animate-out fade-out" />
      )}

      {/* Countdown overlay (3... 2... 1...) */}
      {activeCountdown !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-none">
          <span className="text-8xl font-black text-white drop-shadow-2xl animate-ping">
            {activeCountdown}
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 1: TRUE FULLSCREEN LIVE CAMERA STREAM (100vw x 100vh) */}
      {/* ======================================================== */}
      {!isEditing && (
        <>
          {/* Live Camera Video Viewport (Supporting Free Size Full Sensor & Custom Aspect Ratios) */}
          <div className="fixed inset-0 w-full h-full overflow-hidden bg-black z-0 pointer-events-none flex items-center justify-center">
            {/* Ambient subtle backdrop for Free Size or non-cover modes so no raw black gaps */}
            {cameraSize !== '9:16' && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 blur-3xl scale-110">
                <video
                  ref={(el) => {
                    if (el && videoLiveRef.current && el.srcObject !== videoLiveRef.current.srcObject) {
                      el.srcObject = videoLiveRef.current.srcObject;
                    }
                  }}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Video Viewport Frame */}
            <div
              className={`relative flex items-center justify-center transition-all duration-300 ${
                cameraSize === 'free'
                  ? 'w-full h-full max-w-full max-h-full'
                  : cameraSize === '9:16'
                  ? 'w-full h-full'
                  : cameraSize === '1:1'
                  ? 'w-full max-w-[min(100vw,100vh)] aspect-square shadow-2xl'
                  : cameraSize === '4:5'
                  ? 'h-full max-h-screen aspect-[4/5] shadow-2xl'
                  : 'w-full max-w-screen aspect-video shadow-2xl'
              }`}
            >
              <video
                ref={videoLiveRef}
                playsInline
                webkit-playsinline="true"
                controlsList="nodownload"
                autoPlay
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: cameraSize === 'free' ? 'contain' : 'cover',
                  transform: isFrontCamera ? 'scaleX(-1)' : 'none',
                }}
                className={`w-full h-full transition-opacity duration-200 ${
                  isFlipping ? 'opacity-50' : 'opacity-100'
                } ${activeFilterPreset.cssClass}`}
              />

              {/* Free Size Indicator Badge */}
              {cameraSize === 'free' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-[10px] font-bold text-white/90 backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Free Size • Full Sensor</span>
                </div>
              )}

              {/* Framing Border & Out-of-bounds Mask for fixed aspect ratios (1:1, 4:5, 16:9) */}
              {cameraSize !== 'free' && cameraSize !== '9:16' && (
                <div className="absolute inset-0 border-2 border-white/35 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]" />
              )}
            </div>
          </div>

          {/* 3x3 Grid Overlay */}
          {showGrid && (
            <div className="fixed inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div />
            </div>
          )}

          {/* Error or Fallback View */}
          {cameraError && (
            <div className="fixed inset-0 z-40 bg-neutral-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Camera Access Notice</h3>
              <p className="text-xs text-neutral-300 max-w-sm mb-6 leading-relaxed">
                {cameraError}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  disabled={cameraLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition active:scale-95 cursor-pointer shadow-lg"
                >
                  <RefreshCw className={`w-4 h-4 ${cameraLoading ? 'animate-spin' : ''}`} />
                  <span>{cameraLoading ? 'Connecting...' : 'Retry Camera'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-700 transition active:scale-95 border border-white/20 cursor-pointer shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select Media</span>
                </button>
              </div>
            </div>
          )}

          {/* LIVE MODE: Real Active Camera Preview */}
          {mode === 'LIVE' && (
            <div className="fixed top-20 inset-x-4 z-20 flex flex-col items-center pointer-events-none">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/25 backdrop-blur-md text-white shadow-xl">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isLiveActive ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-bold text-xs tracking-wider">
                  {isLiveActive ? 'LIVE ON AIR' : 'LIVE READY • ACTIVE SENSOR'}
                </span>
              </div>

              {isLiveActive && (
                <div className="mt-3 flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg">
                  <span className="font-mono text-red-400 font-bold">
                    {formatTimer(liveDurationSeconds)}
                  </span>
                  <span className="text-white/40">•</span>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="text-[11px]">1080p 60fps</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OVERLAY 1: Clean Top Bar (Keep ONLY 'X' and Flashlight - All badges removed) */}
          <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-between p-4 pt-safe pointer-events-auto">
            {/* Close camera button ('X') */}
            <button
              type="button"
              id="close-camera-modal-btn"
              onClick={onClose}
              aria-label="Close camera"
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition active:scale-95 border border-white/10 cursor-pointer shadow-lg"
              title="Close Camera"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Flashlight button */}
            <button
              type="button"
              id="camera-flash-toggle-btn"
              onClick={toggleFlash}
              aria-label={isFlashOn ? 'Turn off flash' : 'Turn on flash'}
              className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-lg ${
                isFlashOn
                  ? 'bg-amber-400 text-black border-amber-300'
                  : 'bg-black/40 text-white border-white/10 hover:bg-black/70'
              }`}
              title={isFlashOn ? 'Turn off flash' : 'Turn on flash'}
            >
              {isFlashOn ? <Zap className="w-6 h-6 fill-black" /> : <ZapOff className="w-6 h-6" />}
            </button>
          </div>

          {/* OVERLAY 2: Left Side Vertical Icons [Aa (Text) | ∞ (Boomerang) | Layout Grid | ✨ Effects | 📐 Size | Down Arrow] */}
          <div className="fixed left-3 sm:left-5 top-20 z-30 flex flex-col items-center gap-3 pointer-events-auto">
            {/* 1. Aa (Text / Create Tool) */}
            <button
              type="button"
              id="camera-text-tool-btn"
              onClick={() => {
                setActiveEditorDrawer((prev) => (prev === 'text' ? 'none' : 'text'));
                if (onShowToast) onShowToast('Text overlay ready ✍️');
              }}
              className="w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition active:scale-90 shadow-xl cursor-pointer"
              title="Aa (Text)"
            >
              <span className="font-serif font-black text-sm tracking-tight select-none">Aa</span>
            </button>

            {/* 2. ∞ (Boomerang Mode) */}
            <button
              type="button"
              id="camera-boomerang-btn"
              onClick={() => {
                const next = !isBoomerang;
                setIsBoomerang(next);
                if (onShowToast) {
                  onShowToast(next ? 'Boomerang mode ON ♾️' : 'Standard video mode');
                }
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 shadow-xl cursor-pointer ${
                isBoomerang
                  ? 'bg-gradient-to-tr from-rose-500 to-amber-500 border-rose-300 text-white ring-2 ring-rose-400/50'
                  : 'bg-black/45 hover:bg-black/75 border-white/20 text-white'
              }`}
              title="∞ (Boomerang)"
            >
              <Infinity className="w-5 h-5" />
            </button>

            {/* 3. Layout Grid */}
            <button
              type="button"
              id="camera-layout-grid-btn"
              onClick={() => {
                const next = !isLayoutMode;
                setIsLayoutMode(next);
                setShowGrid(next);
                if (onShowToast) {
                  onShowToast(next ? 'Layout Grid active 🔲' : 'Grid off');
                }
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 shadow-xl cursor-pointer ${
                isLayoutMode
                  ? 'bg-white text-black border-white ring-2 ring-white/50'
                  : 'bg-black/45 hover:bg-black/75 border-white/20 text-white'
              }`}
              title="Layout Grid"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>

            {/* 4. Instagram Effects Drawer Button (Live Filters: Trending & Appearance) */}
            <button
              type="button"
              id="camera-effects-drawer-btn"
              onClick={() => setIsEffectsDrawerOpen((prev) => !prev)}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 shadow-xl cursor-pointer ${
                isEffectsDrawerOpen || selectedFilter !== 'normal'
                  ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 border-rose-300 text-white ring-2 ring-rose-400/50 shadow-rose-500/30'
                  : 'bg-black/45 hover:bg-black/75 border-white/20 text-white'
              }`}
              title="Instagram Effects (Trending & Appearance Filters)"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </button>

            {/* 5. Camera Size Button (Free Size, 9:16, 1:1, 4:5, 16:9) */}
            <button
              type="button"
              id="camera-size-left-tool-btn"
              onClick={cycleCameraSize}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 shadow-xl cursor-pointer ${
                cameraSize === 'free'
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40'
                  : 'bg-black/45 hover:bg-black/75 border-white/20 text-white'
              }`}
              title={`Camera Size: ${cameraSize} (Tap to change)`}
            >
              <Crop className="w-5 h-5" />
            </button>

            {/* 6. Down Arrow (Expand extra tools: Timer, Speed, Mic) */}
            <div className="relative flex flex-col items-center">
              <button
                type="button"
                id="camera-more-tools-btn"
                onClick={() => setShowExtraLeftTools((prev) => !prev)}
                className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-90 shadow-xl cursor-pointer ${
                  showExtraLeftTools
                    ? 'bg-white/25 border-white text-white'
                    : 'bg-black/45 hover:bg-black/75 border-white/20 text-white'
                }`}
                title="More Tools"
              >
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${
                    showExtraLeftTools ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Expanded Sub-Tools Menu */}
              {showExtraLeftTools && (
                <div className="absolute left-12 top-0 bg-neutral-900/95 border border-white/20 rounded-2xl p-2.5 flex flex-col gap-2.5 backdrop-blur-xl z-40 shadow-2xl min-w-[160px]">
                  {/* Timer Selector */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-400 px-1">Timer</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 3, 10].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setCountdownTimer(t);
                            if (onShowToast) onShowToast(t === 0 ? 'Timer off' : `Timer set to ${t}s ⏱️`);
                          }}
                          className={`py-1 text-[11px] rounded-lg font-bold text-center transition cursor-pointer ${
                            countdownTimer === t
                              ? 'bg-rose-500 text-white'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {t === 0 ? 'Off' : `${t}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Framing Size Selector */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-400 px-1">Framing Size</span>
                    <div className="grid grid-cols-2 gap-1">
                      {CAMERA_SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectCameraSize(opt.id)}
                          className={`py-1 px-1.5 text-[10px] rounded-lg font-bold text-center transition cursor-pointer ${
                            cameraSize === opt.id
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {opt.shortLabel}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed Selector */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-400 px-1">Speed</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['0.5x', '1x', '2x'] as const).map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => {
                            setRecordingSpeed(spd);
                            if (onShowToast) onShowToast(`Speed set to ${spd}`);
                          }}
                          className={`py-1 text-[11px] rounded-lg font-bold text-center transition cursor-pointer ${
                            recordingSpeed === spd
                              ? 'bg-rose-500 text-white'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {spd}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mic Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isMicMuted;
                      setIsMicMuted(next);
                      if (onShowToast) onShowToast(next ? 'Microphone muted 🔇' : 'Microphone unmuted 🎙️');
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isMicMuted ? 'bg-rose-500/20 text-rose-300' : 'text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                    <span>{isMicMuted ? 'Mic Off' : 'Mic On'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* INSTAGRAM EFFECTS DRAWER (Live Filters: Trending & Appearance) */}
          {isEffectsDrawerOpen && (
            <div className="fixed inset-x-0 bottom-0 z-40 bg-neutral-950/95 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl pt-3 pb-safe pb-6 px-4 shadow-[0_-15px_35px_rgba(0,0,0,0.85)] pointer-events-auto animate-in slide-in-from-bottom duration-300 max-h-[65vh] flex flex-col">
              {/* Drawer Handle */}
              <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-3" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                      <span>Instagram Effects</span>
                    </h3>
                    <p className="text-[11px] text-white/60">
                      Live Effect: <span className="text-rose-400 font-bold">{activeFilterPreset.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedFilter !== 'normal' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFilter('normal');
                        if (onShowToast) onShowToast('Reset to Normal effect');
                      }}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold transition cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEffectsDrawerOpen(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    aria-label="Close Effects Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Category Switcher Tabs: Trending | Appearance */}
              <div className="flex items-center gap-2 py-3 shrink-0">
                <button
                  type="button"
                  id="effects-tab-trending-btn"
                  onClick={() => setEffectsTab('trending')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    effectsTab === 'trending'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/25 ring-1 ring-white/30'
                      : 'bg-neutral-900/90 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <span>🔥 Trending</span>
                  <span className="text-[10px] opacity-75">
                    ({FILTER_PRESETS.filter((f) => f.category === 'trending').length})
                  </span>
                </button>

                <button
                  type="button"
                  id="effects-tab-appearance-btn"
                  onClick={() => setEffectsTab('appearance')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    effectsTab === 'appearance'
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-white/30'
                      : 'bg-neutral-900/90 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <span>✨ Appearance & Glow</span>
                  <span className="text-[10px] opacity-75">
                    ({FILTER_PRESETS.filter((f) => f.category === 'appearance').length})
                  </span>
                </button>
              </div>

              {/* Filter Cards Grid */}
              <div className="flex-1 overflow-y-auto pr-1 py-1 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {FILTER_PRESETS.filter((f) => f.category === effectsTab).map((filter) => {
                  const isSelected = selectedFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        setSelectedFilter(filter.id);
                        if (onShowToast) onShowToast(`${filter.name} effect applied ✨`);
                      }}
                      className={`relative p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer border ${
                        isSelected
                          ? 'bg-white/15 border-rose-400 ring-2 ring-rose-500/50 scale-[1.02] shadow-xl'
                          : 'bg-neutral-900/70 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Effect Icon Bubble */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                          isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-neutral-950' : ''
                        } ${filter.bubbleClass}`}
                      >
                        {isSelected ? (
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-white/80" />
                        )}
                      </div>

                      {/* Filter Name */}
                      <span
                        className={`text-[11px] leading-tight font-bold line-clamp-1 ${
                          isSelected ? 'text-white' : 'text-neutral-200'
                        }`}
                      >
                        {filter.name}
                      </span>

                      {/* Tag pill */}
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-rose-500/40 text-rose-200 font-bold'
                            : 'bg-white/5 text-neutral-400'
                        }`}
                      >
                        {filter.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* OVERLAY 3: Transparent Bottom Controls (Filters, Shutter, Tabs) */}
          <div className="fixed bottom-0 inset-x-0 z-30 flex flex-col items-center pb-safe pb-6 pt-12 px-4 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-auto">
            {/* 10 Trending Instagram-Style Filters Shelf */}
            <div className="w-full max-w-md mb-3 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar py-1 px-4">
              {FILTER_PRESETS.map((filter) => {
                const isSelected = selectedFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedFilter(filter.id)}
                    className="flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer flex-shrink-0 group focus:outline-hidden"
                    aria-label={`Select ${filter.name} filter`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                        isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                          : 'opacity-65 hover:opacity-90 hover:scale-105'
                      } ${filter.bubbleClass}`}
                    >
                      {isSelected && <Sparkles className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span
                      className={`text-[9px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
                        isSelected ? 'text-white font-bold' : 'text-white/50'
                      }`}
                    >
                      {filter.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Shutter Dock Row: [Gallery (Bottom-Left) | Big White Round Record Button (Center) | Camera Flip (Bottom-Right)] */}
            <div className="w-full max-w-sm flex items-center justify-between px-6 mb-3">
              {/* Bottom-Left: Gallery Thumbnail Picker */}
              <button
                type="button"
                id="camera-gallery-picker-btn"
                onClick={() => fileFallbackInputRef.current?.click()}
                disabled={isRecording}
                className="w-12 h-12 rounded-xl bg-neutral-900/80 border border-white/30 flex items-center justify-center text-white hover:bg-neutral-800 transition active:scale-90 shadow-xl overflow-hidden cursor-pointer"
                title="Choose from Gallery"
              >
                <ImageIcon className="w-6 h-6 text-white/90" />
              </button>

              {/* Center: Bada Safed Gol Record Button */}
              {mode === 'LIVE' ? (
                <button
                  type="button"
                  id="live-session-toggle-btn"
                  onClick={() => setIsLiveActive((prev) => !prev)}
                  className={`px-5 py-3 rounded-full font-bold text-xs tracking-wider flex items-center gap-2 shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer border ${
                    isLiveActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400 animate-pulse'
                      : 'bg-white hover:bg-neutral-100 text-black border-white'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>{isLiveActive ? 'End Live Session' : 'Start Live Session'}</span>
                </button>
              ) : (
                <div className="relative flex items-center justify-center">
                  {/* Circular Recording Progress Ring */}
                  {isRecording && (
                    <svg className="absolute w-[96px] h-[96px] -rotate-90 pointer-events-none">
                      <circle
                        cx="48"
                        cy="48"
                        r="43"
                        className="stroke-red-600/30"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="43"
                        className="stroke-red-500 transition-all duration-300 ease-linear"
                        strokeWidth="5"
                        strokeDasharray={270}
                        strokeDashoffset={270 - (270 * recordingSeconds) / maxRecordingSeconds}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                  )}

                  <button
                    type="button"
                    id="instagram-shutter-btn"
                    onPointerDown={handleShutterPointerDown}
                    onPointerUp={handleShutterPointerUp}
                    onPointerLeave={() => {
                      if (isShutterPressed) handleShutterPointerUp();
                    }}
                    aria-label={
                      isRecording
                        ? 'Stop recording'
                        : mode === 'REEL'
                        ? 'Tap to start recording, or hold'
                        : 'Tap to capture photo'
                    }
                    className={`relative w-[86px] h-[86px] rounded-full flex items-center justify-center transition-transform duration-150 focus:outline-hidden cursor-pointer ${
                      isShutterPressed || isRecording ? 'scale-105' : 'active:scale-95'
                    }`}
                  >
                    {/* Bada Safed Gol Outer Ring */}
                    <div
                      className={`absolute inset-0 rounded-full border-[4px] transition-all duration-200 ${
                        isRecording
                          ? 'border-red-500 scale-105'
                          : 'border-white/95 shadow-2xl hover:border-white'
                      }`}
                    />

                    {/* Bada Safed Gol Inner White Button */}
                    <div
                      className={`transition-all duration-200 flex items-center justify-center ${
                        isRecording
                          ? 'w-8 h-8 rounded-lg bg-red-500 animate-pulse'
                          : isShutterPressed
                          ? 'w-[62px] h-[62px] rounded-full bg-white scale-90'
                          : 'w-[70px] h-[70px] rounded-full bg-white hover:bg-neutral-100 shadow-inner'
                      }`}
                    >
                      {mode === 'REEL' && !isRecording && (
                        <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )}

              {/* Bottom-Right: Camera Flip Icon */}
              <button
                type="button"
                id="camera-flip-btn"
                onClick={handleFlipCamera}
                disabled={isRecording}
                className="w-12 h-12 rounded-full bg-black/45 hover:bg-black/75 border border-white/30 flex items-center justify-center text-white backdrop-blur-md shadow-xl transition active:scale-90 cursor-pointer"
                title="Flip Camera (Front/Back)"
              >
                <RefreshCw
                  className={`w-6 h-6 transition-transform duration-300 ${
                    isFlipping ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Sabse Neeche Menu: POST | STORY | REEL | LIVE (REEL bold white dikhe) */}
            <div
              ref={modesScrollRef}
              className="w-full flex items-center justify-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar py-2 px-6 cursor-pointer"
            >
              {(['POST', 'STORY', 'REEL', 'LIVE'] as const).map((m, idx, arr) => {
                const isActive = mode === m;
                const isReel = m === 'REEL';
                return (
                  <React.Fragment key={m}>
                    <button
                      type="button"
                      data-mode={m}
                      onClick={() => {
                        if (!isRecording) setMode(m);
                      }}
                      className={`relative px-2 py-1 transition-all duration-200 flex flex-col items-center cursor-pointer ${
                        isActive
                          ? 'text-white font-black scale-110 drop-shadow-md'
                          : isReel
                          ? 'text-white font-black opacity-95'
                          : 'text-white/50 hover:text-white/80 font-bold'
                      } text-xs tracking-widest`}
                    >
                      <span className={isReel ? 'font-black tracking-widest' : ''}>{m}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shadow-xs" />
                      )}
                    </button>
                    {idx < arr.length - 1 && (
                      <span className="text-white/30 text-xs font-light select-none">|</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: POST-RECORDING VIDEO / MEDIA EDITOR SCREEN     */}
      {/* ======================================================== */}
      {isEditing && (
        <div
          ref={editorViewportRef}
          onPointerUp={handleOverlayPointerUp}
          className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-black"
        >
          {/* MEDIA BACKGROUND LOOP */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden bg-black cursor-pointer flex items-center justify-center"
            onClick={toggleEditorPlayPause}
          >
            {/* Ambient soft glow backdrop for Free Size or custom aspect ratio media */}
            {cameraSize !== '9:16' && (recordedVideoUrl || capturedPhotoUrl) && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 blur-3xl scale-110">
                {recordedVideoUrl ? (
                  <video
                    src={recordedVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={capturedPhotoUrl!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}

            {recordedVideoUrl ? (
              <video
                ref={videoEditorPreviewRef}
                src={recordedVideoUrl}
                playsInline
                webkit-playsinline="true"
                controlsList="nodownload"
                autoPlay
                loop
                muted={editorMuted}
                onLoadedMetadata={handleEditorVideoLoadedMetadata}
                onTimeUpdate={handleEditorVideoTimeUpdate}
                style={{
                  objectFit: cameraSize === 'free' ? 'contain' : cameraSize === '9:16' ? 'cover' : 'contain',
                }}
                className={`max-w-full max-h-full ${
                  cameraSize === 'free'
                    ? 'w-full h-full object-contain'
                    : cameraSize === '1:1'
                    ? 'w-full max-w-[min(100vw,100vh)] aspect-square object-cover shadow-2xl'
                    : cameraSize === '4:5'
                    ? 'h-full max-h-screen aspect-[4/5] object-cover shadow-2xl'
                    : cameraSize === '16:9'
                    ? 'w-full max-w-screen aspect-video object-cover shadow-2xl'
                    : 'w-full h-full object-cover'
                } transition-all duration-200 ${activeFilterPreset.cssClass}`}
              />
            ) : capturedPhotoUrl ? (
              <img
                src={capturedPhotoUrl}
                alt="Captured review"
                style={{
                  objectFit: cameraSize === 'free' ? 'contain' : cameraSize === '9:16' ? 'cover' : 'contain',
                }}
                className={`max-w-full max-h-full ${
                  cameraSize === 'free'
                    ? 'w-full h-full object-contain'
                    : cameraSize === '1:1'
                    ? 'w-full max-w-[min(100vw,100vh)] aspect-square object-cover shadow-2xl'
                    : cameraSize === '4:5'
                    ? 'h-full max-h-screen aspect-[4/5] object-cover shadow-2xl'
                    : cameraSize === '16:9'
                    ? 'w-full max-w-screen aspect-video object-cover shadow-2xl'
                    : 'w-full h-full object-cover'
                } ${activeFilterPreset.cssClass}`}
              />
            ) : null}

            {/* Play / Pause Animated Badge overlay */}
            {!editorPlaying && recordedVideoUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-18 h-18 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-2xl">
                  <Play className="w-8 h-8 fill-white ml-1" />
                </div>
              </div>
            )}

            {/* Audio attribution sticker if audio selected */}
            {selectedAudio && (
              <div className="absolute top-18 left-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
                <Music className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="max-w-[160px] truncate">{selectedAudio.title}</span>
              </div>
            )}

            {/* Filter Name Badge */}
            {selectedFilter !== 'normal' && (
              <div className="absolute top-18 right-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeFilterPreset.name}</span>
              </div>
            )}

            {/* DYNAMIC TEXT OVERLAYS */}
            {textOverlays.map((item) => (
              <div
                key={item.id}
                onPointerDown={(e) => handleOverlayPointerDown(item.id, e)}
                onPointerMove={(e) => handleOverlayPointerMove(item.id, e)}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: item.color,
                }}
                className={`absolute z-30 cursor-grab active:cursor-grabbing select-none group px-3 py-1.5 transition-shadow ${getFontClass(
                  item.font
                )} ${
                  item.bgMode === 'solid'
                    ? 'bg-black/75 rounded-xl shadow-lg border border-white/10'
                    : item.bgMode === 'glass'
                    ? 'backdrop-blur-md bg-white/20 rounded-xl border border-white/30 shadow-lg'
                    : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                } text-base sm:text-xl`}
              >
                <span>{item.text}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveTextOverlay(item.id, e)}
                  className="hidden group-hover:flex absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white items-center justify-center text-[10px] shadow-md hover:scale-110 transition cursor-pointer"
                  title="Remove text"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* DYNAMIC STICKER / BADGE OVERLAYS */}
            {stickerOverlays.map((item) => (
              <div
                key={item.id}
                onPointerDown={(e) => handleOverlayPointerDown(item.id, e)}
                onPointerMove={(e) => handleOverlayPointerMove(item.id, e)}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-30 cursor-grab active:cursor-grabbing select-none group ${
                  item.isBadge
                    ? 'px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white font-black text-sm tracking-wide shadow-xl border border-white/40 drop-shadow-md'
                    : 'text-4xl drop-shadow-xl hover:scale-110 transition'
                }`}
              >
                <span>{item.content}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveStickerOverlay(item.id, e)}
                  className="hidden group-hover:flex absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white items-center justify-center text-[10px] shadow-md hover:scale-110 transition cursor-pointer"
                  title="Remove sticker"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* =================================================== */}
          {/* EDITOR VIEW STATE A: EDITING TOOLS (Text, Stickers, Trim, Speed, Filters) */}
          {/* =================================================== */}
          {editorView === 'edit' && (
            <>
              {/* TOP EDITOR BAR: [Retake | Top Tools (Text, Sticker, Music, Mute) | Next] */}
              <div className="relative z-30 flex items-center justify-between p-4 pt-safe bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                {/* Back / Retake Button */}
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/50 hover:bg-black/80 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition active:scale-95 shadow-lg cursor-pointer"
                  title="Discard and retake"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake</span>
                </button>

                {/* Top Action Tools: Text, Stickers, Music, Mute */}
                <div className="flex items-center gap-2">
                  {/* Add Text Tool */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveEditorDrawer((d) => (d === 'text' ? 'none' : 'text'))
                    }
                    className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 shadow-lg cursor-pointer ${
                      activeEditorDrawer === 'text'
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-black/50 text-white border-white/20 hover:bg-black/80'
                    }`}
                    title="Add Text"
                  >
                    <Type className="w-5 h-5" />
                  </button>

                  {/* Add Stickers Tool */}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveEditorDrawer((d) => (d === 'stickers' ? 'none' : 'stickers'))
                    }
                    className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 shadow-lg cursor-pointer ${
                      activeEditorDrawer === 'stickers'
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-black/50 text-white border-white/20 hover:bg-black/80'
                    }`}
                    title="Add Stickers / Emojis"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Audio / Music Selector */}
                  <button
                    type="button"
                    onClick={() => setIsAudioDrawerOpen(true)}
                    className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md border border-white/20 transition active:scale-95 shadow-lg cursor-pointer"
                    title="Add Music / Audio"
                  >
                    <Music className="w-5 h-5 text-rose-400" />
                  </button>

                  {/* Mute Video Sound Toggle */}
                  {recordedVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditorMuted((m) => !m)}
                      className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 shadow-lg cursor-pointer ${
                        editorMuted
                          ? 'bg-rose-500 text-white border-rose-400'
                          : 'bg-black/50 text-white border-white/20 hover:bg-black/80'
                      }`}
                      title={editorMuted ? 'Unmute' : 'Mute'}
                    >
                      {editorMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Next Button (To Final Publish details) */}
                <button
                  type="button"
                  id="editor-next-btn"
                  onClick={() => {
                    setActiveEditorDrawer('none');
                    setEditorView('publish');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 active:scale-95 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* FLOATING DRAWERS / SUB-MENUS */}
              {/* 1. TEXT TOOL MODAL */}
              {activeEditorDrawer === 'text' && (
                <div className="absolute inset-x-4 top-20 z-40 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-rose-400" />
                      Add Text Overlay
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveEditorDrawer('none')}
                      className="text-white/60 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    autoFocus
                    value={newTextString}
                    onChange={(e) => setNewTextString(e.target.value)}
                    placeholder="Type text... (e.g. बवाल धमाका 🔥)"
                    className="w-full bg-neutral-800 text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-hidden focus:border-rose-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTextOverlay();
                    }}
                  />

                  {/* Fonts Selector */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {fontOptions.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setNewTextFont(f.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                          newTextFont === f.id
                            ? 'bg-rose-500 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        } ${f.styleClass}`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>

                  {/* Color Palette */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {colorOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewTextColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border border-white/30 transition-transform cursor-pointer ${
                            newTextColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Box style toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setNewTextBgMode((m) =>
                          m === 'solid' ? 'glass' : m === 'glass' ? 'none' : 'solid'
                        )
                      }
                      className="px-2 py-1 rounded-md bg-neutral-800 border border-white/20 text-[10px] font-bold text-white capitalize cursor-pointer"
                    >
                      Bg: {newTextBgMode}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTextOverlay}
                    disabled={!newTextString.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    Add to Video
                  </button>
                </div>
              )}

              {/* 2. STICKERS / EMOJIS DRAWER */}
              {activeEditorDrawer === 'stickers' && (
                <div className="absolute inset-x-4 top-20 z-40 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 max-h-[360px] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveStickerTab('badges')}
                        className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition ${
                          activeStickerTab === 'badges'
                            ? 'bg-rose-500 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Bhojpuri Badges
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStickerTab('emojis')}
                        className={`text-xs font-bold px-3 py-1 rounded-full cursor-pointer transition ${
                          activeStickerTab === 'emojis'
                            ? 'bg-rose-500 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Emojis
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveEditorDrawer('none')}
                      className="text-white/60 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges tab */}
                  {activeStickerTab === 'badges' ? (
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[260px] py-1">
                      {bhojpuriBadges.map((badge) => (
                        <button
                          key={badge}
                          type="button"
                          onClick={() => handleAddSticker(badge, true)}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600/30 via-rose-600/30 to-purple-600/30 border border-white/20 text-white font-bold text-xs text-left hover:scale-[1.02] active:scale-95 transition cursor-pointer shadow-md"
                        >
                          {badge}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-3 overflow-y-auto max-h-[260px] py-2 text-center text-3xl">
                      {popularEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddSticker(emoji, false)}
                          className="hover:scale-125 active:scale-95 transition cursor-pointer p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BOTTOM EDITING DOCK (Filters, Trim, Speed) */}
              <div className="relative z-30 w-full flex flex-col items-center pb-safe pb-6 pt-3 px-4 bg-gradient-to-t from-black via-black/90 to-transparent">
                {/* 3. TRIM TIMELINE DRAWER */}
                {activeEditorDrawer === 'trim' && recordedVideoUrl && (
                  <div className="w-full max-w-md bg-neutral-900/90 border border-white/20 rounded-2xl p-3 mb-3 backdrop-blur-md shadow-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-amber-400" />
                        Trim Clip Length
                      </span>
                      <span className="text-amber-400 font-mono">
                        {formatTimer(trimStart)} - {formatTimer(trimEnd)} (
                        {Math.max(1, Math.round(trimEnd - trimStart))}s)
                      </span>
                    </div>

                    {/* Trim Range Slider Inputs */}
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-neutral-400 w-10">Start:</span>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, trimEnd - 1)}
                          step="0.5"
                          value={trimStart}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTrimStart(val);
                            if (videoEditorPreviewRef.current) {
                              videoEditorPreviewRef.current.currentTime = val;
                            }
                          }}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-white w-8">
                          {trimStart.toFixed(1)}s
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-neutral-400 w-10">End:</span>
                        <input
                          type="range"
                          min={Math.min(videoDuration, trimStart + 1)}
                          max={videoDuration}
                          step="0.5"
                          value={trimEnd}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTrimEnd(val);
                            if (videoEditorPreviewRef.current) {
                              videoEditorPreviewRef.current.currentTime = val;
                            }
                          }}
                          className="flex-1 accent-rose-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-white w-8">
                          {trimEnd.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SPEED ADJUSTMENT DRAWER */}
                {activeEditorDrawer === 'speed' && recordedVideoUrl && (
                  <div className="w-full max-w-md bg-neutral-900/90 border border-white/20 rounded-2xl p-3 mb-3 backdrop-blur-md shadow-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-sky-400" />
                      Playback Speed
                    </span>
                    <div className="flex items-center gap-2">
                      {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => handleSetEditorSpeed(spd)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                            editorSpeed === spd
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. FILTER SELECTOR SHELF */}
                {(activeEditorDrawer === 'filters' || activeEditorDrawer === 'none') && (
                  <div className="w-full max-w-md mb-3 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar py-1 px-4">
                    {FILTER_PRESETS.map((filter) => {
                      const isSelected = selectedFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setSelectedFilter(filter.id)}
                          className="flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer flex-shrink-0 group focus:outline-hidden"
                          aria-label={`Select ${filter.name} filter`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                              isSelected
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                                : 'opacity-65 hover:opacity-90 hover:scale-105'
                            } ${filter.bubbleClass}`}
                          >
                            {isSelected && <Sparkles className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span
                            className={`text-[9px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
                              isSelected ? 'text-white font-bold' : 'text-white/50'
                            }`}
                          >
                            {filter.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dock Quick Tools: [Filters | Trim | Speed | Music] */}
                <div className="w-full max-w-md flex items-center justify-around bg-neutral-900/80 rounded-2xl p-1.5 border border-white/10 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveEditorDrawer((d) => (d === 'filters' ? 'none' : 'filters'))
                    }
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeEditorDrawer === 'filters' || activeEditorDrawer === 'none'
                        ? 'bg-white/15 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Filters</span>
                  </button>

                  {recordedVideoUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveEditorDrawer((d) => (d === 'trim' ? 'none' : 'trim'))
                        }
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activeEditorDrawer === 'trim'
                            ? 'bg-white/15 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Scissors className="w-4 h-4 text-rose-400" />
                        <span>Trim</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveEditorDrawer((d) => (d === 'speed' ? 'none' : 'speed'))
                        }
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activeEditorDrawer === 'speed'
                            ? 'bg-white/15 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Gauge className="w-4 h-4 text-sky-400" />
                        <span>Speed</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsAudioDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    <Music className="w-4 h-4 text-pink-400" />
                    <span>Music</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* =================================================== */}
          {/* EDITOR VIEW STATE B: PUBLISH & SHARE DETAILS SCREEN */}
          {/* =================================================== */}
          {editorView === 'publish' && (
            <div className="fixed inset-0 z-40 w-full h-full flex flex-col bg-neutral-950/98 backdrop-blur-2xl overflow-hidden">
              {/* Top Navigation (Fixed / Sticky Header) */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neutral-950/90 backdrop-blur-md pt-safe z-20">
                <button
                  type="button"
                  onClick={() => setEditorView('edit')}
                  className="flex items-center gap-1 text-white/80 hover:text-white text-xs font-bold cursor-pointer transition active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back to Editor</span>
                </button>
                <h3 className="font-black text-white text-sm tracking-wide">
                  {mode === 'REEL' || recordedVideoUrl
                    ? 'New Bhojpuri Reel'
                    : mode === 'STORY'
                    ? 'New Story'
                    : 'New Post'}
                </h3>
                <div className="w-16" />
              </div>

              {/* Main Publish Form (Scrollable body) */}
              <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full flex flex-col gap-4 pb-6">
                {/* Media Preview Thumbnail & Caption */}
                <div className="flex gap-3">
                  <div className="w-24 h-32 rounded-xl overflow-hidden bg-neutral-900 border border-white/20 flex-shrink-0 relative shadow-md">
                    {recordedVideoUrl ? (
                      <video
                        src={recordedVideoUrl}
                        className={`w-full h-full object-cover ${activeFilterPreset.cssClass}`}
                        muted
                      />
                    ) : (
                      <img
                        src={capturedPhotoUrl || ''}
                        alt="Preview"
                        className={`w-full h-full object-cover ${activeFilterPreset.cssClass}`}
                      />
                    )}
                    <div className="absolute bottom-1 right-1 p-1 rounded-md bg-black/60 text-white text-[10px] font-mono">
                      {recordedVideoUrl ? `${Math.round(trimEnd - trimStart)}s` : 'Photo'}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      placeholder="Write a catchy caption for your Bhojpuri reel... 🔥 #Jhalak"
                      rows={4}
                      className="w-full bg-neutral-900/90 text-white text-xs rounded-xl p-3 border border-white/15 focus:outline-hidden focus:border-rose-500 resize-none placeholder-white/30"
                    />

                    {/* Quick Emojis Bar */}
                    <div className="flex items-center gap-2">
                      {['🔥', '❤️', '💃', '🪕', '👑', '✨'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setPostCaption((p) => p + ' ' + emoji)}
                          className="hover:scale-125 transition text-sm cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trending Bhojpuri Hashtags */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-rose-400" />
                    Trending Hashtags (tap to add)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {trendingHashtags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!postCaption.includes(tag)) {
                            setPostCaption((p) => (p.trim() ? `${p.trim()} ${tag}` : tag));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-rose-950/40 text-neutral-300 hover:text-rose-300 border border-white/10 text-[11px] font-semibold transition cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Category Selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    Category
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Bhojpuri', 'Music', 'Comedy', 'Dance', 'Folk', 'Lifestyle'] as const).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat as ContentCategory)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500'
                              : 'bg-neutral-900 text-neutral-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Audio Attribution Pill */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-white/10">
                  <div className="flex items-center gap-2 max-w-[240px] truncate">
                    <Music className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-white truncate">
                      {selectedAudio
                        ? `${selectedAudio.title} • ${selectedAudio.artist}`
                        : 'Original Sound'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAudioDrawerOpen(true)}
                    className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Share Options Toggle */}
                {mode === 'REEL' && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-white/10">
                    <span className="text-xs font-semibold text-neutral-300">
                      Also Share to Feed Grid
                    </span>
                    <input
                      type="checkbox"
                      checked={alsoShareToFeed}
                      onChange={(e) => setAlsoShareToFeed(e.target.checked)}
                      className="accent-rose-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Sticky Bottom Final Share / Upload Action Bar (Guaranteed Never Cut Off) */}
              <div className="shrink-0 sticky bottom-0 inset-x-0 w-full bg-neutral-950/95 backdrop-blur-xl border-t border-white/15 px-4 pt-3 pb-safe pb-4 shadow-[0_-12px_30px_rgba(0,0,0,0.85)] z-50">
                <div className="max-w-lg mx-auto w-full flex flex-col gap-1.5">
                  <button
                    type="button"
                    id="final-share-button"
                    onClick={handleFinalPublish}
                    disabled={isSharing}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-2xl shadow-rose-500/30 active:scale-[0.98] transition cursor-pointer"
                  >
                    {isSharing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 fill-white" />
                    )}
                    <span>
                      {isSharing
                        ? 'Publishing...'
                        : mode === 'REEL' || recordedVideoUrl
                        ? 'Share / Upload to Reels 🚀'
                        : mode === 'STORY'
                        ? 'Add to Story 🌟'
                        : 'Share / Upload Post 📸'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bhojpuri Music Selector Drawer */}
      {isAudioDrawerOpen && (
        <ReelsAudioSelector
          isOpen={isAudioDrawerOpen}
          onClose={() => setIsAudioDrawerOpen(false)}
          currentTrackTitle={selectedAudio ? selectedAudio.title : ''}
          onSelectTrack={(track) => {
            setSelectedAudio(track);
            setIsAudioDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CameraModal;
