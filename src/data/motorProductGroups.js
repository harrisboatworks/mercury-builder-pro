// Full inline group definitions for both crawler HTML and hydrated motor pages.
// Keep the established group IDs; a bare ProductGroup ID is not a definition.
const GROUPS = {
  fourstroke: ['mercury-fourstroke-outboards', 'Mercury FourStroke Outboards'],
  proxs: ['mercury-pro-xs-outboards', 'Mercury Pro XS Outboards'],
  seapro: ['mercury-seapro-outboards', 'Mercury SeaPro Outboards'],
  prokicker: ['mercury-prokicker-outboards', 'Mercury ProKicker Outboards'],
};

export function buildMotorProductGroup(family, modelName = '') {
  const normalizedFamily = String(family || '').toLowerCase().replace(/\s+/g, '');
  // Some inventory classifies ProKicker as FourStroke; the model identifies it.
  const isProKicker = /pro\s*kicker/i.test(String(modelName));
  const groupKey = isProKicker ? 'prokicker'
    : Object.keys(GROUPS).find((key) => normalizedFamily.includes(key));
  const group = GROUPS[groupKey];
  if (!group) return null;

  const [productGroupID, name] = group;
  return {
    '@type': 'ProductGroup',
    productGroupID,
    name,
    description: `${name} sold and serviced by Harris Boat Works in Gores Landing, Ontario. Local pickup or professional installation only; no shipping.`,
  };
}
