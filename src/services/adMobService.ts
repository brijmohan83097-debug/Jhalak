/**
 * Google AdMob Integration Service
 * Official Test Ad Unit IDs and Compliance Configurations
 * Follows Google Better Ads Standards & Play Store User Experience Policies:
 * - Clean standard Banner Ad container fixed above the bottom navigation bar
 * - Seamless In-Feed Native Ads in Home Feed & Reels vertical scroll every 6-8 posts/reels
 * - Strict prohibition of full-screen interstitial/pop-up ads during browsing and scrolling
 */

export interface AdMobBannerData {
  adUnitId: string;
  adChoicesUrl: string;
  title: string;
  headline: string;
  advertiser: string;
  rating?: number;
  price?: string;
  ctaText: string;
  destinationUrl: string;
  iconUrl: string;
  accentColor?: string;
}

export interface AdMobNativeAd {
  isAdMobAd: true;
  id: string;
  adUnitId: string;
  type: 'feed' | 'reel';
  advertiser: string;
  advertiserIcon: string;
  isVerified?: boolean;
  category: string;
  rating: number;
  reviewsCount: string;
  headline: string;
  body: string;
  callToAction: string;
  destinationUrl: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  posterUrl?: string;
  audioTitle?: string;
  likesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  tags: string[];
}

export const ADMOB_CONFIG = {
  // Official Google AdSense / AdMob Publisher & Client IDs
  PUBLISHER_ID: 'pub-7598643408736998',
  CLIENT_ID: 'ca-pub-7598643408736998',
  APP_ID: 'ca-app-pub-7598643408736998~3347511713',

  // Google AdMob Unit IDs
  NATIVE: 'ca-app-pub-7598643408736998/9251607358',
  BANNER: 'ca-app-pub-7598643408736998/4957139129',
  REWARDED: 'ca-app-pub-7598643408736998/6333724469',

  // Google Ad Unit Slots
  NATIVE_SLOT: '9251607358',
  BANNER_SLOT: '4957139129',
  REWARDED_SLOT: '6333724469',

  // Format aliases for backward-compatibility with existing component references
  BANNER_ANDROID: 'ca-app-pub-7598643408736998/4957139129',
  BANNER_IOS: 'ca-app-pub-7598643408736998/4957139129',
  NATIVE_ADVANCED_ANDROID: 'ca-app-pub-7598643408736998/9251607358',
  NATIVE_VIDEO_ANDROID: 'ca-app-pub-7598643408736998/9251607358',
  REWARDED_ANDROID: 'ca-app-pub-7598643408736998/6333724469',

  // FULL-SCREEN INTERSTITIALS ARE PERMANENTLY DISABLED
  // This guarantees user scrolling and navigating tabs is never abruptly blocked
  INTERSTITIAL_ENABLED: false,
  APP_OPEN_ENABLED: false,

  // Feed insertion frequency: Rotate sponsored video ads every 3-4 posts/reels
  FEED_AD_INTERVAL: 3,
  REELS_AD_INTERVAL: 3,
};

export interface AdMobRewardedAdData {
  adUnitId: string;
  title: string;
  headline: string;
  advertiser: string;
  advertiserIcon: string;
  rewardAmount: number;
  rewardType: string;
  videoUrl: string;
  destinationUrl: string;
}

export const SAMPLE_REWARDED_AD: AdMobRewardedAdData = {
  adUnitId: ADMOB_CONFIG.REWARDED,
  title: 'Google Cloud Platform',
  headline: 'Learn GenAI & Build Apps Faster with Gemini',
  advertiser: 'Google Cloud',
  advertiserIcon: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80',
  rewardAmount: 10,
  rewardType: '₹10 Creator Settlement Bonus',
  videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  destinationUrl: 'https://cloud.google.com',
};

