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
  Globe2,
  Scale,
  ShieldAlert,
  Trash2,
  ArrowLeft,
  Lock,
  Globe,
  X,
  Users,
  UserCheck,
  UserPlus,
  Search,
  Loader2,
} from 'lucide-react';
import { User, Post } from '../types';
import { SupportedLanguage, translations, SUPPORTED_LANGUAGES } from '../translations';
import { safeSetItem } from '../utils/safeStorage';
import { isSuperAdmin } from '../constants/admin';
import { moderationService } from '../services/moderationService';
import {
  loadFollowersListFromFirestore,
  loadFollowingListFromFirestore,
  toggleFollowUserInFirestore,
} from '../services/firebase';
import {
  createVideoFallbackDataUrl,
  createPhotoFallbackDataUrl,
} from '../utils/imageCompressor';

interface ProfileViewProps {
  user: User;
  currentUser?: User;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  followedUsers?: Record<string, boolean>;
  onToggleFollow?: (username: string, userId?: string) => void;
  onSelectUser?: (username: string, userId?: string, userObj?: User) => void;
  onBack?: () => void;
  onStartChat?: (user: User) => void;
  userPosts: Post[];
  savedPosts: Post[];
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onSelectPost: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onUpdatePostPrivacy?: (postId: string, privacy: 'public' | 'private') => void;
  onOpenStoryModal?: () => void;
  onOpenGoogleLogin?: () => void;
  onOpenLegalPolicies?: () => void;
  onOpenAdminPanel?: () => void;
  onDeleteAccount?: () => void;
  onLogout?: () => void;
  currentLanguage?: SupportedLanguage;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  isOwnProfile = true,
  isFollowing = false,
  followedUsers,
  onToggleFollow,
  onSelectUser,
  onBack,
  onStartChat,
  userPosts,
  savedPosts,
  onOpenEditProfile,
  onOpenSettings,
  onSelectPost,
  onDeletePost,
  onUpdatePostPrivacy,
  onOpenStoryModal,
  onOpenGoogleLogin,
  onOpenLegalPolicies,
  onOpenAdminPanel,
  onDeleteAccount: _onDeleteAccount,
  onLogout,
  currentLanguage = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'videos' | 'saved' | 'tagged'>('posts');
  // Follower & Following Modal List state
  const [activeListModal, setActiveListModal] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [isLoadingModalList, setIsLoadingModalList] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [localFollowedMap, setLocalFollowedMap] = useState<Record<string, boolean>>({});

