import React, { useState } from 'react';
import { User } from '../types';
import { SupportedLanguage, translations } from '../translations';

export interface SuggestedCreator {
  id: string;
  username: string;
  name?: string;
  avatar: string;
  subtitle?: string;
}

interface RightSuggestionsSidebarProps {
  currentUser: User;
  onViewUser: (username: string) => void;
  creators?: SuggestedCreator[];
  currentLanguage?: SupportedLanguage;
  onOpenLegalPolicies?: (tab?: 'privacy' | 'terms' | 'ugc' | 'data-safety') => void;
  onDeleteAccount?: () => void;
}

export const RightSuggestionsSidebar: React.FC<RightSuggestionsSidebarProps> = ({
  currentUser,
  onViewUser,
  creators = [],
  currentLanguage = 'en',
  onOpenLegalPolicies,
  onDeleteAccount,
}) => {
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const t = translations[currentLanguage];

  const toggleFollow = (id: string) => {
    setFollowingMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <aside
      id="right-suggestions-sidebar"
      className="hidden lg:block w-80 pl-8 py-4 text-neutral-900 dark:text-white select-none"
    >
      {/* Current User Card */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewUser(currentUser.username)}
            className="w-12 h-12 rounded-full overflow-hidden hover:opacity-90 transition"
          >
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
              alt={currentUser.username}
              className="w-full h-full object-cover"
            />
          </button>
          <div className="flex flex-col text-left">
            <button
              onClick={() => onViewUser(currentUser.username)}
              className="font-semibold text-sm hover:underline truncate max-w-[130px]"
            >
              {currentUser.username}
            </button>
            <span className="text-xs text-neutral-500 truncate max-w-[130px]">
              {currentUser.name}
            </span>
          </div>
        </div>

        <button
          onClick={() => onViewUser(currentUser.username)}
          className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition"
        >
          {t.view || 'View'}
        </button>
      </div>

      {/* Suggestions Section Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {t.suggestedForYou || 'Suggested for you'}
        </span>
        <button className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-neutral-500 transition">
          {t.seeAll || 'See all'}
        </button>
      </div>

      {/* Suggested Users List (Only real creators from Firebase or clean empty state) */}
      {creators.length === 0 ? (
        <div className="py-4 mb-8 text-left">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            No suggestions yet. As people join Jhalak and share content, suggestions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {creators.map((u) => {
            const isFollowing = followingMap[u.id];

            return (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'}
                    alt={u.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-white truncate max-w-[120px]">
                      {u.username}
                    </span>
                    <span className="text-[11px] text-neutral-400 truncate max-w-[120px]">
                      {u.subtitle || 'Creator on Jhalak'}
                    </span>
                  </div>
                </div>

                <button
                  id={`follow-btn-${u.username}`}
                  onClick={() => toggleFollow(u.id)}
                  className={`text-xs font-semibold transition ${
                    isFollowing
                      ? 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                      : 'text-sky-500 hover:text-sky-600'
                  }`}
                >
                  {isFollowing
                    ? (t.followingBtn || t.following || 'Following')
                    : (t.follow || 'Follow')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini Footer */}
      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 leading-relaxed">
          <span>About</span>
          <span>•</span>
          <span>Help</span>
          <span>•</span>
          <button
            type="button"
            id="sidebar-privacy-link"
            onClick={() => onOpenLegalPolicies && onOpenLegalPolicies('privacy')}
            className="hover:text-neutral-700 dark:hover:text-neutral-200 transition underline cursor-pointer"
          >
            Privacy
          </button>
          <span>•</span>
          <button
            type="button"
            id="sidebar-terms-link"
            onClick={() => onOpenLegalPolicies && onOpenLegalPolicies('terms')}
            className="hover:text-neutral-700 dark:hover:text-neutral-200 transition underline cursor-pointer"
          >
            Terms
          </button>
          <span>•</span>
          <button
            type="button"
            id="sidebar-data-safety-link"
            onClick={() => onOpenLegalPolicies && onOpenLegalPolicies('data-safety')}
            className="hover:text-neutral-700 dark:hover:text-neutral-200 transition underline cursor-pointer"
          >
            Data Safety
          </button>
          {onDeleteAccount && (
            <>
              <span>•</span>
              <button
                type="button"
                id="sidebar-delete-account-link"
                onClick={onDeleteAccount}
                className="text-rose-500 hover:text-rose-600 transition underline cursor-pointer font-medium"
              >
                Delete Account
              </button>
            </>
          )}
        </div>
        <p className="uppercase tracking-wider text-[10px] text-neutral-400">
          © 2026 JHALAK INDIA • GOOGLE PLAY COMPLIANT
        </p>
      </div>
    </aside>
  );
};
