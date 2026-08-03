export type MotorAvailabilitySource = {
  availability?: string | null;
  in_stock?: boolean | null;
  stock_quantity?: number | string | null;
};

export type ResolvedMotorAvailability = {
  inStock: boolean;
  quantity: number | null;
  label: 'In stock now' | 'Available to order';
  detail: string;
  faqAnswer: string;
  schemaAvailability: 'InStock' | 'PreOrder';
  status: 'in_stock' | 'available_to_order';
};

function parseQuantity(value: MotorAvailabilitySource['stock_quantity']): number | null {
  if (value === null || value === undefined || value === '') return null;
  const quantity = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(quantity) ? Math.max(0, quantity) : null;
}

/**
 * Resolve customer-facing availability from the Lightspeed-backed motor record.
 *
 * An explicit quantity wins over stale booleans or labels. This prevents a
 * leftover `in_stock=true` value from advertising stock after quantity reaches
 * zero. Older/fallback records without a quantity can still use the boolean or
 * availability label.
 */
export function resolveMotorAvailability(source: MotorAvailabilitySource): ResolvedMotorAvailability {
  const quantity = parseQuantity(source.stock_quantity);
  const normalized = (source.availability || '').trim().toLowerCase().replace(/_/g, ' ');
  const inStock = quantity !== null
    ? quantity > 0
    : source.in_stock === true || normalized === 'in stock';

  if (inStock) {
    return {
      inStock: true,
      quantity,
      label: 'In stock now',
      detail: 'In stock at Harris Boat Works. Confirm the current quantity before travelling.',
      faqAnswer: 'Yes. It is currently in stock at Harris Boat Works. Call or build a quote to confirm the current quantity before travelling to Gores Landing.',
      schemaAvailability: 'InStock',
      status: 'in_stock',
    };
  }

  return {
    inStock: false,
    quantity,
    label: 'Available to order',
    detail: 'Available to order. Confirm the current ETA before travelling.',
    faqAnswer: 'It is available to order. Call or build a quote to confirm the current ETA before travelling to Gores Landing.',
    schemaAvailability: 'PreOrder',
    status: 'available_to_order',
  };
}
