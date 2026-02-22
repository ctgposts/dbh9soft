import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const svgContent = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5b21b6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <circle cx="100" cy="100" r="95" fill="url(#bgGradient)"/>
  <circle cx="100" cy="100" r="95" fill="none" stroke="#fff" stroke-width="2" opacity="0.3"/>
  
  <g transform="translate(100, 100)">
    <circle cx="0" cy="-35" r="12" fill="#fff" opacity="0.9"/>
    <path d="M -12,-25 Q -25,-20 -28,0 L -28,50 Q -28,55 -23,55 L 23,55 Q 28,55 28,50 L 28,0 Q 25,-20 12,-25" fill="#fff" opacity="0.85"/>
    <ellipse cx="0" cy="25" rx="22" ry="38" fill="#fff" opacity="0.8"/>
    <circle cx="-8" cy="5" r="2" fill="#7c3aed" opacity="0.6"/>
    <circle cx="8" cy="5" r="2" fill="#7c3aed" opacity="0.6"/>
    <circle cx="-6" cy="20" r="1.5" fill="#7c3aed" opacity="0.4"/>
    <circle cx="6" cy="20" r="1.5" fill="#7c3aed" opacity="0.4"/>
    <circle cx="0" cy="35" r="1.5" fill="#7c3aed" opacity="0.4"/>
    <path d="M -22,10 Q -35,15 -38,35" stroke="#fff" stroke-width="3" fill="none" opacity="0.8"/>
    <path d="M 22,10 Q 35,15 38,35" stroke="#fff" stroke-width="3" fill="none" opacity="0.8"/>
  </g>
</svg>
`;

const sizes = [16, 32, 64, 192, 512];
const publicDir = path.join(__dirname, 'public');

async function generateIcons() {
  try {
    console.log('🎨 আইকন তৈরি শুরু হচ্ছে...\n');
    
    // Favicon (16x16 and 32x32)
    for (const size of [16, 32]) {
      await sharp(Buffer.from(svgContent))
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(publicDir, `favicon-${size}.png`));
      console.log(`✅ favicon-${size}.png তৈরি হয়েছে`);
    }
    
    // App icons (192x192, 512x512)
    for (const size of [192, 512]) {
      await sharp(Buffer.from(svgContent))
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
      console.log(`✅ icon-${size}x${size}.png তৈরি হয়েছে`);
    }
    
    // Standard favicon.ico (using 32x32 as base)
    await sharp(Buffer.from(svgContent))
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    console.log(`✅ favicon.png তৈরি হয়েছে`);
    
    // Apple touch icon
    await sharp(Buffer.from(svgContent))
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log(`✅ apple-touch-icon.png তৈরি হয়েছে`);
    
    console.log('\n✨ সকল আইকন সফলভাবে তৈরি হয়েছে!');
    console.log('📁 আইকনগুলি public/ ফোল্ডারে সংরক্ষিত হয়েছে।');
    
  } catch (error) {
    console.error('❌ আইকন তৈরিতে ত্রুটি:', error.message);
    process.exit(1);
  }
}

generateIcons();
