import React, { useState, useEffect } from 'react';
import { ExternalLink, Info, X, ChevronUp } from 'lucide-react';
import { AdMobBannerData, adMobService, ADMOB_CONFIG } from '../services/adMobService';

interface AdMobBannerAdProps {
  onAdClick?: (ad: AdMobBannerData) => void;
  className?: string;
}

export const AdMobBannerAd: React.FC<AdMobBannerAdProps> = ({
  onAdClick,
  className = '',
}) => {
  const [banner, setBanner] = useState<AdMobBannerData>(() => adMobService.getBannerAd());
  const [isMinimized, setIsMinimized] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // safe fallback
    }
  }, []);

  if (isDismissed) {
    return null;
  }

  // Minimized state - subtle chip at bottom
  if (isMinimized) {
    return (
      <aside
        aria-label="Google AdMob Advertisement"
        className="fixed bottom-[56px] md:bottom-2 right-3 z-30 transition-all duration-300"
      >
        <button
          id="admob-banner-restore-btn"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-800 backdrop-blur-md cursor-pointer transition active:scale-95"
          title="Restore Google AdMob Banner"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Ad</span>
          <ChevronUp className="w-3 h-3 text-neutral-400" />
        </button>
      </aside>
    );
  }

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdClick) {
      onAdClick(banner);
    } else {
      window.open(banner.destinationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <aside
        id="admob-bottom-banner-container"
        aria-label="Google AdMob Banner Advertisement"
        className={`fixed bottom-[52px] md:bottom-2 left-0 right-0 md:left-auto md:right-6 md:max-w-[480px] z-30 px-2 sm:px-3 pointer-events-auto transition-all duration-300 select-none ${className}`}
      >
        {/* Real AdSense Ad tag */}
        <ins
          className="adsbygoogle"
          style={{ display: 'none' }}
          data-ad-client="ca-pub-7598643408736998"
          data-ad-slot="4957139129"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
        <div className="relative mx-auto w-full max-w-[460px] h-[52px] sm:h-[54px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800/90 rounded-xl shadow-lg flex items-center justify-between px-2.5 sm:px-3 gap-2 overflow-hidden">
          {/* Subtle Google Blue Top Accent Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 opacity-80" />

          {/* Left: Official Ad Badge, Icon, Title & Headline */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Advertiser Icon */}
            <div className="relative flex-shrink-0">
              <img
                src={banner.iconUrl}
                alt={banner.advertiser}
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover shadow-xs border border-neutral-200/50 dark:border-neutral-700/50"
              />
              {/* Ad badge on corner */}
              <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[8px] font-extrabold px-1 py-0.2 rounded-sm shadow-xs uppercase tracking-tighter">
                Ad
              </span>
            </div>

            {/* Advertiser Text */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {banner.title}
                </span>
                {banner.rating && (
                  <span className="hidden sm:inline text-[9px] text-amber-500 font-bold">
                    ★ {banner.rating}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-tight">
                {banner.headline}
              </p>
            </div>
          </div>

          {/* Right: CTA Button and Ad Choices Info & Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* CTA Button */}
            <button
              id="admob-banner-cta-btn"
              onClick={handleCtaClick}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] sm:text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{banner.ctaText}</span>
              <ExternalLink className="w-3 h-3 stroke-[2.5]" />
            </button>

            {/* AdChoices Info Icon */}
            <button
              id="admob-banner-info-btn"
              onClick={() => setShowInfoModal(true)}
              className="p-1 text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
              title="Google AdChoices & AdMob Test Unit Info"
              aria-label="Google AdChoices"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Minimize / Close Button */}
            <button
              id="admob-banner-minimize-btn"
              onClick={() => setIsMinimized(true)}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
              title="Minimize advertisement"
              aria-label="Minimize ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* AdChoices / Google AdMob Transparency Modal */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admob-info-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  Ad
                </div>
                <div>
                  <h3 id="admob-info-title" className="text-sm font-bold text-neutral-900 dark:text-white">
                    Google AdMob Banner Ad
                  </h3>
                  <span className="text-[10px] text-neutral-500">
                    Google AdChoices Transparency
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Ad Unit ID (Banner)
                </div>
                <code className="block text-[11px] font-mono text-blue-600 dark:text-blue-400 break-all select-all">
                  {ADMOB_CONFIG.BANNER}
                </code>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Policy & User Protection
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  ✓ Full-screen interstitial ads are <strong>disabled</strong> to ensure uninterrupted browsing.<br />
                  ✓ Standard banner fixed cleanly above bottom navigation.<br />
                  ✓ Complies with Google Play Better Ads Policy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setIsDismissed(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Hide This Ad
              </button>
              <button
                onClick={() => setShowInfoModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
