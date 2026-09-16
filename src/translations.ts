export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'bho';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string; // Native name
  englishName: string;
  flag: string;
  greeting: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    flag: '🇮🇳',
    greeting: 'Welcome',
  },
  {
    code: 'hi',
    name: 'हिंदी',
    englishName: 'Hindi',
    flag: '🇮🇳',
    greeting: 'नमस्ते',
  },
  {
    code: 'bn',
    name: 'বাংলা',
    englishName: 'Bengali',
    flag: '🇮🇳',
    greeting: 'নমস্কার',
  },
  {
    code: 'te',
    name: 'తెలుగు',
    englishName: 'Telugu',
    flag: '🇮🇳',
    greeting: 'నమస్కారం',
  },
  {
    code: 'mr',
    name: 'मराठी',
    englishName: 'Marathi',
    flag: '🇮🇳',
    greeting: 'नमस्कार',
  },
  {
    code: 'ta',
    name: 'தமிழ்',
    englishName: 'Tamil',
    flag: '🇮🇳',
    greeting: 'வணக்கம்',
  },
  {
    code: 'bho',
    name: 'भोजपुरी',
    englishName: 'Bhojpuri',
    flag: '🇮🇳',
    greeting: 'प्रणाम',
  },
];

export interface TranslationDictionary {
  // Navigation & Header
  home: string;
  explore: string;
  reels: string;
  messages: string;
  create: string;
  profile: string;
  settings: string;
  logout: string;
  login: string;
  guest: string;
  more: string;

  // Post & Interactions
  like: string;
  liked: string;
  comment: string;
  share: string;
  save: string;
  saved: string;
  post: string;
  posts: string;
  followers: string;
  following: string;
  views: string;
  viewAllComments: string;
  addComment: string;
  less: string;
  moreCaption: string;

  // Settings Menu Items
  editProfile: string;
  accountPrivacy: string;
  language: string;
  notifications: string;
  savedPosts: string;
  switchLanguage: string;
  selectLanguage: string;
  privacySubtitle: string;
  notificationsSubtitle: string;
  languageSubtitle: string;
  privateAccount: string;
  privateAccountDesc: string;
  pauseAllNotifications: string;
  pauseAllDesc: string;
  storiesAndPosts: string;
  directMessagesNotif: string;

  // Edit Profile Form
  nameLabel: string;
  usernameLabel: string;
  bioLabel: string;
  websiteLabel: string;
  profilePhoto: string;
  photoUrl: string;
  saveChanges: string;
  cancel: string;
  profileUpdatedSuccess: string;

  // Search & Explore
  searchPlaceholder: string;
  allCategory: string;
  travelCategory: string;
  streetCategory: string;
  natureCategory: string;
  foodCategory: string;

  // Profile Specific
  tagged: string;
  noPostsYet: string;
  noSavedPosts: string;
  googleAccount: string;
  googleVerifiedCreator: string;
  manage: string;

  // Recommendation & Tuning
  notInterested: string;
  showMoreLikeThis: string;
  whyAmISeeingThis: string;
  tunedFeedToast: string;

  // Additional UI keys
  postSaved?: string;
  postUnsaved?: string;
  commentPosted?: string;
  profileUpdated?: string;
  allCategories?: string;
  noResultsFound?: string;
  trySearching?: string;
  followingBtn?: string;
  follow?: string;
  view?: string;
  suggestedForYou?: string;
  seeAll?: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    home: 'Home',
    explore: 'Explore',
    reels: 'Reels',
    messages: 'Messages',
    create: 'Create',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Log out',
    login: 'Sign in',
    guest: 'Guest Mode',
    more: 'More',

    like: 'Like',
    liked: 'Liked',
    comment: 'Comment',
    share: 'Share',
    save: 'Save',
    saved: 'Saved',
    post: 'Post',
    posts: 'posts',
    followers: 'followers',
    following: 'following',
    views: 'views',
    viewAllComments: 'View all comments',
    addComment: 'Add a comment...',
    less: 'less',
    moreCaption: 'more',

