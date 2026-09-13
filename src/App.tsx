import React, { useState, useEffect } from 'react';
import { NavTab, Post, StoryGroup, User, Conversation, Comment, Message, Reel } from './types';
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
import { SupportedLanguage, translations } from './translations';

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
    const saved = localStorage.getItem('ig_current_user');
    return saved ? JSON.parse(saved) : initialCurrentUser;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('ig_feed_posts');
    return saved ? JSON.parse(saved) : initialPosts;
  });

  const [reels, setReels] = useState<Reel[]>(() => {
    const saved = localStorage.getItem('ig_reels');
    return saved ? JSON.parse(saved) : initialReels;
  });

  const [stories, setStories] = useState<StoryGroup[]>(() => {
    const saved = localStorage.getItem('ig_stories');
    return saved ? JSON.parse(saved) : initialStories;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('ig_conversations');
    return saved ? JSON.parse(saved) : initialConversations;
  });

  // Modals & Overlays state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState<Post | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[currentLanguage];

  // Save language selection
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    localStorage.setItem('jhalak_language', lang);
    showToast(`Language switched to ${translations[lang].language}`);
  };

  // Sync dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ig_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ig_theme', 'light');
    }
  }, [darkMode]);

  // Persist feed posts
  useEffect(() => {
    localStorage.setItem('ig_feed_posts', JSON.stringify(posts));
  }, [posts]);

  // Persist reels
  useEffect(() => {
    localStorage.setItem('ig_reels', JSON.stringify(reels));
  }, [reels]);

  // Persist current user
  useEffect(() => {
    localStorage.setItem('ig_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem('ig_conversations', JSON.stringify(conversations));
  }, [conversations]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Toggle Like Handler
  const handleToggleLike = (postId: string) => {
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
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isSaved = !post.isSaved;
          showToast(isSaved ? t.postSaved : t.postUnsaved);
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
  const handleAddComment = (postId: string, text: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
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

    showToast(t.commentPosted);
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
          showToast(isSaved ? t.postSaved : t.postUnsaved);
          return { ...reel, isSaved };
        }
        return reel;
      })
    );
  };

  const handleAddReelComment = (reelId: string, text: string) => {
    const newComment: Comment = {
      id: `c-reel-${Date.now()}`,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
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
    showToast(t.commentPosted);
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
      bio: account.email.includes('brijmohan')
        ? '📸 Visual storyteller & photographer from India 🇮🇳\n🌊 Marine Drive sunsets to Ladakh Himalayan trails 🏔️\n☕ South Indian filter kaapi lover & Jhalak creator'
        : account.email.includes('ananya')
        ? '✨ Fashion, Indie aesthetics & Monsoon vibes 🌸\n📍 South Mumbai | Chai & Poetry ☕\nFounder of @desiaesthetic'
        : `✨ Digital creator & explorer 🇮🇳 | ${account.name}`,
    };
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    setIsGuestMode(false);
    setIsGoogleAuthModalOpen(false);
    localStorage.setItem('jhalak_auth_state', 'true');
    localStorage.setItem('jhalak_guest_mode', 'false');
    localStorage.setItem('ig_current_user', JSON.stringify(updatedUser));
    showToast(`Welcome, ${account.name}! Signed in with Google 🎉`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsGuestMode(false);
    setIsSettingsModalOpen(false);
    localStorage.setItem('jhalak_auth_state', 'false');
    localStorage.setItem('jhalak_guest_mode', 'false');
    showToast('Signed out of Google account');
  };

  const handleExploreAsGuest = () => {
    setIsGuestMode(true);
    setIsAuthenticated(false);
    setIsGoogleAuthModalOpen(false);
    localStorage.setItem('jhalak_guest_mode', 'true');
    localStorage.setItem('jhalak_auth_state', 'false');
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
    const newSlide = {
      id: `s-new-${Date.now()}`,
      mediaUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image' as const,
      timestamp: 'Just now',
      caption: 'Evening glow in the city 🌆✨',
    };

    setStories((prev) =>
      prev.map((group) => {
        if (group.userId === currentUser.id) {
          return {
            ...group,
            slides: [newSlide, ...group.slides],
          };
        }
        return group;
      })
    );

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
    showToast(t.profileUpdated);
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
          onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          currentLanguage={currentLanguage}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {/* Mobile Top Header (only on mobile) */}
          <MobileHeader
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            currentUser={currentUser}
            unreadMessagesCount={totalUnreadMessages}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenGoogleLogin={() => setIsGoogleAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
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
                  {posts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onToggleLike={handleToggleLike}
                      onToggleSave={handleToggleSave}
                      onAddComment={handleAddComment}
                      onShare={(p) => setSharePost(p)}
                      onOpenDetail={(p) => setSelectedPostDetail(p)}
                      onViewUser={handleViewUser}
                      currentLanguage={currentLanguage}
                    />
                  ))}
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
                reels={reels}
                currentUser={currentUser}
                onToggleLike={handleToggleLikeReel}
                onToggleSave={handleToggleSaveReel}
                onAddComment={handleAddReelComment}
                onShare={handleShareReel}
                onViewUser={handleViewUser}
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
          onClose={() => setIsCreateModalOpen(false)}
          onPostCreated={handlePostCreated}
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
        onLogout={handleLogout}
      />

      {/* MODAL 7: Google Account & Login Modal */}
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
