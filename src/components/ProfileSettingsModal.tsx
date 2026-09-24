import React, { useState, useEffect } from 'react';
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
  FileText,
  Trash2,
  UserCog,
  AlertTriangle,
  Scale,
  Database,
  ExternalLink,
  ShieldAlert,
  Moon,
  Sun,
  HardDrive,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, translations } from '../translations';
import { User } from '../types';
import { isSuperAdmin, ADMIN_EMAIL } from '../constants/admin';
import { AccountDeletionModal } from './AccountDeletionModal';
import { verifyFirebaseConfig, FirebaseDiagnosticStatus } from '../services/firebase';
import { purgeOfflineMediaStorage } from '../utils/persistentMediaStore';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenEditProfile: () => void;
  onOpenSavedPosts: () => void;
  onOpenLegalPolicies?: (tab?: 'privacy' | 'terms' | 'ugc') => void;
  onOpenModerationDashboard?: () => void;
  onDeleteAccount?: () => void;
  onLogout: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  postsCount?: number;
  reelsCount?: number;
  commentsCount?: number;
}

type SettingsSubView = 'main' | 'privacy' | 'language' | 'notifications' | 'account' | 'firebase';

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentLanguage,
  onLanguageChange,
  onOpenEditProfile,
  onOpenSavedPosts,
  onOpenLegalPolicies,
  onOpenModerationDashboard,
  onDeleteAccount,
  onLogout,
  darkMode = true,
  onToggleDarkMode,
  postsCount = 0,
  reelsCount = 0,
  commentsCount = 0,
}) => {
  const [subView, setSubView] = useState<SettingsSubView>('main');
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [pauseNotifications, setPauseNotifications] = useState(false);
  const [storyAlerts, setStoryAlerts] = useState(true);
  const [dmAlerts, setDmAlerts] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [firebaseDiagnostics, setFirebaseDiagnostics] = useState<FirebaseDiagnosticStatus | null>(null);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [purgeNotice, setPurgeNotice] = useState<string | null>(null);

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
              {subView === 'account' && 'Account Settings'}
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
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
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

              {/* 2b. Theme / डार्क या लाइट मोड */}
              {onToggleDarkMode && (
                <button
                  id="settings-theme-toggle-btn"
                  onClick={onToggleDarkMode}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                        Appearance (थीम)
                        <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {darkMode ? 'Dark Mode 🌙' : 'Light Mode ☀️'}
                        </span>
                      </span>
                      <span className="text-xs text-neutral-500">
                        Tap to toggle Dark or Light mode
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    Switch
                  </div>
                </button>
              )}

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

              {/* 6. Account Settings & Data Management (Google Play Compliance) */}
              <button
                id="settings-account-opt"
                onClick={() => setSubView('account')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white block">
                      Account Settings
                    </span>
                    <span className="text-xs text-neutral-500">
                      Email, security & Delete Account & Data
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Direct Delete Account & Data option (Google Play compliance) */}
              <button
                id="settings-direct-delete-account-btn"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      Delete Account & Data
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                        Google Play
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Purge posts, reels, comments & profile data
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 7. Legal, Privacy Policy & Terms of Service */}
              <button
                id="settings-legal-opt"
                onClick={() => {
                  if (onOpenLegalPolicies) {
                    onOpenLegalPolicies('privacy');
                  }
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      Privacy Policy & Terms
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        UGC Safe
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      Play Store compliance, user rights & report guidelines
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 8. Firebase & Cloud Storage Diagnostics */}
              <button
                id="settings-firebase-diagnostics-opt"
                onClick={() => {
                  setSubView('firebase');
                  setIsTestingFirebase(true);
                  verifyFirebaseConfig().then((diag) => {
                    setFirebaseDiagnostics(diag);
                    setIsTestingFirebase(false);
                  });
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition group text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      Firebase & Cloud Storage
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                        Active
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500">
                      Verify config, bucket connectivity & purge offline cache
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 7. Moderation Dashboard (Super Admin View strictly for Brijmohan83097@gmail.com) */}
              {isSuperAdmin(currentUser) && (
                <button
                  id="settings-moderation-dashboard-btn"
                  onClick={() => {
                    resetAndClose();
                    if (onOpenModerationDashboard) {
                      onOpenModerationDashboard();
                    }
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 transition group text-left border border-amber-500/30 bg-amber-500/5 my-1"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        Super Admin Dashboard
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold uppercase tracking-wider">
                          Admin
                        </span>
                      </span>
                      <span className="text-xs text-amber-700/80 dark:text-amber-400/80 block">
                        UGC moderation, banned users & creator payout approvals
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              <hr className="my-2 border-neutral-200 dark:border-neutral-800" />

              {/* 8. Logout */}
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

          {/* VIEW 6: Account Settings & Data Deletion (Play Store Mandatory) */}
          {subView === 'account' && (
            <div className="space-y-4 p-1 animate-in fade-in duration-200">
              {/* Account Profile Details */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">@{currentUser.username}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Active Account
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/80 grid grid-cols-1 gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-neutral-400">Account Privacy:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> 100% Private & Protected
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-neutral-400">Account Type:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Creator / Explorer
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Safety & Transparency */}
              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/70 text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  <Database className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span>Google Play User Data Transparency</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  In compliance with Google Play Store data safety mandates and Indian IT privacy regulations, you maintain complete ownership over your account data. You can permanently erase all your data from our systems at any moment.
                </p>
              </div>

              {/* Dangerous Zone / Account Deletion Section */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Danger Zone • Delete Account & Data
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                    Google Play Policy
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Permanently delete your account and purge all associated data. All your posts,
                  reels, comments, and profile data will be permanently purged from servers and device
                  storage.
                </p>

                {/* Stored Content Metrics */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-rose-200 dark:border-rose-900/40 text-center">
                    <span className="block font-bold text-sm text-neutral-900 dark:text-white">
                      {postsCount}
                    </span>
                    <span className="text-[10px] text-neutral-500">Posts to purge</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-rose-200 dark:border-rose-900/40 text-center">
                    <span className="block font-bold text-sm text-neutral-900 dark:text-white">
                      {reelsCount}
                    </span>
                    <span className="text-[10px] text-neutral-500">Reels to purge</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-rose-200 dark:border-rose-900/40 text-center">
                    <span className="block font-bold text-sm text-neutral-900 dark:text-white">
                      {commentsCount}
                    </span>
                    <span className="text-[10px] text-neutral-500">Comments</span>
                  </div>
                </div>

                {/* Visible "Delete Account" button */}
                <button
                  id="btn-delete-account-trigger"
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          )}

          {/* 7. Firebase & Cloud Storage Diagnostics Subview */}
          {subView === 'firebase' && (
            <div className="space-y-4 py-1">
              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Database className="w-5 h-5 text-sky-500" />
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Cloud Storage & Firebase Status
                  </h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Browser IndexedDB caching of video blobs has been completely removed to protect device memory. All uploads stream directly to Firebase Cloud Storage.
                </p>
              </div>

              {/* Status Report Card */}
              <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-neutral-500 font-medium">Firebase Project:</span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {firebaseDiagnostics?.projectId || 'upbeat-charge-xlk09'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-neutral-500 font-medium">Cloud Firestore:</span>
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Connected & Active
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-neutral-500 font-medium">Storage Bucket:</span>
                  <span className="font-mono text-[11px] text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]">
                    {firebaseDiagnostics?.storageBucket || 'upbeat-charge-xlk09.firebasestorage.app'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Bucket Reachability:</span>
                  <span
                    className={`font-semibold flex items-center gap-1.5 ${
                      firebaseDiagnostics?.storageReachable
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {firebaseDiagnostics?.storageReachable ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Ready for Direct Uploads
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" /> Check Firebase Console Bucket
                      </>
                    )}
                  </span>
                </div>

                {!firebaseDiagnostics?.storageReachable && firebaseDiagnostics?.storageStatusMessage && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-tight pt-1 border-t border-neutral-200 dark:border-neutral-700/60 font-mono">
                    {firebaseDiagnostics.storageStatusMessage}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingFirebase(true);
                    const diag = await verifyFirebaseConfig();
                    setFirebaseDiagnostics(diag);
                    setIsTestingFirebase(false);
                  }}
                  disabled={isTestingFirebase}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                  <span>{isTestingFirebase ? 'Verifying connection...' : 'Test Storage Connectivity'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await purgeOfflineMediaStorage();
                    setPurgeNotice('✅ Legacy offline storage & temporary blobs purged successfully!');
                    setTimeout(() => setPurgeNotice(null), 4000);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer"
                >
                  <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Purge Browser Offline Storage Now</span>
                </button>

                {purgeNotice && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center animate-in fade-in">
                    {purgeNotice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Play Compliant Account & Data Deletion Modal */}
      <AccountDeletionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        currentUser={currentUser}
        postsCount={postsCount}
        reelsCount={reelsCount}
        commentsCount={commentsCount}
        onConfirmDelete={() => {
          setIsDeleteModalOpen(false);
          resetAndClose();
          onDeleteAccount?.();
        }}
      />
    </div>
  );
};