    postSaved: 'Post saved to collection',
    postUnsaved: 'Post removed from saved',
    commentPosted: 'Comment posted successfully',
    profileUpdated: 'Profile updated successfully',
    allCategories: 'All',
    noResultsFound: 'No results found',
    trySearching: 'Try searching for something else',
    followingBtn: 'Following',
    follow: 'Follow',
    view: 'View',
    suggestedForYou: 'Suggested for you',
    seeAll: 'See all',

    editProfile: 'Edit Profile',
    accountPrivacy: 'Account Privacy',
    language: 'Language (भाषा)',
    notifications: 'Notifications',
    savedPosts: 'Saved Items',
    switchLanguage: 'Change Language / भाषा बदलें',
    selectLanguage: 'Select your preferred language',
    privacySubtitle: 'Manage who can see your photos, reels & stories',
    notificationsSubtitle: 'Control alerts for likes, comments and DMs',
    languageSubtitle: 'Choose from 7 supported Indian languages',
    privateAccount: 'Private Account',
    privateAccountDesc: 'When your account is private, only people you approve can see your posts and reels.',
    pauseAllNotifications: 'Pause All Notifications',
    pauseAllDesc: 'Temporarily pause push alerts and in-app sound chimes.',
    storiesAndPosts: 'Stories and Posts Alerts',
    directMessagesNotif: 'Direct Messages & Replies',

    nameLabel: 'Name',
    usernameLabel: 'Username',
    bioLabel: 'Bio',
    websiteLabel: 'Website',
    profilePhoto: 'Profile Photo',
    photoUrl: 'Photo URL',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    profileUpdatedSuccess: 'Profile updated successfully! ✨',

    searchPlaceholder: 'Search accounts, tags, places...',
    allCategory: 'All',
    travelCategory: 'Travel',
    streetCategory: 'Street',
    natureCategory: 'Nature',
    foodCategory: 'Food & Chai',

    tagged: 'Tagged',
    noPostsYet: 'No Posts Yet',
    noSavedPosts: 'No Saved Posts',
    googleAccount: 'Google Account',
    googleVerifiedCreator: 'Google Verified Creator',
    manage: 'Manage',

