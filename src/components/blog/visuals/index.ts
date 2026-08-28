export { BlogComparison } from './BlogComparison';
export { BlogCostBreakdown } from './BlogCostBreakdown';
export { BlogDecisionTree } from './BlogDecisionTree';
export { BlogStatCallout } from './BlogStatCallout';
export { BlogPullQuote } from './BlogPullQuote';
export { BlogRegionMap } from './BlogRegionMap';

import { BlogComparison } from './BlogComparison';
import { BlogCostBreakdown } from './BlogCostBreakdown';
import { BlogDecisionTree } from './BlogDecisionTree';
import { BlogStatCallout } from './BlogStatCallout';
import { BlogPullQuote } from './BlogPullQuote';
import { BlogRegionMap } from './BlogRegionMap';
import React from 'react';

const REGISTRY: Record<string, React.ComponentType<any>> = {
  'hbw-comparison': BlogComparison,
  'hbw-cost': BlogCostBreakdown,
  'hbw-decision': BlogDecisionTree,
  'hbw-stat': BlogStatCallout,
  'hbw-quote': BlogPullQuote,
  'hbw-map': BlogRegionMap,
};

export const HBW_VISUAL_LANGS = Object.keys(REGISTRY);

/**
 * Try to render an HBW visual from a fenced code block's className + body.
 * Returns null when the language isn't an HBW visual or JSON parsing fails.
 */
export function renderHbwVisual(
  className: string | undefined,
  rawBody: string,
): React.ReactNode | null {
  if (!className) return null;
  const match = className.match(/language-(hbw-[\w-]+)/);
  if (!match) return null;
  const lang = match[1];
  const Comp = REGISTRY[lang];
  if (!Comp) return null;
  try {
    const data = JSON.parse(rawBody.trim());
    return React.createElement(Comp, data);
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[hbw-visual] Failed to parse JSON for ${lang}`);
    }
    return null;
  }
}
