import React, { useState, useRef, useEffect } from 'react';
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
  X,
  Smile,
  Phone,
} from 'lucide-react';
import { Reel, User, Comment } from '../types';
import { SupportedLanguage, translations } from '../translations';

interface ReelsViewProps {
  reels: Reel[];
  currentUser: User;
  onToggleLike: (reelId: string) => void;
  onToggleSave: (reelId: string) => void;
  onAddComment: (reelId: string, text: string) => void;
  onShare: (reel: Reel) => void;
  onViewUser: (username: string) => void;
  currentLanguage?: SupportedLanguage;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  reels,
  currentUser,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onShare,
  onViewUser,
  currentLanguage = 'en',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<'play' | 'pause' | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);

  const t = translations[currentLanguage];

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapTimeRef = useRef(0);

  const currentReel = reels[activeIndex] || reels[0];

  // Pause non-active videos and play the active one
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === activeIndex) {
        video.currentTime = 0;
        video.muted = isMuted;
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay policy fallback
            video.muted = true;
            video.play().catch(() => setIsPlaying(false));
          });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
    setProgress(0);
    setExpandedCaption(false);
  }, [activeIndex]);

  // Sync mute across videos
  useEffect(() => {
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      currentVideo.muted = isMuted;
    }
  }, [isMuted, activeIndex]);

  // Handle Video Time Update for progress bar
  const handleTimeUpdate = (index: number) => {
    if (index !== activeIndex) return;
    const video = videoRefs.current[index];
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_GAP = 280;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_GAP) {
      // Double tap triggered -> like reel
      if (!currentReel.isLiked) {
        onToggleLike(currentReel.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      lastTapTimeRef.current = 0;
      return;
    }

    lastTapTimeRef.current = now;

    // Single click toggles play/pause
    const currentVideo = videoRefs.current[activeIndex];
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play().then(() => {
          setIsPlaying(true);
          setShowPlayPauseIcon('play');
          setTimeout(() => setShowPlayPauseIcon(null), 600);
        });
      } else {
        currentVideo.pause();
        setIsPlaying(false);
        setShowPlayPauseIcon('pause');
        setTimeout(() => setShowPlayPauseIcon(null), 600);
      }
    }
  };

  const toggleFollow = (username: string) => {
    setFollowedMap((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const goToNext = () => {
    if (activeIndex < reels.length - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
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
  }, [activeIndex, reels.length]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(currentReel.id, commentInput);
    setCommentInput('');
  };

  return (
    <div
      id="reels-view-container"
      className="relative w-full h-[calc(100vh-4rem)] md:h-screen flex items-center justify-center bg-black overflow-hidden select-none"
    >
      {/* Reel Card Stage */}
      <div className="relative w-full h-full max-w-[420px] max-h-[820px] md:rounded-2xl overflow-hidden shadow-2xl bg-neutral-950 flex flex-col justify-end">
        {/* Videos Carousel Container */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full cursor-pointer"
          onClick={handleVideoClick}
        >
          {reels.map((reel, index) => {
            const isCurrent = index === activeIndex;

            return (
              <div
                key={reel.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={reel.videoUrl}
                  loop
                  playsInline
                  muted={isMuted}
                  preload={index <= 2 ? 'auto' : 'metadata'}
                  onTimeUpdate={() => handleTimeUpdate(index)}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}

          {/* Vignette Gradients for Legibility */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-20" />

          {/* Heart burst on double tap */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-500">
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl opacity-90 scale-125" />
            </div>
          )}

          {/* Temporary Play/Pause Flash Icon */}
          {showPlayPauseIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                {showPlayPauseIcon === 'play' ? (
                  <Play className="w-8 h-8 fill-white ml-1" />
                ) : (
                  <Pause className="w-8 h-8 fill-white" />
                )}
              </div>
            </div>
          )}

          {/* Top Bar on Reel: Title & Audio status */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30 text-white">
            <span className="font-bold text-lg drop-shadow-md tracking-wide">
              {t.reels}
            </span>

            <div className="flex items-center gap-2">
              <button
                id="reel-mute-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((prev) => !prev);
                }}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Left: Creator Info, Caption, Indian Audio Tag */}
          <div className="absolute bottom-4 left-4 right-16 z-30 text-white flex flex-col gap-2">
            {/* User Details */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
                {followedMap[currentReel.username] ? t.followingBtn : t.follow}
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

            {/* Trending Audio Tag (Bollywood / Punjabi / Indie Hindi Beats) */}
            <div className="flex items-center gap-2 mt-0.5 text-xs text-white/90 bg-white/10 backdrop-blur-md py-1 px-2.5 rounded-full w-fit max-w-full">
              <Music
                className={`w-3.5 h-3.5 text-rose-400 flex-shrink-0 ${
                  isPlaying ? 'animate-spin [animation-duration:4s]' : ''
                }`}
              />
              <span className="truncate text-[11px] font-medium tracking-wide">
                {currentReel.audioTitle}
              </span>
            </div>
          </div>

          {/* Right Action Bar: Like, Comments, Share, Save, Audio Disc */}
          <div className="absolute bottom-4 right-3 z-30 flex flex-col items-center gap-4 text-white">
            {/* Like */}
            <button
              id="reel-action-like"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(currentReel.id);
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
              <span className="text-[11px] font-semibold mt-1 drop-shadow-md">
                {currentReel.likesCount.toLocaleString()}
              </span>
            </button>

            {/* Comments Drawer Trigger */}
            <button
              id="reel-action-comments"
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentsDrawer(true);
              }}
              className="flex flex-col items-center group transition active:scale-110"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                <MessageCircle className="w-6 h-6 text-white stroke-[2]" />
              </div>
              <span className="text-[11px] font-semibold mt-1 drop-shadow-md">
                {currentReel.comments.length}
              </span>
            </button>

            {/* Share */}
            <button
              id="reel-action-share"
              onClick={(e) => {
                e.stopPropagation();
                onShare(currentReel);
              }}
              className="flex flex-col items-center group transition active:scale-110"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
                <Send className="w-6 h-6 text-white stroke-[2]" />
              </div>
              <span className="text-[11px] font-semibold mt-1 drop-shadow-md">{t.share}</span>
            </button>

            {/* Direct WhatsApp Share */}
            <a
              id="reel-action-whatsapp"
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Watch this Reel by @${currentReel.username} on Jhalak:\n"${currentReel.caption}"\n${window.location.href}`
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
              <span className="text-[10px] font-semibold mt-1 text-[#25D366] drop-shadow-md">
                WhatsApp
              </span>
            </a>

            {/* Save */}
            <button
              id="reel-action-save"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(currentReel.id);
              }}
              className="flex flex-col items-center group transition active:scale-110"
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

            {/* Rotating Music Disc with Note */}
            <div className="relative mt-2">
              <div
                className={`w-9 h-9 rounded-full border-2 border-neutral-700 bg-neutral-900 overflow-hidden shadow-lg flex items-center justify-center p-0.5 ${
                  isPlaying ? 'animate-spin [animation-duration:4s]' : ''
                }`}
              >
                <img
                  src={currentReel.userAvatar}
                  alt="Music Cover"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {/* Music ripple note */}
              {isPlaying && (
                <div className="absolute -top-3 -right-1 text-white/70 text-xs animate-bounce pointer-events-none">
                  ♪
                </div>
              )}
            </div>
          </div>

          {/* Thin Video Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
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
          {activeIndex + 1} / {reels.length}
        </span>

        <button
          id="reel-nav-next"
          onClick={goToNext}
          disabled={activeIndex === reels.length - 1}
          aria-label="Next reel"
          className="p-3 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition backdrop-blur-md"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Comments Drawer Modal for Reels */}
      {showCommentsDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end md:items-center"
          onClick={() => setShowCommentsDrawer(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 text-white rounded-t-3xl md:rounded-2xl h-[70vh] flex flex-col overflow-hidden border border-neutral-800 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-semibold text-sm">{t.comments}</span>
              <button
                onClick={() => setShowCommentsDrawer(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentReel.comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-xs py-10">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                  {t.noCommentsYet}
                </div>
              ) : (
                currentReel.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <img
                      src={c.avatar}
                      alt={c.username}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {c.username}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {c.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form
              onSubmit={handleCommentSubmit}
              className="p-3 border-t border-neutral-800 flex items-center gap-2 bg-neutral-950"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-7 h-7 rounded-full object-cover"
              />
              <input
                id="reel-comment-input"
                type="text"
                placeholder={`${t.addComment} for ${currentReel.username}...`}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-neutral-900 text-white text-xs px-3 py-2 rounded-full border border-neutral-800 focus:outline-none focus:border-neutral-600 placeholder:text-neutral-500"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="text-xs font-semibold text-sky-400 disabled:opacity-40 hover:text-sky-300 px-2 py-1 transition"
              >
                {t.post}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
