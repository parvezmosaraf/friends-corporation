import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const svgPath = join(publicDir, 'icon.svg');

const svg = readFileSync(svgPath);

await sharp(Buffer.from(svg))
  .resize(192, 192)
  .png()
  .toFile(join(publicDir, 'icon-192.png'));

await sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(join(publicDir, 'icon-512.png'));

console.log('Generated icon-192.png and icon-512.png');
