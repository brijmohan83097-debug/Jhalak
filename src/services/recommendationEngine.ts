import {
  ContentCategory,
  Reel,
  Post,
  AffinityMap,
  CategoryAffinity,
  WatchTimeData,
  LanguageEngagementData,
  LanguageStat,
} from '../types';

const STORAGE_KEY = 'jhalak_recs_affinity_v1';
const NOT_INTERESTED_KEY = 'jhalak_recs_not_interested_ids';
const WATCH_TIME_KEY = 'jhalak_user_watch_time_v1';
const LANGUAGE_ENGAGEMENT_KEY = 'jhalak_language_engagement_v1';
const LAST_INTERACTED_CATEGORY_KEY = 'jhalak_recs_last_category_v1';

export const ALL_CATEGORIES: ContentCategory[] = [
  'Bhojpuri',
  'Comedy',
  'Tech',
  'Travel',
  'Music',
  'Fabrication/DIY',
  'Bollywood',
  'Food',
  'Fitness',
  'Regional Music',
  'South Indian',
  'Punjabi',
];

export interface RecommendationFeedback {
  type: 'boost' | 'demote';
  category: ContentCategory;
  itemId: string;
  message: string;
}

/**
 * Infer content category if not explicitly set
 */
export function inferCategory(item: {
  category?: ContentCategory;
  caption?: string;
  tags?: string[];
  audioTitle?: string;
  location?: string;
}): ContentCategory {
  if (item.category && ALL_CATEGORIES.includes(item.category)) {
    return item.category;
  }
  const text = `${item.caption || ''} ${(item.tags || []).join(' ')} ${item.audioTitle || ''} ${item.location || ''}`.toLowerCase();

  if (/comedy|funny|hasya|chhapra comedy|joke|laugh|hasan/i.test(text)) return 'Comedy';
  if (/food|litti|chokha|rasoi|swad|khana|recipe|mithai/i.test(text)) return 'Food';
  if (/bhojpuri|patna|bihar|buxar|arrah|chhapra|khesari|pawan|purvanchal|gorakhpur|kajari|jhumar|biraha|chhath|bhojpur/i.test(text)) return 'Bhojpuri';
  if (/bengali|bangla|kolkata|durga|dhak|rabindra/i.test(text)) return 'Regional Music';
  if (/punjabi|amritsar|bhangra|dhol|gidda|singh/i.test(text)) return 'Punjabi';
  if (/south indian|tamil|chennai|telugu|kerala|chenda|carnatic/i.test(text)) return 'South Indian';
  if (/bollywood|mumbai|film|hindi/i.test(text)) return 'Bollywood';
  if (/tech|coding|developer|gadget|ai|mobile/i.test(text)) return 'Tech';
  if (/fitness|gym|workout|yoga/i.test(text)) return 'Fitness';
  if (/diy|craft|fabrication|wood|tool/i.test(text)) return 'Fabrication/DIY';
  if (/dance|song|music|sangeet|beat|dj/i.test(text)) return 'Music';

  return 'Bhojpuri';
}

/**
 * Check if a post or reel was newly created by the user
 */
export function isNewlyCreated(item: {
  isUserCreated?: boolean;
  createdAt?: number;
  timestamp?: string;
  id?: string;
}): boolean {
  if (item.isUserCreated) return true;
  if (item.timestamp === 'Just now' || item.timestamp?.includes('seconds ago') || item.timestamp?.includes('m ago')) return true;
  if (item.createdAt && item.createdAt > 1700000000000) return true;
  return false;
}

