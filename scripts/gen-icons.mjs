// Generates PWA + Apple icons from scripts/icon-source.svg into public/.
// Usage: node scripts/gen-icons.mjs
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, 'icon-source.svg')
const outDir = path.join(__dirname, '..', 'public')
const svg = fs.readFileSync(src)

const targets = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512 }, // full-bleed gradient = safe as maskable
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
]

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(path.join(outDir, t.name))
  console.log('✓', t.name)
}
console.log('Done.')
