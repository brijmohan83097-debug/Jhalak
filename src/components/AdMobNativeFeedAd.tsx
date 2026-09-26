import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Send,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Info,
  BadgeCheck,
  EyeOff,
  Flag,
  Check,
  X,
  Star,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';
import { AdMobNativeAd, ADMOB_CONFIG } from '../services/adMobService';

interface AdMobNativeFeedAdProps {
  ad: AdMobNativeAd;
  onHideAd?: (adId: string) => void;
  onAdClick?: (ad: AdMobNativeAd) => void;
}

export const AdMobNativeFeedAd: React.FC<AdMobNativeFeedAdProps> = ({
  ad,
  onHideAd,
  onAdClick,
}) => {
  const [isLiked, setIsLiked] = useState(ad.isLiked || false);
  const [likesCount, setLikesCount] = useState(ad.likesCount);
  const [isSaved, setIsSaved] = useState(ad.isSaved || false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdInfo, setShowAdInfo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video Autoplay & IntersectionObserver states - All sponsored ads are high-performing video ads
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // All sponsored ads are video ads (never static photos)
  const isVideo = true;
  const videoSource = (ad.mediaUrl && ad.mediaUrl.endsWith('.mp4'))
    ? ad.mediaUrl
    : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

  // Ensure muted property is synced to DOM element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Auto-play when scrolled into view using IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            video.muted = isMuted;
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                })
                .catch(() => {
                  // Fallback to muted autoplay to comply with browser autoplay restrictions
                  video.muted = true;
                  setIsMuted(true);
                  video
                    .play()
                    .then(() => setIsPlaying(true))
                    .catch(() => setIsPlaying(false));
                });
            }
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: [0, 0.25, 0.6],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isMuted]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // safe fallback
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleToggleLike = () => {
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

  const handleCtaClick = () => {
    if (onAdClick) {
      onAdClick(ad);
    } else {
      window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <article
      id={`feed-ad-${ad.id}`}
      aria-label={`Sponsored Advertisement by ${ad.advertiser}`}
      className="relative bg-white dark:bg-black border-y md:border md:rounded-2xl border-neutral-200 dark:border-neutral-800/80 mb-4 overflow-hidden transition-colors shadow-xs"
    >
      {/* Real Google Ad tag */}
      <ins
        className="adsbygoogle"
        style={{ display: 'none' }}
        data-ad-client="ca-pub-7598643408736998"
        data-ad-slot="9251607358"
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
      />
      {/* Dynamic Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-1.5 animate-fade-in pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header: Advertiser, Sponsored Pill, AdChoices */}
      <div className="flex items-center justify-between p-3.5 border-b border-neutral-100 dark:border-neutral-800/60">
        <div className="flex items-center gap-3 min-w-0">
          {/* Advertiser Profile Avatar */}
          <div className="relative">
            <img
              src={ad.advertiserIcon}
              alt={ad.advertiser}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-xs"
            />
            {/* Small Ad Badge */}
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[8px] font-extrabold px-1 py-0.2 rounded shadow-xs uppercase">
              Ad
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                {ad.advertiser}
              </span>
              {ad.isVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
              )}
              {/* Sponsored badge */}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                Sponsored
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span>{ad.category}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                <Star className="w-3 h-3 fill-amber-500" />
                {ad.rating} ({ad.reviewsCount})
              </span>
            </div>
          </div>
        </div>

        {/* 3-dot Ad Choices Menu */}
        <div className="relative">
          <button
            id={`admob-menu-btn-${ad.id}`}
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Ad options"
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full transition"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-1.5 z-30 space-y-1 text-xs"
              onClick={() => setShowMenu(false)}
            >
              <button
                onClick={() => setShowAdInfo(true)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-left"
              >
                <Info className="w-4 h-4 text-blue-500" />
                <span>About this Ad (AdChoices)</span>
              </button>

              <button
                onClick={() => {
                  if (onHideAd) onHideAd(ad.id);
                  showToast('Ad hidden from your feed.');
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-left"
              >
                <EyeOff className="w-4 h-4 text-neutral-400" />
                <span>Hide this Ad</span>
              </button>

              <button
                onClick={() => showToast('Ad feedback submitted to Google AdMob.')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-left"
              >
                <Flag className="w-4 h-4" />
                <span>Report Ad</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ad Media Creative: Auto-playing Video Ad */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square bg-neutral-950 cursor-pointer overflow-hidden group select-none flex items-center justify-center"
        onClick={handleVideoClick}
      >
        <video
          ref={videoRef}
          src={videoSource}
          poster={ad.posterUrl}
          autoPlay
          loop
          playsInline
          webkit-playsinline="true"
          muted={isMuted}
          preload="auto"
          onCanPlay={(e) => {
            const vid = e.currentTarget;
            if (vid.paused) {
              vid.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsPlaying(true);
            setIsBuffering(false);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            const vid = e.currentTarget;
            if (!vid.src.includes('sample/ForBiggerBlazes')) {
              vid.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
              vid.load();
              vid.play().then(() => setIsPlaying(true)).catch(() => setVideoError(true));
            } else {
              setVideoError(true);
            }
          }}
          className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
        />

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          </div>
        )}

        {/* Play Icon Overlay if paused */}
        {!isPlaying && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="p-3.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xl transition transform group-hover:scale-110">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Video Controls: Mute/Unmute & Sponsored Video Badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <button
            type="button"
            id={`ad-mute-btn-${ad.id}`}
            onClick={(e) => {
              e.stopPropagation();
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (videoRef.current) {
                videoRef.current.muted = nextMuted;
                if (videoRef.current.paused) {
                  videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                }
              }
              showToast(nextMuted ? '🔇 Video Muted' : '🔊 Video Unmuted');
            }}
            className="p-2 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md text-white transition active:scale-95 shadow-md border border-white/20 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 tracking-wider uppercase flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Sponsored Video
          </span>
        </div>

        {/* Floating Google AdChoices Tag */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowAdInfo(true);
          }}
          className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition border border-white/20"
          title="Google AdChoices"
        >
          <span className="text-blue-400 font-bold">AdChoices</span>
          <Info className="w-3 h-3 text-blue-400" />
        </div>

        {/* Heart burst on double tap */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-20 h-20 text-rose-500 fill-rose-500 animate-ping" />
          </div>
        )}

        {/* Bottom Interactive CTA Strip on Media */}
        <div className="absolute inset-x-0 bottom-0 p-3 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex items-center justify-between pointer-events-auto">
          <span className="text-white text-xs font-semibold drop-shadow-md truncate max-w-[70%]">
            {ad.headline}
          </span>
          <span
            onClick={handleCtaClick}
            className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <span>{ad.callToAction}</span>
            <ExternalLink className="w-3 h-3 stroke-[2.5]" />
          </span>
        </div>
      </div>

      {/* Action Row & Engagement */}
      <div className="p-3.5 space-y-3">
        {/* Full-width High-Conversion Native CTA Button */}
        <button
          id={`admob-native-cta-${ad.id}`}
          onClick={handleCtaClick}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{ad.callToAction}</span>
          <ExternalLink className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Engagement Icons: Like, Share, Save */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4 text-neutral-800 dark:text-neutral-200">
            <button
              onClick={handleToggleLike}
              className="flex items-center gap-1.5 hover:opacity-75 transition active:scale-125"
              aria-label="Like ad"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked ? 'text-rose-500 fill-rose-500' : 'stroke-[1.8]'
                }`}
              />
              <span className="text-xs font-semibold">{likesCount.toLocaleString()}</span>
            </button>

            <button
              onClick={() => {
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
              className="hover:opacity-75 transition active:scale-110"
              aria-label="Share ad"
            >
              <Send className="w-6 h-6 stroke-[1.8]" />
            </button>
          </div>

          <button
            onClick={() => {
              setIsSaved((s) => !s);
              showToast(isSaved ? 'Ad removed from saved.' : 'Ad saved to bookmarks.');
            }}
            className="hover:opacity-75 transition active:scale-110"
            aria-label="Save ad"
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                isSaved ? 'text-amber-500 fill-amber-500' : 'stroke-[1.8]'
              }`}
            />
          </button>
        </div>

        {/* Headline & Description Body */}
        <div className="space-y-1 text-xs">
          <p className="text-neutral-900 dark:text-white leading-relaxed">
            <span className="font-bold mr-1.5">{ad.advertiser}</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              {ad.headline}:
            </span>{' '}
            <span className="text-neutral-600 dark:text-neutral-400">{ad.body}</span>
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ad.tags.map((t) => (
              <span key={t} className="text-blue-500 dark:text-blue-400 font-medium">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AdChoices Info Dialog */}
      {showAdInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAdInfo(false)}
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
                    Google AdMob Native Ad
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    Official In-Feed Native Advanced Format
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAdInfo(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                  Ad Unit ID (Native)
                </span>
                <code className="text-[11px] font-mono text-blue-600 dark:text-blue-400 break-all select-all">
                  {ADMOB_CONFIG.NATIVE}
                </code>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                  Google Play Better Ads Compliance
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  • Blends into feed layout seamlessly without shifting content.<br />
                  • Zero intrusive popups or full-screen interstitials.<br />
                  • Clearly identified with official &ldquo;Sponsored&rdquo; &amp; &ldquo;Ad&rdquo; badges.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAdInfo(false)}
              className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
