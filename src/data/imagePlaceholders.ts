// Registry of all article image placeholders. Status moves
// pending -> generated (asset exists) -> swapped (referenced via `image:` in
// the markdown directive). Keep in sync with :::image-placeholder blocks
// inserted in src/data/blogArticles.ts.
//
// Note: [STYLE ANCHOR] is intentionally left as literal text. Jay swaps it in
// with the master style anchor when generating each image.

export type PlaceholderStatus = 'pending' | 'generated' | 'swapped';

export interface ImagePlaceholderEntry {
  slug: string;
  articleSlug: string;
  type: 'photo' | 'infographic' | 'diagram' | 'screenshot';
  aspect: '16:9' | '4:5' | '9:16' | '1:1' | 'letter-portrait';
  description: string;
  prompt: string;
  image: string | null;
  status: PlaceholderStatus;
}

export const imagePlaceholders: ImagePlaceholderEntry[] = [
  {
    slug: 'repower-cost-stack-by-hp-class',
    articleSlug: 'mercury-repower-cost-ontario-2026-cad',
    type: 'infographic',
    aspect: '16:9',
    description:
      "Stacked bar chart showing what's included in each HP class repower cost: motor, rigging, prop, controls, install labour",
    prompt:
      'Photorealistic editorial infographic. Stacked horizontal bar chart showing Mercury repower cost breakdown across 5 HP tiers: 40-60 HP, 75-115 HP, 150 HP, 200-300 HP. Each bar segmented into Motor / Rigging / Prop / Controls / Install Labour with distinct muted colors. Y-axis labels HP class, X-axis CAD before HST. Clean white background, Mercury black accent text, gold for "Install Labour" segment. No people, no logos overlaid. 1600x900. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'repower-process-timeline',
    articleSlug: 'what-happens-during-mercury-repower',
    type: 'infographic',
    aspect: '16:9',
    description:
      'Horizontal timeline showing 10 steps of the Mercury repower process at HBW',
    prompt:
      'Photorealistic editorial infographic. Horizontal timeline with 10 numbered steps for Mercury repower process: 1. Hull walk-around, 2. Quote, 3. Booking, 4. Drop-off, 5. Old motor removal, 6. Inspection, 7. Install, 8. Sea-trial, 9. Final adjustments, 10. Pickup. Each step a clean card with number badge in Mercury red, title, and 1-line description. Horizontal flow with subtle arrow connectors. Light cream background, Mercury black text. No people. 1600x900. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'spring-no-start-flowchart',
    articleSlug: 'mercury-outboard-wont-start-troubleshooting',
    type: 'diagram',
    aspect: '4:5',
    description:
      'Decision tree flowchart for diagnosing spring no-start, in order: Battery, Fuel, Ignition, Compression, Call HBW',
    prompt:
      'Photorealistic editorial flowchart diagram. Decision tree for "Mercury won\'t start in spring" diagnostics. 5 sequential decision diamonds: Battery? > Fuel? > Ignition? > Compression? > Call HBW. Each diamond has yes/no branches in muted colors (green=continue, red=problem). Final "Call HBW" node has phone number callout in gold. Clean white background, Mercury black text. No people. 1080x1350. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'mercury-75-90-115-best-fit-matrix',
    articleSlug: 'mercury-75-vs-90-vs-115-comparison',
    type: 'infographic',
    aspect: '16:9',
    description:
      'Visual matrix showing which Mercury (75/90/115) fits which boat type and use case',
    prompt:
      'Photorealistic editorial infographic. 3x3 visual grid: rows = Mercury 75, 90, 115 HP. Columns = Boat Type, Best Use Case, Avoid If. Each cell has a small motor silhouette icon and 2-line description. Mercury black cowls, red accents. Clean white background. No people. 1600x900. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'pontoon-hp-by-length-and-use',
    articleSlug: 'best-mercury-outboard-pontoon-boats',
    type: 'infographic',
    aspect: '16:9',
    description:
      'Matrix showing recommended Mercury HP and gearcase by pontoon length and use case',
    prompt:
      'Photorealistic editorial infographic. 2x3 matrix grid: rows = pontoon length (18-20 ft, 20-22 ft, 22-24 ft tritoon). Columns = Cruising, Family + Light Sports, Active Water Sports. Each cell shows recommended Mercury HP class and gearcase. Mercury black accent. Clean white background, no people. 1600x900. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'shaft-length-vs-transom-diagram',
    articleSlug: 'outboard-shaft-length-guide',
    type: 'diagram',
    aspect: '4:5',
    description:
      'Side-profile diagram showing the relationship between shaft length and transom height with labeled cavitation plate position',
    prompt:
      'Photorealistic editorial technical diagram. Side profile cross-section of a Mercury outboard mounted on a boat transom. Labeled measurements: transom height arrow (top to bottom), shaft length arrow (mounting bracket to cavitation plate), water line. Three variations side-by-side: 15-inch short, 20-inch long, 25-inch extra long. Mercury cowl details accurate. Clean white background, technical illustration style. No people. 1080x1350. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'spring-commissioning-checklist-card',
    articleSlug: 'spring-outboard-commissioning-checklist',
    type: 'infographic',
    aspect: '4:5',
    description: 'Visual seasonal checklist showing pre-launch tasks in order',
    prompt:
      'Photorealistic editorial checklist infographic. Vertical card layout titled "Spring Outboard Commissioning". 7 numbered steps stacked vertically with checkbox icons: 1. Battery & Electrical, 2. Fuel System, 3. Cooling System, 4. Lubrication, 5. Spark Plugs & Ignition, 6. Prop & Lower Unit, 7. Sea-Trial. Each step has a 1-line description and a small icon. Cream background, Mercury black text, gold accent on numbers. No people. 1080x1350. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'mercury-rigging-cost-stack',
    articleSlug: 'mercury-outboard-rigging-costs-ontario',
    type: 'infographic',
    aspect: '16:9',
    description: 'Cost stack visualization showing rigging components',
    prompt:
      'Photorealistic editorial infographic. Horizontal stacked bar showing Mercury rigging cost breakdown. 7 segments labeled: Throttle/Shift, Steering, Harness, Gauges, Battery Cables, Fuel Hose, Prop. Each segment a different muted color, with $ ranges below. Title: "What\'s in your Mercury rigging cost". Clean white background, Mercury black/red accents. No people. 1600x900. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'hull-vs-repower-decision-tree',
    articleSlug: 'boat-hull-replacement-vs-repower-decision',
    type: 'diagram',
    aspect: '4:5',
    description: 'Decision tree showing Repower vs. Replace path with key questions',
    prompt:
      'Photorealistic editorial decision tree diagram. Title: "Repower or Replace? The honest decision". Top question: "Is the hull less than 20 years old AND structurally solid?" Branches Yes/No. Yes branch leads to "Repower (saves $25K-$50K)". No branch leads to follow-up: "Is hull rotting / soft-transom / fundamentally undersized?" Yes leads to "Replace". Diamond shapes for questions, rounded rectangles for outcomes. Mercury red for "Replace" outcome, gold for "Repower" outcome. Clean white background. No people. 1080x1350. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
  {
    slug: 'annual-mercury-service-cycle',
    articleSlug: 'mercury-motor-maintenance-seasonal-tips',
    type: 'infographic',
    aspect: '1:1',
    description: 'Circular diagram showing the four-part seasonal Mercury service cycle',
    prompt:
      'Photorealistic editorial circular infographic. Title: "Annual Mercury Service Cycle". Circular flow with 4 quadrants: Spring (April-May) Commissioning, Summer (July) Mid-Season Check, Fall (Oct-Nov) Winterization, Winter Storage. Each quadrant has icon, season label, and 1-line task description. Center: small Mercury cowl icon. Mercury black/red color scheme, cream background. No people. 1080x1080. [STYLE ANCHOR]',
    image: null,
    status: 'pending',
  },
];

export function getPlaceholdersForArticle(articleSlug: string): ImagePlaceholderEntry[] {
  return imagePlaceholders.filter((p) => p.articleSlug === articleSlug);
}

export function getPlaceholder(slug: string): ImagePlaceholderEntry | undefined {
  return imagePlaceholders.find((p) => p.slug === slug);
}
