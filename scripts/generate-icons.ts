import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(process.cwd(), "public");
mkdirSync(PUBLIC_DIR, { recursive: true });

const ACCENT = "#06b6d4";
const BG_DARK = "#080b12";

function shieldSvg(size: number, withBackground = false): string {
  const bg = withBackground
    ? `<rect width="${size}" height="${size}" fill="${BG_DARK}" />`
    : "";
  const scale = size / 48;
  const offset = withBackground ? (size - 48 * scale) / 2 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <path d="M24 4L8 12v10c0 11 6.8 21.2 16 24 9.2-2.8 16-13 16-24V12L24 4z"
      fill="${ACCENT}" fill-opacity="0.15"
      stroke="${ACCENT}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" />
    <path d="M18 24l4 4 8-8"
      stroke="${ACCENT}" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
</svg>`;
}

async function generateIcons() {
  // favicon-32x32.png
  await sharp(Buffer.from(shieldSvg(32)))
    .resize(32, 32)
    .png()
    .toFile(join(PUBLIC_DIR, "favicon-32x32.png"));

  // favicon-16x16.png
  await sharp(Buffer.from(shieldSvg(16)))
    .resize(16, 16)
    .png()
    .toFile(join(PUBLIC_DIR, "favicon-16x16.png"));

  // apple-touch-icon.png (180x180 with dark background)
  const appleSize = 180;
  const shieldSize = 120;
  const appleOffset = (appleSize - shieldSize) / 2;
  const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${appleSize}" height="${appleSize}" viewBox="0 0 ${appleSize} ${appleSize}">
  <rect width="${appleSize}" height="${appleSize}" fill="${BG_DARK}" rx="20" />
  <g transform="translate(${appleOffset}, ${appleOffset}) scale(${shieldSize / 48})">
    <path d="M24 4L8 12v10c0 11 6.8 21.2 16 24 9.2-2.8 16-13 16-24V12L24 4z"
      fill="${ACCENT}" fill-opacity="0.15"
      stroke="${ACCENT}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" />
    <path d="M18 24l4 4 8-8"
      stroke="${ACCENT}" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
</svg>`;
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(join(PUBLIC_DIR, "apple-touch-icon.png"));

  // favicon.ico (32x32 PNG used as ICO — browsers accept PNG favicons)
  const icoBuffer = await sharp(Buffer.from(shieldSvg(32)))
    .resize(32, 32)
    .png()
    .toBuffer();
  writeFileSync(join(PUBLIC_DIR, "favicon.ico"), icoBuffer);

  console.log("Icons generated in public/:");
  console.log("  - favicon.ico (32x32)");
  console.log("  - favicon-16x16.png");
  console.log("  - favicon-32x32.png");
  console.log("  - apple-touch-icon.png (180x180)");
}

generateIcons().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
