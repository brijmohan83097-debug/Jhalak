import { ContentCategory, Reel, Post, AffinityMap, CategoryAffinity } from '../types';

const STORAGE_KEY = 'jhalak_recs_affinity_v1';
const NOT_INTERESTED_KEY = 'jhalak_recs_not_interested_ids';

export const ALL_CATEGORIES: ContentCategory[] = [
  'Comedy',
  'Tech',
  'Travel',
  'Music',
  'Fabrication/DIY',
  'Bollywood',
  'Food',
  'Fitness',
];

export interface RecommendationFeedback {
  type: 'boost' | 'demote';
  category: ContentCategory;
  itemId: string;
  message: string;
}

const DEFAULT_AFFINITY: Record<ContentCategory, CategoryAffinity> = {
  Comedy: { score: 10, likes: 0, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
  Tech: { score: 10, likes: 0, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
  Travel: { score: 15, likes: 1, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
  Music: { score: 12, likes: 0, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
  'Fabrication/DIY': { score: 8, likes: 0, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
  Bollywood: { score: 14, likes: 1, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
  Food: { score: 8, likes: 0, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
  Fitness: { score: 8, likes: 0, comments: 0, shares: 0, watchCompletions: 0, consecutiveCount: 0, manualTuning: 'neutral' },
};

class RecommendationEngine {
  private affinity: AffinityMap = { ...DEFAULT_AFFINITY };
  private notInterestedIds: Set<string> = new Set();
  // Rolling list of recent categories interacted with (for consecutive count detection)
  private recentInteractions: { category: ContentCategory; timestamp: number }[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.affinity = { ...DEFAULT_AFFINITY, ...parsed };
      }
      const storedDislikes = localStorage.getItem(NOT_INTERESTED_KEY);
      if (storedDislikes) {
        this.notInterestedIds = new Set(JSON.parse(storedDislikes));
      }
    } catch {
      // fallback
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.affinity));
      localStorage.setItem(NOT_INTERESTED_KEY, JSON.stringify(Array.from(this.notInterestedIds)));
    } catch {
      // storage unavailable
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  public getAffinity(): AffinityMap {
    return { ...this.affinity };
  }

  public isNotInterested(id: string): boolean {
    return this.notInterestedIds.has(id);
  }

  /**
   * Check if a category has had 2+ recent watches or likes
   */
  public getHotCategory(): ContentCategory | null {
    // Check recent interactions (last 6 actions)
    const categoryCounts: Partial<Record<ContentCategory, number>> = {};
    const cutoff = Date.now() - 30 * 60 * 1000; // within 30 minutes
    const valid = this.recentInteractions.filter((item) => item.timestamp > cutoff);

    for (const item of valid) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      if ((categoryCounts[item.category] || 0) >= 2) {
        return item.category;
      }
    }

    // Also check consecutive count on stored affinity
    for (const cat of ALL_CATEGORIES) {
      if (this.affinity[cat]?.consecutiveCount >= 2) {
        return cat;
      }
    }

    return null;
  }

  /**
   * Record interaction: watch_end, watch_complete, like, comment, share, save, boost, demote
   * Returns boolean: true if user reached 2+ interactions for this category (hot category signal)
   */
  public recordInteraction(
    category: ContentCategory,
    type: 'watch_end' | 'watch_complete' | 'like' | 'comment' | 'share' | 'save' | 'boost' | 'demote',
    itemId?: string
  ): boolean {
    if (!this.affinity[category]) {
      this.affinity[category] = {
        score: 10,
        likes: 0,
        comments: 0,
        shares: 0,
        watchCompletions: 0,
        consecutiveCount: 0,
        manualTuning: 'neutral',
      };
    }

    const current = this.affinity[category];

    // Log recent interaction for consecutive trigger (for watches, likes, saves, boosts)
    if (type === 'watch_end' || type === 'watch_complete' || type === 'like' || type === 'save' || type === 'boost') {
      this.recentInteractions.push({ category, timestamp: Date.now() });
      if (this.recentInteractions.length > 20) {
        this.recentInteractions.shift();
      }
      current.consecutiveCount = (current.consecutiveCount || 0) + 1;
    } else if (type === 'demote') {
      current.consecutiveCount = 0;
      this.recentInteractions = this.recentInteractions.filter((i) => i.category !== category);
    }

    switch (type) {
      case 'watch_end':
      case 'watch_complete':
        current.score += 4;
        current.watchCompletions += 1;
        break;
      case 'like':
        current.score += 5;
        current.likes += 1;
        break;
      case 'save':
        current.score += 6;
        break;
      case 'comment':
        current.score += 6;
        current.comments += 1;
        break;
      case 'share':
        current.score += 7;
        current.shares += 1;
        break;
      case 'boost':
        current.score += 25;
        current.manualTuning = 'boost';
        current.consecutiveCount = Math.max(current.consecutiveCount, 2);
        break;
      case 'demote':
        current.score = Math.max(0, current.score - 30);
        current.manualTuning = 'demote';
        if (itemId) {
          this.notInterestedIds.add(itemId);
        }
        break;
    }

    this.saveToStorage();
    return current.consecutiveCount >= 2;
  }

  /**
   * Manual Action: "Show More Like This" (ऐसी वीडियो और दिखाएं)
   */
  public markShowMore(
    param1: ContentCategory | string,
    param2?: ContentCategory | string
  ): RecommendationFeedback {
    let category: ContentCategory = 'Travel';
    let itemId = '';

    if (ALL_CATEGORIES.includes(param1 as ContentCategory)) {
      category = param1 as ContentCategory;
      itemId = (param2 as string) || '';
    } else if (param2 && ALL_CATEGORIES.includes(param2 as ContentCategory)) {
      category = param2 as ContentCategory;
      itemId = param1;
    } else {
      category = (param1 as ContentCategory) || 'Travel';
    }

    this.recordInteraction(category, 'boost', itemId);
    return {
      type: 'boost',
      category,
      itemId,
      message: `Showing more ${category} reels!`,
    };
  }

  /**
   * Manual Action: "Not Interested" (कम दिखाएं)
   */
  public markNotInterested(
    param1: string | ContentCategory,
    param2?: ContentCategory | string
  ): RecommendationFeedback {
    let category: ContentCategory = 'Travel';
    let itemId = '';

    if (param2 && ALL_CATEGORIES.includes(param2 as ContentCategory)) {
      itemId = param1;
      category = param2 as ContentCategory;
    } else if (ALL_CATEGORIES.includes(param1 as ContentCategory)) {
      category = param1 as ContentCategory;
      itemId = (param2 as string) || '';
    } else {
      itemId = param1;
    }

    this.recordInteraction(category, 'demote', itemId);
    return {
      type: 'demote',
      category,
      itemId,
      message: `We'll show fewer ${category} reels.`,
    };
  }

  /**
   * Calculate personalized score for an item
   */
  public calculateScore(category: ContentCategory, id: string, likesCount: number = 0): number {
    if (this.notInterestedIds.has(id)) {
      return -9999;
    }

    const catData = this.affinity[category] || { score: 10, manualTuning: 'neutral' };
    let score = catData.score;

    if (catData.manualTuning === 'boost') {
      score += 100;
    } else if (catData.manualTuning === 'demote') {
      score -= 100;
    }

    // Add mild popularity factor (log scale so high likes don't completely overpower category)
    score += Math.log10(Math.max(1, likesCount)) * 2;

    return score;
  }

  /**
   * Personalized Feed Ordering:
   * Prioritize and show more Reels and Posts matching highest-viewed/liked categories.
   */
  public sortPosts(posts: Post[]): Post[] {
    return [...posts].sort((a, b) => {
      const scoreA = this.calculateScore(a.category, a.id, a.likesCount);
      const scoreB = this.calculateScore(b.category, b.id, b.likesCount);
      return scoreB - scoreA;
    });
  }

  /**
   * Personalized Reels Queue:
   * Keeps current reel at its index, and re-orders upcoming queue.
   * If a user watches or likes 2+ videos of a specific category, auto-load similar content next!
   */
  public getPersonalizedReelsQueue(
    reels: Reel[],
    currentIndex: number,
    forcedHotCategory?: ContentCategory | null
  ): Reel[] {
    if (reels.length <= 1) return reels;

    const hotCategory = forcedHotCategory ?? this.getHotCategory();

    // The reels up to currentIndex are fixed (already watched/navigated)
    const passedReels = reels.slice(0, currentIndex + 1);
    const upcoming = reels.slice(currentIndex + 1).filter((r) => !this.notInterestedIds.has(r.id));

    // If hot category detected (2+ watched/liked), prioritize that category in immediate next spots
    let sortedUpcoming: Reel[];
    if (hotCategory) {
      const hotReels = upcoming.filter((r) => r.category === hotCategory);
      const otherReels = upcoming
        .filter((r) => r.category !== hotCategory)
        .sort((a, b) => {
          return this.calculateScore(b.category, b.id, b.likesCount) - this.calculateScore(a.category, a.id, a.likesCount);
        });

      // Auto-load similar content next in scroll queue
      sortedUpcoming = [...hotReels, ...otherReels];
    } else {
      // General affinity sort
      sortedUpcoming = [...upcoming].sort((a, b) => {
        return this.calculateScore(b.category, b.id, b.likesCount) - this.calculateScore(a.category, a.id, a.likesCount);
      });
    }

    return [...passedReels, ...sortedUpcoming];
  }

  /**
   * Get top 3 categories by user affinity
   */
  public getTopCategories(): { category: ContentCategory; score: number }[] {
    return ALL_CATEGORIES.map((cat) => ({
      category: cat,
      score: this.affinity[cat]?.score || 0,
    })).sort((a, b) => b.score - a.score);
  }

  public resetAffinity() {
    this.affinity = { ...DEFAULT_AFFINITY };
    this.notInterestedIds.clear();
    this.recentInteractions = [];
    this.saveToStorage();
  }
}

export const recommendationEngine = new RecommendationEngine();
