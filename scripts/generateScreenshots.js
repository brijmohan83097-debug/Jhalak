import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, '../public/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Mobile Screenshot 1: Home Feed & Stories (1080x1920)
const svgMobile1 = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0e"/>
      <stop offset="100%" stop-color="#121218"/>
    </linearGradient>
    <linearGradient id="instaGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="tirangaGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF9933"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#138808"/>
    </linearGradient>
    <linearGradient id="postGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#31102f"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bgGrad)"/>

  <!-- Top Status Bar -->
  <rect width="1080" height="64" fill="#0a0a0e"/>
  <text x="70" y="44" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="600">9:41</text>
  <circle cx="960" cy="38" r="8" fill="#ffffff"/>
  <circle cx="985" cy="38" r="8" fill="#ffffff"/>
  <rect x="1010" y="28" width="36" height="20" rx="6" fill="#ffffff" stroke="#ffffff" stroke-width="2"/>

  <!-- App Header -->
  <g transform="translate(48, 100)">
    <text x="0" y="52" fill="#ffffff" font-family="'Playfair Display', Georgia, serif" font-size="64" font-weight="900" letter-spacing="-1">Jhalak</text>
    <text x="210" y="52" fill="#ec4899" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="800">Reels</text>
    <rect x="340" y="16" width="120" height="36" rx="18" fill="url(#tirangaGrad)"/>
    <text x="400" y="41" fill="#000000" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="900" text-anchor="middle">INDIA</text>

    <!-- Header Actions -->
    <circle cx="870" cy="34" r="32" fill="#1e1e28"/>
    <text x="870" y="44" fill="#ffffff" font-size="32" text-anchor="middle">❤️</text>
    <circle cx="960" cy="34" r="32" fill="#1e1e28"/>
    <text x="960" y="44" fill="#ffffff" font-size="30" text-anchor="middle">💬</text>
    <circle cx="980" cy="18" r="14" fill="#ef4444"/>
    <text x="980" y="24" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle">3</text>
  </g>

  <!-- Stories Bar -->
  <g transform="translate(48, 210)">
    <!-- Story 1 (Your Story) -->
    <circle cx="70" cy="70" r="64" fill="none" stroke="#374151" stroke-width="4"/>
    <circle cx="70" cy="70" r="56" fill="#1f2937"/>
    <text x="70" y="80" fill="#ffffff" font-size="42" text-anchor="middle">🧑‍🎤</text>
    <circle cx="110" cy="110" r="20" fill="#3b82f6" stroke="#0a0a0e" stroke-width="4"/>
    <text x="110" y="118" fill="#ffffff" font-size="26" font-weight="bold" text-anchor="middle">+</text>
    <text x="70" y="160" fill="#9ca3af" font-family="sans-serif" font-size="22" text-anchor="middle">Your Story</text>

    <!-- Story 2 -->
    <g transform="translate(160, 0)">
      <circle cx="70" cy="70" r="64" fill="none" stroke="url(#instaGrad)" stroke-width="6"/>
      <circle cx="70" cy="70" r="56" fill="#3730a3"/>
      <text x="70" y="80" fill="#ffffff" font-size="42" text-anchor="middle">🪕</text>
      <text x="70" y="160" fill="#f3f4f6" font-family="sans-serif" font-size="22" font-weight="600" text-anchor="middle">Pawan_Singh</text>
    </g>

    <!-- Story 3 -->
    <g transform="translate(320, 0)">
      <circle cx="70" cy="70" r="64" fill="none" stroke="url(#instaGrad)" stroke-width="6"/>
      <circle cx="70" cy="70" r="56" fill="#831843"/>
      <text x="70" y="80" fill="#ffffff" font-size="42" text-anchor="middle">💃</text>
      <text x="70" y="160" fill="#f3f4f6" font-family="sans-serif" font-size="22" font-weight="600" text-anchor="middle">Khesari_Lal</text>
    </g>

    <!-- Story 4 -->
    <g transform="translate(480, 0)">
      <circle cx="70" cy="70" r="64" fill="none" stroke="url(#instaGrad)" stroke-width="6"/>
      <circle cx="70" cy="70" r="56" fill="#065f46"/>
      <text x="70" y="80" fill="#ffffff" font-size="42" text-anchor="middle">🌟</text>
      <text x="70" y="160" fill="#f3f4f6" font-family="sans-serif" font-size="22" font-weight="600" text-anchor="middle">Akshara_Singh</text>
    </g>

    <!-- Story 5 -->
    <g transform="translate(640, 0)">
      <circle cx="70" cy="70" r="64" fill="none" stroke="url(#instaGrad)" stroke-width="6"/>
      <circle cx="70" cy="70" r="56" fill="#78350f"/>
      <text x="70" y="80" fill="#ffffff" font-size="42" text-anchor="middle">🎬</text>
      <text x="70" y="160" fill="#f3f4f6" font-family="sans-serif" font-size="22" font-weight="600" text-anchor="middle">Bhojpuri_Film</text>
    </g>

    <!-- Story 6 -->
    <g transform="translate(800, 0)">
      <circle cx="70" cy="70" r="64" fill="none" stroke="url(#instaGrad)" stroke-width="6"/>
      <circle cx="70" cy="70" r="56" fill="#1e3a8a"/>
      <text x="70" y="80" fill="#ffffff" font-size="42" text-anchor="middle">👑</text>
      <text x="70" y="160" fill="#f3f4f6" font-family="sans-serif" font-size="22" font-weight="600" text-anchor="middle">Manoj_Tiwari</text>
    </g>
  </g>

  <line x1="0" y1="410" x2="1080" y2="410" stroke="#1f2937" stroke-width="2"/>

  <!-- Post Card -->
  <g transform="translate(0, 420)">
    <!-- Post Creator Header -->
    <g transform="translate(48, 30)">
      <circle cx="40" cy="40" r="38" fill="url(#instaGrad)"/>
      <circle cx="40" cy="40" r="34" fill="#0f172a"/>
      <text x="40" y="52" fill="#ffffff" font-size="28" text-anchor="middle">🎤</text>
      <text x="96" y="38" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="700">pawan_singh_official</text>
      <circle cx="420" cy="30" r="12" fill="#38bdf8"/>
      <text x="420" y="36" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">✓</text>
      <text x="96" y="66" fill="#9ca3af" font-family="sans-serif" font-size="22">Patna, Bihar • Original Audio</text>
      <text x="960" y="44" fill="#9ca3af" font-size="34">•••</text>
    </g>

    <!-- Post Media Viewport -->
    <rect x="0" y="110" width="1080" height="960" fill="url(#postGrad)"/>
    
    <!-- Stage Performance Artwork within Post -->
    <circle cx="540" cy="540" r="260" fill="#ec4899" opacity="0.25"/>
    <circle cx="540" cy="540" r="180" fill="#f59e0b" opacity="0.3"/>
    <text x="540" y="510" fill="#ffffff" font-size="130" text-anchor="middle">🪕</text>
    <rect x="360" y="620" width="360" height="60" rx="30" fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <text x="540" y="660" fill="#ffffff" font-family="sans-serif" font-size="26" font-weight="bold" text-anchor="middle">🔥 Superhit Bhojpuri Dhamaka</text>

    <!-- Post Floating Audio Pill -->
    <rect x="48" y="990" width="460" height="52" rx="26" fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    <text x="75" y="1025" fill="#f43f5e" font-size="24">🎵</text>
    <text x="110" y="1025" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="600">Lollipop Lagelu • Pawan Singh</text>

    <!-- Post Actions -->
    <g transform="translate(48, 1100)">
      <text x="10" y="44" fill="#f43f5e" font-size="50">❤️</text>
      <text x="70" y="42" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="700">182K</text>

      <text x="210" y="44" fill="#ffffff" font-size="46">💬</text>
      <text x="270" y="42" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="700">3,490</text>

      <text x="410" y="44" fill="#ffffff" font-size="46">↗️</text>
      <text x="470" y="42" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="700">54K</text>

      <text x="930" y="44" fill="#ffffff" font-size="46">🔖</text>
    </g>

    <!-- Post Caption -->
    <g transform="translate(48, 1190)">
      <text x="0" y="0" fill="#ffffff" font-family="sans-serif" font-size="28" font-weight="700">pawan_singh_official</text>
      <text x="290" y="0" fill="#e5e7eb" font-family="sans-serif" font-size="28">नया रील रिलीज हो गइल बा! 🔥</text>
      <text x="0" y="40" fill="#38bdf8" font-family="sans-serif" font-size="26">#Jhalak #BhojpuriReels #Bawaal #PawanSingh</text>
      <text x="0" y="80" fill="#9ca3af" font-family="sans-serif" font-size="24">View all 3,490 comments</text>
      <text x="0" y="115" fill="#6b7280" font-family="sans-serif" font-size="20">2 HOURS AGO</text>
    </g>
  </g>

  <!-- Bottom Navigation Bar -->
  <rect x="0" y="1780" width="1080" height="140" fill="#0a0a0e" stroke="#1f2937" stroke-width="2"/>
  <g transform="translate(0, 1820)">
    <!-- Home (Active) -->
    <g transform="translate(108, 0)">
      <text x="0" y="30" fill="#ffffff" font-size="48" text-anchor="middle">🏠</text>
      <circle cx="0" cy="50" r="4" fill="#ffffff"/>
    </g>
    <!-- Search -->
    <g transform="translate(324, 0)">
      <text x="0" y="30" fill="#9ca3af" font-size="48" text-anchor="middle">🔍</text>
    </g>
    <!-- Create / Camera -->
    <g transform="translate(540, 0)">
      <rect x="-34" y="-12" width="68" height="52" rx="16" fill="none" stroke="#ffffff" stroke-width="6"/>
      <text x="0" y="24" fill="#ffffff" font-size="34" font-weight="bold" text-anchor="middle">+</text>
    </g>
    <!-- Reels -->
    <g transform="translate(756, 0)">
      <text x="0" y="30" fill="#9ca3af" font-size="48" text-anchor="middle">🎬</text>
    </g>
    <!-- Profile -->
    <g transform="translate(972, 0)">
      <circle cx="0" cy="18" r="26" fill="#f59e0b"/>
      <text x="0" y="27" fill="#ffffff" font-size="24" text-anchor="middle">👤</text>
    </g>
  </g>
