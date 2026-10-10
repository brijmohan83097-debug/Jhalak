import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinished?: () => void;
  duration?: number; // default 2000ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinished,
  duration = 2000,
}) => {
  const [phase, setPhase] = useState<'entering' | 'active' | 'exiting' | 'hidden'>('entering');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Enter immediately
    const enterTimer = setTimeout(() => {
      setPhase('active');
    }, 50);

    // 2. Smooth progress bar animation over duration
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
    }, 30);

    // 3. Begin exit transition at duration
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
      // 4. Fully unmount after exit transition completes (500ms transition)
      const hideTimer = setTimeout(() => {
        setPhase('hidden');
        if (onFinished) {
          onFinished();
        }
      }, 550);
      return () => clearTimeout(hideTimer);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearInterval(interval);
    };
  }, [duration, onFinished]);

  if (phase === 'hidden') {
    return null;
  }

  const isExiting = phase === 'exiting';

  return (
    <div
      id="jhalak-splash-screen"
      aria-label="Jhalak Loading Screen"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between overflow-hidden select-none transition-all duration-500 ease-out ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse 90% 85% at 50% 38%, #0C2B6D 0%, #06173D 52%, #02091C 100%)',
      }}
    >
      {/* Ambient royal blue and tiranga background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-600/35 via-indigo-600/25 to-sky-500/25 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 via-emerald-500/15 to-transparent blur-3xl pointer-events-none" />

      {/* Top spacer with Skip button */}
      <div className="w-full pt-12 flex justify-end px-6">
        <button
          id="splash-skip-btn"
          onClick={() => {
            setPhase('exiting');
            setTimeout(() => {
              setPhase('hidden');
              onFinished?.();
            }, 300);
          }}
          className="text-xs text-neutral-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Center Brand Identity Container with the new blue 'Jhalak Reels' artwork */}
      <div className="flex flex-col items-center justify-center px-6 text-center max-w-sm -mt-2">
        {/* Uploaded Central Blue Jhalak Reels Artwork Badge */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-amber-500/40 via-blue-500/30 to-emerald-500/40 blur-2xl animate-pulse" />
          <div className="relative transform transition-transform duration-700 hover:scale-105 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Jhalak Reels: Made in India"
              className="w-44 h-44 sm:w-48 sm:h-48 object-contain drop-shadow-2xl rounded-3xl"
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = '/assets/jhalak-tiranga-logo.png';
              }}
            />
          </div>
        </div>

        {/* Animated Loading Spinner & Progress Bar */}
        <div className="flex flex-col items-center gap-3 mt-3">
          {/* Custom SVG Gradient Spinner */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <svg
              className="w-9 h-9 animate-spin"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ animationDuration: '0.9s' }}
            >
              <defs>
                <linearGradient id="splash-spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF8F00" stopOpacity="1" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00C853" stopOpacity="1" />
                </linearGradient>
              </defs>
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="3.2"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="url(#splash-spinner-grad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="75 30"
              />
            </svg>
            {/* Center pulsing core dot */}
            <span className="absolute w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-amber-500" />
          </div>

          {/* Smooth Launch Progress Line */}
          <div className="w-36 h-1.5 bg-white/15 rounded-full overflow-hidden mt-1 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-white to-emerald-400 rounded-full transition-all duration-75 ease-out shadow-sm shadow-amber-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Brand Footer */}
      <div className="pb-8 flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-1.5 text-amber-400/95 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Proudly Made in India 🇮🇳</span>
        </div>
      </div>
    </div>
  );
};
