import React, { useState, useMemo } from 'react';
import { Search, X, Heart, MessageCircle, Film, MapPin, RotateCcw } from 'lucide-react';
import { Post } from '../types';
import { SupportedLanguage, translations } from '../translations';

interface ExploreViewProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  currentLanguage?: SupportedLanguage;
}

const cityFilters = ['All India', 'Mumbai', 'Delhi', 'Hyderabad', 'Patna'] as const;
type CityFilter = (typeof cityFilters)[number];

const exploreCategories = [
  'All',
  'Travel',
  'Festivals',
  'Dance',
  'Food',
  'Fashion',
  'Indie Music',
  'Heritage',
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  posts,
  onSelectPost,
  currentLanguage = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState<CityFilter>('All India');
  const t = translations[currentLanguage];

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !searchQuery.trim() ||
        post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.location && post.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' ||
        post.tags.some((tag) => tag.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        post.caption.toLowerCase().includes(selectedCategory.toLowerCase());

      const loc = (post.location || '').toLowerCase();
      const caption = post.caption.toLowerCase();
      const tags = post.tags.map((tg) => tg.toLowerCase());

      let matchesCity = true;
      if (selectedCity === 'Mumbai') {
        matchesCity =
          loc.includes('mumbai') ||
          loc.includes('bombay') ||
          loc.includes('bandra') ||
          loc.includes('colaba') ||
          loc.includes('marine drive') ||
          tags.includes('mumbai') ||
          tags.includes('bombay') ||
          caption.includes('mumbai');
      } else if (selectedCity === 'Delhi') {
        matchesCity =
          loc.includes('delhi') ||
          loc.includes('chandni chowk') ||
          loc.includes('lodhi') ||
          loc.includes('india gate') ||
          tags.includes('delhi') ||
          tags.includes('newdelhi') ||
          tags.includes('olddelhi') ||
          caption.includes('delhi');
      } else if (selectedCity === 'Hyderabad') {
        matchesCity =
          loc.includes('hyderabad') ||
          loc.includes('charminar') ||
          loc.includes('golconda') ||
          tags.includes('hyderabad') ||
          tags.includes('charminar') ||
          caption.includes('hyderabad');
      } else if (selectedCity === 'Patna') {
        matchesCity =
          loc.includes('patna') ||
          loc.includes('bihar') ||
          loc.includes('golghar') ||
          tags.includes('patna') ||
          tags.includes('bihar') ||
          tags.includes('golghar') ||
          caption.includes('patna') ||
          caption.includes('bihar');
      }

      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [posts, searchQuery, selectedCategory, selectedCity]);

  return (
    <div id="explore-view" className="w-full max-w-4xl mx-auto px-2 md:px-4 py-3">
      {/* Search Header */}
      <div className="relative mb-3">
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/90 rounded-xl px-3.5 py-2 border border-neutral-200 dark:border-neutral-700/80">
          <Search className="w-4 h-4 text-neutral-400 mr-2 flex-shrink-0" />
          <input
            id="explore-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* City Filter Buttons */}
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
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm ring-2 ring-rose-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/70 dark:border-neutral-700/70'
              }`}
            >
              {city === 'All India' && <span className="text-[13px]">🇮🇳</span>}
              {city === 'Mumbai' && <span className="text-[13px]">🌊</span>}
              {city === 'Delhi' && <span className="text-[13px]">🏛️</span>}
              {city === 'Hyderabad' && <span className="text-[13px]">🕌</span>}
              {city === 'Patna' && <span className="text-[13px]">🌅</span>}
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {cat === 'All' ? (t.allCategories || t.allCategory || 'All') : cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            {selectedCity !== 'All India'
              ? `No posts found for ${selectedCity}`
              : (t.noResultsFound || 'No results found')}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {selectedCity !== 'All India' || selectedCategory !== 'All' || searchQuery
              ? 'Try switching cities, resetting the category, or searching a different keyword.'
              : (t.trySearching || 'Try searching for something else')}
          </p>
          {(selectedCity !== 'All India' || selectedCategory !== 'All' || searchQuery) && (
            <button
              id="reset-explore-filters-btn"
              onClick={() => {
                setSelectedCity('All India');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to All India</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {filteredPosts.map((post, idx) => {
            const isLarge = (idx + 1) % 7 === 0;

            return (
              <div
                key={`${post.id}-${idx}`}
                id={`explore-post-${post.id}`}
                onClick={() => onSelectPost(post)}
                className={`group relative bg-neutral-900 overflow-hidden cursor-pointer rounded-sm md:rounded-lg ${
                  isLarge ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                }`}
              >
                {post.mediaType === 'video' ? (
                  <video
                    src={post.mediaUrl}
                    muted
                    preload="metadata"
                    className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                      post.filter || ''
                    }`}
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                      post.filter || ''
                    }`}
                    loading="lazy"
                  />
                )}

                {/* Video / Reel badge indicator */}
                {post.mediaType === 'video' && (
                  <div className="absolute top-2 right-2 text-white drop-shadow-md z-10">
                    <Film className="w-4 h-4" />
                  </div>
                )}

                {/* Hover Overlay with Likes & Comments Count */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-5 text-white font-semibold text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
