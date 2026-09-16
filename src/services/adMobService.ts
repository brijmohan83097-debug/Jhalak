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
  // Official Google AdMob Test App ID
  APP_ID: 'ca-app-pub-3940256099942544~3347511713',

  // Official Google AdMob Test Ad Unit IDs
  BANNER_ANDROID: 'ca-app-pub-3940256099942544/6300978111',
  BANNER_IOS: 'ca-app-pub-3940256099942544/2934735716',
  NATIVE_ADVANCED_ANDROID: 'ca-app-pub-3940256099942544/2247696110',
  NATIVE_VIDEO_ANDROID: 'ca-app-pub-3940256099942544/3986624511',

  // FULL-SCREEN INTERSTITIALS ARE PERMANENTLY DISABLED
  // This guarantees user scrolling and navigating tabs is never abruptly blocked
  INTERSTITIAL_ENABLED: false,
  APP_OPEN_ENABLED: false,

  // Feed insertion frequency (every 6-8 items)
  FEED_AD_INTERVAL: 7,
  REELS_AD_INTERVAL: 7,
};

// Curated official-style AdMob test banners
export const SAMPLE_BANNER_ADS: AdMobBannerData[] = [
  {
    adUnitId: ADMOB_CONFIG.BANNER_ANDROID,
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
    adUnitId: ADMOB_CONFIG.BANNER_ANDROID,
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
    adUnitId: ADMOB_CONFIG.BANNER_ANDROID,
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

// Curated official-style Native Advanced Ads for Home Feed
export const SAMPLE_NATIVE_FEED_ADS: AdMobNativeAd[] = [
  {
    isAdMobAd: true,
    id: 'admob-native-feed-pixel9',
    adUnitId: ADMOB_CONFIG.NATIVE_ADVANCED_ANDROID,
    type: 'feed',
    advertiser: 'Google Pixel India',
    advertiserIcon: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Electronics & Phones',
    rating: 4.9,
    reviewsCount: '24K reviews',
    headline: 'Pixel 9 Pro with Gemini Built-In',
    body: 'The most powerful Pixel yet with Super Res Zoom, Magic Editor, Best Take, and 24-hour battery life. Experience true Google AI in your palm.',
    callToAction: 'Shop on Google Store',
    destinationUrl: 'https://store.google.com',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&auto=format&fit=crop&q=80',
    likesCount: 14820,
    isLiked: false,
    isSaved: false,
    tags: ['GooglePixel', 'GeminiAI', 'AdMobTestAd', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-swiggy',
    adUnitId: ADMOB_CONFIG.NATIVE_ADVANCED_ANDROID,
    type: 'feed',
    advertiser: 'Swiggy Food & Instamart',
    advertiserIcon: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Food & Groceries',
    rating: 4.7,
    reviewsCount: '8.4M reviews',
    headline: 'Hungry? Get 50% Off Up to ₹120 on First 3 Orders',
    body: 'Cravings satisfied in 20 minutes. Order Biryani, Pizza, Burgers, or fresh groceries delivered at lightning speed with live GPS tracking.',
    callToAction: 'Order on Swiggy App',
    destinationUrl: 'https://swiggy.com',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80',
    likesCount: 29400,
    isLiked: false,
    isSaved: false,
    tags: ['Swiggy', 'FoodDelivery', 'FreeDelivery', 'Sponsored'],
  },
  {
    isAdMobAd: true,
    id: 'admob-native-feed-cred',
    adUnitId: ADMOB_CONFIG.NATIVE_ADVANCED_ANDROID,
    type: 'feed',
    advertiser: 'CRED • Pay & Win',
    advertiserIcon: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    category: 'Finance & UPI',
    rating: 4.8,
    reviewsCount: '3.1M reviews',
    headline: 'Pay Credit Card Bills & Earn Cashback on Every UPI Payment',
    body: 'Trusted by 1 Crore+ members. Experience seamless scans, instant UPI money transfers, and exclusive rewards from top global brands.',
    callToAction: 'Download on Play Store',
    destinationUrl: 'https://cred.club',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80',
    likesCount: 8930,
    isLiked: false,
    isSaved: false,
    tags: ['CRED', 'Cashback', 'UPI', 'PlayStore'],
  },
];

// Curated official-style Native Video Ads for Reels Vertical Queue
export const SAMPLE_NATIVE_REELS_ADS: AdMobNativeAd[] = [
  {
    isAdMobAd: true,
    id: 'admob-native-reel-google',
    adUnitId: ADMOB_CONFIG.NATIVE_VIDEO_ANDROID,
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
    adUnitId: ADMOB_CONFIG.NATIVE_VIDEO_ANDROID,
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
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    audioTitle: 'Trending Beats • Sponsored Sound',
    likesCount: 56900,
    isLiked: false,
    isSaved: false,
    tags: ['Spotify', 'Music', 'Premium', 'Sponsored'],
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
   * Interleave native ads into an array cleanly every `interval` items
   */
  public insertNativeAds<T>(
    items: T[],
    ads: AdMobNativeAd[],
    interval: number = ADMOB_CONFIG.FEED_AD_INTERVAL
  ): (T | AdMobNativeAd)[] {
    if (ads.length === 0 || items.length === 0) return items;

    const result: (T | AdMobNativeAd)[] = [];
    let adIndex = 0;

    for (let i = 0; i < items.length; i++) {
      result.push(items[i]);

      // Every `interval` items (e.g., after 6 items, at index 5), insert a native ad
      if ((i + 1) % interval === 0 && adIndex < ads.length) {
        result.push(ads[adIndex % ads.length]);
        adIndex++;
      }
    }

    return result;
  }
}

export const adMobService = new AdMobService();
