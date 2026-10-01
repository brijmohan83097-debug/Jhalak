export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  watchHours?: number;
  dailyReelsCount?: number;
  dailyPhotosCount?: number;
  lastUploadDate?: string;
  isVerified?: boolean;
  email?: string;
  isGoogleAuth?: boolean;
  creatorCategory?: ContentCategory;
  posts?: Post[];
  userPosts?: Post[];
}

export interface StorySlide {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: string;
  caption?: string;
}

export interface StoryGroup {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  userAvatar?: string;
  hasUnseen: boolean;
  slides: StorySlide[];
}

export type ContentCategory =
  | 'Vlogging'
  | 'Comedy'
  | 'Dance'
  | 'Music'
  | 'Education'
  | 'Lifestyle';

export interface CreatorNicheItem {
  id: ContentCategory;
  label: string;
  emoji: string;
  desc: string;
  gradient: string;
}

export const CREATOR_NICHES: CreatorNicheItem[] = [
  {
    id: 'Vlogging',
    label: 'Vlogging',
    emoji: '📹',
    desc: 'Daily life, travel & stories',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'Comedy',
    label: 'Comedy',
    emoji: '😂',
    desc: 'Skits, jokes & fun moments',
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'Dance',
    label: 'Dance',
    emoji: '💃',
    desc: 'Choreography & trending steps',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'Music',
    label: 'Music',
    emoji: '🎵',
    desc: 'Singing, beats & covers',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'Education',
    label: 'Education',
    emoji: '📚',
    desc: 'Tips, tutorials & learning',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'Lifestyle',
    label: 'Lifestyle',
    emoji: '✨',
    desc: 'Fashion, fitness & routine',
    gradient: 'from-cyan-500 to-blue-500',
  },
];

export interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  likesCount: number;
  isLiked?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'gif';
}

export interface ProductTag {
  id: string;
  title: string;
  price: number;
  currency?: string;
  description?: string;
  whatsappNumber?: string;
  category?: string;
  imageUrl?: string;
}

export interface Post {
  id: string;
  userId: string;
  authorId?: string;
  userEmail?: string;
  privacy?: 'public' | 'private';
  isPrivate?: boolean;
  username: string;
  userAvatar: string;
  isVerified?: boolean;
  location?: string;
  mediaUrl: string;
  downloadURL?: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  caption: string;
  tags: string[];
  category?: ContentCategory;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: Comment[];
  commentsCount?: number;
  likedBy?: string[];
  timestamp: string;
  filter?: string;
  audioTitle?: string;
  audioArtist?: string;
  audioUrl?: string;
  audioCover?: string;
  viewsCount?: number;
  language?: string;
  productTag?: ProductTag;
  createdAt?: number;
  createdAtIso?: string;
  isUserCreated?: boolean;
}

export interface Reel {
  id: string;
  userId: string;
  authorId?: string;
  userEmail?: string;
  privacy?: 'public' | 'private';
  isPrivate?: boolean;
  username: string;
  userAvatar: string;
  isVerified?: boolean;
  location?: string;
  videoUrl: string;
  downloadURL?: string;
  thumbnailUrl?: string;
  caption: string;
  category?: ContentCategory;
  audioTitle: string;
  audioArtist?: string;
  audioUrl?: string;
  audioCover?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: Comment[];
  likedBy?: string[];
  tags: string[];
  timestamp: string;
  viewsCount?: number;
  language?: string;
  productTag?: ProductTag;
  createdAt?: number;
  createdAtIso?: string;
  isUserCreated?: boolean;
}

export interface CategoryAffinity {
  score: number;
  likes: number;
  comments: number;
  shares: number;
  watchCompletions: number;
  watchTimeSeconds?: number;
  consecutiveCount: number;
  manualTuning: 'boost' | 'demote' | 'neutral';
}

export type AffinityMap = Record<string, CategoryAffinity>;

export interface WatchTimeData {
  totalSeconds: number;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  byPost: Record<string, number>;
  lastUpdated: number;
}

export interface LanguageStat {
  code: string;
  name: string;
  watchTimeSeconds: number;
  interactionsCount: number;
  score: number;
  lastEngaged: number;
}

export type LanguageEngagementData = Record<string, LanguageStat>;

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMine: boolean;
  isRead?: boolean;
  type?: 'text' | 'voice' | 'image';
  mediaUrl?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  messages: Message[];
  unreadCount: number;
  lastMessage?: string;
  lastMessageTimestamp?: string;
}

export type NavTab = 'home' | 'explore' | 'reels' | 'messages' | 'profile';
