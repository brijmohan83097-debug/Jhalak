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
      <div className="flex flex-col items-center justify-center px-6 text-center max-w-sm -mt-6">
        {/* Jhalak Logo with pulsing ambient aura */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-amber-500/30 via-rose-500/30 to-purple-600/30 blur-xl animate-pulse" />
          <div className="transform transition-transform duration-700 hover:scale-105">
            <JhalakLogo size={104} showGlow={true} animate={false} />
          </div>
        </div>

        {/* Brand Title with Radiant Gradient */}
        <div className="space-y-1 mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-['Outfit',sans-serif] bg-gradient-to-r from-amber-300 via-rose-400 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-sm">
            Jhalak
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-neutral-400 font-medium">
            <span className="text-amber-400 font-semibold">झलक</span>
            <span className="w-1 h-1 rounded-full bg-neutral-500" />
            <span className="text-neutral-300">Visual Moments & Stories</span>
          </div>
        </div>

        {/* Animated Loading Spinner & Pulse Bar */}
        <div className="flex flex-col items-center gap-3 mt-4">
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
                  <stop offset="0%" stopColor="#FF5E3A" stopOpacity="1" />
                  <stop offset="50%" stopColor="#FF2A6D" stopOpacity="1" />
                  <stop offset="100%" stopColor="#9C27B0" stopOpacity="0.1" />
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
            <span className="absolute w-2 h-2 rounded-full bg-rose-400 animate-ping opacity-75" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-rose-500" />
          </div>

          {/* Smooth Launch Progress Line */}
          <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden mt-2 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 rounded-full transition-all duration-75 ease-out shadow-sm shadow-rose-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-neutral-400 tracking-wide font-normal animate-pulse">
            Launching visual experience...
          </p>
        </div>
      </div>

      {/* Bottom Cultural / Brand Footer */}
      <div className="pb-8 flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Made for Visual Storytellers</span>
        </div>
        <div className="text-[10px] text-neutral-400">
          Reels • Stories • Live • UPI Shagun
        </div>
      </div>
    </div>
  );
};
