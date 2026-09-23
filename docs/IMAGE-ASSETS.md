# Image assets

All photographs are generated editorial illustrations, not photographs of actual Omnyvox customers or employees. Generated with the built-in image-generation tool and converted to WebP at 1440px maximum width, quality 82. Each photograph has one visible marketing placement. Article previews are text-led; covers appear only on their respective article pages. The brand logo remains consistent across pages.

| Asset in `public/`              | Placement                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| `marketing-founders.webp`       | Homepage business story                                     |
| `marketing-contact.webp`        | Contact page                                                |
| `marketing-homepage-guide.webp` | Homepage-planning article                                   |
| `marketing-store-guide.webp`    | First-order preparation article                             |
| `marketing-insights-guide.webp` | Publishing-routine article                                  |
| `favicon.webp`                  | Transparent browser icon derived from supplied Omnyvox logo |

## Final prompts for new photographs

**Contact:** Editorial photograph for the contact page of Omnyvox, a Nigerian business website platform. A Black Nigerian woman business support specialist in her early thirties sitting in a tasteful bright modern office, listening with a discreet headset and looking warmly toward an open laptop, side three-quarter composition, light cream walls, a single deep purple accent object, natural daylight, premium authentic photography, no logos, no readable text. Landscape 3:2. A new distinct photograph, no people or framing reused from previous images.

**Homepage guide:** Premium editorial photograph illustrating a guide to planning a business homepage. Overhead still life of a neat workspace: blank unbranded laptop viewed at an angle, physical cream paper wireframes with simple abstract rectangles only, pencil, small deep-purple colour swatch, a ceramic coffee cup, textured light oak desktop. No people, no readable words, no logos. Warm daylight, sophisticated uncluttered composition, landscape 3:2.

**Store guide:** Premium authentic editorial photograph illustrating preparation of an independent online store for first orders. Black Nigerian male small business owner carefully packing a folded terracotta linen garment into an unbranded kraft shipping box at a workshop counter; tidy shelves of parcels softly out of focus, warm window light, calm confident mood. No laptop, no headset, no logos or readable text. Landscape 3:2, distinct scene and subject.

**Insights guide:** Premium editorial still-life photograph illustrating a thoughtful publishing routine. Close side angle on an open cream notebook with blank pages and a fountain pen on a rich dark green desk, a small stack of books with unmarked spines, an elegant desk lamp and leafy plant softly blurred in background. No laptop, no people, no coffee cup, no readable text or logos. Beautiful soft morning side lighting and natural paper textures. Landscape 3:2.

**Favicon edit:** Edit target: the attached Omnyvox icon. Preserve this exact speech-bubble ring shape, its lower-left triangular tail, and the three descending dots on its upper right. Remove all white background including the white inside the ring, producing a genuinely transparent alpha background. Use clean bold primary purple #540CDA with the lowest dot vivid green. Browser favicon variant: center symbol occupying 90 percent of square, crisp flat contours, a very thin pale lavender outline around purple shapes so visible on both dark and light browser tabs. No text, no shadows, no tile or rounded-square backdrop. Transparent output.

The retained founders image was generated earlier for this implementation: two Nigerian entrepreneurs collaborating at a sunlit studio desk, with a laptop, notebooks, product packaging, a plant and a subtle purple accent. It is used only in the homepage story section.

## Licensed stock photographs

Hospitality, property and beauty starter photographs are licensed stock images from Unsplash, used under the [Unsplash License](https://unsplash.com/license) (free commercial use, attribution not required but recorded). Credits, source pages and file sizes are in `docs/licensed-photos.json`. They were chosen to avoid identifiable people, logos and readable text, because stock sites do not supply model or property releases for customers' public websites. They were cropped to 3:2 and saved as WebP at 1440px (hero/about) and 640px (`-small`) widths. `scripts/prepare-brand-assets.mjs` does not regenerate these files.
