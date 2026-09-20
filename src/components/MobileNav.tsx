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
  Search,
  ShieldAlert,
} from 'lucide-react';
import { NavTab, User } from '../types';
import { SupportedLanguage, translations, SUPPORTED_LANGUAGES } from '../translations';
import { JhalakLogo } from './JhalakLogo';
import { isSuperAdmin, ADMIN_EMAIL } from '../constants/admin';

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
  onOpenSearch?: () => void;
  onOpenAdminPanel?: () => void;
  currentLanguage?: SupportedLanguage;
}

export const MobileHeader: React.FC<MobileNavProps> = ({
  onTabChange,
  onOpenSearch,
}) => {
  return (
    <header
      id="mobile-top-header"
      className="md:hidden sticky top-0 z-40 h-14 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 transition-colors select-none"
    >
      {/* 1. Left side: Square Tiranga 'J' badge logo and "Jhalak Reels: Made in India" branding */}
      <div className="flex items-center flex-shrink-0">
        <button
          id="top-brand-header-title"
          onClick={() => onTabChange('home')}
          className="group flex items-center gap-2 sm:gap-2.5 focus:outline-none cursor-pointer active:scale-98 transition-transform"
          aria-label="Jhalak Reels: Made in India"
        >
          <JhalakLogo size={32} showGlow={false} animate={false} />
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-neutral-900 dark:text-white leading-tight">
              Jhalak Reels
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-500 dark:text-amber-400 tracking-wider uppercase leading-none">
              Made in India
            </span>
          </div>
        </button>
      </div>

      {/* Prominent Search bar / quick explore right next to the Jhalak Reels logo */}
      <button
        id="top-header-search-bar"
        onClick={onOpenSearch || (() => onTabChange('explore'))}
        type="button"
        className="flex-1 min-w-[110px] max-w-[210px] sm:max-w-xs flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/90 dark:border-neutral-700/80 text-neutral-500 dark:text-neutral-400 hover:border-rose-500/50 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition active:scale-98 cursor-pointer shadow-2xs group"
        aria-label="Search Bhojpuri Reels, Creators & Tags"
        title="Search Bhojpuri Reels & Creators"
      >
        <Search className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
        <span className="text-[11px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate">
          Search Bhojpuri...
        </span>
      </button>

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

      {/* Dedicated Reels Tab (2nd position next to Home) */}
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
