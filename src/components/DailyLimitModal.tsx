import React from 'react';
import {
  AlertTriangle,
  Clock,
  Film,
  Image as ImageIcon,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  MONETIZATION_POLICY,
  getDailyUploads,
  formatRemainingTime,
} from '../services/monetizationService';

interface DailyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'photo' | 'reel';
  onOpenDashboard?: () => void;
}

export const DailyLimitModal: React.FC<DailyLimitModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  onOpenDashboard,
}) => {
  if (!isOpen) return null;

  const uploads = getDailyUploads(userId);
  const photosUsed = uploads.photos.length;
  const reelsUsed = uploads.reels.length;

  const list = type === 'photo' ? uploads.photos : uploads.reels;
  const now = Date.now();
  let nextResetMs = 0;
  if (list.length > 0) {
    const oldest = Math.min(...list);
    nextResetMs = Math.max(0, oldest + MONETIZATION_POLICY.WINDOW_MS - now);
  }

  const isReel = type === 'reel';
  const typeLabel = isReel ? 'Video Reels' : 'Photo Posts';
  const typeLabelHindi = isReel ? 'वीडियो रील्स' : 'फ़ोटो पोस्ट';

  return (
    <div
      id="daily-limit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-amber-500/40 dark:border-amber-500/30 flex flex-col">
        {/* Amber accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center space-y-4">
          {/* Warning Icon Badge */}
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <AlertTriangle className="w-7 h-7" />
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Daily Limit Reached (दैनिक सीमा समाप्त)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Maximum <span className="font-semibold text-neutral-800 dark:text-neutral-200">3 {typeLabel}</span> allowed per user per 24 hours
            </p>
          </div>

          {/* Uploads Usage Tracker Cards */}
          <div className="grid grid-cols-2 gap-2 text-left pt-1">
            {/* Reels Usage */}
            <div
              className={`p-3 rounded-xl border ${
                isReel
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-rose-500" />
                  Reels (24h)
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    reelsUsed >= MONETIZATION_POLICY.MAX_DAILY_REELS
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {reelsUsed} / {MONETIZATION_POLICY.MAX_DAILY_REELS}
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (reelsUsed / MONETIZATION_POLICY.MAX_DAILY_REELS) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Photos Usage */}
            <div
              className={`p-3 rounded-xl border ${
                !isReel
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                  Photos (24h)
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    photosUsed >= MONETIZATION_POLICY.MAX_DAILY_PHOTOS
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {photosUsed} / {MONETIZATION_POLICY.MAX_DAILY_PHOTOS}
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (photosUsed / MONETIZATION_POLICY.MAX_DAILY_PHOTOS) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Reset Timer Pill */}
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
            <span>
              Next {isReel ? 'reel' : 'photo'} slot unlocks in{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                {formatRemainingTime(nextResetMs)}
              </strong>
            </span>
          </div>

          {/* Quality & Spam Prevention Explanation */}
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed text-left bg-neutral-50 dark:bg-neutral-950/50 p-2.5 rounded-lg border border-neutral-200/70 dark:border-neutral-800">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Quality Policy: </span>
            To prevent feed spam, ensure fair distribution for all creators, and maintain high content standards, each account can share up to 3 {typeLabelHindi} every 24 hours.
          </p>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition"
            >
              Got it (समझ गया)
            </button>
            {onOpenDashboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDashboard();
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs sm:text-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
