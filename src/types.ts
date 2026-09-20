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
  | 'Bhojpuri'
  | 'Comedy'
  | 'Tech'
  | 'Travel'
  | 'Music'
  | 'Fabrication/DIY'
  | 'Bollywood'
  | 'Food'
  | 'Fitness'
  | 'Regional Music'
  | 'South Indian'
  | 'Punjabi';

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
  username: string;
  userAvatar: string;
  isVerified?: boolean;
  location?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  caption: string;
  tags: string[];
  category?: ContentCategory;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: Comment[];
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
  isUserCreated?: boolean;
}

export interface Reel {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  isVerified?: boolean;
  location?: string;
  videoUrl: string;
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
  tags: string[];
  timestamp: string;
  language?: string;
  productTag?: ProductTag;
  createdAt?: number;
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
