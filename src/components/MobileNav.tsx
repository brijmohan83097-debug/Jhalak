import React, { useState } from 'react';
import {
  Heart,
  Send,
  PlusSquare,
  Moon,
  Sun,
  Home,
  Compass,
  Clapperboard,
  Check,
  Globe2,
  Settings,
  Scale,
} from 'lucide-react';
import { NavTab, User } from '../types';
import { SupportedLanguage, translations, SUPPORTED_LANGUAGES } from '../translations';
import { JhalakLogo } from './JhalakLogo';

interface MobileNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: User;
  unreadMessagesCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCreateModal: () => void;
  onShowNotifications?: () => void;
  onOpenGoogleLogin?: () => void;
  onOpenSettings?: () => void;
  onOpenLegalPolicies?: () => void;
  currentLanguage?: SupportedLanguage;
}

export const MobileHeader: React.FC<MobileNavProps> = ({
  onTabChange,
  unreadMessagesCount,
  darkMode,
  onToggleDarkMode,
  onOpenCreateModal,
  onShowNotifications,
  onOpenGoogleLogin,
  onOpenSettings,
  onOpenLegalPolicies,
  currentLanguage = 'en',
}) => {
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const t = translations[currentLanguage];
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  const handleNotificationClick = () => {
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 3000);
  };

  return (
    <header
      id="mobile-top-header"
      className="md:hidden sticky top-0 z-40 bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 flex items-center justify-between transition-colors select-none"
    >
      <div className="flex items-center gap-2">
        <button
          id="top-brand-header-title"
          onClick={() => onTabChange('home')}
          className="group flex items-center gap-2 focus:outline-none"
        >
          <JhalakLogo size={28} showGlow={false} animate={true} />
          <span className="font-brand italic font-bold text-2xl sm:text-3xl tracking-tight text-brand-gradient hover:opacity-90 transition-opacity">
            Jhalak
          </span>
        </button>

        {/* Quick Language switch tag */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold flex items-center gap-1"
            title="Change language / भाषा बदलें"
          >
            <span>{activeLang?.flag}</span>
            <span>{activeLang?.name}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 text-neutral-900 dark:text-white">
        <button
          id="mobile-header-create-btn"
          onClick={onOpenCreateModal}
          aria-label={t.create}
          className="p-1 hover:opacity-70 transition active:scale-90"
        >
          <PlusSquare className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
        </button>

        {onOpenGoogleLogin && (
          <button
            id="mobile-google-btn"
            onClick={onOpenGoogleLogin}
            aria-label="Google Account"
            className="p-1 hover:opacity-85 transition active:scale-95"
            title="Google Account"
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
          </button>
        )}

        {/* Legal & UGC Policies Button */}
        {onOpenLegalPolicies && (
          <button
            id="mobile-legal-btn"
            onClick={onOpenLegalPolicies}
            aria-label="Privacy & Terms"
            className="p-1 hover:opacity-70 transition active:scale-95 text-amber-500"
            title="Privacy & Community Guidelines"
          >
            <Scale className="w-5 h-5 stroke-[1.8]" />
          </button>
        )}

        {/* Mobile Settings Gear */}
        {onOpenSettings && (
          <button
            id="mobile-settings-btn"
            onClick={onOpenSettings}
            aria-label={t.settings}
            className="p-1 hover:opacity-70 transition active:scale-95 text-neutral-700 dark:text-neutral-300"
          >
            <Settings className="w-5 h-5 stroke-[1.8]" />
          </button>
        )}

        <button
          id="mobile-theme-toggle"
          onClick={onToggleDarkMode}
          aria-label="Toggle theme"
          className="p-1 hover:opacity-70 transition text-neutral-800 dark:text-neutral-200"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-400 stroke-[1.8]" />
          ) : (
            <Moon className="w-5 h-5 stroke-[1.8]" />
          )}
        </button>

        <button
          id="mobile-notifications-btn"
          onClick={() => {
            if (onShowNotifications) {
              onShowNotifications();
            } else {
              handleNotificationClick();
            }
          }}
          aria-label={t.notifications}
          className="p-1 hover:opacity-70 transition active:scale-90 relative"
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        <button
          id="mobile-messages-header-btn"
          onClick={() => onTabChange('messages')}
          aria-label={t.messages}
          className="p-1 hover:opacity-70 transition active:scale-90 relative"
        >
          <Send className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>

      {/* In-app notification toast */}
      {showNotificationToast && (
        <div className="absolute top-14 left-4 right-4 bg-neutral-900 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl flex items-center justify-between border border-neutral-800 animate-slide-up z-50">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>You are all caught up on notifications!</span>
          </div>
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
      )}
    </header>
  );
};

export const MobileBottomNav: React.FC<MobileNavProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  unreadMessagesCount,
  onOpenCreateModal,
  currentLanguage = 'en',
}) => {
  const t = translations[currentLanguage];

  return (
    <nav
      id="mobile-bottom-navbar"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 py-2 px-4 flex items-center justify-around transition-colors select-none"
    >
      <button
        id="mobile-nav-home"
        onClick={() => onTabChange('home')}
        aria-label={t.home}
        className={`p-1.5 transition ${
          currentTab === 'home'
            ? 'text-neutral-900 dark:text-white'
            : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <Home className={`w-6 h-6 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </button>

      <button
        id="mobile-nav-explore"
        onClick={() => onTabChange('explore')}
        aria-label={t.explore}
        className={`p-1.5 transition ${
          currentTab === 'explore'
            ? 'text-neutral-900 dark:text-white'
            : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <Compass className={`w-6 h-6 ${currentTab === 'explore' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
      </button>

      {/* Dedicated Reels Tab */}
      <button
        id="mobile-nav-reels"
        onClick={() => onTabChange('reels')}
        aria-label={t.reels}
        className={`p-1.5 transition relative ${
          currentTab === 'reels'
            ? 'text-rose-500 dark:text-rose-400'
            : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <Clapperboard
          className={`w-6 h-6 ${currentTab === 'reels' ? 'stroke-[2.5] scale-105' : 'stroke-[1.8]'}`}
        />
        {currentTab === 'reels' && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-500 rounded-full" />
        )}
      </button>

      {/* Create Button */}
      <button
        id="mobile-nav-create"
        onClick={onOpenCreateModal}
        aria-label={t.create}
        className="p-1.5 text-neutral-900 dark:text-white transition active:scale-90"
      >
        <PlusSquare className="w-6 h-6 stroke-[1.8]" />
      </button>

      <button
        id="mobile-nav-messages"
        onClick={() => onTabChange('messages')}
        aria-label={t.messages}
        className={`relative p-1.5 transition ${
          currentTab === 'messages'
            ? 'text-neutral-900 dark:text-white'
            : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        <Send className={`w-6 h-6 ${currentTab === 'messages' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        {unreadMessagesCount > 0 && (
          <span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {unreadMessagesCount}
          </span>
        )}
      </button>

      <button
        id="mobile-nav-profile"
        onClick={() => onTabChange('profile')}
        aria-label={t.profile}
        className="p-1 transition"
      >
        <div
          className={`p-[1.5px] rounded-full ${
            currentTab === 'profile'
              ? 'border-2 border-neutral-900 dark:border-white'
              : 'border border-transparent'
          }`}
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.username}
            className="w-6 h-6 rounded-full object-cover"
          />
        </div>
      </button>
    </nav>
  );
};
