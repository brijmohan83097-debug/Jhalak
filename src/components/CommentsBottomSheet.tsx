import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Image as ImageIcon,
  Send,
  X,
  Sparkles,
  Smile,
  BadgeCheck,
} from 'lucide-react';
import { Comment, User } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface CommentsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  currentUser: User;
  onAddComment: (text: string, mediaUrl?: string, mediaType?: 'image' | 'gif') => void;
  onToggleCommentLike?: (commentId: string) => void;
  onViewUser?: (username: string) => void;
  targetAuthorUsername?: string;
  commentsCount?: number;
}

const QUICK_REACTION_EMOJIS = ['❤️', '🔥', '👏', '😂', '😢', '😍'];

// Popular reaction GIFs for quick selection
const POPULAR_REACTION_GIFS = [
  {
    id: 'gif-1',
    title: 'Mindblown Celebration',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    type: 'gif' as const,
    label: '✨ Celebration',
  },
  {
    id: 'gif-2',
    title: 'Namaste Respect',
    url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=500&auto=format&fit=crop&q=80',
    type: 'gif' as const,
    label: '🙏 Namaste',
  },
  {
    id: 'gif-3',
    title: 'Sunset Magic',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
    type: 'gif' as const,
    label: '🌅 Vibes',
  },
  {
    id: 'gif-4',
    title: 'Bhangra Joy',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80',
    type: 'gif' as const,
    label: '💃 Dance',
  },
];

