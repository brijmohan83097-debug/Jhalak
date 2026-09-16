import React, { useState, useRef } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Smile,
  BadgeCheck,
  Volume2,
  VolumeX,
  Clapperboard,
  Phone,
  ShoppingBag,
  Maximize2,
} from 'lucide-react';
import { Post, User } from '../types';
import { ProductWhatsAppModal } from './ProductWhatsAppModal';
import { compressImage } from '../utils/imageCompressor';

interface PostDetailModalProps {
  post: Post;
  currentUser: User;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'gif') => void;
  onShare: (post: Post) => void;
  onViewUser: (username: string) => void;
  onOpenFullScreen?: (post: Post) => void;
}

const QUICK_REACTION_EMOJIS = ['❤️', '🔥', '👏', '😂', '😢', '😍'];

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  currentUser,
  onClose,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onShare,
  onViewUser,
  onOpenFullScreen,
}) => {
  const [commentText, setCommentText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'gif' } | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [showProductModal, setShowProductModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() && !selectedMedia) return;
    onAddComment(post.id, commentText.trim(), selectedMedia?.url, selectedMedia?.type);
    setCommentText('');
    setSelectedMedia(null);
    setShowGifPicker(false);
  };

  const handleReply = (username: string) => {
    setCommentText(`@${username} `);
    inputRef.current?.focus();
  };

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
    inputRef.current?.focus();
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
      console.warn('Post detail comment image compression fallback:', err);
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

  return (
    <div
      id="post-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
    >
      <button
        id="detail-close-btn"
        onClick={onClose}
        aria-label="Close post detail"
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-neutral-900/60 hover:bg-neutral-800 transition"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-black rounded-xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row">
        {/* Media Side */}
        <div className="relative w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden aspect-square md:aspect-auto group">
          {post.mediaType === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={post.mediaUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => onOpenFullScreen && onOpenFullScreen(post)}
              />
              <button
                id="detail-mute-btn"
                onClick={() => setIsMuted((prev) => !prev)}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition z-10"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>
            </div>
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption}
              onClick={() => onOpenFullScreen && onOpenFullScreen(post)}
              className={`w-full h-full object-cover cursor-pointer ${post.filter || ''}`}
            />
          )}

          {/* Full Screen Immersive Viewer Button */}
          {onOpenFullScreen && (
            <button
              id="detail-fullscreen-btn"
              onClick={() => {
                onClose();
                onOpenFullScreen(post);
              }}
              className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white transition active:scale-95 flex items-center gap-1.5 border border-white/20 text-xs font-semibold shadow-lg"
              title="Open full-screen Reels style viewer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Full Screen</span>
            </button>
          )}
        </div>

        {/* Info & Comments Side */}
        <div className="w-full md:w-2/5 flex flex-col h-full bg-white dark:bg-black border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800">
          {/* Post Author Header */}
          <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onViewUser(post.username);
                }}
                className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-500 to-rose-500"
              >
                <img
                  src={post.userAvatar}
                  alt={post.username}
                  className="w-8 h-8 rounded-full object-cover border border-white dark:border-black"
                />
              </button>
              <div>
                <button
                  onClick={() => {
                    onClose();
                    onViewUser(post.username);
                  }}
                  className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1 hover:underline"
                >
                  {post.username}
                  {post.isVerified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
                  )}
                </button>
                {post.location && (
                  <span className="text-xs text-neutral-500 block truncate max-w-[170px]">
                    {post.location}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onShare(post)}
              aria-label="More options"
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Comments & Caption Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[350px] md:max-h-none">
            {/* Caption item */}
            <div className="flex items-start gap-3">
              <img
                src={post.userAvatar}
                alt={post.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
              />
              <div className="text-sm">
                <span className="font-semibold text-neutral-900 dark:text-white mr-1.5">
                  {post.username}
                </span>
                <span className="text-neutral-800 dark:text-neutral-200">{post.caption}</span>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs text-sky-500 font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-neutral-400 block mt-1.5">{post.timestamp}</span>
              </div>
            </div>

            {/* Tagged Product Details Banner */}
            {post.productTag && (
              <div
                id={`detail-product-tag-${post.id}`}
                onClick={() => setShowProductModal(true)}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent border border-emerald-500/30 hover:border-emerald-500/60 transition cursor-pointer flex items-center justify-between gap-3 group"
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

            {/* Comments list */}
            {post.comments.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                No comments yet. Start the conversation!
              </div>
            ) : (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start justify-between gap-2 group">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <img
                      src={comment.avatar}
                      alt={comment.username}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                    <div className="text-xs flex-1 min-w-0">
                      <button
                        onClick={() => {
                          onClose();
                          onViewUser(comment.username);
                        }}
                        className="font-semibold text-neutral-900 dark:text-white mr-1.5 hover:underline"
                      >
                        {comment.username}
                      </button>
                      <span className="text-neutral-700 dark:text-neutral-300 break-words">
                        {comment.text}
                      </span>

                      {/* GIF / Image preview inside comment */}
                      {comment.mediaUrl && (
                        <div className="mt-1.5 relative inline-block rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 max-w-[180px]">
                          <img
                            src={comment.mediaUrl}
                            alt="Comment attachment"
                            className="w-full max-h-32 object-cover rounded-lg"
                          />
                          {comment.mediaType === 'gif' && (
                            <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/75 text-[8px] font-bold text-white uppercase">
                              GIF
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                        <span>{comment.timestamp}</span>
                        <span>
                          {(likedComments[comment.id] ? (comment.likesCount || 0) + 1 : comment.likesCount) || 0} likes
                        </span>
                        <button
                          onClick={() => handleReply(comment.username)}
                          className="font-semibold hover:text-neutral-600 dark:hover:text-neutral-200"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    aria-label="Like comment"
                    onClick={() => {
                      setLikedComments((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }));
                    }}
                    className="p-1 flex-shrink-0"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        likedComments[comment.id] || comment.isLiked
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-neutral-400 hover:text-rose-500'
                      }`}
                    />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Action Row */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  id={`detail-like-btn-${post.id}`}
                  onClick={() => onToggleLike(post.id)}
                  aria-label="Like"
                  className="hover:opacity-75 transition"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      post.isLiked ? 'text-rose-500 fill-rose-500' : 'text-neutral-800 dark:text-white'
                    }`}
                  />
                </button>
                <button
                  onClick={() => inputRef.current?.focus()}
                  aria-label="Comment"
                  className="hover:opacity-75 text-neutral-800 dark:text-white"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={() => onShare(post)}
                  aria-label="Share"
                  className="hover:opacity-75 text-neutral-800 dark:text-white"
                >
                  <Send className="w-6 h-6" />
                </button>
                <a
                  id={`detail-whatsapp-btn-${post.id}`}
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
                id={`detail-save-btn-${post.id}`}
                onClick={() => onToggleSave(post.id)}
                aria-label="Save"
                className="hover:opacity-75"
              >
                <Bookmark
                  className={`w-6 h-6 ${
                    post.isSaved
                      ? 'text-neutral-900 dark:text-white fill-neutral-900 dark:fill-white'
                      : 'text-neutral-800 dark:text-white'
                  }`}
                />
              </button>
            </div>

            <div className="text-xs font-semibold text-neutral-900 dark:text-white">
              {post.likesCount.toLocaleString()} likes
            </div>
            <div className="text-[10px] text-neutral-400 uppercase mt-0.5 tracking-wider">
              {post.timestamp}
            </div>
          </div>

          {/* Attached preview */}
          {selectedMedia && (
            <div className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
              <img
                src={selectedMedia.url}
                alt="preview"
                className="w-8 h-8 rounded object-cover border border-neutral-300 dark:border-neutral-700"
              />
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400 flex-1 truncate">
                Attached {selectedMedia.type}
              </span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick-tap Reaction Emojis row */}
          <div className="px-3 py-1 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between">
            {QUICK_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg hover:scale-125 active:scale-95 transition-transform p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Add Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              id="detail-comment-input"
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
            />

            {/* Inline GIF button */}
            <button
              type="button"
              onClick={() => {
                setSelectedMedia({
                  url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
                  type: 'gif',
                });
              }}
              title="Add Reaction GIF"
              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              GIF
            </button>

            {/* Inline Image Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach Image"
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <button
              id="detail-post-comment-btn"
              type="submit"
              disabled={!commentText.trim() && !selectedMedia}
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      </div>

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
    </div>
  );
};