  // Load followers/following list when modal opens or tab changes
  useEffect(() => {
    if (!activeListModal) {
      setModalUsers([]);
      setListSearchQuery('');
      return;
    }

    let isMounted = true;
    setIsLoadingModalList(true);
    setListSearchQuery('');

    const targetUserId = user?.id || '';
    const targetUsername = user?.username || '';

    const fetchPromise =
      activeListModal === 'followers'
        ? loadFollowersListFromFirestore(targetUserId, targetUsername)
        : loadFollowingListFromFirestore(targetUserId, targetUsername);

    fetchPromise
      .then((users) => {
        if (!isMounted) return;
        setModalUsers(users || []);
        // Seed local followed map from parent followedUsers or defaults
        const initialMap: Record<string, boolean> = {};
        (users || []).forEach((u) => {
          const clean = (u.username || '').replace(/^@/, '').toLowerCase().trim();
          if (followedUsers) {
            initialMap[u.username] = Boolean(
              followedUsers[u.username] ||
                (clean && followedUsers[clean]) ||
                (clean && followedUsers[`@${clean}`]) ||
                (u.id && followedUsers[u.id])
            );
          } else if (activeListModal === 'following' && isOwnProfile) {
            initialMap[u.username] = true;
          }
        });
        setLocalFollowedMap((prev) => ({ ...prev, ...initialMap }));
      })
      .catch((err) => {
        console.warn('Error loading followers/following list:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingModalList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeListModal, user?.id, user?.username, isOwnProfile, followedUsers]);

  const filteredModalUsers = React.useMemo(() => {
    if (!listSearchQuery.trim()) return modalUsers;
    const q = listSearchQuery.trim().toLowerCase().replace(/^@/, '');
    return modalUsers.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q)
    );
  }, [modalUsers, listSearchQuery]);

  const handleToggleFollowInModal = (targetUser: User) => {
    const clean = (targetUser.username || '').replace(/^@/, '').toLowerCase().trim();
    const isCurrentlyFollowing = Boolean(
      localFollowedMap[targetUser.username] ??
        (clean && localFollowedMap[clean]) ??
        (followedUsers &&
          (followedUsers[targetUser.username] ||
            (clean && followedUsers[clean]) ||
            (clean && followedUsers[`@${clean}`]) ||
            (targetUser.id && followedUsers[targetUser.id])))
    );

    const nextFollowing = !isCurrentlyFollowing;

    setLocalFollowedMap((prev) => ({
      ...prev,
      [targetUser.username]: nextFollowing,
      [clean]: nextFollowing,
      ...(targetUser.id ? { [targetUser.id]: nextFollowing } : {}),
    }));

    if (onToggleFollow) {
      onToggleFollow(targetUser.username, targetUser.id);
    } else if (currentUser?.id) {
      toggleFollowUserInFirestore(
        currentUser.id,
        currentUser.username || 'creator',
        targetUser.username,
        targetUser.id,
        nextFollowing
      ).catch(() => {});
    }

    setToastMsg(nextFollowing ? `Following @${clean}` : `Unfollowed @${clean}`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleViewUserFromList = (targetUser: User) => {
    setActiveListModal(null);
    if (onSelectUser) {
      onSelectUser(targetUser.username, targetUser.id, targetUser);
    }
  };

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const t = translations[currentLanguage] || translations.en;
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  const [postToDeleteConfirm, setPostToDeleteConfirm] = useState<Post | null>(null);

  // Helper to determine if a post belongs to the current profile user
  const isMatchingUser = (p: any): boolean => {
    if (!p || typeof p !== 'object' || !p.id) return false;
    if (isOwnProfile && isSuperAdmin(user)) return true;
    const targetId = (user?.id || '').trim().toLowerCase();
    const targetUsername = (user?.username || '').replace(/^@/, '').trim().toLowerCase();

    const postUserId = (p.userId || '').trim().toLowerCase();
    const postUsername = (p.username || '').replace(/^@/, '').trim().toLowerCase();

    // 1. Direct match by user ID
    if (targetId && postUserId && targetId === postUserId) return true;

    // 2. Direct match by username
    if (targetUsername && postUsername && targetUsername === postUsername) return true;

    // 3. Match by user created flag or email (for own profile)
    if (isOwnProfile && p.isUserCreated) return true;
    if (isOwnProfile && user?.email && p.userEmail && user.email.toLowerCase() === p.userEmail.toLowerCase()) return true;

    return false;
  };

  // Load and display this profile user's uploaded posts
  const resolvedUserPosts = React.useMemo(() => {
    if (!user) return [];
    const postMap = new Map<string, Post>();

    const addIfMatching = (p: any) => {
      if (p && p.id && isMatchingUser(p) && !moderationService.isPermanentlyDeleted(p.id)) {
        if (!postMap.has(p.id)) {
          postMap.set(p.id, p);
        }
      }
    };

    // 1. Check user-specific localStorage key for own profile
    if (isOwnProfile && user.id) {
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
    }

    // 2. Posts from props that match this user
    (userPosts || []).forEach(addIfMatching);

    // If viewing another user and no posts matched by strict matching, but userPosts were provided:
    if (!isOwnProfile && postMap.size === 0 && Array.isArray(userPosts)) {
      userPosts.forEach((p) => {
        if (p && p.id && !moderationService.isPermanentlyDeleted(p.id)) {
          postMap.set(p.id, p);
        }
      });
    }

    // 3. Posts directly attached to profile user object
    (user.userPosts || user.posts || []).forEach(addIfMatching);

    const allPosts = Array.from(postMap.values());
    const uniquePosts = Array.from(new Map(allPosts.map((p) => [p.id, p])).values());
    return uniquePosts;
  }, [userPosts, user, isOwnProfile]);

  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);

  // Direct instant delete from Profile
  const handleDeleteDirect = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const rawId = postId.replace(/^reel-/, '');

    // 1. Immediately hide from profile UI state with 0 latency
    setDeletedPostIds((prev) => Array.from(new Set([...prev, postId, rawId, `reel-${rawId}`])));

    // 2. Mark as permanently deleted in moderation service
    try {
      moderationService.deletePostPermanently(postId);
    } catch {}

    // 3. Clear from all potential localStorage post stores
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
              localStorage.setItem(k, JSON.stringify(list.filter((x: any) => x && x.id !== postId && x.id !== rawId && x.id !== `reel-${rawId}`)));
            }
          } catch {}
        }
      });
    } catch {}

    // 4. Trigger parent delete handler
    if (onDeletePost) {
      onDeletePost(postId);
    }
  };

  const safeResolvedPosts = React.useMemo(() => {
    const list = (Array.isArray(resolvedUserPosts) ? resolvedUserPosts : []).filter(
      (p) => !deletedPostIds.includes(p.id) && !moderationService.isPermanentlyDeleted(p.id)
    );
    return Array.from(new Map(list.map((p) => [p.id, p])).values());
  }, [resolvedUserPosts, deletedPostIds]);

  const safeSavedPosts = React.useMemo(() => {
    const list = (Array.isArray(savedPosts) ? savedPosts : []).filter(
      (p) => !deletedPostIds.includes(p.id) && !moderationService.isPermanentlyDeleted(p.id)
    );
    return Array.from(new Map(list.map((p) => [p.id, p])).values());
  }, [savedPosts, deletedPostIds]);

  const isActuallyFollowing = Boolean(
    isFollowing ||
      (followedUsers &&
        ((user?.username &&
          (followedUsers[user.username] ||
            followedUsers[`@${user.username}`] ||
            followedUsers[user.username.replace(/^@/, '')])) ||
          (user?.id && followedUsers[user.id])))
  );

  const effectivePostsCount = safeResolvedPosts.length;
  const effectiveFollowersCount =
    (user?.followersCount || 0) + (!isOwnProfile && isActuallyFollowing ? 1 : 0);

  const videoPosts = React.useMemo(() => {
    const list = safeResolvedPosts.filter((p) => p.mediaType === 'video');
    return Array.from(new Map(list.map((p) => [p.id, p])).values());
  }, [safeResolvedPosts]);

  const displayPosts =
    activeTab === 'posts'
      ? safeResolvedPosts
      : (activeTab === 'reels' || activeTab === 'videos')
      ? videoPosts
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
      {/* Back button if opened as a dedicated user profile */}
      {onBack && (
        <button
          id="profile-back-arrow-btn"
          onClick={onBack}
          className="mb-4 -ml-1 py-1.5 px-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition flex items-center gap-2 text-sm font-semibold cursor-pointer border border-neutral-200 dark:border-neutral-800 w-fit"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      )}

      {/* Guest Mode Banner (only for own profile) */}
      {isOwnProfile && !user?.email && !user?.isGoogleAuth && onOpenGoogleLogin && (
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
          {isOwnProfile && (
            <button
              onClick={onOpenEditProfile}
              title="Change profile photo"
              className="absolute bottom-1 right-1 p-2 bg-neutral-900 dark:bg-neutral-800 text-white rounded-full border-2 border-white dark:border-black shadow-md hover:scale-110 transition"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
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
                {isOwnProfile && isSuperAdmin(user) && (
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-xs tracking-wider">
                    Super Admin
                  </span>
                )}
              </h1>
            </div>

            {/* Top Right Action & Settings Group */}
            {!(
              isOwnProfile ||
              Boolean(
                currentUser && (
                  (currentUser.id && user?.id && currentUser.id.toLowerCase() === user.id.toLowerCase()) ||
                  (currentUser.username && user?.username && (
                    currentUser.username.toLowerCase().replace(/^@/, '').trim() ===
                    user.username.toLowerCase().replace(/^@/, '').trim()
                  ))
                )
              )
            ) ? (
              <div className="flex flex-wrap items-center gap-2">
                {/* Follow / Following Button */}
                <button
                  id={`profile-follow-btn-${user?.username}`}
                  onClick={() => onToggleFollow && onToggleFollow(user.username, user.id)}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5 ${
                    isActuallyFollowing
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/20'
                  }`}
                >
                  <span>{isActuallyFollowing ? (t.following || 'Following') : (t.follow || 'Follow')}</span>
                </button>

                {/* Message Button */}
                {onStartChat && (
                  <button
                    id="profile-message-btn"
                    onClick={() => onStartChat(user)}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  >
                    {t.messages || 'Message'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* Edit Profile Button */}
                <button
                  id="edit-profile-btn"
                  onClick={onOpenEditProfile}
                  className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-sm font-semibold transition cursor-pointer"
                >
                  {t.editProfile}
                </button>

                {/* Settings Gear Icon (⚙️) Button */}
                <button
                  id="profile-settings-btn"
                  onClick={onOpenSettings}
                  aria-label="Settings"
                  title="Settings & Language"
                  className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 hover:rotate-45 transition duration-300 relative group flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">{t.settings}</span>
                </button>

                {/* Language quick badge */}
                <button
                  onClick={onOpenSettings}
                  title="Change language"
                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{activeLangObj?.name || 'English'}</span>
                </button>

                {/* Legal & Privacy Policies button */}
                {onOpenLegalPolicies && (
                  <button
                    id="profile-legal-btn"
                    onClick={onOpenLegalPolicies}
                    className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 transition flex items-center cursor-pointer"
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
                    title="Super Admin Moderation & Creator Payouts"
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
            )}
          </div>

          {/* Counts (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-8 text-sm">
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {effectivePostsCount}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.posts}</span>
            </div>
            <button
              type="button"
              id="profile-desktop-followers-btn"
              onClick={() => setActiveListModal('followers')}
              className="text-left hover:opacity-75 transition cursor-pointer group"
            >
              <span className="font-bold text-neutral-900 dark:text-white group-hover:underline">
                {effectiveFollowersCount.toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.followers}</span>
            </button>
            <button
              type="button"
              id="profile-desktop-following-btn"
              onClick={() => setActiveListModal('following')}
              className="text-left hover:opacity-75 transition cursor-pointer group"
            >
              <span className="font-bold text-neutral-900 dark:text-white group-hover:underline">
                {(user?.followingCount || 0).toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.following}</span>
            </button>
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
          </div>
        </div>
      </div>

      {/* Mobile Stats Row */}
      <div className="flex sm:hidden items-center justify-around py-3 border-y border-neutral-200 dark:border-neutral-800 text-center text-sm mb-4">
        <div>
          <div className="font-bold text-neutral-900 dark:text-white">{effectivePostsCount}</div>
          <div className="text-xs text-neutral-500">{t.posts}</div>
        </div>
        <button
          type="button"
          id="profile-mobile-followers-btn"
          onClick={() => setActiveListModal('followers')}
          className="cursor-pointer active:scale-95 transition text-center"
        >
          <div className="font-bold text-neutral-900 dark:text-white">
            {effectiveFollowersCount.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">{t.followers}</div>
        </button>
        <button
          type="button"
          id="profile-mobile-following-btn"
          onClick={() => setActiveListModal('following')}
          className="cursor-pointer active:scale-95 transition text-center"
        >
          <div className="font-bold text-neutral-900 dark:text-white">
            {(user?.followingCount || 0).toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">{t.following}</div>
        </button>
      </div>

      {/* Story Highlights */}
      {(isOwnProfile || (highlights && highlights.length > 0)) && (
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

          {/* Add Highlight (Own Profile Only) */}
          {isOwnProfile && (
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
          )}
        </div>
      )}

      {/* Profile Tabs Navigation */}
      <div className="flex items-center justify-center gap-6 sm:gap-12 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold tracking-wider uppercase mb-4">
        <button
          id="profile-tab-posts"
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 py-3 border-t -mt-[1px] transition cursor-pointer ${
            activeTab === 'posts'
              ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>{t.posts} ({safeResolvedPosts.length})</span>
        </button>

        <button
          id="profile-tab-reels"
          onClick={() => setActiveTab('reels')}
          className={`flex items-center gap-1.5 py-3 border-t -mt-[1px] transition cursor-pointer ${
            activeTab === 'reels'
              ? 'border-rose-500 text-rose-500 dark:text-rose-400 font-bold'
              : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          <Film className="w-4 h-4 text-rose-500" />
          <span>Videos Folder ({videoPosts.length})</span>
        </button>

        {isOwnProfile && (
          <button
            id="profile-tab-saved"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 py-3 border-t -mt-[1px] transition cursor-pointer ${
              activeTab === 'saved'
                ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{t.saved}</span>
          </button>
        )}

        {isOwnProfile && (
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
        )}
      </div>

      {/* Posts Grid */}
      {(displayPosts || []).length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center mx-auto mb-3">
            {activeTab === 'saved' ? (
              <Bookmark className="w-7 h-7 text-neutral-400" />
            ) : activeTab === 'reels' ? (
              <Film className="w-7 h-7 text-rose-500" />
            ) : (
              <Grid className="w-7 h-7 text-neutral-400" />
            )}
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            {activeTab === 'reels'
              ? 'Is folder me abhi koi video nahi hai'
              : activeTab === 'saved'
              ? t.noSavedPosts
              : 'Abhi koi reel ya post nahi hai'}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'reels'
              ? 'Aapki ya is creator ki uploaded video reels yahan folder me dikhengi.'
              : activeTab === 'saved'
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
                  {/* Private badge if post is private */}
                  {(post.privacy === 'private' || post.isPrivate) && (
                    <div className="absolute top-2 right-9 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-bold border border-amber-400/40 flex items-center gap-1 z-10 shadow-md">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Private</span>
                    </div>
                  )}
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
                  {/* Private badge if post is private */}
                  {(post.privacy === 'private' || post.isPrivate) && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-bold border border-amber-400/40 flex items-center gap-1 z-10 shadow-md">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Private</span>
                    </div>
                  )}
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

              {/* Quick Privacy Toggle Button (Owner Only) */}
              {onUpdatePostPrivacy && (isOwnProfile || isSuperAdmin(currentUser)) && isMatchingUser(post) && (
                <button
                  id={`profile-privacy-toggle-btn-${post.id}`}
                  type="button"
                  title={
                    post.privacy === 'private' || post.isPrivate
                      ? 'Post is Private (Only you see it). Tap to make Public'
                      : 'Post is Public. Tap to make Private'
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextPrivacy = post.privacy === 'private' || post.isPrivate ? 'public' : 'private';
                    onUpdatePostPrivacy(post.id, nextPrivacy);
                  }}
                  className="absolute bottom-2 right-2 z-20 p-1.5 rounded-full bg-black/80 hover:bg-black text-white shadow-lg transition opacity-90 md:opacity-0 md:group-hover:opacity-100 cursor-pointer border border-white/20"
                >
                  {post.privacy === 'private' || post.isPrivate ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* In-App Permanent Deletion Confirmation Modal */}
      {postToDeleteConfirm && (
        <div
          id="profile-delete-confirm-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setPostToDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/10 p-6 text-white shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Delete Post Permanently?
            </h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              This video or post will be immediately and permanently removed from Cloud Firestore, Home Feed, Reels, and your profile.
            </p>
            <div className="w-full flex flex-col gap-2.5">
              <button
                id="confirm-delete-permanent-btn"
                type="button"
                onClick={(e) => {
                  const idToDelete = postToDeleteConfirm.id;
                  setPostToDeleteConfirm(null);
                  handleDeleteDirect(idToDelete, e);
                }}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Delete Permanently
              </button>
              <button
                id="cancel-delete-permanent-btn"
                type="button"
                onClick={() => setPostToDeleteConfirm(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follower & Following Modal List */}
      {activeListModal && (
        <div
          id="followers-following-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setActiveListModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveListModal('followers')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                    activeListModal === 'followers'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Followers ({effectiveFollowersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListModal('following')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                    activeListModal === 'following'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Following ({user?.followingCount || 0})
                </button>
              </div>
              <button
                type="button"
                id="close-followers-modal-btn"
                onClick={() => setActiveListModal(null)}
                aria-label="Close modal"
                className="p-1 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  placeholder={`Search ${activeListModal}...`}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {isLoadingModalList ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-xs">Loading {activeListModal}...</span>
                </div>
              ) : filteredModalUsers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3 text-neutral-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {listSearchQuery
                      ? 'No matching users found'
                      : activeListModal === 'followers'
                      ? 'No followers yet'
                      : 'Not following anyone yet'}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                    {listSearchQuery
                      ? 'Try searching for another name or username.'
                      : activeListModal === 'followers'
                      ? 'When people follow this profile, they will appear here.'
                      : 'Follow other creators to see their reels in your feed.'}
                  </p>
                </div>
              ) : (
                filteredModalUsers.map((u) => {
                  const isCurrentSelf =
                    currentUser &&
                    ((currentUser.id && u.id && currentUser.id === u.id) ||
                      (currentUser.username &&
                        u.username &&
                        currentUser.username.replace(/^@/, '').toLowerCase() ===
                          u.username.replace(/^@/, '').toLowerCase()));

                  const isFollowed = Boolean(
                    localFollowedMap[u.username] ??
                      (followedUsers &&
                        (followedUsers[u.username] ||
                          followedUsers[`@${u.username}`] ||
                          (u.id && followedUsers[u.id]))) ??
                      (activeListModal === 'following' && isOwnProfile)
                  );

                  return (
                    <div
                      key={u.id || u.username}
                      className="p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition flex items-center justify-between gap-3"
                    >
                      {/* User Info clickable to view profile */}
                      <button
                        type="button"
                        onClick={() => handleViewUserFromList(u)}
                        className="flex items-center gap-3 text-left min-w-0 flex-1 cursor-pointer group"
                      >
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                          alt={u.name || u.username}
                          className="w-11 h-11 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0 group-hover:scale-105 transition"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate group-hover:underline">
                              {u.username.replace(/^@/, '')}
                            </span>
                            {u.isVerified && (
                              <BadgeCheck className="w-3.5 h-3.5 text-sky-500 fill-sky-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 truncate">{u.name || u.username}</p>
                          {u.bio && (
                            <p className="text-[11px] text-neutral-400 truncate max-w-[200px] mt-0.5">
                              {u.bio}
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Follow / Unfollow button */}
                      {!isCurrentSelf && (
                        <button
                          type="button"
                          id={`modal-user-follow-btn-${u.username}`}
                          onClick={() => handleToggleFollowInModal(u)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-1 ${
                            isFollowed
                              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
                              : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:opacity-90'
                          }`}
                        >
                          {isFollowed ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-neutral-900/95 text-white dark:bg-white dark:text-neutral-900 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Google Play Policy Profile Footer */}
      <footer className="pt-8 pb-14 text-center text-xs text-neutral-400 dark:text-neutral-500 border-t border-neutral-200 dark:border-neutral-800/80 mt-10 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
          {onOpenLegalPolicies && (
            <>
              <button
                type="button"
                id="profile-footer-privacy-btn"
                onClick={onOpenLegalPolicies}
                className="hover:text-neutral-900 dark:hover:text-white transition underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                id="profile-footer-terms-btn"
                onClick={onOpenLegalPolicies}
                className="hover:text-neutral-900 dark:hover:text-white transition underline cursor-pointer"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                id="profile-footer-ugc-btn"
                onClick={onOpenLegalPolicies}
                className="hover:text-neutral-900 dark:hover:text-white transition underline cursor-pointer"
              >
                UGC Guidelines
              </button>
            </>
          )}
        </div>
        <p className="text-[10px] text-neutral-400">
          Jhalak Reels: Made in India • Google Play Store Verified App
        </p>
      </footer>
    </div>
  );
};
