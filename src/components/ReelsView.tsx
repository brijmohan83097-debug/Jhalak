import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Music,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  BadgeCheck,
  Phone,
  EyeOff,
  Sparkles,
  HelpCircle,
  Check,
  X,
  Download,
  Flag,
  Ban,
  Gift,
  ShoppingBag,
  Clapperboard,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Reel, User } from '../types';
import { SupportedLanguage, translations } from '../translations';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { AudioDetailSheet } from './AudioDetailSheet';
import { WatermarkDownloadModal } from './WatermarkDownloadModal';
import { ReportModal } from './ReportModal';
import { UpiShagunSheet } from './UpiShagunSheet';
import { ProductWhatsAppModal } from './ProductWhatsAppModal';
import { recommendationEngine, inferLanguage, inferCategory, isNewlyCreated } from '../services/recommendationEngine';
import { moderationService } from '../services/moderationService';
import { adMobService, AdMobNativeAd } from '../services/adMobService';
import { isSuperAdmin } from '../constants/admin';
import { AdMobNativeReelAd } from './AdMobNativeReelAd';
import { safeEncodeURIComponent } from '../utils/safeEncoding';
import { pauseAllMedia } from '../utils/mediaCoordinator';

interface ReelsViewProps {
  reels: Reel[];
  currentUser: User;
  isActive?: boolean;
  onToggleLike: (reelId: string) => void;
  onToggleSave: (reelId: string) => void;
  onAddComment: (reelId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'gif') => void;
  onShare: (reel: Reel) => void;
  onViewUser: (username: string) => void;
  onUseAudio?: (audioTitle: string, audioArtist?: string) => void;
  onReportReel?: (reel: Reel, reason: string) => void;
  onBlockUser?: (username: string) => void;
  onDeleteReel?: (reelId: string) => void;
  onUploadReel?: () => void;
  onRequireAuth?: (action: 'like' | 'comment' | 'upload' | 'profile') => void;
  onRefreshReels?: () => Promise<void> | void;
  isRefreshing?: boolean;
  currentLanguage?: SupportedLanguage;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  reels: initialReels,
  currentUser,
  isActive = true,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onShare,
  onViewUser,
  onUseAudio,
  onReportReel,
  onBlockUser,
  onDeleteReel,
  onUploadReel,
  onRequireAuth,
  onRefreshReels,
  isRefreshing = false,
  currentLanguage = 'en',
}) => {
  const [queue, setQueue] = useState<(Reel | AdMobNativeAd)[]>(() => {
    const unblocked = initialReels.filter(
      (r) => !moderationService.isUserBlocked(r.username) && !moderationService.isItemReported(r.id)
    );
    const recQueue = recommendationEngine.getPersonalizedReelsQueue(unblocked, 0);
    return recQueue;
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showAudioDetailSheet, setShowAudioDetailSheet] = useState(false);
  const [showWatermarkDownload, setShowWatermarkDownload] = useState(false);
  const [showShagunSheet, setShowShagunSheet] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [reportModalTarget, setReportModalTarget] = useState<{
    id: string;
    type: 'post' | 'reel';
    username: string;
    caption?: string;
    mode?: 'report' | 'block';
  } | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);

  const t = translations[currentLanguage];

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapTimeRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchedReelsRef = useRef<Record<string, boolean>>({});
  const lastWatchTickRef = useRef<number>(Date.now());

  // Re-synchronize queue if upstream initialReels length or content changes significantly
  useEffect(() => {
    const firstReel = initialReels[0];
    if (firstReel && isNewlyCreated(firstReel)) {
      setActiveIndex(0);
    }
    setQueue(() => {
      const recQueue = recommendationEngine.getPersonalizedReelsQueue(initialReels, 0);
      return recQueue;
    });
  }, [initialReels]);

  const currentItem = queue[activeIndex] || queue[0] || initialReels[0];
  const isAdCurrent = adMobService.isAdItem(currentItem);
  const currentReel = isAdCurrent ? null : (currentItem as Reel);

  const isOwner = Boolean(
    currentReel && (
      isSuperAdmin(currentUser) ||
      (currentUser?.id && currentReel?.userId && currentUser.id === currentReel.userId) ||
      (currentUser?.username && currentReel?.username && (
        currentUser.username.toLowerCase().replace(/^@/, '').trim() ===
        currentReel.username.toLowerCase().replace(/^@/, '').trim()
      ))
    )
  );

  const handleDeleteCurrentReel = () => {
    if (!currentReel) return;
    const reelToDelete = currentReel;
    setShowOptionsMenu(false);

    if (videoRefs.current[activeIndex]) {
      videoRefs.current[activeIndex]?.pause();
    }

    moderationService.deletePostPermanently(reelToDelete.id);

    setQueue((prev) => {
      const next = prev.filter((r) => r.id !== reelToDelete.id);
      if (activeIndex >= next.length && next.length > 0) {
        setActiveIndex(Math.max(0, next.length - 1));
      }
      return next;
    });

    showToast('Reel permanently deleted. 🗑️');

    if (onDeleteReel) {
      onDeleteReel(reelToDelete.id);
    }
  };

  const reorderUpcomingQueue = useCallback(() => {
    setQueue((prevQueue) => {
      const remainingReels = prevQueue
        .slice(activeIndex + 1)
        .filter((item): item is Reel => !adMobService.isAdItem(item));
      const unblocked = remainingReels.filter(
        (r) => !moderationService.isUserBlocked(r.username) && !moderationService.isItemReported(r.id)
      );
      const reordered = recommendationEngine.getPersonalizedReelsQueue(unblocked, 0);
      const head = prevQueue.slice(0, activeIndex + 1);
      return [...head, ...reordered];
    });
  }, [activeIndex]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Stop all media when unmounting or when external pause event is received
  useEffect(() => {
    const handlePauseAll = () => {
      videoRefs.current.forEach((video) => {
        if (video) {
          try {
            video.pause();
          } catch {}
        }
      });
      setIsPlaying(false);
    };

    window.addEventListener('app:pause-all-media', handlePauseAll);
    const handleVisibility = () => {
      if (document.hidden) handlePauseAll();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('app:pause-all-media', handlePauseAll);
      document.removeEventListener('visibilitychange', handleVisibility);
      handlePauseAll();
    };
  }, []);

  // Toggle sound and immediately ensure video playback without getting stuck
  const toggleSoundAndPlay = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.defaultMuted = false;
      currentVideo.muted = nextMuted;
      currentVideo.volume = 1.0;

      const playPromise = currentVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback error on sound toggle, falling back to muted play:', err);
            // If browser blocks unmuted playback, fallback to muted play so video plays immediately
            if (!nextMuted) {
              currentVideo.muted = true;
              currentVideo.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          });
      }
    }
  }, [activeIndex, isMuted]);

  // Pause non-active videos and play the active one with unmuted sound by default
  useEffect(() => {
    if (!isActive) {
      videoRefs.current.forEach((video) => {
        if (video) {
          try {
            video.pause();
          } catch {}
        }
      });
      setIsPlaying(false);
      return;
    }

    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === activeIndex) {
        video.currentTime = 0;
        video.defaultMuted = false;
        video.muted = isMuted;
        video.volume = 1.0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // If unmuted autoplay without prior interaction is restricted by browser, fallback to muted autoplay
              video.muted = true;
              setIsMuted(true);
              video
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            });
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
    setProgress(0);
    setExpandedCaption(false);
  }, [activeIndex, queue, isActive]);

  // Sync mute across videos without restarting playback
  useEffect(() => {
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.muted = isMuted;
      if (currentVideo.paused && isActive) {
        currentVideo.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [isMuted, activeIndex, isActive]);

  // Handle Video Time Update for progress bar & continuous watch tracking
  const handleTimeUpdate = (index: number) => {
    if (index !== activeIndex) return;
    const video = videoRefs.current[index];
    if (video && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(pct);

      // Record continuous watch time every 2 seconds
      const now = Date.now();
      const deltaSec = (now - lastWatchTickRef.current) / 1000;
      if (deltaSec >= 2 && currentReel) {
        recommendationEngine.recordWatchTime(currentReel, deltaSec);
        lastWatchTickRef.current = now;
      }

      // If user watches > 50% of the Reel, record a completed watch and prioritize similar genre videos
      if (pct > 50 && currentReel && !watchedReelsRef.current[currentReel.id]) {
        watchedReelsRef.current[currentReel.id] = true;
        const cat = inferCategory(currentReel);
        recommendationEngine.recordInteraction(cat, 'watch_complete', currentReel.id);
        recommendationEngine.recordLanguageInteraction(inferLanguage(currentReel), 'like');
        // Prioritize similar genre content in upcoming queue
        reorderUpcomingQueue();
      }
    }
  };

  const handleLikeReel = () => {
    if (!currentReel) return;
    onToggleLike(currentReel.id);
    const cat = inferCategory(currentReel);
    recommendationEngine.recordLanguageInteraction(inferLanguage(currentReel), 'like');
    recommendationEngine.recordInteraction(cat, 'like', currentReel.id);
    // Prioritize similar genre content in upcoming queue
    reorderUpcomingQueue();
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_GAP = 220;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_GAP) {
      // Double tap triggered -> cancel pending single tap & heart like reel
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;

      if (currentReel) {
        if (!currentReel.isLiked) {
          handleLikeReel();
        }
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      return;
    }

    lastTapTimeRef.current = now;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    // Single screen tap cleanly toggles mute/unmute and immediately ensures video playback
    tapTimeoutRef.current = setTimeout(() => {
      toggleSoundAndPlay();
      tapTimeoutRef.current = null;
    }, DOUBLE_TAP_GAP);
  };

  const toggleFollow = (username: string) => {
    setFollowedMap((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const goToNext = () => {
    if (activeIndex < queue.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  // 3-dot Menu: Not Interested Action
  const handleNotInterested = () => {
    if (!currentReel) return;
    const cat = currentReel.category || inferCategory(currentReel);
    recommendationEngine.markNotInterested(currentReel.id, cat);
    setShowOptionsMenu(false);
    showToast(`${t.notInterested} (${t.tunedFeedToast})`);

    // Remove from active queue and advance smoothly
    setQueue((prev) => prev.filter((r) => r.id !== currentReel.id));
  };

  // 3-dot Menu: Show More Like This Action
  const handleShowMore = () => {
    if (!currentReel) return;
    const cat = currentReel.category || inferCategory(currentReel);
    recommendationEngine.markShowMore(cat);
    setShowOptionsMenu(false);
    showToast(`${t.showMoreLikeThis}: ${cat} ✨`);
    reorderUpcomingQueue();
  };

  // 3-dot Menu: Report Reel Action
  const handleReportCurrentReel = () => {
    if (!currentReel) return;
    const reelToReport = currentReel;
    setShowOptionsMenu(false);

    if (videoRefs.current[activeIndex]) {
      videoRefs.current[activeIndex]?.pause();
    }

    moderationService.reportItem({
      id: reelToReport.id,
      type: 'reel',
      username: reelToReport.username,
      reason: 'Inappropriate content',
    });

    setQueue((prev) => {
      const next = prev.filter((r) => r.id !== reelToReport.id);
      if (activeIndex >= next.length && next.length > 0) {
        setActiveIndex(Math.max(0, next.length - 1));
      }
      return next;
    });

    showToast('Reel reported and hidden from your feed 🛡️');

    if (onReportReel) {
      onReportReel(reelToReport, 'Inappropriate content');
    }
  };

  // 3-dot Menu: Block Creator Action
  const handleBlockCurrentUser = () => {
    if (!currentReel) return;
    const rawUsername = currentReel.username;
    const clean = rawUsername.toLowerCase().replace(/^@/, '').trim();
    setShowOptionsMenu(false);

    if (videoRefs.current[activeIndex]) {
      videoRefs.current[activeIndex]?.pause();
    }

    moderationService.blockUser(clean);

    setQueue((prev) => {
      const next = prev.filter((r) => {
        if (adMobService.isAdItem(r)) return true;
        return r.username.toLowerCase() !== clean;
      });
      if (activeIndex >= next.length && next.length > 0) {
        setActiveIndex(Math.max(0, next.length - 1));
      }
      return next;
    });

    showToast(`Blocked @${clean}. Their reels have been hidden 🚫`);

    if (onBlockUser) {
      onBlockUser(rawUsername);
    }
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        goToNext();
      } else if (e.key === 'ArrowUp') {
        goToPrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, queue.length]);

  // Continuous smooth touch swipe, mouse wheel, and pull-to-refresh handling
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isWheelScrolling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY.current;
      const deltaX = currentX - touchStartX.current;

      // When at the very first reel (activeIndex === 0) and swiping downward, track pull progress
      if (activeIndex === 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) && !isPullRefreshing && !isRefreshing) {
        setPullProgress(Math.min(deltaY / 80, 1));
      } else if (pullProgress > 0) {
        setPullProgress(0);
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;

      // 1. Pull down to refresh on the first reel
      if (activeIndex === 0 && deltaY > 55 && Math.abs(deltaY) > Math.abs(deltaX) && !isPullRefreshing && !isRefreshing) {
        setPullProgress(1);
        setIsPullRefreshing(true);
        try {
          if (onRefreshReels) {
            await onRefreshReels();
          }
        } finally {
          setTimeout(() => {
            setIsPullRefreshing(false);
            setPullProgress(0);
          }, 600);
        }
        return;
      }

      setPullProgress(0);

      // 2. Vertical swipe navigation between reels
      if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isWheelScrolling.current) return;
    if (Math.abs(e.deltaY) > 30) {
      isWheelScrolling.current = true;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setTimeout(() => {
        isWheelScrolling.current = false;
      }, 400);
    }
  };

  if (initialReels.length === 0 || !currentItem || queue.length === 0) {
    return (
      <div
        id="reels-empty-view"
        className="relative w-full h-[calc(100vh-4rem)] md:h-screen flex items-center justify-center bg-black text-white p-6 select-none"
      >
        <div className="flex flex-col items-center justify-center text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5 text-neutral-400">
            <Clapperboard className="w-10 h-10 text-neutral-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 leading-snug">
            Abhi koi reel nahi hai. Pehli reel post karein!
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            Database me abhi koi video nahi hai. Apni pehli reel upload karein aur community ke saath juden!
          </p>
          {onUploadReel && (
            <button
              id="reels-empty-upload-btn"
              onClick={() => {
                pauseAllMedia();
                onUploadReel();
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition cursor-pointer"
            >
              Upload Reel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="reels-view-container"
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Dynamic Toast for Feed Tuning */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-white/20 flex items-center gap-2 animate-fade-in pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Pull-To-Refresh Indicator for Reels */}
      {(pullProgress > 0 || isPullRefreshing || isRefreshing) && (
        <div
          id="reels-pull-to-refresh-indicator"
          className="absolute top-16 inset-x-0 flex items-center justify-center pointer-events-none z-50 transition-all duration-200"
          style={{
            opacity: Math.max(pullProgress, isPullRefreshing || isRefreshing ? 1 : 0),
            transform: `translateY(${Math.min(pullProgress * 24, 30)}px)`,
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl text-xs font-semibold text-white">
            <RefreshCw
              className={`w-4 h-4 text-rose-400 ${isPullRefreshing || isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: !isPullRefreshing && !isRefreshing ? `rotate(${pullProgress * 360}deg)` : undefined,
              }}
            />
            <span>
              {isPullRefreshing || isRefreshing
                ? 'Refreshing Firestore Reels...'
                : pullProgress >= 1
                ? 'Release to refresh'
                : 'Pull down to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Reel Card Stage - Full screen vertical without black boxes */}
      <div
        className="relative w-full h-full overflow-hidden bg-black flex flex-col justify-end"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Videos Carousel Container */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full cursor-pointer"
          onClick={handleVideoClick}
        >
          {queue.map((item, index) => {
            const isCurrent = index === activeIndex;

            if (adMobService.isAdItem(item)) {
              return (
                <div
                  key={item.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <AdMobNativeReelAd
                    ad={item}
                    isActive={isCurrent}
                    isMuted={isMuted}
                    onToggleMute={() => setIsMuted((m) => !m)}
                  />
                </div>
              );
            }

            const reel = item as Reel;
            const isImage = Boolean(
              reel.videoUrl && (
                reel.videoUrl.endsWith('.jpg') ||
                reel.videoUrl.endsWith('.jpeg') ||
                reel.videoUrl.endsWith('.png') ||
                reel.videoUrl.endsWith('.webp') ||
                reel.videoUrl.includes('images.unsplash.com') ||
                reel.videoUrl.startsWith('data:image/')
              )
            );

            return (
              <div
                key={reel.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {isImage ? (
                  <img
                    src={reel.videoUrl}
                    alt={reel.caption || 'Reel media'}
                    className="w-full h-full object-cover select-none"
                    loading={isCurrent ? 'eager' : 'lazy'}
                  />
                ) : (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                      if (el) {
                        el.defaultMuted = false;
                        el.muted = isMuted;
                      }
                    }}
                    src={reel.videoUrl}
                    poster={reel.thumbnailUrl}
                    autoPlay
                    loop
                    playsInline
                    webkit-playsinline="true"
                    muted={isMuted}
                    preload={Math.abs(index - activeIndex) <= 1 ? 'auto' : 'metadata'}
                    onPlay={() => {
                      if (index === activeIndex) setIsPlaying(true);
                    }}
                    onPause={() => {
                      if (index === activeIndex) setIsPlaying(false);
                    }}
                    onTimeUpdate={() => handleTimeUpdate(index)}
                    onEnded={(e) => {
                      const vid = e.currentTarget;
                      vid.currentTime = 0;
                      vid.play().catch(() => {});
                    }}
                    onError={(e) => {
                      // Resilient fallback stream in case of any network drops
                      const target = e.currentTarget;
                      if (!target.src.includes('trailer.mp4')) {
                        target.src = 'https://media.w3.org/2010/05/sintel/trailer.mp4';
                        target.play().catch(() => {});
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            );
          })}

          {/* Organic Reel Overlays (rendered strictly on organic content) */}
          {!isAdCurrent && currentReel && (
            <>
              {/* Vignette Gradients for Legibility */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-20" />
              <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-20" />

          {/* Animated Heart Overlay on Double Tap */}
          <AnimatePresence>
            {showHeartBurst && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.35, 1.05], opacity: [0, 1, 0.95], rotate: [0, -8, 4, 0] }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <div className="relative flex items-center justify-center">
                  <Heart className="w-32 h-32 text-rose-500 fill-rose-500 drop-shadow-[0_12px_36px_rgba(244,63,94,0.75)]" />
                  <div className="absolute inset-0 rounded-full bg-rose-500/25 blur-2xl pointer-events-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Bar on Reel: Title, Category pill, Audio status & 3-dot menu */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30 text-white">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg drop-shadow-md tracking-wide">
                {t.reels}
              </span>
              {currentReel.category && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-[11px] font-medium border border-white/20 transition cursor-pointer"
                  title="Tune your feed"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{currentReel.category}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Manual Reels Refresh Button */}
              {onRefreshReels && (
                <button
                  id="reel-refresh-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsPullRefreshing(true);
                    try {
                      await onRefreshReels();
                    } finally {
                      setIsPullRefreshing(false);
                    }
                  }}
                  disabled={isPullRefreshing || isRefreshing}
                  className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl transition active:scale-95 flex items-center justify-center cursor-pointer"
                  aria-label="Refresh reels feed"
                  title="Refresh reels"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isPullRefreshing || isRefreshing ? 'animate-spin text-rose-400' : 'text-white'
                    }`}
                  />
                </button>
              )}

              {/* Speaker Corner Icon Button - Clean toggle without blocking overlay */}
              <button
                id="reel-mute-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSoundAndPlay();
                }}
                className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl transition active:scale-95 flex items-center justify-center cursor-pointer"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                id="reel-top-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(true);
                }}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition"
                aria-label="Feed options"
              >
                <MoreVertical className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Bottom Left: Creator Info, Caption, Indian Audio Tag */}
          <div className="absolute bottom-4 left-4 right-16 z-30 text-white flex flex-col gap-2">
            {/* Tagged Product Pill Overlay */}
            {currentReel.productTag && (
              <div>
                <button
                  id={`reel-product-tag-pill-${currentReel.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-emerald-400/40 transition active:scale-95 group mb-0.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="max-w-[130px] truncate">{currentReel.productTag.title}</span>
                  <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded text-[11px] font-bold">
                    ₹{currentReel.productTag.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-400 ml-0.5 underline">
                    Chat on WhatsApp ›
                  </span>
                </button>
              </div>
            )}

            {/* User Details */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pauseAllMedia();
                  onViewUser(currentReel.username);
                }}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 hover:scale-105 transition flex-shrink-0"
              >
                <img
                  src={currentReel.userAvatar}
                  alt={currentReel.username}
                  className="w-full h-full object-cover"
                />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  pauseAllMedia();
                  onViewUser(currentReel.username);
                }}
                className="font-bold text-sm hover:underline drop-shadow-md flex items-center gap-1 truncate"
              >
                <span>{currentReel.username}</span>
                {currentReel.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400 flex-shrink-0" />
                )}
              </button>

              {/* Follow / Following Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollow(currentReel.username);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition ${
                  followedMap[currentReel.username]
                    ? 'bg-white/20 text-neutral-200 border border-white/30'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {followedMap[currentReel.username]
                  ? (t.followingBtn || t.following || 'Following')
                  : (t.follow || 'Follow')}
              </button>
            </div>

            {/* Caption & Location */}
            <div className="text-xs drop-shadow-md">
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCaption((prev) => !prev);
                }}
                className={`cursor-pointer leading-relaxed ${
                  expandedCaption ? '' : 'line-clamp-2'
                }`}
              >
                {currentReel.caption}
              </p>
              {currentReel.location && (
                <span className="text-[11px] text-neutral-300 font-medium opacity-90 mt-0.5 block">
                  📍 {currentReel.location}
                </span>
              )}
            </div>

            {/* Trending Audio Tag - Clickable to open Audio Detail Sheet */}
            <button
              id="reel-audio-marquee-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowAudioDetailSheet(true);
              }}
              title="Tap to see audio details & use sound"
              aria-label={`Open audio details for ${currentReel.audioTitle}`}
              className="flex items-center gap-2 mt-0.5 text-xs text-white/95 bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md py-1.5 px-3 rounded-full w-fit max-w-full transition active:scale-95 group text-left cursor-pointer shadow-md"
            >
              <Music
                className={`w-3.5 h-3.5 text-rose-400 flex-shrink-0 group-hover:scale-115 transition-transform ${
                  isPlaying ? 'animate-spin [animation-duration:4s]' : ''
                }`}
              />
              <span className="truncate text-[11px] font-medium tracking-wide group-hover:underline">
                {currentReel.username && currentReel.audioTitle && !currentReel.audioTitle.includes(currentReel.username)
                  ? `${currentReel.username} • ${currentReel.audioTitle}`
                  : currentReel.audioTitle || `${currentReel.username || 'Creator'} • Original Audio`}
              </span>
              <span className="text-[10px] text-white/70 font-semibold ml-0.5 group-hover:text-rose-300">
                • Use Sound ↗
              </span>
            </button>
          </div>

          {/* Right Action Bar: Like, Comments, Share, WhatsApp, Save, 3-dot Menu, Disc */}
          <div className="absolute bottom-4 right-3 z-30 flex flex-col items-center gap-3.5 text-white">
            {/* Like */}
            <button
              id="reel-action-like"
              onClick={(e) => {
                e.stopPropagation();
                handleLikeReel();
              }}
              className="flex flex-col items-center group transition active:scale-125"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    currentReel.isLiked
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-white stroke-[2]'
                  }`}
                />
              </div>
              <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">
                {currentReel.likesCount.toLocaleString()}
              </span>
            </button>

            {/* Comments Drawer Trigger */}
            <button
              id="reel-action-comments"
              onClick={(e) => {
                e.stopPropagation();
                if (onRequireAuth && (!currentUser?.email && !currentUser?.isGoogleAuth)) {
                  onRequireAuth('comment');
                  return;
                }
                setShowCommentsDrawer(true);
              }}
              className="flex flex-col items-center group transition active:scale-110"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                <MessageCircle className="w-6 h-6 text-white stroke-[2]" />
              </div>
              <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">
                {currentReel.comments.length}
              </span>
            </button>

            {/* Share */}
            <button
              id="reel-action-share"
              onClick={(e) => {
                e.stopPropagation();
                onShare(currentReel);
                recommendationEngine.recordInteraction(currentReel.category || 'Travel', 'share');
              }}
              className="flex flex-col items-center group transition active:scale-110"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                <Send className="w-6 h-6 text-white stroke-[2]" />
              </div>
              <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">{t.share}</span>
            </button>

            {/* Direct WhatsApp Share */}
            <a
              id="reel-action-whatsapp"
              href={`https://api.whatsapp.com/send?text=${safeEncodeURIComponent(
                `Watch this Reel by @${currentReel.username} on Jhalak:\n"${currentReel.caption}"\n${typeof window !== 'undefined' ? window.location.href : ''}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Share Reel on WhatsApp"
              title="Share on WhatsApp"
              className="flex flex-col items-center group transition active:scale-110"
            >
              <div className="p-2.5 rounded-full bg-[#25D366]/20 backdrop-blur-md group-hover:bg-[#25D366]/35 group-hover:scale-110 border border-[#25D366]/40 transition">
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#25D366] fill-[#25D366] drop-shadow-[0_0_8px_rgba(37,211,102,0.8)]" />
                  <Phone className="w-2.5 h-2.5 text-white fill-white absolute -rotate-12" />
                </div>
              </div>
              <span className="text-[10px] font-semibold mt-0.5 text-[#25D366] drop-shadow-md">
                WhatsApp
              </span>
            </a>

            {/* Save */}
            <button
              id="reel-action-save"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(currentReel.id);
                recommendationEngine.recordInteraction(currentReel.category || 'Travel', 'save');
              }}
              className="flex flex-col items-center group transition active:scale-110"
              title={currentReel.isSaved ? 'Saved' : 'Save'}
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                <Bookmark
                  className={`w-6 h-6 transition-colors ${
                    currentReel.isSaved
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-white stroke-[2]'
                  }`}
                />
              </div>
            </button>

            {/* Video Download with Watermark */}
            <button
              id="reel-action-download"
              onClick={(e) => {
                e.stopPropagation();
                setShowWatermarkDownload(true);
              }}
              className="flex flex-col items-center group transition active:scale-110 cursor-pointer"
              aria-label="Download reel with watermark"
              title="Download video with Jhalak branding watermark"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 group-hover:scale-105 transition">
                <Download className="w-5 h-5 text-white group-hover:text-amber-400 transition-colors" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5 text-white/90 drop-shadow-md">
                Save
              </span>
            </button>

            {/* UPI Shagun / Creator Tipping */}
            <button
              id="reel-action-shagun"
              onClick={(e) => {
                e.stopPropagation();
                setShowShagunSheet(true);
              }}
              className="flex flex-col items-center group transition active:scale-110 cursor-pointer"
              aria-label="Send UPI Shagun Tip"
              title="Send UPI Shagun tip to creator"
            >
              <div className="p-2.5 rounded-full bg-gradient-to-tr from-amber-500/80 to-rose-500/80 backdrop-blur-md group-hover:from-amber-500 group-hover:to-rose-500 group-hover:scale-105 shadow-md shadow-amber-500/20 transition">
                <Gift className="w-5 h-5 text-white animate-bounce [animation-duration:2.5s]" />
              </div>
              <span className="text-[10px] font-bold mt-0.5 text-amber-300 drop-shadow-md">
                Shagun
              </span>
            </button>

            {/* 3-dot Options Menu Button */}
            <button
              id="reel-action-more"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsMenu(true);
              }}
              className="flex flex-col items-center group transition active:scale-110"
              aria-label="Feed tuning options"
              title="Options"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                <MoreVertical className="w-5 h-5 text-white" />
              </div>
            </button>

            {/* Rotating Music Disc - Clickable to open Audio Details */}
            <button
              id="reel-music-disc-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowAudioDetailSheet(true);
              }}
              title={`View audio details: ${currentReel.audioTitle}`}
              aria-label={`Open audio details for ${currentReel.audioTitle}`}
              className="relative mt-1 cursor-pointer transition active:scale-90 group focus:outline-none"
            >
              <div
                className={`w-8 h-8 rounded-full border-2 border-neutral-600 group-hover:border-rose-400 bg-neutral-900 overflow-hidden shadow-lg flex items-center justify-center p-0.5 transition-colors ${
                  isPlaying ? 'animate-spin [animation-duration:4s]' : ''
                }`}
              >
                <img
                  src={currentReel.userAvatar}
                  alt="Music Cover"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {isPlaying && (
                <div className="absolute -top-3 -right-1 text-white/70 text-xs animate-bounce pointer-events-none">
                  ♪
                </div>
              )}
            </button>
          </div>

          {/* Thin Video Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  </div>

      {/* Desktop Navigation Arrows (Up / Down) */}
      <div className="hidden lg:flex flex-col gap-3 ml-6 z-30">
        <button
          id="reel-nav-prev"
          onClick={goToPrev}
          disabled={activeIndex === 0}
          aria-label="Previous reel"
          className="p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition backdrop-blur-md"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <span className="text-center text-xs font-semibold text-neutral-400">
          {activeIndex + 1} / {queue.length}
        </span>

        <button
          id="reel-nav-next"
          onClick={goToNext}
          disabled={activeIndex === queue.length - 1}
          aria-label="Next reel"
          className="p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition backdrop-blur-md"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Modern Instagram-style Bottom Sheet for 3-Dot Feed Options */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center transition-opacity"
          onClick={() => setShowOptionsMenu(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 text-neutral-100 rounded-t-3xl border-t border-neutral-800 p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-4" />

            {/* Reel Summary Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentReel.userAvatar}
                  alt={currentReel.username}
                  className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                />
                <div>
                  <p className="font-semibold text-sm">@{currentReel.username}</p>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <span>Category:</span>
                    <span className="font-medium text-amber-400">
                      {currentReel.category || 'Travel'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowOptionsMenu(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions List */}
            <div className="space-y-1.5">
              {/* Show More Like This */}
              <button
                id="reel-menu-show-more"
                onClick={handleShowMore}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.showMoreLikeThis}</p>
                    <p className="text-xs text-neutral-400">
                      Show more videos related to {currentReel.category || 'this topic'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10">
                  + Boost
                </span>
              </button>

              {/* Not Interested */}
              <button
                id="reel-menu-not-interested"
                onClick={handleNotInterested}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-400">{t.notInterested}</p>
                    <p className="text-xs text-neutral-400">
                      Hide this Reel and show fewer like this in your queue
                    </p>
                  </div>
                </div>
              </button>

              {/* Why am I seeing this? */}
              <button
                id="reel-menu-why"
                onClick={() => setShowWhyModal(!showWhyModal)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-800/30 hover:bg-neutral-800 text-left transition"
              >
                <div className="p-2 rounded-xl bg-neutral-700/50 text-neutral-300">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-200">{t.whyAmISeeingThis}</p>
                  <p className="text-xs text-neutral-400">See your category preferences & signals</p>
                </div>
              </button>

              {/* Explanatory breakdown if clicked */}
              {showWhyModal && (
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 space-y-2 mt-2">
                  <p className="font-semibold text-neutral-200">Recommendation Signals:</p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-400">
                    <li>Matches your interest in <strong>{currentReel.category || 'Travel'}</strong></li>
                    <li>Based on videos you recently completed, liked, or saved</li>
                    <li>Trending in your region with {currentReel.likesCount.toLocaleString()} views</li>
                  </ul>
                </div>
              )}
              {/* Save / Download with Watermark */}
              <button
                id="reel-menu-download-watermark"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowWatermarkDownload(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-400 group-hover:scale-110 transition border border-amber-500/30">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Save / Download Video</p>
                    <p className="text-xs text-neutral-400">
                      Export with Jhalak • @{currentReel.username} branding watermark
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10">
                  Watermark
                </span>
              </button>

              {/* Send UPI Shagun Tip */}
              <button
                id="reel-menu-shagun-tip"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowShagunSheet(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-400 group-hover:scale-110 transition border border-amber-500/30">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Send UPI Shagun Tip 🎁</p>
                    <p className="text-xs text-neutral-400">
                      Support @{currentReel.username} directly via GPay, PhonePe, Paytm
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10">
                  Zero Fee
                </span>
              </button>

              <div className="my-1 border-t border-neutral-800/80" />

              {/* Delete Post (Owner only) */}
              {isOwner && (
                <button
                  id="reel-menu-delete"
                  onClick={handleDeleteCurrentReel}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-left transition group border border-rose-500/40 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/25 text-rose-500 group-hover:scale-110 transition">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-rose-500">Delete Post</p>
                      <p className="text-xs text-rose-300/80">
                        Permanently delete this reel from your account
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Report & Block only if NOT owner */}
              {!isOwner && (
                <>
                  {/* Report Reel */}
                  <button
                    id="reel-menu-report"
                    onClick={handleReportCurrentReel}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition">
                        <Flag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-400">Report Reel</p>
                        <p className="text-xs text-neutral-400">
                          Spam, inappropriate content, or harassment
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Block User */}
                  <button
                    id="reel-menu-block"
                    onClick={handleBlockCurrentUser}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition">
                        <Ban className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-rose-400">
                          Block @{currentReel.username}
                        </p>
                        <p className="text-xs text-neutral-400">
                          Hide all reels and prevent interactions
                        </p>
                      </div>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowOptionsMenu(false)}
              className="w-full mt-4 py-3 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-semibold hover:bg-neutral-700 transition"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Modern Mobile Bottom Sheet for Reels Comments */}
      {currentReel && (
        <CommentsBottomSheet
          isOpen={showCommentsDrawer}
          onClose={() => setShowCommentsDrawer(false)}
          comments={currentReel.comments}
          currentUser={currentUser}
          targetAuthorUsername={currentReel.username}
          onAddComment={(text, mediaUrl, mediaType) => {
            onAddComment(currentReel.id, text, mediaUrl, mediaType);
            recommendationEngine.recordInteraction(currentReel.category || 'Travel', 'comment');
          }}
          onViewUser={onViewUser}
        />
      )}

      {/* Instagram-Style Audio Detail Sheet with 'Use Audio' Action */}
      {currentReel && (
        <AudioDetailSheet
          isOpen={showAudioDetailSheet}
          onClose={() => setShowAudioDetailSheet(false)}
          audioTitle={currentReel.audioTitle}
          audioArtist={currentReel.audioArtist}
          audioCoverUrl={currentReel.userAvatar}
          currentReelId={currentReel.id}
          allReels={initialReels}
          onUseAudio={(title, artist) => {
            setShowAudioDetailSheet(false);
            if (onUseAudio) {
              onUseAudio(title, artist);
            }
          }}
          onSelectReel={(reelId) => {
            const idx = queue.findIndex((r) => r.id === reelId);
            if (idx !== -1) {
              setActiveIndex(idx);
            } else {
              const target = initialReels.find((r) => r.id === reelId);
              if (target) {
                setQueue((prev) => [target, ...prev.filter((r) => r.id !== reelId)]);
                setActiveIndex(0);
              }
            }
          }}
        />
      )}

      {/* Watermark Download Simulation Modal */}
      {currentReel && (
        <WatermarkDownloadModal
          isOpen={showWatermarkDownload}
          onClose={() => setShowWatermarkDownload(false)}
          reel={currentReel}
          onDownloadSuccess={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {/* Safety & Moderation (Report / Block) Modal */}
      <ReportModal
        isOpen={!!reportModalTarget}
        onClose={() => setReportModalTarget(null)}
        target={reportModalTarget}
        initialMode={reportModalTarget?.mode || 'report'}
        onReportSubmitted={(id, reason) => {
          setToastMessage(`Report received (${reason}). Thank you for keeping Jhalak safe! 🛡️`);
          setTimeout(() => setToastMessage(null), 3000);
          if (videoRefs.current[activeIndex]) {
            videoRefs.current[activeIndex]?.pause();
          }
          setQueue((prev) => {
            const next = prev.filter((r) => r.id !== id);
            if (activeIndex >= next.length && next.length > 0) {
              setActiveIndex(next.length - 1);
            }
            return next;
          });
          if (onReportReel && currentReel) {
            onReportReel(currentReel, reason);
          }
        }}
        onUserBlocked={(username) => {
          const clean = username.toLowerCase().replace(/^@/, '').trim();
          setToastMessage(`Blocked @${clean}. Their reels are now hidden.`);
          setTimeout(() => setToastMessage(null), 3000);
          if (videoRefs.current[activeIndex]) {
            videoRefs.current[activeIndex]?.pause();
          }
          setQueue((prev) => {
            const next = prev.filter((r) => {
              if (adMobService.isAdItem(r)) return true;
              return r.username.toLowerCase() !== clean;
            });
            if (activeIndex >= next.length && next.length > 0) {
              setActiveIndex(next.length - 1);
            }
            return next;
          });
          if (onBlockUser) {
            onBlockUser(username);
          }
        }}
      />
      {/* UPI Shagun Creator Tipping Bottom Sheet */}
      {currentReel && (
        <UpiShagunSheet
          isOpen={showShagunSheet}
          onClose={() => setShowShagunSheet(false)}
          creator={{
            username: currentReel.username,
            name: currentReel.username,
            avatar: currentReel.userAvatar,
          }}
          onTipSent={(amount, app, note) => {
            setToastMessage(`Sent ₹${amount} Shagun to @${currentReel.username}! 🎁✨`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Product Tag & WhatsApp Enquiry Modal */}
      {currentReel && currentReel.productTag && (
        <ProductWhatsAppModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          product={currentReel.productTag}
          creator={{
            username: currentReel.username,
            name: currentReel.username,
            avatar: currentReel.userAvatar,
            isVerified: currentReel.isVerified,
          }}
        />
      )}
    </div>
  );
};
