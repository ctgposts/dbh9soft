import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

// Use LOGO2.png as source
const sourceImage = path.join(publicDir, 'LOGO2.png');

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon.png', size: 64 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 }
];

async function generateIcons() {
  try {
    console.log('🎨 Generating icons from LOGO2.png...\n');
    
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Created: ${name} (${size}x${size})`);
    }
    
    console.log('\n✨ All icons generated successfully from LOGO2.png!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateIcons();
