/**
 * Single source of truth for how quote extras are grouped and ordered.
 *
 * The quote summary page and the customer PDF must show the identical set of
 * line items, in the identical groups, in the identical order, on every
 * viewport. Both surfaces render from this helper so they cannot drift.
 */

export interface QuoteAccessoryItem {
  name: string;
  price: number;
  description?: string;
  category?: 'equipment' | 'installation' | 'protection' | 'custom' | string;
}

export interface QuoteAccessoryGroup<T extends QuoteAccessoryItem = QuoteAccessoryItem> {
  key: 'equipment' | 'installation' | 'protection' | 'custom';
  title: string;
  items: T[];
}

export const QUOTE_ACCESSORY_GROUP_DEFS: Array<{
  key: QuoteAccessoryGroup['key'];
  title: string;
  matches: (item: QuoteAccessoryItem) => boolean;
}> = [
  {
    key: 'equipment',
    title: 'Equipment and Rigging',
    // Preserve legacy or unrecognized categories instead of hiding line items.
    matches: (item) => !['installation', 'protection', 'custom'].includes(item.category || ''),
  },
  {
    key: 'installation',
    title: 'Installation and Setup',
    matches: (item) => item.category === 'installation',
  },
  {
    key: 'protection',
    title: 'Mercury Product Protection',
    matches: (item) => item.category === 'protection',
  },
  {
    key: 'custom',
    title: 'Additional Items',
    matches: (item) => item.category === 'custom',
  },
];

export function groupAccessoryItems<T extends QuoteAccessoryItem>(
  items: T[] = [],
): Array<QuoteAccessoryGroup<T>> {
  return QUOTE_ACCESSORY_GROUP_DEFS
    .map((def) => ({
      key: def.key,
      title: def.title,
      items: items.filter((item) => def.matches(item)),
    }))
    .filter((group) => group.items.length > 0);
}
