import { classifyMotorFamily, type MotorFamily } from './motor-family-classifier';
import { isTillerMotor } from './motor-helpers';
import { getArticleBySlug, blogArticles } from '@/data/blogArticles';

interface MotorLike {
  hp?: number;
  model?: string;
  model_display?: string;
  model_number?: string;
  specifications?: any;
}

function safeGetArticle(slug: string): boolean {
  try {
    if (getArticleBySlug(slug)) return true;
  } catch {}
  try {
    return Array.isArray(blogArticles) && blogArticles.some((a: any) => a?.slug === slug);
  } catch {
    return false;
  }
}

export function getMotorRelatedBlogSlugs(motor: MotorLike): string[] {
  try {
    if (!motor) return [];
    const hp = motor.hp ?? 0;
    const modelStr = motor.model ?? motor.model_display ?? '';
    const displayStr = motor.model_display ?? motor.model ?? '';

    let family: MotorFamily = 'FourStroke';
    try { family = classifyMotorFamily(hp, modelStr, motor.specifications); } catch {}

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
      deny.add('mercury-115-vs-150-hp-outboard-ontario');
    }
    if (isKickerClass) {
      deny.add('mercury-repower-cost-ontario-2026-cad');
      deny.add('best-mercury-outboard-aluminum-fishing-boats');
      deny.add('best-mercury-outboard-pontoon-boats');
      deny.add('bass-boat-mercury-motor-buying-guide');
      deny.add('mercury-40-vs-60-hp-outboard-ontario');
    }

    const out: string[] = [];

    // PRIORITY 1 — use-case
    // 9.9 portable (non-ProKicker) — surface the dedicated EFI review
    if (hp === 9.9 && !isProKicker) out.push('mercury-9-9-efi-review-ontario');
    if (isTiller) out.push('tiller-vs-remote-steering-outboard-guide');
    if (isCT) out.push('mercury-command-thrust-guide-pontoon-boats');
    if (family === 'Pro XS' && hp >= 150 && hp <= 200) out.push('mercury-boost-upgrade-150hp-pontoon-analysis');

    // PRIORITY 2 — family
    if (family === 'Pro XS') out.push('bass-boat-mercury-motor-buying-guide');
    else if (family === 'ProKicker' || isKickerClass) {
      out.push('mercury-prokicker-rice-lake-fishing-guide');
      out.push('electric-trolling-motor-kicker-guide');
    } else if (family === 'SeaPro') out.push('mercury-seapro-commercial-outboard-guide');
    else if (family === 'Verado') out.push('mercury-150-300hp-pro-xs-performance-guide');

    // PRIORITY 3 — HP class (skip for kickers ≤15)
    if (!isKickerClass) {
      if (hp >= 25 && hp < 40) out.push('mercury-40-vs-60-hp-outboard-ontario');
      else if (hp >= 40 && hp <= 60) {
        out.push('mercury-40-vs-60-hp-outboard-ontario');
        out.push('best-mercury-outboard-aluminum-fishing-boats');
      } else if (hp >= 60 && hp <= 90) {
        out.push('best-mercury-outboard-aluminum-fishing-boats');
        out.push('best-mercury-outboard-pontoon-boats');
      } else if (hp >= 90 && hp <= 115) {
        out.push('best-mercury-outboard-pontoon-boats');
        out.push('mercury-115-vs-150-hp-outboard-ontario');
      } else if (hp >= 115 && hp <= 150) {
        out.push('mercury-115-vs-150-hp-outboard-ontario');
        out.push('best-mercury-outboard-pontoon-boats');
      } else if (hp >= 150 && hp <= 200) {
        out.push('mercury-150-300hp-pro-xs-performance-guide');
        out.push('mercury-115-vs-150-hp-outboard-ontario');
      } else if (hp >= 200 && hp <= 300) {
        out.push('mercury-150-300hp-pro-xs-performance-guide');
        out.push('center-console-mercury-motor-guide');
        out.push('best-mercury-outboard-lake-ontario-salmon-trout');
      } else if (hp > 300) {
        out.push('center-console-mercury-motor-guide');
        out.push('mercury-150-300hp-pro-xs-performance-guide');
      }
    }

    // PRIORITY 4 — repower context (skip for kickers)
    if (!isKickerClass) {
      out.push('mercury-repower-cost-ontario-2026-cad');
    }
    out.push('outboard-trade-in-value-ontario-hbw');

    // Apply denylist + dedupe + validate
    const seen = new Set<string>();
    const validated: string[] = [];
    for (const slug of out) {
      if (deny.has(slug)) continue;
      if (seen.has(slug)) continue;
      seen.add(slug);
      if (!safeGetArticle(slug)) continue;
      validated.push(slug);
    }

    // PRIORITY 5 — universal fillers ONLY if we have fewer than 3 targeted cards
    if (validated.length < 3) {
      const fillers = [
        'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado',
        'outboard-shaft-length-guide',
        'ontario-mercury-outboard-price-guide',
      ].filter(s => !deny.has(s) && !seen.has(s));
      for (const slug of fillers) {
        if (validated.length >= 3) break;
        if (safeGetArticle(slug)) {
          validated.push(slug);
          seen.add(slug);
        }
      }
    }

    return validated.slice(0, 6);
  } catch (err) {
    console.error('[getMotorRelatedBlogSlugs] failed:', err);
    return [];
  }
}
