import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard App Icon SVG (512x512)
const standardIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="badge-grad" x1="5%" y1="0%" x2="95%" y2="100%">
      <stop offset="0%" stop-color="#FF5E3A" />
      <stop offset="45%" stop-color="#FF2A6D" />
      <stop offset="78%" stop-color="#9C27B0" />
      <stop offset="100%" stop-color="#673AB7" />
    </linearGradient>

    <linearGradient id="rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.3" />
    </linearGradient>

    <linearGradient id="j-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#FFF4E6" />
      <stop offset="100%" stop-color="#FFD1A4" />
    </linearGradient>

    <linearGradient id="blade-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.15" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.45" />
    </filter>

    <filter id="j-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feColorMatrix type="matrix" values="1 0 0 0 1   0 1 0 0 0.8   0 0 1 0 0.8   0 0 0 0.7 0" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Base (Transparent padding around squircle for standard icon) -->
  <g filter="url(#shadow)">
    <rect x="36" y="36" width="440" height="440" rx="112" fill="url(#badge-grad)" />
  </g>

  <!-- Inner Rim Highlight -->
  <rect x="40" y="40" width="432" height="432" rx="108" stroke="url(#rim-grad)" stroke-width="8" fill="none" />

  <!-- Camera Top Flash Viewfinder Bump -->
  <path d="M 190 76 Q 256 68 322 76 L 308 100 L 204 100 Z" fill="#FFFFFF" fill-opacity="0.3" />

  <!-- Camera Sensor Dot -->
  <circle cx="390" cy="130" r="16" fill="#FFFFFF" opacity="0.95" />
  <circle cx="390" cy="130" r="28" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="4" />

  <!-- Camera Lens Outer Ring -->
  <circle cx="256" cy="270" r="144" stroke="#FFFFFF" stroke-width="10" stroke-opacity="0.4" fill="#000000" fill-opacity="0.18" />
  <circle cx="256" cy="270" r="124" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.25" stroke-dasharray="14 10" />

  <!-- Shutter Aperture Blades -->
  <g stroke="url(#blade-grad)" stroke-width="6" stroke-linecap="round">
    <path d="M 256 144 C 275 174, 304 202, 356 206" />
    <path d="M 370 240 C 352 274, 332 308, 342 366" />
    <path d="M 322 376 C 290 370, 250 362, 206 386" />
    <path d="M 164 350 C 178 312, 188 274, 154 230" />
    <path d="M 150 206 C 188 206, 222 210, 246 168" />
    <circle cx="256" cy="270" r="80" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.2" fill="none" />
  </g>

  <!-- Glowing Calligraphic "J" -->
  <g transform="translate(16, 20) scale(4.8)">
    <!-- Ambient Glow silhouette -->
    <path
      d="M 44 32 L 64 32 C 65.5 32 66 33 66 34.5 L 61 34.5 C 60 34.5 59.5 35 59.5 36.5 L 59.5 57.5 C 59.5 67 52 74 42 74 C 33.5 74 28 68.5 28 61 C 28 54.5 32.5 50.5 38 50.5 C 41 50.5 43.5 51.8 44.5 53.8 C 43.5 56.5 41 57.5 38.5 57.5 C 36 57.5 34.5 59 34.5 61 C 34.5 64.5 37.8 67.5 42.5 67.5 C 48.5 67.5 52.5 63 52.5 56.5 L 52.5 36.5 C 52.5 35 52 34.5 50.5 34.5 L 44 34.5 C 43 34.5 42.5 34 42.5 33.2 C 42.5 32.5 43 32 44 32 Z"
      fill="#FF2A6D"
      opacity="0.85"
      filter="url(#j-glow)"
    />
    <!-- Sharp Front "J" -->
    <path
      d="M 44 32 L 64 32 C 65.5 32 66 33 66 34.5 L 61 34.5 C 60 34.5 59.5 35 59.5 36.5 L 59.5 57.5 C 59.5 67 52 74 42 74 C 33.5 74 28 68.5 28 61 C 28 54.5 32.5 50.5 38 50.5 C 41 50.5 43.5 51.8 44.5 53.8 C 43.5 56.5 41 57.5 38.5 57.5 C 36 57.5 34.5 59 34.5 61 C 34.5 64.5 37.8 67.5 42.5 67.5 C 48.5 67.5 52.5 63 52.5 56.5 L 52.5 36.5 C 52.5 35 52 34.5 50.5 34.5 L 44 34.5 C 43 34.5 42.5 34 42.5 33.2 C 42.5 32.5 43 32 44 32 Z"
      fill="url(#j-grad)"
    />
    <circle cx="60" cy="33.5" r="2.2" fill="#FFFFFF" />
  </g>
