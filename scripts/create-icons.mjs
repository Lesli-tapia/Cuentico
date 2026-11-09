import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
await mkdir('public/icons', { recursive: true });
const logo = await readFile('public/assets/logo.svg');
for (const size of [192, 512]) {
  const width = Math.round(size * .8);
  const mark = await sharp(logo).resize({ width }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#FBEFE3' } }).composite([{ input: mark, gravity: 'center' }]).png().toFile(`public/icons/icon-${size}.png`);
}
