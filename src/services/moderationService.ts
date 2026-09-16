const BLOCKED_USERS_KEY = 'jhalak_blocked_users_v1';
const REPORTED_ITEMS_KEY = 'jhalak_reported_items_v1';
const REPORT_COUNTS_KEY = 'jhalak_report_counts_v1';
const HIDDEN_BY_MOD_KEY = 'jhalak_hidden_by_moderation_v1';
const PERMANENTLY_DELETED_KEY = 'jhalak_permanently_deleted_posts_v1';

export type ReportReason =
  | 'Spam or Scam'
  | 'Inappropriate Content'
  | 'Harassment or Bullying'
  | 'Hate Speech'
  | 'False Information'
  | 'Violence or Dangerous Goods'
  | 'Intellectual Property Violation';

export const REPORT_REASONS: { id: ReportReason; label: string; hindiLabel: string; icon: string }[] = [
  { id: 'Spam or Scam', label: 'Spam or Scam', hindiLabel: 'स्पैम या धोखाधड़ी', icon: '🚨' },
  { id: 'Inappropriate Content', label: 'Inappropriate Content', hindiLabel: 'अनुचित या अश्लील सामग्री', icon: '🔞' },
  { id: 'Harassment or Bullying', label: 'Harassment or Bullying', hindiLabel: 'उत्पीड़न या धमकी', icon: '🛑' },
  { id: 'Hate Speech', label: 'Hate Speech', hindiLabel: 'नफ़रत फैलाने वाला भाषण', icon: '⚠️' },
  { id: 'False Information', label: 'False Information', hindiLabel: 'झूठी या भ्रामक जानकारी', icon: '❌' },
  { id: 'Violence or Dangerous Goods', label: 'Violence or Dangerous Goods', hindiLabel: 'हिंसा या खतरनाक चीजें', icon: '⚔️' },
  { id: 'Intellectual Property Violation', label: 'Copyright / IP Violation', hindiLabel: 'कॉपीराइट उल्लंघन', icon: '©️' },
];

export interface ReportedRecord {
  id: string;
  type: 'post' | 'reel';
  username: string;
  reason: ReportReason | string;
  timestamp: number;
}

export interface ReportedItemAggregate {
  id: string;
  type: 'post' | 'reel';
  username: string;
  reasons: string[];
  reportCount: number;
  isHiddenByModeration: boolean;
  latestTimestamp: number;
}

// Banned words list for Automatic Text Moderation:
// Covers sexually explicit, severe profanity, hate speech, and violent threats.
const BANNED_PATTERNS: RegExp[] = [
  // Sexually explicit / adult content / nudity
  /\b(porn|porno|pornography|xxx|nude|nudes|nudity|naked|boobs|penis|vagina|cock|dick|pussy|slut|whore|blowjob|anal|milf|dildo|nsfw|sexvideo|sexpic)\b/i,
  // Severe abusive / slurs / profanity (English & Hindi common abusive words)
  /\b(fuck|fucking|fucker|motherfucker|bitch|bastard|asshole|cunt|chutiya|bhenchod|madarchod|gaand|bhosdike|harami|kamina|kutta|randi|lauda|lodu)\b/i,
  // Hate speech / violence / incitement
  /\b(kill\s*yourself|die\s*bitch|nigger|faggot|rape|rapist|terrorist|jihadist|genocide)\b/i,
];

