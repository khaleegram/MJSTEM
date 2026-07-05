/**
 * One-off script: crop MJSTEM logo whitespace and generate favicon assets.
 * Usage: node scripts/generate-favicons.mjs [sourceImagePath]
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const defaultSource =
  'C:/Users/User/.cursor/projects/c-Users-User-Desktop-Projects-MJSTEM/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_e7d5c6b8e52906ef4ad29cc63e0a43de_images_WhatsApp_Image_2026-07-03_at_9.49.00_PM-4d5822e6-dbc5-44f2-93e5-4c484782943f.png';

const sourcePath = process.argv[2] ? resolve(process.argv[2]) : defaultSource;
const publicDir = resolve(projectRoot, 'public');
const appDir = resolve(projectRoot, 'src/app');

if (!existsSync(sourcePath)) {
  console.error(`Source image not found: ${sourcePath}`);
  process.exit(1);
}

async function main() {
  const image = sharp(sourcePath);
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (!width || !height) {
    throw new Error('Could not read source image dimensions.');
  }

  // Crop to the icon portion above the "MJSTEM" wordmark, then trim whitespace.
  const iconHeight = Math.max(1, Math.round(height * 0.62));
  const safeHeight = Math.min(iconHeight, height);

  const iconBuffer = await sharp(sourcePath)
    .extract({ left: 0, top: 0, width, height: safeHeight })
    .png()
    .toBuffer();

  const outputs = [
    { path: resolve(publicDir, 'favicon-32x32.png'), size: 32 },
    { path: resolve(publicDir, 'favicon-192x192.png'), size: 192 },
    { path: resolve(publicDir, 'apple-touch-icon.png'), size: 180 },
    { path: resolve(appDir, 'icon.png'), size: 512 },
  ];

  for (const output of outputs) {
    await sharp(iconBuffer)
      .resize(output.size, output.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(output.path);
    console.log(`Wrote ${output.path}`);
  }

  await sharp(iconBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(resolve(publicDir, 'favicon.png'));

  console.log('Favicon assets generated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
