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
  Gauge,
  Wand2,
  Disc,
  Search,
} from 'lucide-react';
import { User } from '../types';
import {
  BHOJPURI_MUSIC_LIBRARY,
  BhojpuriTrack,
  playSyntheticTrackPreview,
} from '../data/bhojpuriMusic';
import { ReelsAudioSelector } from './ReelsAudioSelector';

interface ReelsCameraProps {
  onCaptureVideo: (
    videoBlob: Blob,
    videoUrl: string,
    thumbnail?: string,
    audioTitle?: string
  ) => void;
  onClose: () => void;
  currentUser?: User;
}

export type FilterId = 'normal' | 'warm' | 'glow' | 'vintage' | 'bw';

interface FilterPreset {
  id: FilterId;
  name: string;
  cssClass: string;
  canvasFilter: string;
  bubbleClass: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    cssClass: '',
    canvasFilter: 'none',
    bubbleClass: 'bg-neutral-800/90 border border-white/30',
  },
  {
    id: 'warm',
    name: 'Warm',
    cssClass: 'sepia-[0.32] saturate-[1.35] brightness-[1.04] contrast-[1.05]',
    canvasFilter: 'sepia(0.32) saturate(1.35) brightness(1.04) contrast(1.05)',
    bubbleClass: 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400',
  },
  {
    id: 'glow',
    name: 'Glow',
    cssClass: 'brightness-[1.12] contrast-[1.06] saturate-[1.18]',
    canvasFilter: 'brightness(1.12) contrast(1.06) saturate(1.18)',
    bubbleClass: 'bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    cssClass: 'contrast-[1.18] saturate-[0.82] sepia-[0.22] brightness-[0.96]',
    canvasFilter: 'contrast(1.18) saturate(0.82) sepia(0.22) brightness(0.96)',
    bubbleClass: 'bg-gradient-to-tr from-amber-950 via-stone-700 to-amber-600',
  },
  {
    id: 'bw',
    name: 'B&W',
    cssClass: 'grayscale contrast-[1.3] brightness-[0.96]',
    canvasFilter: 'grayscale(1) contrast(1.3) brightness(0.96)',
    bubbleClass: 'bg-gradient-to-tr from-black via-neutral-600 to-neutral-200',
  },
];

export type AudioTrack = BhojpuriTrack;

