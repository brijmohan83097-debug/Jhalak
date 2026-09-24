import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Heart,
  MessageCircle,
  Film,
  MapPin,
  RotateCcw,
  User as UserIcon,
  Hash,
  Music,
  Play,
  Pause,
  BadgeCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Post, User } from '../types';
import { SupportedLanguage, translations } from '../translations';
import {
  createVideoFallbackDataUrl,
  createPhotoFallbackDataUrl,
} from '../utils/imageCompressor';
import { BHOJPURI_MUSIC_LIBRARY, BhojpuriTrack, playSyntheticTrackPreview } from '../data/bhojpuriMusic';

interface ExploreViewProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onViewUser?: (username: string) => void;
  onUseAudio?: (audioTitle: string, artist?: string) => void;
  currentLanguage?: SupportedLanguage;
  autoFocusSearch?: boolean;
  initialQuery?: string;
  onClose?: () => void;
  searchableUsers?: User[];
}

const cityFilters = ['All Regions', 'Patna', 'Varanasi', 'Ara / Bhojpur', 'Gorakhpur'] as const;
type CityFilter = (typeof cityFilters)[number];

const exploreCategories = [
  'All',
  'Bhojpuri',
  'Comedy',
  'Music',
  'Dance',
  'Food',
  'Folk',
];

type SearchTab = 'all' | 'reels' | 'creators' | 'tags' | 'audio';

interface CreatorResult {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isVerified?: boolean;
  followersCount: number;
  bio?: string;
  isFollowing?: boolean;
}