// Curated official-style AdMob banners
export const SAMPLE_BANNER_ADS: AdMobBannerData[] = [
  {
    adUnitId: ADMOB_CONFIG.BANNER,
    adChoicesUrl: 'https://policies.google.com/technologies/ads',
    title: 'Google Cloud Platform',
    headline: 'Build AI Apps Faster with Gemini',
    advertiser: 'Google Cloud',
    rating: 4.8,
    price: '$300 Free Credits',
    ctaText: 'Start Free',
    destinationUrl: 'https://cloud.google.com',
    iconUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=80',
    accentColor: '#4285F4',
  },
  {
    adUnitId: ADMOB_CONFIG.BANNER,
    adChoicesUrl: 'https://policies.google.com/technologies/ads',
    title: 'Spotify: Music & Podcasts',
    headline: '3 Months of Spotify Premium for ₹119',
    advertiser: 'Spotify AB',
    rating: 4.6,
    price: 'Special Offer',
    ctaText: 'Claim Offer',
    destinationUrl: 'https://spotify.com',
    iconUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=100&auto=format&fit=crop&q=80',
    accentColor: '#1DB954',
  },
  {
    adUnitId: ADMOB_CONFIG.BANNER,
    adChoicesUrl: 'https://policies.google.com/technologies/ads',
    title: 'Duolingo: Language Lessons',
    headline: 'Learn Spanish, French or German in 5 mins/day',
    advertiser: 'Duolingo',
    rating: 4.7,
    price: 'Free on Play Store',
    ctaText: 'Install',
    destinationUrl: 'https://duolingo.com',
    iconUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&auto=format&fit=crop&q=80',
    accentColor: '#58CC02',
  },
];

