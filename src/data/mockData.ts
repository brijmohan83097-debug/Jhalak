import { User, StoryGroup, Post, Conversation, Reel } from '../types';

/**
 * Clean Default User Profile for new sessions.
 * Real profile data is loaded from Firebase Auth and Firestore /users/{userId}.
 */
export const defaultGuestUser: User = {
  id: 'guest-user',
  username: 'guest',
  name: 'Guest User',
  email: '',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Guest',
  bio: '',
  website: '',
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
  watchHours: 0,
  dailyReelsCount: 0,
  dailyPhotosCount: 0,
  isVerified: false,
  isGoogleAuth: false,
};

export const currentUser: User = defaultGuestUser;

// Empty arrays: all feeds, stories, reels, posts, and conversations load exclusively from Firebase
export const initialStories: StoryGroup[] = [];
export const initialPosts: Post[] = [];
export const initialReels: Reel[] = [];
export const samplePresetPhotos: any[] = [];
export const samplePresetVideos: any[] = [];
export const userProfilePosts: Post[] = [];
export const exploreGridItems: Post[] = [];
export const initialConversations: Conversation[] = [];
export const suggestedUsers: any[] = [];
export const profileHighlights: any[] = [];
