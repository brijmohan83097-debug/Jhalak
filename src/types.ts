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
  isVerified?: boolean;
  email?: string;
  isGoogleAuth?: boolean;
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
  | 'Comedy'
  | 'Tech'
  | 'Travel'
  | 'Music'
  | 'Fabrication/DIY'
  | 'Bollywood'
  | 'Food'
  | 'Fitness';

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
  viewsCount?: number;
  productTag?: ProductTag;
}

export interface Reel {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  isVerified?: boolean;
  location?: string;
  videoUrl: string;
  caption: string;
  category?: ContentCategory;
  audioTitle: string;
  audioArtist?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: Comment[];
  tags: string[];
  timestamp: string;
  productTag?: ProductTag;
}

export interface CategoryAffinity {
  score: number;
  likes: number;
  comments: number;
  shares: number;
  watchCompletions: number;
  consecutiveCount: number;
  manualTuning: 'boost' | 'demote' | 'neutral';
}

export type AffinityMap = Record<string, CategoryAffinity>;

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
