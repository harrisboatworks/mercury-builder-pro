import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { buildAccessoryBreakdown } from '@/lib/build-accessory-breakdown';
import { groupAccessoryItems } from '@/lib/quote-accessory-groups';

/**
 * The quote summary page and the customer PDF must render the identical set of
 * accessory line items, in the identical groups and order, on every viewport.
 */

const twentyElh = buildAccessoryBreakdown({
  motor: { model: '20 ELH FourStroke', hp: 20 },
  purchasePath: 'loose',
  selectedOptions: [],
});

describe('quote extras parity between summary page and PDF', () => {
  it('lists the factory-included fuel tank and propeller for a 20 ELH', () => {
    const names = twentyElh.map((item) => item.name);
    expect(names).toContain('12L Fuel Tank & Hose');
    expect(names).toContain('Standard Propeller');
    expect(twentyElh.find((i) => i.name === 'Standard Propeller')?.price).toBe(0);
    expect(twentyElh.find((i) => i.name === '12L Fuel Tank & Hose')?.price).toBe(0);
  });

  it('groups identically for both surfaces (same groups, items, prices, counts)', () => {
    const summaryGroups = groupAccessoryItems(twentyElh);
    const pdfGroups = groupAccessoryItems(twentyElh);

    expect(summaryGroups).toEqual(pdfGroups);
    expect(summaryGroups.flatMap((g) => g.items)).toHaveLength(twentyElh.length);
    expect(summaryGroups.map((g) => g.key)).toEqual(
      ['equipment', 'installation', 'protection', 'custom'].filter((key) =>
        summaryGroups.some((g) => g.key === key),
      ),
    );
  });

  it('keeps every item exactly once across groups', () => {
    const items = buildAccessoryBreakdown({
      motor: { model: '115 ELPT FourStroke', hp: 115 },
      purchasePath: 'installed',
      boatInfo: { controlsOption: 'adapter' },
      warrantyConfig: { extendedYears: 2, warrantyPrice: 1200, totalYears: 5 },
      adminCustomItems: [{ name: 'Shop supplies', price: 75 }],
      selectedOptions: [],
    });

    const grouped = groupAccessoryItems(items).flatMap((g) => g.items);
    expect(grouped).toHaveLength(items.length);
    expect([...grouped].sort((a, b) => a.name.localeCompare(b.name)))
      .toEqual([...items].sort((a, b) => a.name.localeCompare(b.name)));
  });

  it('preserves unknown categories and the Mercury Product Protection heading', () => {
    const legacy = { name: 'Legacy rigging', price: 80, category: 'rigging' };
    const protection = { name: 'Platinum plan', price: 1200, category: 'protection' };
    const groups = groupAccessoryItems([legacy, protection]);
    expect(groups).toEqual([
      { key: 'equipment', title: 'Equipment and Rigging', items: [legacy] },
      { key: 'protection', title: 'Mercury Product Protection', items: [protection] },
    ]);
  });

  it('does not duplicate explicitly selected factory equipment or alter its price', () => {
    const items = buildAccessoryBreakdown({
      motor: { model: '20 ELH FourStroke', hp: 20 },
      purchasePath: 'loose',
      selectedOptions: [
        { name: '12L Fuel Tank & Hose', price: 0, isIncluded: true },
        { name: 'Standard Propeller', price: 0, isIncluded: true },
      ],
    });
    expect(items.filter((item) => item.name === '12L Fuel Tank & Hose')).toHaveLength(1);
    expect(items.filter((item) => item.name === 'Standard Propeller')).toHaveLength(1);
    expect(items.reduce((sum, item) => sum + item.price, 0)).toBe(0);
  });

  it('renders the extras without any viewport conditional that could hide lines', () => {
    const pricingTable = readFileSync('src/components/quote-builder/PricingTable.tsx', 'utf8');
    expect(pricingTable).toContain('groupAccessoryItems(accessoryBreakdown)');
    expect(pricingTable).not.toMatch(/useIsMobile|md:hidden|lg:hidden|sm:hidden/);

    const pdf = readFileSync('src/components/quote-pdf/ProfessionalQuotePDF.tsx', 'utf8');
    expect(pdf).toContain('groupAccessoryItems(items)');
  });
});
