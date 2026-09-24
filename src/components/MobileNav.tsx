import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  X,
  BadgeCheck,
  Film,
  User as UserIcon,
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
  onOpenSearch?: (initialQuery?: string) => void;
  onOpenAdminPanel?: () => void;
  currentLanguage?: SupportedLanguage;
  searchableUsers?: User[];
  onViewUser?: (username: string, userObj?: User) => void;
}

export const MobileHeader: React.FC<MobileNavProps> = ({
  onTabChange,
  onOpenSearch,
  searchableUsers = [],
  onViewUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter friends & creators by name or username
  const matchingUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!q) return [];
    return (searchableUsers || [])
      .filter((u) => {
        const nameMatch = (u.name || '').toLowerCase().includes(q);
        const usernameMatch = (u.username || '').toLowerCase().includes(q);
        return nameMatch || usernameMatch;
      })
      .slice(0, 7);
  }, [searchableUsers, searchQuery]);

  // Click outside to dismiss search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (u: User) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    if (onViewUser) {
      onViewUser(u.username, u);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingUsers.length === 1) {
        handleSelectUser(matchingUsers[0]);
      } else if (onOpenSearch) {
        setIsDropdownOpen(false);
        onOpenSearch(searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

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

      {/* 2. Top search bar: Search friends by name with live suggestions */}
      <div ref={containerRef} className="relative flex-1 min-w-[140px] max-w-[260px] sm:max-w-xs">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-500 pointer-events-none" />
          <input
            ref={inputRef}
            id="top-header-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search friends by name..."
            aria-label="Search friends by name"
            className="w-full pl-8 pr-7 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/90 dark:border-neutral-700/80 text-[11px] sm:text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsDropdownOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Friends Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div
            id="top-search-friends-dropdown"
            className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 overflow-hidden z-50 animate-fade-in"
          >
            <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-rose-500" />
                Friends & Creators ({matchingUsers.length})
              </span>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {matchingUsers.length > 0 ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {matchingUsers.map((u) => (
                  <div
                    key={u.id || u.username}
                    onClick={() => handleSelectUser(u)}
                    className="p-2.5 flex items-center justify-between gap-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 active:bg-neutral-100 dark:active:bg-neutral-800 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                        <img
                          src={u.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120`}
                          alt={u.name || u.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120`;
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-rose-500 transition-colors">
                            {u.name || u.username}
                          </span>
                          {u.isVerified && (
                            <BadgeCheck className="w-3 h-3 text-sky-500 fill-sky-500 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          @{u.username.replace(/^@/, '')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-semibold transition"
                    >
                      <Film className="w-3 h-3" />
                      <span>Videos</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-neutral-500 dark:text-neutral-400 text-xs">
                <p>No user found named "{searchQuery}".</p>
                {onOpenSearch && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenSearch(searchQuery.trim());
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    <Search className="w-3 h-3" />
                    Search all Bhojpuri reels for "{searchQuery}" →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
            alt={currentUser.username}
            className="w-6 h-6 rounded-full object-cover"
          />
        </div>
      </button>
    </nav>
  );
};
