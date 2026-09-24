// Builds transparent logo variants from the white-background masters in
// brand/ (kept outside public/): a light-background set and a
// dark-background set with white "omny" and lifted purples for contrast.
import sharp from "sharp";
import { copyFile, mkdir, access } from "node:fs/promises";

await mkdir("brand", { recursive: true });
for (const name of ["wordmark", "brand-icon"]) {
  const master = `brand/${name}-master.webp`;
  try {
    await access(master);
  } catch {
    await copyFile(`public/${name}.webp`, master);
  }
}

/** Removes the white background, keeping anti-aliased edges. */
async function unmatte(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const a = Math.max(255 - r, 255 - g, 255 - b) / 255;
    if (a < 0.02) {
      data[i + 3] = 0;
      continue;
    }
    data[i] = Math.round(255 - (255 - r) / a);
    data[i + 1] = Math.round(255 - (255 - g) / a);
    data[i + 2] = Math.round(255 - (255 - b) / a);
    data[i + 3] = Math.round(a * 255);
  }
  return { data, info };
}
/** Recolours for dark backgrounds: neutrals become white, purples lighten. */
function forDark({ data, info }) {
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    if (!out[i + 3]) continue;
    const [r, g, b] = [out[i], out[i + 1], out[i + 2]];
    const max = Math.max(r, g, b);
    if (max < 120) {
      // Navy "omny" lettering → white.
      out[i] = out[i + 1] = out[i + 2] = 255;
    } else if (b > g && r > g) {
      // Brand purple (#540cda) → lifted purple (#a98bff) for 4.5:1 on #171329.
      out[i] = 169;
      out[i + 1] = 139;
      out[i + 2] = 255;
    }
  }
  return { data: out, info };
}
const save = ({ data, info }, file) =>
  sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ lossless: true })
    .toFile(file);

for (const name of ["wordmark", "brand-icon"]) {
  const clean = await unmatte(`brand/${name}-master.webp`);
  await save(clean, `public/${name}.webp`);
  await save(forDark(await unmatte(`brand/${name}-master.webp`)), `public/${name}-on-dark.webp`);
}
console.log("Logo variants written: wordmark(.webp|-on-dark.webp), brand-icon(.webp|-on-dark.webp)");
