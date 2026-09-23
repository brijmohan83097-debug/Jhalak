import React, { useState, useEffect, useMemo } from 'react';
import { NavTab, Post, StoryGroup, User, Conversation, Comment, Message, Reel, ContentCategory } from './types';
import {
  currentUser as initialCurrentUser,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { MobileHeader, MobileBottomNav } from './components/MobileNav';
import { StoriesBar } from './components/StoriesBar';
import { FeedPostCard } from './components/FeedPostCard';
import { AdMobBannerAd } from './components/AdMobBannerAd';
import { AdMobNativeFeedAd } from './components/AdMobNativeFeedAd';
import { adMobService } from './services/adMobService';
import { StoryViewerModal } from './components/StoryViewerModal';
import { CreatePostModal } from './components/CreatePostModal';
import { ExploreView } from './components/ExploreView';
import { ProfileView } from './components/ProfileView';
import { DirectMessagesView } from './components/DirectMessagesView';
import { PostDetailModal } from './components/PostDetailModal';
import { ShareModal } from './components/ShareModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { RightSuggestionsSidebar } from './components/RightSuggestionsSidebar';
import { ReelsView } from './components/ReelsView';
import { FullScreenMediaViewer } from './components/FullScreenMediaViewer';
import { GoogleAuthModal, GoogleAccount } from './components/GoogleAuthModal';
import { GoogleWelcomeScreen } from './components/GoogleWelcomeScreen';
import { CommentsBottomSheet } from './components/CommentsBottomSheet';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ReportModal } from './components/ReportModal';
import { LegalPoliciesModal } from './components/LegalPoliciesModal';
import { AccountDeletionModal } from './components/AccountDeletionModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { AdminModerationDashboard } from './components/AdminModerationDashboard';
import { CheckCircle, Plus, Search, ArrowLeft, Check, RefreshCw, BadgeCheck } from 'lucide-react';
import { SupportedLanguage, translations } from './translations';
import { recommendationEngine, inferCategory, inferLanguage } from './services/recommendationEngine';
import { moderationService } from './services/moderationService';
import { SplashScreen } from './components/SplashScreen';
import {
  UGCCommunityGuidelinesModal,
  hasUserConsentedToUGC,
} from './components/UGCCommunityGuidelinesModal';
import {
  safeSetItem,
  registerStorageWarningToast,
  STORAGE_QUOTA_EVENT,
  StorageQuotaDetail,
} from './utils/safeStorage';
import {
  subscribeToAuthState,
  subscribeToFirestorePosts,
  loadPostsFromFirestore,
  syncUserProfile,
  getUserProfile,
  savePostToFirestore,
  deletePostFromFirestore,
  decrementUserPostsCount,
  toggleLikeInFirestore,
  addCommentToFirestore,
  toggleFollowUserInFirestore,
  loadFollowedUsersFromFirestore,
  logOutFirebase,
  testConnection,
  signInWithGoogle,
  checkRedirectAuthResult,
  subscribeToFirestoreConversations,
  sendFirestoreMessage,
} from './services/firebase';
import { ADMIN_EMAIL, isSuperAdmin } from './constants/admin';
import { pauseAllMedia } from './utils/mediaCoordinator';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Language State with local persistence (default: 'en')
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('jhalak_language') as SupportedLanguage | null;
    return saved || 'en';
  });

  // Theme state with local persistence (defaults to dark for modern Instagram aesthetic)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ig_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  // Active Tab state
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Google Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('jhalak_auth_state');
    return saved !== null ? saved === 'true' : false;
  });

  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    // Guest Mode is enabled by default so users can open the app and watch Reels immediately without logging in
    return true;
  });

  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState(false);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Real-time recommendation & personalization engine subscription state
  const [recsVersion, setRecsVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = recommendationEngine.subscribe(() => {
      setRecsVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Core Data States
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const activeUserId = localStorage.getItem('ig_current_user_id');
      const saved = localStorage.getItem('ig_current_user');
      let user: User = initialCurrentUser;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          user = parsed;
        }
      }
      if (activeUserId) {
        user.id = activeUserId;
      }

      // Load saved profile data for this specific user ID if available
      try {
        const savedProfileRaw = localStorage.getItem(`ig_user_profile_${user.id}`);
        if (savedProfileRaw) {
          const parsedProfile = JSON.parse(savedProfileRaw);
          if (parsedProfile && typeof parsedProfile === 'object') {
            user = { ...user, ...parsedProfile };
          }
        }
      } catch {}

      // Collect strictly this user's uploaded posts saved by their user ID
      const profilePostsMap = new Map<string, Post>();

      const isMatchingProfileUser = (p: any): boolean => {
        if (!p || typeof p !== 'object' || !p.id) return false;
        const targetId = (user.id || '').trim().toLowerCase();
        const targetUsername = (user.username || '').trim().toLowerCase();
        const postUserId = (p.userId || '').trim().toLowerCase();
        const postUsername = (p.username || '').trim().toLowerCase();

        if (targetId && postUserId && targetId === postUserId) return true;
        if (targetUsername && postUsername && targetUsername === postUsername) return true;
        return false;
      };

      // 1. Check user-specific localStorage key: ig_user_posts_${user.id}
      try {
        const userPostsKey = `ig_user_posts_${user.id}`;
        const raw = localStorage.getItem(userPostsKey);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((p: Post) => {
              if (p && p.id && isMatchingProfileUser(p)) {
                profilePostsMap.set(p.id, p);
              }
            });
          }
        }

        // Legacy fallback exclusively for Super Admin
        if (isSuperAdmin(user)) {
          const legacyMe = localStorage.getItem('ig_user_posts_user-me');
          if (legacyMe) {
            const list = JSON.parse(legacyMe);
            if (Array.isArray(list)) {
              list.forEach((p: Post) => {
                if (p && p.id && isMatchingProfileUser(p)) profilePostsMap.set(p.id, p);
              });
            }
          }
        }
      } catch {
        // safe
      }

      // 2. Attach any posts already directly attached to user object if matching
      (user.userPosts || user.posts || []).forEach((p) => {
        if (p && p.id && isMatchingProfileUser(p) && !profilePostsMap.has(p.id)) {
          profilePostsMap.set(p.id, p);
        }
      });

      const resolvedPosts = Array.from(profilePostsMap.values());
      const verifiedPostsCount = resolvedPosts.length;

      const finalizedUser: User = {
        ...user,
        postsCount: verifiedPostsCount,
        posts: resolvedPosts,
        userPosts: resolvedPosts,
      };

      try {
        safeSetItem('ig_current_user', JSON.stringify(finalizedUser));
        safeSetItem(`ig_user_posts_${finalizedUser.id}`, JSON.stringify(resolvedPosts));
      } catch {
        // safe
      }
      return finalizedUser;
    } catch {
      return initialCurrentUser;
    }
  });

  // Strict validator that preserves all user-uploaded posts & reels while discarding old dummy fixture IDs
  const isRealPost = (p: Post | any): boolean => {
    if (!p || !p.id) return false;
    const id = String(p.id);
    if (id.startsWith('dummy-') || id.startsWith('post-bhojpuri-') || id.match(/^post-[0-9]{1,3}$/)) {
      return false;
    }
    return true;
  };

  const isRealReel = (r: Reel | any): boolean => {
    if (!r || !r.id) return false;
    const id = String(r.id);
    if (id.startsWith('dummy-') || id.startsWith('reel-bhojpuri-') || id.match(/^reel-[0-9]{1,3}$/)) {
      return false;
    }
    return true;
  };

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      // Strictly load real posts; all old dummy fixture posts are pruned
      const raw = localStorage.getItem('jhalak_uploaded_posts_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(isRealPost);
        }
      }
    } catch {
      // safe
    }
    return [];
  });

  const [reels, setReels] = useState<Reel[]>(() => {
    try {
      // Strictly load real reels; all old dummy fixture reels are pruned
      const raw = localStorage.getItem('jhalak_uploaded_reels_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(isRealReel);
        }
      }
    } catch {
      // safe
    }
    return [];
  });

  const [stories, setStories] = useState<StoryGroup[]>(() => {
    try {
      localStorage.removeItem('ig_stories');
    } catch {}
    return [];
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('ig_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore corrupted data
    }
    return [];
  });

  // Modals & Overlays state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialAudio, setCreateInitialAudio] = useState<string | undefined>(undefined);
  const [selectedPostDetail, setSelectedPostDetail] = useState<Post | null>(null);
  const [fullScreenViewerState, setFullScreenViewerState] = useState<{
    isOpen: boolean;
    initialPostId: string;
    posts: Post[];
  } | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const activeCommentsPost = useMemo(
    () => posts.find((p) => p.id === activeCommentsPostId) || null,
    [posts, activeCommentsPostId]
  );

  // Pull-to-refresh and swipe gesture states
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const touchStartPosRef = React.useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const [reportTarget, setReportTarget] = useState<{
    id: string;
    type: 'post' | 'reel';
    username: string;
    caption?: string;
    mode?: 'report' | 'block';
  } | null>(null);
  const [blockedVersion, setBlockedVersion] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'ugc' | 'data-safety'>('privacy');
  const [isAccountDeletionModalOpen, setIsAccountDeletionModalOpen] = useState(false);
  const [isUgcConsentModalOpen, setIsUgcConsentModalOpen] = useState(false);
  const [pendingAudioForUgcConsent, setPendingAudioForUgcConsent] = useState<string | null>(null);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAdminModDashboardOpen, setIsAdminModDashboardOpen] = useState(false);
  const [quickReportDialogInfo, setQuickReportDialogInfo] = useState<{
    id: string;
    username: string;
  } | null>(null);
  const [topUploadBar, setTopUploadBar] = useState<{
    progress: number;
    completed: boolean;
    title: string;
  } | null>(null);

  // Selected profile user to view in Instagram-style profile
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

  // Follow / Unfollow State with local cache and Firestore persistence
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('ig_followed_users');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Sync followed users from Firestore for current user
  useEffect(() => {
    if (currentUser?.id) {
      loadFollowedUsersFromFirestore(currentUser.id).then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setFollowedUsers((prev) => {
            const next = { ...prev };
            list.forEach((u) => {
              const clean = (u || '').replace(/^@/, '').trim();
              if (clean) {
                next[clean] = true;
                next[`@${clean}`] = true;
              }
            });
            try {
              localStorage.setItem('ig_followed_users', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      }).catch(() => {});
    }
  }, [currentUser?.id]);

  const handleToggleFollow = (targetUsername: string, targetUserId?: string) => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to follow creators ✨');
      return;
    }
    const cleanTarget = (targetUsername || '').replace(/^@/, '').trim();
    if (!cleanTarget) return;

    const currentlyFollowing = Boolean(
      followedUsers[cleanTarget] ||
        followedUsers[`@${cleanTarget}`] ||
        (targetUserId && followedUsers[targetUserId])
    );
    const nextFollowing = !currentlyFollowing;

    setFollowedUsers((prev) => {
      const updated = {
        ...prev,
        [cleanTarget]: nextFollowing,
        [`@${cleanTarget}`]: nextFollowing,
      };
      if (targetUserId) {
        updated[targetUserId] = nextFollowing;
      }
      try {
        localStorage.setItem('ig_followed_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Save follow state directly to Firestore
    toggleFollowUserInFirestore(
      currentUser.id,
      currentUser.username,
      cleanTarget,
      targetUserId,
      nextFollowing
    ).catch(() => {});

    showToast(nextFollowing ? `Following @${cleanTarget} ✨` : `Unfollowed @${cleanTarget}`);
  };

  const t = translations[currentLanguage];

  // Subscribe to moderation changes
  useEffect(() => {
    return moderationService.subscribe(() => {
      setBlockedVersion((v) => v + 1);
    });
  }, []);

  // Firebase Initialization & Real-Time Sync
  useEffect(() => {
    // 1. Check connection
    testConnection().then((connected) => {
      if (connected) {
        console.log('Firebase services initialized and active.');
      }
    });

    // 2. Check for redirect login result if user returned from redirect
    checkRedirectAuthResult().then(async (fbUser) => {
      if (fbUser) {
        const realDisplayName = (fbUser.displayName || '').trim();
        const email = (fbUser.email || '').trim();
        const rawName = realDisplayName || (email ? email.split('@')[0] : 'User');
        // Automatically set profile username to the user's real Google displayName
        const cleanUsername = realDisplayName || (email ? email.split('@')[0] : 'User');
        // Display their real Google photoURL instead of "user_xxxx"
        const avatar =
          fbUser.photoURL ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

        const account: GoogleAccount = {
          name: rawName,
          email,
          avatar,
          username: cleanUsername,
          firebaseUid: fbUser.uid,
        };

        handleGoogleLoginSuccess(account);
      }
    });

    // 3. Subscribe to Firebase Auth state
    const unsubscribeAuth = subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          const realDisplayName = (fbUser.displayName || '').trim();
          const email = (fbUser.email || '').trim();
          const emailPrefix = email ? email.split('@')[0] : '';
          const rawName = realDisplayName || profile?.name || emailPrefix || 'User';

          // Automatically set profile username to the user's real Google displayName
          // Replace any old placeholder "user_xxxx" or "creator_xxxx" with real Google displayName
          let cleanUsername = realDisplayName;
          if (!cleanUsername) {
            if (profile?.username && !profile.username.startsWith('user_') && !profile.username.startsWith('creator_')) {
              cleanUsername = profile.username;
            } else {
              cleanUsername = emailPrefix || 'User';
            }
          }

          // Display their real Google photoURL instead of "user_xxxx"
          const avatar =
            fbUser.photoURL ||
            (profile?.avatar && !profile.avatar.includes('user_') && !profile.avatar.includes('dicebear') ? profile.avatar : '') ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

          setCurrentUser((prev) => ({
            ...prev,
            id: fbUser.uid,
            name: rawName,
            username: cleanUsername,
            avatar: avatar,
            email: email || prev.email,
            isGoogleAuth: true,
            followersCount: profile?.followersCount ?? prev.followersCount,
            watchHours: profile?.watchHours ?? prev.watchHours,
            dailyReelsCount: profile?.dailyReelsCount ?? prev.dailyReelsCount,
            dailyPhotosCount: profile?.dailyPhotosCount ?? prev.dailyPhotosCount,
          }));
          setIsAuthenticated(true);
          setIsGuestMode(false);

          // If stored Firestore profile has legacy user_xxxx or lacks real Google avatar, sync with real data
          if (realDisplayName && (profile?.username?.startsWith('user_') || profile?.username?.startsWith('creator_') || !profile?.avatar || fbUser.photoURL)) {
            syncUserProfile({
              id: fbUser.uid,
              name: rawName,
              username: cleanUsername,
              avatar: avatar,
              email: email,
            }).catch(() => {});
          }
        } catch {
          // Handled
        }
      }
    });

    // Clean out old legacy mock caches
    try {
      localStorage.removeItem('ig_feed_posts');
      localStorage.removeItem('ig_reels');
      localStorage.removeItem('ig_explore_posts');
    } catch {
      // safe
    }

    // 3. Subscribe to Real-Time Cloud Firestore Posts
    const unsubscribePosts = subscribeToFirestorePosts((livePosts) => {
      syncPostsAndReels(livePosts);
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Save language selection
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    try {
      safeSetItem('jhalak_language', lang);
    } catch {
      // Gracefully handled for this session without warning banners
    }
    showToast(`Language switched to ${translations[lang].language}`);
  };

  // Helper: Synchronize posts and reels together from Firestore and local sessions
  const syncPostsAndReels = (livePosts: Post[]) => {
    const realLive = (livePosts || []).filter(isRealPost);

    // Read user likes cache to keep like state solid across refreshes
    let userLikedSet = new Set<string>();
    try {
      const activeId = currentUser?.id || localStorage.getItem('ig_current_user_id') || 'me';
      const storedLikes = localStorage.getItem(`ig_user_likes_${activeId}`);
      if (storedLikes) {
        const parsed = JSON.parse(storedLikes);
        if (Array.isArray(parsed)) {
          userLikedSet = new Set(parsed);
        }
      }
    } catch {
      // safe
    }

    // Also merge any real local session uploads
    let localUploads: Post[] = [];
    try {
      const raw = localStorage.getItem('jhalak_uploaded_posts_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localUploads = parsed.filter(isRealPost);
        }
      }
    } catch {
      // safe
    }

    const postMap = new Map<string, Post>();
    realLive.forEach((lp) => {
      const cleanId = lp.id.replace(/^reel-/, '');
      const isLiked = Boolean(
        (currentUser?.id && lp.likedBy?.includes(currentUser.id)) ||
        (currentUser?.username && lp.likedBy?.includes(currentUser.username)) ||
        userLikedSet.has(lp.id) ||
        userLikedSet.has(cleanId) ||
        lp.isLiked
      );

      // Merge cached comments if available so comments never disappear
      let postComments = Array.isArray(lp.comments) ? [...lp.comments] : [];
      try {
        const cached = localStorage.getItem(`ig_comments_${lp.id}`) || localStorage.getItem(`ig_comments_${cleanId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const seen = new Set(postComments.map((c) => c.id));
            parsed.forEach((c) => {
              if (!seen.has(c.id)) {
                postComments.push(c);
                seen.add(c.id);
              }
            });
          }
        }
      } catch {
        // safe
      }

      postMap.set(lp.id, {
        ...lp,
        isLiked,
        comments: postComments,
        commentsCount: Math.max(postComments.length, lp.commentsCount || 0),
      });
    });

    localUploads.forEach((up) => {
      if (!postMap.has(up.id)) {
        const cleanId = up.id.replace(/^reel-/, '');
        const isLiked = userLikedSet.has(up.id) || userLikedSet.has(cleanId) || Boolean(up.isLiked);
        postMap.set(up.id, {
          ...up,
          isLiked,
          comments: Array.isArray(up.comments) ? up.comments : [],
        });
      }
    });

    const finalPosts = Array.from(postMap.values());
    setPosts(finalPosts);

    // Also merge video posts into Reels
    const videoPosts = finalPosts.filter((lp) => lp.mediaType === 'video');
    const mappedReels: Reel[] = videoPosts.map((vp) => {
      const cleanId = vp.id.replace(/^reel-/, '');
      const isLiked = Boolean(
        (currentUser?.id && vp.likedBy?.includes(currentUser.id)) ||
        (currentUser?.username && vp.likedBy?.includes(currentUser.username)) ||
        userLikedSet.has(vp.id) ||
        userLikedSet.has(cleanId) ||
        vp.isLiked
      );

      return {
        id: `reel-${vp.id}`,
        userId: vp.userId,
        username: vp.username,
        userAvatar: vp.userAvatar,
        videoUrl: vp.mediaUrl,
        thumbnailUrl: vp.thumbnailUrl,
        caption: vp.caption,
        category: vp.category,
        audioTitle: vp.audioTitle || 'Original Audio',
        audioArtist: vp.username,
        likesCount: vp.likesCount || 0,
        commentsCount: (vp.comments || []).length,
        sharesCount: 0,
        isLiked,
        likedBy: vp.likedBy || [],
        isSaved: false,
        comments: vp.comments || [],
        tags: vp.tags || [],
        timestamp: vp.timestamp || 'Recently',
        createdAt: vp.createdAt,
        isUserCreated: true,
      };
    });

    // Also check local reel uploads
    let localReels: Reel[] = [];
    try {
      const rawReels = localStorage.getItem('jhalak_uploaded_reels_v1');
      if (rawReels) {
        const parsed = JSON.parse(rawReels);
        if (Array.isArray(parsed)) {
          localReels = parsed.filter(isRealReel);
        }
      }
    } catch {
      // safe
    }

    const reelMap = new Map<string, Reel>();
    mappedReels.forEach((r) => reelMap.set(r.id, r));
    localReels.forEach((lr) => {
      if (!reelMap.has(lr.id)) reelMap.set(lr.id, lr);
    });

    setReels(Array.from(reelMap.values()));
  };

  // Google Play Store Policy Deep Linking: auto-open Privacy Policy, Terms, or Account Deletion
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page') || params.get('tab') || params.get('view');
      if (page === 'privacy' || page === 'privacy-policy') {
        setLegalModalTab('privacy');
        setIsLegalModalOpen(true);
      } else if (page === 'terms' || page === 'terms-of-service') {
        setLegalModalTab('terms');
        setIsLegalModalOpen(true);
      } else if (page === 'ugc' || page === 'community-guidelines') {
        setLegalModalTab('ugc');
        setIsLegalModalOpen(true);
      } else if (page === 'delete-account' || page === 'delete-data' || page === 'account-deletion') {
        setIsAccountDeletionModalOpen(true);
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Feed Pull-To-Refresh: reloads latest posts & reels directly from Firestore silently
  const handleRefreshFeed = async () => {
    setIsRefreshingFeed(true);
    try {
      await testConnection();
      const freshPosts = await loadPostsFromFirestore();
      if (freshPosts && freshPosts.length > 0) {
        syncPostsAndReels(freshPosts);
      }
    } catch {
      // Quiet reload without intrusive toast popups
    } finally {
      setTimeout(() => {
        setIsRefreshingFeed(false);
        setPullProgress(0);
      }, 500);
    }
  };

  // Gesture Handling: Right-to-Left Swipe from Home to Reels & Pull-To-Refresh
  const handleHomeTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleHomeTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - touchStartPosRef.current.y;
      const deltaX = currentX - touchStartPosRef.current.x;
      const isAtTop = window.scrollY <= 5;

      if (isAtTop && deltaY > 15 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && !isRefreshingFeed) {
        const nextProgress = Math.min((deltaY - 15) / 70, 1);
        setPullProgress((prev) => (Math.abs(prev - nextProgress) > 0.05 ? nextProgress : prev));
      } else if (pullProgress > 0) {
        setPullProgress(0);
      }
    }
  };

  const handleHomeTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartPosRef.current.x;
      const deltaY = endY - touchStartPosRef.current.y;

      // 1. Right-to-left swipe from Home to open Reels (only if clean horizontal gesture without vertical scroll)
      if (deltaX < -110 && Math.abs(deltaY) < 28 && Math.abs(deltaX) > Math.abs(deltaY) * 2.5) {
        setPullProgress(0);
        setCurrentTab('reels');
        return;
      }

      // 2. Pull-to-refresh on Home feed to load latest posts (deltaY > 55, predominantly vertical, at top)
      const isAtTop = window.scrollY <= 10;
      if (isAtTop && deltaY > 55 && Math.abs(deltaY) > Math.abs(deltaX) && !isRefreshingFeed) {
        setIsRefreshingFeed(true);
        setPullProgress(1);
        handleRefreshFeed();
      } else {
        setPullProgress(0);
      }
    }
  };

  // Sync dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      try {
        safeSetItem('ig_theme', 'dark');
      } catch {
        // quota handled
      }
    } else {
      document.documentElement.classList.remove('dark');
      try {
        safeSetItem('ig_theme', 'light');
      } catch {
        // quota handled
      }
    }
  }, [darkMode]);

  // Persist feed posts safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_feed_posts', JSON.stringify(posts));
    } catch {
      // Gracefully handled without warning banner
    }
  }, [posts]);

  // Persist reels safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_reels', JSON.stringify(reels));
    } catch {
      // Gracefully handled without warning banner
    }
  }, [reels]);

  // Persist current user and profile posts safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_current_user', JSON.stringify(currentUser));
      if (currentUser.id) {
        const postsToSync = currentUser.userPosts || currentUser.posts || [];
        if (postsToSync.length > 0) {
          safeSetItem(`ig_user_posts_${currentUser.id}`, JSON.stringify(postsToSync));
          safeSetItem(`ig_user_posts_${currentUser.username}`, JSON.stringify(postsToSync));
          safeSetItem('jhalak_uploaded_posts_v1', JSON.stringify(postsToSync));
        }
      }
    } catch {
      // Gracefully handled without warning banner
    }
  }, [currentUser]);

  // Persist conversations safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_conversations', JSON.stringify(conversations));
    } catch {
      // Gracefully handled without warning banner
    }
  }, [conversations]);

  // Subscribe to real-time Firestore conversations for currentUser
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeToFirestoreConversations(
      currentUser.id,
      currentUser.username,
      (firestoreConvs) => {
        if (firestoreConvs) {
          setConversations(firestoreConvs);
        }
      }
    );
    return () => unsub();
  }, [currentUser?.id, currentUser?.username]);

  // Persist stories safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_stories', JSON.stringify(stories));
    } catch {
      // Gracefully handled without warning banner
    }
  }, [stories]);

  // Open Immersive Full-Screen Media Viewer
  const handleOpenFullScreen = (post: Post, postList?: Post[]) => {
    const list = postList && postList.length > 0 ? postList : sortedFeedPosts;
    const isVideo = post.mediaType === 'video';

    // If opening a video reel, ensure the viewer scrolls seamlessly across all video reels starting at that exact video
    let targetList = list;
    if (isVideo) {
      const videoItems = list.filter((p) => p.mediaType === 'video');
      if (videoItems.some((p) => p.id === post.id)) {
        targetList = videoItems;
      }
    }

    const updatedList = targetList.map((p) =>
      p.id === post.id ? { ...p, mediaUrl: post.mediaUrl || p.mediaUrl } : p
    );
    const finalList = updatedList.some((p) => p.id === post.id) ? updatedList : [post, ...updatedList];
    pauseAllMedia();
    setFullScreenViewerState({
      isOpen: true,
      initialPostId: post.id,
      posts: finalList,
    });
  };

  // Toggle Like Handler
  const handleToggleLike = (postId: string) => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to like posts ❤️');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (post) {
      const isLiked = !post.isLiked;
      const cleanId = postId.replace(/^reel-/, '');

      // Persist in local user liked cache
      try {
        const activeId = currentUser.id || localStorage.getItem('ig_current_user_id') || 'me';
        const cacheKey = `ig_user_likes_${activeId}`;
        const raw = localStorage.getItem(cacheKey);
        const list = raw ? JSON.parse(raw) : [];
        let updated = Array.isArray(list) ? list : [];
        if (isLiked) {
          updated = Array.from(new Set([...updated, postId, cleanId]));
        } else {
          updated = updated.filter((id: string) => id !== postId && id !== cleanId);
        }
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      } catch {
        // safe
      }

      if (isLiked) {
        const cat = post.category || inferCategory(post);
        recommendationEngine.recordInteraction(cat, 'like', post.id);
        recommendationEngine.recordLanguageInteraction(inferLanguage(post), 'like');
      }

      // Save user like state directly into Firestore
      toggleLikeInFirestore(postId, isLiked, currentUser.id, currentUser.username).catch(() => {});
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          const likesCount = isLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          return { ...post, isLiked, likesCount };
        }
        return post;
      })
    );

    if (selectedPostDetail && selectedPostDetail.id === postId) {
      setSelectedPostDetail((prev) => {
        if (!prev) return null;
        const isLiked = !prev.isLiked;
        const likesCount = isLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1);
        return { ...prev, isLiked, likesCount };
      });
    }

    if (fullScreenViewerState && fullScreenViewerState.isOpen) {
      setFullScreenViewerState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          posts: prev.posts.map((p) => {
            if (p.id === postId) {
              const isLiked = !p.isLiked;
              const likesCount = isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
              return { ...p, isLiked, likesCount };
            }
            return p;
          }),
        };
      });
    }
  };

  // Toggle Save Handler
  const handleToggleSave = (postId: string) => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to save posts 🔖');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (post && !post.isSaved) {
      const cat = post.category || inferCategory(post);
      recommendationEngine.recordInteraction(cat, 'save', post.id);
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isSaved = !post.isSaved;
          showToast(isSaved ? (t.postSaved || 'Post saved to collection') : (t.postUnsaved || 'Post removed from saved'));
          return { ...post, isSaved };
        }
        return post;
      })
    );

    if (selectedPostDetail && selectedPostDetail.id === postId) {
      setSelectedPostDetail((prev) => {
        if (!prev) return null;
        return { ...prev, isSaved: !prev.isSaved };
      });
    }

    if (fullScreenViewerState && fullScreenViewerState.isOpen) {
      setFullScreenViewerState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          posts: prev.posts.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p)),
        };
      });
    }
  };

  // Add Comment to Feed Post
  const handleAddComment = (
    postId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'gif'
  ) => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to comment on posts 💬');
      return;
    }

    // 1. Automatic Text Moderation (Banned Words Filter) for Comments
    const moderationCheck = moderationService.validateContent(text);
    if (!moderationCheck.isValid) {
      showToast('Comment cannot be published. Content violates our community guidelines regarding explicit or inappropriate language.');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (post) {
      const cat = post.category || inferCategory(post);
      recommendationEngine.recordInteraction(cat, 'comment', post.id);
    }

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
      mediaUrl,
      mediaType,
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment],
            commentsCount: post.comments.length + 1,
          };
        }
        return post;
      })
    );

    // Save comment directly to Firestore post document
    addCommentToFirestore(postId, newComment).catch(() => {});

    // Save comment to local storage cache so it persists even on offline or reload
    try {
      const cleanId = postId.replace(/^reel-/, '');
      const cacheKey = `ig_comments_${cleanId}`;
      const raw = localStorage.getItem(cacheKey);
      const list = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(list) ? [...list, newComment] : [newComment];
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      localStorage.setItem(`ig_comments_${postId}`, JSON.stringify(updated));
    } catch {
      // safe
    }

    if (selectedPostDetail && selectedPostDetail.id === postId) {
      setSelectedPostDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        };
      });
    }

    if (fullScreenViewerState && fullScreenViewerState.isOpen) {
      setFullScreenViewerState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
          ),
        };
      });
    }

    showToast(t.commentPosted || 'Comment posted successfully');
  };

  // Feed Recommendation Tuning Handlers
  const handleNotInterestedPost = (postId: string, category?: ContentCategory) => {
    const cat = category || 'Travel';
    recommendationEngine.markNotInterested(postId, cat);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast(`${t.notInterested} (${t.tunedFeedToast})`);
  };

  const handleShowMorePost = (category?: ContentCategory) => {
    if (category) {
      recommendationEngine.markShowMore(category);
      showToast(`${t.showMoreLikeThis}: ${category} ✨`);
      setPosts((prev) => [...recommendationEngine.sortPosts(prev)]);
    }
  };

  // Sort Feed Posts automatically based on Watch-Time, Language Engagement, and Moderation Filters
  const sortedFeedPosts = useMemo(() => {
    const cleanPosts = posts.filter(
      (p) =>
        !moderationService.isUserBlocked(p.username) && !moderationService.isItemReported(p.id)
    );
    return recommendationEngine.sortPosts(cleanPosts, currentLanguage);
  }, [posts, blockedVersion, currentLanguage, recsVersion]);

  // Interleave Google AdMob / AdSense Native Ads (Unit ca-app-pub-7598643408736998/9251607358) between feed posts
  const feedItemsWithAds = useMemo(() => {
    const nativeAds = adMobService.getNativeFeedAds();
    return adMobService.insertNativeAds(sortedFeedPosts, nativeAds, 2);
  }, [sortedFeedPosts, blockedVersion]);

  // Derive real suggested creators from posts (no mock users)
  const suggestedCreators = useMemo(() => {
    const creatorMap = new Map<
      string,
      { id: string; username: string; name?: string; avatar: string; subtitle?: string }
    >();
    posts.forEach((p) => {
      if (p.username && p.username !== currentUser.username && !creatorMap.has(p.username)) {
        creatorMap.set(p.username, {
          id: p.userId || p.username,
          username: p.username,
          name: p.username,
          avatar: p.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          subtitle: `Shared ${p.category || 'Reels'}`,
        });
      }
    });
    return Array.from(creatorMap.values()).slice(0, 5);
  }, [posts, currentUser.username]);

  // Clean Reels filtered against Blocked creators and Reported content
  const unblockedReels = useMemo(() => {
    return reels.filter(
      (r) =>
        !moderationService.isUserBlocked(r.username) && !moderationService.isItemReported(r.id)
    );
  }, [reels, blockedVersion]);

  // Safety & Moderation Handlers
  const handleReportSubmitted = (id: string, reason: string = 'Inappropriate Content') => {
    const post = posts.find((p) => p.id === id) || reels.find((r) => r.id === id);
    moderationService.reportItem({
      id,
      type: 'post',
      username: post ? post.username : '',
      reason,
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setReels((prev) => prev.filter((r) => r.id !== id));
    setBlockedVersion((v) => v + 1);
    showToast('Thank you for reporting. This content has been submitted for review and hidden from your feed.');
  };

  const handleOpenReportPostModal = (post: Post) => {
    setReportTarget({
      id: post.id,
      type: 'post',
      username: post.username,
      caption: post.caption,
      mode: 'report',
    });
  };

  const handleOpenBlockUserModal = (username: string, caption?: string) => {
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    setReportTarget({
      id: 'user-' + clean,
      type: 'post',
      username: clean,
      caption,
      mode: 'block',
    });
  };

  // Quick Report Handler for Feed 3-dots menu
  const handleQuickReportPost = (post: Post, reason: string = 'Inappropriate content') => {
    moderationService.reportItem({
      id: post.id,
      type: 'post',
      username: post.username,
      reason,
    });
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setReels((prev) => prev.filter((r) => r.id !== post.id));
    setBlockedVersion((v) => v + 1);
    showToast(`Report received. Post by @${post.username} hidden from your feed 🛡️`);
  };

  const handleUserBlocked = (username: string) => {
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    moderationService.blockUser(clean);
    setPosts((prev) => prev.filter((p) => p.username.toLowerCase() !== clean));
    setReels((prev) => prev.filter((r) => r.username.toLowerCase() !== clean));
    setBlockedVersion((v) => v + 1);
    showToast(`Blocked @${clean}. Their content has been hidden from your feed 🚫`);
  };

  // 4. Admin Moderation Dashboard Handlers
  const handleAdminKeepPost = (id: string) => {
    moderationService.keepPost(id);
    setBlockedVersion((v) => v + 1);
    showToast('Post reports reset. Post restored to public visibility. ✅');
  };

  const handleAdminDeletePostPermanently = (id: string) => {
    moderationService.deletePostPermanently(id);
    deletePostFromFirestore(id).catch(() => {});
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setReels((prev) => prev.filter((r) => r.id !== id));
    setBlockedVersion((v) => v + 1);
    showToast('Post permanently deleted from Firestore & Jhalak. 🗑️');
  };

  const handleDeletePost = (postId: string) => {
    if (!postId) return;

    // 1. Immediately remove from active state synchronously
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setReels((prev) => prev.filter((r) => r.id !== postId));
    setBlockedVersion((v) => v + 1);

    // 2. Clear from all possible localStorage stores
    try {
      const targetUserId = currentUser?.id || '';
      const targetUsername = currentUser?.username || '';
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
        const stored = localStorage.getItem(k);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              localStorage.setItem(k, JSON.stringify(parsed.filter((p: any) => p && p.id !== postId)));
            }
          } catch {}
        }
      });
    } catch {}

    // 3. Immediately update currentUser posts and postsCount
    setCurrentUser((prev) => {
      const updatedUserPosts = (prev.userPosts || prev.posts || []).filter((p) => p.id !== postId);
      return {
        ...prev,
        postsCount: Math.max(0, updatedUserPosts.length),
        posts: updatedUserPosts,
        userPosts: updatedUserPosts,
      };
    });

    // 4. Immediately close any open full screen viewer or post detail modal
    if (selectedPostDetail && selectedPostDetail.id === postId) {
      setSelectedPostDetail(null);
    }
    if (fullScreenViewerState) {
      setFullScreenViewerState(null);
    }

    // 5. Update moderation service state
    try {
      moderationService.deletePostPermanently(postId);
    } catch {}

    // 6. Safe background Firestore permanent deletion
    deletePostFromFirestore(postId).catch(() => {});
    if (currentUser?.id) {
      decrementUserPostsCount(currentUser.id).catch(() => {});
    }

    showToast('Post removed successfully. 🗑️');
  };

  const handleAdminBanUser = (username: string) => {
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    moderationService.banUserAccount(clean);
    setPosts((prev) => prev.filter((p) => p.username.toLowerCase() !== clean));
    setReels((prev) => prev.filter((r) => r.username.toLowerCase() !== clean));
    setBlockedVersion((v) => v + 1);
    showToast(`User @${clean} account banned & all posts removed. 🚫`);
  };

  const handleAdminUnbanUser = (username: string) => {
    moderationService.unblockUser(username);
    setBlockedVersion((v) => v + 1);
    showToast(`User @${username} has been unbanned.`);
  };

  // Google Play Compliant Account & Data Deletion
  const handleDeleteAccount = () => {
    const usernameToDelete = currentUser.username;
    const userIdToDelete = currentUser.id;

    // Purge user's posts and comments from remaining posts
    const purgedPosts = posts
      .filter((p) => p.username !== usernameToDelete && p.userId !== userIdToDelete)
      .map((p) => ({
        ...p,
        comments: (p.comments || []).filter(
          (c) => c.username !== usernameToDelete
        ),
      }));

    // Purge user's reels and comments from reels
    const purgedReels = reels
      .filter((r) => r.username !== usernameToDelete && r.userId !== userIdToDelete)
      .map((r) => ({
        ...r,
        comments: (r.comments || []).filter(
          (c) => c.username !== usernameToDelete
        ),
      }));

    // Purge user's stories
    const purgedStories = stories.filter(
      (s) => s.username !== usernameToDelete && s.userId !== userIdToDelete
    );

    // Purge user's conversations
    const purgedConversations = conversations.filter(
      (c) => c.user.username !== usernameToDelete && c.user.id !== userIdToDelete
    );

    // Clear all storage keys to ensure clean purge
    const keysToRemove = [
      'ig_feed_posts',
      'ig_reels',
      'ig_stories',
      'ig_conversations',
      'ig_current_user',
      'ig_profile_highlights',
      'jhalak_uploaded_posts_v1',
      'jhalak_uploaded_reels_v1',
      'jhalak_user_posts',
      `ig_user_posts_${userIdToDelete}`,
      `ig_user_posts_${usernameToDelete}`,
      'jhalak_custom_created_posts_v1',
      'jhalak_auth_state',
      'jhalak_guest_mode',
      'jhalak_google_user',
      'jhalak_user_affinity',
      'jhalak_not_interested',
      'jhalak_saved_posts',
      'jhalak_draft_post',
      'jhalak_blocked_users',
      'jhalak_reports_history',
      'jhalak_report_counts',
      'jhalak_hidden_by_moderation',
      'jhalak_permanently_deleted',
    ];
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // safe
      }
    });

    // Reset app state
    setCurrentUser(initialCurrentUser);
    setPosts(purgedPosts);
    setReels(purgedReels);
    setStories(purgedStories);
    setConversations(purgedConversations);

    // Log out user & redirect to home feed in guest mode
    setIsAuthenticated(false);
    setIsGuestMode(true);
    setCurrentTab('home');

    // Close any open modals
    setIsSettingsModalOpen(false);
    setIsCreateModalOpen(false);
    setIsEditProfileOpen(false);
    setSelectedPostDetail(null);
    setSharePost(null);
    setActiveCommentsPostId(null);
    setActiveStoryIndex(null);
    setIsCreateStoryModalOpen(false);
    setIsNotificationsModalOpen(false);
    setIsAdminModDashboardOpen(false);
    setReportTarget(null);

    showToast('Your account and all associated personal data have been permanently deleted.');
  };

  // Tab change handler enforcing Guest Mode authentication gate for Profile
  const handleTabChange = (tab: NavTab) => {
    pauseAllMedia();
    if (tab === 'profile' && !isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to view your profile 👤');
      return;
    }
    setCurrentTab(tab);
  };

  // Open Create Post Modal (prompting sign-in if guest & UGC compliance consent)
  const handleOpenCreateModal = () => {
    pauseAllMedia();
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to create and share posts 📸');
      return;
    }
    if (!hasUserConsentedToUGC()) {
      setIsUgcConsentModalOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  // Handle "Use Audio" action from Reels
  const handleUseAudio = (audioTitle: string, _audioArtist?: string) => {
    pauseAllMedia();
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to create with sound 🎵');
      return;
    }
    if (!hasUserConsentedToUGC()) {
      setPendingAudioForUgcConsent(audioTitle);
      setIsUgcConsentModalOpen(true);
      return;
    }
    setCreateInitialAudio(audioTitle);
    setIsCreateModalOpen(true);
    showToast(`Using sound: ${audioTitle} 🎵`);
  };

  const handleUgcConsentAgreed = () => {
    setIsUgcConsentModalOpen(false);
    if (pendingAudioForUgcConsent) {
      setCreateInitialAudio(pendingAudioForUgcConsent);
      setPendingAudioForUgcConsent(null);
    }
    setIsCreateModalOpen(true);
  };

  const handleToggleCommentLike = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map((c) => {
              if (c.id === commentId) {
                const isLiked = !c.isLiked;
                const likesCount = isLiked
                  ? (c.likesCount || 0) + 1
                  : Math.max(0, (c.likesCount || 1) - 1);
                return { ...c, isLiked, likesCount };
              }
              return c;
            }),
          };
        }
        return post;
      })
    );
  };

  // Create New Post or Reel Handler
  const handlePostCreated = (newPost: Post, newReel?: Reel) => {
    const now = Date.now();
    const inferredCat = newPost.category || inferCategory(newPost);
    // 1. Tag post with currentUser's unique credentials
    const stampedPost: Post = {
      ...newPost,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      isVerified: currentUser.isVerified,
      createdAt: newPost.createdAt || now,
      timestamp: 'Just now',
      isUserCreated: true,
      category: inferredCat,
    };

    // Prepend to active feed at the very top (unshift / reverse chronological order)
    setPosts((prev) => [stampedPost, ...prev.filter((p) => p.id !== stampedPost.id)]);

    // Save to real Cloud Firestore database
    savePostToFirestore(stampedPost).catch(() => {});

    // Record interaction so the category gets an immediate boost
    recommendationEngine.recordInteraction(inferredCat, 'boost', stampedPost.id);

    // 2. Load existing posts exclusively for this currentUser.id
    const profileKeyById = `ig_user_posts_${currentUser.id}`;
    let existingProfilePosts: Post[] = [];
    try {
      const stored = localStorage.getItem(profileKeyById);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) existingProfilePosts = parsed;
      }
    } catch {
      existingProfilePosts = [];
    }

    const updatedProfilePosts = [stampedPost, ...existingProfilePosts.filter((p) => p.id !== stampedPost.id)];

    const updatedUser: User = {
      ...currentUser,
      postsCount: updatedProfilePosts.length,
      posts: updatedProfilePosts,
      userPosts: updatedProfilePosts,
    };

    // Save exclusively under this user ID in localStorage
    try {
      safeSetItem('ig_current_user', JSON.stringify(updatedUser));
      safeSetItem(`ig_user_profile_${currentUser.id}`, JSON.stringify(updatedUser));
      safeSetItem(profileKeyById, JSON.stringify(updatedProfilePosts));

      const existingPostsStr = localStorage.getItem('jhalak_uploaded_posts_v1');
      const existingPosts: Post[] = existingPostsStr ? JSON.parse(existingPostsStr) : [];
      const updatedPosts = [stampedPost, ...existingPosts.filter((p) => p.id !== stampedPost.id)];
      safeSetItem('jhalak_uploaded_posts_v1', JSON.stringify(updatedPosts));
    } catch {
      // safe
    }

    // Update currentUser state
    setCurrentUser(updatedUser);

    // Ensure video posts appear simultaneously in Reels Feed
    const effectiveReel: Reel | undefined =
      newReel ||
      (stampedPost.mediaType === 'video'
        ? {
            id: stampedPost.id,
            userId: currentUser.id,
            username: currentUser.username,
            userAvatar: currentUser.avatar,
            isVerified: currentUser.isVerified,
            videoUrl: stampedPost.mediaUrl,
            thumbnailUrl: stampedPost.thumbnailUrl,
            caption: stampedPost.caption,
            category: stampedPost.category || inferredCat,
            audioTitle: stampedPost.audioTitle || 'Original Audio',
            audioArtist: stampedPost.audioArtist || currentUser.username,
            audioUrl: stampedPost.audioUrl,
            audioCover: stampedPost.audioCover,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isLiked: false,
            isSaved: false,
            comments: [],
            tags: stampedPost.tags || [],
            timestamp: 'Just now',
            createdAt: now,
            isUserCreated: true,
          }
        : undefined);

    if (effectiveReel) {
      const stampedReel: Reel = {
        ...effectiveReel,
        id: stampedPost.id,
        userId: currentUser.id,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
        createdAt: effectiveReel.createdAt || now,
        timestamp: 'Just now',
        isUserCreated: true,
        category: effectiveReel.category || inferredCat,
      };

      // Always show newly created reel at the very top (unshift / reverse chronological order)
      setReels((prev) => [stampedReel, ...prev.filter((r) => r.id !== stampedReel.id)]);

      try {
        const existingReelsStr = localStorage.getItem('jhalak_uploaded_reels_v1');
        const existingReels: Reel[] = existingReelsStr ? JSON.parse(existingReelsStr) : [];
        const updatedReels = [stampedReel, ...existingReels.filter((r) => r.id !== stampedReel.id)];
        safeSetItem('jhalak_uploaded_reels_v1', JSON.stringify(updatedReels));
      } catch {
        // safe
      }
    }

    // 1.5s top progress bar on post with green checkmark
    setTopUploadBar({
      progress: 20,
      completed: false,
      title: newReel ? 'Publishing Reel...' : 'Publishing Post...',
    });
    const DURATION = 1500;
    const intervalTime = 30;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / DURATION) * 100));

      if (elapsed >= DURATION) {
        clearInterval(timer);
        setTopUploadBar({ progress: 100, completed: true, title: 'Posted successfully!' });
        setTimeout(() => {
          setTopUploadBar(null);
        }, 1200);
      } else {
        setTopUploadBar((prev) => (prev ? { ...prev, progress } : null));
      }
    }, intervalTime);

    if (newPost.mediaType === 'video' && newReel) {
      setCurrentTab('reels');
      showToast('Your Reel has been published at the top! 🎬');
    } else {
      setCurrentTab('home');
      showToast('Your post has been published at the top! 🎉');
    }
  };

  // Reels Handlers
  const handleToggleLikeReel = (reelId: string) => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to like reels ❤️');
      return;
    }

    const targetReel = reels.find((r) => r.id === reelId);
    if (targetReel) {
      const isLiked = !targetReel.isLiked;
      const cleanPostId = reelId.replace(/^reel-/, '');

      // Persist in local user liked cache
      try {
        const activeId = currentUser.id || localStorage.getItem('ig_current_user_id') || 'me';
        const cacheKey = `ig_user_likes_${activeId}`;
        const raw = localStorage.getItem(cacheKey);
        const list = raw ? JSON.parse(raw) : [];
        let updated = Array.isArray(list) ? list : [];
        if (isLiked) {
          updated = Array.from(new Set([...updated, reelId, cleanPostId]));
        } else {
          updated = updated.filter((id: string) => id !== reelId && id !== cleanPostId);
        }
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      } catch {
        // safe
      }

      if (isLiked) {
        const cat = targetReel.category || inferCategory(targetReel);
        recommendationEngine.recordInteraction(cat, 'like', targetReel.id);
        recommendationEngine.recordLanguageInteraction(inferLanguage(targetReel), 'like');
      }
      toggleLikeInFirestore(cleanPostId, isLiked, currentUser.id, currentUser.username).catch(() => {});
    }

    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          const isLiked = !reel.isLiked;
          return {
            ...reel,
            isLiked,
            likesCount: isLiked ? reel.likesCount + 1 : Math.max(0, reel.likesCount - 1),
          };
        }
        return reel;
      })
    );
  };

  const handleToggleSaveReel = (reelId: string) => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to save reels 🔖');
      return;
    }

    const targetReel = reels.find((r) => r.id === reelId);
    if (targetReel) {
      const cat = targetReel.category || inferCategory(targetReel);
      recommendationEngine.recordInteraction(cat, 'save', targetReel.id);
    }

    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          const isSaved = !reel.isSaved;
          showToast(isSaved ? (t.postSaved || 'Post saved to collection') : (t.postUnsaved || 'Post removed from saved'));
          return { ...reel, isSaved };
        }
        return reel;
      })
    );
  };

  const handleAddReelComment = (
    reelId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'gif'
  ) => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to comment on reels 💬');
      return;
    }

    // 1. Automatic Text Moderation (Banned Words Filter) for Comments
    const moderationCheck = moderationService.validateContent(text);
    if (!moderationCheck.isValid) {
      showToast('Comment cannot be published. Content violates our community guidelines regarding explicit or inappropriate language.');
      return;
    }

    const targetReel = reels.find((r) => r.id === reelId);
    if (targetReel) {
      const cat = targetReel.category || inferCategory(targetReel);
      recommendationEngine.recordInteraction(cat, 'comment', targetReel.id);
    }

    const newComment: Comment = {
      id: `c-reel-${Date.now()}`,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
      mediaUrl,
      mediaType,
    };

    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          return {
            ...reel,
            commentsCount: reel.commentsCount + 1,
            comments: [...reel.comments, newComment],
          };
        }
        return reel;
      })
    );

    // Save comment directly to Firestore
    addCommentToFirestore(reelId, newComment).catch(() => {});

    // Save comment to local storage cache so it persists even on reload
    try {
      const cleanId = reelId.replace(/^reel-/, '');
      const cacheKey = `ig_comments_${cleanId}`;
      const raw = localStorage.getItem(cacheKey);
      const list = raw ? JSON.parse(raw) : [];
      const updated = Array.isArray(list) ? [...list, newComment] : [newComment];
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      localStorage.setItem(`ig_comments_${reelId}`, JSON.stringify(updated));
    } catch {
      // safe
    }
    showToast(t.commentPosted || 'Comment posted successfully');
  };

  const handleShareReel = (reel: Reel) => {
    const cat = reel.category || inferCategory(reel);
    recommendationEngine.recordInteraction(cat, 'share', reel.id);

    const asPost: Post = {
      id: reel.id,
      userId: reel.userId,
      username: reel.username,
      userAvatar: reel.userAvatar,
      mediaUrl: reel.videoUrl,
      mediaType: 'video',
      caption: reel.caption,
      likesCount: reel.likesCount,
      comments: reel.comments,
      timestamp: reel.timestamp,
      isLiked: reel.isLiked,
      isSaved: reel.isSaved,
      location: reel.location,
      tags: [],
      audioTitle: reel.audioTitle,
    };
    setSharePost(asPost);
  };

  // Send Direct Message directly to Firestore collection
  const handleSendMessage = (conversationId: string, text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      isRead: true,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: text,
            lastMessageTimestamp: 'Just now',
            messages: [...conv.messages, newMessage],
          };
        }
        return conv;
      })
    );

    const convTarget = conversations.find((c) => c.id === conversationId);
    sendFirestoreMessage(
      conversationId,
      newMessage,
      [currentUser.id, convTarget?.user?.id || 'contact'],
      convTarget?.user
    ).catch((err) => {
      console.warn('Could not sync message to Firestore:', err);
    });
  };

  // Google Login Handlers
  const handleGoogleLoginSuccess = (account: GoogleAccount) => {
    // Generate unique user ID for this account (prefer authentic Firebase UID)
    const rawId = account.email
      ? account.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
      : account.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const newUserId = account.firebaseUid || `user-${rawId}`;

    // Load any saved profile for THIS specific user ID
    let savedProfile: Partial<User> | null = null;
    try {
      const rawProfile = localStorage.getItem(`ig_user_profile_${newUserId}`);
      if (rawProfile) savedProfile = JSON.parse(rawProfile);
    } catch {}

    // Load uploaded posts saved exclusively by THIS user ID in localStorage
    let savedUserPosts: Post[] = [];
    const userPostsKey = `ig_user_posts_${newUserId}`;
    try {
      const rawPosts = localStorage.getItem(userPostsKey);
      if (rawPosts) {
        const parsed = JSON.parse(rawPosts);
        if (Array.isArray(parsed)) savedUserPosts = parsed;
      } else {
        // If Super Admin, check legacy key
        const isSuperAdminAccount =
          account.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
          account.username?.trim().toLowerCase() === 'brijmohan';
        if (isSuperAdminAccount) {
          const legacy =
            localStorage.getItem('ig_user_posts_user-me') ||
            localStorage.getItem('ig_user_posts_brijmohan');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed)) savedUserPosts = parsed;
          }
        }
      }
    } catch {
      savedUserPosts = [];
    }

    const isGoogle = Boolean(account.email && account.email.includes('@'));
    const realDisplayName = (account.name || '').trim();
    // Prioritize real Google display name for username instead of user_xxxx
    let resolvedUsername = (account.username || realDisplayName).trim();
    if (!resolvedUsername || resolvedUsername.startsWith('user_') || resolvedUsername.startsWith('creator_')) {
      if (realDisplayName) {
        resolvedUsername = realDisplayName;
      } else if (savedProfile?.username && !savedProfile.username.startsWith('user_') && !savedProfile.username.startsWith('creator_')) {
        resolvedUsername = savedProfile.username;
      } else if (account.email) {
        resolvedUsername = account.email.split('@')[0];
      } else {
        resolvedUsername = 'User';
      }
    }

    const resolvedAvatar =
      account.avatar ||
      (savedProfile?.avatar && !savedProfile.avatar.includes('user_') && !savedProfile.avatar.includes('dicebear') ? savedProfile.avatar : '') ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

    const updatedUser: User = {
      id: newUserId,
      name: realDisplayName || savedProfile?.name || resolvedUsername,
      email: account.email || '',
      username: resolvedUsername,
      avatar: resolvedAvatar,
      isGoogleAuth: isGoogle,
      bio: savedProfile?.bio || (isGoogle ? 'Creator on Jhalak Reels 🇮🇳' : 'Exploring Jhalak Reels 🇮🇳'),
      website: savedProfile?.website || '',
      postsCount: savedUserPosts.length,
      posts: savedUserPosts,
      userPosts: savedUserPosts,
      followersCount: savedProfile?.followersCount || 0,
      followingCount: savedProfile?.followingCount || 0,
      isVerified: savedProfile?.isVerified ?? false,
    };

    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setIsGuestMode(false);
    setIsGoogleAuthModalOpen(false);

    try {
      safeSetItem('jhalak_auth_state', 'true');
      safeSetItem('jhalak_guest_mode', 'false');
      safeSetItem('ig_current_user_id', newUserId);
      safeSetItem('ig_current_user', JSON.stringify(updatedUser));
      safeSetItem(`ig_user_profile_${newUserId}`, JSON.stringify(updatedUser));
      safeSetItem(userPostsKey, JSON.stringify(savedUserPosts));
    } catch {
      // quota handled
    }

    // Sync profile to Cloud Firestore
    syncUserProfile({
      id: newUserId,
      name: updatedUser.name,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      email: updatedUser.email,
      followersCount: updatedUser.followersCount,
      watchHours: updatedUser.watchHours,
    }).catch(() => {});

    // Fetch existing real Firestore profile if already saved
    getUserProfile(newUserId).then((remoteProfile) => {
      if (remoteProfile) {
        setCurrentUser((prev) => ({
          ...prev,
          followersCount: remoteProfile.followersCount ?? prev.followersCount,
          watchHours: remoteProfile.watchHours ?? prev.watchHours,
          dailyReelsCount: remoteProfile.dailyReelsCount ?? prev.dailyReelsCount,
          dailyPhotosCount: remoteProfile.dailyPhotosCount ?? prev.dailyPhotosCount,
        }));
      }
    }).catch(() => {});

    showToast(isGoogle ? `Welcome, ${updatedUser.name}! Signed in with Google 🎉` : `Welcome, ${updatedUser.name}! Profile created 🎉`);
  };

  // Native Firebase Google Auth trigger (popup with prompt: 'select_account')
  const handleTriggerGoogleAuth = async () => {
    setIsGoogleAuthLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const realDisplayName = (fbUser.displayName || '').trim();
      const realEmail = (fbUser.email || '').trim();
      const rawName = realDisplayName || (realEmail ? realEmail.split('@')[0] : 'User');
      
      // Automatically set profile username to the user's real Google displayName
      const cleanUsername = realDisplayName || (realEmail ? realEmail.split('@')[0] : 'User');
      
      // Display their real Google photoURL instead of "user_xxxx"
      const avatar =
        fbUser.photoURL ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

      const account: GoogleAccount = {
        name: rawName,
        email: realEmail,
        avatar,
        username: cleanUsername,
        firebaseUid: fbUser.uid,
      };

      try {
        await syncUserProfile({
          id: fbUser.uid,
          name: rawName,
          username: cleanUsername,
          email: realEmail,
          avatar,
          bio: 'Creator on Jhalak Reels 🇮🇳',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          watchHours: 0,
          dailyReelsCount: 0,
          dailyPhotosCount: 0,
          lastUploadDate: new Date().toISOString().split('T')[0],
        });
      } catch {
        // safe
      }

      // Add to saved accounts list for fast switching
      try {
        const raw = localStorage.getItem('ig_saved_accounts');
        const list = raw ? JSON.parse(raw) : [];
        const updated = [
          account,
          ...(Array.isArray(list) ? list.filter((a: any) => a?.email?.toLowerCase() !== realEmail.toLowerCase()) : []),
        ].slice(0, 5);
        localStorage.setItem('ig_saved_accounts', JSON.stringify(updated));
      } catch {
        // safe
      }

      handleGoogleLoginSuccess(account);
    } catch (err: any) {
      // Force real Google Sign-In: do NOT generate anonymous/mock users
      if (err?.code === 'auth/popup-closed-by-user') {
        showToast('Google Sign-In was cancelled. Tap to choose your account.');
      } else {
        showToast(err?.message || 'Could not complete Google Sign-In. Please try again.');
        setIsGoogleAuthModalOpen(true);
      }
    } finally {
      setIsGoogleAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsGuestMode(true);
    setIsSettingsModalOpen(false);
    logOutFirebase().catch(() => {});
    try {
      localStorage.removeItem('ig_current_user_id');
      localStorage.removeItem('ig_current_user');
      safeSetItem('jhalak_auth_state', 'false');
      safeSetItem('jhalak_guest_mode', 'true');
    } catch {
      // quota handled
    }
    setCurrentUser(initialCurrentUser);
    setCurrentTab('home');
    showToast('Signed out. You are now browsing as Guest.');
  };

  const handleExploreAsGuest = (guestName?: string) => {
    const name = guestName?.trim() || 'Guest User';
    const cleanUsername = name.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const guestUser: User = {
      id: `guest-${cleanUsername}`,
      name: name,
      username: cleanUsername,
      email: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`,
      bio: 'Exploring Jhalak Reels 🇮🇳 Tap Edit Profile to customize.',
      website: '',
      postsCount: 0,
      posts: [],
      userPosts: [],
      followersCount: 0,
      followingCount: 0,
      isVerified: false,
      isGoogleAuth: false,
    };

    setCurrentUser(guestUser);
    setIsGuestMode(true);
    setIsAuthenticated(false);
    setIsGoogleAuthModalOpen(false);
    try {
      safeSetItem('jhalak_guest_mode', 'true');
      safeSetItem('jhalak_auth_state', 'false');
      safeSetItem('ig_current_user', JSON.stringify(guestUser));
      safeSetItem('ig_current_user_id', guestUser.id);
    } catch {
      // quota handled
    }
    showToast(`Welcome, ${name}! Exploring Jhalak Reels`);
  };

  // Mark Story as seen
  const handleMarkStorySeen = (groupId: string) => {
    setStories((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          return { ...group, hasUnseen: false };
        }
        return group;
      })
    );
  };

  // Add a story (prompting sign-in if guest)
  const handleAddStory = () => {
    if (!isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      showToast('Sign in with Google to add stories 📸');
      return;
    }
    setIsCreateStoryModalOpen(true);
  };

  const handleAddStorySlide = (mediaUrl: string, mediaType: 'image' | 'video', caption: string) => {
    const newSlide = {
      id: `s-new-${Date.now()}`,
      mediaUrl,
      mediaType,
      timestamp: 'Just now',
      caption,
    };

    setStories((prev) => {
      const userGroupIndex = prev.findIndex((g) => g.userId === currentUser.id);
      if (userGroupIndex !== -1) {
        return prev.map((g, idx) =>
          idx === userGroupIndex
            ? {
                ...g,
                avatar: currentUser.avatar,
                hasUnseen: true,
                slides: [newSlide, ...g.slides],
              }
            : g
        );
      }
      return [
        {
          id: `story-${currentUser.id}`,
          userId: currentUser.id,
          username: 'Your Story',
          avatar: currentUser.avatar,
          hasUnseen: true,
          slides: [newSlide],
        },
        ...prev,
      ];
    });

    showToast('Added to your story! 📸');
    setActiveStoryIndex(0);
  };

  // Edit Profile Save Handler
  const handleSaveProfile = (updatedUser: User) => {
    const verifiedPosts = updatedUser.userPosts || updatedUser.posts || currentUser.userPosts || currentUser.posts || [];
    const verifiedCount = verifiedPosts.length;
    const finalized: User = {
      ...updatedUser,
      postsCount: verifiedCount,
      posts: verifiedPosts,
      userPosts: verifiedPosts,
    };
    setCurrentUser(finalized);
    try {
      safeSetItem('ig_current_user', JSON.stringify(finalized));
      safeSetItem(`ig_user_profile_${finalized.id}`, JSON.stringify(finalized));
      safeSetItem(`ig_user_posts_${finalized.id}`, JSON.stringify(verifiedPosts));
    } catch {
      // safe
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.userId === updatedUser.id
          ? { ...p, username: updatedUser.username, userAvatar: updatedUser.avatar }
          : p
      )
    );
    showToast(t.profileUpdated || t.profileUpdatedSuccess || 'Profile updated successfully');
  };

  // View User Profile handler - opens Instagram-style profile
  const handleViewUser = (rawUsername: string) => {
    pauseAllMedia();
    const cleanUsername = (rawUsername || '').replace(/^@/, '').trim();
    if (!cleanUsername) return;

    if (cleanUsername.toLowerCase() === (currentUser.username || '').replace(/^@/, '').toLowerCase()) {
      setSelectedProfileUser(null);
      if (!isAuthenticated) {
        setIsGoogleAuthModalOpen(true);
        showToast('Sign in with Google to view your profile 👤');
        return;
      }
      setCurrentTab('profile');
      return;
    }

    // Find any post or reel from this user to gather profile details
    const matchingPost = posts.find(
      (p) => (p.username || '').replace(/^@/, '').toLowerCase() === cleanUsername.toLowerCase()
    );
    const matchingReel = reels.find(
      (r) => (r.username || '').replace(/^@/, '').toLowerCase() === cleanUsername.toLowerCase()
    );

    const avatar =
      matchingPost?.userAvatar ||
      matchingReel?.userAvatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`;

    const name = cleanUsername;
    const isVerified = Boolean(matchingPost?.isVerified || matchingReel?.isVerified);

    const targetUser: User = {
      id: matchingPost?.userId || matchingReel?.userId || `user-${cleanUsername}`,
      username: cleanUsername,
      name: name,
      avatar: avatar,
      bio: `Creator on Jhalak ✨ Bhojpuri & Hindi Reels | @${cleanUsername}`,
      postsCount: 0,
      followersCount: 1420,
      followingCount: 88,
      isVerified: isVerified,
    };

    // Close any conflicting sub-modals
    setSelectedPostDetail(null);
    setFullScreenViewerState(null);
    setActiveCommentsPostId(null);
    setIsSearchOverlayOpen(false);

    setSelectedProfileUser(targetUser);
  };

  const userPosts = useMemo(() => {
    const postMap = new Map<string, Post>();

    const isMatchingAppUser = (p: any): boolean => {
      if (!p || typeof p !== 'object' || !p.id) return false;
      const targetId = (currentUser.id || '').trim().toLowerCase();
      const targetUsername = (currentUser.username || '').trim().toLowerCase();
      const postUserId = (p.userId || '').trim().toLowerCase();
      const postUsername = (p.username || '').trim().toLowerCase();

      if (targetId && postUserId && targetId === postUserId) return true;
      if (targetUsername && postUsername && targetUsername === postUsername) return true;
      return false;
    };

    // 1. Check user-specific localStorage key: ig_user_posts_${currentUser.id}
    try {
      const userPostsKey = `ig_user_posts_${currentUser.id}`;
      const raw = localStorage.getItem(userPostsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: Post) => {
            if (p && p.id && isMatchingAppUser(p)) {
              postMap.set(p.id, p);
            }
          });
        }
      }

      // Legacy fallback exclusively for Super Admin
      if (isSuperAdmin(currentUser)) {
        const legacyMe = localStorage.getItem('ig_user_posts_user-me');
        if (legacyMe) {
          const parsed = JSON.parse(legacyMe);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: Post) => {
              if (p && p.id && isMatchingAppUser(p)) postMap.set(p.id, p);
            });
          }
        }
      }
    } catch {
      // safe fallback
    }

    // 2. Posts stored directly under current user profile
    (currentUser.userPosts || currentUser.posts || []).forEach((p) => {
      if (p && p.id && isMatchingAppUser(p) && !postMap.has(p.id)) {
        postMap.set(p.id, p);
      }
    });

    // 3. Current active posts matching user ID or username
    posts.forEach((p) => {
      if (isMatchingAppUser(p)) {
        if (!postMap.has(p.id)) {
          postMap.set(p.id, p);
        }
      }
    });

    return Array.from(postMap.values());
  }, [posts, currentUser]);

  const selectedUserPosts = useMemo(() => {
    if (!selectedProfileUser) return [];
    const targetUsername = (selectedProfileUser.username || '').replace(/^@/, '').toLowerCase();
    const targetId = (selectedProfileUser.id || '').toLowerCase();

    const postMap = new Map<string, Post>();

    posts.forEach((p) => {
      const pUsername = (p.username || '').replace(/^@/, '').toLowerCase();
      const pUserId = (p.userId || '').toLowerCase();
      if ((pUsername && pUsername === targetUsername) || (targetId && pUserId === targetId)) {
        postMap.set(p.id, p);
      }
    });

    reels.forEach((r) => {
      const rUsername = (r.username || '').replace(/^@/, '').toLowerCase();
      const rUserId = (r.userId || '').toLowerCase();
      if ((rUsername && rUsername === targetUsername) || (targetId && rUserId === targetId)) {
        if (!postMap.has(r.id)) {
          postMap.set(r.id, {
            id: r.id,
            userId: r.userId,
            username: r.username,
            userAvatar: r.userAvatar,
            isVerified: r.isVerified,
            location: r.location,
            mediaUrl: r.videoUrl,
            thumbnailUrl: r.thumbnailUrl || r.videoUrl,
            mediaType: 'video',
            caption: r.caption,
            tags: r.tags || [],
            category: r.category,
            likesCount: r.likesCount,
            isLiked: r.isLiked,
            isSaved: r.isSaved,
            comments: r.comments || [],
            commentsCount: r.commentsCount,
            timestamp: r.timestamp,
            audioTitle: r.audioTitle,
            audioArtist: r.audioArtist,
            audioUrl: r.audioUrl,
            audioCover: r.audioCover,
            language: r.language,
            productTag: r.productTag,
            createdAt: r.createdAt,
            isUserCreated: r.isUserCreated,
          });
        }
      }
    });

    return Array.from(postMap.values());
  }, [selectedProfileUser, posts, reels]);

  const savedPosts = posts.filter((p) => p.isSaved);
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  // Real Explore items from Firebase / uploaded posts
  const allExploreItems = posts;

  // If not logged in and not in guest mode, show the realistic Google Welcome & Sign-In Screen
  if (!isAuthenticated && !isGuestMode) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-black text-white' : 'bg-neutral-50 text-neutral-900'}`}>
        {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}
        {toastMessage && (
          <div
            id="welcome-toast-notification"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 transition transform animate-fade-in select-none"
          >
            {toastMessage}
          </div>
        )}
        <GoogleWelcomeScreen
          onContinueWithGoogle={handleTriggerGoogleAuth}
          isLoading={isGoogleAuthLoading}
          onExploreAsGuest={handleExploreAsGuest}
          onQuickLogin={handleGoogleLoginSuccess}
          onOpenLegalPolicy={(tab) => {
            setLegalModalTab(tab);
            setIsLegalModalOpen(true);
          }}
        />
        <GoogleAuthModal
          isOpen={isGoogleAuthModalOpen}
          onClose={() => setIsGoogleAuthModalOpen(false)}
          onLoginSuccess={handleGoogleLoginSuccess}
          onContinueAsGuest={handleExploreAsGuest}
          currentEmail={currentUser.email}
          onOpenLegalPolicy={(tab) => {
            setLegalModalTab(tab);
            setIsLegalModalOpen(true);
          }}
        />
        {/* In-App Legal Policies Modal accessible from welcome screen */}
        <LegalPoliciesModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
          onOpenDeleteAccount={() => {
            setIsLegalModalOpen(false);
            setIsAccountDeletionModalOpen(true);
          }}
        />
        {/* Account Deletion Modal accessible from welcome screen */}
        <AccountDeletionModal
          isOpen={isAccountDeletionModalOpen}
          onClose={() => setIsAccountDeletionModalOpen(false)}
          currentUser={currentUser}
          postsCount={0}
          reelsCount={0}
          commentsCount={0}
          onConfirmDelete={() => {
            setIsAccountDeletionModalOpen(false);
            handleDeleteAccount();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      {/* 1.5s Top Upload Progress Bar with Green Checkmark */}
      {topUploadBar && (
        <aside
          aria-label="Upload progress"
          className="fixed top-0 inset-x-0 z-[100] overflow-hidden select-none pointer-events-none"
        >
          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-black/20">
            <div
              className={`h-full transition-all duration-75 ease-out ${
                topUploadBar.completed
                  ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]'
                  : 'bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-500'
              }`}
              style={{ width: `${topUploadBar.progress}%` }}
            />
          </div>

          {/* Top banner pill */}
          <div className="flex items-center justify-center py-2 bg-neutral-900/95 text-white backdrop-blur-md shadow-2xl border-b border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold">
              {topUploadBar.completed ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  </div>
                  <span>Post uploaded successfully!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-neutral-200">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>{topUploadBar.title} {topUploadBar.progress}%</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Launch Splash Screen */}
      {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 transition transform animate-fade-in select-none">
          {toastMessage}
        </div>
      )}

      {/* Guest Mode Notification Banner */}
      {isGuestMode && (
        <aside
          aria-label="Guest mode notice"
          className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-fuchsia-500/10 border-b border-rose-500/20 px-4 py-2 text-center text-xs flex items-center justify-center gap-2 select-none"
        >
          <span className="text-neutral-700 dark:text-neutral-300">
            👋 You are currently exploring <strong>Jhalak</strong> as Guest.
          </span>
          <button
            onClick={() => setIsGoogleAuthModalOpen(true)}
            className="font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 ml-1 cursor-pointer"
          >
            <span>Sign in with Google</span> →
          </button>
        </aside>
      )}

      {/* Main Layout */}
      <div className="flex w-full min-h-screen">
        {/* Left Sidebar (Desktop & Tablet) */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
          unreadMessagesCount={totalUnreadMessages}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenLegalPolicies={() => {
            setLegalModalTab('privacy');
            setIsLegalModalOpen(true);
          }}
          onOpenSearch={() => setIsSearchOverlayOpen(true)}
          onOpenAdminPanel={() => {
            if (isSuperAdmin(currentUser)) {
              setIsAdminModDashboardOpen(true);
            }
          }}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          currentLanguage={currentLanguage}
        />

        {/* Content Area */}
        <main className={`flex-1 flex flex-col min-w-0 ${currentTab === 'reels' ? 'h-[100dvh] pb-16 md:pb-0 overflow-hidden' : 'pb-28 md:pb-16 scroll-smooth'}`}>
          {/* Mobile Top Header (only on mobile) */}
          <MobileHeader
            currentTab={currentTab}
            onTabChange={handleTabChange}
            currentUser={currentUser}
            unreadMessagesCount={totalUnreadMessages}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            onOpenCreateModal={handleOpenCreateModal}
            onShowNotifications={() => setIsNotificationsModalOpen(true)}
            onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenLegalPolicies={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            onOpenSearch={() => setIsSearchOverlayOpen(true)}
            onOpenAdminPanel={() => {
              if (isSuperAdmin(currentUser)) {
                setIsAdminModDashboardOpen(true);
              }
            }}
            currentLanguage={currentLanguage}
          />

          {/* Tab 1: HOME FEED */}
          {currentTab === 'home' && (
            <div
              id="home-feed-scroll-container"
              onTouchStart={handleHomeTouchStart}
              onTouchMove={handleHomeTouchMove}
              onTouchEnd={handleHomeTouchEnd}
              className="flex justify-center w-full max-w-6xl mx-auto px-0 sm:px-4 py-0 md:py-6 touch-pan-y scroll-smooth overscroll-y-contain"
            >
              {/* Feed Column */}
              <div className="w-full max-w-[470px] sm:max-w-[540px] flex flex-col">
                {/* Pull to Refresh Indicator */}
                {(pullProgress > 0 || isRefreshingFeed) && (
                  <div
                    id="pull-to-refresh-indicator"
                    className="flex items-center justify-center py-2 transition-all duration-200"
                    style={{
                      opacity: Math.max(pullProgress, isRefreshingFeed ? 1 : 0),
                      transform: `scale(${Math.max(0.85, pullProgress)})`,
                    }}
                  >
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-md text-xs font-semibold text-rose-500">
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isRefreshingFeed ? 'animate-spin' : ''}`}
                        style={{
                          transform: !isRefreshingFeed ? `rotate(${pullProgress * 360}deg)` : undefined,
                        }}
                      />
                      <span>
                        {isRefreshingFeed
                          ? 'Refreshing feed...'
                          : pullProgress >= 1
                          ? 'Release to refresh'
                          : 'Pull down to refresh'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Posts Feed */}
                <div className="mt-2 md:mt-4 space-y-2">
                  {sortedFeedPosts.length === 0 ? (
                    <div
                      id="feed-empty-state"
                      className="flex flex-col items-center justify-center p-8 py-14 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl my-3 shadow-xs"
                    >
                      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800/90 flex items-center justify-center mb-4 text-neutral-400">
                        <Plus className="w-8 h-8 text-neutral-400 stroke-[1.8]" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1.5">
                        Abhi koi reel ya post nahi hai. Pehli post karein!
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mb-5 leading-relaxed">
                        Database me abhi koi posts nahi hain. Niche diye gaye button par click karke apni pehli photo ya video upload karein!
                      </p>
                      <button
                        id="empty-feed-create-post-btn"
                        onClick={handleOpenCreateModal}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Upload First Post</span>
                      </button>
                    </div>
                  ) : (
                    feedItemsWithAds.map((item) => {
                      if (adMobService.isAdItem(item)) {
                        return (
                          <AdMobNativeFeedAd
                            key={item.id}
                            ad={item}
                            onHideAd={(id) => {
                              adMobService.hideAd(id);
                              setBlockedVersion((v) => v + 1);
                            }}
                          />
                        );
                      }
                      const post = item as Post;
                      return (
                        <FeedPostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onToggleLike={handleToggleLike}
                          onToggleSave={handleToggleSave}
                          onAddComment={handleAddComment}
                          isFollowing={Boolean(
                            followedUsers[post.username] ||
                            (post.userId && followedUsers[post.userId])
                          )}
                          onToggleFollow={() => handleToggleFollow(post.username, post.userId)}
                          onShare={(p) => {
                            setSharePost(p);
                            recommendationEngine.recordInteraction(p.category || 'Travel', 'share');
                          }}
                          onOpenDetail={(p) => {
                            pauseAllMedia();
                            setSelectedPostDetail(p);
                          }}
                          onOpenFullScreen={(p) => handleOpenFullScreen(p, sortedFeedPosts)}
                          onOpenComments={(p) => {
                            if (!isAuthenticated) {
                              setIsGoogleAuthModalOpen(true);
                              showToast('Sign in with Google to comment 💬');
                              return;
                            }
                            setActiveCommentsPostId(p.id);
                          }}
                          onViewUser={handleViewUser}
                          onNotInterested={handleNotInterestedPost}
                          onShowMore={handleShowMorePost}
                          onReportPost={handleQuickReportPost}
                          onBlockUser={handleUserBlocked}
                          onDeletePost={handleDeletePost}
                          currentLanguage={currentLanguage}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Suggestions Column (Desktop only) */}
              <RightSuggestionsSidebar
                currentUser={currentUser}
                onViewUser={handleViewUser}
                creators={suggestedCreators}
                currentLanguage={currentLanguage}
                onOpenLegalPolicies={(tab) => {
                  setLegalModalTab(tab || 'privacy');
                  setIsLegalModalOpen(true);
                }}
                onDeleteAccount={() => setIsAccountDeletionModalOpen(true)}
              />
            </div>
          )}

          {/* Tab 2: EXPLORE GRID */}
          {currentTab === 'explore' && (
            <ErrorBoundary compact fallbackTitle="Explore Feed">
              <ExploreView
                posts={allExploreItems}
                onSelectPost={(p) => handleOpenFullScreen(p, allExploreItems)}
                onViewUser={handleViewUser}
                onUseAudio={handleUseAudio}
                currentLanguage={currentLanguage}
              />
            </ErrorBoundary>
          )}

          {/* Tab 3: REELS FEED */}
          {currentTab === 'reels' && (
            <div className="w-full h-full flex-1 flex justify-center items-center p-0 m-0 bg-black overflow-hidden">
              <ErrorBoundary compact fallbackTitle="Reels Player">
                <ReelsView
                  reels={unblockedReels}
                  currentUser={currentUser}
                  isActive={
                    currentTab === 'reels' &&
                    !isCreateModalOpen &&
                    !isCreateStoryModalOpen &&
                    activeStoryIndex === null &&
                    !selectedPostDetail &&
                    !(fullScreenViewerState && fullScreenViewerState.isOpen) &&
                    !isUgcConsentModalOpen &&
                    !isGoogleAuthModalOpen
                  }
                  onToggleLike={handleToggleLikeReel}
                  onToggleSave={handleToggleSaveReel}
                  onAddComment={handleAddReelComment}
                  onShare={handleShareReel}
                  onViewUser={handleViewUser}
                  onUseAudio={handleUseAudio}
                  onReportReel={(r, reason) => handleReportSubmitted(r.id, reason)}
                  onBlockUser={(u) => handleUserBlocked(u)}
                  onDeleteReel={handleDeletePost}
                  onUploadReel={handleOpenCreateModal}
                  onRefreshReels={handleRefreshFeed}
                  isRefreshing={isRefreshingFeed}
                  onRequireAuth={(action) => {
                    setIsGoogleAuthModalOpen(true);
                    showToast(`Sign in with Google to ${action === 'like' ? 'like reels ❤️' : action === 'comment' ? 'comment on reels 💬' : 'upload reels 📸'}`);
                  }}
                  currentLanguage={currentLanguage}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Tab 4: DIRECT MESSAGES */}
          {currentTab === 'messages' && (
            <DirectMessagesView
              currentUser={currentUser}
              conversations={conversations}
              onSendMessage={handleSendMessage}
            />
          )}

          {/* Tab 5: USER PROFILE */}
          {currentTab === 'profile' && (
            <ProfileView
              user={currentUser}
              currentUser={currentUser}
              isOwnProfile={true}
              userPosts={userPosts}
              savedPosts={savedPosts}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onSelectPost={(p) => handleOpenFullScreen(p, [...userPosts, ...savedPosts])}
              onDeletePost={handleDeletePost}
              onOpenStoryModal={() => setActiveStoryIndex(0)}
              onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
              onOpenLegalPolicies={() => {
                setLegalModalTab('privacy');
                setIsLegalModalOpen(true);
              }}
              onDeleteAccount={() => setIsAccountDeletionModalOpen(true)}
              onOpenAdminPanel={() => {
                if (isSuperAdmin(currentUser)) {
                  setIsAdminModDashboardOpen(true);
                }
              }}
              onLogout={handleLogout}
              currentLanguage={currentLanguage}
            />
          )}
        </main>

        {/* 1. Google AdMob / AdSense Banner Ad at the bottom (Unit ca-app-pub-7598643408736998/4957139129) */}
        {activeStoryIndex === null && (
          <AdMobBannerAd />
        )}

        {/* Mobile Bottom Navigation Bar (only on mobile) */}
        <MobileBottomNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
          unreadMessagesCount={totalUnreadMessages}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenCreateModal={handleOpenCreateModal}
          currentLanguage={currentLanguage}
        />
      </div>

      {/* MODAL 1: Story Viewer Fullscreen */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialGroupIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onMarkSeen={handleMarkStorySeen}
        />
      )}

      {/* MODAL 2: Create Post */}
      {isCreateModalOpen && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateInitialAudio(undefined);
          }}
          onPostCreated={handlePostCreated}
          initialSelectedAudio={createInitialAudio}
          onShowToast={showToast}
          onOpenLegalPolicy={(tab) => {
            setLegalModalTab(tab);
            setIsLegalModalOpen(true);
          }}
        />
      )}

      {/* MODAL 3: Post Detail View */}
      {selectedPostDetail && (
        <PostDetailModal
          post={selectedPostDetail}
          currentUser={currentUser}
          onClose={() => setSelectedPostDetail(null)}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
          onAddComment={handleAddComment}
          onShare={(p) => setSharePost(p)}
          onViewUser={handleViewUser}
          onOpenFullScreen={(p) => handleOpenFullScreen(p, posts)}
          onReportPost={(p) => {
            setSelectedPostDetail(null);
            handleQuickReportPost(p);
          }}
          onBlockUser={(u) => {
            setSelectedPostDetail(null);
            handleUserBlocked(u);
          }}
          onDeletePost={handleDeletePost}
        />
      )}

      {/* MODAL: Full-Screen Media Viewer (Reels / TikTok Vertical Scroll) */}
      {fullScreenViewerState && fullScreenViewerState.isOpen && (
        <FullScreenMediaViewer
          posts={fullScreenViewerState.posts}
          initialPostId={fullScreenViewerState.initialPostId}
          currentUser={currentUser}
          onClose={() => setFullScreenViewerState(null)}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
          onAddComment={handleAddComment}
          onShare={(p) => setSharePost(p)}
          onViewUser={handleViewUser}
          onReportPost={(p) => {
            setFullScreenViewerState(null);
            handleQuickReportPost(p);
          }}
          onBlockUser={(u) => {
            setFullScreenViewerState(null);
            handleUserBlocked(u);
          }}
          onDeletePost={handleDeletePost}
        />
      )}

      {/* MODAL 4: Share Modal */}
      {sharePost && (
        <ShareModal
          post={sharePost}
          conversations={conversations}
          onClose={() => setSharePost(null)}
          onSendToChat={(convId, msg) => {
            handleSendMessage(convId, msg);
            showToast('Message sent!');
          }}
        />
      )}

      {/* MODAL 5: Edit Profile */}
      {isEditProfileOpen && (
        <EditProfileModal
          user={currentUser}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleSaveProfile}
          currentLanguage={currentLanguage}
        />
      )}

      {/* MODAL 6: Profile Settings & Language Switcher Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onOpenEditProfile={() => {
          setIsSettingsModalOpen(false);
          setIsEditProfileOpen(true);
        }}
        onOpenSavedPosts={() => {
          setIsSettingsModalOpen(false);
          setCurrentTab('profile');
        }}
        onOpenLegalPolicies={(tab) => {
          setLegalModalTab(tab || 'privacy');
          setIsLegalModalOpen(true);
        }}
        onOpenModerationDashboard={() => {
          setIsSettingsModalOpen(false);
          if (isSuperAdmin(currentUser)) {
            setIsAdminModDashboardOpen(true);
          }
        }}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
        postsCount={posts.filter((p) => p.username === currentUser.username || p.userId === currentUser.id).length}
        reelsCount={reels.filter((r) => r.username === currentUser.username || r.userId === currentUser.id).length}
        commentsCount={
          posts.reduce((acc, p) => acc + (p.comments?.filter((c) => c.username === currentUser.username).length || 0), 0) +
          reels.reduce((acc, r) => acc + (r.comments?.filter((c) => c.username === currentUser.username).length || 0), 0)
        }
      />

      {/* MODAL 7: Google Account & Login Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthModalOpen}
        onClose={() => setIsGoogleAuthModalOpen(false)}
        onLoginSuccess={handleGoogleLoginSuccess}
        onContinueAsGuest={handleExploreAsGuest}
        currentEmail={currentUser.email}
        onOpenLegalPolicy={(tab) => {
          setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
      />

      {/* MODAL 8: Instagram Modern Mobile Bottom-Sheet Comments */}
      {activeCommentsPost && (
        <CommentsBottomSheet
          isOpen={true}
          onClose={() => setActiveCommentsPostId(null)}
          comments={activeCommentsPost.comments}
          currentUser={currentUser}
          targetAuthorUsername={activeCommentsPost.username}
          onAddComment={(text, mediaUrl, mediaType) => {
            handleAddComment(activeCommentsPost.id, text, mediaUrl, mediaType);
          }}
          onToggleCommentLike={(commentId) => {
            handleToggleCommentLike(activeCommentsPost.id, commentId);
          }}
          onViewUser={(username) => {
            setActiveCommentsPostId(null);
            handleViewUser(username);
          }}
        />
      )}

      {/* MODAL 9: Safety & Moderation (Report / Block) */}
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
        initialMode={reportTarget?.mode || 'report'}
        onReportSubmitted={handleReportSubmitted}
        onUserBlocked={handleUserBlocked}
      />

      {/* MODAL 10: In-App Privacy Policy & Terms of Service (Play Store Compliance) */}
      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
        onOpenDeleteAccount={() => {
          setIsLegalModalOpen(false);
          setIsAccountDeletionModalOpen(true);
        }}
      />

      {/* MODAL: Direct Google Play Compliant Account & Data Deletion Modal */}
      <AccountDeletionModal
        isOpen={isAccountDeletionModalOpen}
        onClose={() => setIsAccountDeletionModalOpen(false)}
        currentUser={currentUser}
        postsCount={userPosts.length}
        reelsCount={reels.filter((r) => r.username === currentUser.username || r.userId === currentUser.id).length}
        commentsCount={
          posts.reduce((acc, p) => acc + (p.comments?.filter((c) => c.username === currentUser.username).length || 0), 0) +
          reels.reduce((acc, r) => acc + (r.comments?.filter((c) => c.username === currentUser.username).length || 0), 0)
        }
        onConfirmDelete={() => {
          setIsAccountDeletionModalOpen(false);
          handleDeleteAccount();
        }}
      />

      {/* MODAL 11: First-Time UGC Community Guidelines & Creator Terms Consent (Play Store UGC Policy Compliance) */}
      <UGCCommunityGuidelinesModal
        isOpen={isUgcConsentModalOpen}
        onAccept={handleUgcConsentAgreed}
        onDecline={() => {
          setIsUgcConsentModalOpen(false);
          setPendingAudioForUgcConsent(null);
        }}
        onOpenFullPolicy={(tab) => {
          setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
      />

      {/* OVERLAY: Live Search & Explore Overlay */}
      {isSearchOverlayOpen && (
        <div
          id="search-explore-overlay"
          className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 flex flex-col overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 select-none"
        >
          {/* Top Navigation Bar of Search Overlay */}
          <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <button
                id="close-search-overlay-btn"
                type="button"
                onClick={() => setIsSearchOverlayOpen(false)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition cursor-pointer active:scale-95"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2]" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 via-amber-500 to-rose-600 flex items-center justify-center text-white shadow-xs">
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left">
                  <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                    Search Bhojpuri Reels & Stars
                  </h2>
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider leading-none">
                    Trending Creators, Tags & Music
                  </span>
                </div>
              </div>
            </div>
            <button
              id="done-search-overlay-btn"
              type="button"
              onClick={() => setIsSearchOverlayOpen(false)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
            >
              Done
            </button>
          </div>

          {/* Explore & Search View Body */}
          <div className="flex-1 pb-16">
            <ErrorBoundary compact fallbackTitle="Search & Explore" onReset={() => setIsSearchOverlayOpen(false)}>
              <ExploreView
                posts={allExploreItems}
                onSelectPost={(p) => {
                  setIsSearchOverlayOpen(false);
                  handleOpenFullScreen(p, allExploreItems);
                }}
                onViewUser={(username) => {
                  setIsSearchOverlayOpen(false);
                  handleViewUser(username);
                }}
                onUseAudio={(title, artist) => {
                  setIsSearchOverlayOpen(false);
                  handleUseAudio(title, artist);
                }}
                onClose={() => setIsSearchOverlayOpen(false)}
                currentLanguage={currentLanguage}
                autoFocusSearch={true}
              />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {/* MODAL 11: Real User Story Creator */}
      <CreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        onAddStory={handleAddStorySlide}
        currentUser={currentUser}
      />

      {/* MODAL 12: Notifications Clean View */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      {/* MODAL 13: Admin Moderation Dashboard (Auto-flagged & Multi-Report Queue, Super Admin strictly for Brijmohan83097@gmail.com) */}
      {isSuperAdmin(currentUser) && (
        <AdminModerationDashboard
          isOpen={isAdminModDashboardOpen}
          onClose={() => setIsAdminModDashboardOpen(false)}
          currentUser={currentUser}
          posts={posts}
          reels={reels}
          onKeepPost={handleAdminKeepPost}
          onDeletePostPermanently={handleAdminDeletePostPermanently}
          onBanUserAccount={handleAdminBanUser}
          onUnbanUser={handleAdminUnbanUser}
        />
      )}

      {/* MODAL 14: Instagram-Style User Profile View */}
      {selectedProfileUser && (
        <div
          id="user-profile-view-modal"
          className="fixed inset-0 z-50 bg-white dark:bg-black overflow-y-auto"
        >
          {/* Top Sticky Header */}
          <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                id="user-profile-back-btn"
                onClick={() => setSelectedProfileUser(null)}
                className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                aria-label="Back"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>{selectedProfileUser.username}</span>
                  {selectedProfileUser.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500" />
                  )}
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {selectedUserPosts.length} {t.posts || 'posts'}
                </p>
              </div>
            </div>

            <button
              id={`modal-follow-top-btn-${selectedProfileUser.username}`}
              onClick={() => {
                handleToggleFollow(selectedProfileUser.username, selectedProfileUser.id);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm ${
                followedUsers[selectedProfileUser.username] ||
                followedUsers[`@${selectedProfileUser.username}`] ||
                (selectedProfileUser.id && followedUsers[selectedProfileUser.id])
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/20'
              }`}
            >
              {followedUsers[selectedProfileUser.username] ||
              followedUsers[`@${selectedProfileUser.username}`] ||
              (selectedProfileUser.id && followedUsers[selectedProfileUser.id])
                ? (t.following || 'Following')
                : (t.follow || 'Follow')}
            </button>
          </div>

          <div className="pt-2 pb-16">
            <ProfileView
              user={selectedProfileUser}
              currentUser={currentUser}
              isOwnProfile={false}
              isFollowing={Boolean(
                followedUsers[selectedProfileUser.username] ||
                  followedUsers[`@${selectedProfileUser.username}`] ||
                  (selectedProfileUser.id && followedUsers[selectedProfileUser.id])
              )}
              onToggleFollow={(u, id) => handleToggleFollow(u, id)}
              onBack={() => setSelectedProfileUser(null)}
              onStartChat={(targetUser) => {
                setSelectedProfileUser(null);
                setCurrentTab('messages');
              }}
              userPosts={selectedUserPosts}
              savedPosts={[]}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onSelectPost={(p) => handleOpenFullScreen(p, selectedUserPosts)}
              onOpenStoryModal={() => setActiveStoryIndex(0)}
              currentLanguage={currentLanguage}
            />
          </div>
        </div>
      )}

      {/* Quick Report Confirmation Dialog */}
      {quickReportDialogInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Report Submitted
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Thank you for reporting. This post has been submitted for review and hidden from your feed.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                id="btn-confirm-report-ack"
                type="button"
                onClick={() => setQuickReportDialogInfo(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs transition active:scale-[0.99] cursor-pointer"
              >
                Done
              </button>
              <button
                id="btn-report-specify-reason"
                type="button"
                onClick={() => {
                  const targetInfo = quickReportDialogInfo;
                  setQuickReportDialogInfo(null);
                  setReportTarget({
                    id: targetInfo.id,
                    type: 'post',
                    username: targetInfo.username,
                    mode: 'report',
                  });
                }}
                className="w-full py-2 px-4 rounded-xl text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium transition cursor-pointer"
              >
                Specify Violation Reason (Optional)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
