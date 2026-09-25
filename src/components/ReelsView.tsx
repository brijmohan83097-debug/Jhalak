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
  ArrowLeft,
  Share2,
  Copy,
  Lock,
  Globe,
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
import { adMobService, AdMobNativeAd, ADMOB_CONFIG } from '../services/adMobService';
import { isSuperAdmin } from '../constants/admin';
import { AdMobNativeReelAd } from './AdMobNativeReelAd';
import { safeEncodeURIComponent } from '../utils/safeEncoding';
import { pauseAllMedia } from '../utils/mediaCoordinator';

interface ReelsViewProps {
  reels: Reel[];
  currentUser: User;
  isActive?: boolean;
  initialReelId?: string | null;
  onBack?: () => void;
  onToggleLike: (reelId: string) => void;
  onToggleSave: (reelId: string) => void;
  onAddComment: (reelId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'gif') => void;
  onShare: (reel: Reel) => void;
  onViewUser: (username: string) => void;
  onUseAudio?: (audioTitle: string, audioArtist?: string) => void;
  onReportReel?: (reel: Reel, reason: string) => void;
  onBlockUser?: (username: string) => void;
  onDeleteReel?: (reelId: string) => void;
  onUpdatePostPrivacy?: (reelId: string, privacy: 'public' | 'private') => void;
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
  initialReelId,
  onBack,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onShare,
  onViewUser,
  onUseAudio,
  onReportReel,
  onBlockUser,
  onDeleteReel,
  onUpdatePostPrivacy,
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
    const nativeAds = adMobService.getNativeReelAds();
    if (initialReelId) {
      const cleanTarget = initialReelId.replace(/^reel-/, '');
      const match = unblocked.find(
        (r) =>
          r.id === initialReelId ||
          r.id === `reel-${initialReelId}` ||
          (typeof r.id === 'string' && r.id.replace(/^reel-/, '') === cleanTarget)
      );
      if (match) {
        const others = unblocked.filter((r) => r.id !== match.id);
        const ordered = [match, ...recommendationEngine.getPersonalizedReelsQueue(others, 1)];
        return adMobService.insertNativeAds(ordered, nativeAds, ADMOB_CONFIG.REELS_AD_INTERVAL);
      }
    }
    const recQueue = recommendationEngine.getPersonalizedReelsQueue(unblocked, 0);
    return adMobService.insertNativeAds(recQueue, nativeAds, ADMOB_CONFIG.REELS_AD_INTERVAL);
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<'play' | 'pause' | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showAudioDetailSheet, setShowAudioDetailSheet] = useState(false);
  const [showWatermarkDownload, setShowWatermarkDownload] = useState(false);
  const [shareModalReel, setShareModalReel] = useState<Reel | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
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
  const reelItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastTapTimeRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchedReelsRef = useRef<Record<string, boolean>>({});
  const lastWatchTickRef = useRef<number>(Date.now());

  // Set up IntersectionObserver to detect which reel is snapped into full view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(idx) && idx !== activeIndex) {
              setActiveIndex(idx);
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.5, 0.75],
      }
    );

    reelItemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [queue.length, activeIndex]);

  // Re-synchronize queue if upstream initialReels length or content changes significantly
  useEffect(() => {
    const unblocked = initialReels.filter(
      (r) => !moderationService.isUserBlocked(r.username) && !moderationService.isItemReported(r.id)
    );
    if (initialReelId) {
      const cleanTarget = initialReelId.replace(/^reel-/, '');
      const match = unblocked.find(
        (r) =>
          r.id === initialReelId ||
          r.id === `reel-${initialReelId}` ||
          (typeof r.id === 'string' && r.id.replace(/^reel-/, '') === cleanTarget)
      );
      if (match) {
        const others = unblocked.filter((r) => r.id !== match.id);
        const recQueue = recommendationEngine.getPersonalizedReelsQueue(others, 1);
        const nativeAds = adMobService.getNativeReelAds();
        setQueue(adMobService.insertNativeAds([match, ...recQueue], nativeAds, ADMOB_CONFIG.REELS_AD_INTERVAL));
        setActiveIndex(0);
        return;
      }
    }
    const firstReel = initialReels[0];
    if (firstReel && isNewlyCreated(firstReel)) {
      setActiveIndex(0);
    }
    setQueue(() => {
      const recQueue = recommendationEngine.getPersonalizedReelsQueue(unblocked, 0);
      const nativeAds = adMobService.getNativeReelAds();
      return adMobService.insertNativeAds(recQueue, nativeAds, ADMOB_CONFIG.REELS_AD_INTERVAL);
    });
  }, [initialReels, initialReelId]);

  // Jump directly to requested reel and start playback smoothly
  useEffect(() => {
    if (!initialReelId || !isActive) return;
    const cleanTarget = initialReelId.replace(/^reel-/, '');
    const isTarget = (item: any) =>
      item &&
      (item.id === initialReelId ||
        item.id === `reel-${initialReelId}` ||
        (typeof item.id === 'string' && item.id.replace(/^reel-/, '') === cleanTarget));

    const existingIdx = queue.findIndex(isTarget);
    if (existingIdx !== -1) {
      setActiveIndex(existingIdx);
      setIsPlaying(true);
      const timer = setTimeout(() => {
        reelItemRefs.current[existingIdx]?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        if (containerRef.current) {
          containerRef.current.scrollTop = existingIdx * window.innerHeight;
        }
        const vid = videoRefs.current[existingIdx];
        if (vid) {
          vid.currentTime = 0;
          vid.defaultMuted = false;
          vid.muted = isMuted;
          vid.volume = 1.0;
          vid.play().catch(() => {
            vid.muted = true;
            setIsMuted(true);
            vid.play().catch(() => {});
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialReelId, isActive, queue, isMuted]);

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
      const nativeAds = adMobService.getNativeReelAds();
      const interleaved = adMobService.insertNativeAds(reordered, nativeAds, ADMOB_CONFIG.REELS_AD_INTERVAL);
      const head = prevQueue.slice(0, activeIndex + 1);
      return [...head, ...interleaved];
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
        if (video.currentTime > 0.1) {
          try {
            video.currentTime = 0;
          } catch {}
        }
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
        if (video.currentTime > 0.1) {
          try {
            video.currentTime = 0;
          } catch {}
        }
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
    const DOUBLE_TAP_GAP = 260;

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

    // Single screen tap cleanly toggles Play / Pause directly with momentary indicator
    tapTimeoutRef.current = setTimeout(() => {
      const currentVideo = videoRefs.current[activeIndex];
      if (currentVideo) {
        if (currentVideo.paused) {
          currentVideo.play().then(() => {
            setIsPlaying(true);
            setShowPlayPauseIcon('play');
          }).catch(() => {
            currentVideo.muted = true;
            currentVideo.play().then(() => {
              setIsPlaying(true);
              setShowPlayPauseIcon('play');
            }).catch(() => {});
          });
        } else {
          currentVideo.pause();
          setIsPlaying(false);
          setShowPlayPauseIcon('pause');
        }
        setTimeout(() => setShowPlayPauseIcon(null), 700);
      }
      tapTimeoutRef.current = null;
    }, DOUBLE_TAP_GAP);
  };

  const toggleFollow = (username: string) => {
    setFollowedMap((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const goToNext = useCallback(() => {
    if (activeIndex < queue.length - 1) {
      const nextIndex = activeIndex + 1;
      reelItemRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeIndex, queue.length]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      reelItemRefs.current[prevIndex]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeIndex]);

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

  // Pull-to-refresh handling on top reel (native CSS snap handles vertical reel scrolling)
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && (containerRef.current?.scrollTop || 0) <= 2) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartY.current > 0 && (containerRef.current?.scrollTop || 0) <= 2) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartY.current;
      const deltaX = currentX - touchStartX.current;

      // When at top reel and swiping downward, track pull progress
      if (activeIndex === 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) && !isPullRefreshing && !isRefreshing) {
        setPullProgress(Math.min(deltaY / 80, 1));
      } else if (pullProgress > 0) {
        setPullProgress(0);
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (touchStartY.current > 0 && e.changedTouches.length === 1) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      touchStartY.current = 0;

      // Pull down to refresh on the first reel
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
    }
    setPullProgress(0);
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
      ref={containerRef}
      id="reels-view-container"
      className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory bg-black select-none no-scrollbar relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Toast for Feed Tuning */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-white/20 flex items-center gap-2 animate-fade-in pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Pull-To-Refresh Indicator for Reels */}
      {(pullProgress > 0 || isPullRefreshing || isRefreshing) && (
        <div
          id="reels-pull-to-refresh-indicator"
          className="fixed top-16 inset-x-0 flex items-center justify-center pointer-events-none z-50 transition-all duration-200"
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

      {/* Queue of Reels: Each reel is full-height and snaps vertically without overlapping */}
      {queue.map((item, index) => {
        const isCurrent = index === activeIndex;

        if (adMobService.isAdItem(item)) {
          return (
            <div
              key={item.id}
              data-index={index}
              ref={(el) => { reelItemRefs.current[index] = el; }}
              className="h-[100dvh] w-full snap-start relative flex items-center justify-center bg-black overflow-hidden flex-shrink-0"
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
            data-index={index}
            ref={(el) => { reelItemRefs.current[index] = el; }}
            className="h-[100dvh] w-full snap-start relative flex items-center justify-center bg-black overflow-hidden flex-shrink-0 cursor-pointer"
            onClick={handleVideoClick}
          >
            {/* Reel Media: Video or Image */}
            {isImage ? (
              <img
                src={reel.videoUrl}
                alt={reel.caption || 'Reel media'}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading={Math.abs(index - activeIndex) <= 1 ? 'eager' : 'lazy'}
              />
            ) : (
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                  if (el) {
                    el.defaultMuted = isMuted;
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
                preload={Math.abs(index - activeIndex) <= 2 ? 'auto' : 'metadata'}
                onCanPlay={(e) => {
                  if (index === activeIndex && isActive) {
                    const vid = e.currentTarget;
                    if (vid.paused) {
                      vid.play().then(() => setIsPlaying(true)).catch(() => {
                        vid.muted = true;
                        vid.play().then(() => setIsPlaying(true)).catch(() => {});
                      });
                    }
                  }
                }}
                onLoadedData={(e) => {
                  if (index === activeIndex && isActive) {
                    const vid = e.currentTarget;
                    if (vid.paused) {
                      vid.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }
                }}
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
                  const vid = e.currentTarget;
                  if (reel.videoUrl && !reel.videoUrl.includes('sample/ForBiggerBlazes')) {
                    vid.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
                    vid.load();
                    vid.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }}
                className="w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Vignette Gradients for Legibility */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-20" />

            {/* Animated Heart Overlay on Double Tap */}
            <AnimatePresence>
              {isCurrent && showHeartBurst && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.35, 1.05], opacity: [0, 1, 0.95], rotate: [0, -8, 4, 0] }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                >
                  <div className="relative flex items-center justify-center">
                    <Heart className="w-32 h-32 text-red-600 fill-red-600 drop-shadow-[0_12px_36px_rgba(220,38,38,0.85)]" />
                    <div className="absolute inset-0 rounded-full bg-red-600/25 blur-2xl pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persistent Center Play Icon when Reel is Paused */}
            {isCurrent && !isPlaying && !showPlayPauseIcon && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-in zoom-in-90 duration-150">
                <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-2xl">
                  <Play className="w-9 h-9 fill-white ml-1 text-white" />
                </div>
              </div>
            )}

            {/* Momentary Play/Pause Icon Feedback on Tap */}
            <AnimatePresence>
              {isCurrent && showPlayPauseIcon && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                >
                  <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-2xl">
                    {showPlayPauseIcon === 'play' ? (
                      <Play className="w-9 h-9 fill-white ml-1 text-white" />
                    ) : (
                      <Pause className="w-9 h-9 fill-white text-white" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Top Bar on Reel: Title, Language badge, Category pill, Audio status & Refresh icons */}
            <div className="absolute top-0 inset-x-0 pt-3 sm:pt-4 px-3 sm:px-4 flex items-center justify-between z-30 text-white pointer-events-auto">
              <div className="flex items-center gap-2">
                {onBack && (
                  <button
                    id={`reel-back-btn-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBack();
                    }}
                    className="p-2 -ml-1 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white transition active:scale-95 cursor-pointer shadow-lg mr-0.5"
                    aria-label="Back to feed"
                    title="Back to feed"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                <span className="font-extrabold text-lg sm:text-xl drop-shadow-md tracking-wide">
                  {t.reels}
                </span>

                {/* Language Badge */}
                <span className="px-2 py-0.5 rounded-full bg-rose-600/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-rose-400/40 shadow-sm">
                  {reel.language ? reel.language.toUpperCase() : 'BHOJPURI'}
                </span>

                {reel.category && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptionsMenu(true);
                    }}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-[11px] font-medium border border-white/20 transition cursor-pointer"
                    title="Tune your feed"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{reel.category}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onRefreshReels && (
                  <button
                    id={`reel-refresh-btn-${index}`}
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
                    className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl transition active:scale-95 flex items-center justify-center cursor-pointer"
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

                <button
                  id={`reel-mute-btn-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSoundAndPlay();
                  }}
                  className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl transition active:scale-95 flex items-center justify-center cursor-pointer"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Left: Creator Info, Caption, Indian Audio Tag */}
            <div className="absolute bottom-16 md:bottom-4 left-4 right-16 z-30 text-white flex flex-col gap-2 pointer-events-auto">
              {/* Tagged Product Pill Overlay */}
              {reel.productTag && (
                <div>
                  <button
                    id={`reel-product-tag-pill-${reel.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProductModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-emerald-400/40 transition active:scale-95 group mb-0.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                    <span className="max-w-[130px] truncate">{reel.productTag.title}</span>
                    <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded text-[11px] font-bold">
                      ₹{reel.productTag.price.toLocaleString('en-IN')}
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
                    onViewUser(reel.username);
                  }}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/80 hover:scale-105 transition flex-shrink-0"
                >
                  <img
                    src={reel.userAvatar}
                    alt={reel.username}
                    className="w-full h-full object-cover"
                  />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    pauseAllMedia();
                    onViewUser(reel.username);
                  }}
                  className="font-bold text-sm hover:underline drop-shadow-md flex items-center gap-1 truncate"
                >
                  <span>{reel.username}</span>
                  {reel.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400 flex-shrink-0" />
                  )}
                </button>

                {(reel.privacy === 'private' || reel.isPrivate) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-black/60 backdrop-blur-md border border-amber-400/40 px-2 py-0.5 rounded-full shadow-sm">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Private</span>
                  </span>
                )}

                {/* Follow / Following Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow(reel.username);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition ${
                    followedMap[reel.username]
                      ? 'bg-white/20 text-neutral-200 border border-white/30'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {followedMap[reel.username]
                    ? (t.followingBtn || t.following || 'Following')
                    : (t.follow || 'Follow')}
                </button>
              </div>

              {/* Caption & Location */}
              <div className="text-xs drop-shadow-md">
                <p
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrent) setExpandedCaption((prev) => !prev);
                  }}
                  className={`cursor-pointer leading-relaxed ${
                    isCurrent && expandedCaption ? '' : 'line-clamp-2'
                  }`}
                >
                  {reel.caption}
                </p>
                {reel.location && (
                  <span className="text-[11px] text-neutral-300 font-medium opacity-90 mt-0.5 block">
                    📍 {reel.location}
                  </span>
                )}
              </div>

              {/* Trending Audio Tag */}
              <button
                id={`reel-audio-marquee-btn-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAudioDetailSheet(true);
                }}
                title="Tap to see audio details & use sound"
                aria-label={`Open audio details for ${reel.audioTitle}`}
                className="flex items-center gap-2 mt-0.5 text-xs text-white/95 bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md py-1.5 px-3 rounded-full w-fit max-w-full transition active:scale-95 group text-left cursor-pointer shadow-md"
              >
                <Music
                  className={`w-3.5 h-3.5 text-rose-400 flex-shrink-0 group-hover:scale-115 transition-transform ${
                    isCurrent && isPlaying ? 'animate-spin [animation-duration:4s]' : ''
                  }`}
                />
                <span className="truncate text-[11px] font-medium tracking-wide group-hover:underline">
                  {reel.username && reel.audioTitle && !reel.audioTitle.includes(reel.username)
                    ? `${reel.username} • ${reel.audioTitle}`
                    : reel.audioTitle || `${reel.username || 'Creator'} • Original Audio`}
                </span>
                <span className="text-[10px] text-white/70 font-semibold ml-0.5 group-hover:text-rose-300">
                  • Use Sound ↗
                </span>
              </button>
            </div>

            {/* Right Action Bar: Clean essential buttons (Like, Comment, Share, More) + Audio Disc */}
            <div className="absolute bottom-16 md:bottom-4 right-3 z-30 flex flex-col items-center gap-3.5 text-white pointer-events-auto">
              {/* Like */}
              <button
                id={`reel-action-like-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike(reel.id);
                  const cat = inferCategory(reel);
                  recommendationEngine.recordLanguageInteraction(inferLanguage(reel), 'like');
                  recommendationEngine.recordInteraction(cat, 'like', reel.id);
                  reorderUpcomingQueue();
                }}
                className="flex flex-col items-center group transition active:scale-125 cursor-pointer"
                aria-label="Like reel"
                title={reel.isLiked ? 'Unlike' : 'Like'}
              >
                <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                  <Heart
                    className={`w-6 h-6 transition-all duration-150 ${
                      reel.isLiked
                        ? 'text-red-600 fill-red-600 scale-105'
                        : 'text-white stroke-[2]'
                    }`}
                  />
                </div>
                <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">
                  {reel.likesCount.toLocaleString()}
                </span>
              </button>

              {/* Comments Drawer Trigger */}
              <button
                id={`reel-action-comments-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRequireAuth && (!currentUser?.email && !currentUser?.isGoogleAuth)) {
                    onRequireAuth('comment');
                    return;
                  }
                  setShowCommentsDrawer(true);
                }}
                className="flex flex-col items-center group transition active:scale-110 cursor-pointer"
                aria-label="View comments"
                title="Comments"
              >
                <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                  <MessageCircle className="w-6 h-6 text-white stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">
                  {reel.comments.length}
                </span>
              </button>

              {/* Share (Opens dedicated bottom sheet with WhatsApp, Download, Copy Link, Native Share) */}
              <button
                id={`reel-action-share-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShareModalReel(reel);
                  recommendationEngine.recordInteraction(reel.category || 'Travel', 'share');
                }}
                className="flex flex-col items-center group transition active:scale-110 cursor-pointer"
                aria-label="Share reel"
                title="Share"
              >
                <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                  <Send className="w-6 h-6 text-white stroke-[2]" />
                </div>
                <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">{t.share}</span>
              </button>

              {/* 3-dot More Options */}
              <button
                id={`reel-action-more-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(true);
                }}
                className="flex flex-col items-center group transition active:scale-110 cursor-pointer"
                aria-label="More options"
                title="Options"
              >
                <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                  <MoreVertical className="w-5 h-5 text-white" />
                </div>
              </button>

              {/* Spinning Disc */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAudioDetailSheet(true);
                }}
                className="mt-1 w-9 h-9 rounded-full bg-neutral-900 border-2 border-white/80 flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition"
                title="Tap to view Audio Details"
              >
                <div
                  className={`w-full h-full rounded-full overflow-hidden p-0.5 ${
                    isCurrent && isPlaying ? 'animate-spin [animation-duration:3s]' : ''
                  }`}
                >
                  <img
                    src={reel.userAvatar}
                    alt="Audio Album"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Video Playback Progress Bar */}
            {isCurrent && (
              <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30 pointer-events-none">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Desktop Navigation Arrows (Up / Down) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 z-30">
        <button
          id="reel-nav-prev"
          onClick={goToPrev}
          disabled={activeIndex === 0}
          aria-label="Previous reel"
          className="p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition backdrop-blur-md shadow-xl"
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
          className="p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition backdrop-blur-md shadow-xl"
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

              {/* Reel Privacy Toggle (Owner Only) */}
              {isOwner && onUpdatePostPrivacy && (
                <button
                  id={`reel-privacy-toggle-btn-${currentReel.id}`}
                  onClick={() => {
                    const nextPrivacy =
                      currentReel.privacy === 'private' || currentReel.isPrivate
                        ? 'public'
                        : 'private';
                    onUpdatePostPrivacy(currentReel.id, nextPrivacy);
                    setShowOptionsMenu(false);
                    setToastMessage(
                      nextPrivacy === 'private'
                        ? '🔒 Reel privacy changed to Private (Only visible in your Videos folder)'
                        : '🌐 Reel privacy changed to Public (Visible to everyone on feed)'
                    );
                    setTimeout(() => setToastMessage(null), 3500);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-800/80 hover:bg-neutral-800 text-left transition group border border-neutral-700/60 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        currentReel.privacy === 'private' || currentReel.isPrivate
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      } group-hover:scale-110 transition`}
                    >
                      {currentReel.privacy === 'private' || currentReel.isPrivate ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Globe className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Reel Privacy / प्राइवेसी</p>
                      <p className="text-xs text-neutral-400">
                        {currentReel.privacy === 'private' || currentReel.isPrivate
                          ? 'Only visible to you. Tap to make Public'
                          : 'Visible to all viewers. Tap to make Private'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      currentReel.privacy === 'private' || currentReel.isPrivate
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {currentReel.privacy === 'private' || currentReel.isPrivate ? '🔒 Private' : '🌐 Public'}
                  </span>
                </button>
              )}

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

      {/* Share Bottom Sheet / Modal: WhatsApp, Download Video, Copy Link, Native Web Share */}
      <AnimatePresence>
        {shareModalReel && (
          <div
            id="reel-share-modal-backdrop"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4"
            onClick={() => setShareModalReel(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl text-white pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Drag Handle on Mobile */}
              <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-sm text-white">Share Reel</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShareModalReel(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                  aria-label="Close share menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reel Preview Snippet */}
              <div className="p-3 mx-4 my-3 rounded-xl bg-neutral-800/70 border border-neutral-700/60 flex items-center gap-3">
                <div className="w-11 h-14 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-neutral-700">
                  {shareModalReel.thumbnailUrl ? (
                    <img
                      src={shareModalReel.thumbnailUrl}
                      alt={shareModalReel.caption || 'Reel'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                      <Clapperboard className="w-5 h-5 text-neutral-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-white block truncate">
                    @{shareModalReel.username}
                  </span>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                    {shareModalReel.caption || 'Watch this Reel on Jhalak!'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: WhatsApp, Download Video, Copy Link, Native Share */}
              <div className="px-4 pb-4 space-y-2">
                {/* 1. Share to WhatsApp */}
                <a
                  id="reel-share-whatsapp-btn"
                  href={`https://api.whatsapp.com/send?text=${safeEncodeURIComponent(
                    `Watch this Reel by @${shareModalReel.username} on Jhalak:\n"${shareModalReel.caption}"\n${typeof window !== 'undefined' ? window.location.href : ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setToastMessage('Opening WhatsApp...');
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <MessageCircle className="w-4 h-4 fill-white text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-sm text-white group-hover:text-[#25D366] transition-colors">
                        Share to WhatsApp
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        Chat or WhatsApp Status
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#25D366] px-2 py-0.5 rounded-full bg-[#25D366]/10">
                    Open ›
                  </span>
                </a>

                {/* 2. Download Video */}
                <button
                  type="button"
                  id="reel-share-download-btn"
                  onClick={() => {
                    setShareModalReel(null);
                    setShowWatermarkDownload(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                        Download Video
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        Save to device with Jhalak watermark
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-700/50">
                    Save ›
                  </span>
                </button>

                {/* 3. Copy Link */}
                <button
                  type="button"
                  id="reel-share-copy-link-btn"
                  onClick={() => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(window.location.href).catch(() => {});
                      }
                    } catch {}
                    setShareCopied(true);
                    setToastMessage('Link copied to clipboard! 📋');
                    setTimeout(() => {
                      setShareCopied(false);
                      setToastMessage(null);
                    }, 2500);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md transition-colors ${shareCopied ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                      {shareCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-sm text-white group-hover:text-sky-400 transition-colors">
                        {shareCopied ? 'Link Copied!' : 'Copy Link'}
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        {shareCopied ? 'Ready to paste anywhere' : 'Copy reel web link'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${shareCopied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/50 text-neutral-400'}`}>
                    {shareCopied ? 'Copied ✓' : 'Copy'}
                  </span>
                </button>

                {/* 4. Native Web Share */}
                <button
                  type="button"
                  id="reel-share-native-btn"
                  onClick={() => {
                    const shareData = {
                      title: `Reel by @${shareModalReel.username} on Jhalak`,
                      text: shareModalReel.caption || 'Watch this Reel on Jhalak!',
                      url: window.location.href,
                    };
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {});
                    } else {
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(window.location.href).catch(() => {});
                        }
                      } catch {}
                      setToastMessage('Link copied to clipboard! 📋');
                      setTimeout(() => setToastMessage(null), 2500);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                      <Share2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-sm text-white group-hover:text-neutral-200 transition-colors">
                        More Share Options
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        Instagram, Telegram, Messages & more
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-700/50">
                    Share ›
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