</svg>
`;

// 2. Mobile Screenshot 2: Fullscreen Reels Player (1080x1920)
const svgMobile2 = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="reelGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4a044e"/>
      <stop offset="40%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="overlayFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.5)"/>
      <stop offset="30%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="70%" stop-color="rgba(0,0,0,0.2)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.92)"/>
    </linearGradient>
  </defs>

  <!-- Video Reel Fullscreen Background -->
  <rect width="1080" height="1920" fill="url(#reelGrad)"/>
  <rect width="1080" height="1920" fill="url(#overlayFade)"/>

  <!-- High-Energy Visual Elements in Video -->
  <circle cx="540" cy="850" r="320" fill="#ec4899" opacity="0.18"/>
  <circle cx="540" cy="850" r="220" fill="#f59e0b" opacity="0.22"/>
  <text x="540" y="860" fill="#ffffff" font-size="180" text-anchor="middle">💃</text>
  <text x="540" y="990" fill="#fde047" font-family="'Outfit', sans-serif" font-size="54" font-weight="900" text-anchor="middle" letter-spacing="2">KAMARIYA KARE LAPA LAP</text>

  <!-- Top Reels Header -->
  <g transform="translate(48, 90)">
    <text x="0" y="44" fill="#ffffff" font-family="'Outfit', sans-serif" font-size="48" font-weight="900" letter-spacing="1">Reels</text>
    <rect x="150" y="14" width="70" height="34" rx="17" fill="#ef4444"/>
    <text x="185" y="38" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">LIVE</text>
    <text x="960" y="44" fill="#ffffff" font-size="44">📷</text>
  </g>

  <!-- Right Floating Interaction Rail -->
  <g transform="translate(940, 950)">
    <!-- Like -->
    <g transform="translate(0, 0)">
      <circle cx="40" cy="40" r="44" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <text x="40" y="52" fill="#f43f5e" font-size="44" text-anchor="middle">❤️</text>
      <text x="40" y="112" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="700" text-anchor="middle">482K</text>
    </g>

    <!-- Comment -->
    <g transform="translate(0, 160)">
      <circle cx="40" cy="40" r="44" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <text x="40" y="52" fill="#ffffff" font-size="40" text-anchor="middle">💬</text>
      <text x="40" y="112" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="700" text-anchor="middle">12.8K</text>
    </g>

    <!-- Share -->
    <g transform="translate(0, 320)">
      <circle cx="40" cy="40" r="44" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <text x="40" y="52" fill="#ffffff" font-size="40" text-anchor="middle">↗️</text>
      <text x="40" y="112" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="700" text-anchor="middle">89K</text>
    </g>

    <!-- More -->
    <g transform="translate(0, 480)">
      <circle cx="40" cy="40" r="44" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <text x="40" y="48" fill="#ffffff" font-size="34" text-anchor="middle">•••</text>
    </g>

    <!-- Spinning Audio Vinyl Disc -->
    <g transform="translate(0, 620)">
      <circle cx="40" cy="40" r="40" fill="#18181b" stroke="#3f3f46" stroke-width="6"/>
      <circle cx="40" cy="40" r="16" fill="#f43f5e"/>
      <circle cx="40" cy="40" r="6" fill="#ffffff"/>
    </g>
  </g>

  <!-- Bottom Metadata & Creator Information -->
  <g transform="translate(48, 1480)">
    <!-- Creator Profile Header -->
    <g>
      <circle cx="42" cy="42" r="42" fill="#f59e0b"/>
      <text x="42" y="56" fill="#ffffff" font-size="36" text-anchor="middle">🎤</text>
      <text x="108" y="42" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="800">@khesari_official</text>
      <circle cx="410" cy="32" r="14" fill="#38bdf8"/>
      <text x="410" y="39" fill="#ffffff" font-size="16" font-weight="bold" text-anchor="middle">✓</text>
      <rect x="450" y="12" width="130" height="46" rx="23" fill="#ffffff"/>
      <text x="515" y="42" fill="#000000" font-family="sans-serif" font-size="22" font-weight="800" text-anchor="middle">Follow</text>
    </g>

    <!-- Reel Title & Bhojpuri Tagline -->
    <text x="0" y="130" fill="#ffffff" font-family="sans-serif" font-size="30" font-weight="600">कमरिया करे लपालप 💃 रंगदार भोजपुरिया अंदाज में!</text>
    <text x="0" y="175" fill="#fde047" font-family="sans-serif" font-size="28" font-weight="bold">#BhojpuriReels #Jhalak #Bawaal #KhesariLal #HitSong</text>

    <!-- Music Badge Pill -->
    <rect x="0" y="210" width="600" height="56" rx="28" fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <text x="35" y="247" fill="#f43f5e" font-size="26">🎵</text>
    <text x="75" y="247" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="600">Khesari Lal • Kamariya Kare Lapa Lap (Original Sound)</text>
  </g>

  <!-- Bottom Navigation Bar -->
  <rect x="0" y="1780" width="1080" height="140" fill="rgba(0,0,0,0.85)" stroke="#1f2937" stroke-width="2"/>
  <g transform="translate(0, 1820)">
    <g transform="translate(108, 0)"><text x="0" y="30" fill="#9ca3af" font-size="48" text-anchor="middle">🏠</text></g>
    <g transform="translate(324, 0)"><text x="0" y="30" fill="#9ca3af" font-size="48" text-anchor="middle">🔍</text></g>
    <g transform="translate(540, 0)">
      <rect x="-34" y="-12" width="68" height="52" rx="16" fill="none" stroke="#9ca3af" stroke-width="6"/>
      <text x="0" y="24" fill="#9ca3af" font-size="34" font-weight="bold" text-anchor="middle">+</text>
    </g>
    <!-- Reels (Active) -->
    <g transform="translate(756, 0)">
      <text x="0" y="30" fill="#ffffff" font-size="48" text-anchor="middle">🎬</text>
      <circle cx="0" cy="50" r="4" fill="#ffffff"/>
    </g>
    <g transform="translate(972, 0)">
      <circle cx="0" cy="18" r="26" fill="#f59e0b"/>
      <text x="0" y="27" fill="#ffffff" font-size="24" text-anchor="middle">👤</text>
    </g>
  </g>
</svg>
`;

