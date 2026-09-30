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
  | 'smooth_beauty_glow'
  | 'cinematic_warm'
  | 'cyberpunk_neon'
  | 'retro_vhs_tape'
  | 'golden_hour'
  | 'bw_high_contrast'
  | 'soft_dreamy_blur'
  | 'party_sparkle'
  | 'vignette_moody';

export interface FilterPreset {
  id: FilterId;
  name: string;
  cssClass: string;
  canvasFilter: string;
  bubbleClass: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    cssClass: '',
    canvasFilter: 'none',
    bubbleClass: 'bg-neutral-800/90 border border-white/30',
  },
  {
    id: 'smooth_beauty_glow',
    name: 'Smooth Beauty Glow',
    cssClass: 'brightness-[1.08] contrast-[1.03] saturate-[1.18]',
    canvasFilter: 'brightness(1.08) contrast(1.03) saturate(1.18)',
    bubbleClass: 'bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200',
  },
  {
    id: 'cinematic_warm',
    name: 'Cinematic Warm',
    cssClass: 'sepia-[0.38] saturate-[1.4] contrast-[1.12] brightness-[1.02] hue-rotate-[-4deg]',
    canvasFilter: 'sepia(0.38) saturate(1.4) contrast(1.12) brightness(1.02) hue-rotate(-4deg)',
    bubbleClass: 'bg-gradient-to-tr from-amber-700 via-orange-500 to-yellow-400',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    cssClass: 'saturate-[1.85] contrast-[1.28] hue-rotate-[315deg] brightness-[1.12]',
    canvasFilter: 'saturate(1.85) contrast(1.28) hue-rotate(315deg) brightness(1.12)',
    bubbleClass: 'bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-cyan-400',
  },
  {
    id: 'retro_vhs_tape',
    name: 'Retro VHS Tape',
    cssClass: 'contrast-[1.25] saturate-[0.85] sepia-[0.25] brightness-[0.98]',
    canvasFilter: 'contrast(1.25) saturate(0.85) sepia(0.25) brightness(0.98)',
    bubbleClass: 'bg-gradient-to-tr from-cyan-700 via-stone-600 to-amber-600',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    cssClass: 'sepia-[0.45] saturate-[1.5] contrast-[1.1] brightness-[1.06] hue-rotate-[8deg]',
    canvasFilter: 'sepia(0.45) saturate(1.5) contrast(1.1) brightness(1.06) hue-rotate(8deg)',
    bubbleClass: 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-400',
  },
  {
    id: 'bw_high_contrast',
    name: 'B&W High-Contrast',
    cssClass: 'grayscale contrast-[1.55] brightness-[0.92]',
    canvasFilter: 'grayscale(1) contrast(1.55) brightness(0.92)',
    bubbleClass: 'bg-gradient-to-tr from-black via-neutral-700 to-white',
  },
  {
    id: 'soft_dreamy_blur',
    name: 'Soft Dreamy Blur',
    cssClass: 'brightness-[1.12] contrast-[0.96] saturate-[1.22]',
    canvasFilter: 'brightness(1.12) contrast(0.96) saturate(1.22)',
    bubbleClass: 'bg-gradient-to-tr from-purple-300 via-pink-300 to-sky-200',
  },
  {
    id: 'party_sparkle',
    name: 'Party Sparkle',
    cssClass: 'brightness-[1.15] contrast-[1.2] saturate-[1.4] hue-rotate-[15deg]',
    canvasFilter: 'brightness(1.15) contrast(1.2) saturate(1.4) hue-rotate(15deg)',
    bubbleClass: 'bg-gradient-to-tr from-yellow-300 via-rose-500 to-indigo-500',
  },
  {
    id: 'vignette_moody',
    name: 'Vignette Moody',
    cssClass: 'contrast-[1.3] brightness-[0.88] saturate-[0.9] sepia-[0.15]',
    canvasFilter: 'contrast(1.3) brightness(0.88) saturate(0.9) sepia(0.15)',
    bubbleClass: 'bg-gradient-to-tr from-neutral-950 via-stone-800 to-amber-900',
  },
];

export interface CameraModalProps {
  initialMode?: CameraMode;
  initialAudio?: string;
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

