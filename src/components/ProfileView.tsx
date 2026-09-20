import React, { useState, useEffect } from 'react';
import {
  Grid,
  Bookmark,
  Tag,
  Settings,
  BadgeCheck,
  ExternalLink,
  Plus,
  Camera,
  Film,
  LogOut,
  CheckCircle2,
  Globe2,
  Gift,
  Scale,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { User, Post } from '../types';
import { SupportedLanguage, translations, SUPPORTED_LANGUAGES } from '../translations';
import { UpiShagunSheet } from './UpiShagunSheet';
import { CreatorDashboardCard } from './CreatorDashboardCard';
import { CreatorMonetizationView } from './CreatorMonetizationView';
import { safeSetItem } from '../utils/safeStorage';
import { isSuperAdmin, ADMIN_EMAIL } from '../constants/admin';
import {
  createVideoFallbackDataUrl,
  createPhotoFallbackDataUrl,
} from '../utils/imageCompressor';

interface ProfileViewProps {
  user: User;
  userPosts: Post[];
  savedPosts: Post[];
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onSelectPost: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onOpenStoryModal?: () => void;
  onOpenGoogleLogin?: () => void;
  onOpenLegalPolicies?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenMonetizationView?: () => void;
  onLogout?: () => void;
  currentLanguage?: SupportedLanguage;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  userPosts,
  savedPosts,
  onOpenEditProfile,
  onOpenSettings,
  onSelectPost,
  onDeletePost,
  onOpenStoryModal,
  onOpenGoogleLogin,
  onOpenLegalPolicies,
  onOpenAdminPanel,
  onOpenMonetizationView,
  onLogout,
  currentLanguage = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const [showMonetizationModal, setShowMonetizationModal] = useState(false);
  const [highlights, setHighlights] = useState<any[]>(() => {
    try {
      const userKey = user?.id ? `ig_profile_highlights_${user.id}` : 'ig_profile_highlights';
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      const fallback = localStorage.getItem('ig_profile_highlights');
      if (fallback) {
        const parsed = JSON.parse(fallback);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Re-sync highlights when user changes
  useEffect(() => {
    try {
      const userKey = user?.id ? `ig_profile_highlights_${user.id}` : 'ig_profile_highlights';
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHighlights(parsed);
          return;
        }
      }
      setHighlights([]);
    } catch {
      setHighlights([]);
    }
  }, [user?.id]);
  const [showShagunSheet, setShowShagunSheet] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const t = translations[currentLanguage] || translations.en;
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  // Helper to determine if a post belongs exclusively to the current profile user
  const isMatchingUser = (p: any): boolean => {
    if (!p || typeof p !== 'object' || !p.id) return false;
    const targetId = (user?.id || '').trim().toLowerCase();
    const targetUsername = (user?.username || '').trim().toLowerCase();

    const postUserId = (p.userId || '').trim().toLowerCase();
    const postUsername = (p.username || '').trim().toLowerCase();

    // 1. Direct match by user ID
    if (targetId && postUserId && targetId === postUserId) return true;

    // 2. Direct match by username
    if (targetUsername && postUsername && targetUsername === postUsername) return true;

    // 3. Super Admin account match
    if (isSuperAdmin(user)) {
      if (
        postUserId === 'user-me' ||
        postUserId === 'user-brijmohan' ||
        postUserId === 'user-brijmohan83097' ||
        postUsername === 'brijmohan' ||
        postUsername === 'brijmohan83097'
      ) {
        return true;
      }
    }

    return false;
  };

  // Load and display exclusively this logged-in user's uploaded posts saved by their user ID in localStorage
  const resolvedUserPosts = React.useMemo(() => {
    if (!user || !user.id) return [];
    const postMap = new Map<string, Post>();

    const addIfMatching = (p: any) => {
      if (p && p.id && isMatchingUser(p)) {
        if (!postMap.has(p.id)) {
          postMap.set(p.id, p);
        }
      }
    };

    // 1. Check user-specific localStorage key: ig_user_posts_${user.id}
    try {
      const userPostsKey = `ig_user_posts_${user.id}`;
      const raw = localStorage.getItem(userPostsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(addIfMatching);
        }
      }

      // Legacy fallback exclusively for Super Admin
      if (isSuperAdmin(user)) {
        const legacyMe = localStorage.getItem('ig_user_posts_user-me');
        if (legacyMe) {
          const parsed = JSON.parse(legacyMe);
          if (Array.isArray(parsed)) parsed.forEach(addIfMatching);
        }
        const legacyBrij = localStorage.getItem('ig_user_posts_brijmohan');
        if (legacyBrij) {
          const parsed = JSON.parse(legacyBrij);
          if (Array.isArray(parsed)) parsed.forEach(addIfMatching);
        }
      }
    } catch {
      // safe fallback
    }

    // 2. Posts from props that match this user
    (userPosts || []).forEach(addIfMatching);

    // 3. Posts directly attached to current user profile object
    (user.userPosts || user.posts || []).forEach(addIfMatching);

    return Array.from(postMap.values());
  }, [userPosts, user]);

  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);

  // Direct instant delete from Profile
  const handleDeleteDirect = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. Immediately hide from profile UI state with 0 latency
    setDeletedPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));

    // 2. Clear from all potential localStorage post stores
    try {
      const targetUserId = user?.id || '';
      const targetUsername = user?.username || '';
      const keysToClean = [
        `ig_user_posts_${targetUserId}`,
        `ig_user_posts_${targetUsername}`,
        'ig_user_posts_user-me',
        'ig_user_posts_brijmohan',
        'ig_user_posts_brijmohan83097',
        'jhalak_uploaded_posts_v1',
        'jhalak_uploaded_reels_v1',
        'ig_posts',
        'ig_feed_posts',
      ];
      keysToClean.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              localStorage.setItem(k, JSON.stringify(list.filter((x: any) => x?.id !== postId)));
            }
          } catch {}
        }
      });
    } catch {}

    // 3. Trigger parent delete handler
    if (onDeletePost) {
      onDeletePost(postId);
    }
  };

  const safeResolvedPosts = (Array.isArray(resolvedUserPosts) ? resolvedUserPosts : []).filter(
    (p) => !deletedPostIds.includes(p.id)
  );
  const safeSavedPosts = (Array.isArray(savedPosts) ? savedPosts : []).filter(
    (p) => !deletedPostIds.includes(p.id)
  );

  const effectivePostsCount = safeResolvedPosts.length;

  const displayPosts =
    activeTab === 'posts'
      ? safeResolvedPosts
      : activeTab === 'saved'
      ? safeSavedPosts
      : [];

  const handleAddHighlight = () => {
    let title: string | null = null;
    try {
      title = window.prompt('Enter highlight name:', 'Moments ✨');
    } catch {
      title = 'Moments ✨';
    }
    if (!title || !title.trim()) {
      title = `Highlight ${(highlights || []).length + 1}`;
    }
    const newHighlight = {
      id: `hl-${Date.now()}`,
      title: title.trim(),
      cover:
        safeResolvedPosts[0]?.mediaUrl ||
        user?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    };
    const updated = [...(highlights || []), newHighlight];
    setHighlights(updated);
    try {
      const userKey = user?.id ? `ig_profile_highlights_${user.id}` : 'ig_profile_highlights';
      safeSetItem(userKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div id="profile-view" className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Guest Mode Banner */}
      {!user?.email && !user?.isGoogleAuth && onOpenGoogleLogin && (
        <div
          id="profile-guest-banner"
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-fuchsia-600/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
        >
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              You are browsing in Guest Mode
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Sign in with Google to save reels, like posts, and track creator monetization.
            </p>
          </div>
          <button
            onClick={onOpenGoogleLogin}
            className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 text-xs font-bold shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-700 transition flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-14 mb-8">
        {/* Avatar with gradient border */}
        <div className="relative mx-auto md:mx-0 flex-shrink-0">
          <div
            onClick={onOpenStoryModal}
            className="p-[3px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 cursor-pointer hover:scale-105 transition"
            title="View user story"
          >
            <div className="bg-white dark:bg-black p-[3px] rounded-full">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                alt={user?.name || user?.username || 'User'}
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full object-cover"
              />
            </div>
          </div>
          <button
            onClick={onOpenEditProfile}
            title="Change profile photo"
            className="absolute bottom-1 right-1 p-2 bg-neutral-900 dark:bg-neutral-800 text-white rounded-full border-2 border-white dark:border-black shadow-md hover:scale-110 transition"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* User Details & Stats */}
        <div className="flex-1 w-full flex flex-col gap-4 text-neutral-900 dark:text-neutral-100">
          {/* Username & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-1.5 flex-wrap">
                {user?.username || 'User'}
                {user?.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-sky-500 fill-sky-500" />
                )}
                {isSuperAdmin(user) && (
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-xs tracking-wider">
                    Super Admin
                  </span>
                )}
              </h1>
            </div>

            {/* Top Right Action & Settings Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* UPI Shagun Tip Button */}
              <button
                id="profile-shagun-tip-btn"
                onClick={() => setShowShagunSheet(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer"
                title={`Send UPI Shagun tip to @${user?.username || ''} via GPay, PhonePe, Paytm`}
              >
                <Gift className="w-3.5 h-3.5 animate-bounce [animation-duration:3s]" />
                <span>Send Shagun 🎁</span>
              </button>

              {/* Edit Profile Button */}
              <button
                id="edit-profile-btn"
                onClick={onOpenEditProfile}
                className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-sm font-semibold transition"
              >
                {t.editProfile}
              </button>

              {/* Settings Gear Icon (⚙️) Button */}
              <button
                id="profile-settings-btn"
                onClick={onOpenSettings}
                aria-label="Settings"
                title="Settings & Language (सेटिंग्स और भाषा)"
                className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 hover:rotate-45 transition duration-300 relative group flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">{t.settings}</span>
              </button>

              {/* Language quick badge */}
              <button
                onClick={onOpenSettings}
                title="Change language / भाषा बदलें"
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>{activeLangObj?.name || 'English'}</span>
              </button>

              {/* Google Account */}
              {onOpenGoogleLogin && (
                <button
                  id="profile-google-btn"
                  onClick={onOpenGoogleLogin}
                  className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  title="Google Account Settings"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="hidden sm:inline">{user?.email ? 'Google' : 'Sign in'}</span>
                </button>
              )}

              {/* Legal & Privacy Policies button */}
              {onOpenLegalPolicies && (
                <button
                  id="profile-legal-btn"
                  onClick={onOpenLegalPolicies}
                  className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 transition flex items-center"
                  title="Legal, Terms & Privacy Policies"
                  aria-label="Legal & Privacy Policy"
                >
                  <Scale className="w-4 h-4" />
                </button>
              )}

              {/* Super Admin Dashboard Button */}
              {isSuperAdmin(user) && onOpenAdminPanel && (
                <button
                  id="profile-admin-dashboard-btn"
                  onClick={onOpenAdminPanel}
                  className="px-2.5 py-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title={`Super Admin Moderation & Creator Payouts (${ADMIN_EMAIL})`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}

              {/* Logout */}
              {onLogout && (
                <button
                  id="profile-logout-btn"
                  onClick={onLogout}
                  className="p-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs font-semibold transition flex items-center"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Counts (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-8 text-sm">
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {effectivePostsCount}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.posts}</span>
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {(user?.followersCount || 0).toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.followers}</span>
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {(user?.followingCount || 0).toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.following}</span>
            </div>
          </div>

          {/* Bio & Links */}
          <div className="text-sm">
            <h2 className="font-semibold text-neutral-900 dark:text-white">{user?.name || user?.username || ''}</h2>
            {user?.bio && (
              <p className="whitespace-pre-line text-neutral-800 dark:text-neutral-200 mt-1">
                {user.bio}
              </p>
            )}
            {user?.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium hover:underline mt-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {/* Google Account Status Badge */}
            <div className="mt-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 truncate">
                    {user?.email || t.googleAccount}
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  </p>
                  <p className="text-[10px] text-neutral-500">{t.googleVerifiedCreator}</p>
                </div>
              </div>
              {onOpenGoogleLogin && (
                <button
                  onClick={onOpenGoogleLogin}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline ml-2 whitespace-nowrap"
                >
                  {t.manage}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Stats Row */}
      <div className="flex sm:hidden items-center justify-around py-3 border-y border-neutral-200 dark:border-neutral-800 text-center text-sm mb-4">
        <div>
          <div className="font-bold text-neutral-900 dark:text-white">{effectivePostsCount}</div>
          <div className="text-xs text-neutral-500">{t.posts}</div>
        </div>
        <div>
          <div className="font-bold text-neutral-900 dark:text-white">
            {(user?.followersCount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">{t.followers}</div>
        </div>
        <div>
          <div className="font-bold text-neutral-900 dark:text-white">
            {(user?.followingCount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">{t.following}</div>
        </div>
      </div>

      {/* Story Highlights */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-6 border-b border-neutral-200 dark:border-neutral-800/80 mb-4">
        {(highlights || []).map((hl) => (
          <div
            key={hl.id}
            onClick={onOpenStoryModal}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-full p-[2px] border border-neutral-300 dark:border-neutral-700 group-hover:scale-105 transition">
              <img
                src={hl.cover}
                alt={hl.title}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[70px]">
              {hl.title}
            </span>
          </div>
        ))}

        {/* Add Highlight */}
        <div
          onClick={handleAddHighlight}
          className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:scale-105 transition bg-neutral-50 dark:bg-neutral-900">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            New
          </span>
        </div>
      </div>

      {/* Creator Dashboard & Monetization Progress Card (2k Followers, 2k Watch Hours, Daily Limits) */}
      <div className="mb-6">
        <CreatorDashboardCard
          user={user}
          onOpenMonetizationView={() => {
            if (onOpenMonetizationView) {
              onOpenMonetizationView();
            } else {
              setShowMonetizationModal(true);
            }
          }}
        />
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex items-center justify-center gap-12 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold tracking-wider uppercase mb-4">
        <button
          id="profile-tab-posts"
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 py-3 border-t -mt-[1px] transition ${
            activeTab === 'posts'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>{t.posts}</span>
        </button>

        <button
          id="profile-tab-saved"
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-1.5 py-3 border-t -mt-[1px] transition ${
            activeTab === 'saved'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>{t.saved}</span>
        </button>

        <button
          id="profile-tab-tagged"
          onClick={() => setActiveTab('tagged')}
          className={`flex items-center gap-1.5 py-3 border-t -mt-[1px] transition ${
            activeTab === 'tagged'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{t.tagged}</span>
        </button>
      </div>

      {/* Posts Grid */}
      {(displayPosts || []).length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center mx-auto mb-3">
            {activeTab === 'saved' ? (
              <Bookmark className="w-7 h-7 text-neutral-400" />
            ) : (
              <Grid className="w-7 h-7 text-neutral-400" />
            )}
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            {activeTab === 'saved' ? t.noSavedPosts : 'Abhi koi reel ya post nahi hai'}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'saved'
              ? 'Save photos and videos that you want to see again. Only you can see what you’ve saved.'
              : 'Pehli reel ya photo post karein taaki wo aapki profile par dikhe.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {(displayPosts || []).map((post) => (
            <div
              key={post.id}
              id={`profile-grid-post-${post.id}`}
              onClick={() => onSelectPost(post)}
              className="group relative aspect-square bg-neutral-900 overflow-hidden cursor-pointer rounded-sm md:rounded-lg"
            >
              {post.mediaType === 'video' ? (
                <div className="w-full h-full relative bg-neutral-950 flex items-center justify-center">
                  <img
                    src={
                      post.thumbnailUrl ||
                      (post.mediaUrl && !post.mediaUrl.startsWith('blob:')
                        ? post.mediaUrl
                        : createVideoFallbackDataUrl(post.caption))
                    }
                    alt={post.caption || 'Video Reel'}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = createVideoFallbackDataUrl(post.caption);
                    }}
                    className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                      post.filter || ''
                    }`}
                    loading="lazy"
                  />
                  {/* Video / Reel badge in top-right */}
                  <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 backdrop-blur-md text-white drop-shadow-md z-10 flex items-center justify-center">
                    <Film className="w-3.5 h-3.5 text-white" />
                  </div>
                  {/* Keep title visible on card preview */}
                  {post.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none">
                      <p className="text-[11px] font-medium text-white/95 truncate leading-tight">
                        {post.caption}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full relative bg-neutral-950">
                  <img
                    src={post.mediaUrl}
                    alt={post.caption || 'Post image'}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = createPhotoFallbackDataUrl(post.caption);
                    }}
                    className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                      post.filter || ''
                    }`}
                    loading="lazy"
                  />
                </div>
              )}
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-6 text-white font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">❤️</span>
                  <span>{post.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💬</span>
                  <span>{Array.isArray(post.comments) ? post.comments.length : 0}</span>
                </div>
              </div>

              {/* Direct Delete Post Button (Owner/SuperAdmin) */}
              {onDeletePost && isMatchingUser(post) && (
                <button
                  id={`profile-direct-delete-btn-${post.id}`}
                  type="button"
                  title="Delete post permanently"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to permanently delete this post?')) {
                      handleDeleteDirect(post.id, e);
                    }
                  }}
                  className="absolute top-2 left-2 z-20 p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white shadow-lg transition opacity-90 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* UPI Shagun Creator Tipping Bottom Sheet */}
      <UpiShagunSheet
        isOpen={showShagunSheet}
        onClose={() => setShowShagunSheet(false)}
        creator={{
          username: user?.username || '',
          name: user?.name || user?.username || '',
          avatar: user?.avatar || '',
        }}
        onTipSent={(amount, app, note) => {
          setToastMsg(`Sent ₹${amount} Shagun to @${user?.username || ''} via ${app}! 🎁✨`);
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />

      {/* Full Creator Monetization & UPI Payout Modal */}
      {showMonetizationModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 relative">
            <button
              onClick={() => setShowMonetizationModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition z-10"
              aria-label="Close monetization dashboard"
            >
              ✕
            </button>
            <CreatorMonetizationView
              user={user}
              onClose={() => setShowMonetizationModal(false)}
            />
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-neutral-900/95 text-white dark:bg-white dark:text-neutral-900 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
