// Erzeugt die App-Icons (PNG) aus dem Spukify-Geist.
// Aufruf: npm run icons
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const ghost = `
  <defs>
    <linearGradient id="g" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="0.55" stop-color="#f472b6"/>
      <stop offset="1" stop-color="#fbbf24"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.55" r="0.5">
      <stop offset="0" stop-color="#ec4899" stop-opacity="0.45"/>
      <stop offset="0.6" stop-color="#7c3aed" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="256" cy="270" r="250" fill="url(#glow)"/>
  <g transform="translate(0 -36)">
    <path fill="url(#g)" d="M156 410 V250 A100 100 0 0 1 356 250 V410
      A33.33 33.33 0 0 1 289.33 410 A33.33 33.33 0 0 1 222.67 410 A33.33 33.33 0 0 1 156 410 Z"/>
    <ellipse cx="218" cy="262" rx="18" ry="25" fill="#0b0b12"/>
    <ellipse cx="294" cy="262" rx="18" ry="25" fill="#0b0b12"/>
  </g>`

const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b0b12"/>${ghost}</svg>`

const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0b0b12"/>${ghost}</svg>`

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
