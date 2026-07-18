export interface QuoteProgressState {
  purchasePath?: 'loose' | 'installed' | null;
  motor?: unknown;
  hasTradein?: boolean;
}

export interface QuoteProgressStep {
  id: number;
  label: string;
  shortLabel: string;
  path: string;
  isConditional?: boolean;
  condition?: (state: QuoteProgressState) => boolean;
}

const allSteps: QuoteProgressStep[] = [
  { id: 1, label: 'Motor Selection', shortLabel: 'Motor', path: '/quote/motor-selection' },
  { id: 2, label: 'Options', shortLabel: 'Options', path: '/quote/options' },
  { id: 3, label: 'Purchase Path', shortLabel: 'Path', path: '/quote/purchase-path' },
  { id: 4, label: 'Boat Info', shortLabel: 'Boat', path: '/quote/boat-info' },
  { id: 5, label: 'Trade-In', shortLabel: 'Trade-In', path: '/quote/trade-in' },
  {
    id: 6,
    label: 'Fuel Tank',
    shortLabel: 'Fuel',
    path: '/quote/fuel-tank',
    isConditional: true,
    condition: (state) => state.purchasePath === 'loose'
      && Boolean((state.motor as { isTiller?: boolean } | null)?.isTiller),
  },
  {
    id: 7,
    label: 'Installation',
    shortLabel: 'Install',
    path: '/quote/installation',
    isConditional: true,
    condition: (state) => state.purchasePath === 'installed',
  },
  { id: 8, label: 'Promo', shortLabel: 'Promo', path: '/quote/promo-selection' },
  { id: 9, label: 'Summary', shortLabel: 'Summary', path: '/quote/summary' },
];

export const getVisibleQuoteSteps = (state: QuoteProgressState): QuoteProgressStep[] => (
  allSteps.filter((step) => {
    if (step.isConditional && step.condition) return step.condition(state);
    return true;
  })
);
