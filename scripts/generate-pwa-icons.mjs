// Generates the PWA / home-screen icons from the PlansK12 nav logo
// (the inline PlansK12Logo mark in src/components/layout/AppShell.jsx).
//
// Run with:  npm i sharp --no-save && node scripts/generate-pwa-icons.mjs
// Outputs (committed as static assets in public/):
//   pwa-192x192.png, pwa-512x512.png (maskable), apple-touch-icon.png (180)
//
// The mark is centered on the brand's dark background (#0a0d12, matching the
// manifest theme/background color) with generous padding so the maskable icon
// stays inside the launcher safe zone (content within the center ~80%).
import sharp from 'sharp'

// The logo mark, exactly as drawn in AppShell's PlansK12Logo (viewBox 0 0 28 32),
// minus the wordmark. Note: JSX fillOpacity/strokeWidth → SVG fill-opacity/stroke-width.
const LOGO =
  '<path d="M2 2C2 0.895 2.895 0 4 0H18L26 8V30C26 31.105 25.105 32 24 32H4C2.895 32 2 31.105 2 30V2Z" fill="#4F7FFA"/>' +
  '<path d="M18 0L26 8H20C18.895 8 18 7.105 18 6V0Z" fill="#3b6de8"/>' +
  '<rect x="6" y="14" width="14" height="2" rx="1" fill="white" fill-opacity="0.8"/>' +
  '<rect x="6" y="19" width="10" height="2" rx="1" fill="white" fill-opacity="0.6"/>' +
  '<circle cx="20" cy="26" r="7" fill="#0ea5e9"/>' +
  '<path d="M16.5 26L19 28.5L23.5 23.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'

// logoScale = fraction of the icon HEIGHT the 28x32 mark occupies.
function iconSvg(size, logoScale) {
  const s = (logoScale * size) / 32
  const w = 28 * s
  const h = 32 * s
  const tx = (size - w) / 2
  const ty = (size - h) / 2
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="${size}" height="${size}" fill="#0a0d12"/>` +
    `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(4)})">${LOGO}</g>` +
    `</svg>`
  )
}

async function render(size, logoScale, outfile) {
  // Flatten onto the brand background so the output has no alpha channel
  // (apple-touch-icon in particular should be fully opaque).
  await sharp(Buffer.from(iconSvg(size, logoScale)))
    .flatten({ background: '#0a0d12' })
    .png()
    .toFile(outfile)
  console.log('wrote', outfile)
}

// Maskable → smaller mark (safe zone). apple-touch (iOS rounds it itself) → a bit larger.
await render(512, 0.52, 'public/pwa-512x512.png')
await render(192, 0.56, 'public/pwa-192x192.png')
await render(180, 0.60, 'public/apple-touch-icon.png')
