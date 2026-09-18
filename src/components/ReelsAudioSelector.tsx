import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Music,
  Search,
  X,
  Play,
  Pause,
  Check,
  Disc,
  Flame,
  Volume2,
  Sparkles,
} from 'lucide-react';
import {
  BHOJPURI_MUSIC_LIBRARY,
  BHOJPURI_AUDIO_CATEGORIES,
  BhojpuriTrack,
  BhojpuriAudioCategory,
  searchBhojpuriTracks,
  playSyntheticTrackPreview,
} from '../data/bhojpuriMusic';

export interface ReelsAudioSelectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectTrack: (track: BhojpuriTrack) => void;
  selectedTrackId?: string | null;
  currentTrackTitle?: string;
  isInline?: boolean; // When true, renders directly inline without full-screen modal wrapper
  title?: string;
  subtitle?: string;
}

const QUICK_SEARCH_CHIPS = [
  'Pawan Singh',
  'Khesari Lal',
  'Shilpi Raj',
  'Lollypop',
  'Pudina',
  'Nathuniya',
  'Dholak',
];

export const ReelsAudioSelector: React.FC<ReelsAudioSelectorProps> = ({
  isOpen = true,
  onClose,
  onSelectTrack,
  selectedTrackId,
  currentTrackTitle,
  isInline = false,
  title = 'Bhojpuri & Trending Soundtracks',
  subtitle = 'Pawan Singh, Khesari Lal, Shilpi Raj & Viral Reels Hits',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BhojpuriAudioCategory>('All');
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);

  const activeAudioPlayerRef = useRef<{ stop: () => void } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Stop active preview helper
  const stopAudioPreview = () => {
    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.stop();
      activeAudioPlayerRef.current = null;
    }
    setPreviewingTrackId(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioPreview();
    };
  }, []);

  // Filtered tracks with instant search
  const filteredTracks = useMemo(() => {
    return searchBhojpuriTracks(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleTogglePlay = (track: BhojpuriTrack, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (previewingTrackId === track.id) {
      stopAudioPreview();
      return;
    }

    stopAudioPreview();
    setPreviewingTrackId(track.id);

    const player = playSyntheticTrackPreview(track, () => {
      setPreviewingTrackId(null);
    });
    activeAudioPlayerRef.current = player;
  };

  const handleSelect = (track: BhojpuriTrack) => {
    stopAudioPreview();
    onSelectTrack(track);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen && !isInline) return null;

  const content = (
    <div
      id="reels-audio-selector"
      className={`flex flex-col ${
        isInline
          ? 'w-full bg-neutral-50 dark:bg-neutral-900/90 rounded-2xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800'
          : 'bg-neutral-900 text-white border-t border-neutral-800 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 max-h-[86vh] sm:max-h-[82vh] w-full max-w-lg mx-auto shadow-2xl overflow-hidden'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200/60 dark:border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Music className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 truncate">
              <span>{title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 font-semibold flex-shrink-0">
                Superhits
              </span>
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {!isInline && onClose && (
          <button
            id="reels-audio-selector-close-btn"
            type="button"
            onClick={() => {
              stopAudioPreview();
              onClose();
            }}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            title="Close audio selector"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Instant Search Bar */}
      <div className="relative my-2.5 flex-shrink-0">
        <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl px-3 py-2 border border-neutral-200 dark:border-neutral-700/80 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 shadow-xs transition">
          <Search className="w-4 h-4 text-neutral-400 mr-2 flex-shrink-0" />
          <input
            ref={searchInputRef}
            id="reels-audio-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs, Pawan Singh, Khesari, Shilpi, Lollypop..."
            className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button
              id="clear-audio-search-btn"
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Search Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1.5 mb-1 flex-shrink-0">
        <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-0.5 flex-shrink-0 mr-1">
          <Flame className="w-3 h-3 text-rose-500" /> Hits:
        </span>
        {QUICK_SEARCH_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => {
              setSearchQuery(chip);
              setSelectedCategory('All');
            }}
            className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-neutral-700 border border-neutral-200/60 dark:border-neutral-700/60 whitespace-nowrap transition cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Artist & Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-1.5 border-b border-neutral-200/50 dark:border-neutral-800/80 flex-shrink-0">
        {BHOJPURI_AUDIO_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`audio-cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat === 'Pawan Singh' && <span>🎤</span>}
              {cat === 'Khesari Lal' && <span>🕺</span>}
              {cat === 'Shilpi Raj' && <span>🎶</span>}
              {cat === 'Folk & Dholak' && <span>🪘</span>}
              {cat === 'Trending' && <span>🔥</span>}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Audio Indicator Banner */}
      {(selectedTrackId || currentTrackTitle) && (
        <div className="mb-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center gap-2 truncate">
            <Disc className="w-4 h-4 text-rose-500 animate-spin flex-shrink-0" />
            <span className="text-neutral-800 dark:text-neutral-200 truncate">
              Attached Audio:{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                {currentTrackTitle ||
                  BHOJPURI_MUSIC_LIBRARY.find((t) => t.id === selectedTrackId)?.title}
              </strong>
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
            Active
          </span>
        </div>
      )}

      {/* Track List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[160px] max-h-[380px] sm:max-h-[440px]">
        {filteredTracks.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-400">
            <Music className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              No songs found matching "{searchQuery}"
            </p>
            <p className="mt-1 text-neutral-500">
              Try clicking Pawan Singh, Khesari Lal, or Shilpi Raj chips above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-3 px-3 py-1 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isPlaying = previewingTrackId === track.id;
            const isSelected =
              selectedTrackId === track.id ||
              (currentTrackTitle &&
                currentTrackTitle.toLowerCase().trim() === track.title.toLowerCase().trim());

            return (
              <div
                key={track.id}
                id={`audio-track-${track.id}`}
                onClick={() => handleSelect(track)}
                className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 shadow-xs'
                    : isPlaying
                    ? 'bg-rose-50/50 dark:bg-neutral-800 border-rose-400/60'
                    : 'bg-white dark:bg-neutral-800/60 border-neutral-200/80 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {/* Left: Play button + Track info */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <button
                    type="button"
                    onClick={(e) => handleTogglePlay(track, e)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer flex-shrink-0 ${
                      isPlaying
                        ? 'bg-rose-500 text-white shadow-md animate-pulse'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-rose-500 hover:text-white'
                    }`}
                    title={isPlaying ? 'Pause preview' : 'Play melody preview'}
                    aria-label={isPlaying ? 'Pause' : 'Play preview'}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-white" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {track.title}
                      </h4>
                      {isPlaying && (
                        <span className="flex items-center gap-0.5 text-rose-500">
                          <Volume2 className="w-3 h-3 animate-bounce" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {track.artist} •{' '}
                      <span className="text-rose-500 font-semibold">{track.category}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Duration + Use Audio Button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-medium text-neutral-400 hidden sm:inline">
                    {track.duration}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(track);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-white/10 hover:bg-rose-500 hover:text-white text-neutral-800 dark:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Use Audio</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 flex-shrink-0">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Instant Web Audio preview
        </span>
        <span>{filteredTracks.length} tracks available</span>
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:p-4 animate-in fade-in duration-150">
      {content}
    </div>
  );
};
