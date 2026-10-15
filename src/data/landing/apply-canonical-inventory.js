// Overlay landing-table names and availability from the published inventory
// snapshot (CANONICAL_SKUS / live motors feed). Never rewrite prices.

import { applyMotorPresentationOverrides } from '../motorPresentationOverrides.js';

function factPartNo(item) {
  return String(
    item?.partNo || item?.modelNumber || item?.model_number || item?.mercury_model_no || '',
  )
    .trim()
    .toUpperCase();
}

function factModel(item) {
  return String(item?.modelDisplay || item?.model_display || item?.model || '').trim();
}

export function inventoryInStock(item) {
  if (typeof item?.inStock === 'boolean') return item.inStock;
  if (typeof item?.in_stock === 'boolean') return item.in_stock;
  const status = String(item?.status || item?.availability || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ');
  return /^in stock\b/.test(status);
}

export function landingAvailabilityFromInventory(item) {
  const inStock = inventoryInStock(item);
  return {
    availability: inStock ? 'InStock' : 'BackOrder',
    availabilityLabel: inStock ? 'In stock' : 'Available to order',
  };
}

// Keep the same spacing rules as src/lib/motor-display-formatter.ts so
// "60ELPT FourStroke" becomes "60 ELPT FourStroke" without importing TS
// into the prerenderer.
export function formatLandingModelName(modelName) {
  if (!modelName) return '';

  let formatted = String(modelName).trim();
  formatted = formatted.replace(
    /(\d+(?:\.\d+)?)(MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO)\b/gi,
    (_match, hp, code) => `${hp} ${code.toUpperCase()}`,
  );
  formatted = formatted.replace(
    /\b(MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO)\b/gi,
    (match) => match.toUpperCase(),
  );
  return formatted.replace(/\s+/g, ' ').trim();
}

function ensureCommandThrustDisplayName(displayName, hinted) {
  const name = (displayName || '').replace(/\s+/g, ' ').trim();
  if (!name || !hinted || /\bcommand\s*thrust\b/i.test(name)) return name;
  if (/\bFourStroke\b/i.test(name)) {
    return name.replace(/\bFourStroke\b/i, 'Command Thrust FourStroke');
  }
  if (/\bPro\s*XS\b/i.test(name)) {
    return name.replace(/\bPro\s*XS\b/i, 'Pro XS Command Thrust');
  }
  return `${name} Command Thrust`;
}

export function landingDisplayNameFromInventory(item) {
  const partNo = factPartNo(item);
  const formatted = formatLandingModelName(factModel(item));
  const presented = applyMotorPresentationOverrides({
    model_number: partNo,
    model_display: formatted,
    commandThrust: item?.commandThrust,
    has_command_thrust: item?.has_command_thrust,
  });
  const hinted =
    presented.commandThrust === true ||
    presented.has_command_thrust === true ||
    item?.commandThrust === true ||
    item?.has_command_thrust === true ||
    /\bcommand\s*thrust\b/i.test(factModel(item));
  return ensureCommandThrustDisplayName(presented.model_display || formatted, hinted);
}

function withCommandThrustConfig(config, displayName) {
  const current = String(config || '').trim();
  if (!/\bcommand\s*thrust\b/i.test(displayName) || /\bcommand\s*thrust\b/i.test(current)) {
    return current;
  }
  return current ? `${current}, Command Thrust` : 'Command Thrust';
}

export function indexInventoryByPartNo(records) {
  const byPartNo = new Map();
  const list = Array.isArray(records) ? records : [];
  for (const item of list) {
    const partNo = factPartNo(item);
    if (!partNo || byPartNo.has(partNo)) continue;
    byPartNo.set(partNo, item);
  }
  return byPartNo;
}

export function applyCanonicalInventoryToVariant(variant, inventoryByPartNo) {
  const sku = String(variant?.sku || '').trim().toUpperCase();
  if (!sku) return variant;
  const item = inventoryByPartNo instanceof Map
    ? inventoryByPartNo.get(sku)
    : inventoryByPartNo?.[sku];
  if (!item) return variant;

  const name = landingDisplayNameFromInventory({ ...item, partNo: sku });
  const { availability, availabilityLabel } = landingAvailabilityFromInventory(item);
  return {
    ...variant,
    name,
    config: withCommandThrustConfig(variant.config, name),
    availability,
    availabilityLabel,
  };
}

export function applyCanonicalInventoryToVariants(variants, records) {
  const inventoryByPartNo = records instanceof Map ? records : indexInventoryByPartNo(records);
  return (variants || []).map((variant) => applyCanonicalInventoryToVariant(variant, inventoryByPartNo));
}