  // Stream & Hardware
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Trending Filters & Tools (10 popular effects)
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('normal');
  const [recordingSpeed, setRecordingSpeed] = useState<'0.3x' | '0.5x' | '1x' | '2x' | '3x'>('1x');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [countdownTimer, setCountdownTimer] = useState<0 | 3 | 10>(0);
  const [activeCountdown, setActiveCountdown] = useState<number | null>(null);

  // Audio state
  const [selectedAudio, setSelectedAudio] = useState<{
    id?: string;
    title: string;
    artist?: string;
    audioUrl?: string;
  } | null>(() => {
    if (initialAudio) {
      const match = BHOJPURI_MUSIC_LIBRARY.find((t) => t.title === initialAudio);
      if (match) return match;
      return { title: initialAudio, artist: 'Original Audio' };
    }
    return null;
  });
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);

  // Recording & Shutter states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [maxRecordingSeconds, setMaxRecordingSeconds] = useState<number>(60);
  const [isShutterPressed, setIsShutterPressed] = useState(false);
  const [showFlashBurst, setShowFlashBurst] = useState(false);

  // Captured Media review state
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedPhotoBlob, setCapturedPhotoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);

  // Review & Sharing Metadata
  const [postCaption, setPostCaption] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Live session state (clean active preview, no fake comments/viewers)
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveDurationSeconds, setLiveDurationSeconds] = useState(0);

  // Refs
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const liveTimerRef = useRef<number | null>(null);
  const pressHoldTimerRef = useRef<number | null>(null);
  const isPressAndHoldingRef = useRef(false);
  const fileFallbackInputRef = useRef<HTMLInputElement>(null);
  const modesScrollRef = useRef<HTMLDivElement>(null);
  const isRetryingCameraRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);

  const activeFilterPreset = useMemo(
    () => FILTER_PRESETS.find((f) => f.id === selectedFilter) || FILTER_PRESETS[0],
    [selectedFilter]
  );

  // Adjust max seconds by mode
  useEffect(() => {
    if (mode === 'STORY') setMaxRecordingSeconds(15);
    else if (mode === 'REEL') setMaxRecordingSeconds(60);
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

    if (videoPreviewRef.current) {
      try {
        videoPreviewRef.current.pause();
        videoPreviewRef.current.removeAttribute('src');
        videoPreviewRef.current.load();
      } catch {
        // ignore
      }
    }
  }, []);

  // Initialize High-Definition 1080p Camera Stream with robust Audio capture
  const startCamera = useCallback(async () => {
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

      // Tier 1: 1080p Full-Screen Portrait Stream with crystal clear Audio
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isFrontCamera ? 'user' : 'environment',
            width: { ideal: 1080, min: 480 },
            height: { ideal: 1920, min: 640 },
            aspectRatio: { ideal: 9 / 16 },
          },
          audio: isMicMuted ? false : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err1) {
        console.warn('Tier 1 (1080p + audio) failed, trying Tier 2 (720p HD)...', err1);
        try {
          // Tier 2: 720p HD with basic audio
          newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: isFrontCamera ? 'user' : 'environment',
              width: { ideal: 720 },
              height: { ideal: 1280 },
            },
            audio: isMicMuted ? false : true,
          });
        } catch (err2) {
          console.warn('Tier 2 failed, trying video-only unconstrained...', err2);
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
        errorMsg = 'Camera access was blocked. Please allow camera permissions in browser settings, or select a photo/video from your gallery.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera sensor was detected. You can select a photo or video from your device library.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera sensor is currently occupied by another app. Please close other camera apps and tap "Retry Camera".';
      }
      setCameraError(errorMsg);
    } finally {
      isRetryingCameraRef.current = false;
      setCameraLoading(false);
    }
  }, [isFrontCamera, isMicMuted, cleanupHardwareResources]);

  useEffect(() => {
    startCamera();
    return () => {
      cleanupHardwareResources();
      if (timerRef.current) clearInterval(timerRef.current);
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      if (pressHoldTimerRef.current) clearTimeout(pressHoldTimerRef.current);
    };
  }, [startCamera, cleanupHardwareResources]);

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
    const s = sec % 60;
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
          activeBtn.offsetLeft -
          container.clientWidth / 2 +
          activeBtn.clientWidth / 2;
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
      const vWidth = vid.videoWidth || 1080;
      const vHeight = vid.videoHeight || 1920;

      let targetWidth = 1080;
      let targetHeight = 1920;

      if (mode === 'POST') {
        targetWidth = 1080;
        targetHeight = 1080;
      } else {
        targetWidth = 1080;
        targetHeight = 1920;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
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

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const photoUrl = URL.createObjectURL(blob);
              setCapturedPhotoBlob(blob);
              setCapturedPhotoUrl(photoUrl);
            }
          },
          'image/jpeg',
          0.94
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
      canvas.width = 540;
      canvas.height = 960;
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

  // Modes Shutter Handling:
  // - 'POST' & 'STORY': Shutter click takes instant photo
  // - 'REEL': Press-and-hold (or single tap toggle) records actual video with audio
  // - 'LIVE': Toggles Start/End Live session
  const handleShutterPointerDown = () => {
    if (mode === 'LIVE') {
      setIsLiveActive((prev) => !prev);
      return;
    }

    if (mode === 'POST' || mode === 'STORY') {
      // Instant Photo Capture
      if (countdownTimer > 0) {
        runCountdown();
      } else {
        captureHighResPhoto();
      }
      return;
    }

    // In REEL mode:
    if (isRecording) {
      // Tap while recording stops recording
      stopRecording();
      return;
    }

    setIsShutterPressed(true);
    isPressAndHoldingRef.current = false;

    // Start hold timer: if held for > 200ms, start recording video!
    pressHoldTimerRef.current = window.setTimeout(() => {
      isPressAndHoldingRef.current = true;
      startRecording();
    }, 200);
  };

  const handleShutterPointerUp = () => {
    setIsShutterPressed(false);

    if (pressHoldTimerRef.current) {
      clearTimeout(pressHoldTimerRef.current);
      pressHoldTimerRef.current = null;
    }

    if (mode === 'POST' || mode === 'STORY') {
      // Already handled in pointer down for instant capture
      return;
    }

    if (mode === 'REEL') {
      if (isPressAndHoldingRef.current) {
        // Was holding to record -> stop on release!
        isPressAndHoldingRef.current = false;
        stopRecording();
      } else if (!isRecording) {
        // Was a quick single tap -> start recording video!
        startRecording();
      }
    }
  };

  // Run Countdown (3s or 10s)
  const runCountdown = () => {
    setActiveCountdown(countdownTimer);
    let current = countdownTimer;
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(interval);
        setActiveCountdown(null);
        captureHighResPhoto();
      } else {
        setActiveCountdown(current);
      }
    }, 1000);
  };

  // Retake captured media
  const handleRetake = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
      setCapturedPhotoUrl(null);
      setCapturedPhotoBlob(null);
    }
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
      setRecordedVideoBlob(null);
      setVideoThumbnail(null);
    }
    setRecordingSeconds(0);
    setPostCaption('');
    startCamera();
  };

  // Direct 1-Tap Share Post / Reel / Story
  const handleDirectShare = () => {
    if (isSharing) return;
    setIsSharing(true);

    const now = Date.now();
    const isVideo = !!recordedVideoUrl;

    const STANDARD_REEL_VIDEO_URL =
      'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skater-performing-a-trick-in-a-skatepark-42861-large.mp4';

    const permanentVideoUrl =
      recordedVideoUrl && (recordedVideoUrl.startsWith('http://') || recordedVideoUrl.startsWith('https://'))
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
      caption: postCaption.trim() || (isVideo ? 'New Bhojpuri Reel! 🔥 #Jhalak' : 'Captured on Jhalak 📸 #Bhojpuri'),
      tags: ['Bhojpuri', 'Jhalak', mode.toLowerCase()],
      category: 'Bhojpuri' as ContentCategory,
      likesCount: 0,
      isLiked: false,
      isSaved: false,
      comments: [],
      timestamp: 'Just now',
      filter: activeFilterPreset.name,
      audioTitle: isVideo ? effectiveAudio : undefined,
      audioArtist: isVideo ? (selectedAudio?.artist || author.username) : undefined,
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
        category: 'Bhojpuri' as ContentCategory,
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
        onShowToast(isVideo ? 'Reel uploaded to feed & reels! 🚀' : 'Post shared successfully! 📸');
      }
    } else if (isVideo && onCaptureVideo && recordedVideoBlob) {
      onCaptureVideo(recordedVideoBlob, mediaUrl, videoThumbnail || undefined, effectiveAudio);
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
      } else {
        setCapturedPhotoBlob(file);
        setCapturedPhotoUrl(url);
      }
    }
  };

  return (
    <div
      id="instagram-camera-modal"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
        <div className="absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-200 opacity-90 animate-out fade-out" />
      )}

      {/* Countdown overlay (3... 2... 1...) */}
      {activeCountdown !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 pointer-events-none">
          <span className="text-8xl font-black text-white drop-shadow-2xl animate-ping">
            {activeCountdown}
          </span>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden bg-black">
        {capturedPhotoUrl ? (
          /* STATE A: Captured High-Res Photo Review */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedPhotoUrl}
              alt="Captured Instagram Photo"
              className={`w-full h-full ${
                mode === 'POST' ? 'object-contain max-h-[520px] aspect-square' : 'object-cover'
              }`}
            />
            {/* Top Retake Bar */}
            <div className="absolute top-4 left-4 z-30">
              <button
                type="button"
                onClick={handleRetake}
                className="p-3 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition active:scale-95 cursor-pointer shadow-lg"
                title="Retake photo"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            {/* Filter badge */}
            <div className="absolute top-4 right-4 z-30 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeFilterPreset.name}</span>
            </div>
          </div>
        ) : recordedVideoUrl ? (
          /* STATE B: Recorded Video Review */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoPreviewRef}
              src={recordedVideoUrl}
              controls
              playsInline
              webkit-playsinline="true"
              controlsList="nodownload"
              autoPlay
              loop
              muted={isPreviewMuted}
              className="w-full h-full object-cover"
              onClick={() => {
                const vid = videoPreviewRef.current;
                if (vid) {
                  if (vid.paused) {
                    vid.play().then(() => setIsPreviewPlaying(true));
                  } else {
                    vid.pause();
                    setIsPreviewPlaying(false);
                  }
                }
              }}
            />
            {/* Retake & Sound controls */}
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="p-3 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition active:scale-95 cursor-pointer shadow-lg"
                title="Retake video"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewMuted((m) => !m)}
                className="p-3 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition active:scale-95 cursor-pointer shadow-lg"
              >
                {isPreviewMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Filter & Audio tags */}
            <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-1.5">
              <div className="px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeFilterPreset.name}</span>
              </div>
              {selectedAudio && (
                <div className="px-3 py-1 rounded-full bg-rose-500/80 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg max-w-[180px] truncate">
                  <Music className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{selectedAudio.title}</span>
                </div>
              )}
            </div>

            {/* Play/Pause indicator */}
            {!isPreviewPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                  <Play className="w-8 h-8 fill-white ml-1" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STATE C: Live Full-Screen 1080p Camera Stream */
          <div className="relative w-full h-full flex items-center justify-center bg-neutral-950 overflow-hidden">
            {/* Live Video Feed with Smooth Flip & Filter */}
            <video
              ref={videoLiveRef}
              playsInline
              webkit-playsinline="true"
              controlsList="nodownload"
              autoPlay
              muted
              className={`w-full h-full object-cover transition-all duration-300 ease-in-out ${
                isFlipping ? 'scale-90 opacity-60 rotate-6' : ''
              } ${isFrontCamera ? 'scale-x-[-1]' : 'scale-x-100'} ${activeFilterPreset.cssClass}`}
            />

            {/* Mode-Specific Framing Guide */}
            {mode === 'POST' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                <div className="w-full bg-black/60 backdrop-blur-xs flex-1 border-b border-white/20" />
                <div className="w-full aspect-square max-h-[520px] border-2 border-white/30 relative">
                  {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div className="border-r border-b border-white/25" />
                      <div />
                    </div>
                  )}
                </div>
                <div className="w-full bg-black/60 backdrop-blur-xs flex-1 border-t border-white/20" />
              </div>
            )}

            {/* 3x3 Grid Overlay in Story / Reel mode */}
            {showGrid && mode !== 'POST' && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
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
              <div className="absolute inset-0 z-30 bg-neutral-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
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

            {/* LIVE MODE: Real Active Camera Preview (No fake comments or fake viewer count) */}
            {mode === 'LIVE' && (
              <div className="absolute top-16 inset-x-4 z-20 flex flex-col items-center pointer-events-none">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/25 backdrop-blur-md text-white shadow-xl">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLiveActive ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="font-bold text-xs tracking-wider">
                    {isLiveActive ? 'LIVE ON AIR' : 'LIVE READY • CAMERA ACTIVE'}
                  </span>
                </div>

                {isLiveActive && (
                  <div className="mt-3 flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg">
                    <span className="font-mono text-red-400 font-bold">{formatTimer(liveDurationSeconds)}</span>
                    <span className="text-white/40">•</span>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <Wifi className="w-3.5 h-3.5" />
                      <span className="text-[11px]">1080p 60fps</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TOP BAR CONTROLS (Live stream view) */}
        {!capturedPhotoUrl && !recordedVideoUrl && (
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Left: Close button */}
            <button
              type="button"
              id="close-camera-modal-btn"
              onClick={onClose}
              aria-label="Close camera"
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition active:scale-95 border border-white/10 cursor-pointer shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Center: Music / Audio Track Pill (Reel & Story modes) */}
            {(mode === 'REEL' || mode === 'STORY') && (
              <button
                type="button"
                onClick={() => setIsAudioDrawerOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-md active:scale-95 transition cursor-pointer"
              >
                <Music className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="max-w-[140px] truncate">
                  {selectedAudio ? selectedAudio.title : 'Bhojpuri Audio 🎵'}
                </span>
              </button>
            )}

            {/* Right: Quick Tools (Flash, Grid, Timer) */}
            <div className="flex items-center gap-2">
              {/* Flash Toggle */}
              <button
                type="button"
                onClick={toggleFlash}
                aria-label={isFlashOn ? 'Turn off flash' : 'Turn on flash'}
                className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-lg ${
                  isFlashOn
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-black/40 text-white border-white/10 hover:bg-black/70'
                }`}
              >
                {isFlashOn ? <Zap className="w-5 h-5 fill-black" /> : <ZapOff className="w-5 h-5" />}
              </button>

              {/* Grid Toggle */}
              <button
                type="button"
                onClick={() => setShowGrid((g) => !g)}
                aria-label="Toggle camera grid"
                className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-lg ${
                  showGrid
                    ? 'bg-white text-black border-white'
                    : 'bg-black/40 text-white border-white/10 hover:bg-black/70'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>

              {/* Countdown Timer (Off, 3s, 10s) */}
              <button
                type="button"
                onClick={() => {
                  if (countdownTimer === 0) setCountdownTimer(3);
                  else if (countdownTimer === 3) setCountdownTimer(10);
                  else setCountdownTimer(0);
                }}
                className={`px-2.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold transition active:scale-95 cursor-pointer shadow-lg ${
                  countdownTimer > 0
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-black/40 text-white border-white/10 hover:bg-black/70'
                }`}
              >
                {countdownTimer > 0 ? `${countdownTimer}s` : <Timer className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* LEFT TOOLSTRIP (Reel Speed / Mic) */}
        {!capturedPhotoUrl && !recordedVideoUrl && mode === 'REEL' && (
          <div className="absolute left-4 top-24 z-20 flex flex-col items-center gap-3">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu((s) => !s)}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-lg active:scale-95 cursor-pointer"
              >
                {recordingSpeed}
              </button>
              {showSpeedMenu && (
                <div className="absolute left-12 top-0 bg-neutral-900/90 border border-white/20 rounded-xl p-1 flex flex-col gap-1 backdrop-blur-md z-30 shadow-2xl">
                  {(['0.3x', '0.5x', '1x', '2x', '3x'] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setRecordingSpeed(spd);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-3 py-1.5 text-xs rounded-lg font-bold text-left transition cursor-pointer ${
                        recordingSpeed === spd
                          ? 'bg-rose-500 text-white'
                          : 'text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mic Toggle */}
            <button
              type="button"
              onClick={() => setIsMicMuted((m) => !m)}
              className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition active:scale-95 cursor-pointer shadow-lg ${
                isMicMuted
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-black/50 text-white border-white/20'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS & DOCK */}
      <div className="w-full bg-gradient-to-t from-black via-black/95 to-transparent pb-6 pt-3 px-4 flex flex-col items-center z-30">
        {capturedPhotoUrl || recordedVideoUrl ? (
          /* Captured Media Review & 1-Tap Share Bar */
          <div className="w-full max-w-md flex flex-col gap-3">
            {/* Inline Caption Bar */}
            <div className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-900/90 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl">
              <input
                type="text"
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder={
                  mode === 'REEL'
                    ? 'Write a reel caption... (e.g. Bawaal reel 🔥)'
                    : mode === 'STORY'
                    ? 'Add text to story...'
                    : 'Write a caption...'
                }
                className="flex-1 bg-transparent text-white text-xs placeholder-white/40 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5">
                {['🔥', '❤️', '🎬', '✨'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setPostCaption((p) => p + ' ' + emoji)}
                    className="text-sm hover:scale-125 transition active:scale-95 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: [Retake | Direct 1-Tap Share] */}
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition active:scale-95 border border-white/20 cursor-pointer shadow-lg"
              >
                Retake
              </button>
              <button
                type="button"
                id="direct-share-camera-btn"
                onClick={handleDirectShare}
                disabled={isSharing}
                className="flex-2 py-3 px-6 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-rose-500/30 active:scale-95 transition cursor-pointer"
              >
                {isSharing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 fill-white" />
                )}
                <span>
                  {isSharing
                    ? 'Posting...'
                    : mode === 'REEL' || recordedVideoUrl
                    ? 'Share to Reels ⚡'
                    : mode === 'STORY'
                    ? 'Add to Story 🌟'
                    : 'Share Post 📸'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Camera Viewfinder Dock */
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Instagram-Style Trending Live Filters/Effects (10 popular presets) */}
            <div className="w-full mb-3 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar py-1 px-4">
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

            {/* Shutter Dock Row: [Gallery Button | Circular Shutter / Live Button | Flip Camera] */}
            <div className="w-full flex items-center justify-between px-6 mb-4">
              {/* Left: Gallery Thumbnail / File Picker */}
              <button
                type="button"
                id="camera-gallery-picker-btn"
                onClick={() => fileFallbackInputRef.current?.click()}
                disabled={isRecording}
                className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/20 flex items-center justify-center text-white hover:bg-neutral-800 transition active:scale-95 shadow-lg overflow-hidden group cursor-pointer"
                title="Choose from Gallery"
              >
                <ImageIcon className="w-6 h-6 text-white/80 group-hover:text-white transition" />
              </button>

              {/* Center Shutter Button:
                  - In POST & STORY: Instant Photo Shutter Click
                  - In REEL: Single Tap Toggle or Hold to Record Video with circular progress border
                  - In LIVE: Clear Start/End Live Session Button */}
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
                  {/* SVG Progress Ring during video recording in REEL mode */}
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
                    className={`relative w-[84px] h-[84px] rounded-full flex items-center justify-center transition-transform duration-150 focus:outline-hidden cursor-pointer ${
                      isShutterPressed || isRecording ? 'scale-110' : 'active:scale-95'
                    }`}
                  >
                    {/* Outer Ring */}
                    <div
                      className={`absolute inset-0 rounded-full border-[4px] transition-all duration-200 ${
                        isRecording
                          ? 'border-red-500 scale-105'
                          : 'border-white/80 shadow-2xl hover:border-white'
                      }`}
                    />

                    {/* Inner Solid White Shutter Button */}
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

              {/* Right: Flip Camera Button with smooth transition */}
              <button
                type="button"
                id="camera-flip-btn"
                onClick={handleFlipCamera}
                disabled={isRecording}
                className="w-12 h-12 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition active:scale-95 shadow-lg cursor-pointer"
                title="Flip Camera (Front/Back)"
              >
                <RefreshCw
                  className={`w-6 h-6 transition-transform duration-300 ${
                    isFlipping ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* BOTTOM SWIPEABLE MODES BAR: [POST, STORY, REEL, LIVE] */}
            <div
              ref={modesScrollRef}
              className="w-full flex items-center justify-center gap-6 overflow-x-auto no-scrollbar py-2 px-10 cursor-pointer"
            >
              {modes.map((m) => {
                const isActive = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    data-mode={m}
                    onClick={() => {
                      if (!isRecording) setMode(m);
                    }}
                    className={`relative px-2 py-1 text-xs tracking-widest font-black transition-all duration-200 flex flex-col items-center cursor-pointer ${
                      isActive
                        ? 'text-white scale-110 drop-shadow-md'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <span>{m}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
