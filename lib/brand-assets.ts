/** One original photograph per image-led section. Keep fictional samples identifiable. */
export const photoIndustries = [
  "general",
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
  "consulting",
  "solar",
  "logistics",
  "education",
  "community",
  "books",
  "furniture",
  "retail",
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
  // Licensed stock photographs (Unsplash License); credits in docs/licensed-photos.json.
  "consulting-hero": "Desk with a laptop, notebook, phone calculator and printed financial charts — sample image",
  "consulting-about": "Bright open-plan office with desks, chairs and plants — sample image",
  "solar-hero": "Aerial view of rows of solar panels — sample image",
  "solar-about": "Engineer in a hard hat and safety vest inspecting a solar farm — sample image",
  "logistics-hero": "Two white delivery trucks on a highway — sample image",
  "logistics-about": "Warehouse aisle with tall shelves of boxed stock — sample image",
  "education-hero": "Bright classroom with rows of wooden desks and a chalkboard — sample image",
  "education-about": "Quiet library with bookshelves, study tables and large windows — sample image",
  "community-hero": "Many hands joined together in the middle of a group — sample image",
  "community-about": "Vegetables growing in raised bamboo planters in a community garden — sample image",
  "books-hero": "Bookshop shelves packed with books — sample image",
  "books-about": "A row of books standing on a table — sample image",
  "furniture-hero": "Light living room with sofas, a wooden coffee table and a large window — sample image",
  "furniture-about": "Furniture maker marking a wooden board with a pencil — sample image",
  "retail-hero": "Shop shelves displaying ceramic vases and bowls — sample image",
  "retail-about": "Shopper holding colourful paper shopping bags — sample image",
  "general-hero":
    "Colleagues discussing a business brief around a meeting table — sample photograph",
  "general-about":
    "A team reviewing their work together in a bright meeting room — sample photograph",
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
  "property-hero": "Modern two-storey home lit warmly at dusk — sample image",
  "property-about":
    "Furnished living room with a grey sofa, armchair and plants — sample image",
  "beauty-hero":
    "Drops of facial oil and cream beside green leaves on a blush background — sample image",
  "beauty-about":
    "Spoonful of natural butter beside a fresh coconut and palm leaves — sample image",
};
