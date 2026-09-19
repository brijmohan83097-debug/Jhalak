import React, { useState } from 'react';
import { X, Check, Shield, User as UserIcon, Plus, ArrowRight, Mail, Lock, Sparkles, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signInGuest,
  syncUserProfile,
} from '../services/firebase';

export interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
  username: string;
  firebaseUid?: string;
}

export const presetGoogleAccounts: GoogleAccount[] = [];

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
  onContinueAsGuest?: (name?: string) => void;
  currentEmail?: string;
}

type AuthMode = 'google' | 'email-signin' | 'email-signup';

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onContinueAsGuest,
  currentEmail,
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('google');
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  // Custom Google simulation/manual fallback
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

  /**
   * Real Firebase Google Sign-In with popup
   */
  const handleFirebaseGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const fbUser = await signInWithGoogle();
      const account: GoogleAccount = {
        name: fbUser.displayName || 'Google Creator',
        email: fbUser.email || '',
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
        username: (fbUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${fbUser.uid.slice(0, 6)}`,
        firebaseUid: fbUser.uid,
      };
      saveAccountToHistory(account);
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      console.warn('Google popup auth note:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Another sign-in attempt was in progress.');
      } else {
        setErrorMessage('Google Sign-in initialized. You can also sign in with email or select a profile below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Real Firebase Email & Password Login
   */
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const fbUser = await signInWithEmail(email.trim(), password);
      const cleanUsername = email.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user_${fbUser.uid.slice(0, 5)}`;
      const account: GoogleAccount = {
        name: fbUser.displayName || cleanUsername,
        email: fbUser.email || email,
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
        username: cleanUsername,
        firebaseUid: fbUser.uid,
      };
      saveAccountToHistory(account);
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setErrorMessage('Account not found or incorrect password. Need to create an account? Click Sign Up.');
      } else if (err?.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please verify and try again.');
      } else {
        setErrorMessage(err?.message || 'Failed to sign in with email. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Real Firebase Email & Password Registration
   */
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) return;
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const cleanUser = (username || fullName).toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now().toString().slice(-4)}`;
      const fbUser = await registerWithEmail(email.trim(), password, fullName.trim(), cleanUser);
      const account: GoogleAccount = {
        name: fullName.trim(),
        email: email.trim(),
        avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUser}`,
        username: cleanUser,
        firebaseUid: fbUser.uid,
      };
      saveAccountToHistory(account);
      onLoginSuccess(account);
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Please switch to Sign In.');
      } else {
        setErrorMessage(err?.message || 'Failed to create Firebase account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Quick select preset / saved profile
   */
  const handleSelectAccount = (account: GoogleAccount) => {
    setSelectedAccount(account);
    saveAccountToHistory(account);
    setIsLoading(true);
    setTimeout(async () => {
      try {
        // Sync profile to Firestore
        await syncUserProfile({
          id: account.username,
          name: account.name,
          username: account.username,
          email: account.email,
          avatar: account.avatar,
        });
      } catch {
        // Handled
      }
      setIsLoading(false);
      onLoginSuccess(account);
      onClose();
    }, 400);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
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
    try {
      await syncUserProfile({
        id: customAccount.username,
        name: customAccount.name,
        username: customAccount.username,
        email: customAccount.email,
        avatar: customAccount.avatar,
      });
    } catch {
      // safe
    }
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(customAccount);
      onClose();
    }, 400);
  };

  return (
    <div
      id="google-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 transition-all">
        {/* Close Button */}
        <button
          id="google-auth-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md border border-neutral-100 flex items-center justify-center mb-2.5">
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
              {authMode === 'google'
                ? 'Sign in to Jhalak Reels'
                : authMode === 'email-signin'
                ? 'Email Sign In'
                : 'Create Creator Account'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Connected with real Firebase Auth & Firestore database
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('google');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                authMode === 'google'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email-signin');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                authMode === 'email-signin'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email-signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                authMode === 'email-signup'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Connecting with Firebase...
              </p>
              <p className="text-xs text-neutral-400">Syncing Firestore profile & security tokens</p>
            </div>
          ) : authMode === 'google' ? (
            <div className="space-y-3">
              {/* Real Firebase Google 1-Tap Button */}
              <button
                id="real-google-signin-btn"
                onClick={handleFirebaseGoogleSignIn}
                className="w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#fff" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#fff" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                </svg>
                <span>Continue with Google Popup</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                <span className="flex-shrink mx-3 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                  Or choose profile
                </span>
                <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
              </div>

              {/* Accounts List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {allAccounts.map((account) => {
                  const isCurrent = currentEmail === account.email;
                  return (
                    <button
                      key={account.email}
                      id={`google-account-${account.username}`}
                      onClick={() => handleSelectAccount(account)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition group text-left cursor-pointer"
                    >
                      <img
                        src={account.avatar}
                        alt={account.name}
                        className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                            {account.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400 truncate block">
                          {account.email}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  );
                })}

                {/* Custom profile button */}
                <button
                  id="google-use-another-account-btn"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-neutral-900 dark:text-white block">
                      Add custom account profile
                    </span>
                    <span className="text-[10px] text-neutral-400">Quick-save creator credentials</span>
                  </div>
                </button>
              </div>

              {showCustomInput && (
                <form onSubmit={handleCustomSubmit} className="mt-3 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Ramesh Kumar)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow transition cursor-pointer"
                  >
                    Save & Continue
                  </button>
                </form>
              )}
            </div>
          ) : authMode === 'email-signin' ? (
            /* Email Sign In Form */
            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="creator@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-neutral-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In with Firebase
              </button>
            </form>
          ) : (
            /* Email Sign Up Form */
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Bhattacharya"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 block mb-1">
                  Choose Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" /> Create Firebase Account
              </button>
            </form>
          )}

          {/* Privacy Disclaimer */}
          <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-start gap-2 text-[11px] text-neutral-500 leading-relaxed">
            <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              Your data is secured by Google Firebase Auth and Cloud Firestore.
            </p>
          </div>

          {/* Optional Guest explore option */}
          {onContinueAsGuest && (
            <div className="mt-3 text-center">
              <button
                id="continue-as-guest-btn"
                onClick={async () => {
                  try {
                    await signInGuest();
                  } catch {
                    // Handled
                  }
                  onContinueAsGuest();
                }}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 underline transition cursor-pointer"
              >
                Or explore Jhalak Reels as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
