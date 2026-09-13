import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Shield,
  Globe2,
  Bell,
  Bookmark,
  LogOut,
  ChevronRight,
  Check,
  ToggleLeft,
  ToggleRight,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, translations } from '../translations';
import { User } from '../types';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenEditProfile: () => void;
  onOpenSavedPosts: () => void;
  onLogout: () => void;
}

type SettingsSubView = 'main' | 'privacy' | 'language' | 'notifications';

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentLanguage,
  onLanguageChange,
  onOpenEditProfile,
  onOpenSavedPosts,
  onLogout,
}) => {
  const [subView, setSubView] = useState<SettingsSubView>('main');
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [pauseNotifications, setPauseNotifications] = useState(false);
  const [storyAlerts, setStoryAlerts] = useState(true);
  const [dmAlerts, setDmAlerts] = useState(true);

  if (!isOpen) return null;

  const t = translations[currentLanguage];
  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  const resetAndClose = () => {
    setSubView('main');
    onClose();
  };

  return (
    <div
      id="profile-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            {subView !== 'main' ? (
              <button
                onClick={() => setSubView('main')}
                className="p-1 -ml-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg transition"
                aria-label="Back to settings menu"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            ) : null}
            <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              {subView === 'main' && t.settings}
              {subView === 'language' && t.switchLanguage}
              {subView === 'privacy' && t.accountPrivacy}
              {subView === 'notifications' && t.notifications}
            </h2>
          </div>

          <button
            id="close-settings-modal-btn"
            onClick={resetAndClose}
            aria-label="Close Settings"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-3">
          {/* VIEW 1: Main Menu */}
          {subView === 'main' && (
            <div className="space-y-1">
              {/* User overview strip */}
              <div className="px-3 py-3 mb-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">@{currentUser.username}</p>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium flex items-center gap-1">
                  <span>{activeLangObj?.flag}</span>
                  <span>{activeLangObj?.name}</span>
                </div>
              </div>

              {/* 1. Edit Profile */}
              <button
                id="settings-edit-profile-opt"
                onClick={() => {
                  onOpenEditProfile();
                  resetAndClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                      {t.editProfile}
                    </span>
                    <span className="text-xs text-neutral-500">
                      Photo, name, username, bio & links
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Language / भाषा */}
              <button
                id="settings-language-opt"
                onClick={() => setSubView('language')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      {t.language}
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {activeLangObj?.name}
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      English, हिंदी, বাংলা, తెలుగు, मराठी, தமிழ், भोजपुरी
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. Account Privacy */}
              <button
                id="settings-privacy-opt"
                onClick={() => setSubView('privacy')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                      {t.accountPrivacy}
                    </span>
                    <span className="text-xs text-neutral-500">{t.privacySubtitle}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 4. Notifications */}
              <button
                id="settings-notifications-opt"
                onClick={() => setSubView('notifications')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                      {t.notifications}
                    </span>
                    <span className="text-xs text-neutral-500">{t.notificationsSubtitle}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 5. Saved Posts */}
              <button
                id="settings-saved-opt"
                onClick={() => {
                  onOpenSavedPosts();
                  resetAndClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                      {t.savedPosts}
                    </span>
                    <span className="text-xs text-neutral-500">View bookmarked reels & posts</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <hr className="my-2 border-neutral-200 dark:border-neutral-800" />

              {/* 6. Logout */}
              <button
                id="settings-logout-opt"
                onClick={() => {
                  resetAndClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block">{t.logout}</span>
                    <span className="text-xs text-rose-500/80 dark:text-rose-400/80">
                      Sign out of Google account
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* VIEW 2: Indian Language Selector */}
          {subView === 'language' && (
            <div className="space-y-2 p-1">
              <div className="px-2 py-1.5 mb-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t.selectLanguage}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLanguage === lang.code;

                  return (
                    <button
                      key={lang.code}
                      id={`lang-select-${lang.code}`}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        // Brief pause to show checkmark then return
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-neutral-900 dark:text-white'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <p className="text-sm font-bold flex items-center gap-2">
                            <span>{lang.name}</span>
                            <span className="text-xs font-normal text-neutral-500">
                              ({lang.englishName})
                            </span>
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            Greeting: {lang.greeting} • {lang.englishName}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-700" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>
                  Language switches instantly across your entire feed, navigation tabs, reels, and
                  profile actions!
                </p>
              </div>
            </div>
          )}

          {/* VIEW 3: Account Privacy */}
          {subView === 'privacy' && (
            <div className="space-y-4 p-2">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {t.privateAccount}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t.privateAccountDesc}
                  </p>
                </div>

                <button
                  id="privacy-toggle-btn"
                  onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                  className="text-2xl transition"
                >
                  {isPrivateAccount ? (
                    <ToggleRight className="w-9 h-9 text-indigo-500 fill-indigo-500/20" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-neutral-400" />
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                  Activity Status
                </span>
                <p className="text-xs text-neutral-500">
                  Allow accounts you follow to see when you were last active on Jhalak.
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Currently Active</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: Notifications Settings */}
          {subView === 'notifications' && (
            <div className="space-y-3 p-2">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                    {t.pauseAllNotifications}
                  </span>
                  <p className="text-xs text-neutral-500">{t.pauseAllDesc}</p>
                </div>
                <button
                  onClick={() => setPauseNotifications(!pauseNotifications)}
                  className="text-2xl transition"
                >
                  {pauseNotifications ? (
                    <ToggleRight className="w-9 h-9 text-amber-500 fill-amber-500/20" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-neutral-400" />
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                    {t.storiesAndPosts}
                  </span>
                  <span className="text-xs text-neutral-500">Likes, comments & story mentions</span>
                </div>
                <button
                  onClick={() => setStoryAlerts(!storyAlerts)}
                  disabled={pauseNotifications}
                  className="text-2xl transition disabled:opacity-40"
                >
                  {storyAlerts && !pauseNotifications ? (
                    <ToggleRight className="w-8 h-8 text-sky-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                    {t.directMessagesNotif}
                  </span>
                  <span className="text-xs text-neutral-500">New messages and audio calls</span>
                </div>
                <button
                  onClick={() => setDmAlerts(!dmAlerts)}
                  disabled={pauseNotifications}
                  className="text-2xl transition disabled:opacity-40"
                >
                  {dmAlerts && !pauseNotifications ? (
                    <ToggleRight className="w-8 h-8 text-sky-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
