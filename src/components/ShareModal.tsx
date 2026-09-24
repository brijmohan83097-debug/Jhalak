import React, { useState } from 'react';
import { X, Copy, Check, Send, MessageCircle, Phone, Download, Share2, Clapperboard } from 'lucide-react';
import { Post, Conversation } from '../types';
import { safeSlice, safeEncodeURIComponent } from '../utils/safeEncoding';

interface ShareModalProps {
  post: Post;
  conversations: Conversation[];
  onClose: () => void;
  onSendToChat?: (conversationId: string, message: string) => void;
  onDownload?: (post: Post) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  conversations,
  onClose,
  onSendToChat,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const handleCopy = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
    } catch {
      // ignore clipboard error in restricted iframe
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    const shareData = {
      title: `Post by @${post.username} on Jhalak`,
      text: post.caption || 'Check out this post on Jhalak!',
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(post);
      onClose();
      return;
    }

    if (!post.mediaUrl) return;

    try {
      setIsDownloading(true);
      const isVideo = post.mediaType === 'video' || post.mediaUrl.endsWith('.mp4');
      const filename = `jhalak-${post.username}-${post.id}.${isVideo ? 'mp4' : 'jpg'}`;

      const response = await fetch(post.mediaUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch {
      // Fallback: direct window open / link
      const a = document.createElement('a');
      a.href = post.mediaUrl;
      a.target = '_blank';
      a.download = `jhalak-${post.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendToUser = (convId: string) => {
    setSentMap((prev) => ({ ...prev, [convId]: true }));
    if (onSendToChat) {
      onSendToChat(convId, `Shared a post from @${post.username}: ${safeSlice(post.caption, 50)}...`);
    }
  };

  const isVideoPost = post.mediaType === 'video' || (post.mediaUrl && post.mediaUrl.includes('.mp4'));

  return (
    <div
      id="share-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Share</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share"
            className="p-1 rounded-full text-neutral-500 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post preview snippet */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
            {post.mediaUrl ? (
              <img
                src={post.mediaUrl}
                alt={post.caption}
                className="w-full h-full object-cover"
              />
            ) : (
              <Clapperboard className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white block truncate">
              @{post.username}
            </span>
            <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5">{post.caption || 'Shared content'}</p>
          </div>
        </div>

        {/* Direct messages list if any exist */}
        {conversations.length > 0 && (
          <div className="p-3 max-h-44 overflow-y-auto space-y-2 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block px-1">
              Send in Direct Message
            </span>
            {conversations.map((conv) => {
              const isSent = sentMap[conv.id];
              return (
                <div
                  key={conv.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={conv.user.avatar}
                      alt={conv.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                        {conv.user.name}
                      </span>
                      <span className="text-[10px] text-neutral-400">@{conv.user.username}</span>
                    </div>
                  </div>

                  <button
                    id={`send-post-to-${conv.id}`}
                    onClick={() => handleSendToUser(conv.id)}
                    disabled={isSent}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      isSent
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                        : 'bg-sky-500 hover:bg-sky-600 text-white'
                    }`}
                  >
                    {isSent ? 'Sent' : 'Send'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons: WhatsApp, Download Video, Copy Link, Native Web Share */}
        <div className="p-4 space-y-2.5">
          {/* 1. Share to WhatsApp */}
          <a
            id="share-modal-whatsapp-btn"
            href={`https://api.whatsapp.com/send?text=${safeEncodeURIComponent(
              `Check out this ${isVideoPost ? 'Reel' : 'post'} by @${post.username} on Jhalak:\n"${post.caption}"\n${typeof window !== 'undefined' ? window.location.href : ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-neutral-900 dark:text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white fill-white" />
                  <Phone className="w-2 h-2 text-[#25D366] fill-[#25D366] absolute -rotate-12" />
                </div>
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm text-neutral-900 dark:text-white group-hover:text-[#25D366] transition-colors">
                  Share to WhatsApp
                </span>
                <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">
                  Chat or WhatsApp Status
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#25D366] px-2 py-0.5 rounded-full bg-[#25D366]/10">
              Open ›
            </span>
          </a>

          {/* 2. Download Video / Media */}
          <button
            type="button"
            id="share-modal-download-btn"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-neutral-900 dark:text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <Download className={`w-4 h-4 text-white ${isDownloading ? 'animate-bounce' : ''}`} />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  {downloadSuccess ? 'Downloaded!' : isDownloading ? 'Downloading...' : isVideoPost ? 'Download Video' : 'Download Media'}
                </span>
                <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">
                  Save file directly to your device
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700/50">
              {downloadSuccess ? 'Saved ✓' : 'Save ›'}
            </span>
          </button>

          {/* 3. Copy Link */}
          <button
            type="button"
            id="copy-post-link-btn"
            onClick={handleCopy}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-neutral-900 dark:text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md transition-colors ${copied ? 'bg-emerald-500' : 'bg-sky-500'}`}>
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm text-neutral-900 dark:text-white group-hover:text-sky-500 transition-colors">
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </span>
                <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">
                  {copied ? 'Ready to paste anywhere' : 'Copy link to clipboard'}
                </span>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${copied ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-200 dark:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400'}`}>
              {copied ? 'Copied ✓' : 'Copy'}
            </span>
          </button>

          {/* 4. Native Web Share */}
          <button
            type="button"
            id="share-modal-native-btn"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 text-neutral-900 dark:text-white font-medium text-xs transition active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-600 dark:bg-neutral-700 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm text-neutral-900 dark:text-white group-hover:text-rose-500 transition-colors">
                  More Share Options
                </span>
                <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">
                  Native share sheet & installed apps
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700/50">
              Share ›
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
