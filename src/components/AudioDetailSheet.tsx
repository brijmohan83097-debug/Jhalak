import React, { useState, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  Clapperboard,
  Bookmark,
  Share2,
  X,
  Sparkles,
  Check,
  Eye,
  Heart,
} from 'lucide-react';
import { Reel } from '../types';

interface AudioDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  audioTitle: string;
  audioArtist?: string;
  audioCoverUrl?: string;
  currentReelId?: string;
  allReels: Reel[];
  onUseAudio: (audioTitle: string, audioArtist?: string) => void;
  onSelectReel?: (reelId: string) => void;
}

export const AudioDetailSheet: React.FC<AudioDetailSheetProps> = ({
  isOpen,
  onClose,
  audioTitle,
  audioArtist,
  audioCoverUrl,
  currentReelId,
  allReels,
  onUseAudio,
  onSelectReel,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [isSavedAudio, setIsSavedAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);

  const sheetRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filter reels that use this exact audio title
  const matchingReels = allReels.filter(
    (r) => r.audioTitle.toLowerCase().trim() === audioTitle.toLowerCase().trim()
  );

  // If there are few exact matches, supplement with other popular reels from the feed
  const displayReels =
    matchingReels.length >= 3
      ? matchingReels
      : [
          ...matchingReels,
          ...allReels.filter(
            (r) =>
              !matchingReels.some((mr) => mr.id === r.id)
          ),
        ].slice(0, 9);

  // Calculate estimated reels count display
  const reelsCountFormatted =
    matchingReels.length > 3
      ? `${(matchingReels.length * 1.8).toFixed(1)}K`
      : `${Math.max(matchingReels.length, 1) * 850 + 120} reels`;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchDelta(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDelta > 90) {
      onClose();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const handleShareAudio = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
    } catch {
      // ignore clipboard error in restricted iframe
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const cleanArtist =
    audioArtist ||
    (audioTitle.includes('•') ? audioTitle.split('•')[1]?.trim() : 'Original Audio Track');
  const cleanTitle = audioTitle.includes('•') ? audioTitle.split('•')[0]?.trim() : audioTitle;

  return (
    <div
      id="audio-detail-sheet-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[3px] flex items-end justify-center transition-opacity select-none"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        id="audio-detail-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: touchDelta > 0 ? `translateY(${touchDelta}px)` : 'translateY(0)',
          transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
        }}
        className="w-full max-w-lg md:max-w-xl bg-neutral-900 text-white rounded-t-[28px] h-[78vh] max-h-[85vh] flex flex-col shadow-2xl border-t border-neutral-800 animate-in slide-in-from-bottom duration-300 relative overflow-hidden"
      >
        {/* Drag handle */}
        <div
          className="pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none flex flex-col items-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1.5 rounded-full bg-neutral-700 mx-auto transition-colors" />
          <div className="w-full flex items-center justify-between px-4 mt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Audio Track
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-5">
          {/* Top Audio Card */}
          <div className="bg-gradient-to-b from-neutral-800/90 to-neutral-800/40 border border-neutral-700/60 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start gap-4">
              {/* Vinyl Cover Art with spinning disc animation */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-neutral-700/80 relative group ${
                    isPlayingAudio ? 'ring-2 ring-rose-500/50' : ''
                  }`}
                >
                  <img
                    src={
                      audioCoverUrl ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'
                    }
                    alt={audioTitle}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay Play / Pause Button */}
                  <button
                    onClick={() => setIsPlayingAudio((prev) => !prev)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/50 transition active:scale-95"
                    aria-label={isPlayingAudio ? 'Pause preview' : 'Play preview'}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-7 h-7 fill-white" />
                    ) : (
                      <Play className="w-7 h-7 fill-white ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Spinning vinyl badge */}
                <div
                  className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neutral-950 border border-neutral-700 flex items-center justify-center shadow-md ${
                    isPlayingAudio ? 'animate-spin [animation-duration:3s]' : ''
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-rose-400" />
                </div>
              </div>

              {/* Title, Artist, and Stats */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug line-clamp-2">
                  {cleanTitle}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 font-medium mt-0.5 truncate">
                  {cleanArtist}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-400">
                  <span className="px-2 py-0.5 rounded-full bg-neutral-700/60 text-neutral-300 font-medium">
                    {reelsCountFormatted}
                  </span>
                  <span>•</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Trending
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Wave Visualizer Animation */}
            <div className="mt-4 pt-3 border-t border-neutral-700/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 h-7 flex-1">
                {[45, 80, 60, 95, 30, 70, 90, 40, 85, 65, 100, 50, 75, 90, 35, 60, 85, 45].map(
                  (heightPct, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full bg-gradient-to-t from-rose-500 via-pink-500 to-amber-400 transition-all duration-300"
                      style={{
                        height: isPlayingAudio
                          ? `${Math.max(18, (heightPct * ((i % 3) + 1)) % 100)}%`
                          : '20%',
                        opacity: isPlayingAudio ? 0.9 : 0.4,
                        animation: isPlayingAudio
                          ? `pulse ${0.8 + (i % 5) * 0.2}s ease-in-out infinite alternate`
                          : 'none',
                      }}
                    />
                  )
                )}
              </div>

              {/* Secondary action icons: Save & Share */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  id="save-audio-btn"
                  onClick={() => setIsSavedAudio((prev) => !prev)}
                  title={isSavedAudio ? 'Audio Saved' : 'Save Audio'}
                  className={`p-2 rounded-full border transition ${
                    isSavedAudio
                      ? 'border-amber-500/50 bg-amber-500/20 text-amber-400'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${isSavedAudio ? 'fill-amber-400' : ''}`}
                  />
                </button>

                <button
                  id="share-audio-btn"
                  onClick={handleShareAudio}
                  title="Share audio track"
                  className="p-2 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white transition relative"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Prominent Action Button: "Use Audio" */}
          <div>
            <button
              id="use-audio-prominent-btn"
              onClick={() => {
                onUseAudio(audioTitle, audioArtist);
                onClose();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:opacity-95 active:scale-[0.99] font-bold text-sm sm:text-base text-white shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2.5 transition-all group cursor-pointer"
            >
              <Clapperboard className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
              <span>Use Audio</span>
            </button>
          </div>

          {/* List / Grid of Other Reels using this track */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Reels with this audio</span>
                <span className="text-xs text-neutral-400 font-normal">
                  ({displayReels.length})
                </span>
              </h4>
              <span className="text-[11px] text-neutral-400">Tap to watch</span>
            </div>

            {/* 3-Column Instagram Reel Thumbnail Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {displayReels.map((reel) => {
                const isCurrent = reel.id === currentReelId;
                return (
                  <button
                    key={reel.id}
                    id={`audio-reel-card-${reel.id}`}
                    onClick={() => {
                      if (onSelectReel) {
                        onSelectReel(reel.id);
                        onClose();
                      }
                    }}
                    className={`group relative rounded-xl overflow-hidden aspect-[9/14] bg-neutral-800 text-left border transition focus:outline-none ${
                      isCurrent
                        ? 'border-rose-500 ring-2 ring-rose-500/40'
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {/* Poster thumbnail / video tag */}
                    <img
                      src={reel.userAvatar}
                      alt={reel.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                    {/* Play icon indicator */}
                    <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50 backdrop-blur-xs text-white/90">
                      <Play className="w-2.5 h-2.5 fill-white" />
                    </div>

                    {/* Current Reel Indicator Badge */}
                    {isCurrent && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-rose-500 text-[9px] font-bold text-white uppercase tracking-wider shadow">
                        Now Playing
                      </span>
                    )}

                    {/* Bottom Metadata: views / likes & author */}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 text-white pointer-events-none">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-200">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                        <span>{reel.likesCount.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-neutral-300 font-medium truncate">
                        @{reel.username}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
