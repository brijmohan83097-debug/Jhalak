import React, { useState, useMemo } from 'react';
import { Clapperboard, Compass, Heart, ArrowRight, User as UserIcon } from 'lucide-react';
import { GoogleAccount } from './GoogleAuthModal';
import { JhalakLogo } from './JhalakLogo';

interface GoogleWelcomeScreenProps {
  onContinueWithGoogle: () => void;
  onExploreAsGuest: (customName?: string) => void;
  onQuickLogin: (account: GoogleAccount) => void;
}

export const GoogleWelcomeScreen: React.FC<GoogleWelcomeScreenProps> = ({
  onContinueWithGoogle,
  onExploreAsGuest,
  onQuickLogin,
}) => {
  const [userNameInput, setUserNameInput] = useState('');

  // Check if a saved account from previous logins exists
  const returningAccount = useMemo<GoogleAccount | null>(() => {
    try {
      const raw = localStorage.getItem('ig_saved_accounts');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0 && list[0]?.name) {
          return list[0];
        }
      }
    } catch {
      // safe fallback
    }
    return null;
  }, []);

  const handleStartWithName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userNameInput.trim();
    if (!cleanName) {
      onExploreAsGuest();
      return;
    }

    const cleanUsername =
      cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const guestAccount: GoogleAccount = {
      name: cleanName,
      username: cleanUsername,
      email: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`,
    };
    onQuickLogin(guestAccount);
  };

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
          onClick={() => onExploreAsGuest(userNameInput.trim() || undefined)}
          className="text-xs font-semibold text-neutral-400 hover:text-white px-3.5 py-1.5 rounded-full border border-neutral-800 hover:border-neutral-700 transition cursor-pointer"
        >
          Explore as Guest
        </button>
      </header>

      {/* Main Center Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          {/* Square Tiranga 'J' Badge Logo Asset */}
          <div className="mb-4 flex flex-col items-center">
            <JhalakLogo size={76} showGlow={true} animate={true} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            <span className="text-amber-400">Jhalak Reels:</span> Made in India
          </h1>
          <p className="text-sm text-neutral-400 mb-5 max-w-xs leading-relaxed">
            Discover vibrant Indian reels, creators, and Bhojpuri culture.
          </p>

          {/* Feature Highlights Pills */}
          <div className="grid grid-cols-3 gap-2 w-full mb-5">
            <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Clapperboard className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Indian Reels</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Compass className="w-4 h-4 text-rose-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Explore</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Heart className="w-4 h-4 text-fuchsia-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Creators</span>
            </div>
          </div>

          {/* Enter Your Own Name / Custom Guest Profile (Always Available) */}
          <form onSubmit={handleStartWithName} className="w-full mb-4 text-left">
            <label htmlFor="user-name-input" className="block text-xs font-semibold text-neutral-200 mb-1.5">
              Enter your name or creator handle:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="user-name-input"
                  type="text"
                  placeholder="e.g. Rahul Verma or @creator"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                id="start-with-name-btn"
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl transition shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Start creating & watching instantly with your custom profile.
            </p>
          </form>

          {/* Returning Account Quick-Login (if exists) */}
          {returningAccount && (
            <div className="w-full bg-neutral-800/50 border border-neutral-700/60 rounded-2xl p-3 mb-4 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  Or continue as saved account
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  1-Tap
                </span>
              </div>
              <button
                id="google-quick-login-btn"
                onClick={() => onQuickLogin(returningAccount)}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-700/80 hover:border-amber-500/60 transition group cursor-pointer"
              >
                <img
                  src={returningAccount.avatar}
                  alt={returningAccount.name}
                  className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {returningAccount.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {returningAccount.email || `@${returningAccount.username}`}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </button>
            </div>
          )}

          <div className="w-full flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
              OR
            </span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          {/* Official Google Continue Button */}
          <button
            id="google-signin-main-btn"
            onClick={onContinueWithGoogle}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg transition active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          </button>

          {/* Guest Link */}
          <div className="mt-3">
            <button
              id="welcome-guest-btn"
              onClick={() => onExploreAsGuest(userNameInput.trim() || undefined)}
              className="text-xs text-neutral-400 hover:text-white transition cursor-pointer"
            >
              Skip and browse as Guest
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-neutral-500 text-xs relative z-10">
        <p>Jhalak Reels: Made in India • Crafted with ❤️</p>
      </footer>
    </div>
  );
};
