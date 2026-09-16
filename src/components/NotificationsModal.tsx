import React from 'react';
import { X, Heart, Bell, Settings, CheckCheck, Sparkles } from 'lucide-react';
import { SupportedLanguage, translations } from '../translations';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  currentLanguage?: SupportedLanguage;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  currentLanguage = 'en',
}) => {
  const t = translations[currentLanguage];

  if (!isOpen) return null;

  return (
    <div
      id="notifications-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="notifications-modal-container"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              {t.notifications}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {onOpenSettings && (
              <button
                id="notif-open-settings-btn"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                title="Notification settings"
                aria-label="Notification settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              id="notifications-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area - Clean Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/60 shadow-xs">
            <Heart className="w-8 h-8" />
          </div>

          <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-1.5">
            No notifications yet
          </h4>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed mb-6">
            When you receive likes, comments, mentions, or new followers on your posts and reels, they will appear right here.
          </p>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
            <CheckCheck className="w-4 h-4" />
            <span>You're all caught up!</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Activity updates in real-time
          </span>
          {onOpenSettings && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-sky-500 hover:underline font-semibold"
            >
              Preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
