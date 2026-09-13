import React from 'react';
import { Clapperboard, Compass, Heart, ArrowRight } from 'lucide-react';
import { GoogleAccount } from './GoogleAuthModal';
import { JhalakLogo } from './JhalakLogo';

interface GoogleWelcomeScreenProps {
  onContinueWithGoogle: () => void;
  onExploreAsGuest: () => void;
  onQuickLogin: (account: GoogleAccount) => void;
}

export const GoogleWelcomeScreen: React.FC<GoogleWelcomeScreenProps> = ({
  onContinueWithGoogle,
  onExploreAsGuest,
  onQuickLogin,
}) => {
  const primaryAccount: GoogleAccount = {
    name: 'Brij Mohan',
    email: 'brijmohan83097@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    username: 'brijmohan',
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
          <JhalakLogo size={36} showGlow={false} animate={true} />
          <div className="flex items-center gap-2">
            <span className="font-serif text-3xl font-bold bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              Jhalak
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
              झलक • India
            </span>
          </div>
        </div>
        <button
          onClick={onExploreAsGuest}
          className="text-xs font-semibold text-neutral-400 hover:text-white px-3.5 py-1.5 rounded-full border border-neutral-800 hover:border-neutral-700 transition"
        >
          Explore as Guest
        </button>
      </header>

      {/* Main Center Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
          {/* Custom Sleek Indian Social App Logo Badge */}
          <div className="mb-5 flex flex-col items-center">
            <JhalakLogo size={72} showGlow={true} animate={true} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome to Jhalak
          </h1>
          <p className="text-sm text-neutral-400 mb-6 max-w-xs leading-relaxed">
            Discover vibrant stories, trending Bollywood & Indie reels, and creators across India.
          </p>

          {/* Feature Highlights Pills */}
          <div className="grid grid-cols-3 gap-2 w-full mb-6">
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Clapperboard className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Indian Reels</span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Compass className="w-4 h-4 text-rose-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">City Stories</span>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-800">
              <Heart className="w-4 h-4 text-fuchsia-400 mb-1" />
              <span className="text-[11px] font-medium text-neutral-300">Desi Creators</span>
            </div>
          </div>

          {/* Quick One-Click Google Login Card for Brij Mohan */}
          <div className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-3.5 mb-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Recommended Google Account
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                1-Tap Ready
              </span>
            </div>
            <button
              id="google-quick-login-btn"
              onClick={() => onQuickLogin(primaryAccount)}
              className="w-full flex items-center gap-3 p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-700/80 hover:border-sky-500/60 transition group"
            >
              <img
                src={primaryAccount.avatar}
                alt={primaryAccount.name}
                className="w-10 h-10 rounded-full object-cover border border-neutral-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {primaryAccount.name}
                </p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {primaryAccount.email}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>
          </div>

          {/* Official Google Continue Button */}
          <button
            id="google-signin-main-btn"
            onClick={onContinueWithGoogle}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg transition active:scale-[0.99]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          </button>

          {/* Guest Link */}
          <div className="mt-4">
            <button
              id="welcome-guest-btn"
              onClick={onExploreAsGuest}
              className="text-xs text-neutral-400 hover:text-white transition"
            >
              Skip and browse as Guest
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-neutral-500 text-xs relative z-10">
        <p>Jhalak (झलक) • Crafted for India with ❤️</p>
      </footer>
    </div>
  );
};
