#!/usr/bin/env node
/**
 * Generates the local SVG cover art used by the seeded catalog.
 *
 * Run with `node scripts/generate-covers.mjs`. Every product gets a 600x800
 * cover and a 1200x600 banner; the product flagged as having a missing image
 * intentionally gets no cover file so the UI fallback can be exercised.
 *
 * The art is deterministic: the same catalog always produces the same files.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  categories,
  MISSING_IMAGE_PRODUCT_SLUG,
} from '../prisma/product-catalog.mjs';

const outputDir = fileURLToPath(
  new URL('../public/images/products/', import.meta.url),
);

const INK = '#F4F2EC';
const MUTED = '#B8B4CC';
const BRAND_ACCENT = '#5FE0A4';

const editionMeta = {
  digital: {
    label: 'Digital Edition',
    badge: 'DIGITAL',
    delivery: 'INSTANT DELIVERY',
  },
  physical: {
    label: 'Physical Edition',
    badge: 'PHYSICAL',
    delivery: 'BOXED COPY',
  },
};

const palettes = {
  'action-adventure': { hue: 18, accentHue: 42 },
  rpg: { hue: 266, accentHue: 316 },
  shooters: { hue: 202, accentHue: 150 },
  'indie-strategy': { hue: 168, accentHue: 48 },
};

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360;
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (section < 1) [red, green, blue] = [chroma, x, 0];
  else if (section < 2) [red, green, blue] = [x, chroma, 0];
  else if (section < 3) [red, green, blue] = [0, chroma, x];
  else if (section < 4) [red, green, blue] = [0, x, chroma];
  else if (section < 5) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  const offset = l - chroma / 2;
  const channel = (value) =>
    Math.round(Math.min(1, Math.max(0, value + offset)) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${channel(red)}${channel(green)}${channel(blue)}`.toUpperCase();
}

function escapeXml(value) {
  return String(value).replace(
    /[<>&'"]/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character],
  );
}

function buildPalette(categorySlug, editionSuffix, random) {
  const base = palettes[categorySlug] ?? { hue: 220, accentHue: 160 };
  const hueShift = Math.round(random() * 10) - 5;
  const physical = editionSuffix === 'physical';
  const hue = base.hue + hueShift;

  return {
    deep: hslToHex(hue, 48, 8),
    dark: hslToHex(hue + (physical ? 12 : 0), 52, 14),
    mid: hslToHex(hue + (physical ? 24 : 8), 58, physical ? 27 : 22),
    glow: hslToHex(base.accentHue + hueShift, 70, physical ? 62 : 56),
    accent: physical ? hslToHex(base.accentHue + hueShift, 70, 62) : BRAND_ACCENT,
  };
}

function hexagonPoints(centerX, centerY, radius, rotation = -Math.PI / 2) {
  const points = [];

  for (let corner = 0; corner < 6; corner += 1) {
    const angle = rotation + (Math.PI / 3) * corner;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return points.join(' ');
}

function wrapTitle(title, maxWidth, fontSize) {
  const approximateCharacterWidth = fontSize * 0.58;
  const words = title.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (
      currentLine &&
      candidate.length * approximateCharacterWidth > maxWidth
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function titleSvg({
  id,
  title,
  centerX,
  centerY,
  maxWidth,
  fontSize,
  fill,
}) {
  const lines = wrapTitle(title, maxWidth, fontSize);
  const lineHeight = fontSize * 1.06;
  const firstBaseline = centerY - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${centerX}" y="${(firstBaseline + index * lineHeight).toFixed(1)}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<text filter="url(#${id}-shadow)" font-size="${fontSize}" font-weight="900" text-anchor="middle" letter-spacing="-1" fill="${fill}">${tspans}</text>`;
}

function platformBadge(x, y, platform) {
  const width = Math.max(120, Math.round(platform.length * 8.6 + 44));

  return [
    `<rect x="${x}" y="${y}" width="${width}" height="38" rx="19" fill="#FFFFFF" fill-opacity="0.07" stroke="${INK}" stroke-opacity="0.22"/>`,
    `<text x="${x + 22}" y="${y + 25}" font-size="14" font-weight="700" letter-spacing="0.6" fill="${INK}">${escapeXml(platform)}</text>`,
  ].join('\n    ');
}

function editionPill(x, y, badge, accent) {
  return [
    `<rect x="${x}" y="${y}" width="128" height="34" rx="17" fill="#14121F" fill-opacity="0.55" stroke="${accent}" stroke-opacity="0.65"/>`,
    `<text x="${x + 64}" y="${y + 22}" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="2.4" fill="${accent}">${badge}</text>`,
  ].join('\n    ');
}

function satelliteHexes(centerX, centerY, radius, random, palette) {
  const hexes = [];

  for (let index = 0; index < 5; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = radius * (1.28 + random() * 0.55);
    const size = radius * (0.1 + random() * 0.11);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const rotation = -Math.PI / 2 + random() * 0.8;
    const opacity = (0.22 + random() * 0.3).toFixed(2);

    hexes.push(
      `<polygon points="${hexagonPoints(x, y, size, rotation)}" fill="none" stroke="${palette.glow}" stroke-opacity="${opacity}" stroke-width="1.5"/>`,
    );
  }

  return hexes.join('\n    ');
}

function hexCluster(centerX, centerY, radius, random, palette) {
  const rings = [
    {
      radius,
      fill: palette.mid,
      fillOpacity: 0.24,
      stroke: palette.glow,
      strokeOpacity: 0.55,
      strokeWidth: 2,
    },
    {
      radius: radius * 0.68,
      fill: palette.deep,
      fillOpacity: 0.62,
      stroke: INK,
      strokeOpacity: 0.14,
      strokeWidth: 1.5,
    },
    {
      radius: radius * 0.36,
      fill: palette.glow,
      fillOpacity: 0.16,
      stroke: palette.glow,
      strokeOpacity: 0.7,
      strokeWidth: 2,
    },
  ];

  return rings
    .map((ring) => {
      const rotation = -Math.PI / 2 + random() * 0.5;
      return `<polygon points="${hexagonPoints(centerX, centerY, ring.radius, rotation)}" fill="${ring.fill}" fill-opacity="${ring.fillOpacity}" stroke="${ring.stroke}" stroke-opacity="${ring.strokeOpacity}" stroke-width="${ring.strokeWidth}"/>`;
    })
    .join('\n    ');
}

function defs(id, palette) {
  return `<defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.deep}"/>
      <stop offset="52%" stop-color="${palette.dark}"/>
      <stop offset="100%" stop-color="${palette.mid}"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx="0.78" cy="0.2" r="0.72">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="${id}-mesh" width="56" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
      <path d="M28 1 L54 15 L54 33 L28 47 L2 33 L2 15 Z" fill="none" stroke="${INK}" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
    <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>`;
}

function renderCover({ game, category, edition }) {
  const productSlug = `${game.slug}-${edition.suffix}`;
  const id = `${productSlug}-cover`;
  const palette = buildPalette(
    category.slug,
    edition.suffix,
    mulberry32(hashString(`${category.slug}:${productSlug}`)),
  );
  const random = mulberry32(
    hashString(`${category.slug}:${productSlug}:cover`),
  );
  const fontSize = game.title.length > 14 ? 62 : 72;
  const clusterX = 472 + Math.round((random() - 0.5) * 36);
  const clusterY = 612 + Math.round((random() - 0.5) * 28);
  const clusterRadius = 126 + Math.round(random() * 14);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" role="img" aria-labelledby="${id}-title ${id}-desc" shape-rendering="geometricPrecision" font-family="Arial, Helvetica, sans-serif">
  <title id="${id}-title">${escapeXml(`${game.title} — ${edition.label}`)}</title>
  <desc id="${id}-desc">${escapeXml(`Cover art for ${game.title}, ${edition.label}, on ${game.platform}.`)}</desc>
  ${defs(id, palette)}
  <rect width="600" height="800" fill="url(#${id}-bg)"/>
  <rect width="600" height="800" fill="url(#${id}-glow)"/>
  <rect width="600" height="800" fill="url(#${id}-mesh)"/>
  <rect width="8" height="800" fill="${palette.accent}"/>
  ${hexCluster(clusterX, clusterY, clusterRadius, random, palette)}
  ${satelliteHexes(clusterX, clusterY, clusterRadius, random, palette)}
  <text x="56" y="64" font-size="18" font-weight="900" letter-spacing="6" fill="${INK}">HEXORA</text>
  <text x="56" y="100" font-size="13" font-weight="700" letter-spacing="3" fill="${MUTED}">${escapeXml(category.name.toUpperCase())}</text>
  <rect x="56" y="122" width="62" height="3" rx="1.5" fill="${palette.accent}"/>
  ${editionPill(416, 38, edition.badge, palette.accent)}
  ${titleSvg({ id, title: game.title, centerX: 300, centerY: 382, maxWidth: 472, fontSize, fill: INK })}
  <rect x="56" y="662" width="488" height="1" fill="${INK}" fill-opacity="0.14"/>
  ${platformBadge(56, 690, game.platform)}
  <text x="56" y="768" font-size="16" font-weight="800" letter-spacing="3.6" fill="${palette.accent}">${edition.label.toUpperCase()}</text>
  <text x="544" y="768" text-anchor="end" font-size="11" font-weight="700" letter-spacing="2.4" fill="${MUTED}">${edition.delivery}</text>
</svg>`;
}

function renderBanner({ game, category, edition }) {
  const productSlug = `${game.slug}-${edition.suffix}`;
  const id = `${productSlug}-banner`;
  const palette = buildPalette(
    category.slug,
    edition.suffix,
    mulberry32(hashString(`${category.slug}:${productSlug}`)),
  );
  const random = mulberry32(
    hashString(`${category.slug}:${productSlug}:banner`),
  );
  const fontSize = game.title.length > 14 ? 74 : 88;
  const clusterX = 946 + Math.round((random() - 0.5) * 44);
  const clusterY = 302 + Math.round((random() - 0.5) * 36);
  const clusterRadius = 172 + Math.round(random() * 18);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" role="img" aria-labelledby="${id}-title ${id}-desc" shape-rendering="geometricPrecision" font-family="Arial, Helvetica, sans-serif">
  <title id="${id}-title">${escapeXml(`${game.title} — ${edition.label}`)}</title>
  <desc id="${id}-desc">${escapeXml(`Banner art for ${game.title}, ${edition.label}, on ${game.platform}.`)}</desc>
  ${defs(id, palette)}
  <rect width="1200" height="600" fill="url(#${id}-bg)"/>
  <rect width="1200" height="600" fill="url(#${id}-glow)"/>
  <rect width="1200" height="600" fill="url(#${id}-mesh)"/>
  <rect width="8" height="600" fill="${palette.accent}"/>
  <line x1="770" y1="0" x2="650" y2="600" stroke="${INK}" stroke-opacity="0.07" stroke-width="1"/>
  ${hexCluster(clusterX, clusterY, clusterRadius, random, palette)}
  ${satelliteHexes(clusterX, clusterY, clusterRadius, random, palette)}
  <text x="72" y="62" font-size="18" font-weight="900" letter-spacing="6" fill="${INK}">HEXORA</text>
  <text x="72" y="100" font-size="13" font-weight="700" letter-spacing="3" fill="${MUTED}">${escapeXml(category.name.toUpperCase())}</text>
  <rect x="72" y="124" width="62" height="3" rx="1.5" fill="${palette.accent}"/>
  ${editionPill(1000, 38, edition.badge, palette.accent)}
  ${titleSvg({ id, title: game.title, centerX: 386, centerY: 286, maxWidth: 610, fontSize, fill: INK })}
  <rect x="72" y="436" width="628" height="1" fill="${INK}" fill-opacity="0.14"/>
  ${platformBadge(72, 466, game.platform)}
  <text x="72" y="554" font-size="16" font-weight="800" letter-spacing="3.6" fill="${palette.accent}">${edition.label.toUpperCase()}</text>
  <text x="700" y="554" text-anchor="end" font-size="11" font-weight="700" letter-spacing="2.4" fill="${MUTED}">${edition.delivery}</text>
</svg>`;
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

let generated = 0;
let missingCoverMatched = false;

for (const category of categories) {
  for (const game of category.games) {
    for (const suffix of ['digital', 'physical']) {
      const edition = { suffix, ...editionMeta[suffix] };
      const slug = `${game.slug}-${suffix}`;

      if (slug !== MISSING_IMAGE_PRODUCT_SLUG) {
        writeFileSync(
          path.join(outputDir, `${slug}-cover.svg`),
          renderCover({ game, category, edition }),
          'utf8',
        );
        generated += 1;
      } else {
        missingCoverMatched = true;
      }

      writeFileSync(
        path.join(outputDir, `${slug}-banner.svg`),
        renderBanner({ game, category, edition }),
        'utf8',
      );
      generated += 1;
    }
  }
}

if (!missingCoverMatched) {
  throw new Error(
    `MISSING_IMAGE_PRODUCT_SLUG "${MISSING_IMAGE_PRODUCT_SLUG}" does not match a seeded product.`,
  );
}

const productCount = categories.reduce(
  (total, category) => total + category.games.length * 2,
  0,
);

console.log(
  `Generated ${generated} SVG files for ${productCount} products in ` +
    `${path.relative(process.cwd(), outputDir)} ` +
    `(1 intentionally missing cover: ${MISSING_IMAGE_PRODUCT_SLUG}).`,
);
