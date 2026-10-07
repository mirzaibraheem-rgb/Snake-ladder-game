// Generates every icon and splash image from assets/icon-background.svg + assets/icon-foreground.svg.
// Run: npm run icons
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const bg = readFileSync('assets/icon-background.svg');
const fg = readFileSync('assets/icon-foreground.svg');

async function layered(size, { round = false, radius = 0, fgScale = 1 } = {}) {
  const base = await sharp(bg, { density: 300 }).resize(size, size).png().toBuffer();
  const fgSize = Math.round(size * fgScale);
  const front = await sharp(fg, { density: 300 }).resize(fgSize, fgSize).png().toBuffer();
  let img = sharp(base).composite([{ input: front, left: Math.round((size - fgSize) / 2), top: Math.round((size - fgSize) / 2) }]);
  let buf = await img.png().toBuffer();
  if (round || radius) {
    const r = round ? size / 2 : radius;
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);
    buf = await sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  }
  return buf;
}

function out(path, buf) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
  console.log('wrote', path);
}

// Master icon (store listings)
out('assets/generated/icon-1024.png', await layered(1024));
out('assets/generated/icon-512.png', await layered(512));

// Web / PWA
out('public/icons/icon-192.png', await layered(192, { radius: 40 }));
out('public/icons/icon-512.png', await layered(512, { radius: 100 }));
out('public/icons/icon-maskable-512.png', await layered(512, { fgScale: 0.8 }));

// Windows (.ico with all common sizes) and Electron window icon
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoPngs = await Promise.all(icoSizes.map((s) => layered(s, { radius: Math.round(s * 0.18) })));
out('build/icon.ico', await pngToIco(icoPngs));
out('build/icon.png', await layered(512, { radius: 90 }));
out('electron/icon.png', await layered(256, { radius: 46 }));

// Android launcher icons (legacy + round + adaptive foreground/background)
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
if (existsSync('android/app/src/main/res')) {
  for (const [d, k] of Object.entries(densities)) {
    const dir = `android/app/src/main/res/mipmap-${d}`;
    out(`${dir}/ic_launcher.png`, await layered(Math.round(48 * k), { radius: Math.round(48 * k * 0.2) }));
    out(`${dir}/ic_launcher_round.png`, await layered(Math.round(48 * k), { round: true }));
    const fgSize = Math.round(108 * k);
    // Adaptive icons show only the middle 66%, so the foreground art is scaled into that safe zone.
    const inner = await sharp(fg, { density: 300 }).resize(Math.round(fgSize * 0.66), Math.round(fgSize * 0.66)).png().toBuffer();
    const pad = Math.round((fgSize - Math.round(fgSize * 0.66)) / 2);
    out(`${dir}/ic_launcher_foreground.png`, await sharp({ create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: inner, left: pad, top: pad }]).png().toBuffer());
    out(`${dir}/ic_launcher_background.png`, await sharp(bg, { density: 300 }).resize(fgSize, fgSize).png().toBuffer());
  }
  // Point the adaptive icon background at the image instead of a flat color.
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  out('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', Buffer.from(adaptive));
  out('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml', Buffer.from(adaptive));
  const bgXml = 'android/app/src/main/res/values/ic_launcher_background.xml';
  if (existsSync(bgXml)) rmSync(bgXml);

  // Splash screens (portrait and landscape) for every density
  const splash = async (w, h) => {
    const logo = await layered(Math.round(Math.min(w, h) * 0.38), { radius: Math.round(Math.min(w, h) * 0.07) });
    const lsize = Math.round(Math.min(w, h) * 0.38);
    return sharp({ create: { width: w, height: h, channels: 4, background: '#5B1E96' } })
      .composite([{ input: logo, left: Math.round((w - lsize) / 2), top: Math.round((h - lsize) / 2) }])
      .png()
      .toBuffer();
  };
  const res = 'android/app/src/main/res';
  for (const dir of readdirSync(res).filter((d) => d.startsWith('drawable'))) {
    const p = join(res, dir, 'splash.png');
    if (!existsSync(p)) continue;
    const meta = await sharp(p).metadata();
    out(p, await splash(meta.width, meta.height));
  }
}

// iOS app icon (single 1024 image, no transparency) and splash
if (existsSync('ios/App/App/Assets.xcassets')) {
  out('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', await sharp(await layered(1024)).flatten({ background: '#5B1E96' }).png().toBuffer());
  const sdir = 'ios/App/App/Assets.xcassets/Splash.imageset';
  if (existsSync(sdir)) {
    for (const f of readdirSync(sdir).filter((f) => f.endsWith('.png'))) {
      const meta = await sharp(join(sdir, f)).metadata();
      const size = Math.round(Math.min(meta.width, meta.height) * 0.3);
      const logo = await layered(size, { radius: Math.round(size * 0.2) });
      out(join(sdir, f), await sharp({ create: { width: meta.width, height: meta.height, channels: 4, background: '#5B1E96' } }).composite([{ input: logo, left: Math.round((meta.width - size) / 2), top: Math.round((meta.height - size) / 2) }]).png().toBuffer());
    }
  }
}
