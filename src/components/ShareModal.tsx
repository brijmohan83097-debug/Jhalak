import React, { useState } from 'react';
import { X, Copy, Check, Send, MessageCircle, Phone } from 'lucide-react';
import { Post, Conversation } from '../types';

interface ShareModalProps {
  post: Post;
  conversations: Conversation[];
  onClose: () => void;
  onSendToChat?: (conversationId: string, message: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  conversations,
  onClose,
  onSendToChat,
}) => {
  const [copied, setCopied] = useState(false);
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

  const handleSendToUser = (convId: string) => {
    setSentMap((prev) => ({ ...prev, [convId]: true }));
    if (onSendToChat) {
      onSendToChat(convId, `Shared a post from @${post.username}: ${post.caption.slice(0, 50)}...`);
    }
  };

  return (
    <div
      id="share-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Share</h3>
          <button
            onClick={onClose}
            aria-label="Close share"
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post preview snippet */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800">
          <img
            src={post.mediaUrl}
            alt={post.caption}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white block truncate">
              @{post.username}
            </span>
            <p className="text-[11px] text-neutral-500 truncate">{post.caption}</p>
          </div>
        </div>

        {/* Send to people list */}
        <div className="p-3 max-h-56 overflow-y-auto space-y-2">
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
                    className="w-9 h-9 rounded-full object-cover"
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

        {/* Action Buttons: WhatsApp & Copy Link */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <a
            id="share-modal-whatsapp-btn"
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Check out this post by @${post.username} on Jhalak:\n"${post.caption}"\n${window.location.href}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition hover:shadow-md"
          >
            <div className="relative w-4 h-4 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white fill-white" />
              <Phone className="w-2 h-2 text-[#25D366] fill-[#25D366] absolute -rotate-12" />
            </div>
            <span>Share on WhatsApp</span>
          </a>

          <button
            id="copy-post-link-btn"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white py-2 rounded-xl text-xs font-semibold transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Link copied to clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
