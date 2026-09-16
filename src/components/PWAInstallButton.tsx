import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Chromium / Android / Desktop Install Flow
  if (isInstallable) {
    if (variant === 'sidebar') {
      return (
        <button
          id="pwa-install-sidebar-btn"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 hover:from-rose-500/20 hover:to-amber-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 group ${className}`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-xs leading-none text-neutral-900 dark:text-white mb-0.5">
              Install Jhalak App
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-none">
              Fast, offline & standalone
            </span>
          </div>
        </button>
      );
    }

    return (
      <button
        id="pwa-install-action-btn"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-rose-500" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    झ
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                      Install Jhalak on iOS
                    </h3>
                    <p className="text-[11px] text-neutral-500">Home Screen Web App</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ol className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button in your Safari bottom navigation bar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down in the share sheet and select <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> at top right. Launch Jhalak with full-screen experience!
                  </span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-2.5 text-xs font-semibold hover:opacity-90 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
