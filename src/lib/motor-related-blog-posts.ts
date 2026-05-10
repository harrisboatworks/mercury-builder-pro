import { classifyMotorFamily, type MotorFamily } from './motor-family-classifier';
import { isTillerMotor } from './motor-helpers';
import { getArticleBySlug } from '@/data/blogArticles';

interface MotorLike {
  hp?: number;
  model?: string;
  model_display?: string;
  model_number?: string;
  specifications?: any;
}

const UNIVERSAL_FILLERS = [
  'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado',
  'mercury-controls-rigging-guide-ontario',
  'outboard-shaft-length-guide',
  'mercury-maintenance-intervals-20-100-300-rule',
  'mercury-outboard-warranty-canada-2026',
  'ontario-mercury-outboard-price-guide',
];

export function getMotorRelatedBlogSlugs(motor: MotorLike): string[] {
  const hp = motor.hp ?? 0;
  const modelStr = motor.model ?? motor.model_display ?? '';
  const displayStr = motor.model_display ?? motor.model ?? '';
  const family: MotorFamily = classifyMotorFamily(hp, modelStr, motor.specifications);
  const isTiller = isTillerMotor(modelStr);
  const isCT = /\bCT\b|Command Thrust/i.test(displayStr);

  const out: string[] = [];

  // Priority 1 — Use-case specific
  if (isTiller) out.push('tiller-vs-remote-steering-outboard-guide');
  if (isCT) out.push('mercury-command-thrust-guide-pontoon-boats');
  if (family === 'Pro XS' && hp >= 150 && hp <= 200) {
    out.push('mercury-boost-upgrade-150hp-pontoon-analysis');
  }

  // Priority 2 — Family-specific
  if (family === 'Pro XS') {
    out.push('bass-boat-mercury-motor-buying-guide');
  } else if (family === 'ProKicker') {
    out.push('mercury-prokicker-rice-lake-fishing-guide');
    out.push('electric-trolling-motor-kicker-guide');
  } else if (family === 'SeaPro') {
    out.push('mercury-seapro-commercial-outboard-guide');
  } else if (family === 'Verado') {
    out.push('mercury-150-200hp-v6-performance');
  }

  // Priority 3 — HP-class specific
  if (hp <= 15) {
    out.push('mercury-prokicker-rice-lake-fishing-guide');
  } else if (hp >= 25 && hp < 40) {
    out.push('mercury-40-vs-60-hp-outboard-ontario');
  } else if (hp >= 40 && hp <= 60) {
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
    out.push('mercury-150-200hp-v6-performance');
    out.push('mercury-115-vs-150-hp-outboard-ontario');
  } else if (hp >= 200 && hp <= 300) {
    out.push('mercury-150-200hp-v6-performance');
    out.push('center-console-mercury-motor-guide');
    out.push('best-mercury-outboard-lake-ontario-salmon-trout');
  } else if (hp > 300) {
    out.push('center-console-mercury-motor-guide');
    out.push('mercury-150-200hp-v6-performance');
  }

  // Priority 4 — Repower / pricing context
  out.push('mercury-repower-cost-ontario-2026-cad');
  out.push('outboard-trade-in-value-ontario-hbw');

  // Priority 5 — Universal fillers (only if under 6)
  for (const slug of UNIVERSAL_FILLERS) {
    if (out.length >= 6) break;
    out.push(slug);
  }

  // Dedupe preserving first occurrence, validate against article DB, cap at 6.
  const seen = new Set<string>();
  const result: string[] = [];
  for (const slug of out) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    if (!getArticleBySlug(slug)) continue;
    result.push(slug);
    if (result.length >= 6) break;
  }
  return result;
}
