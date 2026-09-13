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
} from 'lucide-react';
import { Post, User } from '../types';
import { SupportedLanguage, translations } from '../translations';

interface FeedPostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onShare: (post: Post) => void;
  onOpenDetail: (post: Post) => void;
  onViewUser: (username: string) => void;
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
  onViewUser,
  currentLanguage = 'en',
}) => {
  const [commentText, setCommentText] = useState('');
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState<'play' | 'pause' | null>(null);

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

  const handleMediaClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered -> Like post
      if (!post.isLiked) {
        onToggleLike(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
      lastTapTimeRef.current = 0;
      return;
    }

    lastTapTimeRef.current = now;

    // Single tap on video toggles play/pause
    if (post.mediaType === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setShowPlayPauseIcon('play');
          setTimeout(() => setShowPlayPauseIcon(null), 600);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowPlayPauseIcon('pause');
        setTimeout(() => setShowPlayPauseIcon(null), 600);
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
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
          {post.audioTitle && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded-full">
              <Music className="w-3 h-3 text-rose-500 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="truncate max-w-[110px]">{post.audioTitle}</span>
            </div>
          )}
          <button
            aria-label="More post options"
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
          <>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              loop
              playsInline
              muted={isMuted}
              preload="metadata"
              className={`w-full h-full object-cover ${post.filter ? post.filter : ''}`}
            />

            {/* Video Badge */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium pointer-events-none">
              <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Video</span>
            </div>

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
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className={`w-full h-full object-cover ${post.filter ? post.filter : ''}`}
            loading="lazy"
          />
        )}

        {/* Center Heart Burst on double tap */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-500">
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl opacity-90 scale-125 transition-transform" />
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              id={`like-btn-${post.id}`}
              onClick={() => onToggleLike(post.id)}
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
              onClick={() => onOpenDetail(post)}
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
          </div>

          <button
            id={`save-btn-${post.id}`}
            onClick={() => onToggleSave(post.id)}
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

        {/* Comments Count / View all */}
        {post.comments.length > 0 && (
          <button
            onClick={() => onOpenDetail(post)}
            className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 hover:underline block"
          >
            {t.viewAllComments} ({post.comments.length})
          </button>
        )}

        {/* Recent Comments Preview */}
        {post.comments.slice(-2).map((c) => (
          <div key={c.id} className="text-xs text-neutral-800 dark:text-neutral-300 mt-1 flex items-baseline gap-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{c.username}</span>
            <span className="text-neutral-700 dark:text-neutral-300">{c.text}</span>
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
    </article>
  );
};
