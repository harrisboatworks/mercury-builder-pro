import { classifyMotorFamily, type MotorFamily } from './motor-family-classifier';
import { isTillerMotor } from './motor-helpers';
import {
  getArticleBySlug,
  blogArticles,
  isArticlePublished,
  type BlogArticle,
} from '@/data/blogArticles';

interface MotorLike {
  hp?: number;
  family?: string;
  model?: string;
  model_display?: string;
  model_number?: string;
  specifications?: any;
}

function safeGetArticle(slug: string): BlogArticle | null {
  try {
    const article = getArticleBySlug(slug);
    if (article && isArticlePublished(article)) return article;
  } catch {}
  try {
    return Array.isArray(blogArticles)
      ? blogArticles.find((article) => article?.slug === slug && isArticlePublished(article)) || null
      : null;
  } catch {
    return null;
  }
}

const FAMILY_ARTICLE_TERMS: Record<MotorFamily, string[]> = {
  'Pro XS': ['pro xs', 'pro-xs', 'proxs'],
  ProKicker: ['prokicker', 'pro kicker', 'kicker'],
  SeaPro: ['seapro', 'sea pro'],
  Verado: ['verado'],
  FourStroke: ['fourstroke', 'four stroke'],
};

function articleText(article: BlogArticle): string {
  return [
    article.slug,
    article.title,
    article.description,
    article.category,
    ...(article.keywords || []),
  ].join(' ').toLowerCase();
}

function recencyScore(article: BlogArticle, now = new Date()): number {
  const modifiedAt = new Date(article.dateModified || article.datePublished).getTime();
  if (!Number.isFinite(modifiedAt)) return 0;
  const ageDays = Math.max(0, (now.getTime() - modifiedAt) / 86_400_000);
  if (ageDays <= 45) return 10;
  if (ageDays <= 120) return 6;
  if (ageDays <= 365) return 3;
  return 0;
}

function discoveredArticleScore(
  article: BlogArticle,
  hp: number,
  family: MotorFamily,
  flags: { isCT: boolean; isTiller: boolean; isKickerClass: boolean },
): number {
  const text = articleText(article);
  const familyMatch = FAMILY_ARTICLE_TERMS[family].some((term) => text.includes(term));
  const hpMatch = hp > 0 && new RegExp(`(^|\\D)${String(hp).replace('.', '\\.')}\\s*(?:hp)?(?:\\D|$)`, 'i').test(text);
  const ctMatch = flags.isCT && /\b(command thrust|pontoon|ct gearcase)\b/i.test(text);
  const tillerMatch = flags.isTiller && /\btiller\b/i.test(text);
  const kickerMatch = flags.isKickerClass && /\b(kicker|prokicker|trolling)\b/i.test(text);

  let score = 0;
  if (familyMatch) score += 54;
  if (hpMatch) score += 42;
  if (ctMatch) score += 44;
  if (tillerMatch) score += 44;
  if (kickerMatch) score += 44;

  // Recency helps a genuinely relevant guide rise; it cannot make an unrelated
  // post a recommendation by itself.
  if (score > 0) score += recencyScore(article);
  return score;
}

