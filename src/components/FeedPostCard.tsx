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
  Trash2,
  Lock,
  Globe,
  Loader2,
} from 'lucide-react';
import { Post, User, ContentCategory } from '../types';
import { SupportedLanguage, translations } from '../translations';
import { UpiShagunSheet } from './UpiShagunSheet';
import { ProductWhatsAppModal } from './ProductWhatsAppModal';
import { recommendationEngine, inferLanguage } from '../services/recommendationEngine';
import { moderationService } from '../services/moderationService';
import { isSuperAdmin } from '../constants/admin';
import {
  createVideoFallbackDataUrl,
  createPhotoFallbackDataUrl,
} from '../utils/imageCompressor';
import { safeSlice, safeEncodeURIComponent } from '../utils/safeEncoding';

interface FeedPostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onShare: (post: Post) => void;
  onOpenDetail: (post: Post) => void;
  onOpenFullScreen?: (post: Post) => void;
  onOpenReel?: (post: Post) => void;
  onOpenComments?: (post: Post) => void;
  onViewUser: (username: string) => void;
  onNotInterested?: (postId: string, category?: ContentCategory) => void;
  onShowMore?: (category?: ContentCategory) => void;
  onReportPost?: (post: Post) => void;
  onBlockUser?: (username: string) => void;
  onDeletePost?: (postId: string) => void;
  onUpdatePostPrivacy?: (postId: string, privacy: 'public' | 'private') => void;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
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
  onOpenReel,
  onOpenComments,
  onViewUser,
  onNotInterested,
  onShowMore,
  onReportPost,
  onBlockUser,
  onDeletePost,
  onUpdatePostPrivacy,
  isFollowing = false,
  onToggleFollow,
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
  const [isDismissed, setIsDismissed] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const t = translations[currentLanguage];

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const isIntersectingRef = useRef(false);
  const lastTapTimeRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // IntersectionObserver for autoplay on scroll
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (videoRef.current) {
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (post.mediaType !== 'video') return;

    const currentMediaContainer = mediaContainerRef.current;
    if (!currentMediaContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const vid = videoRef.current;
          if (!vid) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            isIntersectingRef.current = true;
            vid.muted = isMutedRef.current;
            const playPromise = vid.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                })
                .catch(() => {
                  // Autoplay blocked by browser policy without user gesture -> play muted reliably
                  vid.muted = true;
                  vid.play().then(() => {
                    setIsPlaying(true);
                    setIsBuffering(false);
                  }).catch(() => setIsPlaying(false));
                });
            }
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.15) {
            isIntersectingRef.current = false;
            vid.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0.1, 0.2, 0.45] }
    );

    observer.observe(currentMediaContainer);

    return () => {
      observer.disconnect();
    };
  }, [post.mediaType]);

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
    const DOUBLE_TAP_DELAY = 260;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered -> cancel pending single tap & Like post
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
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

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    // Video posts: When user taps anywhere on the video post, immediately open and redirect to full-screen ReelsView
    if (post.mediaType === 'video') {
      tapTimeoutRef.current = setTimeout(() => {
        if (onOpenReel) {
          onOpenReel(post);
        } else if (onOpenFullScreen) {
          onOpenFullScreen({
            ...post,
            mediaUrl: post.mediaUrl || post.thumbnailUrl || '',
          });
        }
        tapTimeoutRef.current = null;
      }, 160);
      return;
    }

    // Photo posts: single tap opens full-screen viewer as requested
    if (onOpenFullScreen) {
      const activeImageUrl = post.mediaUrl || post.thumbnailUrl || '';
      onOpenFullScreen({
        ...post,
        mediaUrl: activeImageUrl,
      });
      return;
    }

    onOpenDetail(post);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    recommendationEngine.recordLanguageInteraction(inferLanguage(post), 'comment');
    setCommentText('');
  };

  const isLongCaption = post.caption.length > 90;

  const handleReportPostAction = () => {
    setShowOptionsMenu(false);
    setIsDismissed(true);
    moderationService.reportItem({
      id: post.id,
      type: 'post',
      username: post.username,
      reason: 'Inappropriate content',
    });
    if (onReportPost) {
      onReportPost(post);
    }
  };

  const isOwner = Boolean(
    isSuperAdmin(currentUser) ||
    (currentUser?.id && post?.userId && currentUser.id === post.userId) ||
    (currentUser?.username && post?.username && (
      currentUser.username.toLowerCase().replace(/^@/, '').trim() ===
      post.username.toLowerCase().replace(/^@/, '').trim()
    ))
  );

  const handleDeletePostAction = () => {
    setShowOptionsMenu(false);
    setIsDismissed(true);
    moderationService.deletePostPermanently(post.id);
    if (onDeletePost) {
      onDeletePost(post.id);
    }
  };

  const handleBlockUserAction = () => {
    setShowOptionsMenu(false);
    setIsDismissed(true);
    const clean = post.username.toLowerCase().replace(/^@/, '').trim();
    moderationService.blockUser(clean);
    if (onBlockUser) {
      onBlockUser(post.username);
    }
  };

  if (isDismissed) {
    return null;
  }

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
            <div className="flex items-center gap-1.5 leading-none flex-wrap">
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

              {/* Follow / Following Button right next to creator's username */}
              {!isOwner && (
                <button
                  id={`post-follow-btn-${post.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleFollow) {
                      onToggleFollow();
                    }
                  }}
                  className={`ml-1 px-2.5 py-0.5 text-xs font-semibold rounded-full transition-all duration-150 cursor-pointer active:scale-95 ${
                    isFollowing
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}

              <span className="text-neutral-400 dark:text-neutral-500 text-xs">•</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {post.timestamp}
              </span>
              {(post.privacy === 'private' || post.isPrivate) && (
                <>
                  <span className="text-neutral-400 dark:text-neutral-500 text-xs">•</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Private</span>
                  </span>
                </>
              )}
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
                ref={(el) => {
                  (videoRef as any).current = el;
                  if (el) {
                    el.defaultMuted = isMuted;
                    el.muted = isMuted;
                  }
                }}
                src={post.mediaUrl}
                poster={post.thumbnailUrl}
                autoPlay
                loop
                playsInline
                webkit-playsinline="true"
                muted={isMuted}
                preload="auto"
                onCanPlay={(e) => {
                  const vid = e.currentTarget;
                  if (isIntersectingRef.current && vid.paused) {
                    vid.muted = isMutedRef.current;
                    vid.play().then(() => {
                      setIsPlaying(true);
                      setIsBuffering(false);
                    }).catch(() => {
                      vid.muted = true;
                      vid.play().catch(() => {});
                    });
                  }
                }}
                onLoadedData={(e) => {
                  const vid = e.currentTarget;
                  if (isIntersectingRef.current && vid.paused) {
                    vid.play().then(() => {
                      setIsPlaying(true);
                      setIsBuffering(false);
                    }).catch(() => {});
                  }
                }}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                }}
                onPlay={() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                }}
                onPause={() => setIsPlaying(false)}
                onError={() => {
                  if (videoRef.current && post.mediaUrl && !post.mediaUrl.includes('sample/ForBiggerBlazes')) {
                    videoRef.current.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
                    videoRef.current.load();
                    videoRef.current.play().then(() => {
                      setIsPlaying(true);
                      setIsBuffering(false);
                    }).catch(() => {
                      setVideoError(true);
                    });
                  } else {
                    setVideoError(true);
                  }
                }}
                className={`w-full h-full object-cover ${post.filter ? post.filter : ''}`}
              />

              {/* Buffering Indicator */}
              {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                    <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                  </div>
                </div>
              )}

            {/* Video Badge / Fullscreen expand button */}
            <button
              type="button"
              id={`feed-video-fullscreen-btn-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (tapTimeoutRef.current) {
                  clearTimeout(tapTimeoutRef.current);
                  tapTimeoutRef.current = null;
                }
                if (onOpenReel) {
                  onOpenReel(post);
                } else if (onOpenFullScreen) {
                  onOpenFullScreen({
                    ...post,
                    mediaUrl: post.mediaUrl || post.thumbnailUrl || '',
                  });
                }
              }}
              className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-medium transition cursor-pointer border border-white/20 active:scale-95 shadow-md"
              title="Watch full screen in Reels"
            >
              <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Watch Reel</span>
            </button>

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
              type="button"
              id={`feed-mute-btn-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (videoRef.current) {
                  videoRef.current.defaultMuted = false;
                  videoRef.current.muted = nextMuted;
                  videoRef.current.volume = 1.0;
                  if (!nextMuted && videoRef.current.paused) {
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }
              }}
              aria-label={isMuted ? 'Unmute post video' : 'Mute post video'}
              title={isMuted ? 'Tap to unmute' : 'Mute audio'}
              className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white transition active:scale-95 border border-white/20 cursor-pointer shadow-lg"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-semibold tracking-wide">Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-400 tracking-wide">Sound On</span>
                </>
              )}
            </button>

            {/* Persistent Center Play Icon when Paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xl transition-all">
                  <Play className="w-7 h-7 fill-white ml-1 text-white" />
                </div>
              </div>
            )}

            {/* Play/Pause momentary badge feedback */}
            {showPlayPauseIcon && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-2xl animate-in zoom-in-75 duration-200">
                  {showPlayPauseIcon === 'play' ? (
                    <Play className="w-8 h-8 fill-white ml-0.5" />
                  ) : (
                    <Pause className="w-8 h-8 fill-white" />
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
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenFullScreen) {
                onOpenFullScreen({
                  ...post,
                  mediaUrl: post.mediaUrl,
                });
              } else {
                onOpenDetail(post);
              }
            }}
            onError={(e) => {
              const target = e.currentTarget;
              target.src = createPhotoFallbackDataUrl(post.caption);
            }}
            className={`w-full h-full object-cover cursor-pointer ${post.filter ? post.filter : ''}`}
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
            <Heart className="w-24 h-24 text-red-600 fill-red-600 drop-shadow-2xl opacity-95 scale-125 transition-transform" />
          </div>
        )}

        {/* Fullscreen Expand Button Overlay */}
        <button
          id={`feed-fullscreen-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenFullScreen) {
              onOpenFullScreen({
                ...post,
                mediaUrl: post.mediaUrl,
              });
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
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(post.id);
                recommendationEngine.recordLanguageInteraction(inferLanguage(post), 'like');
              }}
              aria-label={post.isLiked ? 'Unlike post' : 'Like post'}
              className="group p-0.5 text-neutral-800 dark:text-neutral-200 hover:opacity-70 transition active:scale-125"
            >
              <Heart
                className={`w-6 h-6 transition-all duration-150 ${
                  post.isLiked ? 'text-red-600 fill-red-600 scale-105' : 'text-neutral-800 dark:text-neutral-200'
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
              href={`https://api.whatsapp.com/send?text=${safeEncodeURIComponent(
                `Check out this post by @${post.username} on Jhalak:\n"${post.caption}"\n${typeof window !== 'undefined' ? window.location.href : ''}`
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
              : `${safeSlice(post.caption, 90)}...`}
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

              {/* Post Privacy Toggle (Owner Only) */}
              {isOwner && onUpdatePostPrivacy && (
                <button
                  id={`post-privacy-toggle-btn-${post.id}`}
                  onClick={() => {
                    const nextPrivacy = post.privacy === 'private' || post.isPrivate ? 'public' : 'private';
                    onUpdatePostPrivacy(post.id, nextPrivacy);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition group cursor-pointer"
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      post.privacy === 'private' || post.isPrivate
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    } group-hover:scale-110 transition`}
                  >
                    {post.privacy === 'private' || post.isPrivate ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">Post Privacy / प्राइवेसी</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          post.privacy === 'private' || post.isPrivate
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {post.privacy === 'private' || post.isPrivate ? '🔒 Private' : '🌐 Public'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      {post.privacy === 'private' || post.isPrivate
                        ? 'Only visible to you. Tap to make Public'
                        : 'Visible to everyone. Tap to make Private'}
                    </p>
                  </div>
                </button>
              )}

              {/* Delete Post for user's own post */}
              {isOwner && (
                <button
                  id={`post-delete-btn-${post.id}`}
                  onClick={handleDeletePostAction}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-left transition text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 group-hover:scale-110 transition">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Delete Post</p>
                    <p className="text-[11px] text-rose-500/80">
                      Permanently delete this post from Jhalak
                    </p>
                  </div>
                </button>
              )}

              {/* Report & Block only for other users' posts */}
              {!isOwner && (
                <>
                  {/* Report Post */}
                  <button
                    id={`post-report-btn-${post.id}`}
                    onClick={handleReportPostAction}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-left transition text-amber-600 dark:text-amber-400 group cursor-pointer"
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
                    onClick={handleBlockUserAction}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left transition text-rose-600 dark:text-rose-400 group cursor-pointer"
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
                </>
              )}
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
