import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  BadgeCheck,
  Music,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MapPin,
  Maximize2,
  Check,
  UserPlus,
} from 'lucide-react';
import { Post, User } from '../types';
import { CommentsBottomSheet } from './CommentsBottomSheet';
import { ProductWhatsAppModal } from './ProductWhatsAppModal';
import {
  createVideoFallbackDataUrl,
  createPhotoFallbackDataUrl,
} from '../utils/imageCompressor';

interface FullScreenMediaViewerProps {
  posts: Post[];
  initialPostId: string;
  currentUser: User;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'gif') => void;
  onShare: (post: Post) => void;
  onViewUser: (username: string) => void;
}

export const FullScreenMediaViewer: React.FC<FullScreenMediaViewerProps> = ({
  posts,
  initialPostId,
  currentUser,
  onClose,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onShare,
  onViewUser,
}) => {
  // Find starting index from initialPostId
  const initialIndex = Math.max(
    0,
    posts.findIndex((p) => p.id === initialPostId)
  );

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [showMuteBadge, setShowMuteBadge] = useState<boolean>(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<'play' | 'pause' | null>(null);
  const [expandedCaption, setExpandedCaption] = useState<boolean>(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState<boolean>(false);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});

  // Refs for video elements and swipe handling
  const videoRefs = useRef<{ [index: number]: HTMLVideoElement | null }>({});
  const touchStartYRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const lastWheelTimeRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPost: Post | undefined = posts[activeIndex] || posts[0];

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (activeIndex < posts.length - 1 && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setActiveIndex((prev) => prev + 1);
      setExpandedCaption(false);
      setVideoProgress(0);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 350);
    }
  }, [activeIndex, posts.length]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0 && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setActiveIndex((prev) => prev - 1);
      setExpandedCaption(false);
      setVideoProgress(0);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 350);
    }
  }, [activeIndex]);

  // Video autoplay & state management whenever activeIndex changes
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idxStr, vid]) => {
      const idx = Number(idxStr);
      if (!vid) return;
      if (idx === activeIndex) {
        vid.currentTime = 0;
        vid.muted = isMuted;
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // If unmuted autoplay is blocked by browser policy, fallback to muted autoplay
              vid.muted = true;
              setIsMuted(true);
              vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            });
        }
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeIndex, isMuted]);

  // Keep mute state synced
  useEffect(() => {
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.muted = isMuted;
    }
  }, [isMuted, activeIndex]);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCommentsSheet || showProductModal) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
        setShowMuteBadge(true);
        setTimeout(() => setShowMuteBadge(false), 900);
      } else if (e.key === ' ' && currentPost?.mediaType === 'video') {
        e.preventDefault();
        const vid = videoRefs.current[activeIndex];
        if (vid) {
          if (vid.paused) {
            vid.play();
            setIsPlaying(true);
            setShowPlayPauseIcon('play');
          } else {
            vid.pause();
            setIsPlaying(false);
            setShowPlayPauseIcon('pause');
          }
          setTimeout(() => setShowPlayPauseIcon(null), 600);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, currentPost, goToNext, goToPrev, onClose, showCommentsSheet, showProductModal]);

  // Touch Swipe Handlers (TikTok / Reels vertical swipe gestures)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diffY = touchStartYRef.current - endY;
    const duration = Date.now() - touchStartTimeRef.current;

    // Minimum distance for swipe threshold: 45px or quick flick
    if (Math.abs(diffY) > 45 || (Math.abs(diffY) > 25 && duration < 250)) {
      if (diffY > 0) {
        // Swiped UP -> Next post
        goToNext();
      } else {
        // Swiped DOWN -> Previous post
        goToPrev();
      }
    }
  };

  // Mouse Wheel scroll support with debounce
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 400) return;

    if (Math.abs(e.deltaY) > 30) {
      lastWheelTimeRef.current = now;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // Tap handler on media:
  // - Double-tap: likes post with heart burst animation
  // - Single-tap on video: toggles mute / unmute with floating sound indicator
  const handleMediaTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 280;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD) {
      // Double tap detected -> Like post
      if (currentPost && !currentPost.isLiked) {
        onToggleLike(currentPost.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      lastTapTimeRef.current = 0;
      return;
    }

    lastTapTimeRef.current = now;

    // For single tap on video: toggle mute/unmute as requested
    if (currentPost?.mediaType === 'video') {
      setIsMuted((prev) => !prev);
      setShowMuteBadge(true);
      setTimeout(() => setShowMuteBadge(false), 900);
    }
  };

  const handleTimeUpdate = (index: number) => {
    if (index !== activeIndex) return;
    const vid = videoRefs.current[index];
    if (vid && vid.duration) {
      setVideoProgress((vid.currentTime / vid.duration) * 100);
    }
  };

  const toggleFollow = (username: string) => {
    setFollowedUsers((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  if (!currentPost) return null;

  return (
    <div
      id="fullscreen-media-viewer"
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Full-screen media viewer"
    >
      {/* 1. TOP HEADER OVERLAY */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
        {/* Left: Close Button & Brand / Post Index */}
        <div className="flex items-center gap-3">
          <button
            id="fullscreen-viewer-close-btn"
            onClick={onClose}
            aria-label="Close full-screen viewer"
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition shadow-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wide text-white/90">
              {activeIndex + 1} / {posts.length}
            </span>
            <span className="text-[10px] text-white/60 hidden sm:inline">
              Swipe or use ↑ ↓ keys
            </span>
          </div>
        </div>

        {/* Center: Post Category or City if present */}
        {currentPost.category && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-white/15 backdrop-blur-md text-xs font-medium text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentPost.category}</span>
          </div>
        )}

        {/* Right: Sound controls & Fullscreen indicator */}
        <div className="flex items-center gap-2">
          {currentPost.mediaType === 'video' && (
            <button
              id="fullscreen-viewer-mute-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((m) => !m);
                setShowMuteBadge(true);
                setTimeout(() => setShowMuteBadge(false), 900);
              }}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 border border-white/20 text-white flex items-center gap-1.5 backdrop-blur-md transition text-xs font-semibold"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Sound On</span>
                </>
              )}
            </button>
          )}

          <button
            id="fullscreen-viewer-share-top-btn"
            onClick={() => onShare(currentPost)}
            aria-label="Share post"
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition shadow-lg cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN MEDIA STAGE (Vertical Snap Carousel) */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
      >
        {posts.map((post, index) => {
          const isCurrent = index === activeIndex;

          // Render only current and immediate neighbors for optimal memory & performance
          const isNearby = Math.abs(index - activeIndex) <= 1;
          if (!isNearby) return null;

          const isAbove = index < activeIndex;
          const isBelow = index > activeIndex;

          let transformClass = 'translate-y-0 opacity-100 scale-100 z-10';
          if (isAbove) transformClass = '-translate-y-full opacity-0 pointer-events-none z-0';
          if (isBelow) transformClass = 'translate-y-full opacity-0 pointer-events-none z-0';

          return (
            <div
              key={post.id}
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-350 ease-out ${transformClass}`}
            >
              {/* Subtle ambient colored blur background for photos and videos */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 pointer-events-none transition-opacity duration-700"
                style={{ backgroundImage: `url(${post.mediaUrl})` }}
              />

              {/* Media Content Container */}
              <div
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                onClick={handleMediaTap}
              >
                {post.mediaType === 'video' ? (
                  mediaErrors[post.id] || (!post.mediaUrl && !post.thumbnailUrl) ? (
                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                      <img
                        src={post.thumbnailUrl || createVideoFallbackDataUrl(post.caption)}
                        alt={post.caption || 'Video preview'}
                        className={`max-w-full max-h-full object-contain ${post.filter || ''} drop-shadow-2xl`}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = createVideoFallbackDataUrl(post.caption);
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                        <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center mb-2 shadow-2xl">
                          <Play className="w-8 h-8 fill-white ml-1 text-white" />
                        </div>
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white shadow-lg">
                          🎬 Video Reel Preview
                        </span>
                      </div>
                    </div>
                  ) : (
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                        if (el && isCurrent) {
                          el.muted = isMuted;
                        }
                      }}
                      src={post.mediaUrl}
                      poster={post.thumbnailUrl}
                      loop
                      playsInline
                      preload="auto"
                      onError={() => {
                        setMediaErrors((prev) => ({ ...prev, [post.id]: true }));
                      }}
                      onTimeUpdate={() => handleTimeUpdate(index)}
                      className={`max-w-full max-h-full object-contain ${post.filter || ''}`}
                    />
                  )
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = createPhotoFallbackDataUrl(post.caption);
                    }}
                    className={`max-w-full max-h-full object-contain ${post.filter || ''} drop-shadow-2xl`}
                    loading={isCurrent ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Momentary Double-Tap Heart Burst Animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-ping duration-700">
            <Heart className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.9)]" />
          </div>
        )}

        {/* Momentary Sound Mute/Unmute Badge Popup */}
        {showMuteBadge && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="p-5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-2xl flex items-center justify-center animate-scale-up">
              {isMuted ? (
                <VolumeX className="w-10 h-10 text-rose-400" />
              ) : (
                <Volume2 className="w-10 h-10 text-emerald-400" />
              )}
            </div>
          </div>
        )}

        {/* Play/Pause momentary icon */}
        {showPlayPauseIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              {showPlayPauseIcon === 'play' ? (
                <Play className="w-7 h-7 fill-white ml-0.5" />
              ) : (
                <Pause className="w-7 h-7 fill-white" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. DESKTOP / TABLET VERTICAL NAVIGATION ARROWS */}
      <div className="hidden md:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <button
          id="fullscreen-viewer-nav-up"
          onClick={goToPrev}
          disabled={activeIndex === 0}
          aria-label="Previous post (Up arrow)"
          className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition shadow-xl ${
            activeIndex === 0
              ? 'bg-black/30 border-white/10 text-white/30 cursor-not-allowed'
              : 'bg-black/60 hover:bg-black/90 active:scale-95 border-white/20 text-white hover:text-amber-400 cursor-pointer'
          }`}
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <button
          id="fullscreen-viewer-nav-down"
          onClick={goToNext}
          disabled={activeIndex === posts.length - 1}
          aria-label="Next post (Down arrow)"
          className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition shadow-xl ${
            activeIndex === posts.length - 1
              ? 'bg-black/30 border-white/10 text-white/30 cursor-not-allowed'
              : 'bg-black/60 hover:bg-black/90 active:scale-95 border-white/20 text-white hover:text-amber-400 cursor-pointer'
          }`}
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* 4. RIGHT ACTIONS COLUMN (Reels / TikTok Style) */}
      <div className="absolute right-3 sm:right-6 bottom-20 sm:bottom-24 z-30 flex flex-col items-center gap-4.5 pointer-events-auto">
        {/* Creator Avatar with Follow '+' button */}
        <div className="relative mb-1">
          <button
            id={`fullscreen-author-avatar-${currentPost.id}`}
            onClick={() => {
              onClose();
              onViewUser(currentPost.username);
            }}
            className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 active:scale-95 transition cursor-pointer"
            aria-label={`View profile of ${currentPost.username}`}
          >
            <img
              src={currentPost.userAvatar}
              alt={currentPost.username}
              className="w-full h-full rounded-full object-cover border-2 border-black"
            />
          </button>
          {!followedUsers[currentPost.username] && currentPost.username !== currentUser.username && (
            <button
              id={`fullscreen-follow-btn-${currentPost.id}`}
              onClick={() => toggleFollow(currentPost.username)}
              aria-label={`Follow ${currentPost.username}`}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md active:scale-90 transition border border-black cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
            </button>
          )}
          {followedUsers[currentPost.username] && currentPost.username !== currentUser.username && (
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border border-black pointer-events-none">
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            id={`fullscreen-like-btn-${currentPost.id}`}
            onClick={() => {
              onToggleLike(currentPost.id);
              if (!currentPost.isLiked) {
                setShowHeartBurst(true);
                setTimeout(() => setShowHeartBurst(false), 800);
              }
            }}
            aria-label={currentPost.isLiked ? 'Unlike post' : 'Like post'}
            className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 active:scale-90 backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-lg cursor-pointer"
          >
            <Heart
              className={`w-6 h-6 transition-transform ${
                currentPost.isLiked
                  ? 'fill-rose-500 text-rose-500 scale-110'
                  : 'text-white'
              }`}
            />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">
            {currentPost.likesCount.toLocaleString()}
          </span>
        </div>

        {/* Comments Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            id={`fullscreen-comment-btn-${currentPost.id}`}
            onClick={() => setShowCommentsSheet(true)}
            aria-label="View comments"
            className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 active:scale-90 backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-lg cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">
            {currentPost.comments.length}
          </span>
        </div>

        {/* Bookmark / Save Button */}
        <button
          id={`fullscreen-save-btn-${currentPost.id}`}
          onClick={() => onToggleSave(currentPost.id)}
          aria-label={currentPost.isSaved ? 'Remove from saved' : 'Save post'}
          className="w-11 h-11 rounded-full bg-black/55 hover:bg-black/80 active:scale-90 backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-lg cursor-pointer"
        >
          <Bookmark
            className={`w-5 h-5 transition-colors ${
              currentPost.isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'
            }`}
          />
        </button>

        {/* Tagged Product / WhatsApp Button */}
        {currentPost.productTag && (
          <button
            id={`fullscreen-product-btn-${currentPost.id}`}
            onClick={() => setShowProductModal(true)}
            aria-label={`Buy ${currentPost.productTag.title} on WhatsApp`}
            className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 backdrop-blur-md border border-emerald-400/50 flex items-center justify-center transition shadow-lg animate-bounce cursor-pointer"
            title={`Buy ${currentPost.productTag.title}`}
          >
            <ShoppingBag className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Spinning Vinyl Audio Badge */}
        {currentPost.audioTitle && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-950 border border-white/30 p-1 flex items-center justify-center shadow-lg animate-spin" style={{ animationDuration: '4s' }}>
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Music className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>
        )}
      </div>

      {/* 5. BOTTOM INFO SECTION OVERLAY */}
      <footer className="absolute bottom-0 left-0 right-16 sm:right-24 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => {
              onClose();
              onViewUser(currentPost.username);
            }}
            className="font-bold text-sm sm:text-base text-white hover:underline flex items-center gap-1 drop-shadow-md cursor-pointer"
          >
            <span>{currentPost.username}</span>
            {currentPost.isVerified && (
              <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-400 flex-shrink-0" />
            )}
          </button>

          {currentPost.location && (
            <span className="flex items-center gap-1 text-[11px] text-white/75 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
              <MapPin className="w-2.5 h-2.5 text-rose-400" />
              <span className="truncate max-w-[130px]">{currentPost.location}</span>
            </span>
          )}

          <span className="text-white/40 text-xs">•</span>
          <span className="text-xs text-white/60">{currentPost.timestamp}</span>
        </div>

        {/* Caption */}
        <div className="mb-2.5 max-w-xl">
          <p
            className={`text-xs sm:text-sm text-white/95 leading-relaxed drop-shadow-md ${
              expandedCaption ? '' : 'line-clamp-2'
            }`}
          >
            {currentPost.caption}
          </p>
          {currentPost.caption.length > 80 && (
            <button
              onClick={() => setExpandedCaption((prev) => !prev)}
              className="text-xs font-semibold text-white/70 hover:text-white mt-0.5 underline cursor-pointer"
            >
              {expandedCaption ? 'Show less' : '...more'}
            </button>
          )}
        </div>

        {/* Tags */}
        {currentPost.tags && currentPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {currentPost.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-sky-300 drop-shadow"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Audio marquee / Info */}
        {currentPost.audioTitle && (
          <div className="flex items-center gap-1.5 text-xs text-white/80 bg-black/40 border border-white/15 px-2.5 py-1 rounded-full w-fit backdrop-blur-md">
            <Music className="w-3 h-3 text-rose-400 animate-pulse" />
            <span className="truncate max-w-[200px]">{currentPost.audioTitle}</span>
          </div>
        )}

        {/* Product Tag Badge if tagged */}
        {currentPost.productTag && (
          <div className="mt-2">
            <button
              onClick={() => setShowProductModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/50 text-white text-xs font-semibold backdrop-blur-md transition active:scale-95 cursor-pointer shadow-lg"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentPost.productTag.title}</span>
              <span className="bg-emerald-500 text-black px-1.5 py-0.2 rounded font-bold text-[10px]">
                ₹{currentPost.productTag.price.toLocaleString('en-IN')}
              </span>
            </button>
          </div>
        )}
      </footer>

      {/* 6. VIDEO PROGRESS BAR (At the very bottom edge) */}
      {currentPost.mediaType === 'video' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 transition-all duration-100"
            style={{ width: `${videoProgress}%` }}
          />
        </div>
      )}

      {/* 7. COMMENTS BOTTOM SHEET (Integrated inside full-screen viewer) */}
      {showCommentsSheet && (
        <CommentsBottomSheet
          isOpen={showCommentsSheet}
          onClose={() => setShowCommentsSheet(false)}
          comments={currentPost.comments}
          currentUser={currentUser}
          targetAuthorUsername={currentPost.username}
          commentsCount={currentPost.comments.length}
          onAddComment={(text, mediaUrl, mediaType) => {
            onAddComment(currentPost.id, text, mediaUrl, mediaType);
          }}
          onViewUser={(u) => {
            setShowCommentsSheet(false);
            onClose();
            onViewUser(u);
          }}
        />
      )}

      {/* 8. PRODUCT WHATSAPP MODAL (Integrated inside full-screen viewer) */}
      {showProductModal && currentPost.productTag && (
        <ProductWhatsAppModal
          isOpen={showProductModal}
          product={currentPost.productTag}
          creator={{
            username: currentPost.username,
            avatar: currentPost.userAvatar,
            isVerified: currentPost.isVerified,
          }}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
};
