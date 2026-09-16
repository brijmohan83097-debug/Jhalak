import React, { useState, useEffect, useMemo } from 'react';
import { NavTab, Post, StoryGroup, User, Conversation, Comment, Message, Reel, ContentCategory } from './types';
import {
  currentUser as initialCurrentUser,
  initialPosts,
  initialStories,
  initialConversations,
  initialReels,
  userProfilePosts,
  exploreGridItems,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { MobileHeader, MobileBottomNav } from './components/MobileNav';
import { StoriesBar } from './components/StoriesBar';
import { FeedPostCard } from './components/FeedPostCard';
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
import { GoogleAuthModal, GoogleAccount } from './components/GoogleAuthModal';
import { GoogleWelcomeScreen } from './components/GoogleWelcomeScreen';
import { CommentsBottomSheet } from './components/CommentsBottomSheet';
import { ReportModal } from './components/ReportModal';
import { LegalPoliciesModal } from './components/LegalPoliciesModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { AdminModerationDashboard } from './components/AdminModerationDashboard';
import { CheckCircle, Plus } from 'lucide-react';
import { SupportedLanguage, translations } from './translations';
import { recommendationEngine } from './services/recommendationEngine';
import { moderationService } from './services/moderationService';
import { adMobService, ADMOB_CONFIG } from './services/adMobService';
import { AdMobBannerAd } from './components/AdMobBannerAd';
import { AdMobNativeFeedAd } from './components/AdMobNativeFeedAd';
import {
  safeSetItem,
  registerStorageWarningToast,
  STORAGE_QUOTA_EVENT,
  StorageQuotaDetail,
} from './utils/safeStorage';

export default function App() {
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
    const saved = localStorage.getItem('jhalak_guest_mode');
    return saved === 'true';
  });

  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Core Data States
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('ig_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) return parsed;
      }
    } catch {
      // ignore corrupted data
    }
    return initialCurrentUser;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('ig_feed_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore corrupted data
    }
    return initialPosts;
  });

  const [reels, setReels] = useState<Reel[]>(() => {
    try {
      const saved = localStorage.getItem('ig_reels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore corrupted data
    }
    return initialReels;
  });

  const [stories, setStories] = useState<StoryGroup[]>(() => {
    try {
      const saved = localStorage.getItem('ig_stories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore corrupted data
    }
    return initialStories;
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
    return initialConversations;
  });

  // Modals & Overlays state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialAudio, setCreateInitialAudio] = useState<string | undefined>(undefined);
  const [selectedPostDetail, setSelectedPostDetail] = useState<Post | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
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
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'ugc'>('privacy');
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAdminModDashboardOpen, setIsAdminModDashboardOpen] = useState(false);
  const [quickReportDialogInfo, setQuickReportDialogInfo] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const t = translations[currentLanguage];

  // Clean wipe of any legacy mock data on launch so the user sees clean empty states
  useEffect(() => {
    const CLEAN_KEY = 'jhalak_clean_real_v3';
    if (!localStorage.getItem(CLEAN_KEY)) {
      localStorage.removeItem('ig_feed_posts');
      localStorage.removeItem('ig_reels');
      localStorage.removeItem('ig_stories');
      localStorage.removeItem('ig_conversations');
      localStorage.removeItem('ig_current_user');
      localStorage.removeItem('ig_profile_highlights');
      localStorage.removeItem('jhalak_custom_created_posts_v1');
      localStorage.setItem(CLEAN_KEY, 'true');
      setPosts([]);
      setReels([]);
      setStories(initialStories);
      setConversations([]);
      setCurrentUser(initialCurrentUser);
    }
  }, []);

  // Subscribe to moderation changes
  useEffect(() => {
    return moderationService.subscribe(() => {
      setBlockedVersion((v) => v + 1);
    });
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Register quota exceeded warning listener to show user-facing toast warning
  useEffect(() => {
    const unregister = registerStorageWarningToast((msg) => {
      showToast(msg);
    });

    const handleQuotaEvent = (e: Event) => {
      const customEvt = e as CustomEvent<StorageQuotaDetail>;
      if (customEvt.detail?.message) {
        showToast(customEvt.detail.message);
      }
    };

    window.addEventListener(STORAGE_QUOTA_EVENT, handleQuotaEvent);
    return () => {
      unregister();
      window.removeEventListener(STORAGE_QUOTA_EVENT, handleQuotaEvent);
    };
  }, []);

  // Save language selection
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    try {
      safeSetItem('jhalak_language', lang);
    } catch {
      showToast('⚠️ Storage quota reached. Language saved for this session.');
    }
    showToast(`Language switched to ${translations[lang].language}`);
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
    } catch (err) {
      console.warn('Failed to persist feed posts:', err);
      showToast('⚠️ Storage quota exceeded. Recent posts may not be saved locally.');
    }
  }, [posts]);

  // Persist reels safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_reels', JSON.stringify(reels));
    } catch (err) {
      console.warn('Failed to persist reels:', err);
      showToast('⚠️ Storage quota exceeded. Recent reels may not be saved locally.');
    }
  }, [reels]);

  // Persist current user safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_current_user', JSON.stringify(currentUser));
    } catch (err) {
      console.warn('Failed to persist profile/avatar:', err);
      showToast('⚠️ Storage quota exceeded. Profile changes may not be saved locally.');
    }
  }, [currentUser]);

  // Persist conversations safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_conversations', JSON.stringify(conversations));
    } catch (err) {
      console.warn('Failed to persist messages:', err);
      showToast('⚠️ Storage quota exceeded. Messages may not be saved locally.');
    }
  }, [conversations]);

  // Persist stories safely with try-catch
  useEffect(() => {
    try {
      safeSetItem('ig_stories', JSON.stringify(stories));
    } catch (err) {
      console.warn('Failed to persist stories:', err);
      showToast('⚠️ Storage quota exceeded. Stories may not be saved locally.');
    }
  }, [stories]);

  // Toggle Like Handler
  const handleToggleLike = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post && !post.isLiked) {
      recommendationEngine.recordInteraction(post.category || 'Travel', 'like');
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
  };

  // Toggle Save Handler
  const handleToggleSave = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post && !post.isSaved) {
      recommendationEngine.recordInteraction(post.category || 'Travel', 'save');
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
  };

  // Add Comment to Feed Post
  const handleAddComment = (
    postId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'gif'
  ) => {
    // 1. Automatic Text Moderation (Banned Words Filter) for Comments
    const moderationCheck = moderationService.validateContent(text);
    if (!moderationCheck.isValid) {
      showToast('Comment cannot be published. Content violates our community guidelines regarding explicit or inappropriate language.');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (post) {
      recommendationEngine.recordInteraction(post.category || 'Travel', 'comment');
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
          };
        }
        return post;
      })
    );

    if (selectedPostDetail && selectedPostDetail.id === postId) {
      setSelectedPostDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...prev.comments, newComment],
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

  // Sort Feed Posts with Instagram Recommendation Algorithm & Moderation Filters
  const sortedFeedPosts = useMemo(() => {
    const cleanPosts = posts.filter(
      (p) =>
        !moderationService.isUserBlocked(p.username) && !moderationService.isItemReported(p.id)
    );
    return recommendationEngine.sortPosts(cleanPosts);
  }, [posts, blockedVersion]);

  // Interleave In-Feed Native Ads seamlessly every 6-8 posts
  const feedItemsWithAds = useMemo(() => {
    return adMobService.insertNativeAds(
      sortedFeedPosts,
      adMobService.getNativeFeedAds(),
      6
    );
  }, [sortedFeedPosts]);

  // Clean Reels filtered against Blocked creators and Reported content
  const unblockedReels = useMemo(() => {
    return reels.filter(
      (r) =>
        !moderationService.isUserBlocked(r.username) && !moderationService.isItemReported(r.id)
    );
  }, [reels, blockedVersion]);

  // Safety & Moderation Handlers
  const handleReportSubmitted = (id: string, reason: string = 'Inappropriate Content') => {
    const post = posts.find((p) => p.id === id);
    moderationService.reportItem({
      id,
      type: 'post',
      username: post ? post.username : '',
      reason,
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setReels((prev) => prev.filter((r) => r.id !== id));
    showToast('Thank you for reporting. This post has been submitted for review and hidden from your feed.');
  };

  // Quick Report Handler for Feed 3-dots menu
  const handleQuickReportPost = (post: Post) => {
    moderationService.reportItem({
      id: post.id,
      type: 'post',
      username: post.username,
      reason: 'Community Violation (User Reported)',
    });
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setReels((prev) => prev.filter((r) => r.id !== post.id));
    showToast('Thank you for reporting. This post has been submitted for review and hidden from your feed.');
    setQuickReportDialogInfo({
      id: post.id,
      username: post.username,
    });
  };

  const handleUserBlocked = (username: string) => {
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    moderationService.blockUser(clean);
    setPosts((prev) => prev.filter((p) => p.username.toLowerCase() !== clean));
    setReels((prev) => prev.filter((r) => r.username.toLowerCase() !== clean));
    showToast(`Blocked @${clean}. Their content has been hidden from your feed.`);
  };

  // 4. Admin Moderation Dashboard Handlers
  const handleAdminKeepPost = (id: string) => {
    moderationService.keepPost(id);
    setBlockedVersion((v) => v + 1);
    showToast('Post reports reset. Post restored to public visibility. ✅');
  };

  const handleAdminDeletePostPermanently = (id: string) => {
    moderationService.deletePostPermanently(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setReels((prev) => prev.filter((r) => r.id !== id));
    setBlockedVersion((v) => v + 1);
    showToast('Post permanently deleted from Jhalak. 🗑️');
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
    const purgedPosts = initialPosts
      .filter((p) => p.username !== usernameToDelete && p.userId !== userIdToDelete)
      .map((p) => ({
        ...p,
        comments: (p.comments || []).filter(
          (c) => c.username !== usernameToDelete
        ),
      }));

    // Purge user's reels and comments from reels
    const purgedReels = initialReels
      .filter((r) => r.username !== usernameToDelete && r.userId !== userIdToDelete)
      .map((r) => ({
        ...r,
        comments: (r.comments || []).filter(
          (c) => c.username !== usernameToDelete
        ),
      }));

    // Purge user's stories
    const purgedStories = initialStories.filter(
      (s) => s.username !== usernameToDelete && s.userId !== userIdToDelete
    );

    // Purge user's conversations
    const purgedConversations = initialConversations.filter(
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

    // Log out user & redirect to welcome screen
    setIsAuthenticated(false);
    setIsGuestMode(false); // Directs app to GoogleWelcomeScreen
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

  // Handle "Use Audio" action from Reels
  const handleUseAudio = (audioTitle: string, _audioArtist?: string) => {
    setCreateInitialAudio(audioTitle);
    setIsCreateModalOpen(true);
    showToast(`Using sound: ${audioTitle} 🎵`);
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
    setPosts((prev) => [newPost, ...prev]);
    if (newReel) {
      setReels((prev) => [newReel, ...prev]);
    }
    setCurrentUser((prev) => ({
      ...prev,
      postsCount: prev.postsCount + 1,
    }));

    if (newPost.mediaType === 'video' && newReel) {
      setCurrentTab('reels');
      showToast('Your Reel has been published! 🎬');
    } else {
      setCurrentTab('home');
      showToast('Your post was shared successfully! 🎉');
    }
  };

  // Reels Handlers
  const handleToggleLikeReel = (reelId: string) => {
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
    // 1. Automatic Text Moderation (Banned Words Filter) for Comments
    const moderationCheck = moderationService.validateContent(text);
    if (!moderationCheck.isValid) {
      showToast('Comment cannot be published. Content violates our community guidelines regarding explicit or inappropriate language.');
      return;
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
    showToast(t.commentPosted || 'Comment posted successfully');
  };

  const handleShareReel = (reel: Reel) => {
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

  // Send Direct Message
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

    // Simulate auto-reply after 1.2 seconds for realistic interaction
    setTimeout(() => {
      const replies = [
        'Awesome, love this! ✨',
        'Bilkul sahi bola! Check kar raha hu 🔥',
        'Super cool picture! 📸',
        'Shukriya dost! Talk soon! 🙌',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const incomingMessage: Message = {
        id: `msg-reply-${Date.now()}`,
        senderId: 'contact',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: false,
        isRead: false,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              lastMessage: randomReply,
              lastMessageTimestamp: 'Just now',
              unreadCount: c.unreadCount + 1,
              messages: [...c.messages, incomingMessage],
            };
          }
          return c;
        })
      );
    }, 1200);
  };

  // Google Login Handlers
  const handleGoogleLoginSuccess = (account: GoogleAccount) => {
    const updatedUser: User = {
      ...currentUser,
      id: `u-${account.email.split('@')[0]}`,
      name: account.name,
      email: account.email,
      username: account.username,
      avatar: account.avatar,
      isGoogleAuth: true,
      bio: currentUser.bio || '',
      postsCount: currentUser.postsCount || 0,
      followersCount: currentUser.followersCount || 0,
      followingCount: currentUser.followingCount || 0,
    };
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setIsGuestMode(false);
    setIsGoogleAuthModalOpen(false);
    try {
      safeSetItem('jhalak_auth_state', 'true');
      safeSetItem('jhalak_guest_mode', 'false');
      safeSetItem('ig_current_user', JSON.stringify(updatedUser));
    } catch {
      // quota handled
    }
    showToast(`Welcome, ${account.name}! Signed in with Google 🎉`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsGuestMode(false);
    setIsSettingsModalOpen(false);
    try {
      safeSetItem('jhalak_auth_state', 'false');
      safeSetItem('jhalak_guest_mode', 'false');
    } catch {
      // quota handled
    }
    showToast('Signed out of Google account');
  };

  const handleExploreAsGuest = () => {
    setIsGuestMode(true);
    setIsAuthenticated(false);
    setIsGoogleAuthModalOpen(false);
    try {
      safeSetItem('jhalak_guest_mode', 'true');
      safeSetItem('jhalak_auth_state', 'false');
    } catch {
      // quota handled
    }
    showToast('Browsing Jhalak as Guest');
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

  // Add a story
  const handleAddStory = () => {
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
    setCurrentUser(updatedUser);
    setPosts((prev) =>
      prev.map((p) =>
        p.userId === updatedUser.id
          ? { ...p, username: updatedUser.username, userAvatar: updatedUser.avatar }
          : p
      )
    );
    showToast(t.profileUpdated || t.profileUpdatedSuccess || 'Profile updated successfully');
  };

  // View User Profile handler
  const handleViewUser = (username: string) => {
    if (username === currentUser.username) {
      setCurrentTab('profile');
    } else {
      showToast(`Viewing @${username}'s posts in Explore`);
      setCurrentTab('explore');
    }
  };

  const userPosts = posts.filter((p) => p.userId === currentUser.id || p.username === currentUser.username);
  const savedPosts = posts.filter((p) => p.isSaved);
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  // Combine explore items and feed items for a rich explore grid
  const allExploreItems = [...exploreGridItems, ...posts];

  // If not logged in and not in guest mode, show the realistic Google Welcome & Sign-In Screen
  if (!isAuthenticated && !isGuestMode) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-black text-white' : 'bg-neutral-50 text-neutral-900'}`}>
        {toastMessage && (
          <div
            id="welcome-toast-notification"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 dark:bg-white/95 text-white dark:text-neutral-900 px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 transition transform animate-fade-in select-none"
          >
            {toastMessage}
          </div>
        )}
        <GoogleWelcomeScreen
          onContinueWithGoogle={() => setIsGoogleAuthModalOpen(true)}
          onExploreAsGuest={handleExploreAsGuest}
          onQuickLogin={handleGoogleLoginSuccess}
        />
        <GoogleAuthModal
          isOpen={isGoogleAuthModalOpen}
          onClose={() => setIsGoogleAuthModalOpen(false)}
          onLoginSuccess={handleGoogleLoginSuccess}
          onContinueAsGuest={handleExploreAsGuest}
          currentEmail={currentUser.email}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
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
          onTabChange={setCurrentTab}
          currentUser={currentUser}
          unreadMessagesCount={totalUnreadMessages}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenLegalPolicies={() => {
            setLegalModalTab('privacy');
            setIsLegalModalOpen(true);
          }}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          currentLanguage={currentLanguage}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-28 md:pb-16">
          {/* Mobile Top Header (only on mobile) */}
          <MobileHeader
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            currentUser={currentUser}
            unreadMessagesCount={totalUnreadMessages}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onShowNotifications={() => setIsNotificationsModalOpen(true)}
            onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenLegalPolicies={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            currentLanguage={currentLanguage}
          />

          {/* Tab 1: HOME FEED */}
          {currentTab === 'home' && (
            <div className="flex justify-center w-full max-w-6xl mx-auto px-0 sm:px-4 py-0 md:py-6">
              {/* Feed Column */}
              <div className="w-full max-w-[470px] sm:max-w-[540px] flex flex-col">
                {/* Stories Row */}
                <StoriesBar
                  stories={stories}
                  currentUser={currentUser}
                  onOpenStory={(index) => setActiveStoryIndex(index)}
                  onAddStory={handleAddStory}
                />

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
                        No posts yet
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mb-5 leading-relaxed">
                        No posts yet. Tap the '+' button below to create your first post!
                      </p>
                      <button
                        id="empty-feed-create-post-btn"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Create Your First Post</span>
                      </button>
                    </div>
                  ) : (
                    feedItemsWithAds.map((item) => {
                      if (adMobService.isAdItem(item)) {
                        return (
                          <AdMobNativeFeedAd
                            key={item.id}
                            ad={item}
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
                          onShare={(p) => {
                            setSharePost(p);
                            recommendationEngine.recordInteraction(p.category || 'Travel', 'share');
                          }}
                          onOpenDetail={(p) => setSelectedPostDetail(p)}
                          onOpenComments={(p) => setActiveCommentsPostId(p.id)}
                          onViewUser={handleViewUser}
                          onNotInterested={handleNotInterestedPost}
                          onShowMore={handleShowMorePost}
                          onReportPost={handleQuickReportPost}
                          onBlockUser={(username) => {
                            setReportTarget({
                              id: 'user-' + username,
                              type: 'post',
                              username,
                              mode: 'block',
                            });
                          }}
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
                currentLanguage={currentLanguage}
              />
            </div>
          )}

          {/* Tab 2: EXPLORE GRID */}
          {currentTab === 'explore' && (
            <ExploreView
              posts={allExploreItems}
              onSelectPost={(p) => setSelectedPostDetail(p)}
              currentLanguage={currentLanguage}
            />
          )}

          {/* Tab 3: REELS FEED */}
          {currentTab === 'reels' && (
            <div className="w-full flex-1 flex justify-center items-center py-0 md:py-3 bg-neutral-950">
              <ReelsView
                reels={unblockedReels}
                currentUser={currentUser}
                onToggleLike={handleToggleLikeReel}
                onToggleSave={handleToggleSaveReel}
                onAddComment={handleAddReelComment}
                onShare={handleShareReel}
                onViewUser={handleViewUser}
                onUseAudio={handleUseAudio}
                onReportReel={(r, reason) => handleReportSubmitted(r.id, reason)}
                onBlockUser={(u) => handleUserBlocked(u)}
                currentLanguage={currentLanguage}
              />
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
              userPosts={userPosts}
              savedPosts={savedPosts}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onSelectPost={(p) => setSelectedPostDetail(p)}
              onOpenStoryModal={() => setActiveStoryIndex(0)}
              onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
              onLogout={handleLogout}
              currentLanguage={currentLanguage}
            />
          )}
        </main>

        {/* Google AdMob Standard Bottom Banner Container (Fixed cleanly above bottom navigation) */}
        {currentTab !== 'reels' && (
          <div
            id="admob-bottom-banner-fixed-container"
            className="fixed bottom-[54px] md:bottom-2 inset-x-0 z-30 flex justify-center pointer-events-none px-3"
          >
            <div className="pointer-events-auto w-full max-w-md">
              <AdMobBannerAd />
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation Bar (only on mobile) */}
        <MobileBottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          currentUser={currentUser}
          unreadMessagesCount={totalUnreadMessages}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
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
          setIsAdminModDashboardOpen(true);
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
      />

      {/* MODAL 8: Instagram Modern Mobile Bottom-Sheet Comments */}
      {(() => {
        const activePost = posts.find((p) => p.id === activeCommentsPostId);
        if (!activePost) return null;
        return (
          <CommentsBottomSheet
            isOpen={!!activePost}
            onClose={() => setActiveCommentsPostId(null)}
            comments={activePost.comments}
            currentUser={currentUser}
            targetAuthorUsername={activePost.username}
            onAddComment={(text, mediaUrl, mediaType) => {
              handleAddComment(activePost.id, text, mediaUrl, mediaType);
            }}
            onToggleCommentLike={(commentId) => {
              handleToggleCommentLike(activePost.id, commentId);
            }}
            onViewUser={(username) => {
              setActiveCommentsPostId(null);
              handleViewUser(username);
            }}
          />
        );
      })()}

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
      />

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

      {/* MODAL 13: Admin Moderation Dashboard (Auto-flagged & Multi-Report Queue) */}
      <AdminModerationDashboard
        isOpen={isAdminModDashboardOpen}
        onClose={() => setIsAdminModDashboardOpen(false)}
        posts={posts}
        reels={reels}
        onKeepPost={handleAdminKeepPost}
        onDeletePostPermanently={handleAdminDeletePostPermanently}
        onBanUserAccount={handleAdminBanUser}
        onUnbanUser={handleAdminUnbanUser}
      />

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
