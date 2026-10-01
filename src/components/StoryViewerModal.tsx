import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Heart, Send, Volume2, VolumeX } from 'lucide-react';
import { StoryGroup } from '../types';
import { pauseAllMedia } from '../utils/mediaCoordinator';

interface StoryViewerModalProps {
  stories: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onMarkSeen: (groupId: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialGroupIndex,
  onClose,
  onMarkSeen,
}) => {
  const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIndex);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sentReaction, setSentReaction] = useState<string | null>(null);

  const progressIntervalRef = useRef<number | null>(null);
  const progressValRef = useRef(0);
  const isPausedRef = useRef(isPaused);
  const currentGroupIdxRef = useRef(currentGroupIdx);
  const currentSlideIdxRef = useRef(currentSlideIdx);
  const storiesRef = useRef(stories);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    currentGroupIdxRef.current = currentGroupIdx;
  }, [currentGroupIdx]);

  useEffect(() => {
    currentSlideIdxRef.current = currentSlideIdx;
  }, [currentSlideIdx]);

  useEffect(() => {
    storiesRef.current = stories;
  }, [stories]);

  const currentGroup = stories[currentGroupIdx];
  const slides = currentGroup?.slides || [];
  const currentSlide = slides[currentSlideIdx];

  // Pause background media when viewer opens and unmounts
  useEffect(() => {
    pauseAllMedia();
    return () => {
      pauseAllMedia();
    };
  }, []);

  // Safe auto-close if story group or slide is not found
  useEffect(() => {
    if (!currentGroup || !currentSlide) {
      onClose();
    }
  }, [currentGroup, currentSlide, onClose]);

  // Mark current story as seen (only if unseen to prevent redundant App state updates)
  useEffect(() => {
    if (currentGroup && currentGroup.hasUnseen) {
      onMarkSeen(currentGroup.id);
    }
  }, [currentGroup?.id, currentGroup?.hasUnseen, onMarkSeen]);

  const handleNext = useCallback(() => {
    const grpIdx = currentGroupIdxRef.current;
    const sldIdx = currentSlideIdxRef.current;
    const allStories = storiesRef.current;
    const activeGroup = allStories[grpIdx];
    const activeSlides = activeGroup?.slides || [];

    if (sldIdx < activeSlides.length - 1) {
      setCurrentSlideIdx(sldIdx + 1);
      setProgress(0);
      progressValRef.current = 0;
    } else if (grpIdx < allStories.length - 1) {
      setCurrentGroupIdx(grpIdx + 1);
      setCurrentSlideIdx(0);
      setProgress(0);
      progressValRef.current = 0;
    } else {
      onClose();
    }
  }, [onClose]);

  const handlePrev = useCallback(() => {
    const grpIdx = currentGroupIdxRef.current;
    const sldIdx = currentSlideIdxRef.current;
    const allStories = storiesRef.current;

    if (sldIdx > 0) {
      setCurrentSlideIdx(sldIdx - 1);
      setProgress(0);
      progressValRef.current = 0;
    } else if (grpIdx > 0) {
      const prevGroup = allStories[grpIdx - 1];
      setCurrentGroupIdx(grpIdx - 1);
      setCurrentSlideIdx(prevGroup ? Math.max(0, prevGroup.slides.length - 1) : 0);
      setProgress(0);
      progressValRef.current = 0;
    }
  }, []);

  // Handle slide timer progress cleanly without calling setState during an updater
  useEffect(() => {
    setProgress(0);
    progressValRef.current = 0;
    if (!currentSlide) return;

    const duration = 5000; // 5 seconds per slide
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = window.setInterval(() => {
      if (isPausedRef.current) return;

      progressValRef.current += step;
      if (progressValRef.current >= 100) {
        progressValRef.current = 0;
        setProgress(0);
        handleNext();
      } else {
        setProgress(progressValRef.current);
      }
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentGroupIdx, currentSlideIdx, handleNext, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSentReaction('Message sent!');
    setReplyText('');
    setTimeout(() => setSentReaction(null), 2000);
  };

  const handleQuickEmoji = (emoji: string) => {
    setSentReaction(emoji);
    setTimeout(() => setSentReaction(null), 2000);
  };

  if (!currentGroup || !currentSlide) return null;

  return (
    <div
      id="story-viewer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      {/* Close button */}
      <button
        id="story-close-btn"
        onClick={onClose}
        aria-label="Close story"
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-neutral-900/50 hover:bg-neutral-800 transition"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Main Story Container */}
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:max-h-[820px] bg-neutral-950 flex flex-col md:rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/50 select-none">
        {/* Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {slides.map((s, idx) => {
            let widthPercent = 0;
            if (idx < currentSlideIdx) widthPercent = 100;
            else if (idx === currentSlideIdx) widthPercent = progress;
            return (
              <div
                key={s.id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top User Bar */}
        <div className="absolute top-7 inset-x-4 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <img
              src={currentGroup.avatar}
              alt={currentGroup.username}
              className="w-9 h-9 rounded-full object-cover border border-white/40"
            />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight">{currentGroup.username}</span>
              <span className="text-xs text-white/70">{currentSlide.timestamp}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="story-pause-btn"
              onClick={() => setIsPaused((p) => !p)}
              className="text-white/80 hover:text-white p-1"
              title={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play className="w-5 h-5 fill-white" /> : <Pause className="w-5 h-5 fill-white" />}
            </button>
            <button
              id="story-mute-btn"
              onClick={() => setIsMuted((m) => !m)}
              className="text-white/80 hover:text-white p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Click Zones (Left & Right for previous/next, Hold for pause) */}
        <div
          className="relative flex-1 bg-neutral-900 overflow-hidden flex items-center justify-center"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <img
            src={currentSlide.mediaUrl}
            alt={currentSlide.caption || 'Story media'}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />

          {/* Left tap area */}
          <div
            id="story-tap-left"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
          />

          {/* Right tap area */}
          <div
            id="story-tap-right"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
          />

          {/* Slide Caption if present */}
          {currentSlide.caption && (
            <div className="absolute bottom-20 inset-x-4 z-20 text-center">
              <span className="inline-block bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-medium border border-white/10 shadow-lg">
                {currentSlide.caption}
              </span>
            </div>
          )}

          {/* Reaction Overlay Popup Animation */}
          {sentReaction && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none animate-bounce">
              <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full text-2xl font-bold shadow-2xl border border-white/20">
                {sentReaction}
              </div>
            </div>
          )}
        </div>

        {/* Story Bottom Reply & Emojis Bar */}
        <div className="p-3 bg-gradient-to-t from-black via-black/80 to-transparent z-30 flex flex-col gap-2">
          {/* Quick emoji reaction row */}
          <div className="flex items-center justify-between px-2 text-xl">
            {['❤️', '🔥', '👏', '😂', '😍', '😮'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleQuickEmoji(emoji)}
                className="hover:scale-125 active:scale-95 transition transform duration-150 p-1"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendReply} className="flex items-center gap-2 mt-1">
            <input
              id="story-reply-input"
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentGroup.username}...`}
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:border-white/60 transition"
            />
            <button
              id="story-send-reply-btn"
              type="submit"
              disabled={!replyText.trim()}
              className="text-white disabled:opacity-30 p-2 hover:bg-white/10 rounded-full transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Navigation Arrow Buttons */}
      {currentGroupIdx > 0 && (
        <button
          id="story-prev-group-btn"
          onClick={handlePrev}
          aria-label="Previous story"
          className="hidden md:flex absolute left-8 text-white/80 hover:text-white p-3 rounded-full bg-neutral-900/60 hover:bg-neutral-800 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {(currentGroupIdx < stories.length - 1 || currentSlideIdx < slides.length - 1) && (
        <button
          id="story-next-group-btn"
          onClick={handleNext}
          aria-label="Next story"
          className="hidden md:flex absolute right-8 text-white/80 hover:text-white p-3 rounded-full bg-neutral-900/60 hover:bg-neutral-800 transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
