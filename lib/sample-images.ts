import { industryKits } from "./industry-kits";
import { starterImage } from "./brand-assets";

const label = (key: string) =>
  key
    .replace(/-/g, " ")
    .replace(/\b(\d)\b/, "#$1")
    .replace(/^./, (c) => c.toUpperCase());

/** Every bundled starter image, grouped by industry, for the media picker. */
export const sampleImages = Object.entries(industryKits).map(
  ([industry, kit]) => ({
    industry,
    images: Object.keys(kit.art).map((key) => ({
      src: starterImage(industry, key),
      label: label(key),
    })),
  }),
);
