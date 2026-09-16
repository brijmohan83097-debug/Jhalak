import React, { useState, useEffect } from 'react';
import { JhalakLogo } from './JhalakLogo';
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

    // 3. Begin exit transition at 2 seconds
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
        background: 'radial-gradient(ellipse 90% 80% at 50% 35%, #1f082e 0%, #0c0312 60%, #050108 100%)',
      }}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-rose-600/25 via-fuchsia-600/20 to-purple-600/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top spacer */}
      <div className="w-full pt-12 flex justify-end px-6">
        <button
          onClick={() => {
            setPhase('exiting');
            setTimeout(() => {
              setPhase('hidden');
              onFinished?.();
            }, 300);
          }}
          className="text-xs text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
        >
          Skip
        </button>
      </div>

      {/* Center Brand Identity Container */}
      <div className="flex flex-col items-center justify-center px-6 text-center max-w-sm -mt-4">
        {/* Uploaded Square Tiranga 'J' Badge Logo Asset */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-amber-500/35 via-blue-600/25 to-emerald-500/35 blur-xl animate-pulse" />
          <div className="relative transform transition-transform duration-700 hover:scale-105 flex items-center justify-center">
            <JhalakLogo size={140} showGlow={true} animate={false} />
          </div>
        </div>

        {/* Brand Title: Jhalak Reels: Made in India in bold gold/white typography */}
        <div className="mt-2 mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-lg flex flex-wrap items-center justify-center gap-x-2 text-center">
            <span className="text-amber-300 font-black drop-shadow-sm">
              Jhalak Reels:
            </span>
            <span className="text-white font-extrabold drop-shadow-sm">
              Made in India
            </span>
          </h1>
        </div>

        {/* Animated Loading Spinner & Progress Bar */}
        <div className="flex flex-col items-center gap-3 mt-1">
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
                stroke="rgba(255, 255, 255, 0.12)"
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
          <div className="w-36 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2 p-[1px]">
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