const DEFAULT_AFFINITY: Record<ContentCategory, CategoryAffinity> = {
  Bhojpuri: { score: 35, likes: 3, comments: 1, shares: 2, watchCompletions: 2, watchTimeSeconds: 45, consecutiveCount: 1, manualTuning: 'neutral' },
  'Regional Music': { score: 32, likes: 2, comments: 1, shares: 1, watchCompletions: 1, watchTimeSeconds: 38, consecutiveCount: 1, manualTuning: 'neutral' },
  'South Indian': { score: 30, likes: 2, comments: 1, shares: 1, watchCompletions: 1, watchTimeSeconds: 35, consecutiveCount: 0, manualTuning: 'neutral' },
  Punjabi: { score: 28, likes: 2, comments: 0, shares: 1, watchCompletions: 1, watchTimeSeconds: 28, consecutiveCount: 0, manualTuning: 'neutral' },
  Bollywood: { score: 22, likes: 1, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 15, consecutiveCount: 0, manualTuning: 'neutral' },
  Music: { score: 20, likes: 1, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 12, consecutiveCount: 0, manualTuning: 'neutral' },
  Travel: { score: 18, likes: 1, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 10, consecutiveCount: 0, manualTuning: 'neutral' },
  Comedy: { score: 16, likes: 0, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 8, consecutiveCount: 0, manualTuning: 'neutral' },
  Tech: { score: 12, likes: 0, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 5, consecutiveCount: 0, manualTuning: 'neutral' },
  Food: { score: 12, likes: 0, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 5, consecutiveCount: 0, manualTuning: 'neutral' },
  Fitness: { score: 10, likes: 0, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 4, consecutiveCount: 0, manualTuning: 'neutral' },
  'Fabrication/DIY': { score: 10, likes: 0, comments: 0, shares: 0, watchCompletions: 0, watchTimeSeconds: 4, consecutiveCount: 0, manualTuning: 'neutral' },
};

const DEFAULT_WATCH_TIME: WatchTimeData = {
  totalSeconds: 125,
  byCategory: {
    Bhojpuri: 45,
    'Regional Music': 38,
    'South Indian': 35,
    Punjabi: 28,
    Bollywood: 15,
    Music: 12,
    Travel: 10,
    Comedy: 8,
  },
  byLanguage: {
    bho: 45,
    bn: 38,
    ta: 35,
    pa: 28,
    hi: 20,
    en: 10,
  },
  byPost: {},
  lastUpdated: Date.now(),
};

const DEFAULT_LANGUAGE_ENGAGEMENT: LanguageEngagementData = {
  bho: { code: 'bho', name: 'Bhojpuri', watchTimeSeconds: 45, interactionsCount: 6, score: 75, lastEngaged: Date.now() },
  bn: { code: 'bn', name: 'Bengali', watchTimeSeconds: 38, interactionsCount: 4, score: 62, lastEngaged: Date.now() },
  ta: { code: 'ta', name: 'Tamil / South Indian', watchTimeSeconds: 35, interactionsCount: 4, score: 58, lastEngaged: Date.now() },
  pa: { code: 'pa', name: 'Punjabi', watchTimeSeconds: 28, interactionsCount: 3, score: 48, lastEngaged: Date.now() },
  hi: { code: 'hi', name: 'Hindi', watchTimeSeconds: 20, interactionsCount: 2, score: 35, lastEngaged: Date.now() },
  en: { code: 'en', name: 'English', watchTimeSeconds: 10, interactionsCount: 1, score: 18, lastEngaged: Date.now() },
};

/**
 * Infer Indian regional language or dialect code from item metadata
 */
export function inferLanguage(item: {
  language?: string;
  category?: string;
  caption?: string;
  location?: string;
  tags?: string[];
  audioTitle?: string;
}): string {
  if (item.language) return item.language;
  const text = `${item.category || ''} ${item.caption || ''} ${item.location || ''} ${(item.tags || []).join(' ')} ${item.audioTitle || ''}`.toLowerCase();

  // Bhojpuri
  if (
    item.category === 'Bhojpuri' ||
    /bhojpuri|patna|bihar|buxar|arrah|chhapra|khesari|pawan|purvanchal|litti|bhojpur/i.test(text)
  ) {
    return 'bho';
  }
  // Bengali
  if (
    item.category === 'Regional Music' ||
    /bengali|bangla|kolkata|calcutta|durga|dhak|princep|rabindra|sundarbans|howrah|dhaak/i.test(text)
  ) {
    return 'bn';
  }
  // South Indian (Tamil / Telugu / Malayalam / Kannada)
  if (
    item.category === 'South Indian' ||
    /south indian|tamil|chennai|madurai|telugu|hyderabad|chenda|kerala|kochi|kannada|bengaluru|melam|carnatic/i.test(text)
  ) {
    return 'ta';
  }
  // Punjabi
  if (
    item.category === 'Punjabi' ||
    /punjabi|punjab|amritsar|bhangra|dhol|chandigarh|gidda|gurmukhi|boliyan|singh/i.test(text)
  ) {
    return 'pa';
  }
  // Marathi
  if (/marathi|pune|mumbai|lavani|nashik|nagpur|shivaji|dhol tasha/i.test(text)) {
    return 'mr';
  }
  // Bollywood / Hindi
  if (
    item.category === 'Bollywood' ||
    /hindi|bollywood|delhi|lucknow|banaras|varanasi|ncr/i.test(text)
  ) {
    return 'hi';
  }
  // Gujarati
  if (/gujarat|ahmedabad|garba|dandiya|surat|vadodara/i.test(text)) {
    return 'gu';
  }
  return 'hi';
}

