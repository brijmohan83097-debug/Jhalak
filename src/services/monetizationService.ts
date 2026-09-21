/**
 * monetizationService.ts
 * Manages Creator Monetization Policy (2,000 followers & 2,000 watch hours),
 * Creator Dashboard progress tracking, and Daily Upload Limits (Max 3 reels & 3 photos per 24 hours).
 */

export const MONETIZATION_POLICY = {
  TARGET_FOLLOWERS: 2000,
  TARGET_WATCH_HOURS: 2000,
  MAX_DAILY_REELS: 3,
  MAX_DAILY_PHOTOS: 3,
  WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours
};

interface DailyUploadsRecord {
  photos: number[]; // Timestamps in ms
  reels: number[]; // Timestamps in ms
}

const DAILY_UPLOADS_KEY_PREFIX = 'jhalak_daily_uploads_v2_';
const CREATOR_STATS_KEY_PREFIX = 'jhalak_creator_stats_v2_';

/**
 * Get active uploads within the last 24 hours for a user
 */
export function getDailyUploads(userId: string): DailyUploadsRecord {
  const normalizedId = (userId || 'user-default').trim().toLowerCase();
  const key = `${DAILY_UPLOADS_KEY_PREFIX}${normalizedId}`;
  const now = Date.now();
  const windowStart = now - MONETIZATION_POLICY.WINDOW_MS;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { photos: [], reels: [] };
    }
    const parsed: DailyUploadsRecord = JSON.parse(raw);
    const validPhotos = (parsed.photos || []).filter((ts) => ts > windowStart);
    const validReels = (parsed.reels || []).filter((ts) => ts > windowStart);

    // Save cleaned list if any expired
    if (validPhotos.length !== (parsed.photos || []).length || validReels.length !== (parsed.reels || []).length) {
      localStorage.setItem(key, JSON.stringify({ photos: validPhotos, reels: validReels }));
    }

    return { photos: validPhotos, reels: validReels };
  } catch {
    return { photos: [], reels: [] };
  }
}

/**
 * Check upload quota (Unlimited uploads allowed - no daily restrictions)
 */
export function checkDailyLimit(
  _userId: string,
  _type: 'photo' | 'reel'
): {
  allowed: boolean;
  currentCount: number;
  max: number;
  remaining: number;
  resetInMs: number;
} {
  return {
    allowed: true,
    currentCount: 0,
    max: Infinity,
    remaining: Infinity,
    resetInMs: 0,
  };
}

/**
 * Record a newly published photo or reel
 */
export function recordDailyUpload(userId: string, type: 'photo' | 'reel'): void {
  const normalizedId = (userId || 'user-default').trim().toLowerCase();
  const key = `${DAILY_UPLOADS_KEY_PREFIX}${normalizedId}`;
  const uploads = getDailyUploads(userId);
  const now = Date.now();

  if (type === 'photo') {
    uploads.photos.push(now);
  } else {
    uploads.reels.push(now);
  }

  try {
    localStorage.setItem(key, JSON.stringify(uploads));
  } catch {
    // Silently handled
  }
}

/**
 * Format milliseconds into human readable hours & minutes (e.g., "5h 30m" or "45m")
 */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return 'Available now';
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export interface CreatorMonetizationStats {
  followers: number;
  targetFollowers: number;
  followersPct: number;
  followersRemaining: number;
  watchHours: number;
  targetWatchHours: number;
  watchHoursPct: number;
  watchHoursRemaining: number;
  isUnlocked: boolean;
}

/**
 * Get Creator Monetization stats (Followers vs 2,000 and Watch Hours vs 2,000)
 */
export function getCreatorMonetizationStats(
  userId: string,
  userFollowersCount?: number
): CreatorMonetizationStats {
  const normalizedId = (userId || 'user-default').trim().toLowerCase();
  const key = `${CREATOR_STATS_KEY_PREFIX}${normalizedId}`;

  const targetFollowers = MONETIZATION_POLICY.TARGET_FOLLOWERS;
  const targetWatchHours = MONETIZATION_POLICY.TARGET_WATCH_HOURS;

  let storedWatchHours: number | null = null;
  let customFollowers: number | null = null;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.watchHours === 'number') {
        storedWatchHours = parsed.watchHours;
      }
      if (typeof parsed.customFollowers === 'number') {
        customFollowers = parsed.customFollowers;
      }
    }
  } catch {
    // fallback
  }

  // Determine followers
  const followers =
    customFollowers !== null
      ? customFollowers
      : typeof userFollowersCount === 'number'
      ? userFollowersCount
      : 0;

  // Determine watch hours
  let watchHours = storedWatchHours !== null ? storedWatchHours : 0;
  if (storedWatchHours === null) {
    // Default initial baseline: if followers >= 2,000, start unlocked at 2,150 hrs;
    // if lower, estimate proportionally
    if (followers >= 2000) {
      watchHours = 2150;
    } else if (followers > 0) {
      watchHours = Math.min(1850, Math.round(followers * 0.95));
    } else {
      watchHours = 0;
    }
  }

  const followersRemaining = Math.max(0, targetFollowers - followers);
  const watchHoursRemaining = Math.max(0, targetWatchHours - watchHours);

  const followersPct = Math.min(100, Math.round((followers / targetFollowers) * 100));
  const watchHoursPct = Math.min(100, Math.round((watchHours / targetWatchHours) * 100));

  const isUnlocked = followers >= targetFollowers && watchHours >= targetWatchHours;

  return {
    followers,
    targetFollowers,
    followersPct,
    followersRemaining,
    watchHours,
    targetWatchHours,
    watchHoursPct,
    watchHoursRemaining,
    isUnlocked,
  };
}

/**
 * Update / set creator stats (used for testing or watch time accumulation)
 */
export function setCreatorStats(
  userId: string,
  updates: { watchHours?: number; customFollowers?: number }
): void {
  const normalizedId = (userId || 'user-default').trim().toLowerCase();
  const key = `${CREATOR_STATS_KEY_PREFIX}${normalizedId}`;

  try {
    const existingRaw = localStorage.getItem(key);
    const current = existingRaw ? JSON.parse(existingRaw) : {};
    if (typeof updates.watchHours === 'number') {
      current.watchHours = updates.watchHours;
    }
    if (typeof updates.customFollowers === 'number') {
      current.customFollowers = updates.customFollowers;
    }
    localStorage.setItem(key, JSON.stringify(current));
  } catch {
    // Silently handled
  }
}
