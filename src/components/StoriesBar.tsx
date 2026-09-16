import React, { useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { StoryGroup, User } from '../types';

interface StoriesBarProps {
  stories: StoryGroup[];
  currentUser: User;
  onOpenStory: (index: number) => void;
  onAddStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  currentUser,
  onOpenStory,
  onAddStory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800/80 py-3 select-none">
      {/* Scroll Left Button (Desktop) */}
      <button
        id="stories-scroll-left"
        onClick={() => scroll('left')}
        aria-label="Scroll stories left"
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-800 text-neutral-800 dark:text-white shadow-md hover:scale-110 transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Stories Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 px-4 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {/* Your Story item */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
          <div className="relative">
            <button
              id="story-circle-me"
              onClick={() => {
                if (stories[0]?.slides && stories[0].slides.length > 0) {
                  onOpenStory(0);
                } else {
                  onAddStory();
                }
              }}
              className="relative p-[2px] rounded-full hover:scale-105 transition transform duration-150"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-black"
              />
            </button>
            <button
              id="add-story-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddStory();
              }}
              title="Add to your story"
              aria-label="Add to your story"
              className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-black shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium truncate max-w-[70px]">
            Your story
          </span>
        </div>

        {/* Other Stories */}
        {stories.slice(1).map((group, index) => {
          const actualIndex = index + 1;
          const isUnseen = group.hasUnseen;

          return (
            <button
              key={group.id}
              id={`story-circle-${group.username}`}
              onClick={() => onOpenStory(actualIndex)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer text-left"
            >
              <div
                className={`p-[2.5px] rounded-full transition transform group-hover:scale-105 ${
                  isUnseen
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 shadow-sm'
                    : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <div className="bg-white dark:bg-black p-[2px] rounded-full">
                  <img
                    src={group.avatar}
                    alt={group.username}
                    className="w-15 h-15 rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs text-neutral-800 dark:text-neutral-200 truncate max-w-[72px] font-normal group-hover:font-medium">
                {group.username}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button (Desktop) */}
      <button
        id="stories-scroll-right"
        onClick={() => scroll('right')}
        aria-label="Scroll stories right"
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-800 text-neutral-800 dark:text-white shadow-md hover:scale-110 transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