    notInterested: 'Not Interested',
    showMoreLikeThis: 'Show More Like This',
    whyAmISeeingThis: 'Why am I seeing this?',
    tunedFeedToast: 'Feed tuned to your preference',
  },

  hi: {
    home: 'होम',
    explore: 'खोजें',
    reels: 'रील्स',
    messages: 'संदेश',
    create: 'बनाएं',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    login: 'साइन इन',
    guest: 'गेस्ट मोड',
    more: 'अधिक',

    like: 'पसंद',
    liked: 'पसंद किया',
    comment: 'टिप्पणी',
    share: 'शेयर करें',
    save: 'सहेजें',
    saved: 'सहेजे गए',
    post: 'पोस्ट',
    posts: 'पोस्ट्स',
    followers: 'फ़ॉलोअर्स',
    following: 'फ़ॉलोइंग',
    views: 'व्यूज',
    viewAllComments: 'सभी टिप्पणियां देखें',
    addComment: 'एक टिप्पणी जोड़ें...',
    less: 'कम',
    moreCaption: 'और',

    editProfile: 'प्रोफ़ाइल संपादित करें',
    accountPrivacy: 'खाता गोपनीयता',
    language: 'भाषा (Language)',
    notifications: 'सूचनाएं',
    savedPosts: 'सहेजे गए पोस्ट्स',
    switchLanguage: 'भाषा बदलें (Select Language)',
    selectLanguage: 'अपनी पसंदीदा भारतीय भाषा चुनें',
    privacySubtitle: 'तय करें कि आपकी रील्स और स्टोरी कौन देख सकता है',
    notificationsSubtitle: 'लाइक्स, कमेंट्स और संदेशों की सूचनाएं नियंत्रित करें',
    languageSubtitle: '7 प्रमुख भारतीय भाषाओं में से चुनें',
    privateAccount: 'निजी खाता (Private)',
    privateAccountDesc: 'जब आपका खाता निजी होगा, तो केवल आपके स्वीकृत दोस्त ही आपकी पोस्ट और रील्स देख सकेंगे।',
    pauseAllNotifications: 'सभी सूचनाएं रोकें',
    pauseAllDesc: 'अस्थायी रूप से सभी पुश नोटिफिकेशन और अलर्ट्स बंद करें।',
    storiesAndPosts: 'स्टोरी और पोस्ट अलर्ट्स',
    directMessagesNotif: 'संदेश और चैट नोटिफिकेशन',

    nameLabel: 'नाम',
    usernameLabel: 'यूज़रनेम',
    bioLabel: 'बायो (परिचय)',
    websiteLabel: 'वेबसाइट / लिंक',
    profilePhoto: 'प्रोफ़ाइल फ़ोटो',
    photoUrl: 'फ़ोटो लिंक (URL)',
    saveChanges: 'बदलाव सहेजें',
    cancel: 'रद्द करें',
    profileUpdatedSuccess: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई! ✨',

    searchPlaceholder: 'खाते, टैग, स्थान खोजें...',
    allCategory: 'सभी',
    travelCategory: 'यात्रा',
    streetCategory: 'स्ट्रीट',
    natureCategory: 'प्रकृति',
    foodCategory: 'खान-पान व चाय',

    tagged: 'टैग किए गए',
    noPostsYet: 'अभी कोई पोस्ट नहीं',
    noSavedPosts: 'कोई सहेजी गई पोस्ट नहीं',
    googleAccount: 'गूगल खाता',
    googleVerifiedCreator: 'गूगल सत्यापित क्रिएटर',
    manage: 'प्रबंधित करें',

    notInterested: 'कम दिखाएं',
    showMoreLikeThis: 'ऐसी वीडियो और दिखाएं',
    whyAmISeeingThis: 'यह मुझे क्यों दिख रहा है?',
    tunedFeedToast: 'आपकी पसंद के अनुसार फ़ीड ट्यून हो गई',
  },

  bn: {
    home: 'হোম',
    explore: 'অন্বেষণ',
    reels: 'রিলস',
    messages: 'বার্তা',
    create: 'তৈরি করুন',
    profile: 'প্রোফাইল',
    settings: 'সেটিংস',
    logout: 'লগ আউট',
    login: 'সাইন ইন',
    guest: 'গেস্ট মোড',
    more: 'আরও',

    like: 'পছন্দ',
    liked: 'পছন্দ করেছেন',
    comment: 'মন্তব্য',
    share: 'শেয়ার করুন',
    save: 'সংরক্ষণ',
    saved: 'সংরক্ষিত',
    post: 'পোস্ট',
    posts: 'পোস্টগুলি',
    followers: 'অনুসারী',
    following: 'অনুসরণ করছেন',
    views: 'ভিউ',
    viewAllComments: 'সমস্ত মন্তব্য দেখুন',
    addComment: 'একটি মন্তব্য লিখুন...',
    less: 'সংক্ষিপ্ত',
    moreCaption: 'আরও',

    editProfile: 'প্রোফাইল সম্পাদনা',
    accountPrivacy: 'অ্যাকাউন্ট গোপনীয়তা',
    language: 'ভাষা (Language)',
    notifications: 'বিজ্ঞপ্তি',
    savedPosts: 'সংরক্ষিত পোস্টসমূহ',
    switchLanguage: 'ভাষা পরিবর্তন করুন',
    selectLanguage: 'আপনার পছন্দের ভাষা নির্বাচন করুন',
    privacySubtitle: 'আপনার পোস্ট ও রিলস কে দেখতে পারবে নিয়ন্ত্রণ করুন',
    notificationsSubtitle: 'লাইক, কমেন্ট ও বার্তার সতর্কতা নিয়ন্ত্রণ করুন',
    languageSubtitle: '৭টি প্রধান ভারতীয় ভাষা থেকে বেছে নিন',
    privateAccount: 'ব্যক্তিগত অ্যাকাউন্ট (Private)',
    privateAccountDesc: 'অ্যাকাউন্ট ব্যক্তিগত হলে শুধুমাত্র অনুমোদিত ফলোয়াররাই আপনার ছবি দেখতে পারবেন।',
    pauseAllNotifications: 'সমস্ত বিজ্ঞপ্তি স্থগিত করুন',
    pauseAllDesc: 'সাময়িকভাবে অ্যালার্ট ও নোটিফিকেশন বন্ধ রাখুন।',
    storiesAndPosts: 'স্টোরি ও পোস্ট সতর্কতা',
    directMessagesNotif: 'সরাসরি বার্তা ও চ্যাট অ্যালার্ট',

    nameLabel: 'নাম',
    usernameLabel: 'ব্যবহারকারীর নাম',
    bioLabel: 'বায়ো (বিবরণ)',
    websiteLabel: 'ওয়েবসাইট লিংক',
    profilePhoto: 'প্রোফাইল ছবি',
    photoUrl: 'ছবির ইউআরএল (URL)',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    cancel: 'বাতিল',
    profileUpdatedSuccess: 'প্রোফাইল সফলভাবে আপডেট হয়েছে! ✨',

    searchPlaceholder: 'অ্যাকাউন্ট, ট্যাগ, স্থান অনুসন্ধান...',
    allCategory: 'সব',
    travelCategory: 'ভ্রমণ',
    streetCategory: 'রাস্তাঘাট',
    natureCategory: 'প্রকৃতি',
    foodCategory: 'খাবার ও চা',

    tagged: 'ট্যাগ করা',
    noPostsYet: 'এখনও কোনও পোস্ট নেই',
    noSavedPosts: 'কোনও সংরক্ষিত পোস্ট নেই',
    googleAccount: 'গুগল অ্যাকাউন্ট',
    googleVerifiedCreator: 'গুগল যাচাইকৃত নির্মাতা',
    manage: 'পরিচালনা',

    notInterested: 'কম দেখান',
    showMoreLikeThis: 'এই রকম আরও ভিডিও দেখান',
    whyAmISeeingThis: 'আমি এটি কেন দেখছি?',
    tunedFeedToast: 'আপনার পছন্দের ভিত্তিতে ফিড আপডেট করা হয়েছে',
  },

  te: {
    home: 'హోమ్',
    explore: 'అన్వేషించండి',
    reels: 'రీల్స్',
    messages: 'సందేశాలు',
    create: 'సృష్టించు',
    profile: 'ప్రొఫైల్',
    settings: 'సెట్టింగ్‌లు',
    logout: 'లాగ్ అవుట్',
    login: 'సైన్ ఇన్',
    guest: 'గెస్ట్ మోడ్',
    more: 'మరిన్ని',

    like: 'లైక్',
    liked: 'లైక్ చేసారు',
    comment: 'వ్యాఖ్యానించు',
    share: 'షేర్ చేయి',
    save: 'సేవ్ చేయి',
    saved: 'సేవ్ చేసినవి',
    post: 'పోస్ట్',
    posts: 'పోస్టులు',
    followers: 'ఫాలోవర్స్',
    following: 'ఫాలోయింగ్',
    views: 'వీక్షణలు',
    viewAllComments: 'అన్ని వ్యాఖ్యలను చూడండి',
    addComment: 'వ్యాఖ్యను జోడించండి...',
    less: 'తక్కువ',
    moreCaption: 'మరింత',

    editProfile: 'ప్రొఫైల్‌ను సవరించండి',
    accountPrivacy: 'ఖాతా గోప్యత',
    language: 'భాష (Language)',
    notifications: 'నోటిఫికేషన్‌లు',
    savedPosts: 'సేవ్ చేసిన అంశాలు',
    switchLanguage: 'భాషను మార్చండి',
    selectLanguage: 'మీకు నచ్చిన భాషను ఎంచుకోండి',
    privacySubtitle: 'మీ పోస్టులు, రీల్స్ ఎవరెవరు చూడవచ్చో నిర్వహించండి',
    notificationsSubtitle: 'లైక్‌లు, కామెంట్‌లు & సందేశాల హెచ్చరికలు నియంత్రించండి',
    languageSubtitle: '7 ప్రధాన భారతీయ భాషల నుండి ఎంచుకోండి',
    privateAccount: 'ప్రైవేట్ ఖాతా',
    privateAccountDesc: 'మీ ఖాతా ప్రైవేట్‌గా ఉన్నప్పుడు, మీరు ఆమోదించిన వారు మాత్రమే మీ రీల్స్ చూడగలరు.',
    pauseAllNotifications: 'అన్ని నోటిఫికేషన్‌లను పాజ్ చేయండి',
    pauseAllDesc: 'తాత్కాలికంగా అలర్ట్‌లు మరియు శబ్దాలను నిలిపివేయండి.',
    storiesAndPosts: 'స్టోరీలు & పోస్ట్ అలర్ట్‌లు',
    directMessagesNotif: 'డైరెక్ట్ మెసేజ్ నోటిఫికేషన్‌లు',

    nameLabel: 'పేరు',
    usernameLabel: 'యూజర్‌నేమ్',
    bioLabel: 'బయో',
    websiteLabel: 'వెబ్‌సైట్',
    profilePhoto: 'ప్రొఫైల్ ఫోటో',
    photoUrl: 'ఫోటో లింక్',
    saveChanges: 'మార్పులను సేవ్ చేయండి',
    cancel: 'రద్దు చేయి',
    profileUpdatedSuccess: 'ప్రొఫైల్ విజయవంతంగా అప్‌డేట్ చేయబడింది! ✨',

    searchPlaceholder: 'ఖాతాలు, ట్యాగ్‌లు, ప్రదేశాలను వెతకండి...',
    allCategory: 'అన్నీ',
    travelCategory: 'ప్రయాణం',
    streetCategory: 'స్ట్రీట్',
    natureCategory: 'ప్రకృతి',
    foodCategory: 'ఆహారం & కాఫీ',

    tagged: 'ట్యాగ్ చేయబడినవి',
    noPostsYet: 'ఇంకా పోస్టులు లేవు',
    noSavedPosts: 'సేవ్ చేసిన పోస్టులు లేవు',
    googleAccount: 'గూగుల్ ఖాతా',
    googleVerifiedCreator: 'గూగుల్ ధృవీకరించిన సృష్టికర్త',
    manage: 'నిర్వహించు',

    notInterested: 'తక్కువగా చూపించు',
    showMoreLikeThis: 'ఇలాంటి వీడియోలు మరిన్ని చూపించు',
    whyAmISeeingThis: 'నాకు ఇది ఎందుకు కనిపిస్తోంది?',
    tunedFeedToast: 'మీ ప్రాధాన్యతలకు అనుగుణంగా ఫీడ్ నవీకరించబడింది',
  },

  mr: {
    home: 'होम',
    explore: 'शोधा',
    reels: 'रील्स',
    messages: 'संदेश',
    create: 'तयार करा',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्ज',
    logout: 'लॉग आउट',
    login: 'साइन इन',
    guest: 'गेस्ट मोड',
    more: 'अधिक',

    like: 'पसंत करा',
    liked: 'पसंत केले',
    comment: 'प्रतिक्रिया',
    share: 'शेअर करा',
    save: 'जतन करा',
    saved: 'जतन केलेले',
    post: 'पोस्ट',
    posts: 'पोस्ट्स',
    followers: 'फॉलोअर्स',
    following: 'फॉलो करत आहे',
    views: 'व्ह्यूज',
    viewAllComments: 'सर्व प्रतिक्रिया पाहा',
    addComment: 'प्रतिक्रिया द्या...',
    less: 'कमी',
    moreCaption: 'अधिक',

    editProfile: 'प्रोफाइल संपादित करा',
    accountPrivacy: 'खाते गोपनीयता',
    language: 'भाषा (Language)',
    notifications: 'सूचना',
    savedPosts: 'जतन केलेल्या पोस्ट्स',
    switchLanguage: 'भाषा बदला (Change Language)',
    selectLanguage: 'तुमची पसंतीची भाषा निवडा',
    privacySubtitle: 'तुमचे फोटो आणि रील्स कोण पाहू शकते ते ठरवा',
    notificationsSubtitle: 'लाइक्स, कमेंट्स व मेसेजच्या सूचना नियंत्रित करा',
    languageSubtitle: '७ मुख्य भारतीय भाषांमधून निवडा',
    privateAccount: 'खाजगी खाते (Private)',
    privateAccountDesc: 'तुमचे खाते खाजगी असताना, फक्त तुम्ही मंजूर केलेले लोक तुमचे फोटो पाहू शकतात.',
    pauseAllNotifications: 'सर्व सूचना थांबवा',
    pauseAllDesc: 'तात्पुरत्या स्वरूपात सूचना व अलर्ट बंद करा.',
    storiesAndPosts: 'स्टोरी आणि पोस्ट सूचना',
    directMessagesNotif: 'संदेश व चॅट नोटिफिकेशन्स',

    nameLabel: 'नाव',
    usernameLabel: 'वापरकर्ता नाव',
    bioLabel: 'बायो (परिचय)',
    websiteLabel: 'वेबसाइट',
    profilePhoto: 'प्रोफाइल फोटो',
    photoUrl: 'फोटो लिंक (URL)',
    saveChanges: 'बदल जतन करा',
    cancel: 'रद्द करा',
    profileUpdatedSuccess: 'प्रोफाइल यशस्वीरित्या अद्यतनित झाली! ✨',

    searchPlaceholder: 'खाती, टॅग्ज, ठिकाणे शोधा...',
    allCategory: 'सर्व',
    travelCategory: 'पर्यटन',
    streetCategory: 'रस्ते',
    natureCategory: 'निसर्ग',
    foodCategory: 'खानपान व चहा',

    tagged: 'टॅग केलेले',
    noPostsYet: 'अद्याप एकही पोस्ट नाही',
    noSavedPosts: 'कोणतीही जतन केलेली पोस्ट नाही',
    googleAccount: 'गुगल खाते',
    googleVerifiedCreator: 'गुगल सत्यापित क्रिएटर',
    manage: 'व्यवस्थापित करा',

    notInterested: 'कमी दाखवा',
    showMoreLikeThis: 'अशा आणखी व्हिडिओ दाखवा',
    whyAmISeeingThis: 'मला हे का दिसत आहे?',
    tunedFeedToast: 'तुमच्या आवडीनुसार फीड अपडेट झाली आहे',
  },

  ta: {
    home: 'முகப்பு',
    explore: 'ஆராய்க',
    reels: 'ரீல்ஸ்',
    messages: 'செய்திகள்',
    create: 'உருவாக்குக',
    profile: 'சுயவிவரம்',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    login: 'உள்நுழைக',
    guest: 'விருந்தினர் பயன்முறை',
    more: 'மேலும்',

    like: 'விருப்பம்',
    liked: 'விருப்பப்பட்டது',
    comment: 'கருத்து',
    share: 'பகிர்க',
    save: 'சேமிக்க',
    saved: 'சேமிக்கப்பட்டவை',
    post: 'பதிவு',
    posts: 'பதிவுகள்',
    followers: 'பின்தொடர்பவர்கள்',
    following: 'பின்தொடர்கிறீர்கள்',
    views: 'பார்வைகள்',
    viewAllComments: 'அனைத்து கருத்துகளையும் காண்க',
    addComment: 'கருத்தைச் சேர்க்கவும்...',
    less: 'குறைவாக',
    moreCaption: 'மேலும்',

    editProfile: 'சுயவிவரத்தைத் திருத்து',
    accountPrivacy: 'கணக்கு தனியுரிமை',
    language: 'மொழி (Language)',
    notifications: 'அறிவிப்புகள்',
    savedPosts: 'சேமிக்கப்பட்ட உருப்படிகள்',
    switchLanguage: 'மொழியை மாற்றுக',
    selectLanguage: 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    privacySubtitle: 'உங்கள் பதிவுகள் மற்றும் ரீல்ஸ்களை யார் பார்க்கலாம் என்பதை நிர்வகிக்கவும்',
    notificationsSubtitle: 'விருப்பங்கள், கருத்துகள் மற்றும் செய்திகளுக்கான விழிப்பூட்டல்கள்',
    languageSubtitle: '7 முக்கிய இந்திய மொழிகளில் இருந்து தேர்வு செய்யவும்',
    privateAccount: 'தனிப்பட்ட கணக்கு (Private)',
    privateAccountDesc: 'கணக்கு தனிப்பட்டதாக இருக்கும்போது, ​​நீங்கள் அங்கீகரிக்கும் நபர்கள் மட்டுமே பார்க்க முடியும்.',
    pauseAllNotifications: 'அனைத்து அறிவிப்புகளையும் இடைநிறுத்துக',
    pauseAllDesc: 'அனைத்து புஷ் விழிப்பூட்டல்களையும் தற்காலிகமாக நிறுத்துங்கள்.',
    storiesAndPosts: 'ஸ்டோரி மற்றும் பதிவு விழிப்பூட்டல்கள்',
    directMessagesNotif: 'நேரடி செய்திகள் & அரட்டை',

    nameLabel: 'பெயர்',
    usernameLabel: 'பயனர்பெயர்',
    bioLabel: 'பயோ (சுயவிவரம்)',
    websiteLabel: 'இணையதளம்',
    profilePhoto: 'சுயவிவரப் படம்',
    photoUrl: 'புகைப்பட இணைப்பு',
    saveChanges: 'மாற்றங்களைச் சேமிக்கவும்',
    cancel: 'ரத்துசெய்',
    profileUpdatedSuccess: 'சுயவிவரம் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது! ✨',

    searchPlaceholder: 'கணக்குகள், குறிச்சொற்கள், இடங்களைத் தேடுங்கள்...',
    allCategory: 'அனைத்தும்',
    travelCategory: 'பயணம்',
    streetCategory: 'தெரு',
    natureCategory: 'இயற்கை',
    foodCategory: 'உணவு & காபி',

    tagged: 'குறிச்சொல்லிடப்பட்டது',
    noPostsYet: 'இதுவரை பதிவுகள் இல்லை',
    noSavedPosts: 'சேமிக்கப்பட்ட பதிவுகள் எதுவும் இல்லை',
    googleAccount: 'கூகிள் கணக்கு',
    googleVerifiedCreator: 'கூகிள் சரிபார்க்கப்பட்ட படைப்பாளர்',
    manage: 'நிர்வகி',

    notInterested: 'குறைவாகக் காட்டு',
    showMoreLikeThis: 'இதுபோன்ற வீடியோக்களை அதிகம் காட்டு',
    whyAmISeeingThis: 'இதை நான் ஏன் பார்க்கிறேன்?',
    tunedFeedToast: 'உங்கள் விருப்பத்திற்கு ஏற்ப பரிந்துரைகள் புதுப்பிக்கப்பட்டன',
  },

  bho: {
    home: 'होम',
    explore: 'खोजल जाव',
    reels: 'रील्स',
    messages: 'सनेस (मैसेज)',
    create: 'बनावल जाव',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    login: 'साइन इन',
    guest: 'गेस्ट मोड',
    more: 'अउरी',

    like: 'पसंद (लाइक)',
    liked: 'पसंद कइल गइल',
    comment: 'राय (कमेंट)',
    share: 'शेयर करीं',
    save: 'सहेजल जाव',
    saved: 'सहेजल बा',
    post: 'पोस्ट',
    posts: 'पोस्ट सभ',
    followers: 'फॉलोअर्स',
    following: 'फॉलोइंग',
    views: 'देखे वाला लोग',
    viewAllComments: 'सभ कमेंट देखीं',
    addComment: 'कमेंट जोड़ीं...',
    less: 'कम',
    moreCaption: 'अउरी',

    editProfile: 'प्रोफाइल सुधारीं',
    accountPrivacy: 'खाता गोपनीयता',
    language: 'भाषा (Language)',
    notifications: 'सूचना (नोटिफिकेशन)',
    savedPosts: 'सहेजल पोस्ट सभ',
    switchLanguage: 'भाषा बदलीं',
    selectLanguage: 'आपन मनपसंद भाषा चुनीं',
    privacySubtitle: 'तय करीं कि रउआ पोस्ट अउरी रील्स के-के देख सकत बा',
    notificationsSubtitle: 'लाइक, कमेंट आ संदेश के घंटी संभालीं',
    languageSubtitle: 'भारत के प्रमुख 7 भाषा में से चुनीं',
    privateAccount: 'प्राइवेट खाता',
    privateAccountDesc: 'जब खाता प्राइवेट होई, तब खाली रउआ से मंजूर दोस्त लोग पोस्ट आ रील्स देख पाई।',
    pauseAllNotifications: 'सभ नोटिफिकेशन रोकीं',
    pauseAllDesc: 'कुकुरमुत्ता नियर आवे वाला अलर्ट कुछ देर खातिर रोकीं।',
    storiesAndPosts: 'स्टोरी आ पोस्ट के घंटी',
    directMessagesNotif: 'सीधे संदेश आ चैट',

    nameLabel: 'नाम',
    usernameLabel: 'यूजरनेम',
    bioLabel: 'बायो (परिचय)',
    websiteLabel: 'वेबसाइट',
    profilePhoto: 'प्रोफाइल फोटो',
    photoUrl: 'फोटो लिंक',
    saveChanges: 'बदलाव सहेजीं',
    cancel: 'हटावल जाव',
    profileUpdatedSuccess: 'प्रोफाइल ठीक से अपडेट हो गइल! ✨',

    searchPlaceholder: 'खाता, टैग आ जगह खोजीं...',
    allCategory: 'सभ',
    travelCategory: 'घूमे-फिरे के',
    streetCategory: 'गली-मोहल्ला',
    natureCategory: 'प्रकृति',
    foodCategory: 'लिट्टी-चोखा आ चाय',

    tagged: 'टैग कइल',
    noPostsYet: 'अझू कवनो पोस्ट नइखे',
    noSavedPosts: 'कवनो सहेजल पोस्ट नइखे',
    googleAccount: 'गूगल खाता',
    googleVerifiedCreator: 'गूगल जाँचल क्रिएटर',
    manage: 'संभालीं',

    notInterested: 'कम दिखाईं',
    showMoreLikeThis: 'अइसन अउरी वीडियो दिखाईं',
    whyAmISeeingThis: 'ई हमरा काहे लउकत बा?',
    tunedFeedToast: 'रउआ पसंद के अनुसार फ़ीड ट्यून हो गइल',
  },
};
