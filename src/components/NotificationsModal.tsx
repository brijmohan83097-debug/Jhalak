import React, { useState } from 'react';
import {
  X,
  Heart,
  Bell,
  Settings,
  CheckCheck,
  Sparkles,
  UserCheck,
  MessageCircle,
  Film,
  Flame,
  Check,
} from 'lucide-react';
import { SupportedLanguage, translations } from '../translations';

export interface AlertNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system' | 'trending';
  title: string;
  description: string;
  avatar?: string;
  timeAgo: string;
  read: boolean;
  actionUrl?: string;
}

const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: 'alert-1',
    type: 'follow',
    title: 'Khesari Lal Yadav started following you',
    description: 'Bhojpuri Superstar connected with your creator profile.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    timeAgo: '12m ago',
    read: false,
  },
  {
    id: 'alert-2',
    type: 'like',
    title: 'Pawan Singh & 42 others liked your reel',
    description: 'Your recent video reel is trending in Bihar & UP region 🔥',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    timeAgo: '45m ago',
    read: false,
  },
  {
    id: 'alert-3',
    type: 'comment',
    title: 'Amrapali Dubey commented on your post',
    description: '"Superb energy! Keep creating authentic desi content 👏✨"',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    timeAgo: '2h ago',
    read: false,
  },
  {
    id: 'alert-4',
    type: 'trending',
    title: 'Your audio track is trending in Reels',
    description: 'More than 1,200 creators are recording reels with your music.',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
    timeAgo: '5h ago',
    read: true,
  },
  {
    id: 'alert-5',
    type: 'system',
    title: 'Welcome to Jhalak Reels: Made in India 🇮🇳',
    description: 'Your account is verified for UGC community creation and monetization.',
    timeAgo: '1d ago',
    read: true,
  },
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  currentLanguage?: SupportedLanguage;
  onSelectUser?: (username: string) => void;
  unreadCount?: number;
  onMarkAllAsRead?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  currentLanguage = 'en',
  onSelectUser,
  onMarkAllAsRead,
}) => {
  const t = translations[currentLanguage];
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS);

  if (!isOpen) return null;

  const unreadAlerts = alerts.filter((a) => !a.read);
  const displayedAlerts = filter === 'unread' ? unreadAlerts : alerts;

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleAlertClick = (alert: AlertNotification) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, read: true } : a))
    );
  };

  return (
    <div
      id="notifications-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="notifications-modal-container"
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Bell className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white leading-tight">
                {t.notifications || 'Notifications & Alerts'}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {unreadAlerts.length > 0
                  ? `${unreadAlerts.length} new unread updates`
                  : 'All notifications caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadAlerts.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Mark all as read"
              >
                <Check className="w-3 h-3" />
                <span>Mark read</span>
              </button>
            )}
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

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-neutral-100/60 dark:bg-neutral-800/40 border-b border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <span>Unread</span>
              {unreadAlerts.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Live Feed
          </span>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {displayedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center my-6">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mb-3">
                <CheckCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                {filter === 'unread' ? 'No unread alerts' : 'No notifications yet'}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                {filter === 'unread'
                  ? 'You have viewed all pending notifications. Switch to "All" to review past activity.'
                  : 'When friends follow you, like your reels, or comment, alerts will appear right here.'}
              </p>
            </div>
          ) : (
            displayedAlerts.map((alert) => {
              const getIcon = () => {
                switch (alert.type) {
                  case 'like':
                    return <Heart className="w-3 h-3 text-white fill-white" />;
                  case 'comment':
                    return <MessageCircle className="w-3 h-3 text-white" />;
                  case 'follow':
                    return <UserCheck className="w-3 h-3 text-white" />;
                  case 'trending':
                    return <Flame className="w-3 h-3 text-white" />;
                  default:
                    return <Bell className="w-3 h-3 text-white" />;
                }
              };

              const getBadgeColor = () => {
                switch (alert.type) {
                  case 'like':
                    return 'bg-rose-500';
                  case 'comment':
                    return 'bg-sky-500';
                  case 'follow':
                    return 'bg-emerald-500';
                  case 'trending':
                    return 'bg-amber-500';
                  default:
                    return 'bg-purple-500';
                }
              };

              return (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer ${
                    !alert.read
                      ? 'bg-rose-50/40 dark:bg-rose-950/20'
                      : ''
                  }`}
                >
                  {/* Avatar / Icon */}
                  <div className="relative flex-shrink-0">
                    {alert.avatar ? (
                      <img
                        src={alert.avatar}
                        alt={alert.title}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-600 dark:text-neutral-300">
                        🇮🇳
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${getBadgeColor()} flex items-center justify-center shadow-xs`}
                    >
                      {getIcon()}
                    </span>
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-snug">
                      {alert.title}
                    </p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-0.5">
                      {alert.description}
                    </p>
                    <span className="text-[10px] text-neutral-400 font-medium block mt-1">
                      {alert.timeAgo}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!alert.read && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5 shadow-xs animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Instant push & in-app alerts
          </span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Real-time Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
