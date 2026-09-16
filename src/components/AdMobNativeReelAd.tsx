import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Send,
  Volume2,
  VolumeX,
  ExternalLink,
  Info,
  BadgeCheck,
  Star,
  Check,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { AdMobNativeAd, ADMOB_CONFIG } from '../services/adMobService';

interface AdMobNativeReelAdProps {
  ad: AdMobNativeAd;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onAdClick?: (ad: AdMobNativeAd) => void;
}

export const AdMobNativeReelAd: React.FC<AdMobNativeReelAdProps> = ({
  ad,
  isActive,
  isMuted,
  onToggleMute,
  onAdClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(ad.isLiked || false);
  const [likesCount, setLikesCount] = useState(ad.likesCount);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Play / Pause video based on active status
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.muted = isMuted;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          video.play().catch(() => setIsPlaying(false));
        });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    // Click-to-unmute if currently muted
    if (isMuted) {
      onToggleMute();
      video.muted = false;
      if (video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      showToast('🔊 Audio unmuted');
      return;
    }

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((c) => Math.max(0, c - 1));
    } else {
      setIsLiked(true);
      setLikesCount((c) => c + 1);
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 800);
    }
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdClick) {
      onAdClick(ad);
    } else {
      window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id={`native-reel-ad-${ad.id}`}
      className="relative w-full h-full bg-neutral-950 flex flex-col justify-end overflow-hidden select-none"
      onClick={handleVideoClick}
    >
      {/* Dynamic Toast */}
      {toastMessage && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-white/20 flex items-center gap-2 animate-fade-in pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Video Media Element */}
      <video
        ref={videoRef}
        src={ad.mediaUrl}
        poster={ad.posterUrl}
        autoPlay
        loop
        playsInline
        webkit-playsinline="true"
        muted={isMuted}
        onEnded={(e) => {
          const vid = e.currentTarget;
          vid.currentTime = 0;
          vid.play().catch(() => {});
        }}
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.includes('trailer.mp4')) {
            target.src = 'https://media.w3.org/2010/05/sintel/trailer.mp4';
            target.play().catch(() => {});
          }
        }}
        className="w-full h-full object-cover"
      />

      {/* Vignette Gradients */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-20" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-20" />

      {/* Heart Burst on like */}
      {showHeartBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-500">
          <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl opacity-90 scale-125" />
        </div>
      )}

      {/* Top Header: Sponsored Pill & AdChoices */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30 text-white">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-tight">
            Ad
          </span>
          <span className="text-xs font-bold text-white tracking-wide drop-shadow-md">
            Sponsored Reel
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Unmute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* AdChoices Info */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfoModal(true);
            }}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-blue-400 transition"
            title="Google AdChoices"
            aria-label="AdChoices"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="absolute bottom-6 right-3 z-30 flex flex-col items-center gap-3.5 text-white">
        {/* Like */}
        <button
          onClick={handleToggleLike}
          className="flex flex-col items-center group transition active:scale-125"
          aria-label="Like sponsored reel"
        >
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked ? 'text-rose-500 fill-rose-500' : 'text-white stroke-[2]'
              }`}
            />
          </div>
          <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">
            {likesCount.toLocaleString()}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({
                title: ad.headline,
                text: ad.body,
                url: ad.destinationUrl,
              }).catch(() => {});
            } else {
              showToast('Ad link copied to clipboard.');
            }
          }}
          className="flex flex-col items-center group transition active:scale-110"
          aria-label="Share sponsored reel"
        >
          <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md group-hover:bg-black/60 transition">
            <Send className="w-6 h-6 text-white stroke-[2]" />
          </div>
          <span className="text-[11px] font-semibold mt-0.5 drop-shadow-md">Share</span>
        </button>
      </div>

      {/* Bottom Info & Floating CTA */}
      <div className="relative z-30 p-4 pb-5 space-y-3 text-white max-w-[82%]">
        {/* Advertiser info */}
        <div className="flex items-center gap-2.5">
          <img
            src={ad.advertiserIcon}
            alt={ad.advertiser}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm drop-shadow-md">{ad.advertiser}</span>
              {ad.isVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/80">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{ad.rating}</span>
              <span>•</span>
              <span>{ad.category}</span>
            </div>
          </div>
        </div>

        {/* Headline & Body */}
        <p className="text-xs text-white/95 drop-shadow-md line-clamp-2 leading-relaxed">
          <span className="font-bold mr-1">{ad.headline}</span>
          <span>{ad.body}</span>
        </p>

        {/* High-conversion Floating CTA button */}
        <button
          id={`reel-ad-cta-${ad.id}`}
          onClick={handleCtaClick}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{ad.callToAction}</span>
          <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Audio badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/80 bg-black/40 backdrop-blur-md py-1 px-2.5 rounded-full w-fit">
          <span className="text-rose-400 font-bold">♫</span>
          <span className="truncate">{ad.audioTitle || 'Sponsored Audio'}</span>
        </div>
      </div>

      {/* AdChoices Modal */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-left"
          onClick={(e) => {
            e.stopPropagation();
            setShowInfoModal(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                  Ad
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Google AdMob Native Video
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    Reels In-Feed Video Advertisement
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                  Test Ad Unit ID (Native Video)
                </span>
                <code className="text-[11px] font-mono text-blue-600 dark:text-blue-400 break-all select-all">
                  {ADMOB_CONFIG.NATIVE_VIDEO_ANDROID}
                </code>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                  Seamless User Experience
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  • Fully scrollable: swipe or scroll anytime to advance without waiting.<br />
                  • Zero full-screen popups or interstitials.<br />
                  • Ad adheres to Google Play Store Better Ads Standards.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
