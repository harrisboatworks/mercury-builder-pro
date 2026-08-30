// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveMotorAvailability } from './motorAvailability';

describe('resolveMotorAvailability', () => {
  it('shows an active motor with zero quantity as available to order', () => {
    expect(resolveMotorAvailability({
      availability: null,
      in_stock: false,
      stock_quantity: 0,
    })).toMatchObject({
      inStock: false,
      quantity: 0,
      label: 'Available to order',
      schemaAvailability: 'BackOrder',
      status: 'available_to_order',
    });
  });

  it('changes the same motor to in stock when the synced quantity returns', () => {
    expect(resolveMotorAvailability({
      availability: 'In Stock',
      in_stock: true,
      stock_quantity: 4,
    })).toMatchObject({
      inStock: true,
      quantity: 4,
      label: 'In stock now',
      schemaAvailability: 'InStock',
      status: 'in_stock',
    });
  });

  it('lets an explicit zero quantity override a stale in-stock flag', () => {
    expect(resolveMotorAvailability({
      availability: 'In Stock',
      in_stock: true,
      stock_quantity: 0,
    }).inStock).toBe(false);
  });

  it('falls back to the stock flag when an older API record omits quantity', () => {
    expect(resolveMotorAvailability({
      availability: 'In Stock',
      in_stock: true,
      stock_quantity: null,
    }).inStock).toBe(true);
  });
});