class ModerationService {
  private blockedUsers: Set<string> = new Set();
  private reportedIds: Set<string> = new Set();
  private reportsHistory: ReportedRecord[] = [];
  private reportCounts: Record<string, number> = {};
  private hiddenByModeration: Set<string> = new Set();
  private permanentlyDeletedIds: Set<string> = new Set();
  private listeners: (() => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const blocked = localStorage.getItem(BLOCKED_USERS_KEY);
      if (blocked) {
        this.blockedUsers = new Set(JSON.parse(blocked));
      }

      const reported = localStorage.getItem(REPORTED_ITEMS_KEY);
      if (reported) {
        const parsed: ReportedRecord[] = JSON.parse(reported);
        this.reportsHistory = parsed;
        this.reportedIds = new Set(parsed.map((r) => r.id));
      }

      const counts = localStorage.getItem(REPORT_COUNTS_KEY);
      if (counts) {
        this.reportCounts = JSON.parse(counts);
      }

      const hidden = localStorage.getItem(HIDDEN_BY_MOD_KEY);
      if (hidden) {
        this.hiddenByModeration = new Set(JSON.parse(hidden));
      }

      const deleted = localStorage.getItem(PERMANENTLY_DELETED_KEY);
      if (deleted) {
        this.permanentlyDeletedIds = new Set(JSON.parse(deleted));
      }
    } catch {
      // ignore
    }
  }

  private save() {
    try {
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(Array.from(this.blockedUsers)));
      localStorage.setItem(REPORTED_ITEMS_KEY, JSON.stringify(this.reportsHistory));
      localStorage.setItem(REPORT_COUNTS_KEY, JSON.stringify(this.reportCounts));
      localStorage.setItem(HIDDEN_BY_MOD_KEY, JSON.stringify(Array.from(this.hiddenByModeration)));
      localStorage.setItem(PERMANENTLY_DELETED_KEY, JSON.stringify(Array.from(this.permanentlyDeletedIds)));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * 1. Automatic Text Moderation (Banned Words Filter)
   * Validates caption or comment text against banned words.
   * Returns isValid: false and the reason if violations exist.
   */
  public validateContent(text: string): { isValid: boolean; matchedWord?: string } {
    if (!text || !text.trim()) {
      return { isValid: true };
    }

    const clean = text
      .toLowerCase()
      // normalize simple leetspeak
      .replace(/[@]/g, 'a')
      .replace(/[$]/g, 's')
      .replace(/[0]/g, 'o')
      .replace(/[1!]/g, 'i')
      .replace(/[*_~`]/g, '');

    for (const pattern of BANNED_PATTERNS) {
      const match = clean.match(pattern);
      if (match) {
        return {
          isValid: false,
          matchedWord: match[0],
        };
      }
    }

    return { isValid: true };
  }

  public isUserBlocked(username: string): boolean {
    if (!username) return false;
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    return this.blockedUsers.has(clean);
  }

  public isItemReported(id: string): boolean {
    return this.reportedIds.has(id) || this.hiddenByModeration.has(id) || this.permanentlyDeletedIds.has(id);
  }

  public isItemHiddenByModeration(id: string): boolean {
    return this.hiddenByModeration.has(id) || (this.reportCounts[id] || 0) >= 3;
  }

  public isItemPermanentlyDeleted(id: string): boolean {
    return this.permanentlyDeletedIds.has(id);
  }

  public getReportCount(id: string): number {
    return this.reportCounts[id] || 0;
  }

  public blockUser(username: string, _reason?: string) {
    if (!username) return;
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    this.blockedUsers.add(clean);
    this.save();
  }

  public unblockUser(username: string) {
    if (!username) return;
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    this.blockedUsers.delete(clean);
    this.save();
  }

  /**
   * 2. Auto-Hide Posts on Multiple Reports (threshold = 3)
   */
  public reportItem(item: {
    id: string;
    type: 'post' | 'reel';
    username: string;
    reason: string;
  }) {
    this.reportedIds.add(item.id);
    this.reportsHistory.push({
      ...item,
      timestamp: Date.now(),
    });

    const newCount = (this.reportCounts[item.id] || 0) + 1;
    this.reportCounts[item.id] = newCount;

    // If report count reaches 3 or more, auto-hide by moderation
    if (newCount >= 3) {
      this.hiddenByModeration.add(item.id);
    }

    this.save();
  }

  /**
   * Get all aggregated reported items for the Admin Moderation Dashboard
   */
  public getReportedAggregates(): ReportedItemAggregate[] {
    const map = new Map<string, ReportedItemAggregate>();

    for (const record of this.reportsHistory) {
      // Don't show permanently deleted items
      if (this.permanentlyDeletedIds.has(record.id)) continue;

      const existing = map.get(record.id);
      const count = this.reportCounts[record.id] || 1;
      const isHidden = count >= 3 || this.hiddenByModeration.has(record.id);

      if (existing) {
        if (!existing.reasons.includes(String(record.reason))) {
          existing.reasons.push(String(record.reason));
        }
        if (record.timestamp > existing.latestTimestamp) {
          existing.latestTimestamp = record.timestamp;
        }
        existing.reportCount = count;
        existing.isHiddenByModeration = isHidden;
      } else {
        map.set(record.id, {
          id: record.id,
          type: record.type,
          username: record.username,
          reasons: [String(record.reason)],
          reportCount: count,
          isHiddenByModeration: isHidden,
          latestTimestamp: record.timestamp,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.reportCount - a.reportCount || b.latestTimestamp - a.latestTimestamp);
  }

  /**
   * Admin Action a: "Keep Post" (resets reports & unhides from moderation)
   */
  public keepPost(id: string) {
    this.reportCounts[id] = 0;
    this.reportedIds.delete(id);
    this.hiddenByModeration.delete(id);
    this.reportsHistory = this.reportsHistory.filter((r) => r.id !== id);
    this.save();
  }

  /**
   * Admin Action b: "Delete Post Permanently"
   */
  public deletePostPermanently(id: string) {
    this.permanentlyDeletedIds.add(id);
    this.reportedIds.add(id);
    this.hiddenByModeration.add(id);
    this.reportsHistory = this.reportsHistory.filter((r) => r.id !== id);
    this.save();
  }

  /**
   * Admin Action c: "Ban User Account" (removes their profile and all their posts)
   */
  public banUserAccount(username: string) {
    if (!username) return;
    const clean = username.toLowerCase().replace(/^@/, '').trim();
    this.blockedUsers.add(clean);
    this.save();
  }

  public getBlockedUsers(): string[] {
    return Array.from(this.blockedUsers);
  }

  public getReportedIds(): string[] {
    return Array.from(this.reportedIds);
  }

  public getHiddenByModerationIds(): string[] {
    return Array.from(this.hiddenByModeration);
  }
}

export const moderationService = new ModerationService();
