import React, { useState } from 'react';
import { X, Check, Shield, User as UserIcon, Plus, ArrowRight } from 'lucide-react';
import { User } from '../types';

export interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
  username: string;
}

export const presetGoogleAccounts: GoogleAccount[] = [
  {
    name: 'Brij Mohan',
    email: 'brijmohan83097@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    username: 'brijmohan',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma92@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    username: 'priyasharma',
  },
  {
    name: 'Aarav Patel',
    email: 'aarav.patel.creatives@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    username: 'aaravpatel',
  },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
];

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: GoogleAccount) => void;
  onContinueAsGuest?: () => void;
  currentEmail?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onContinueAsGuest,
  currentEmail,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customAvatar, setCustomAvatar] = useState(PRESET_AVATARS[0]);

  // Load custom saved accounts from localStorage
  const allAccounts = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('ig_saved_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const map = new Map<string, GoogleAccount>();
          presetGoogleAccounts.forEach((acc) => map.set(acc.email.toLowerCase(), acc));
          parsed.forEach((acc: GoogleAccount) => {
            if (acc && acc.email) {
              map.set(acc.email.toLowerCase(), acc);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch {
      // safe fallback
    }
    return presetGoogleAccounts;
  }, [showCustomInput]);

  if (!isOpen) return null;

  const saveAccountToHistory = (account: GoogleAccount) => {
    try {
      const raw = localStorage.getItem('ig_saved_accounts');
      let list: GoogleAccount[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      }
      const filtered = list.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
      filtered.unshift(account);
      localStorage.setItem('ig_saved_accounts', JSON.stringify(filtered.slice(0, 8)));
    } catch {
      // ignore
    }
  };

  const handleSelectAccount = (account: GoogleAccount) => {
    setSelectedAccount(account);
    saveAccountToHistory(account);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(account);
      onClose();
    }, 600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;

    const emailPrefix = customEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
    const customAccount: GoogleAccount = {
      name: customName.trim(),
      email: customEmail.trim(),
      username: emailPrefix,
      avatar: customAvatar || PRESET_AVATARS[0],
    };

    saveAccountToHistory(customAccount);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(customAccount);
      onClose();
    }, 600);
  };

  return (
    <div
      id="google-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 transition-all">
        {/* Close Button if dismissible */}
        {onContinueAsGuest && (
          <button
            id="google-auth-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-7">
          {/* Google Multi-color Logo and Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md border border-neutral-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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

            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Sign in with Google
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Choose an account to continue to <span className="font-semibold text-neutral-800 dark:text-neutral-200">Jhalak Reels: Made in India</span>
            </p>
          </div>

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Signing in as {selectedAccount?.name || 'User'}...
              </p>
              <p className="text-xs text-neutral-400">Verifying credentials with Google</p>
            </div>
          ) : showCustomInput ? (
            /* Custom Account Form */
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Sharma"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Google Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1.5">
                  Choose Profile Avatar
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomAvatar(av)}
                      className={`relative rounded-full p-0.5 transition ${
                        customAvatar === av
                          ? 'ring-2 ring-sky-500 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={av}
                        alt={`Avatar option ${idx + 1}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {customAvatar === av && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  Back to accounts
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-md transition"
                >
                  Continue
                </button>
              </div>
            </form>
          ) : (
            /* Accounts List */
            <div className="space-y-2.5">
              {allAccounts.map((account) => {
                const isCurrent = currentEmail === account.email;
                return (
                  <button
                    key={account.email}
                    id={`google-account-${account.username}`}
                    onClick={() => handleSelectAccount(account)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition group text-left"
                  >
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                          {account.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 truncate block">
                        {account.email}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                );
              })}

              {/* Use Another Account Button */}
              <button
                id="google-use-another-account-btn"
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition text-left"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white block">
                    Use another Google account
                  </span>
                  <span className="text-xs text-neutral-500">Sign in with different email</span>
                </div>
              </button>
            </div>
          )}

          {/* Privacy Disclaimer */}
          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-start gap-2 text-[11px] text-neutral-500 leading-relaxed">
            <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              To continue, Google will securely share your name, email address, and profile photo with Jhalak Reels: Made in India.
            </p>
          </div>

          {/* Optional Guest explore option */}
          {onContinueAsGuest && (
            <div className="mt-4 text-center">
              <button
                id="continue-as-guest-btn"
                onClick={onContinueAsGuest}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 underline transition"
              >
                Or explore Jhalak Reels: Made in India as guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