// Curated official-style Native Video Ads for Home Feed (rotates between every 3-4 posts)
export const SAMPLE_NATIVE_FEED_ADS: AdMobNativeAd[] = [
  {
    isAdMobAd: true,
    id: 'admob-native-feed-pixel9',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'feed',
    advertiser: 'Google Pixel 9 Pro',
    advertiserIcon: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Electronics & Phones',
    rating: 4.9,
    reviewsCount: '24K reviews',
    headline: 'Pixel 9 Pro with Gemini Built-In',
    body: 'The most powerful Pixel yet with Super Res Zoom, Magic Editor, Best Take, and 24-hour battery life. Watch Gemini AI live in action.',
    callToAction: 'Shop Google Pixel ↗',
    destinationUrl: 'https://store.google.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&auto=format&fit=crop&q=80',
    likesCount: 14820,
    isLiked: false,
    isSaved: false,
    tags: ['GooglePixel', 'GeminiAI', 'VideoAd', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-swiggy',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'feed',
    advertiser: 'Swiggy Food & Instamart',
    advertiserIcon: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Food & Groceries',
    rating: 4.7,
    reviewsCount: '8.4M reviews',
    headline: 'Hot Biryani & Burgers in 15 Mins — Flat 50% Off',
    body: 'Cravings satisfied at lightning speed. Order from 10,000+ top restaurants with live GPS driver tracking & zero contact delivery.',
    callToAction: 'Order on Swiggy ↗',
    destinationUrl: 'https://swiggy.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80',
    likesCount: 29400,
    isLiked: false,
    isSaved: false,
    tags: ['Swiggy', 'FoodDelivery', 'VideoAd', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-spotify',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'feed',
    advertiser: 'Spotify India',
    advertiserIcon: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Music & Podcasts',
    rating: 4.8,
    reviewsCount: '32M reviews',
    headline: 'Ad-Free Bollywood, Punjabi & Indie Hits for ₹119',
    body: 'Download unlimited songs, enjoy lossless audio streaming, and explore handpicked creator playlists anywhere offline.',
    callToAction: 'Claim 3 Months Free ↗',
    destinationUrl: 'https://spotify.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    likesCount: 41200,
    isLiked: false,
    isSaved: false,
    tags: ['Spotify', 'Music', 'VideoAd', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-phonepe',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'feed',
    advertiser: 'PhonePe • UPI Payments',
    advertiserIcon: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Finance & Banking',
    rating: 4.8,
    reviewsCount: '12M reviews',
    headline: 'Zero-Fee Instant UPI Transfers & Cashback Rewards',
    body: 'Scan any QR code, pay utility bills in 3 taps, and invest in 24K digital gold with maximum bank-grade security.',
    callToAction: 'Open PhonePe App ↗',
    destinationUrl: 'https://phonepe.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
    likesCount: 21890,
    isLiked: false,
    isSaved: false,
    tags: ['PhonePe', 'UPI', 'VideoAd', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-flipkart',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'feed',
    advertiser: 'Flipkart • Big Billion Days',
    advertiserIcon: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Shopping & Electronics',
    rating: 4.8,
    reviewsCount: '19M reviews',
    headline: 'Grand Festive Dhamaka — Up to 80% Off on Top Brands',
    body: 'Discover millions of genuine products with free express delivery, instant bank discounts, and easy no-cost EMI across India.',
    callToAction: 'Shop on Flipkart ↗',
    destinationUrl: 'https://flipkart.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    likesCount: 35120,
    isLiked: false,
    isSaved: false,
    tags: ['Flipkart', 'BBD', 'VideoAd', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-netflix',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'feed',
    advertiser: 'Netflix India',
    advertiserIcon: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Entertainment & Movies',
    rating: 4.9,
    reviewsCount: '45M reviews',
    headline: 'Unlimited Movies, Web Series & Indian Blockbusters',
    body: 'Stream award-winning cinema and thrilling new seasons anytime in crystal-clear 4K HDR with spatial audio on any screen.',
    callToAction: 'Watch on Netflix ↗',
    destinationUrl: 'https://netflix.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
    likesCount: 52400,
    isLiked: false,
    isSaved: false,
    tags: ['Netflix', 'Streaming', 'VideoAd', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-nike',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'feed',
    advertiser: 'Nike Running & Training',
    advertiserIcon: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Sports & Athleisure',
    rating: 4.9,
    reviewsCount: '18M reviews',
    headline: 'Nike Air Zoom Pegasus — Built for Your Fastest Miles',
    body: 'Engineered mesh with responsive React foam cushioning delivers energy return on every stride. Find your pace today.',
    callToAction: 'Explore Collection ↗',
    destinationUrl: 'https://nike.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&auto=format&fit=crop&q=80',
    likesCount: 38700,
    isLiked: false,
    isSaved: false,
    tags: ['Nike', 'Running', 'VideoAd', 'Sponsored'],
  },
];

// Curated official-style Native Video Ads for Reels Queue (rotates between every 3-4 reels)
export const SAMPLE_NATIVE_REELS_ADS: AdMobNativeAd[] = [
  {
    isAdMobAd: true,
    id: 'admob-native-reel-google',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'reel',
    advertiser: 'Google Workspace',
    advertiserIcon: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Productivity & AI',
    rating: 4.9,
    reviewsCount: '15M+ users',
    headline: 'Transform your workflow with Gemini for Google Workspace',
    body: 'Draft emails in seconds, summarize long docs, and organize meetings effortlessly. Try Gemini free for 14 days.',
    callToAction: 'Try Gemini for Free ↗',
    destinationUrl: 'https://workspace.google.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Google Soundscapes • Official Theme',
    likesCount: 42100,
    isLiked: false,
    isSaved: false,
    tags: ['GoogleWorkspace', 'AI', 'Gemini', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-reel-spotify',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'reel',
    advertiser: 'Spotify Music',
    advertiserIcon: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Music & Audio',
    rating: 4.6,
    reviewsCount: '28M reviews',
    headline: 'Millions of songs and podcasts. Ad-free music with Spotify Premium.',
    body: 'Listen anywhere, offline playback, and unlimited skips. Download now on Google Play Store.',
    callToAction: 'Get Spotify Premium ↗',
    destinationUrl: 'https://spotify.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Trending Beats • Sponsored Sound',
    likesCount: 56900,
    isLiked: false,
    isSaved: false,
    tags: ['Spotify', 'Music', 'Premium', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-reel-swiggy',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'reel',
    advertiser: 'Swiggy Instamart',
    advertiserIcon: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Quick Commerce',
    rating: 4.8,
    reviewsCount: '14M reviews',
    headline: 'Fresh Veggies, Munchies & Dairy Delivered in 10 Minutes!',
    body: 'Late night cravings or daily kitchen essentials, Instamart has you covered with instant doorstep drop.',
    callToAction: 'Order Instamart ↗',
    destinationUrl: 'https://swiggy.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Swiggy Jingle • 10 Min Magic',
    likesCount: 31200,
    isLiked: false,
    isSaved: false,
    tags: ['Swiggy', 'Instamart', 'QuickCommerce', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-reel-cred',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'reel',
    advertiser: 'CRED • Upgrade Life',
    advertiserIcon: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Finance & Lifestyle',
    rating: 4.9,
    reviewsCount: '5M reviews',
    headline: 'Win Jackpot Cashback on Credit Card & UPI Payments Today',
    body: 'Join India’s top credit community. Claim luxury stays, fine dining vouchers, and guaranteed cashback every day.',
    callToAction: 'Join CRED Now ↗',
    destinationUrl: 'https://cred.club',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'CRED Beats • Premium Club Sound',
    likesCount: 68400,
    isLiked: false,
    isSaved: false,
    tags: ['CRED', 'Cashback', 'Premium', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-reel-flipkart',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'reel',
    advertiser: 'Flipkart Electronics',
    advertiserIcon: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Festive Shopping',
    rating: 4.8,
    reviewsCount: '22M reviews',
    headline: 'Crazy 50-80% Price Drop on Smartphones & Laptops!',
    body: 'Grab exclusive bank cashback, exchange bonuses, and no-cost EMI on India’s biggest festive deals.',
    callToAction: 'Shop Deals ↗',
    destinationUrl: 'https://flipkart.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Festive Celebration • Dhamaal Sound',
    likesCount: 47900,
    isLiked: false,
    isSaved: false,
    tags: ['Flipkart', 'BigBillionDays', 'FestiveDeals', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-reel-netflix',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'reel',
    advertiser: 'Netflix India',
    advertiserIcon: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Original Cinema',
    rating: 4.9,
    reviewsCount: '40M reviews',
    headline: 'Binge the Most Thrilling Shows & Blockbuster Cinema',
    body: 'From mind-bending sci-fi to gripping desi crime sagas, start watching instantly in cinematic 4K HDR.',
    callToAction: 'Watch on Netflix ↗',
    destinationUrl: 'https://netflix.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Netflix Soundmark • Ta-Dum',
    likesCount: 88200,
    isLiked: false,
    isSaved: false,
    tags: ['Netflix', 'Blockbuster', 'Cinema', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-reel-nike',
    adUnitId: ADMOB_CONFIG.NATIVE,
    type: 'reel',
    advertiser: 'Nike Athletics India',
    advertiserIcon: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Fitness & Style',
    rating: 4.9,
    reviewsCount: '25M reviews',
    headline: 'Unstoppable Momentum: The New Nike Air Max Fly',
    body: 'Engineered for street culture, track dominance, and maximum athletic endurance. Just Do It.',
    callToAction: 'Shop Collection ↗',
    destinationUrl: 'https://nike.com',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'High Energy Beat • Nike Anthem',
    likesCount: 73500,
    isLiked: false,
    isSaved: false,
    tags: ['Nike', 'JustDoIt', 'Athletics', 'Sponsored'],
  },
];

class AdMobService {
  private currentBannerIndex = 0;
  private hiddenAdIds = new Set<string>();

  /**
   * Get current standard Banner Ad
   */
  public getBannerAd(): AdMobBannerData {
    return SAMPLE_BANNER_ADS[this.currentBannerIndex % SAMPLE_BANNER_ADS.length];
  }

  /**
   * Cycle to next Banner creative (simulating real ad refreshes)
   */
  public rotateBanner(): AdMobBannerData {
    this.currentBannerIndex = (this.currentBannerIndex + 1) % SAMPLE_BANNER_ADS.length;
    return this.getBannerAd();
  }

  /**
   * Get Native In-Feed Ads for Home Feed
   */
  public getNativeFeedAds(): AdMobNativeAd[] {
    return SAMPLE_NATIVE_FEED_ADS.filter((ad) => !this.hiddenAdIds.has(ad.id));
  }

  /**
   * Get Native Video Ads for Reels
   */
  public getNativeReelAds(): AdMobNativeAd[] {
    return SAMPLE_NATIVE_REELS_ADS.filter((ad) => !this.hiddenAdIds.has(ad.id));
  }

  /**
   * Hide an ad when user requests "Hide this ad"
   */
  public hideAd(adId: string): void {
    this.hiddenAdIds.add(adId);
  }

  /**
   * Type guard to check if an item is an AdMob Native Ad
   */
  public isAdItem(item: unknown): item is AdMobNativeAd {
    return !!item && typeof item === 'object' && (item as AdMobNativeAd).isAdMobAd === true;
  }

  /**
   * Get Rewarded Ad creative and configuration
   */
  public getRewardedAd(): AdMobRewardedAdData {
    return SAMPLE_REWARDED_AD;
  }

  /**
   * Interleave native ads into an array cleanly after every `interval` items (e.g. index % 2 === 1)
   */
  public insertNativeAds<T>(
    items: T[],
    ads: AdMobNativeAd[],
    interval: number = ADMOB_CONFIG.FEED_AD_INTERVAL
  ): (T | AdMobNativeAd)[] {
    if (!ads || ads.length === 0 || !items || items.length === 0) return items || [];

    const effectiveInterval = Math.max(1, interval);
    const result: (T | AdMobNativeAd)[] = [];
    let adIndex = 0;

    for (let i = 0; i < items.length; i++) {
      result.push(items[i]);

      // Insert 1 AdMob/Native ad card after every `interval` feed posts/videos
      // When interval = 2, triggers when i % 2 === 1 (i.e. after post 1, post 3, post 5, etc.)
      if (i % effectiveInterval === (effectiveInterval - 1)) {
        const baseAd = ads[adIndex % ads.length];
        const uniqueAd: AdMobNativeAd = {
          ...baseAd,
          id: adIndex >= ads.length ? `${baseAd.id}-feed-${adIndex}` : baseAd.id,
        };
        result.push(uniqueAd);
        adIndex++;
      }
    }

    return result;
  }
}

export const adMobService = new AdMobService();