export const ReelsCamera: React.FC<ReelsCameraProps> = ({
  onCaptureVideo,
  onClose,
  currentUser,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  // Instagram Camera Features
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('normal');
  const [recordingSpeed, setRecordingSpeed] = useState<'0.3x' | '0.5x' | '1x' | '2x' | '3x'>('1x');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [maxRecordingSeconds, setMaxRecordingSeconds] = useState<15 | 30 | 60>(30);
  const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [selectedAudioCategory, setSelectedAudioCategory] = useState<
    'All' | 'Pawan Singh' | 'Khesari Lal' | 'Shilpi Raj' | 'Folk & Dholak' | 'Trending'
  >('All');

  // Zoom / FOV state (1x standard vs 0.6x wide sensor coverage)
  const [isWideAngle, setIsWideAngle] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedThumbnail, setRecordedThumbnail] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);

  // Refs
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileFallbackInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioPlayerRef = useRef<{ stop: () => void } | null>(null);

  const activeFilterPreset =
    FILTER_PRESETS.find((f) => f.id === selectedFilter) || FILTER_PRESETS[0];

  // Stop track preview helper
  const stopTrackPreview = useCallback(() => {
    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.stop();
      activeAudioPlayerRef.current = null;
    }
    setPreviewingTrackId(null);
  }, []);

  // Filter Bhojpuri tracks by search query and category
  const filteredAudioTracks = useMemo(() => {
    return BHOJPURI_MUSIC_LIBRARY.filter((track) => {
      const q = audioSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        track.category.toLowerCase().includes(q) ||
        track.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesCat =
        selectedAudioCategory === 'All' || track.category === selectedAudioCategory;

      return matchesSearch && matchesCat;
    });
  }, [audioSearchQuery, selectedAudioCategory]);

  // Play synthetic pleasant audio snippet for track preview
  const playTrackPreview = (track: BhojpuriTrack) => {
    try {
      if (previewingTrackId === track.id) {
        stopTrackPreview();
        return;
      }
      stopTrackPreview();
      setPreviewingTrackId(track.id);

      const player = playSyntheticTrackPreview(track, () => {
        setPreviewingTrackId(null);
      });
      activeAudioPlayerRef.current = player;
    } catch {
      setPreviewingTrackId(null);
    }
  };

  // Initialize Camera with Full Sensor Resolution (prevents over-zoom crop)
  const startCamera = useCallback(async () => {
    setCameraError(null);

    // Stop existing stream tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera recording is not supported in this browser environment.');
      }

      // Priority 1: Request maximum native sensor coverage (ideal 1920x1080)
      // Requesting full wide coverage allows the camera to deliver its widest native field-of-view
      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isFrontCamera ? 'user' : 'environment',
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
          },
          audio: !isMicMuted,
        });
      } catch {
        try {
          // Priority 2: Standard 720p resolution
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: isFrontCamera ? 'user' : 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: !isMicMuted,
          });
        } catch {
          // Priority 3: Video-only basic fallback
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: isFrontCamera ? 'user' : 'environment',
            },
            audio: false,
          });
        }
      }

      if (!mediaStream) {
        throw new Error('Failed to access camera.');
      }

      setStream(mediaStream);
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = mediaStream;
        videoLiveRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      console.warn('Reels Camera access failed:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Unable to access camera. Check device permissions or try uploading a video.';
      setCameraError(errorMsg);
    }
  }, [isFrontCamera, isMicMuted]);

  useEffect(() => {
    startCamera();
    return () => {
      stopTrackPreview();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (recordedVideoUrl && recordedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [startCamera, stopTrackPreview, stream, recordedVideoUrl]);

  // Handle audio mute toggle
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicMuted;
      });
    }
  }, [isMicMuted, stream]);

  // Capture video thumbnail from canvas matching active filter and headroom positioning
  const captureThumbnailFromStream = (): string | null => {
    try {
      const vid = videoLiveRef.current;
      if (vid && vid.videoWidth && vid.videoHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const vWidth = vid.videoWidth;
          const vHeight = vid.videoHeight;
          const targetRatio = 9 / 16;
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
            // Align crop with natural headroom (26% from top)
            sy = Math.max(0, (vHeight - sHeight) * 0.26);
          }

          if (isFrontCamera) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }

          // Apply selected filter to thumbnail
          ctx.filter = activeFilterPreset.canvasFilter;

          ctx.drawImage(vid, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.85);
        }
      }
    } catch (e) {
      console.warn('Failed to capture stream thumbnail:', e);
    }
    return null;
  };

  // Start Recording
  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    try {
      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: selectedMime || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        const thumb = captureThumbnailFromStream();

        setRecordedBlob(blob);
        setRecordedVideoUrl(url);
        setRecordedThumbnail(thumb);
        setIsPreviewPlaying(true);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Start timer with configured max duration
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
      setCameraError('Recording failed to initialize. Try choosing a video file instead.');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Retake video
  const handleRetake = () => {
    if (recordedVideoUrl && recordedVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedBlob(null);
    setRecordedVideoUrl(null);
    setRecordedThumbnail(null);
    setRecordingSeconds(0);
    startCamera();
  };

  // Confirm and directly add recorded video
  const handleConfirmVideo = () => {
    if (recordedBlob && recordedVideoUrl) {
      onCaptureVideo(
        recordedBlob,
        recordedVideoUrl,
        recordedThumbnail || undefined,
        selectedAudio ? selectedAudio.title : undefined
      );
    }
  };

  // Fallback demo video creator
  const handleGenerateDemoReel = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const thumb = canvas.toDataURL('image/jpeg', 0.8);
      setRecordedBlob(blob);
      setRecordedVideoUrl(url);
      setRecordedThumbnail(thumb);
      setIsPreviewPlaying(true);
    };

    let frame = 0;
    const draw = () => {
      frame++;
      const gradient = ctx.createLinearGradient(0, 0, 720, 1280);
      gradient.addColorStop(0, '#f43f5e');
      gradient.addColorStop(0.5, '#ec4899');
      gradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 720, 1280);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ Sample Reel Created', 360, 600);

      ctx.font = '24px sans-serif';
      ctx.fillText(
        currentUser?.username ? `@${currentUser.username}` : 'Instagram Reels',
        360,
        660
      );

      if (frame < 90) {
        requestAnimationFrame(draw);
      }
    };

    draw();
    recorder.start();
    setTimeout(() => {
      recorder.stop();
    }, 3000);
  };

  // Fallback file input upload directly
  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      onCaptureVideo(file, url, undefined, selectedAudio?.title);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="reels-camera-modal"
      className="fixed inset-0 z-[60] w-screen h-screen bg-black overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* ============ Video Layer (Absolute Full Screen with Natural Headroom Center-Fit) ============ */}
      {recordedVideoUrl ? (
        /* State A: Recording Review / Preview */
        <div className="absolute inset-0 w-screen h-screen bg-black overflow-hidden">
          <video
            ref={videoPreviewRef}
            src={recordedVideoUrl}
            autoPlay
            loop
            playsInline
            className={`absolute inset-0 w-screen h-screen object-cover object-[center_28%] ${activeFilterPreset.cssClass}`}
            onPlay={() => setIsPreviewPlaying(true)}
            onPause={() => setIsPreviewPlaying(false)}
          />

          {/* Play/Pause Overlay button on tap */}
          <button
            type="button"
            onClick={() => {
              if (videoPreviewRef.current) {
                if (isPreviewPlaying) {
                  videoPreviewRef.current.pause();
                } else {
                  videoPreviewRef.current.play();
                }
              }
            }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 hover:bg-black/20 transition cursor-pointer"
            aria-label={isPreviewPlaying ? 'Pause review' : 'Play review'}
          >
            {!isPreviewPlaying && (
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
                <Play className="w-8 h-8 fill-white translate-x-0.5" />
              </div>
            )}
          </button>

          {/* Top recorded badge indicator */}
          <div className="absolute top-16 left-5 z-20 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
            <Check className="w-3.5 h-3.5" />
            <span>Reel Video Captured ({activeFilterPreset.name})</span>
          </div>
        </div>
      ) : (
        /* State B: Live Camera Feed (Absolute Full Screen with Balanced Headroom) */
        <div className="absolute inset-0 w-screen h-screen bg-black overflow-hidden">
          <video
            ref={videoLiveRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-screen h-screen object-cover ${
              isWideAngle ? 'object-[center_22%] scale-95' : 'object-[center_28%]'
            } transition-all duration-300 ${
              isFrontCamera ? 'scale-x-[-1]' : ''
            } ${activeFilterPreset.cssClass}`}
          />

          {/* 3x3 Composition Grid for Framing */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="" />
            </div>
          )}

          {/* Recording Pulse Frame */}
          {isRecording && (
            <div className="absolute inset-0 pointer-events-none border-4 border-rose-500 animate-pulse z-10" />
          )}

          {/* Fallback View if Camera Permission Denied or Not Available */}
          {cameraError && (
            <div className="absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-white mb-1">Camera Access Required</h3>
              <p className="text-xs text-neutral-400 max-w-xs mb-4">{cameraError}</p>

              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Video from Device</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateDemoReel}
                  className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Simulate 3s Sample Reel Clip</span>
                </button>
              </div>
              <input
                ref={fileFallbackInputRef}
                type="file"
                accept="video/*"
                onChange={handleFallbackFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* ============ Top Progress Bar (Instagram Reels recording line) ============ */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-white/20 z-30 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
          style={{ width: `${(recordingSeconds / maxRecordingSeconds) * 100}%` }}
        />
      </div>

      {/* ============ Top Toolbar (Floating on top of full-screen video) ============ */}
      <div className="absolute top-0 inset-x-0 pt-3.5 pb-8 px-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-auto">
        {/* Close Button */}
        <button
          type="button"
          id="close-reels-camera-btn"
          onClick={onClose}
          aria-label="Close Camera"
          className="p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 active:scale-95 transition text-white cursor-pointer shadow-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Selected Audio Badge or Timer Badge */}
        <div className="flex flex-col items-center gap-1">
          {selectedAudio && (
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs text-white shadow-md animate-in fade-in">
              <Disc
                className="w-3.5 h-3.5 text-rose-400 animate-spin"
                style={{ animationDuration: '4s' }}
              />
              <span className="font-semibold max-w-[150px] truncate">{selectedAudio.title}</span>
              <button
                type="button"
                onClick={() => setSelectedAudio(null)}
                className="text-white/60 hover:text-white p-0.5 ml-0.5 cursor-pointer"
                title="Remove audio"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Recording Timer Badge */}
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-md">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording ? 'bg-rose-500 animate-ping' : 'bg-white/60'
              }`}
            />
            <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-white">
              {formatTimer(recordingSeconds)} / {formatTimer(maxRecordingSeconds)}
            </span>
          </div>
        </div>

        {/* Top Right Floating Controls (Grid & Wide Angle FOV) */}
        <div className="flex items-center gap-2">
          {!recordedVideoUrl && (
            <>
              {/* Wide FOV toggle for headroom fine-tuning */}
              <button
                type="button"
                id="toggle-camera-fov-btn"
                onClick={() => setIsWideAngle((w) => !w)}
                className={`px-2 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold border transition active:scale-95 cursor-pointer shadow-md ${
                  isWideAngle
                    ? 'bg-rose-500/80 border-rose-400 text-white'
                    : 'bg-black/40 border-white/15 text-white/80 hover:bg-black/60'
                }`}
                title="Toggle 0.6x Wide FOV Headroom"
              >
                {isWideAngle ? '0.6x' : '1x'}
              </button>

              {/* Grid Toggle */}
              <button
                type="button"
                id="toggle-camera-grid-btn"
                onClick={() => setShowGrid((g) => !g)}
                className={`p-2 rounded-full backdrop-blur-md text-white border transition active:scale-95 cursor-pointer shadow-md ${
                  showGrid
                    ? 'bg-amber-500/80 border-amber-400 text-white'
                    : 'bg-black/40 border-white/15 hover:bg-black/60'
                }`}
                title="Toggle Rule-of-Thirds Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============ Instagram-style Left Side Tool Icons (Floating Dock) ============ */}
      {!recordedVideoUrl && (
        <div className="absolute left-3.5 top-20 z-30 flex flex-col items-center gap-3.5 text-white pointer-events-auto">
          {/* Tool 1: Music / Add Audio */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="reels-tool-music-btn"
              onClick={() => setIsAudioDrawerOpen(true)}
              className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-lg ${
                selectedAudio
                  ? 'bg-rose-500 border-rose-400 text-white'
                  : 'bg-black/50 border-white/20 hover:bg-black/70 text-white'
              }`}
              title="Add Audio Track"
            >
              <Music className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-medium mt-1 text-white/80 drop-shadow-md">Audio</span>
          </div>

          {/* Tool 2: Recording Speed */}
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              id="reels-tool-speed-btn"
              onClick={() => setShowSpeedMenu((s) => !s)}
              className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-lg ${
                recordingSpeed !== '1x'
                  ? 'bg-amber-500 border-amber-400 text-white'
                  : 'bg-black/50 border-white/20 hover:bg-black/70 text-white'
              }`}
              title={`Recording Speed: ${recordingSpeed}`}
            >
              <Gauge className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold mt-1 text-white drop-shadow-md">
              {recordingSpeed}
            </span>

            {/* Speed selection flyout pills */}
            {showSpeedMenu && (
              <div className="absolute left-12 top-0 bg-black/85 backdrop-blur-md rounded-2xl p-1.5 flex flex-col gap-1 border border-white/20 shadow-xl z-40 animate-in fade-in slide-in-from-left-2">
                {(['0.3x', '0.5x', '1x', '2x', '3x'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setRecordingSpeed(spd);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      recordingSpeed === spd
                        ? 'bg-amber-500 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tool 3: Effects / Filters */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="reels-tool-effects-btn"
              onClick={() => {
                // Cycle to next filter preset on tap
                const filterIds = FILTER_PRESETS.map((f) => f.id);
                const nextIdx = (filterIds.indexOf(selectedFilter) + 1) % filterIds.length;
                setSelectedFilter(filterIds[nextIdx]);
              }}
              className={`p-2.5 rounded-full backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-lg ${
                selectedFilter !== 'normal'
                  ? 'bg-rose-500 border-rose-400 text-white'
                  : 'bg-black/50 border-white/20 hover:bg-black/70 text-white'
              }`}
              title={`Active Effect: ${activeFilterPreset.name}`}
            >
              <Wand2 className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-medium mt-1 text-white/80 drop-shadow-md">Effects</span>
          </div>

          {/* Tool 4: Timer (15s / 30s / 60s) */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              id="reels-tool-timer-btn"
              onClick={() => {
                setMaxRecordingSeconds((prev) => {
                  if (prev === 15) return 30;
                  if (prev === 30) return 60;
                  return 15;
                });
              }}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/70 transition active:scale-95 cursor-pointer shadow-lg text-white"
              title={`Max Duration: ${maxRecordingSeconds}s (tap to toggle)`}
            >
              <Timer className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold mt-1 text-white drop-shadow-md">
              {maxRecordingSeconds}s
            </span>
          </div>
        </div>
      )}

      {/* ============ Instagram Audio Picker Drawer with Bhojpuri Superhits ============ */}
      {isAudioDrawerOpen && (
        <ReelsAudioSelector
          isOpen={isAudioDrawerOpen}
          onClose={() => {
            stopTrackPreview();
            setIsAudioDrawerOpen(false);
          }}
          selectedTrackId={selectedAudio?.id}
          currentTrackTitle={selectedAudio?.title}
          onSelectTrack={(track) => {
            stopTrackPreview();
            setSelectedAudio(track);
            setIsAudioDrawerOpen(false);
          }}
        />
      )}

      {/* ============ Bottom Controls & Filter Carousel ============ */}
      <div className="absolute bottom-0 inset-x-0 pb-7 pt-12 px-4 flex flex-col items-center justify-center text-white z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto">
        {recordedVideoUrl ? (
          /* Review State: Retake vs Add Reel Directly */
          <div className="w-full max-w-md flex items-center justify-between gap-4">
            <button
              type="button"
              id="retake-video-btn"
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-white/15 backdrop-blur-md active:scale-95 transition cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake</span>
            </button>

            <button
              type="button"
              id="use-recorded-video-btn"
              onClick={handleConfirmVideo}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-500/25 active:scale-95 transition cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>Add Reel Directly</span>
            </button>
          </div>
        ) : (
          /* Live Recording State: Filter Carousel + Shutter Ring Dock */
          <div className="w-full max-w-md flex flex-col items-center">
            {/* Requirement 3: Horizontal Filter Carousel Bubbles (Normal, Warm, Glow, Vintage, B&W) */}
            <div className="w-full mb-3 flex flex-col items-center">
              <div className="flex items-center justify-center gap-3.5 sm:gap-5 px-2 py-1 overflow-x-auto no-scrollbar max-w-full">
                {FILTER_PRESETS.map((filter) => {
                  const isSelected = selectedFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      id={`filter-bubble-${filter.id}`}
                      onClick={() => setSelectedFilter(filter.id)}
                      className="flex flex-col items-center gap-1 transition-all duration-200 cursor-pointer group focus:outline-hidden"
                      aria-label={`Select ${filter.name} filter`}
                    >
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                          isSelected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                            : 'opacity-65 hover:opacity-90 hover:scale-105'
                        } ${filter.bubbleClass}`}
                      >
                        {isSelected && <Sparkles className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                      </div>
                      <span
                        className={`text-[10px] font-semibold tracking-wide transition-colors drop-shadow-sm ${
                          isSelected
                            ? 'text-white font-bold'
                            : 'text-white/60 group-hover:text-white/80'
                        }`}
                      >
                        {filter.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Shutter & Controls Row */}
            <div className="w-full flex items-center justify-between px-3">
              {/* Left Control: Flip Camera */}
              <button
                type="button"
                id="flip-camera-btn"
                onClick={() => setIsFrontCamera((f) => !f)}
                disabled={isRecording}
                aria-label="Flip Camera"
                className={`p-3.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 hover:bg-black/70 active:scale-95 transition text-white shadow-lg ${
                  isRecording ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Flip Front/Back Camera"
              >
                <RefreshCw className="w-6 h-6" />
              </button>

              {/* Center Control: Record Shutter Button */}
              <div className="relative flex items-center justify-center">
                <button
                  type="button"
                  id="reels-shutter-record-btn"
                  onClick={isRecording ? stopRecording : startRecording}
                  aria-label={isRecording ? 'Stop recording reel' : 'Start recording reel'}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center p-1.5 focus:outline-hidden active:scale-95 transition cursor-pointer"
                >
                  {/* Outer ring */}
                  <div
                    className={`absolute inset-0 rounded-full border-4 transition-colors duration-300 ${
                      isRecording
                        ? 'border-rose-500 scale-110 animate-pulse'
                        : 'border-white hover:border-rose-400 shadow-xl'
                    }`}
                  />
                  {/* Inner shutter */}
                  <div
                    className={`transition-all duration-300 ${
                      isRecording
                        ? 'w-7 h-7 bg-rose-500 rounded-md'
                        : 'w-14 h-14 bg-rose-600 rounded-full hover:bg-rose-500'
                    }`}
                  />
                </button>
              </div>

              {/* Right Control: Mic Mute */}
              <button
                type="button"
                id="toggle-mic-btn"
                onClick={() => setIsMicMuted((m) => !m)}
                aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`p-3.5 rounded-full backdrop-blur-md border transition active:scale-95 cursor-pointer shadow-lg ${
                  isMicMuted
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
                }`}
                title={isMicMuted ? 'Microphone Muted' : 'Microphone Active'}
              >
                {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
