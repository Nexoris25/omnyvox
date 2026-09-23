import sharp from "sharp";
import { readFile, readdir, writeFile, stat } from "node:fs/promises";
// Explicit local input manifest; generated originals remain outside Git.
const sources = JSON.parse(
  await readFile(process.argv[2] || ".local-db/brand-sources.json", "utf8"),
);
const inventory = [];
for (const item of sources) {
  const target = item.key.startsWith("marketing-")
    ? `public/${item.key}-v2.webp`
    : `public/samples/${item.key}-photo.webp`;
  await sharp(item.source)
    .resize({ width: 1440, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(target);
  await sharp(item.source)
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 76, effort: 5 })
    .toFile(target.replace(".webp", "-small.webp"));
  inventory.push({
    key: item.key,
    url: target.replace("public", ""),
    sourceFile: item.source.split("/").at(-1),
    provenance: "Original AI-generated illustration, 2026-09-23",
    bytes: (await stat(target)).size,
  });
}
for (const file of await readdir("public/samples")) {
  if (!file.endsWith(".svg")) continue;
  await sharp(`public/samples/${file}`)
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(`public/samples/${file.replace(".svg", ".webp")}`);
}
await writeFile(
  "docs/brand-assets.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
console.log(
  `Prepared ${inventory.length} original photographs and WebP starter artwork.`,
);
