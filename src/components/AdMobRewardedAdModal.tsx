import React, { useState, useEffect, useRef } from 'react';
import {
  Gift,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ADMOB_CONFIG, adMobService, AdMobRewardedAdData } from '../services/adMobService';

interface AdMobRewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned: (rewardText: string, amount: number) => void;
  rewardLabel?: string;
  rewardAmount?: number;
}

export const AdMobRewardedAdModal: React.FC<AdMobRewardedAdModalProps> = ({
  isOpen,
  onClose,
  onRewardEarned,
  rewardLabel = '₹10 Instant Creator Bonus',
  rewardAmount = 10,
}) => {
  const [ad] = useState<AdMobRewardedAdData>(() => adMobService.getRewardedAd());
  const [countdown, setCountdown] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setIsCompleted(false);
      setRewardClaimed(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (rewardClaimed) return;
    setRewardClaimed(true);
    onRewardEarned(rewardLabel, rewardAmount);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleCtaClick = () => {
    window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewarded-ad-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={() => {
        if (isCompleted) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Ad Indicator, Unit ID, Countdown & Audio */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-white/10 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
              Ad
            </span>
            <span className="text-xs font-bold text-neutral-200">
              Rewarded Video
            </span>
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="text-neutral-400 hover:text-white p-0.5 transition cursor-pointer"
              title="AdMob Ad Unit Info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsMuted(!isMuted);
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                }
              }}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 transition"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Countdown / Reward Badge */}
            {!isCompleted ? (
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 border border-amber-400/30">
                Reward in {countdown}s
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-white transition"
              aria-label="Close Ad"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video / Creative Area */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={ad.videoUrl}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />

          {/* Unit ID Badge floating subtly */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-neutral-300 pointer-events-none">
            Unit: {ADMOB_CONFIG.REWARDED.slice(0, 18)}...
          </div>

          {/* Progress Bar along video bottom */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Advertiser Details & Description */}
        <div className="p-4 space-y-3 bg-neutral-900">
          <div className="flex items-center gap-3">
            <img
              src={ad.advertiserIcon}
              alt={ad.advertiser}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h3 id="rewarded-ad-title" className="text-sm font-bold text-white truncate">
                {ad.title}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate">
                {ad.advertiser} • Verified Sponsor
              </p>
            </div>
            <button
              type="button"
              onClick={handleCtaClick}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            {ad.headline}
          </p>

          {/* Reward Status Card */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Reward Unlocked Upon Completion
                </span>
                <span className="text-xs font-bold text-white">
                  {rewardLabel}
                </span>
              </div>
            </div>

            {isCompleted ? (
              <button
                type="button"
                id="claim-ad-reward-btn"
                onClick={handleClaim}
                disabled={rewardClaimed}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-extrabold text-xs shadow-lg transition active:scale-95 flex items-center gap-1 cursor-pointer animate-bounce"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{rewardClaimed ? 'Claimed!' : 'Claim Now'}</span>
              </button>
            ) : (
              <div className="text-[11px] font-semibold text-neutral-400">
                Wait {countdown}s
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AdChoices & Ad Unit ID Transparency Modal */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                  Ad
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Google AdMob Rewarded Ad
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    Official Rewarded Video Format
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-300">
              <div className="p-2.5 rounded-lg bg-neutral-800/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                  Ad Unit ID (Rewarded)
                </span>
                <code className="text-[11px] font-mono text-amber-400 break-all select-all">
                  {ADMOB_CONFIG.REWARDED}
                </code>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-800/80">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                  User Choice & Transparency
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  • Rewarded ads are 100% opt-in: users choose to watch in exchange for in-app creator perks or instant balance settlement.<br />
                  • Complies with Google AdMob &amp; Google Play Store developer policies.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
