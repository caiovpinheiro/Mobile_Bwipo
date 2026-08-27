/**
 * Gera PNGs de launcher a partir de branding/bwipo-mark.png.
 * Uso: npm run icons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markPath = path.join(root, "branding", "bwipo-mark.png");
const resDir = path.join(root, "android", "app", "src", "main", "res");

const BLACK = { r: 0, g: 0, b: 0, alpha: 255 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const launcher = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const foreground = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

if (!fs.existsSync(markPath)) {
  throw new Error(`Marca não encontrada: ${markPath}`);
}

async function squircleMask(size) {
  const r = Math.round(size * 0.225);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="white"/>
    </svg>`,
  );
}

async function circleMask(size) {
  const c = size / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <circle cx="${c}" cy="${c}" r="${c}" fill="white"/>
    </svg>`,
  );
}

/** Fração do canvas ocupada pelo “b”.
 *  Launchers tipo MIUI/POCO ainda encolhem o ícone num círculo branco;
 *  66% (área segura oficial) ainda recorta o glifo neste mark vertical. */
const LAUNCHER_GLYPH = 0.68;
const ADAPTIVE_GLYPH = 0.48;

async function paddedMark(size, ratio) {
  const inner = Math.round(size * ratio);
  const pad = Math.max(0, Math.round((size - inner) / 2));
  const glyph = await sharp(markPath)
    .resize(inner, inner, { fit: "contain", background: BLACK })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BLACK },
  })
    .composite([{ input: glyph, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function fullIcon(size) {
  return paddedMark(size, LAUNCHER_GLYPH);
}

/** Foreground adaptativo: “b” bem dentro da área segura (72/108). */
async function adaptiveForeground(size) {
  return paddedMark(size, ADAPTIVE_GLYPH);
}

async function notifyIcon(size) {
  const { data, info } = await sharp(markPath)
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (a > 20 && lum > 18) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 255;
    } else {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 0;
    }
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

for (const [folder, size] of Object.entries(launcher)) {
  const dir = path.join(resDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  const base = await fullIcon(size);
  await sharp(base)
    .composite([{ input: await squircleMask(size), blend: "dest-in" }])
    .png()
    .toFile(path.join(dir, "ic_launcher.png"));
  await sharp(base)
    .composite([{ input: await circleMask(size), blend: "dest-in" }])
    .png()
    .toFile(path.join(dir, "ic_launcher_round.png"));
}

for (const [folder, size] of Object.entries(foreground)) {
  const dir = path.join(resDir, folder);
  fs.mkdirSync(dir, { recursive: true });
  const fg = await adaptiveForeground(size);
  await sharp(fg).png().toFile(path.join(dir, "ic_launcher_foreground.png"));
}

const drawable = path.join(resDir, "drawable");
fs.mkdirSync(drawable, { recursive: true });
await sharp(await notifyIcon(96))
  .png()
  .toFile(path.join(drawable, "ic_stat_notify.png"));

console.log("ícones de launcher gerados a partir de branding/bwipo-mark.png");
