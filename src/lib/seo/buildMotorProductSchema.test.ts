// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildMotorProductSchema } from './buildMotorProductSchema';

describe('buildMotorProductSchema', () => {
  it('marks a temporarily sold-out sale motor as BackOrder without inventing an expiry date', () => {
    const product = buildMotorProductSchema({
      name: 'Mercury 9.9 MH FourStroke',
      hp: 9.9,
      family: 'FourStroke',
      shaft: '15 inch',
      startType: 'Manual',
      controlType: 'Tiller',
      modelNumber: '1A10201LK',
      priceCAD: 2999,
      inStock: false,
      offerAvailability: 'BackOrder',
      priceValidUntil: null,
      url: 'https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9mh-fourstroke',
    });

    expect(product.mpn).toBe('1A10201LK');
    expect(product.offers).toMatchObject({
      priceCurrency: 'CAD',
      price: '2999',
      availability: 'https://schema.org/BackOrder',
      itemCondition: 'https://schema.org/NewCondition',
    });
    expect(product.offers).not.toHaveProperty('priceValidUntil');
  });

  it('keeps the existing generated validity window for ordinary priced motors', () => {
    const product = buildMotorProductSchema({
      name: 'Mercury 25 ELPT FourStroke',
      priceCAD: 5999,
      inStock: true,
      url: 'https://www.mercuryrepower.ca/motors/example',
    });

    expect(product.offers).toMatchObject({
      availability: 'https://schema.org/InStock',
      priceCurrency: 'CAD',
    });
    expect(product.offers).toHaveProperty('priceValidUntil');
  });
});
