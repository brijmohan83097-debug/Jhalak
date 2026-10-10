const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const assetsDir = path.join(publicDir, 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1. Read master icon.svg
const iconSvgPath = path.join(publicDir, 'icon.svg');
const iconSvgContent = fs.readFileSync(iconSvgPath, 'utf8');

// Synchronize all svg instances
fs.writeFileSync(path.join(publicDir, 'logo.svg'), iconSvgContent);
fs.writeFileSync(path.join(assetsDir, 'logo.svg'), iconSvgContent);
fs.writeFileSync(path.join(assetsDir, 'jhalak-tiranga-logo.svg'), iconSvgContent);

// 2. Generate maskable SVG with full-bleed royal blue background and centered badge within 80% safe zone
// Extract defs and badge content from iconSvgContent
const defsMatch = iconSvgContent.match(/<defs>([\s\S]*?)<\/defs>/);
const defsContent = defsMatch ? defsMatch[1] : '';

// Body content is everything after </defs> and before </svg>
const bodyMatch = iconSvgContent.match(/<\/defs>([\s\S]*?)<\/svg>/);
const bodyContent = bodyMatch ? bodyMatch[1] : '';

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Full-bleed background gradient for Maskable Icon -->
    <linearGradient id="maskable-full-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#1E52B5"/>
      <stop offset="30%" stopColor="#0F3A8E"/>
      <stop offset="70%" stopColor="#09276E"/>
      <stop offset="100%" stopColor="#030F2C"/>
    </linearGradient>
    ${defsContent}
  </defs>

  <!-- Solid full-bleed background ensuring no transparency clipping on Android / Chrome mask -->
  <rect width="512" height="512" fill="url(#maskable-full-bg)"/>

  <!-- Centered Jhalak Tiranga 3D Badge scaled to 78% (Within Safe Zone circle r=204.8) -->
  <g transform="translate(56, 56) scale(0.78)">
    ${bodyContent}
  </g>
</svg>`;

const maskableSvgPath = path.join(publicDir, 'pwa-maskable.svg');
fs.writeFileSync(maskableSvgPath, maskableSvg);

async function buildBrandAssets() {
  console.log('Rendering 3D Jhalak Tiranga brand assets with sharp...');

  // 1. High-definition 512x512 logo.png
  await sharp(Buffer.from(iconSvgContent))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ Created public/logo.png');

  // Copy to public/assets/logo.png and public/assets/jhalak-tiranga-logo.png
  fs.copyFileSync(path.join(publicDir, 'logo.png'), path.join(assetsDir, 'logo.png'));
  fs.copyFileSync(path.join(publicDir, 'logo.png'), path.join(assetsDir, 'jhalak-tiranga-logo.png'));
  console.log('✓ Created public/assets/ copies');

  // 2. pwa-512x512.png
  fs.copyFileSync(path.join(publicDir, 'logo.png'), path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created public/pwa-512x512.png');

  // 3. pwa-192x192.png
  await sharp(Buffer.from(iconSvgContent))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created public/pwa-192x192.png');

  // 4. pwa-maskable-512x512.png (solid background with safe margin)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created public/pwa-maskable-512x512.png');

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(maskableSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png');

  // 6. favicon-32x32.png and favicon.png and favicon.ico
  await sharp(Buffer.from(iconSvgContent))
    .resize(32, 32)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.png'));
  fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));
  console.log('✓ Created favicons');

  console.log('All brand assets successfully rebuilt!');
}

buildBrandAssets().catch(err => {
  console.error('Error building brand assets:', err);
  process.exit(1);
});