export const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  isOpen,
  onClose,
  comments,
  currentUser,
  onAddComment,
  onToggleCommentLike,
  onViewUser,
  targetAuthorUsername,
}) => {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: 'image' | 'gif';
  } | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Local likes tracking
  const [localLikedComments, setLocalLikedComments] = useState<Record<string, boolean>>({});
  const [localLikeCounts, setLocalLikeCounts] = useState<Record<string, number>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Drag-to-dismiss states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);

  // Initialize likes state
  useEffect(() => {
    const initialLiked: Record<string, boolean> = {};
    const initialCounts: Record<string, number> = {};
    comments.forEach((c) => {
      initialLiked[c.id] = !!c.isLiked;
      initialCounts[c.id] = c.likesCount || 0;
    });
    setLocalLikedComments(initialLiked);
    setLocalLikeCounts(initialCounts);
  }, [comments]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchDelta(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDelta > 100) {
      onClose();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const handleReply = (username: string) => {
    setReplyingTo(username);
    setCommentText(`@${username} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleLikeToggle = (commentId: string) => {
    const isCurrentlyLiked = !!localLikedComments[commentId];
    setLocalLikedComments((prev) => ({
      ...prev,
      [commentId]: !isCurrentlyLiked,
    }));
    setLocalLikeCounts((prev) => ({
      ...prev,
      [commentId]: isCurrentlyLiked
        ? Math.max(0, (prev[commentId] || 1) - 1)
        : (prev[commentId] || 0) + 1,
    }));

    if (onToggleCommentLike) {
      onToggleCommentLike(commentId);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Automatically compress/resize image using canvas to max 800px width/height and JPEG 0.7 quality
      const compressed = await compressImage(file, 800, 800, 0.7);
      setSelectedMedia({
        url: compressed,
        type: 'image',
      });
      setShowGifPicker(false);
    } catch (err) {
      console.warn('Comment image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedMedia({
            url: event.target.result as string,
            type: 'image',
          });
          setShowGifPicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectGif = (gifUrl: string) => {
    setSelectedMedia({
      url: gifUrl,
      type: 'gif',
    });
    setShowGifPicker(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() && !selectedMedia) return;

    onAddComment(
      commentText.trim(),
      selectedMedia?.url,
      selectedMedia?.type
    );

    setCommentText('');
    setSelectedMedia(null);
    setReplyingTo(null);
    setShowGifPicker(false);

    // Scroll to newest comment
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div
      id="instagram-comments-sheet-backdrop"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] flex items-end justify-center transition-opacity"
      onClick={onClose}
    >
      {/* 60% Screen Height Bottom Sheet */}
      <div
        ref={sheetRef}
        id="instagram-comments-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: touchDelta > 0 ? `translateY(${touchDelta}px)` : 'translateY(0)',
          transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
        }}
        className="w-full max-w-lg md:max-w-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-t-[28px] h-[60vh] max-h-[75vh] min-h-[440px] flex flex-col shadow-2xl border-t border-neutral-200 dark:border-neutral-800 select-none animate-in slide-in-from-bottom duration-300 relative overflow-hidden"
      >
        {/* Top Drag Handle Header - Swipe or tap to dismiss */}
        <div
          className="pt-2.5 pb-2 cursor-grab active:cursor-grabbing touch-none flex flex-col items-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Drag Handle Pill */}
          <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto transition-colors" />

          {/* Center-aligned Comments Title (No bulky X button) */}
          <h2 className="text-center font-bold text-[15px] text-neutral-900 dark:text-white mt-2.5 tracking-tight">
            Comments
          </h2>
        </div>

        <div className="w-full h-px bg-neutral-150 dark:bg-neutral-800/80" />

        {/* Scrollable Comment List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-amber-500/80" />
              </div>
              <p className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                No comments yet
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs">
                Start the conversation or drop a reaction below.
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = localLikedComments[comment.id] ?? !!comment.isLiked;
              const likes = localLikeCounts[comment.id] ?? comment.likesCount ?? 0;

              return (
                <div
                  key={comment.id}
                  id={`comment-item-${comment.id}`}
                  className="flex items-start justify-between gap-3 group animate-in fade-in duration-200"
                >
                  {/* Avatar */}
                  <button
                    onClick={() => {
                      if (onViewUser) {
                        onClose();
                        onViewUser(comment.username);
                      }
                    }}
                    className="flex-shrink-0 focus:outline-none"
                  >
                    <img
                      src={comment.avatar}
                      alt={comment.username}
                      className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 hover:opacity-90 transition"
                    />
                  </button>

                  {/* Comment Body */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-[13px] leading-snug">
                      <button
                        onClick={() => {
                          if (onViewUser) {
                            onClose();
                            onViewUser(comment.username);
                          }
                        }}
                        className="font-bold text-neutral-900 dark:text-neutral-100 mr-1.5 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>{comment.username}</span>
                        {comment.username === 'ananya_wanderer' && (
                          <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 inline" />
                        )}
                      </button>
                      <span className="text-neutral-800 dark:text-neutral-200 whitespace-pre-line break-words">
                        {comment.text}
                      </span>
                    </div>

                    {/* Attached Image or GIF Preview inside comment */}
                    {comment.mediaUrl && (
                      <div className="mt-2 relative inline-block rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-950 max-w-[200px] shadow-sm">
                        <img
                          src={comment.mediaUrl}
                          alt="Comment attachment"
                          className="w-full max-h-36 object-cover rounded-xl"
                          loading="lazy"
                        />
                        {comment.mediaType === 'gif' && (
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white tracking-wider backdrop-blur-xs">
                            GIF
                          </span>
                        )}
                      </div>
                    )}

                    {/* Comment Footer: timestamp, likes count, reply button */}
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>{comment.timestamp}</span>
                      {likes > 0 && (
                        <span className="font-medium text-neutral-600 dark:text-neutral-300">
                          {likes} {likes === 1 ? 'like' : 'likes'}
                        </span>
                      )}
                      <button
                        onClick={() => handleReply(comment.username)}
                        className="font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Like Heart Button */}
                  <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                    <button
                      id={`like-comment-${comment.id}`}
                      onClick={() => handleLikeToggle(comment.id)}
                      aria-label="Like comment"
                      className="p-1 hover:scale-115 active:scale-90 transition-transform"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isLiked
                            ? 'text-rose-500 fill-rose-500'
                            : 'text-neutral-400 dark:text-neutral-500 hover:text-rose-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Replying banner if active */}
        {replyingTo && (
          <div className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
            <span>
              Replying to <span className="font-semibold text-sky-500">@{replyingTo}</span>
            </span>
            <button
              onClick={cancelReply}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Selected Media Thumbnail Preview before posting */}
        {selectedMedia && (
          <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-950/70 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 flex-shrink-0 bg-neutral-900">
              <img
                src={selectedMedia.url}
                alt="Selected preview"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded bg-black/75 text-[8px] font-bold text-white uppercase">
                {selectedMedia.type}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                Attached {selectedMedia.type === 'gif' ? 'Reaction GIF' : 'Image'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Ready to post with your comment
              </p>
            </div>
            <button
              onClick={() => setSelectedMedia(null)}
              className="p-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* GIF Picker Quick Flyout */}
        {showGifPicker && (
          <div className="p-3 bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Trending Reaction GIFs
              </span>
              <button
                onClick={() => setShowGifPicker(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {POPULAR_REACTION_GIFS.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelectGif(gif.url)}
                  className="group relative rounded-xl overflow-hidden aspect-video border border-neutral-300 dark:border-neutral-800 hover:border-sky-500 focus:outline-none transition active:scale-95"
                >
                  <img
                    src={gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                    <span className="text-[9px] font-bold text-white truncate w-full text-left">
                      {gif.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Horizontal Row of Quick-Tap Reaction Emojis directly above input */}
        <div
          id="quick-reaction-emojis-row"
          className="px-4 py-2 bg-neutral-50/90 dark:bg-neutral-950/80 border-t border-neutral-150 dark:border-neutral-800/80 flex items-center justify-between gap-1"
        >
          {QUICK_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              aria-label={`Reaction ${emoji}`}
              className="text-xl sm:text-2xl hover:scale-125 active:scale-95 p-1 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-transform duration-150"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* 4. Bottom Fixed Input Bar */}
        <form
          id="instagram-comment-input-bar"
          onSubmit={handleSubmit}
          className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2.5"
        >
          {/* User Avatar */}
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
          />

          {/* Comment Input Container */}
          <div className="flex-1 flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/90 rounded-full px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                targetAuthorUsername
                  ? `Add a comment for @${targetAuthorUsername}...`
                  : 'Add a comment...'
              }
              className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none min-w-0"
            />

            {/* Inline GIF Icon Button */}
            <button
              type="button"
              onClick={() => setShowGifPicker((prev) => !prev)}
              title="Add GIF"
              aria-label="Add GIF"
              className={`p-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider px-1.5 transition ${
                showGifPicker || selectedMedia?.type === 'gif'
                  ? 'bg-sky-500 text-white'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              GIF
            </button>

            {/* Inline Image Upload Icon Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach Image"
              aria-label="Attach Image"
              className={`p-1 rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition ${
                selectedMedia?.type === 'image' ? 'text-sky-500' : ''
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Post Button */}
          <button
            id="comments-sheet-post-btn"
            type="submit"
            disabled={!commentText.trim() && !selectedMedia}
            className={`p-2 rounded-full font-semibold text-xs sm:text-sm transition flex items-center justify-center ${
              commentText.trim() || selectedMedia
                ? 'text-sky-500 hover:text-sky-600 active:scale-95'
                : 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-40'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
