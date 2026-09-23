/** One original photograph per image-led section. Keep fictional samples identifiable. */
export const photoIndustries = [
  "creative",
  "legal",
  "healthcare",
  "construction",
  "fashion",
  "electronics",
  "food",
  "hospitality",
  "property",
  "beauty",
] as const;
export const templateIndustry: Record<string, string> = {
  studio: "creative",
  trust: "legal",
  care: "healthcare",
  build: "construction",
  haven: "hospitality",
  horizon: "general",
  atelier: "fashion",
  glow: "beauty",
  catalogue: "electronics",
  essentials: "food",
};
export function starterImage(industry: string, key: string) {
  return `/samples/${industry}-${key}${(photoIndustries as readonly string[]).includes(industry) && ["hero", "about"].includes(key) ? "-photo" : ""}.webp`;
}
export function webpSource(src: string) {
  if (/^\/samples\/[a-z0-9-]+\.svg$/.test(src)) {
    const stem = src.slice(9, -4);
    const industry = photoIndustries.find(
      (i) => stem === `${i}-hero` || stem === `${i}-about`,
    );
    return industry
      ? starterImage(industry, stem.slice(industry.length + 1))
      : src.replace(/\.svg$/, ".webp");
  }
  return src;
}
export function photoSourceSet(src: string) {
  const source = webpSource(src);
  return /(?:-photo|-v2)\.webp$/.test(source)
    ? `${source.replace(".webp", "-small.webp")} 640w, ${source} 1440w`
    : undefined;
}
export const photoAlt: Record<string, string> = {
  "creative-hero":
    "Designers arranging a chair and ceramics in a sunlit creative studio — illustrative sample",
  "creative-about":
    "Designer sketching packaging beside colour swatches — illustrative sample",
  "legal-hero":
    "Legal advisor and client discussing documents — illustrative sample",
  "legal-about":
    "Walnut meeting room in an advisory practice — illustrative sample",
  "healthcare-hero":
    "Clinician listening to a patient in a bright consultation room — illustrative sample",
  "healthcare-about":
    "Welcoming clinic reception with warm wood finishes — illustrative sample",
  "construction-hero":
    "Contemporary office building with tropical planting — illustrative sample",
  "construction-about":
    "Architects reviewing a scale model — illustrative sample",
  "fashion-hero":
    "Terracotta linen outfit in a sunlit boutique courtyard — illustrative sample",
  "fashion-about": "Artisan stitching a linen garment — illustrative sample",
  "electronics-hero":
    "Headphones, speaker and laptop on blue display plinths — illustrative sample",
  "electronics-about":
    "Shop assistant preparing a tablet at a service counter — illustrative sample",
  "food-hero":
    "Fresh vegetables and plantains in woven baskets — illustrative sample",
  "food-about":
    "Grocer packing fresh produce into a paper bag — illustrative sample",
  // Licensed stock photographs (Unsplash License); credits in docs/licensed-photos.json.
  "hospitality-hero":
    "Resort pool lined with palm trees beside white guest buildings — sample image",
  "hospitality-about":
    "Bright restaurant dining room with wooden tables and pendant lights — sample image",
  "property-hero":
    "Modern two-storey home lit warmly at dusk — sample image",
  "property-about":
    "Furnished living room with a grey sofa, armchair and plants — sample image",
  "beauty-hero":
    "Drops of facial oil and cream beside green leaves on a blush background — sample image",
  "beauty-about":
    "Spoonful of natural butter beside a fresh coconut and palm leaves — sample image",
};
