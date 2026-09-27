import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Heart,
  Bell,
  CheckCheck,
  Sparkles,
  UserCheck,
  MessageCircle,
  Radio,
  Check,
  Loader2,
} from 'lucide-react';
import { SupportedLanguage, translations } from '../translations';
import { User } from '../types';
import { moderationService } from '../services/moderationService';
import {
  fetchUserNotificationsFromFirestore,
  markNotificationsAsReadInFirestore,
  FirestoreNotification,
} from '../services/firebase';

export interface AlertNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system' | 'trending' | 'live';
  title: string;
  description: string;
  avatar?: string;
  timeAgo: string;
  read: boolean;
  senderUsername?: string;
  postId?: string;
  actionUrl?: string;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  currentLanguage?: SupportedLanguage;
  onSelectUser?: (username: string) => void;
  onSelectPost?: (postId: string) => void;
  unreadCount?: number;
  onMarkAllAsRead?: () => void;
}

function formatTimeAgo(dateIsoOrMs: string | number): string {
  try {
    const ms = typeof dateIsoOrMs === 'number' ? dateIsoOrMs : new Date(dateIsoOrMs).getTime();
    if (isNaN(ms)) return 'Just now';
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentLanguage = 'en',
  onSelectUser,
  onSelectPost,
  onMarkAllAsRead,
}) => {
  const t = translations[currentLanguage];
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRealNotifications = useCallback(async () => {
    if (!currentUser?.username) {
      setAlerts([]);
      return;
    }
    setIsLoading(true);
    try {
      const remoteNotifs = await fetchUserNotificationsFromFirestore(
        currentUser.username,
        currentUser.id
      );

      // Block list enforcement: strictly filter out any notification from a blocked user
      const filtered = remoteNotifs.filter(
        (n) => !n.senderUsername || !moderationService.isUserBlocked(n.senderUsername)
      );

      const mapped: AlertNotification[] = filtered.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        description: n.description,
        avatar: n.senderAvatar,
        timeAgo: formatTimeAgo(n.createdAtMs || n.createdAt),
        read: Boolean(n.read),
        senderUsername: n.senderUsername,
        postId: n.postId,
      }));

      setAlerts(mapped);
    } catch {
      // safe fallback to local cache
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.username, currentUser?.id]);

  useEffect(() => {
    if (isOpen) {
      loadRealNotifications();
    }
  }, [isOpen, loadRealNotifications]);

  // Listen to in-app real-time notification events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleNewNotif = (e: Event) => {
      const customEvent = e as CustomEvent<FirestoreNotification>;
      const detail = customEvent.detail;
      if (!detail) return;

      // Filter blocked users
      if (detail.senderUsername && moderationService.isUserBlocked(detail.senderUsername)) {
        return;
      }

      // Check if for current user
      const cleanCurrent = (currentUser?.username || '').replace(/^@/, '').toLowerCase();
      const cleanRecipient = (detail.recipientUsername || '').replace(/^@/, '').toLowerCase();

      if (cleanCurrent && cleanRecipient === cleanCurrent) {
        const item: AlertNotification = {
          id: detail.id,
          type: detail.type,
          title: detail.title,
          description: detail.description,
          avatar: detail.senderAvatar,
          timeAgo: 'Just now',
          read: false,
          senderUsername: detail.senderUsername,
          postId: detail.postId,
        };
        setAlerts((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
      }
    };

    window.addEventListener('jhalak:new_notification', handleNewNotif);
    return () => {
      window.removeEventListener('jhalak:new_notification', handleNewNotif);
    };
  }, [currentUser?.username]);

  if (!isOpen) return null;

  // Filter blocked users in real-time
  const unblockedAlerts = alerts.filter(
    (a) => !a.senderUsername || !moderationService.isUserBlocked(a.senderUsername)
  );
  const unreadAlerts = unblockedAlerts.filter((a) => !a.read);
  const displayedAlerts = filter === 'unread' ? unreadAlerts : unblockedAlerts;

  const handleMarkAllRead = () => {
    const unreadIds = unreadAlerts.map((a) => a.id);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    if (currentUser?.username) {
      markNotificationsAsReadInFirestore(unreadIds, currentUser.username).catch(() => {});
    }
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleAlertClick = (alert: AlertNotification) => {
    // Mark as read immediately
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, read: true } : a))
    );
    if (currentUser?.username) {
      markNotificationsAsReadInFirestore([alert.id], currentUser.username).catch(() => {});
    }

    // Action handling
    if (alert.type === 'follow' && alert.senderUsername && onSelectUser) {
      onClose();
      onSelectUser(alert.senderUsername);
    } else if ((alert.type === 'like' || alert.type === 'comment') && alert.postId && onSelectPost) {
      onClose();
      onSelectPost(alert.postId);
    } else if (alert.type === 'live' && alert.senderUsername && onSelectUser) {
      onClose();
      onSelectUser(alert.senderUsername);
    }
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
        {/* Header - Settings Icon Removed */}
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
                  ? `${unreadAlerts.length} new updates`
                  : 'All notifications caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadAlerts.length > 0 && (
              <button
                type="button"
                id="notif-mark-all-read-btn"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Mark all as read"
              >
                <Check className="w-3 h-3" />
                <span>Mark read</span>
              </button>
            )}
            <button
              id="notifications-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
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
              id="notif-filter-all-btn"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              All ({unblockedAlerts.length})
            </button>
            <button
              type="button"
              id="notif-filter-unread-btn"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
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
            Live Cloud
          </span>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500 mb-2" />
              <p className="text-xs">Loading real notifications...</p>
            </div>
          ) : displayedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center my-6">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mb-3">
                <CheckCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                {filter === 'unread' ? 'No unread alerts' : 'No notifications yet'}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                {filter === 'unread'
                  ? 'You have viewed all pending notifications. Switch to "All" to review activity.'
                  : 'When friends follow you, like your video reels, or go live, real alerts appear here.'}
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
                  case 'live':
                    return <Radio className="w-3 h-3 text-white animate-pulse" />;
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
                  case 'live':
                    return 'bg-red-600 animate-pulse';
                  default:
                    return 'bg-purple-500';
                }
              };

              return (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer ${
                    !alert.read ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                  }`}
                >
                  {/* Avatar / Icon */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        alert.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${alert.senderUsername || alert.id}`
                      }
                      alt={alert.title}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
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
            Real-time Cloud Notifications
          </span>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
