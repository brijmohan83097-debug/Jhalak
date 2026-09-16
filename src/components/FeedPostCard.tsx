import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Smile,
  BadgeCheck,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Clapperboard,
  Music,
  Phone,
  EyeOff,
  Sparkles,
  X,
  Check,
  Flag,
  Ban,
  Gift,
  ShoppingBag,
  Maximize2,
} from 'lucide-react';
import { Post, User, ContentCategory } from '../types';
import { SupportedLanguage, translations } from '../translations';
import { UpiShagunSheet } from './UpiShagunSheet';
import { ProductWhatsAppModal } from './ProductWhatsAppModal';
import { recommendationEngine, inferLanguage } from '../services/recommendationEngine';
import {
  createVideoFallbackDataUrl,
  createPhotoFallbackDataUrl,
} from '../utils/imageCompressor';

interface FeedPostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onShare: (post: Post) => void;
  onOpenDetail: (post: Post) => void;
  onOpenFullScreen?: (post: Post) => void;
  onOpenComments?: (post: Post) => void;
  onViewUser: (username: string) => void;
  onNotInterested?: (postId: string, category?: ContentCategory) => void;
  onShowMore?: (category?: ContentCategory) => void;
  onReportPost?: (post: Post) => void;
  onBlockUser?: (username: string) => void;
  currentLanguage?: SupportedLanguage;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  currentUser,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onShare,
  onOpenDetail,
  onOpenFullScreen,
  onOpenComments,
  onViewUser,
  onNotInterested,
  onShowMore,
  onReportPost,
  onBlockUser,
  currentLanguage = 'en',
}) => {
  const [commentText, setCommentText] = useState('');
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showShagunSheet, setShowShagunSheet] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<'play' | 'pause' | null>(null);
  const [videoError, setVideoError] = useState(false);

  const t = translations[currentLanguage];

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const lastTapTimeRef = useRef(0);

  // IntersectionObserver for autoplay on scroll
  useEffect(() => {
    if (post.mediaType !== 'video') return;

    const currentMediaContainer = mediaContainerRef.current;
    if (!currentMediaContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            videoRef.current.muted = isMuted;
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                // Autoplay blocked by browser policy without user gesture
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(() => setIsPlaying(false));
                }
              });
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0.6] }
    );

    observer.observe(currentMediaContainer);

    return () => {
      observer.disconnect();
    };
  }, [post.mediaType, isMuted]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Track video watch time continuously for personalization & automatic Home Feed sorting
  const watchStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (post.mediaType !== 'video') return;

    if (isPlaying) {
      watchStartTimeRef.current = Date.now();
      const interval = setInterval(() => {
        if (watchStartTimeRef.current) {
          const delta = (Date.now() - watchStartTimeRef.current) / 1000;
          if (delta >= 3) {
            recommendationEngine.recordWatchTime(post, delta);
            watchStartTimeRef.current = Date.now();
          }
        }
      }, 3000);

      return () => {
        clearInterval(interval);
        if (watchStartTimeRef.current) {
          const delta = (Date.now() - watchStartTimeRef.current) / 1000;
          if (delta >= 1) {
            recommendationEngine.recordWatchTime(post, delta);
          }
          watchStartTimeRef.current = null;
        }
      };
    } else {
      if (watchStartTimeRef.current) {
        const delta = (Date.now() - watchStartTimeRef.current) / 1000;
        if (delta >= 1) {
          recommendationEngine.recordWatchTime(post, delta);
        }
        watchStartTimeRef.current = null;
      }
    }
  }, [isPlaying, post]);

  const handleMediaClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered -> Like post
      if (!post.isLiked) {
        onToggleLike(post.id);
        recommendationEngine.recordLanguageInteraction(inferLanguage(post), 'like');
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      lastTapTimeRef.current = 0;
      return;
    }

    lastTapTimeRef.current = now;

    // Single tap on photo or video opens full-screen viewer as requested
    if (onOpenFullScreen) {
      onOpenFullScreen(post);
      return;
    }

    // Fallback: single tap on video toggles play/pause, photo opens detail
    if (post.mediaType === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setShowPlayPauseIcon('play');
          setTimeout(() => setShowPlayPauseIcon(null), 600);
        }).catch(() => {
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowPlayPauseIcon('pause');
        setTimeout(() => setShowPlayPauseIcon(null), 600);
      }
    } else {
      onOpenDetail(post);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    recommendationEngine.recordLanguageInteraction(inferLanguage(post), 'comment');
    setCommentText('');
  };

  const isLongCaption = post.caption.length > 90;

  return (
    <article
      id={`feed-post-${post.id}`}
      className="bg-white dark:bg-black border-y md:border md:rounded-2xl border-neutral-200 dark:border-neutral-800/80 mb-4 overflow-hidden transition-colors"
    >
      {/* Post Top Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <div
            onClick={() => onViewUser(post.username)}
            className="cursor-pointer p-[1.5px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 hover:scale-105 transition"
          >
            <div className="bg-white dark:bg-black p-[1.5px] rounded-full">
              <img
                src={post.userAvatar}
                alt={post.username}
                className="w-8 h-8 rounded-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <button
                id={`post-user-btn-${post.id}`}
                onClick={() => onViewUser(post.username)}
                className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 hover:underline inline-flex items-center gap-1"
              >
                <span>{post.username}</span>
                {post.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500 flex-shrink-0" />
                )}
              </button>
              <span className="text-neutral-400 dark:text-neutral-500 text-xs">•</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {post.timestamp}
              </span>
            </div>

            {post.location && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 hover:underline cursor-pointer">
                {post.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.category && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{post.category}</span>
            </span>
          )}
          {post.audioTitle && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded-full">
              <Music className="w-3 h-3 text-rose-500 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="truncate max-w-[110px]">{post.audioTitle}</span>
            </div>
          )}
          <button
            id={`post-more-btn-${post.id}`}
            aria-label="More post options"
            onClick={() => setShowOptionsMenu(true)}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Post Media Container (1:1 aspect ratio or natural) */}
      <div
        ref={mediaContainerRef}
        onClick={handleMediaClick}
        className="relative w-full aspect-square bg-neutral-950 flex items-center justify-center cursor-pointer select-none overflow-hidden"
      >
        {post.mediaType === 'video' ? (
          videoError || (!post.mediaUrl && !post.thumbnailUrl) ? (
            <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
              <img
                src={post.thumbnailUrl || createVideoFallbackDataUrl(post.caption)}
                alt={post.caption || 'Video preview'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = createVideoFallbackDataUrl(post.caption);
                }}
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4">
                <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center mb-2 shadow-lg">
                  <Play className="w-6 h-6 fill-white ml-1 text-white" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/60 border border-white/20">
                  🎬 Video Reel
                </span>
                {post.caption && (
                  <p className="text-xs text-white/90 font-medium max-w-[200px] truncate mt-1.5">
                    {post.caption}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={post.mediaUrl}
                poster={post.thumbnailUrl}
                loop
                playsInline
                muted={isMuted}
                preload="metadata"
                onError={() => {
                  setVideoError(true);
                }}
                className={`w-full h-full object-cover ${post.filter ? post.filter : ''}`}
              />

            {/* Video Badge */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium pointer-events-none">
              <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Video</span>
            </div>

            {/* Tagged Product Pill Overlay on Video */}
            {post.productTag && (
              <div className="absolute top-3 left-3 z-20">
                <button
                  id={`feed-product-tag-pill-${post.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProductModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-white/20 transition active:scale-95 group"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                  <span className="max-w-[130px] truncate">{post.productTag.title}</span>
                  <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[11px] font-bold">
                    ₹{post.productTag.price.toLocaleString('en-IN')}
                  </span>
                </button>
              </div>
            )}

            {/* Floating Mute / Unmute Button */}
            <button
              id={`feed-mute-btn-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => !prev);
              }}
              aria-label={isMuted ? 'Unmute post video' : 'Mute post video'}
              className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition active:scale-95"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white/90" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Play/Pause momentary badge */}
            {showPlayPauseIcon && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                  {showPlayPauseIcon === 'play' ? (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  ) : (
                    <Pause className="w-6 h-6 fill-white" />
                  )}
                </div>
              </div>
            )}
          </>
          )
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className={`w-full h-full object-cover ${post.filter ? post.filter : ''}`}
            loading="lazy"
          />
        )}

        {/* Tagged Product Pill Overlay on Image */}
        {post.mediaType !== 'video' && post.productTag && (
          <div className="absolute top-3 left-3 z-20">
            <button
              id={`feed-product-tag-pill-img-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowProductModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold shadow-lg border border-white/20 transition active:scale-95 group"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
              <span className="max-w-[130px] truncate">{post.productTag.title}</span>
              <span className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[11px] font-bold">
                ₹{post.productTag.price.toLocaleString('en-IN')}
              </span>
            </button>
          </div>
        )}

        {/* Center Heart Burst on double tap */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-500">
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl opacity-90 scale-125 transition-transform" />
          </div>
        )}

        {/* Fullscreen Expand Button Overlay */}
        <button
          id={`feed-fullscreen-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenFullScreen) {
              onOpenFullScreen(post);
            } else {
              onOpenDetail(post);
            }
          }}
          aria-label="Open full-screen viewer"
          title="Open immersive full-screen viewer"
          className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white transition active:scale-95 flex items-center gap-1.5 border border-white/15 text-[11px] font-medium shadow-md group"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition" />
          <span className="hidden sm:inline">Full Screen</span>
        </button>
      </div>

      {/* Action Buttons Row */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              id={`like-btn-${post.id}`}
              onClick={() => {
                onToggleLike(post.id);
                recommendationEngine.recordLanguageInteraction(inferLanguage(post), 'like');
              }}
              aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
              className="group p-0.5 text-neutral-800 dark:text-neutral-200 hover:opacity-70 transition active:scale-125"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  post.isLiked ? 'text-rose-500 fill-rose-500' : ''
                }`}
              />
            </button>

            <button
              id={`comment-btn-${post.id}`}
              onClick={() => (onOpenComments ? onOpenComments(post) : onOpenDetail(post))}
              aria-label={t.comment}
              className="p-0.5 text-neutral-800 dark:text-neutral-200 hover:opacity-70 transition"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            <button
              id={`share-btn-${post.id}`}
              onClick={() => onShare(post)}
              aria-label={t.share}
              className="p-0.5 text-neutral-800 dark:text-neutral-200 hover:opacity-70 transition"
            >
              <Send className="w-6 h-6" />
            </button>

            {/* Direct WhatsApp Share Button */}
            <a
              id={`whatsapp-share-btn-${post.id}`}
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Check out this post by @${post.username} on Jhalak:\n"${post.caption}"\n${window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Share on WhatsApp"
              title="Share on WhatsApp"
              className="p-0.5 text-[#25D366] hover:scale-115 active:scale-95 transition-transform flex items-center justify-center group"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#25D366] fill-[#25D366] transition-transform group-hover:drop-shadow-[0_0_8px_rgba(37,211,102,0.7)]" />
                <Phone className="w-2.5 h-2.5 text-white fill-white absolute -rotate-12" />
              </div>
            </a>

            {/* UPI Shagun Tip Button */}
            <button
              id={`shagun-btn-${post.id}`}
              onClick={() => setShowShagunSheet(true)}
              aria-label="Send UPI Shagun Tip"
              title="Send UPI Shagun Tip to creator"
              className="p-0.5 text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:scale-115 active:scale-95 transition-transform flex items-center justify-center"
            >
              <Gift className="w-5 h-5" />
            </button>
          </div>

          <button
            id={`save-btn-${post.id}`}
            onClick={() => {
              onToggleSave(post.id);
              recommendationEngine.recordLanguageInteraction(inferLanguage(post), 'save');
            }}
            aria-label={post.isSaved ? 'Unsave post' : 'Save post'}
            className="p-0.5 text-neutral-800 dark:text-neutral-200 hover:opacity-70 transition"
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                post.isSaved ? 'text-neutral-900 dark:text-white fill-neutral-900 dark:fill-white' : ''
              }`}
            />
          </button>
        </div>

        {/* Likes count */}
        <div className="font-semibold text-sm text-neutral-900 dark:text-white mb-1">
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? t.like : t.like}s
        </div>

        {/* Caption */}
        <div className="text-sm text-neutral-900 dark:text-neutral-100">
          <button
            onClick={() => onViewUser(post.username)}
            className="font-semibold mr-1.5 hover:underline"
          >
            {post.username}
          </button>
          <span>
            {showFullCaption || !isLongCaption
              ? post.caption
              : `${post.caption.slice(0, 90)}...`}
          </span>
          {isLongCaption && (
            <button
              onClick={() => setShowFullCaption((prev) => !prev)}
              className="text-neutral-500 dark:text-neutral-400 text-xs ml-1 hover:underline font-medium"
            >
              {showFullCaption ? t.less : t.moreCaption}
            </button>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Product Tag Banner with WhatsApp CTA */}
        {post.productTag && (
          <div
            id={`feed-product-card-${post.id}`}
            onClick={() => setShowProductModal(true)}
            className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/30 hover:border-emerald-500/60 transition cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Product Tag
                  </span>
                  <span className="text-neutral-400 text-[10px]">•</span>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {post.productTag.title}
                  </span>
                </div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{post.productTag.price.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowProductModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition flex-shrink-0 shadow-xs"
            >
              <span>Chat on WhatsApp</span>
            </button>
          </div>
        )}

        {/* Comments Count / View all */}
        {post.comments.length > 0 && (
          <button
            onClick={() => (onOpenComments ? onOpenComments(post) : onOpenDetail(post))}
            className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 hover:underline block cursor-pointer text-left"
          >
            {t.viewAllComments} ({post.comments.length})
          </button>
        )}

        {/* Recent Comments Preview */}
        {post.comments.slice(-2).map((c) => (
          <div
            key={c.id}
            onClick={() => (onOpenComments ? onOpenComments(post) : onOpenDetail(post))}
            className="text-xs text-neutral-800 dark:text-neutral-300 mt-1 flex items-baseline gap-1.5 cursor-pointer hover:opacity-80 transition"
          >
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{c.username}</span>
            <span className="text-neutral-700 dark:text-neutral-300 truncate">{c.text}</span>
          </div>
        ))}
      </div>

      {/* Inline Comment Input Box */}
      <form
        onSubmit={handleCommentSubmit}
        className="hidden md:flex items-center px-3.5 py-2.5 border-t border-neutral-100 dark:border-neutral-800/60"
      >
        <button
          type="button"
          aria-label="Add emoji"
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 mr-2.5"
          onClick={() => setCommentText((prev) => prev + ' ❤️')}
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          id={`comment-input-${post.id}`}
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t.addComment}
          className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
        />
        <button
          id={`post-comment-btn-${post.id}`}
          type="submit"
          disabled={!commentText.trim()}
          className="text-sm font-semibold text-sky-500 hover:text-sky-600 disabled:opacity-40 transition ml-2"
        >
          {t.post}
        </button>
      </form>

      {/* 3-Dot Options Bottom Sheet / Modal */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center transition-opacity"
          onClick={() => setShowOptionsMenu(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-t-3xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500">Post by</span>
                <span className="text-xs font-bold">@{post.username}</span>
                {post.category && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowOptionsMenu(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {/* Show More Like This */}
              <button
                onClick={() => {
                  onShowMore?.(post.category);
                  setShowOptionsMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">{t.showMoreLikeThis}</p>
                  <p className="text-[11px] text-neutral-500">
                    See more content like this {post.category ? `(${post.category})` : ''}
                  </p>
                </div>
              </button>

              {/* Not Interested */}
              <button
                onClick={() => {
                  onNotInterested?.(post.id, post.category);
                  setShowOptionsMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition text-rose-500"
              >
                <EyeOff className="w-4 h-4 text-rose-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">{t.notInterested}</p>
                  <p className="text-[11px] text-neutral-500">
                    Hide this post & reduce similar recommendations
                  </p>
                </div>
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  onShare(post);
                  setShowOptionsMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition"
              >
                <Send className="w-4 h-4 text-neutral-500" />
                <div className="flex-1">
                  <p className="text-xs font-semibold">{t.share}</p>
                  <p className="text-[11px] text-neutral-500">Share via direct link or social apps</p>
                </div>
              </button>

              {/* Send UPI Shagun Tip */}
              <button
                id={`post-shagun-tip-btn-${post.id}`}
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowShagunSheet(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-left transition text-amber-600 dark:text-amber-400 group"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500/20 to-rose-500/20 text-amber-500 group-hover:scale-110 transition border border-amber-500/30">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">Send UPI Shagun Tip 🎁</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Send ₹10, ₹50, ₹100 direct to @{post.username} via UPI
                  </p>
                </div>
              </button>

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

              {/* Report Post */}
              <button
                id={`post-report-btn-${post.id}`}
                onClick={() => {
                  setShowOptionsMenu(false);
                  onReportPost?.(post);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-left transition text-amber-600 dark:text-amber-400 group"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition">
                  <Flag className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">Report Post</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Spam, inappropriate, or harassment
                  </p>
                </div>
              </button>

              {/* Block User */}
              <button
                id={`post-block-user-btn-${post.id}`}
                onClick={() => {
                  setShowOptionsMenu(false);
                  onBlockUser?.(post.username);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left transition text-rose-600 dark:text-rose-400 group"
              >
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 group-hover:scale-110 transition">
                  <Ban className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">Block @{post.username}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Hide all posts & content from this creator
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowOptionsMenu(false)}
              className="w-full mt-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:opacity-80 transition"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* UPI Shagun Creator Tipping Sheet */}
      <UpiShagunSheet
        isOpen={showShagunSheet}
        onClose={() => setShowShagunSheet(false)}
        creator={{
          username: post.username,
          name: post.username,
          avatar: post.userAvatar,
        }}
      />

      {/* Product Tag & WhatsApp Enquiry Modal */}
      {post.productTag && (
        <ProductWhatsAppModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          product={post.productTag}
          creator={{
            username: post.username,
            name: post.username,
            avatar: post.userAvatar,
            isVerified: post.isVerified,
          }}
        />
      )}
    </article>
  );
};
