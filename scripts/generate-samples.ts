/**
 * Generates the replaceable starter artwork referenced by lib/industry-kits.ts
 * into public/samples. Run with: npx tsx scripts/generate-samples.ts
 */
import { mkdir, writeFile, readdir, rm } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lucide from "lucide-react";
import { industryKits } from "../lib/industry-kits";

const OUT = "public/samples";
const pascal = (s: string) =>
  s
    .split("-")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return (
    "#" +
    x
      .map((v, i) => Math.round(v + (y[i] - v) * t))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}
function icon(name: string, color: string, size: number) {
  const Icon = (lucide as unknown as Record<string, lucide.LucideIcon>)[
    pascal(name)
  ];
  if (!Icon) throw Error(`Unknown icon ${name}`);
  return renderToStaticMarkup(
    createElement(Icon, { size, color, strokeWidth: 1.4 }),
  ).replace(/ class="[^"]*"/, "");
}

function artwork(
  w: number,
  h: number,
  iconName: string,
  palette: { primary: string; secondary: string; background: string },
  seed: number,
) {
  const light = mix(palette.primary, "#ffffff", 0.84);
  const mid = mix(palette.primary, "#ffffff", 0.62);
  const deep = mix(palette.secondary, palette.primary, 0.35);
  const s = Math.min(w, h);
  const r1 = s * (0.42 + (seed % 3) * 0.05);
  const r2 = s * (0.28 + (seed % 2) * 0.06);
  const glyph = Math.round(s * 0.2);
  const tile = Math.round(s * 0.36);
  const cx = w / 2,
    cy = h / 2;
  const svgIcon = icon(iconName, deep, glyph)
    .replace("<svg", `<svg x="${cx - glyph / 2}" y="${cy - glyph / 2}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Sample image">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
<pattern id="d" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="${deep}" fill-opacity=".09"/></pattern>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect width="${w}" height="${h}" fill="url(#d)"/>
<circle cx="${w * (seed % 2 ? 0.86 : 0.14)}" cy="${h * 0.16}" r="${r1}" fill="${palette.primary}" fill-opacity=".12"/>
<circle cx="${w * (seed % 2 ? 0.1 : 0.9)}" cy="${h * 0.92}" r="${r2}" fill="${palette.secondary}" fill-opacity=".1"/>
<rect x="${cx - tile / 2}" y="${cy - tile / 2}" width="${tile}" height="${tile}" rx="${tile * 0.24}" fill="#ffffff" fill-opacity=".72" stroke="#ffffff" stroke-opacity=".9"/>
${svgIcon}
<rect x="18" y="${h - 44}" width="118" height="26" rx="13" fill="#ffffff" fill-opacity=".82"/>
<text x="77" y="${h - 26.5}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="${deep}">Sample image</text>
</svg>
`;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
let count = 0;
for (const [industry, kit] of Object.entries(industryKits)) {
  let seed = industry.length;
  for (const [key, iconName] of Object.entries(kit.art)) {
    const portrait = key.startsWith("team-");
    const large = key === "hero" || key === "about";
    const [w, h] = portrait ? [600, 750] : large ? [1200, 900] : [800, 600];
    await writeFile(
      `${OUT}/${industry}-${key}.svg`,
      artwork(w, h, iconName, kit.palette, seed++),
    );
    count++;
  }
}
console.log(`Generated ${count} images in ${OUT}`, (await readdir(OUT)).length);
