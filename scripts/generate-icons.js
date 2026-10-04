import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const assetsDir = path.join(publicDir, 'assets');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const logoSvgPath = path.join(assetsDir, 'jhalak-tiranga-logo.svg');
if (!fs.existsSync(logoSvgPath)) {
  console.error('Missing public/assets/jhalak-tiranga-logo.svg');
  process.exit(1);
}

const standardSvg = fs.readFileSync(logoSvgPath, 'utf-8');

// Maskable icon: Full-bleed royal blue background with the entire badge scaled to 80% safe zone
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <!-- Background Royal Blue Depth -->
    <linearGradient id="bg-royal-grad-mask" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#1E52B5"/>
      <stop offset="25%" stopColor="#0F3A8E"/>
      <stop offset="65%" stopColor="#09276E"/>
      <stop offset="100%" stopColor="#030F2C"/>
    </linearGradient>
  </defs>
  <!-- Full-bleed background for maskable safe area -->
  <rect width="512" height="512" fill="url(#bg-royal-grad-mask)"/>
  <!-- Centered safe-zone scaled badge (~80%) -->
  <g transform="translate(51, 51) scale(0.8)">
    ${standardSvg.replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>
`;

async function build() {
  console.log('Generating official Jhalak Tiranga PWA & App icons...');

  // 1. icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg.trim());
  console.log('Created public/icon.svg');

  // 2. pwa-512x512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 3. pwa-maskable-512x512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created public/pwa-maskable-512x512.png');

  // 4. pwa-192x192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 6. favicon-32x32.png
  await sharp(Buffer.from(standardSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created public/favicon-32x32.png');

  // 7. jhalak-tiranga-logo.png (512x512)
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'jhalak-tiranga-logo.png'));
  console.log('Created public/assets/jhalak-tiranga-logo.png');

  // Also sync to dist if dist exists
  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    const distAssets = path.join(distDir, 'assets');
    if (!fs.existsSync(distAssets)) fs.mkdirSync(distAssets, { recursive: true });
    fs.copyFileSync(path.join(publicDir, 'icon.svg'), path.join(distDir, 'icon.svg'));
    fs.copyFileSync(path.join(publicDir, 'pwa-512x512.png'), path.join(distDir, 'pwa-512x512.png'));
    fs.copyFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), path.join(distDir, 'pwa-maskable-512x512.png'));
    fs.copyFileSync(path.join(publicDir, 'pwa-192x192.png'), path.join(distDir, 'pwa-192x192.png'));
    fs.copyFileSync(path.join(publicDir, 'apple-touch-icon.png'), path.join(distDir, 'apple-touch-icon.png'));
    fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(distDir, 'favicon-32x32.png'));
    fs.copyFileSync(path.join(assetsDir, 'jhalak-tiranga-logo.png'), path.join(distAssets, 'jhalak-tiranga-logo.png'));
    fs.copyFileSync(path.join(assetsDir, 'jhalak-tiranga-logo.svg'), path.join(distAssets, 'jhalak-tiranga-logo.svg'));
    console.log('Synced all icons to dist/');
  }

  console.log('All official Jhalak Tiranga icons generated successfully!');
}

build().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
