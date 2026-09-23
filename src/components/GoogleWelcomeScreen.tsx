import React, { useMemo } from 'react';
import { Clapperboard, Compass, Heart, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { GoogleAccount } from './GoogleAuthModal';
import { JhalakLogo } from './JhalakLogo';

interface GoogleWelcomeScreenProps {
  onContinueWithGoogle: () => void;
  onExploreAsGuest: () => void;
  onQuickLogin: (account: GoogleAccount) => void;
  onOpenLegalPolicy?: (tab: 'privacy' | 'terms' | 'ugc' | 'data-safety') => void;
  isLoading?: boolean;
}

export const GoogleWelcomeScreen: React.FC<GoogleWelcomeScreenProps> = ({
  onContinueWithGoogle,
  onExploreAsGuest,
  onQuickLogin,
  onOpenLegalPolicy,
  isLoading = false,
}) => {
  // Check if saved accounts from previous genuine logins exist, or provide 1-click account
  const savedAccounts = useMemo<GoogleAccount[]>(() => {
    try {
      const raw = localStorage.getItem('ig_saved_accounts');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const filtered = list.filter((a: any) => a && (a.username || a.name));
          if (filtered.length > 0) return filtered;
        }
      }
    } catch {
      // safe fallback
    }
    return [];
  }, []);

  return (
    <div
      id="google-welcome-screen"
      className="min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between relative overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-6 flex items-center justify-between relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <JhalakLogo size={38} showGlow={false} animate={true} />
          <div className="flex flex-col text-left">
            <span className="text-xl font-black tracking-tight text-white leading-tight">
              Jhalak Reels:
            </span>
            <span className="text-xs font-extrabold text-amber-400 tracking-wider uppercase leading-none">
              Made in India
            </span>
          </div>
        </div>
        <button
          onClick={onExploreAsGuest}
          className="text-xs font-semibold text-neutral-400 hover:text-white px-3.5 py-1.5 rounded-full border border-neutral-800 hover:border-neutral-700 transition cursor-pointer"
        >
          Watch Reels as Guest →
        </button>
      </header>

      {/* Main Center Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          {/* Square Tiranga 'J' Badge Logo */}
          <div className="mb-4 flex flex-col items-center">
            <JhalakLogo size={76} showGlow={true} animate={true} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            <span className="text-amber-400">Jhalak Reels:</span> Made in India
          </h1>
          <p className="text-sm text-neutral-400 mb-6 max-w-xs leading-relaxed">
            Discover vibrant Indian reels, creators, and Bhojpuri culture.
          </p>

          {/* Feature Highlights Pills */}
          <div className="grid grid-cols-3 gap-2 w-full mb-6">
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Clapperboard className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Indian Reels</span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Compass className="w-4 h-4 text-rose-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Explore</span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Heart className="w-4 h-4 text-fuchsia-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Creators</span>
            </div>
          </div>

          {/* Saved Accounts with Email IDs (if available) */}
          {savedAccounts.length > 0 && (
            <div className="w-full mb-4 text-left">
              <p className="text-xs font-semibold text-neutral-400 mb-2 px-1">
                Choose a Google Account:
              </p>
              <div className="space-y-2">
                {savedAccounts.slice(0, 3).map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => onQuickLogin(acc)}
                    className="w-full p-3 rounded-2xl bg-neutral-800/70 border border-neutral-700/80 hover:border-neutral-500 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-600"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{acc.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          @{acc.username || 'creator'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standard One-Tap 'Sign in with Google' Button */}
          <button
            id="welcome-continue-google-btn"
            onClick={onContinueWithGoogle}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 text-neutral-900 rounded-2xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-3 cursor-pointer active:scale-98 mb-3 disabled:opacity-60"
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

          {/* Fast Guest Mode Button */}
          <button
            id="welcome-guest-btn"
            onClick={onExploreAsGuest}
            className="w-full py-3 px-4 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-2xl font-semibold text-xs transition border border-neutral-700/80 cursor-pointer"
          >
            Watch Reels immediately without login →
          </button>

          {/* Legal Policy Consent Notice (Google Play Policy Compliance) */}
          <div className="mt-4 text-center text-[11px] text-neutral-400 max-w-xs leading-relaxed">
            <span>By signing in or continuing, you agree to our </span>
            <button
              type="button"
              id="welcome-terms-link"
              onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('terms')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Terms
            </button>
            <span>, </span>
            <button
              type="button"
              id="welcome-privacy-link"
              onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('privacy')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Privacy Policy
            </button>
            <span> & </span>
            <button
              type="button"
              id="welcome-ugc-link"
              onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('ugc')}
              className="text-amber-400 hover:underline font-medium cursor-pointer"
            >
              UGC Rules
            </button>
            <span>.</span>
          </div>
        </div>
      </main>

      {/* Footer Note with Direct Legal Links */}
      <footer className="py-4 px-4 text-center text-xs text-neutral-500 relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Made with ❤️ for Indian Creators • Jhalak Reels</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <button
            type="button"
            id="footer-privacy-btn"
            onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('privacy')}
            className="hover:text-white transition underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            id="footer-terms-btn"
            onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('terms')}
            className="hover:text-white transition underline cursor-pointer"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            type="button"
            id="footer-data-safety-btn"
            onClick={() => onOpenLegalPolicy && onOpenLegalPolicy('data-safety')}
            className="hover:text-white transition underline cursor-pointer"
          >
            Data Safety & Deletion
          </button>
        </div>
      </footer>
    </div>
  );
};
