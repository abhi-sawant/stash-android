/**
 * Generates Android icon assets from PWA source images.
 *
 * Outputs:
 *   assets/images/icon.png                   – 1024×1024 main icon (fallback)
 *   assets/images/android-icon-foreground.png – 512×512 white bookmark on transparent
 *   assets/images/android-icon-background.png – 512×512 full-bleed gradient background
 *   assets/images/android-icon-monochrome.png – 432×432 black bookmark for themed icons
 */

const Jimp = require('../node_modules/jimp-compact');
const path = require('path');

const ASSETS = path.join(__dirname, '../assets/images');
const PUBLIC = path.join(__dirname, '../public');

async function extractBookmarkLayer(sourcePath, width, height, color) {
  const src = await Jimp.read(sourcePath);
  src.resize(width, height, Jimp.RESIZE_BICUBIC);

  // Background max whiteness ≈ 0.447 (lightest purple), bookmark edge ≈ 0.945.
  // Threshold at 0.7 with a smooth ramp cleanly separates the two layers.
  const THRESHOLD = 0.7;

  return new Promise((resolve, reject) => {
    new Jimp(width, height, 0x00000000, (err, canvas) => {
      if (err) return reject(err);
      src.scan(0, 0, width, height, (x, y, idx) => {
        const r = src.bitmap.data[idx];
        const g = src.bitmap.data[idx + 1];
        const b = src.bitmap.data[idx + 2];
        const a = src.bitmap.data[idx + 3];
        const whiteness = Math.min(r, g, b) / 255;
        const scaled = Math.max(0, (whiteness - THRESHOLD) / (1 - THRESHOLD));
        const newAlpha = Math.round(a * scaled);
        if (newAlpha > 5) {
          const ci = canvas.getPixelIndex(x, y);
          canvas.bitmap.data[ci]     = color[0];
          canvas.bitmap.data[ci + 1] = color[1];
          canvas.bitmap.data[ci + 2] = color[2];
          canvas.bitmap.data[ci + 3] = newAlpha;
        }
      });
      resolve(canvas);
    });
  });
}

async function main() {
  const pwa512 = PUBLIC + '/pwa-512x512.png';
  const maskable = PUBLIC + '/maskable-512x512.png';

  // 1. icon.png – 1024×1024 scaled from the PWA icon (gradient bg + bookmark)
  console.log('Generating icon.png (1024x1024)...');
  const icon = await Jimp.read(pwa512);
  icon.resize(1024, 1024, Jimp.RESIZE_BICUBIC);
  await icon.writeAsync(ASSETS + '/icon.png');

  // 2. android-icon-background.png – full-bleed gradient (maskable is already full-bleed)
  console.log('Generating android-icon-background.png (512x512)...');
  const bg = await Jimp.read(maskable);
  bg.resize(512, 512, Jimp.RESIZE_BICUBIC);
  await bg.writeAsync(ASSETS + '/android-icon-background.png');

  // 3. android-icon-foreground.png – white bookmark on transparent 512×512
  console.log('Generating android-icon-foreground.png (512x512)...');
  const fg = await extractBookmarkLayer(pwa512, 512, 512, [255, 255, 255]);
  await fg.writeAsync(ASSETS + '/android-icon-foreground.png');

  // 4. android-icon-monochrome.png – black bookmark on transparent 432×432
  console.log('Generating android-icon-monochrome.png (432x432)...');
  const mono = await extractBookmarkLayer(pwa512, 432, 432, [0, 0, 0]);
  await mono.writeAsync(ASSETS + '/android-icon-monochrome.png');

  console.log('Done! All icons written to assets/images/');
}

main().catch(e => { console.error(e); process.exit(1); });