// 3. Desktop Screenshot: Wide Layout (1920x1080)
const svgDesktop = `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dDeskBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="100%" stop-color="#14141e"/>
    </linearGradient>
    <linearGradient id="dTiranga" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF9933"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#138808"/>
    </linearGradient>
    <linearGradient id="dInsta" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="dReelPost" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b0764"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#042f2e"/>
    </linearGradient>
  </defs>

  <!-- Full Background -->
  <rect width="1920" height="1080" fill="url(#dDeskBg)"/>

  <!-- Left Sidebar (Width 320px) -->
  <rect x="0" y="0" width="320" height="1080" fill="#0f0f15" stroke="#1f2937" stroke-width="2"/>

  <!-- Logo -->
  <g transform="translate(36, 48)">
    <text x="0" y="44" fill="#ffffff" font-family="'Playfair Display', Georgia, serif" font-size="44" font-weight="900">Jhalak</text>
    <text x="144" y="44" fill="#ec4899" font-family="sans-serif" font-size="32" font-weight="800">Reels</text>
    <rect x="236" y="20" width="60" height="22" rx="11" fill="url(#dTiranga)"/>
  </g>

  <!-- Nav Links -->
  <g transform="translate(36, 160)">
    <!-- Home (Active) -->
    <rect x="0" y="0" width="248" height="54" rx="16" fill="#1f2937"/>
    <text x="24" y="36" fill="#ffffff" font-size="26">🏠</text>
    <text x="70" y="36" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="700">Home</text>

    <!-- Search -->
    <text x="24" y="104" fill="#9ca3af" font-size="26">🔍</text>
    <text x="70" y="104" fill="#d1d5db" font-family="sans-serif" font-size="22" font-weight="500">Search</text>

    <!-- Explore -->
    <text x="24" y="172" fill="#9ca3af" font-size="26">🧭</text>
    <text x="70" y="172" fill="#d1d5db" font-family="sans-serif" font-size="22" font-weight="500">Explore</text>

    <!-- Reels -->
    <text x="24" y="240" fill="#f43f5e" font-size="26">🎬</text>
    <text x="70" y="240" fill="#f43f5e" font-family="sans-serif" font-size="22" font-weight="700">Reels</text>

    <!-- Messages -->
    <text x="24" y="308" fill="#9ca3af" font-size="26">💬</text>
    <text x="70" y="308" fill="#d1d5db" font-family="sans-serif" font-size="22" font-weight="500">Messages</text>
    <circle cx="210" cy="300" r="10" fill="#ef4444"/>
    <text x="210" y="305" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">5</text>

    <!-- Notifications -->
    <text x="24" y="376" fill="#9ca3af" font-size="26">❤️</text>
    <text x="70" y="376" fill="#d1d5db" font-family="sans-serif" font-size="22" font-weight="500">Notifications</text>

    <!-- Create -->
    <text x="24" y="444" fill="#9ca3af" font-size="26">➕</text>
    <text x="70" y="444" fill="#d1d5db" font-family="sans-serif" font-size="22" font-weight="500">Create Post</text>

    <!-- Profile -->
    <text x="24" y="512" fill="#9ca3af" font-size="26">👤</text>
    <text x="70" y="512" fill="#d1d5db" font-family="sans-serif" font-size="22" font-weight="500">Profile</text>
  </g>

  <!-- Left Sidebar Footer: Language selector -->
  <g transform="translate(36, 960)">
    <rect x="0" y="0" width="248" height="46" rx="12" fill="#18181b" stroke="#27272a" stroke-width="1.5"/>
    <text x="20" y="30" fill="#ffffff" font-size="20">🌐</text>
    <text x="56" y="30" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">Language: भोजपुरी</text>
  </g>

  <!-- Central Feed Area (X: 360 to 1420) -->
  <!-- Stories Tray -->
  <g transform="translate(420, 40)">
    <rect x="0" y="0" width="960" height="130" rx="20" fill="#0f0f15" stroke="#1f2937" stroke-width="1.5"/>

    <!-- Stories list -->
    <g transform="translate(30, 20)">
      <circle cx="36" cy="36" r="36" fill="url(#dInsta)"/>
      <circle cx="36" cy="36" r="32" fill="#18181b"/>
      <text x="36" y="44" fill="#ffffff" font-size="24" text-anchor="middle">🪕</text>
      <text x="36" y="86" fill="#d1d5db" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">pawan_singh</text>
    </g>

    <g transform="translate(130, 20)">
      <circle cx="36" cy="36" r="36" fill="url(#dInsta)"/>
      <circle cx="36" cy="36" r="32" fill="#18181b"/>
      <text x="36" y="44" fill="#ffffff" font-size="24" text-anchor="middle">💃</text>
      <text x="36" y="86" fill="#d1d5db" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">khesari_lal</text>
    </g>

    <g transform="translate(230, 20)">
      <circle cx="36" cy="36" r="36" fill="url(#dInsta)"/>
      <circle cx="36" cy="36" r="32" fill="#18181b"/>
      <text x="36" y="44" fill="#ffffff" font-size="24" text-anchor="middle">👑</text>
      <text x="36" y="86" fill="#d1d5db" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">akshara_singh</text>
    </g>

    <g transform="translate(330, 20)">
      <circle cx="36" cy="36" r="36" fill="url(#dInsta)"/>
      <circle cx="36" cy="36" r="32" fill="#18181b"/>
      <text x="36" y="44" fill="#ffffff" font-size="24" text-anchor="middle">🌟</text>
      <text x="36" y="86" fill="#d1d5db" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">sharda_sinha</text>
    </g>

    <g transform="translate(430, 20)">
      <circle cx="36" cy="36" r="36" fill="url(#dInsta)"/>
      <circle cx="36" cy="36" r="32" fill="#18181b"/>
      <text x="36" y="44" fill="#ffffff" font-size="24" text-anchor="middle">🎬</text>
      <text x="36" y="86" fill="#d1d5db" font-family="sans-serif" font-size="13" font-weight="600" text-anchor="middle">bhojpuri_hits</text>
    </g>
  </g>

  <!-- Feed Post Card -->
  <g transform="translate(560, 200)">
    <rect x="0" y="0" width="680" height="840" rx="24" fill="#0f0f15" stroke="#1f2937" stroke-width="1.5"/>

    <!-- Post Header -->
    <circle cx="48" cy="48" r="28" fill="url(#dInsta)"/>
    <circle cx="48" cy="48" r="25" fill="#18181b"/>
    <text x="48" y="56" fill="#ffffff" font-size="20" text-anchor="middle">🎤</text>
    <text x="90" y="44" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">pawan_singh_official</text>
    <circle cx="280" cy="38" r="8" fill="#38bdf8"/>
    <text x="280" y="42" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">✓</text>
    <text x="90" y="66" fill="#9ca3af" font-family="sans-serif" font-size="14">Patna, Bihar • Bhojpuri</text>
    <text x="630" y="52" fill="#9ca3af" font-size="22">•••</text>

    <!-- Post Media -->
    <rect x="0" y="96" width="680" height="520" fill="url(#dReelPost)"/>
    <circle cx="340" cy="356" r="140" fill="#ec4899" opacity="0.25"/>
    <text x="340" y="340" fill="#ffffff" font-size="76" text-anchor="middle">🪕</text>
    <text x="340" y="400" fill="#fde047" font-family="sans-serif" font-size="24" font-weight="800" text-anchor="middle">SUPERHIT BHOJPURI REEL 🔥</text>

    <!-- Post Actions -->
    <g transform="translate(32, 640)">
      <text x="0" y="28" fill="#f43f5e" font-size="30">❤️</text>
      <text x="40" y="26" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">182K</text>
      <text x="130" y="28" fill="#ffffff" font-size="28">💬</text>
      <text x="170" y="26" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">3,490</text>
      <text x="260" y="28" fill="#ffffff" font-size="28">↗️</text>
      <text x="580" y="28" fill="#ffffff" font-size="28">🔖</text>
    </g>

    <!-- Post Caption -->
    <g transform="translate(32, 704)">
      <text x="0" y="0" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">pawan_singh_official</text>
      <text x="160" y="0" fill="#d1d5db" font-family="sans-serif" font-size="16">नया रील रिलीज हो गइल बा! देखिए और आनंद लीजिए 🔥</text>
      <text x="0" y="28" fill="#38bdf8" font-family="sans-serif" font-size="15">#Jhalak #BhojpuriReels #Bawaal #PawanSingh</text>
      <text x="0" y="58" fill="#9ca3af" font-family="sans-serif" font-size="14">View all 3,490 comments</text>
    </g>
  </g>

  <!-- Right Sidebar: Suggested Creators (Width 360px) -->
  <g transform="translate(1480, 48)">
    <!-- Current User Card -->
    <g>
      <circle cx="36" cy="36" r="32" fill="#f59e0b"/>
      <text x="36" y="44" fill="#ffffff" font-size="24" text-anchor="middle">👤</text>
      <text x="82" y="30" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">bhojpuri_creator</text>
      <text x="82" y="52" fill="#9ca3af" font-family="sans-serif" font-size="14">Bhojpuri Creator 🇮🇳</text>
      <text x="320" y="40" fill="#38bdf8" font-family="sans-serif" font-size="15" font-weight="700" text-anchor="end">Switch</text>
    </g>

    <!-- Suggestions Header -->
    <g transform="translate(0, 100)">
      <text x="0" y="0" fill="#9ca3af" font-family="sans-serif" font-size="16" font-weight="700">Suggested for you</text>
      <text x="320" y="0" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="700" text-anchor="end">See All</text>
    </g>

    <!-- Suggested Creator 1 -->
    <g transform="translate(0, 136)">
      <circle cx="28" cy="28" r="26" fill="#ec4899"/>
      <text x="28" y="36" fill="#ffffff" font-size="20" text-anchor="middle">💃</text>
      <text x="68" y="24" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">khesari_official</text>
      <text x="68" y="44" fill="#9ca3af" font-family="sans-serif" font-size="13">Popular Bhojpuri Artist</text>
      <text x="320" y="32" fill="#38bdf8" font-family="sans-serif" font-size="15" font-weight="700" text-anchor="end">Follow</text>
    </g>

    <!-- Suggested Creator 2 -->
    <g transform="translate(0, 210)">
      <circle cx="28" cy="28" r="26" fill="#8b5cf6"/>
      <text x="28" y="36" fill="#ffffff" font-size="20" text-anchor="middle">🌟</text>
      <text x="68" y="24" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">akshara_singh</text>
      <text x="68" y="44" fill="#9ca3af" font-family="sans-serif" font-size="13">Trending on Jhalak</text>
      <text x="320" y="32" fill="#38bdf8" font-family="sans-serif" font-size="15" font-weight="700" text-anchor="end">Follow</text>
    </g>

    <!-- Suggested Creator 3 -->
    <g transform="translate(0, 284)">
      <circle cx="28" cy="28" r="26" fill="#10b981"/>
      <text x="28" y="36" fill="#ffffff" font-size="20" text-anchor="middle">🪕</text>
      <text x="68" y="24" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">bhojpuri_music</text>
      <text x="68" y="44" fill="#9ca3af" font-family="sans-serif" font-size="13">Official Music Channel</text>
      <text x="320" y="32" fill="#38bdf8" font-family="sans-serif" font-size="15" font-weight="700" text-anchor="end">Follow</text>
    </g>

    <!-- PWA Store Compliance Badge -->
    <g transform="translate(0, 420)">
      <rect x="0" y="0" width="340" height="96" rx="16" fill="#18181b" stroke="#27272a" stroke-width="1.5"/>
      <text x="20" y="38" fill="#10b981" font-size="28">⚡</text>
      <text x="60" y="34" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">PWA Ready • Offline Support</text>
      <text x="60" y="58" fill="#9ca3af" font-family="sans-serif" font-size="13">Fast loading, installable, cached media</text>
      <text x="60" y="78" fill="#ec4899" font-family="sans-serif" font-size="12" font-weight="600">Jhalak Reels PWA Builder Verified ✓</text>
    </g>
  </g>
</svg>
`;

async function run() {
  console.log('Generating PWA store preview screenshots...');

  // 1. Mobile 1: Home Feed & Stories (narrow, 1080x1920)
  await sharp(Buffer.from(svgMobile1))
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(path.join(outDir, 'screenshot-mobile-1.png'));
  console.log('✓ Created screenshot-mobile-1.png (1080x1920, narrow)');

  // 2. Mobile 2: Fullscreen Reels Player (narrow, 1080x1920)
  await sharp(Buffer.from(svgMobile2))
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(path.join(outDir, 'screenshot-mobile-2.png'));
  console.log('✓ Created screenshot-mobile-2.png (1080x1920, narrow)');

  // 3. Desktop: Wide Layout (wide, 1920x1080)
  await sharp(Buffer.from(svgDesktop))
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(path.join(outDir, 'screenshot-desktop-1.png'));
  console.log('✓ Created screenshot-desktop-1.png (1920x1080, wide)');

  console.log('All screenshots successfully generated in public/screenshots/');
}

run().catch((err) => {
  console.error('Failed to generate screenshots:', err);
  process.exit(1);
});
