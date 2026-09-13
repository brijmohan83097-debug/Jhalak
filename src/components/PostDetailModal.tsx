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
} from 'lucide-react';
import { Post, User } from '../types';

interface PostDetailModalProps {
  post: Post;
  currentUser: User;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onShare: (post: Post) => void;
  onViewUser: (username: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  currentUser,
  onClose,
  onToggleLike,
  onToggleSave,
  onAddComment,
  onShare,
  onViewUser,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
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
        <div className="relative w-full md:w-3/5 bg-black flex items-center justify-center overflow-hidden aspect-square md:aspect-auto">
          {post.mediaType === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={post.mediaUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
              />
              <button
                id="detail-mute-btn"
                onClick={() => setIsMuted((prev) => !prev)}
                className="absolute bottom-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>
            </div>
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption}
              className={`w-full h-full object-cover ${post.filter || ''}`}
            />
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

            {/* Comments list */}
            {post.comments.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                No comments yet. Start the conversation!
              </div>
            ) : (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start justify-between gap-2 group">
                  <div className="flex items-start gap-2.5">
                    <img
                      src={comment.avatar}
                      alt={comment.username}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-neutral-900 dark:text-white mr-1.5">
                        {comment.username}
                      </span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {comment.text}
                      </span>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-400">
                        <span>{comment.timestamp}</span>
                        <span>{comment.likesCount} likes</span>
                        <button className="font-semibold hover:text-neutral-600 dark:hover:text-neutral-200">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    aria-label="Like comment"
                    className="text-neutral-400 hover:text-rose-500 p-1 flex-shrink-0"
                  >
                    <Heart className="w-3.5 h-3.5" />
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

          {/* Add Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
          >
            <button
              type="button"
              aria-label="Add emoji"
              onClick={() => setCommentText((p) => p + ' ✨')}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              id="detail-comment-input"
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
            />
            <button
              id="detail-post-comment-btn"
              type="submit"
              disabled={!commentText.trim()}
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
