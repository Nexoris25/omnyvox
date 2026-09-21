import sharp from "sharp";
const svg = Buffer.from(
  `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#540CDA"/><text x="85" y="250" font-family="Arial" font-size="94" font-weight="700" fill="white">omnyvox</text><text x="85" y="365" font-family="Arial" font-size="48" fill="white">Business websites.</text><text x="85" y="430" font-family="Arial" font-size="48" fill="white">Fully managed.</text></svg>`,
);
await sharp(svg).webp({ quality: 90 }).toFile("public/social.webp");
