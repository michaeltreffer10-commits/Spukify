// Erzeugt die App-Icons (PNG) aus dem Spukify-Geist.
// Aufruf: npm run icons
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const ghost = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1ed760"/>
      <stop offset="1" stop-color="#17b04e"/>
    </linearGradient>
  </defs>
  <g transform="translate(0 -36)">
    <path fill="url(#g)" d="M156 410 V250 A100 100 0 0 1 356 250 V410
      A33.33 33.33 0 0 1 289.33 410 A33.33 33.33 0 0 1 222.67 410 A33.33 33.33 0 0 1 156 410 Z"/>
    <ellipse cx="218" cy="262" rx="18" ry="25" fill="#121212"/>
    <ellipse cx="294" cy="262" rx="18" ry="25" fill="#121212"/>
  </g>`

const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#121212"/>${ghost}</svg>`

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#121212"/>${ghost}</svg>`

await writeFile('public/icons/favicon.svg', rounded.replace(/\n\s*/g, ' '))
const out = [
  ['public/icons/icon-192.png', 192, rounded],
  ['public/icons/icon-512.png', 512, rounded],
  ['public/icons/maskable-512.png', 512, square],
  ['public/icons/apple-touch-icon.png', 180, square],
]
for (const [file, size, svg] of out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file)
}
console.log('Icons erzeugt.')