</svg>
`;

// 2. Maskable App Icon SVG (512x512)
// Full-bleed background with the logo centered within the 80% safe zone (center circle ~410px)
const maskableIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="mask-bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#2c0a38" />
      <stop offset="60%" stop-color="#14041c" />
      <stop offset="100%" stop-color="#08020b" />
    </radialGradient>

    <linearGradient id="badge-grad-mask" x1="5%" y1="0%" x2="95%" y2="100%">
      <stop offset="0%" stop-color="#FF5E3A" />
      <stop offset="45%" stop-color="#FF2A6D" />
      <stop offset="78%" stop-color="#9C27B0" />
      <stop offset="100%" stop-color="#673AB7" />
    </linearGradient>

    <linearGradient id="rim-grad-mask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.3" />
    </linearGradient>

    <linearGradient id="j-grad-mask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#FFF4E6" />
      <stop offset="100%" stop-color="#FFD1A4" />
    </linearGradient>

    <linearGradient id="blade-grad-mask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.15" />
    </linearGradient>

    <filter id="j-glow-mask" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feColorMatrix type="matrix" values="1 0 0 0 1   0 1 0 0 0.8   0 0 1 0 0.8   0 0 0 0.7 0" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Full-bleed background -->
  <rect width="512" height="512" fill="url(#mask-bg)" />

  <!-- Ambient Glow -->
  <circle cx="256" cy="256" r="180" fill="#FF2A6D" opacity="0.25" filter="blur(30px)" />

  <!-- Safe Zone content: scaled to 78% of 512 = 400x400 centered at (56, 56) -->
  <g transform="translate(68, 68) scale(0.734)">
    <rect x="36" y="36" width="440" height="440" rx="112" fill="url(#badge-grad-mask)" />
    <rect x="40" y="40" width="432" height="432" rx="108" stroke="url(#rim-grad-mask)" stroke-width="8" fill="none" />
    <path d="M 190 76 Q 256 68 322 76 L 308 100 L 204 100 Z" fill="#FFFFFF" fill-opacity="0.3" />
    <circle cx="390" cy="130" r="16" fill="#FFFFFF" opacity="0.95" />
    <circle cx="390" cy="130" r="28" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="4" />
    <circle cx="256" cy="270" r="144" stroke="#FFFFFF" stroke-width="10" stroke-opacity="0.4" fill="#000000" fill-opacity="0.18" />
    <circle cx="256" cy="270" r="124" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.25" stroke-dasharray="14 10" />
    <g stroke="url(#blade-grad-mask)" stroke-width="6" stroke-linecap="round">
      <path d="M 256 144 C 275 174, 304 202, 356 206" />
      <path d="M 370 240 C 352 274, 332 308, 342 366" />
      <path d="M 322 376 C 290 370, 250 362, 206 386" />
      <path d="M 164 350 C 178 312, 188 274, 154 230" />
      <path d="M 150 206 C 188 206, 222 210, 246 168" />
      <circle cx="256" cy="270" r="80" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.2" fill="none" />
    </g>
    <g transform="translate(16, 20) scale(4.8)">
      <path
        d="M 44 32 L 64 32 C 65.5 32 66 33 66 34.5 L 61 34.5 C 60 34.5 59.5 35 59.5 36.5 L 59.5 57.5 C 59.5 67 52 74 42 74 C 33.5 74 28 68.5 28 61 C 28 54.5 32.5 50.5 38 50.5 C 41 50.5 43.5 51.8 44.5 53.8 C 43.5 56.5 41 57.5 38.5 57.5 C 36 57.5 34.5 59 34.5 61 C 34.5 64.5 37.8 67.5 42.5 67.5 C 48.5 67.5 52.5 63 52.5 56.5 L 52.5 36.5 C 52.5 35 52 34.5 50.5 34.5 L 44 34.5 C 43 34.5 42.5 34 42.5 33.2 C 42.5 32.5 43 32 44 32 Z"
        fill="#FF2A6D"
        opacity="0.85"
        filter="url(#j-glow-mask)"
      />
      <path
        d="M 44 32 L 64 32 C 65.5 32 66 33 66 34.5 L 61 34.5 C 60 34.5 59.5 35 59.5 36.5 L 59.5 57.5 C 59.5 67 52 74 42 74 C 33.5 74 28 68.5 28 61 C 28 54.5 32.5 50.5 38 50.5 C 41 50.5 43.5 51.8 44.5 53.8 C 43.5 56.5 41 57.5 38.5 57.5 C 36 57.5 34.5 59 34.5 61 C 34.5 64.5 37.8 67.5 42.5 67.5 C 48.5 67.5 52.5 63 52.5 63 52.5 56.5 L 52.5 36.5 C 52.5 35 52 34.5 50.5 34.5 L 44 34.5 C 43 34.5 42.5 34 42.5 33.2 C 42.5 32.5 43 32 44 32 Z"
        fill="url(#j-grad-mask)"
      />
      <circle cx="60" cy="33.5" r="2.2" fill="#FFFFFF" />
    </g>
  </g>
</svg>
`;

async function build() {
  console.log('Generating PWA icons...');
  
  // Save icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardIconSvg.trim());

  // Generate pwa-512x512.png
  await sharp(Buffer.from(standardIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // Generate pwa-maskable-512x512.png
  await sharp(Buffer.from(maskableIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // Generate pwa-192x192.png
  await sharp(Buffer.from(standardIconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardIconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Generate favicon-32x32.png
  await sharp(Buffer.from(standardIconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');

  console.log('All icons generated successfully!');
}

build().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
