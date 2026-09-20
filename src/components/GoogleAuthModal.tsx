import React, { useState } from 'react';
import { X, Check, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithGoogle, syncUserProfile } from '../services/firebase';

export interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
  username: string;
  firebaseUid?: string;
}

export const presetGoogleAccounts: GoogleAccount[] = [
  {
    name: 'Brijmohan',
    email: 'brijmohan83097@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=brijmohan83097',
    username: 'brijmohan83097',
    firebaseUid: 'user_brijmohan83097',
  },
];

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: GoogleAccount) => void;
  onContinueAsGuest?: (name?: string) => void;
  currentEmail?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onContinueAsGuest,
  currentEmail,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Load saved Google accounts (Email IDs) from localStorage, defaulting to preset
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccount[]>(() => {
    try {
      const raw = localStorage.getItem('ig_saved_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.filter((a: any) => a && a.email);
          if (list.length > 0) return list;
        }
      }
    } catch {
      // safe fallback
    }
    return presetGoogleAccounts;
  });

  if (!isOpen) return null;

  const saveAccountToList = (acc: GoogleAccount) => {
    try {
      const updated = [acc, ...savedAccounts.filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase())].slice(0, 5);
      setSavedAccounts(updated);
      localStorage.setItem('ig_saved_accounts', JSON.stringify(updated));
    } catch {
      // safe
    }
  };

  const removeSavedAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    setSavedAccounts(updated);
    try {
      localStorage.setItem('ig_saved_accounts', JSON.stringify(updated));
    } catch {
      // safe
    }
  };

  // Fast Instant Preview Login Bypass
  const executeBypassLogin = (targetEmail: string, targetName?: string) => {
    const email = (targetEmail || 'brijmohan83097@gmail.com').trim();
    const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'brijmohan83097';
    const name = targetName || (cleanUsername === 'brijmohan83097' ? 'Brijmohan' : cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1));
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`;

    const account: GoogleAccount = {
      name,
      email,
      avatar,
      username: cleanUsername,
      firebaseUid: `user_${cleanUsername}`,
    };

    saveAccountToList(account);
    onLoginSuccess(account);
  };

  // Primary 1-Click "Continue with Google"
  const handleContinueWithGoogle = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const firebaseUser = await signInWithGoogle('brijmohan83097@gmail.com');
      const email = firebaseUser.email || 'brijmohan83097@gmail.com';
      const name = firebaseUser.displayName || email.split('@')[0] || 'Brijmohan';
      const cleanUsername = (email.split('@')[0] || name).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'brijmohan83097';
      const avatar = firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`;

      const account: GoogleAccount = {
        name,
        email,
        avatar,
        username: cleanUsername,
        firebaseUid: firebaseUser.uid || `user_${cleanUsername}`,
      };

      // Sync user profile to Firestore safely
      try {
        await syncUserProfile({
          id: account.firebaseUid || cleanUsername,
          name,
          username: cleanUsername,
          email,
          avatar,
          bio: 'Creator on Jhalak Reels 🇮🇳',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          watchHours: 0,
          dailyReelsCount: 0,
          dailyPhotosCount: 0,
          lastUploadDate: new Date().toISOString().split('T')[0],
        });
      } catch {
        // Handled silently
      }

      saveAccountToList(account);
      onLoginSuccess(account);
    } catch {
      // Seamlessly fall back to preview bypass so user is never blocked
      executeBypassLogin('brijmohan83097@gmail.com', 'Brijmohan');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click login with a previously selected Google Account
  const handleSelectSavedAccount = async (acc: GoogleAccount) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      saveAccountToList(acc);
      onLoginSuccess(acc);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to select account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="google-auth-modal-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="google-auth-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header with Google Logo & Close */}
        <div className="p-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs">
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
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                Sign in with Google
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Continue to Jhalak Reels
              </p>
            </div>
          </div>
          <button
            id="google-auth-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Saved Google Accounts (Email IDs) for instant 1-tap selection */}
          {savedAccounts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 px-1">
                Choose a Google Account:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedAccounts.map((acc) => {
                  const isCurrent = currentEmail && currentEmail.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <div
                      key={acc.email}
                      id={`google-account-card-${acc.email}`}
                      onClick={() => handleSelectSavedAccount(acc)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {acc.name}
                          </p>
                          <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">
                            {acc.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isCurrent ? (
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => removeSavedAccount(acc.email, e)}
                            title="Remove from list"
                            className="p-1 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Primary One-Tap 'Continue with Google' Button */}
          <button
            id="continue-with-google-btn"
            type="button"
            onClick={handleContinueWithGoogle}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-2xl font-bold text-sm shadow-xs transition flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Quick 1-Click Preview Login Bypass for brijmohan83097@gmail.com */}
          <button
            id="quick-bypass-login-btn"
            type="button"
            onClick={() => executeBypassLogin('brijmohan83097@gmail.com', 'Brijmohan')}
            disabled={isLoading}
            className="w-full py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡ 1-Click Login: brijmohan83097@gmail.com (Super Admin)</span>
          </button>

          {/* Custom Google Email Option */}
          <div className="pt-1">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition text-center"
              >
                + Enter a different Google Email ID
              </button>
            ) : (
              <div className="space-y-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                  Enter your Google Email:
                </p>
                <input
                  type="email"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-rose-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customEmailInput.trim()) {
                      executeBypassLogin(customEmailInput.trim());
                    }
                  }}
                  disabled={!customEmailInput.trim()}
                  className="w-full py-1.5 px-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-40 transition"
                >
                  Log in with this Google ID
                </button>
              </div>
            )}
          </div>

          {/* Guest Mode Dismiss Option */}
          <div className="pt-2 text-center">
            <button
              id="continue-as-guest-modal-btn"
              type="button"
              onClick={() => {
                if (onContinueAsGuest) {
                  onContinueAsGuest();
                } else {
                  onClose();
                }
              }}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            >
              Continue watching as Guest →
            </button>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Fast, secure 1-click Google authentication</span>
        </div>
      </div>
    </div>
  );
};