const POPULAR_HASHTAGS = [
  { tag: 'bhojpurisong', label: '#BhojpuriSong', count: 'Trending' },
  { tag: 'bhojpurireels', label: '#BhojpuriReels', count: 'Trending' },
  { tag: 'bihar', label: '#Bihar', count: 'Popular' },
  { tag: 'patna', label: '#Patna', count: 'Popular' },
  { tag: 'desidance', label: '#DesiDance', count: 'Trending' },
  { tag: 'music', label: '#Music', count: 'Trending' },
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  posts,
  onSelectPost,
  onViewUser,
  onUseAudio,
  currentLanguage = 'en',
  autoFocusSearch = false,
  initialQuery = '',
  onClose,
  searchableUsers = [],
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState<CityFilter>('All Regions');
  const [previewingAudioId, setPreviewingAudioId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jhalak_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});

  const activeAudioPreviewRef = React.useRef<{ stop: () => void } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const t = translations[currentLanguage];

  // Auto focus search input when requested (e.g., opened via header search button)
  useEffect(() => {
    if (autoFocusSearch) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocusSearch]);

  // Sync initialQuery if prop changes
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Stop audio preview on unmount
  useEffect(() => {
    return () => {
      if (activeAudioPreviewRef.current) {
        activeAudioPreviewRef.current.stop();
      }
    };
  }, []);

  const handleSaveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('jhalak_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('jhalak_recent_searches');
    } catch {}
  };

  // Play audio preview
  const handleToggleAudioPreview = (track: BhojpuriTrack) => {
    if (previewingAudioId === track.id) {
      if (activeAudioPreviewRef.current) {
        activeAudioPreviewRef.current.stop();
        activeAudioPreviewRef.current = null;
      }
      setPreviewingAudioId(null);
      return;
    }

    if (activeAudioPreviewRef.current) {
      activeAudioPreviewRef.current.stop();
    }

    setPreviewingAudioId(track.id);
    const player = playSyntheticTrackPreview(track, () => {
      setPreviewingAudioId(null);
    });
    activeAudioPreviewRef.current = player;
  };

  // Derive unique creators and friends from searchableUsers and posts
  const creators = useMemo<CreatorResult[]>(() => {
    const map = new Map<string, CreatorResult>();

    // 1. Add registered users & friends first
    if (Array.isArray(searchableUsers)) {
      searchableUsers.forEach((u) => {
        const uname = (u.username || '').toLowerCase().trim();
        if (!uname) return;
        map.set(uname, {
          id: u.id || uname,
          username: u.username,
          name: u.name || u.username,
          avatar: u.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
          isVerified: Boolean(u.isVerified),
          followersCount: u.followersCount || 0,
          bio: u.bio || '',
        });
      });
    }

    // 2. Add creators from posts
    posts.forEach((p) => {
      const uname = (p.username || '').toLowerCase().trim();
      if (!uname || map.has(uname)) return;
      if (uname.includes('fanclub') || uname.includes('dummy') || uname.includes('mock') || uname.includes('fake')) return;

      map.set(uname, {
        id: p.userId || uname,
        username: p.username,
        name: p.username.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        avatar: p.userAvatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        isVerified: p.isVerified || false,
        followersCount: 0,
        bio: p.caption ? p.caption.slice(0, 60) : '',
      });
    });

    return Array.from(map.values());
  }, [posts, searchableUsers]);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (post.caption && post.caption.toLowerCase().includes(q)) ||
        (post.username && post.username.toLowerCase().includes(q)) ||
        (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(q.replace(/^#/, '')))) ||
        (post.audioTitle && post.audioTitle.toLowerCase().includes(q)) ||
        (post.location && post.location.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'All' ||
        post.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(selectedCategory.toLowerCase()))) ||
        (post.caption && post.caption.toLowerCase().includes(selectedCategory.toLowerCase()));

      const loc = (post.location || '').toLowerCase();
      const caption = (post.caption || '').toLowerCase();
      const tags = (post.tags || []).map((tg) => tg.toLowerCase());

      let matchesCity = true;
      if (selectedCity === 'Patna') {
        matchesCity =
          loc.includes('patna') ||
          loc.includes('bihar') ||
          tags.includes('patna') ||
          caption.includes('patna') ||
          caption.includes('पटना');
      } else if (selectedCity === 'Varanasi') {
        matchesCity =
          loc.includes('varanasi') ||
          loc.includes('kashi') ||
          loc.includes('banaras') ||
          tags.includes('varanasi') ||
          caption.includes('varanasi') ||
          caption.includes('बनारस');
      } else if (selectedCity === 'Ara / Bhojpur') {
        matchesCity =
          loc.includes('ara') ||
          loc.includes('bhojpur') ||
          tags.includes('arajila') ||
          tags.includes('arah') ||
          caption.includes('ara') ||
          caption.includes('आरा') ||
          caption.includes('भोजपुर');
      } else if (selectedCity === 'Gorakhpur') {
        matchesCity =
          loc.includes('gorakhpur') ||
          loc.includes('purvanchal') ||
          tags.includes('gorakhpur') ||
          caption.includes('gorakhpur') ||
          caption.includes('गोरखपुर');
      }

      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [posts, searchQuery, selectedCategory, selectedCity]);

  // Filtered Creators
  const filteredCreators = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!q) return creators.slice(0, 6);
    return creators.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.bio && c.bio.toLowerCase().includes(q))
    );
  }, [creators, searchQuery]);

  // Filtered Hashtags
  const filteredHashtags = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^#/, '');
    if (!q) return POPULAR_HASHTAGS;
    return POPULAR_HASHTAGS.filter(
      (h) => h.tag.toLowerCase().includes(q) || h.label.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered Bhojpuri Audio Tracks
  const filteredTracks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BHOJPURI_MUSIC_LIBRARY;
    return BHOJPURI_MUSIC_LIBRARY.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q.replace(/^#/, '')))
    );
  }, [searchQuery]);

  const toggleFollow = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowedCreators((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const handleSelectHashtag = (tagLabel: string) => {
    const cleanTag = tagLabel.replace(/^#/, '');
    setSearchQuery(cleanTag);
    handleSaveRecentSearch(`#${cleanTag}`);
  };

  const handleSelectCreator = (username: string) => {
    handleSaveRecentSearch(`@${username}`);
    if (onViewUser) {
      onViewUser(username);
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div id="explore-view" className="w-full max-w-4xl mx-auto px-2 md:px-4 py-3">
      {/* Search Header Bar with Real-Time Clear and Suggestion Access */}
      <div className="relative mb-3">
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/95 rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs focus-within:ring-2 focus-within:ring-rose-500/40 focus-within:border-rose-500 transition">
          {onClose && (
            <button
              id="explore-back-btn"
              type="button"
              onClick={onClose}
              className="p-1 -ml-1 mr-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition cursor-pointer active:scale-95"
              title="Close search"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Search className="w-4 h-4 text-neutral-400 mr-2.5 flex-shrink-0" />
          <input
            ref={searchInputRef}
            id="explore-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleSaveRecentSearch(searchQuery);
              }
            }}
            placeholder="Search reels, creators, or hashtags..."
            className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none font-medium"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Search Category Filter Tabs (Instagram Style: All, Reels, Creators, Tags, Audio) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <button
          id="search-tab-all"
          onClick={() => setActiveSearchTab('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSearchTab === 'all'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Top & All</span>
        </button>

        <button
          id="search-tab-reels"
          onClick={() => setActiveSearchTab('reels')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSearchTab === 'reels'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-rose-500" />
          <span>Reels ({filteredPosts.length})</span>
        </button>

        <button
          id="search-tab-creators"
          onClick={() => setActiveSearchTab('creators')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSearchTab === 'creators'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5 text-sky-500" />
          <span>Creators ({filteredCreators.length})</span>
        </button>

        <button
          id="search-tab-tags"
          onClick={() => setActiveSearchTab('tags')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSearchTab === 'tags'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Hash className="w-3.5 h-3.5 text-emerald-500" />
          <span>Hashtags</span>
        </button>

        <button
          id="search-tab-audio"
          onClick={() => setActiveSearchTab('audio')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSearchTab === 'audio'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-fuchsia-500" />
          <span>Bhojpuri Audio ({filteredTracks.length})</span>
        </button>
      </div>

      {/* Recent & Trending Searches Bar when search is empty or focused */}
      {!isSearching && recentSearches.length > 0 && (
        <div className="mb-3 px-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" /> Recent Searches:
            </span>
            <button
              onClick={handleClearRecentSearches}
              className="text-neutral-400 hover:text-rose-500 text-[11px] cursor-pointer"
            >
              Clear all
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {recentSearches.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(item.replace(/^[@#]/, ''))}
                className="px-2.5 py-1 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition flex items-center gap-1 cursor-pointer whitespace-nowrap border border-neutral-200/50 dark:border-neutral-700/50"
              >
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* City Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2.5 mb-1.5 pt-0.5">
        <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 pl-0.5 pr-1 flex-shrink-0">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          <span>Cities:</span>
        </div>
        {cityFilters.map((city) => {
          const isSelected = selectedCity === city;
          return (
            <button
              key={city}
              id={`explore-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs ring-2 ring-rose-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/70 dark:border-neutral-700/70'
              }`}
            >
              {city === 'All Regions' && <span className="text-[13px]">🇮🇳</span>}
              {city === 'Patna' && <span className="text-[13px]">🌅</span>}
              {city === 'Varanasi' && <span className="text-[13px]">🪔</span>}
              {city === 'Ara / Bhojpur' && <span className="text-[13px]">🎭</span>}
              {city === 'Gorakhpur' && <span className="text-[13px]">🌾</span>}
              <span>{city}</span>
            </button>
          );
        })}
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
        {exploreCategories.map((cat) => (
          <button
            key={cat}
            id={`explore-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {cat === 'All' ? (t.allCategories || t.allCategory || 'All') : cat}
          </button>
        ))}
      </div>

      {/* ============ TAB VIEW 1: CREATORS SEARCH RESULTS ============ */}
      {activeSearchTab === 'creators' && (
        <div className="space-y-2 mb-4 animate-in fade-in">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
            Matching Creators ({filteredCreators.length})
          </h3>
          {filteredCreators.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              No creators found for "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredCreators.map((creator) => {
                const isFollowing = followedCreators[creator.username];
                return (
                  <div
                    key={creator.id}
                    onClick={() => handleSelectCreator(creator.username)}
                    className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between gap-3 hover:border-neutral-400 dark:hover:border-neutral-700 transition cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {creator.name}
                          </span>
                          {creator.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          @{creator.username}
                        </p>
                        <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
                          {(creator.followersCount / 1000).toFixed(1)}k followers
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleFollow(creator.username, e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                        isFollowing
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                          : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB VIEW 2: HASHTAGS RESULTS ============ */}
      {activeSearchTab === 'tags' && (
        <div className="space-y-2 mb-4 animate-in fade-in">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
            Trending Bhojpuri Hashtags
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredHashtags.map((h) => (
              <div
                key={h.tag}
                onClick={() => handleSelectHashtag(h.label)}
                className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between hover:border-rose-500/50 transition cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/10 to-amber-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center font-black text-lg">
                    #
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {h.label}
                    </h4>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {h.count}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
                  Explore →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ TAB VIEW 3: BHOJPURI AUDIO LIBRARY SEARCH RESULTS ============ */}
      {activeSearchTab === 'audio' && (
        <div className="space-y-2 mb-4 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Popular Bhojpuri Soundtracks ({filteredTracks.length})
            </h3>
            <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Tap play to listen
            </span>
          </div>

          <div className="space-y-2">
            {filteredTracks.map((track) => {
              const isPlaying = previewingAudioId === track.id;
              return (
                <div
                  key={track.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isPlaying
                      ? 'bg-rose-500/10 border-rose-500 dark:bg-rose-950/30'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAudioPreview(track)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer flex-shrink-0 ${
                        isPlaying
                          ? 'bg-rose-500 text-white shadow-md animate-pulse'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play preview'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {track.title}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {track.artist} • <span className="text-rose-500 font-medium">{track.category}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(track.title);
                        setActiveSearchTab('reels');
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
                    >
                      View Reels
                    </button>
                    {onUseAudio && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeAudioPreviewRef.current) {
                            activeAudioPreviewRef.current.stop();
                          }
                          setPreviewingAudioId(null);
                          onUseAudio(track.title, track.artist);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition cursor-pointer active:scale-95"
                      >
                        Use Audio
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ TAB VIEW 4 & DEFAULT: REELS GRID ============ */}
      {(activeSearchTab === 'all' || activeSearchTab === 'reels') && (
        <>
          {/* If searching in 'all' tab and there are matching songs, show them at the top! */}
          {activeSearchTab === 'all' && isSearching && filteredTracks.length > 0 && (
            <div className="mb-4 p-3.5 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-amber-500/10 border border-rose-500/20 rounded-2xl animate-in fade-in">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Matching Songs ({filteredTracks.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSearchTab('audio')}
                  className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  See all audio →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredTracks.slice(0, 4).map((track) => {
                  const isPlaying = previewingAudioId === track.id;
                  return (
                    <div
                      key={`all-${track.id}`}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                        isPlaying
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400'
                          : 'bg-white/80 dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAudioPreview(track)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                            isPlaying
                              ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-rose-500 hover:text-white'
                          }`}
                        >
                          {isPlaying ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {onUseAudio && (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeAudioPreviewRef.current) {
                              activeAudioPreviewRef.current.stop();
                            }
                            setPreviewingAudioId(null);
                            onUseAudio(track.title, track.artist);
                          }}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition flex-shrink-0 cursor-pointer active:scale-95"
                        >
                          Use Audio
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {filteredPosts.length === 0 ? (
            <div className="py-20 text-center text-neutral-500">
              <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                {selectedCity !== 'All Regions'
                  ? `No reels found for ${selectedCity}`
                  : (t.noResultsFound || 'No results found')}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {selectedCity !== 'All Regions' || selectedCategory !== 'All' || searchQuery
                  ? 'Try switching regions, resetting category, or searching a different keyword.'
                  : (t.trySearching || 'Try searching for something else')}
              </p>
              {(selectedCity !== 'All Regions' || selectedCategory !== 'All' || searchQuery) && (
                <button
                  id="reset-explore-filters-btn"
                  onClick={() => {
                    setSelectedCity('All Regions');
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to All Regions</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-3">
              {filteredPosts.map((post, idx) => {
                const isLarge = (idx + 1) % 7 === 0;

                return (
                  <div
                    key={`${post.id}-${idx}`}
                    id={`explore-post-${post.id}`}
                    onClick={() => onSelectPost(post)}
                    className={`group relative bg-neutral-900 overflow-hidden cursor-pointer rounded-sm md:rounded-xl shadow-xs transition duration-200 hover:shadow-md ${
                      isLarge ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                    }`}
                  >
                    {post.mediaType === 'video' ? (
                      <div className="w-full h-full relative bg-neutral-950 flex items-center justify-center">
                        <img
                          src={
                            post.thumbnailUrl ||
                            (post.mediaUrl && !post.mediaUrl.startsWith('blob:')
                              ? post.mediaUrl
                              : createVideoFallbackDataUrl(post.caption))
                          }
                          alt={post.caption || 'Video Reel'}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.src = createVideoFallbackDataUrl(post.caption);
                          }}
                          className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                            post.filter || ''
                          }`}
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white drop-shadow-md z-10 flex items-center justify-center">
                          <Film className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.caption}
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = createPhotoFallbackDataUrl(post.caption);
                        }}
                        className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                          post.filter || ''
                        }`}
                        loading="lazy"
                      />
                    )}

                    {/* Bottom Metadata gradient badge: Creator handle & audio badge */}
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[11px] flex items-center justify-between z-10 opacity-90 group-hover:opacity-100">
                      <span className="truncate max-w-[85%] font-medium">
                        @{post.username}
                      </span>
                      {post.mediaType === 'video' && (
                        <span className="text-[10px] text-white/80">Reel</span>
                      )}
                    </div>

                    {/* Hover Overlay with Likes & Comments Count */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-5 text-white font-semibold text-sm z-20">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-5 h-5 fill-white" />
                        <span>{post.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-5 h-5 fill-white" />
                        <span>{post.comments ? post.comments.length : 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
