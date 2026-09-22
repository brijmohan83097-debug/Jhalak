import React from 'react';
import {
  Home,
  Search,
  Compass,
  Send,
  PlusSquare,
  Moon,
  Sun,
  Settings,
  Clapperboard,
  LogOut,
  Globe2,
  Scale,
  Heart,
  ShieldAlert,
} from 'lucide-react';
import { NavTab, User } from '../types';
import { SupportedLanguage, translations, SUPPORTED_LANGUAGES } from '../translations';
import { JhalakLogo } from './JhalakLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { isSuperAdmin, ADMIN_EMAIL } from '../constants/admin';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: User;
  unreadMessagesCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCreateModal: () => void;
  onOpenNotifications?: () => void;
  onOpenGoogleLogin?: () => void;
  onOpenSettings?: () => void;
  onOpenLegalPolicies?: () => void;
  onOpenSearch?: () => void;
  onOpenAdminPanel?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  currentLanguage?: SupportedLanguage;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  unreadMessagesCount,
  darkMode,
  onToggleDarkMode,
  onOpenCreateModal,
  onOpenNotifications,
  onOpenGoogleLogin,
  onOpenSettings,
  onOpenLegalPolicies,
  onOpenSearch,
  onOpenAdminPanel,
  onLogout,
  isAuthenticated = true,
  currentLanguage = 'en',
}) => {
  const t = translations[currentLanguage];
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  const navItems = [
    {
      id: 'home' as NavTab,
      label: t.home,
      icon: Home,
    },
    {
      id: 'reels' as NavTab,
      label: t.reels,
      icon: Clapperboard,
    },
    {
      id: 'explore' as NavTab,
      label: t.explore,
      icon: Compass,
    },
    {
      id: 'messages' as NavTab,
      label: t.messages,
      icon: Send,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
  ];

  return (
    <aside
      id="main-desktop-sidebar"
      className="hidden md:flex flex-col justify-between w-18 xl:w-64 h-screen sticky top-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-3 xl:p-4 z-40 transition-colors select-none"
    >
      <div className="flex flex-col gap-5">
        {/* Jhalak Brand Logo */}
        <div
          id="sidebar-brand-header"
          onClick={() => onTabChange('home')}
          className="cursor-pointer py-3 px-2 flex items-center gap-3 group"
          title="Jhalak Reels: Made in India"
        >
          {/* Full logo on large screens */}
          <div className="hidden xl:flex items-center gap-3">
            <JhalakLogo size={38} showGlow={false} animate={true} />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base tracking-tight text-neutral-900 dark:text-white leading-tight">
                Jhalak Reels:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 tracking-wider uppercase leading-none">
                  Made in India
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-semibold border border-amber-500/20">
                  {activeLang?.name}
                </span>
              </div>
            </div>
          </div>
          <div className="xl:hidden mx-auto flex items-center justify-center">
            <JhalakLogo size={38} showGlow={false} animate={true} />
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-4 p-3 rounded-xl transition group ${
                  isActive
                    ? 'font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-900'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <div className="relative mx-auto xl:mx-0">
                  <Icon
                    className={`w-6 h-6 transition-transform group-hover:scale-105 ${
                      isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline text-sm">{item.label}</span>
              </button>
            );
          })}

          {/* Quick Search Overlay Button */}
          {onOpenSearch && (
            <button
              id="sidebar-search-overlay-btn"
              onClick={onOpenSearch}
              className="flex items-center gap-4 p-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition group cursor-pointer"
              title="Search Bhojpuri Reels & Creators"
            >
              <div className="relative mx-auto xl:mx-0">
                <Search className="w-6 h-6 stroke-[1.8] text-rose-500 transition-transform group-hover:scale-105" />
              </div>
              <span className="hidden xl:inline text-sm font-medium">Search</span>
            </button>
          )}

          {/* Notifications Button */}
          {onOpenNotifications && (
            <button
              id="sidebar-notifications-btn"
              onClick={onOpenNotifications}
              className="flex items-center gap-4 p-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition group"
            >
              <Heart className="w-6 h-6 mx-auto xl:mx-0 stroke-[1.8] group-hover:scale-105 transition-transform" />
              <span className="hidden xl:inline text-sm font-medium">{t.notifications}</span>
            </button>
          )}

          {/* Create Post Button */}
          <button
            id="sidebar-create-btn"
            onClick={onOpenCreateModal}
            className="flex items-center gap-4 p-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition group"
          >
            <PlusSquare className="w-6 h-6 mx-auto xl:mx-0 stroke-[1.8] group-hover:scale-105 transition-transform" />
            <span className="hidden xl:inline text-sm font-medium">{t.create}</span>
          </button>

          {/* Profile link */}
          <button
            id="sidebar-nav-profile"
            onClick={() => onTabChange('profile')}
            className={`flex items-center gap-4 p-3 rounded-xl transition ${
              currentTab === 'profile'
                ? 'font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-900'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <div
              className={`p-[1.5px] rounded-full mx-auto xl:mx-0 ${
                currentTab === 'profile'
                  ? 'border-2 border-neutral-900 dark:border-white'
                  : 'border border-transparent'
              }`}
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                alt={currentUser.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            </div>
            <span className="hidden xl:inline text-sm">{t.profile}</span>
          </button>
        </nav>
      </div>

      {/* Bottom Controls: Settings, Language, Theme Toggle, Google Account & Logout */}
      <div className="flex flex-col gap-1 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        {/* Settings Button */}
        {onOpenSettings && (
          <button
            id="sidebar-settings-btn"
            onClick={onOpenSettings}
            className="flex items-center gap-4 p-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition group"
            title={`${t.settings} & ${t.language}`}
          >
            <Settings className="w-6 h-6 mx-auto xl:mx-0 stroke-[1.8] group-hover:rotate-45 transition-transform" />
            <div className="hidden xl:flex items-center justify-between w-full">
              <span className="text-sm font-medium">{t.settings}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {activeLang?.name}
              </span>
            </div>
          </button>
        )}

        {/* Super Admin Dashboard (Strictly visible ONLY for Brijmohan83097@gmail.com) */}
        {isSuperAdmin(currentUser) && onOpenAdminPanel && (
          <button
            id="sidebar-admin-panel-btn"
            onClick={onOpenAdminPanel}
            className="flex items-center gap-4 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition group border border-amber-500/30 text-left shadow-2xs"
            title={`Super Admin Dashboard (${ADMIN_EMAIL})`}
          >
            <ShieldAlert className="w-6 h-6 mx-auto xl:mx-0 stroke-[2.2] text-amber-500 group-hover:scale-105 transition-transform" />
            <div className="hidden xl:flex items-center justify-between w-full">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">Admin Panel</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold uppercase">
                Admin
              </span>
            </div>
          </button>
        )}

        {/* Privacy & Terms (Play Store Compliance) */}
        {/* PWA App Install Button */}
        <div className="hidden xl:block">
          <PWAInstallButton variant="sidebar" />
        </div>

        {onOpenLegalPolicies && (
          <button
            id="sidebar-legal-btn"
            onClick={onOpenLegalPolicies}
            className="flex items-center gap-4 p-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition group"
            title="Privacy Policy & Terms"
          >
            <Scale className="w-6 h-6 mx-auto xl:mx-0 stroke-[1.8] text-amber-500 group-hover:scale-105 transition-transform" />
            <div className="hidden xl:flex items-center justify-between w-full">
              <span className="text-sm font-medium">Privacy & Terms</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                UGC Safe
              </span>
            </div>
          </button>
        )}

        {onOpenGoogleLogin && (
          <button
            id="sidebar-google-btn"
            onClick={onOpenGoogleLogin}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition group text-left"
            title={isAuthenticated ? `Signed in as ${currentUser.name}` : 'Sign in with Google'}
          >
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs flex-shrink-0 mx-auto xl:mx-0">
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
            <div className="hidden xl:flex flex-col min-w-0">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                @{currentUser.username}
              </span>
            </div>
          </button>
        )}

        <button
          id="theme-toggle-desktop"
          onClick={onToggleDarkMode}
          className="flex items-center gap-4 p-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
          title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
        >
          {darkMode ? (
            <Sun className="w-6 h-6 mx-auto xl:mx-0 text-amber-400 stroke-[1.8]" />
          ) : (
            <Moon className="w-6 h-6 mx-auto xl:mx-0 text-neutral-700 stroke-[1.8]" />
          )}
          <span className="hidden xl:inline text-sm font-medium">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {onLogout && (
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-4 p-3 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition group"
            title={t.logout}
          >
            <LogOut className="w-6 h-6 mx-auto xl:mx-0 stroke-[1.8] group-hover:scale-105 transition-transform" />
            <span className="hidden xl:inline text-sm font-medium">{t.logout}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
