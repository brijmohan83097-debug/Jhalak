import React, { useState } from 'react';
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
} from 'lucide-react';
import { User, Post } from '../types';
import { profileHighlights } from '../data/mockData';
import { SupportedLanguage, translations, SUPPORTED_LANGUAGES } from '../translations';
import { UpiShagunSheet } from './UpiShagunSheet';
import { safeSetItem } from '../utils/safeStorage';

interface ProfileViewProps {
  user: User;
  userPosts: Post[];
  savedPosts: Post[];
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onSelectPost: (post: Post) => void;
  onOpenStoryModal?: () => void;
  onOpenGoogleLogin?: () => void;
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
  onOpenStoryModal,
  onOpenGoogleLogin,
  onLogout,
  currentLanguage = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const [highlights, setHighlights] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ig_profile_highlights');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showShagunSheet, setShowShagunSheet] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const t = translations[currentLanguage];
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  const displayPosts =
    activeTab === 'posts'
      ? userPosts
      : activeTab === 'saved'
      ? savedPosts
      : [];

  const handleAddHighlight = () => {
    const title = prompt('Enter highlight name:', 'Moments ✨');
    if (!title) return;
    const newHighlight = {
      id: `hl-${Date.now()}`,
      title,
      cover: userPosts[0]?.mediaUrl || user.avatar,
    };
    const updated = [...highlights, newHighlight];
    setHighlights(updated);
    try {
      safeSetItem('ig_profile_highlights', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div id="profile-view" className="w-full max-w-4xl mx-auto px-4 py-6">
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
                src={user.avatar}
                alt={user.name}
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
              <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-1.5">
                {user.username}
                {user.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-sky-500 fill-sky-500" />
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
                title={`Send UPI Shagun tip to @${user.username} via GPay, PhonePe, Paytm`}
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
                  <span className="hidden sm:inline">{user.email ? 'Google' : 'Sign in'}</span>
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
                {userPosts.length}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.posts}</span>
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {user.followersCount.toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.followers}</span>
            </div>
            <div>
              <span className="font-bold text-neutral-900 dark:text-white">
                {user.followingCount.toLocaleString()}
              </span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{t.following}</span>
            </div>
          </div>

          {/* Bio & Links */}
          <div className="text-sm">
            <h2 className="font-semibold text-neutral-900 dark:text-white">{user.name}</h2>
            <p className="whitespace-pre-line text-neutral-800 dark:text-neutral-200 mt-1">
              {user.bio}
            </p>
            {user.website && (
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
                    {user.email || t.googleAccount}
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
          <div className="font-bold text-neutral-900 dark:text-white">{userPosts.length}</div>
          <div className="text-xs text-neutral-500">{t.posts}</div>
        </div>
        <div>
          <div className="font-bold text-neutral-900 dark:text-white">
            {user.followersCount.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">{t.followers}</div>
        </div>
        <div>
          <div className="font-bold text-neutral-900 dark:text-white">
            {user.followingCount.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">{t.following}</div>
        </div>
      </div>

      {/* Story Highlights */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-6 border-b border-neutral-200 dark:border-neutral-800/80 mb-2">
        {highlights.map((hl) => (
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
      {displayPosts.length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center mx-auto mb-3">
            {activeTab === 'saved' ? (
              <Bookmark className="w-7 h-7 text-neutral-400" />
            ) : (
              <Grid className="w-7 h-7 text-neutral-400" />
            )}
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            {activeTab === 'saved' ? t.noSavedPosts : t.noPostsYet}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'saved'
              ? 'Save photos and videos that you want to see again. No one is notified, and only you can see what you’ve saved.'
              : 'When you share photos and videos, they will appear on your profile.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {displayPosts.map((post) => (
            <div
              key={post.id}
              id={`profile-grid-post-${post.id}`}
              onClick={() => onSelectPost(post)}
              className="group relative aspect-square bg-neutral-900 overflow-hidden cursor-pointer rounded-sm md:rounded-lg"
            >
              {post.mediaType === 'video' ? (
                <video
                  src={post.mediaUrl}
                  muted
                  preload="metadata"
                  className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                    post.filter || ''
                  }`}
                />
              ) : (
                <img
                  src={post.mediaUrl}
                  alt={post.caption}
                  className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                    post.filter || ''
                  }`}
                  loading="lazy"
                />
              )}

              {post.mediaType === 'video' && (
                <div className="absolute top-2 right-2 text-white drop-shadow-md z-10">
                  <Film className="w-4 h-4" />
                </div>
              )}
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-6 text-white font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">❤️</span>
                  <span>{post.likesCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💬</span>
                  <span>{post.comments.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPI Shagun Creator Tipping Bottom Sheet */}
      <UpiShagunSheet
        isOpen={showShagunSheet}
        onClose={() => setShowShagunSheet(false)}
        creator={{
          username: user.username,
          name: user.name || user.username,
          avatar: user.avatar,
        }}
        onTipSent={(amount, app, note) => {
          setToastMsg(`Sent ₹${amount} Shagun to @${user.username} via ${app}! 🎁✨`);
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />

      {/* Success Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-neutral-900/95 text-white dark:bg-white dark:text-neutral-900 rounded-full shadow-2xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