export function getMotorRelatedBlogSlugs(motor: MotorLike): string[] {
  try {
    if (!motor) return [];
    const hp = motor.hp ?? 0;
    const modelStr = motor.model ?? motor.model_display ?? '';
    const displayStr = motor.model_display ?? motor.model ?? '';

    let family: MotorFamily = 'FourStroke';
    try {
      const explicitFamily = String(motor.family || '').toLowerCase();
      if (/pro\s*xs|proxs/.test(explicitFamily)) family = 'Pro XS';
      else if (/pro\s*kicker|prokicker/.test(explicitFamily)) family = 'ProKicker';
      else if (/sea\s*pro|seapro/.test(explicitFamily)) family = 'SeaPro';
      else if (/verado/.test(explicitFamily)) family = 'Verado';
      else family = classifyMotorFamily(hp, modelStr, motor.specifications);
    } catch {}

    let isTiller = false;
    try { isTiller = isTillerMotor(modelStr); } catch {}

    const isCT = /\bCT\b|Command Thrust/i.test(displayStr);
    const isKickerClass = hp <= 15;
    const isProKicker = family === 'ProKicker';

    // Build a denylist FIRST — any slug here is excluded no matter what
    const deny = new Set<string>();
    if (isTiller || isKickerClass || isProKicker) {
      deny.add('mercury-controls-rigging-guide-ontario');
      deny.add('mercury-150-300hp-pro-xs-performance-guide');
      deny.add('mercury-boost-upgrade-150hp-pontoon-analysis');
      deny.add('center-console-mercury-motor-guide');
      deny.add('best-mercury-outboard-lake-ontario-salmon-trout');
      deny.add('mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026');
    }
    if (isKickerClass) {
      deny.add('mercury-repower-cost-ontario-2026-cad');
      deny.add('best-mercury-outboard-aluminum-fishing-boats');
      deny.add('best-mercury-outboard-pontoon-boats');
      deny.add('bass-boat-mercury-motor-buying-guide');
      deny.add('mercury-40-vs-60-hp-outboard-ontario');
    }

    const scores = new Map<string, number>();
    const add = (slug: string, score: number) => {
      if (deny.has(slug)) return;
      scores.set(slug, Math.max(score, scores.get(slug) || 0));
    };

    // PRIORITY 1 — use-case
    // 9.9 portable (non-ProKicker) — surface the dedicated EFI review
    if (hp === 9.9 && !isProKicker) add('mercury-9-9-efi-review-ontario', 130);
    if (hp === 60) add('mercury-60-hp-fourstroke-review-ontario', 130);
    if (isTiller) add('tiller-vs-remote-steering-outboard-guide', 126);
    if (isCT) add('mercury-command-thrust-complete-guide-2026', 126);
    if (family === 'Pro XS' && hp >= 150 && hp <= 200) add('mercury-boost-upgrade-150hp-pontoon-analysis', 120);

    // PRIORITY 2 — family
    if (family === 'Pro XS') {
      add('mercury-pro-xs-buyer-guide-ontario', 116);
      add('fourstroke-vs-pro-xs', 112);
      add('bass-boat-mercury-motor-buying-guide', 104);
    }
    else if (family === 'ProKicker' || isKickerClass) {
      add('mercury-prokicker-rice-lake-fishing-guide', 116);
      add('electric-trolling-motor-kicker-guide', 108);
    } else if (family === 'SeaPro') add('mercury-seapro-commercial-outboard-guide', 116);
    else if (family === 'Verado') add('mercury-150-300hp-pro-xs-performance-guide', 100);
    else add('mercury-fourstroke-buyer-guide-ontario', 108);

    // PRIORITY 3 — HP class (skip for kickers ≤15)
    if (!isKickerClass) {
      if (hp >= 25 && hp < 40) add('mercury-40-vs-60-hp-outboard-ontario', 98);
      else if (hp >= 40 && hp <= 60) {
        add('mercury-40-vs-60-hp-outboard-ontario', 98);
        add('best-mercury-outboard-aluminum-fishing-boats', 92);
      } else if (hp >= 60 && hp <= 90) {
        add('best-mercury-outboard-aluminum-fishing-boats', 96);
        add('best-mercury-outboard-pontoon-boats', 88);
      } else if (hp >= 90 && hp <= 115) {
        add('mercury-75-vs-90-vs-115-comparison', 114);
        add('mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026', 96);
        add('best-mercury-outboard-pontoon-boats', isCT ? 110 : 84);
      } else if (hp >= 115 && hp <= 150) {
        add('mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026', 100);
        add('best-mercury-outboard-pontoon-boats', isCT ? 110 : 82);
      } else if (hp >= 150 && hp <= 200) {
        add('mercury-150-300hp-pro-xs-performance-guide', 100);
        add('mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026', 94);
      } else if (hp >= 200 && hp <= 300) {
        add('mercury-150-300hp-pro-xs-performance-guide', 100);
        add('center-console-mercury-motor-guide', 92);
        add('best-mercury-outboard-lake-ontario-salmon-trout', 88);
      } else if (hp > 300) {
        add('center-console-mercury-motor-guide', 96);
        add('mercury-150-300hp-pro-xs-performance-guide', 92);
      }
    }

    // PRIORITY 4 — repower context (skip for kickers)
    if (!isKickerClass) {
      add('mercury-repower-cost-ontario-2026-cad', 72);
    }
    add('outboard-trade-in-value-ontario-hbw', 64);

    // Discover newly published or updated guides. Exact motor relevance creates
    // the score; date freshness only breaks ties among relevant articles.
    for (const article of blogArticles) {
      if (!article || deny.has(article.slug) || !isArticlePublished(article)) continue;
      const score = discoveredArticleScore(article, hp, family, { isCT, isTiller, isKickerClass });
      if (score >= 50) add(article.slug, score);
    }

    // PRIORITY 5 — universal fillers ONLY if we have fewer than 3 targeted cards
    const validated = [...scores.entries()]
      .filter(([slug]) => safeGetArticle(slug))
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

    if (validated.length < 3) {
      const fillers = [
        'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado',
        'outboard-shaft-length-guide',
        'ontario-mercury-outboard-price-guide',
      ].filter((slug) => !deny.has(slug) && !scores.has(slug));
      for (const slug of fillers) {
        if (validated.length >= 3) break;
        if (safeGetArticle(slug)) {
          validated.push([slug, 20]);
        }
      }
    }

    return validated.slice(0, 6).map(([slug]) => slug);
  } catch (err) {
    console.error('[getMotorRelatedBlogSlugs] failed:', err);
    return [];
  }
}