class RecommendationEngine {
  private affinity: AffinityMap = { ...DEFAULT_AFFINITY };
  private notInterestedIds: Set<string> = new Set();
  private watchTime: WatchTimeData = { ...DEFAULT_WATCH_TIME };
  private languageEngagement: LanguageEngagementData = { ...DEFAULT_LANGUAGE_ENGAGEMENT };
  private lastInteractedCategory: ContentCategory = 'Bhojpuri';
  // Rolling list of recent categories interacted with (for consecutive count detection)
  private recentInteractions: { category: ContentCategory; timestamp: number }[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedAffinity = localStorage.getItem(STORAGE_KEY);
      if (storedAffinity) {
        this.affinity = { ...DEFAULT_AFFINITY, ...JSON.parse(storedAffinity) };
      }

      const storedDislikes = localStorage.getItem(NOT_INTERESTED_KEY);
      if (storedDislikes) {
        this.notInterestedIds = new Set(JSON.parse(storedDislikes));
      }

      const storedWatchTime = localStorage.getItem(WATCH_TIME_KEY);
      if (storedWatchTime) {
        const parsed = JSON.parse(storedWatchTime);
        this.watchTime = {
          totalSeconds: parsed.totalSeconds ?? DEFAULT_WATCH_TIME.totalSeconds,
          byCategory: { ...DEFAULT_WATCH_TIME.byCategory, ...(parsed.byCategory || {}) },
          byLanguage: { ...DEFAULT_WATCH_TIME.byLanguage, ...(parsed.byLanguage || {}) },
          byPost: { ...(parsed.byPost || {}) },
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
      }

      const storedLang = localStorage.getItem(LANGUAGE_ENGAGEMENT_KEY);
      if (storedLang) {
        this.languageEngagement = { ...DEFAULT_LANGUAGE_ENGAGEMENT, ...JSON.parse(storedLang) };
      }

      const storedLastCategory = localStorage.getItem(LAST_INTERACTED_CATEGORY_KEY) as ContentCategory | null;
      if (storedLastCategory && ALL_CATEGORIES.includes(storedLastCategory)) {
        this.lastInteractedCategory = storedLastCategory;
      }
    } catch {
      // fallback to defaults
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.affinity));
      localStorage.setItem(NOT_INTERESTED_KEY, JSON.stringify(Array.from(this.notInterestedIds)));
      localStorage.setItem(WATCH_TIME_KEY, JSON.stringify(this.watchTime));
      localStorage.setItem(LANGUAGE_ENGAGEMENT_KEY, JSON.stringify(this.languageEngagement));
      localStorage.setItem(LAST_INTERACTED_CATEGORY_KEY, this.lastInteractedCategory);
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
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in recommendation listener:', err);
      }
    });
  }

  public getAffinity(): AffinityMap {
    return { ...this.affinity };
  }

  public getWatchTimeStats(): WatchTimeData {
    return {
      totalSeconds: this.watchTime.totalSeconds,
      byCategory: { ...this.watchTime.byCategory },
      byLanguage: { ...this.watchTime.byLanguage },
      byPost: { ...this.watchTime.byPost },
      lastUpdated: this.watchTime.lastUpdated,
    };
  }

  public getLanguageEngagement(): LanguageEngagementData {
    return { ...this.languageEngagement };
  }

  public isNotInterested(id: string): boolean {
    return this.notInterestedIds.has(id);
  }

  /**
   * Record exact watch time in seconds for a specific post or reel.
   * Personalizes category affinity, post repeat count, and regional language engagement.
   */
  public recordWatchTime(
    item: {
      id: string;
      category?: ContentCategory;
      caption?: string;
      language?: string;
      tags?: string[];
      location?: string;
      audioTitle?: string;
    },
    seconds: number
  ) {
    if (!seconds || seconds <= 0) return;
    const clampedSecs = Math.min(Math.round(seconds), 300);
    const category: ContentCategory = inferCategory(item);
    const lang = inferLanguage(item);

    this.lastInteractedCategory = category;

    // 1. Update overall watch time counters
    this.watchTime.totalSeconds += clampedSecs;
    this.watchTime.byCategory[category] = (this.watchTime.byCategory[category] || 0) + clampedSecs;
    this.watchTime.byLanguage[lang] = (this.watchTime.byLanguage[lang] || 0) + clampedSecs;
    this.watchTime.byPost[item.id] = (this.watchTime.byPost[item.id] || 0) + clampedSecs;
    this.watchTime.lastUpdated = Date.now();

    // 2. Update Language Engagement Score
    if (!this.languageEngagement[lang]) {
      this.languageEngagement[lang] = {
        code: lang,
        name: lang.toUpperCase(),
        watchTimeSeconds: 0,
        interactionsCount: 0,
        score: 10,
        lastEngaged: Date.now(),
      };
    }
    const langEntry = this.languageEngagement[lang];
    langEntry.watchTimeSeconds += clampedSecs;
    langEntry.score += Math.round(clampedSecs * 1.5);
    langEntry.lastEngaged = Date.now();

    // 3. Update Category Affinity
    if (!this.affinity[category]) {
      this.affinity[category] = {
        score: 10,
        likes: 0,
        comments: 0,
        shares: 0,
        watchCompletions: 0,
        watchTimeSeconds: 0,
        consecutiveCount: 0,
        manualTuning: 'neutral',
      };
    }
    const catEntry = this.affinity[category];
    catEntry.watchTimeSeconds = (catEntry.watchTimeSeconds || 0) + clampedSecs;
    catEntry.score += Math.round(clampedSecs * 1.8);

    // If watched for more than 3s, count as engaged watch and add to recent interactions
    if (clampedSecs >= 3) {
      catEntry.consecutiveCount = (catEntry.consecutiveCount || 0) + 1;
      this.recentInteractions.push({ category, timestamp: Date.now() });
      if (this.recentInteractions.length > 25) {
        this.recentInteractions.shift();
      }
    }

    this.saveToStorage();
  }

  /**
   * Record explicit language interaction (like, comment, share, save)
   */
  public recordLanguageInteraction(
    languageCode: string,
    actionType: 'like' | 'comment' | 'share' | 'save'
  ) {
    if (!languageCode) return;
    const lang = languageCode.toLowerCase();
    if (!this.languageEngagement[lang]) {
      this.languageEngagement[lang] = {
        code: lang,
        name: lang.toUpperCase(),
        watchTimeSeconds: 0,
        interactionsCount: 0,
        score: 10,
        lastEngaged: Date.now(),
      };
    }
    const entry = this.languageEngagement[lang];
    entry.interactionsCount += 1;
    const scoreDeltas = { like: 8, comment: 12, share: 15, save: 10 };
    entry.score += scoreDeltas[actionType] || 5;
    entry.lastEngaged = Date.now();

    this.saveToStorage();
  }

  /**
   * Get the primary category the user has interacted with or watched recently.
   * Prioritizes recent interactions (Bhojpuri, Comedy, etc.)
   */
  public getHotCategory(): ContentCategory | null {
    const categoryCounts: Partial<Record<ContentCategory, number>> = {};
    const cutoff = Date.now() - 45 * 60 * 1000; // within 45 minutes
    const valid = this.recentInteractions.filter((item) => item.timestamp > cutoff);

    // 1. Check recent interactions in last 45m
    if (valid.length > 0) {
      for (const item of valid) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
      let topCategory: ContentCategory = valid[valid.length - 1].category;
      let topCount = 0;
      for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > topCount) {
          topCount = count;
          topCategory = cat as ContentCategory;
        }
      }
      return topCategory;
    }

    // 2. Check consecutive count or highest scoring affinity
    let highestScore = 0;
    let highestCategory: ContentCategory | null = null;
    for (const cat of ALL_CATEGORIES) {
      const aff = this.affinity[cat];
      if (aff && aff.consecutiveCount >= 1 && aff.score > highestScore) {
        highestScore = aff.score;
        highestCategory = cat;
      }
    }
    if (highestCategory) return highestCategory;

    // 3. Fallback to last interacted category
    return this.lastInteractedCategory || 'Bhojpuri';
  }

  /**
   * Record interaction: watch_end, watch_complete, like, comment, share, save, boost, demote
   */
  public recordInteraction(
    category: ContentCategory,
    type: 'watch_end' | 'watch_complete' | 'like' | 'comment' | 'share' | 'save' | 'boost' | 'demote',
    itemId?: string
  ): boolean {
    this.lastInteractedCategory = category;

    if (!this.affinity[category]) {
      this.affinity[category] = {
        score: 10,
        likes: 0,
        comments: 0,
        shares: 0,
        watchCompletions: 0,
        watchTimeSeconds: 0,
        consecutiveCount: 0,
        manualTuning: 'neutral',
      };
    }

    const current = this.affinity[category];

    if (
      type === 'watch_end' ||
      type === 'watch_complete' ||
      type === 'like' ||
      type === 'save' ||
      type === 'comment' ||
      type === 'share' ||
      type === 'boost'
    ) {
      this.recentInteractions.push({ category, timestamp: Date.now() });
      if (this.recentInteractions.length > 25) {
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
        current.score += 15;
        current.watchCompletions += 1;
        break;
      case 'like':
        current.score += 16;
        current.likes += 1;
        break;
      case 'save':
        current.score += 18;
        break;
      case 'comment':
        current.score += 20;
        current.comments += 1;
        break;
      case 'share':
        current.score += 25;
        current.shares += 1;
        break;
      case 'boost':
        current.score += 45;
        current.manualTuning = 'boost';
        current.consecutiveCount = Math.max(current.consecutiveCount, 2);
        break;
      case 'demote':
        current.score = Math.max(0, current.score - 40);
        current.manualTuning = 'demote';
        if (itemId) {
          this.notInterestedIds.add(itemId);
        }
        break;
    }

    this.saveToStorage();
    return current.consecutiveCount >= 1;
  }

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
   * Calculate comprehensive personalized recommendation score:
   * 1. Category affinity score
   * 2. User watch time in category
   * 3. Language engagement score & watch time in language
   * 4. Media type preference (video engagement)
   * 5. Popularity & freshness
   */
  public calculateScore(
    category: ContentCategory = 'Bhojpuri',
    id: string,
    likesCount: number = 0,
    language?: string,
    isVideo: boolean = false
  ): number {
    if (this.notInterestedIds.has(id)) {
      return -9999;
    }

    const catData = this.affinity[category] || { score: 10, manualTuning: 'neutral' };
    let score = catData.score;

    if (catData.manualTuning === 'boost') {
      score += 140;
    } else if (catData.manualTuning === 'demote') {
      score -= 140;
    }

    // 1. Hot Category & Recently Interacted Genre Boost (Prioritizes similar genre)
    const hotCat = this.getHotCategory();
    if (category === hotCat) {
      score += 110;
    } else if (category === this.lastInteractedCategory) {
      score += 65;
    }

    // 2. Bhojpuri Core Platform Bonus
    if (category === 'Bhojpuri') {
      score += 25;
    }

    // 3. Watch Time Category Factor
    const catWatchTime = this.watchTime.byCategory[category] || 0;
    score += Math.min(100, catWatchTime * 2.2);

    // 4. Language Engagement Factor
    if (language) {
      const langStat = this.languageEngagement[language.toLowerCase()];
      if (langStat) {
        score += Math.min(90, langStat.score * 0.8 + langStat.watchTimeSeconds * 1.2);
      }
    }

    // 5. Multimedia Video Bonus
    if (isVideo) {
      score += 25;
    }

    // 6. Repeated view soft-damping
    const postWatchTime = this.watchTime.byPost[id] || 0;
    if (postWatchTime > 60) {
      score -= 15;
    }

    // 7. Mild popularity factor (log-scaled)
    score += Math.log10(Math.max(1, likesCount)) * 3;

    return score;
  }

  /**
   * Personalized Feed Ordering:
   * 1. Always show newly created reels and posts at the very top (first item in the feed array via unshift / reverse chronological order).
   * 2. If user interacts with or watches Bhojpuri / specific category reels, prioritize and recommend similar genre videos higher up in the feed.
   */
  public sortPosts(posts: Post[], activeLanguage?: string): Post[] {
    // 1. Separate newly created posts: MUST ALWAYS be at the very top (unshift / reverse chronological order)
    const newlyCreated: Post[] = [];
    const regularPosts: Post[] = [];

    posts.forEach((p) => {
      if (isNewlyCreated(p)) {
        newlyCreated.push(p);
      } else {
        regularPosts.push(p);
      }
    });

    // Newly created posts are sorted in reverse chronological order (newest first)
    newlyCreated.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 2. Smart recommendation logic for regular feed posts
    const hotCat = this.getHotCategory();

    const sortedRegular = [...regularPosts].sort((a, b) => {
      const catA = inferCategory(a);
      const catB = inferCategory(b);
      const langA = inferLanguage(a);
      const langB = inferLanguage(b);

      let scoreA = this.calculateScore(catA, a.id, a.likesCount, langA, a.mediaType === 'video');
      let scoreB = this.calculateScore(catB, b.id, b.likesCount, langB, b.mediaType === 'video');

      // Prioritize similar genre videos higher up in the feed
      if (hotCat) {
        if (catA === hotCat) scoreA += 100;
        if (catB === hotCat) scoreB += 100;
      }

      // Active app language priority
      if (activeLanguage) {
        if (langA === activeLanguage.toLowerCase()) scoreA += 40;
        if (langB === activeLanguage.toLowerCase()) scoreB += 40;
      }

      return scoreB - scoreA;
    });

    // Newly created posts are ALWAYS at the very top (first items in feed array)
    return [...newlyCreated, ...sortedRegular];
  }

  /**
   * Personalized Reels Queue based on real-time watch time and affinity:
   * 1. Always show newly created reels at the very top (first item in the queue array via unshift / reverse chronological order).
   * 2. Prioritize similar genre reels (e.g. Bhojpuri or watched category) higher up in the queue.
   */
  public getPersonalizedReelsQueue(
    reels: Reel[],
    currentIndex: number = 0,
    forcedHotCategory?: ContentCategory | null
  ): Reel[] {
    if (reels.length <= 1) return reels;

    const unblocked = reels.filter((r) => !this.notInterestedIds.has(r.id));

    // 1. Separate newly created reels so they are ALWAYS at the very top
    const newlyCreated: Reel[] = [];
    const regularReels: Reel[] = [];

    unblocked.forEach((r) => {
      if (isNewlyCreated(r)) {
        newlyCreated.push(r);
      } else {
        regularReels.push(r);
      }
    });

    // Reverse chronological order for newly created reels (newest first)
    newlyCreated.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 2. Recommend similar genre videos higher up for regular reels
    const hotCategory = forcedHotCategory ?? this.getHotCategory();

    let sortedRegular: Reel[];
    if (hotCategory) {
      const hotReels = regularReels
        .filter((r) => inferCategory(r) === hotCategory)
        .sort((a, b) => {
          const sA = this.calculateScore(inferCategory(a), a.id, a.likesCount, inferLanguage(a), true);
          const sB = this.calculateScore(inferCategory(b), b.id, b.likesCount, inferLanguage(b), true);
          return sB - sA;
        });

      const otherReels = regularReels
        .filter((r) => inferCategory(r) !== hotCategory)
        .sort((a, b) => {
          const sA = this.calculateScore(inferCategory(a), a.id, a.likesCount, inferLanguage(a), true);
          const sB = this.calculateScore(inferCategory(b), b.id, b.likesCount, inferLanguage(b), true);
          return sB - sA;
        });

      sortedRegular = [...hotReels, ...otherReels];
    } else {
      sortedRegular = [...regularReels].sort((a, b) => {
        const sA = this.calculateScore(inferCategory(a), a.id, a.likesCount, inferLanguage(a), true);
        const sB = this.calculateScore(inferCategory(b), b.id, b.likesCount, inferLanguage(b), true);
        return sB - sA;
      });
    }

    // Always return newly created reels at the very top (first items in queue array)
    return [...newlyCreated, ...sortedRegular];
  }

  public getTopCategories(): { category: ContentCategory; score: number; watchTime: number }[] {
    return ALL_CATEGORIES.map((cat) => ({
      category: cat,
      score: this.affinity[cat]?.score || 0,
      watchTime: this.watchTime.byCategory[cat] || 0,
    })).sort((a, b) => b.score - a.score);
  }

  public getTopLanguages(): LanguageStat[] {
    return Object.values(this.languageEngagement).sort(
      (a, b) => b.watchTimeSeconds * 1.5 + b.score - (a.watchTimeSeconds * 1.5 + a.score)
    );
  }

  public resetAffinity() {
    this.affinity = { ...DEFAULT_AFFINITY };
    this.notInterestedIds.clear();
    this.recentInteractions = [];
    this.watchTime = { ...DEFAULT_WATCH_TIME, totalSeconds: 0, byPost: {} };
    this.languageEngagement = { ...DEFAULT_LANGUAGE_ENGAGEMENT };
    this.saveToStorage();
  }
}

export const recommendationEngine = new RecommendationEngine();
