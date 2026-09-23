import React, { useState } from 'react';
import { X, Shield, Loader2 } from 'lucide-react';
import { signInWithGoogle, syncUserProfile } from '../services/firebase';

export interface GoogleAccount {
  name: string;
  email: string;
  avatar: string;
  username: string;
  firebaseUid?: string;
}

export const presetGoogleAccounts: GoogleAccount[] = [];

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: GoogleAccount) => void;
  onContinueAsGuest?: (name?: string) => void;
  currentEmail?: string;
  onOpenLegalPolicy?: (tab: 'privacy' | 'terms' | 'ugc' | 'data-safety') => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onContinueAsGuest,
  onOpenLegalPolicy,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Single Standard Google Sign-In with Native Popup
  const handleContinueWithGoogle = async () => {
    setIsLoading(true);

    try {
      const firebaseUser = await signInWithGoogle();
      const email = (firebaseUser.email || '').trim();
      const realDisplayName = (firebaseUser.displayName || '').trim();
      const rawName = realDisplayName || (email ? email.split('@')[0] : 'User');
      const cleanUsername = realDisplayName || (email ? email.split('@')[0] : 'User');
      const avatar =
        firebaseUser.photoURL ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

      const account: GoogleAccount = {
        name: rawName,
        email,
        avatar,
        username: cleanUsername,
        firebaseUid: firebaseUser.uid,
      };

      // Sync user profile to Firestore
      try {
        await syncUserProfile({
          id: firebaseUser.uid,
          name: rawName,
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
        // Safe Firestore background sync
      }

      // Save to saved accounts in localStorage
      try {
        const raw = localStorage.getItem('ig_saved_accounts');
        const list = raw ? JSON.parse(raw) : [];
        const updated = [
          account,
          ...(Array.isArray(list) ? list.filter((a: any) => a?.email?.toLowerCase() !== email.toLowerCase()) : []),
        ].slice(0, 5);
        localStorage.setItem('ig_saved_accounts', JSON.stringify(updated));
      } catch {
        // safe
      }

      onLoginSuccess(account);
      onClose();
    } catch {
      // Hide error banner completely so signInWithPopup opens smoothly without blocking
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
                Official Google Account Chooser
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
          {/* Single Clean "Sign in with Google" Button */}
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
                <span>Opening Google Accounts...</span>
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
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Account Selector Note */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1 text-center">
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              Official Account Chooser:
            </p>
            <p>
              Opens the official Google sign-in window to select your Google account.
            </p>
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

          {/* Legal Consent Notice */}
          <div className="pt-2 text-center text-[10px] text-neutral-400 leading-tight">
            <span>By signing in, you agree to our </span>
            <button
              type="button"
              id="auth-modal-terms-link"
              onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('terms')}
              className="text-amber-500 hover:underline font-medium cursor-pointer"
            >
              Terms
            </button>
            <span> & </span>
            <button
              type="button"
              id="auth-modal-privacy-link"
              onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('privacy')}
              className="text-amber-500 hover:underline font-medium cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 text-center flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Standard Firebase Google Authentication</span>
        </div>
      </div>
    </div>
  );
};
