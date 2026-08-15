import { describe, expect, it } from 'vitest';
import {
  classifyBlogCredibilityAnchors,
  filterToOneBlogCredibilityAnchor,
} from './blogCredibilityAnchorPolicy.js';

describe('blog credibility-anchor policy', () => {
  it('keeps non-anchor items', () => {
    expect(filterToOneBlogCredibilityAnchor([
      'Transparent CAD pricing',
      '60 to 90 minutes from GTA',
    ])).toEqual([
      'Transparent CAD pricing',
      '60 to 90 minutes from GTA',
    ]);
  });

  it('keeps only the first single-class anchor', () => {
    expect(filterToOneBlogCredibilityAnchor([
      'Mercury Premier Dealer',
      'Family marina since 1947',
      'Mercury dealer since 1965',
    ])).toEqual(['Mercury Premier Dealer']);
  });

  it('keeps non-anchor items that follow the selected anchor', () => {
    expect(filterToOneBlogCredibilityAnchor([
      'Family marina since 1947',
      'Transparent itemized quotes',
      'Mercury Premier Dealer',
    ])).toEqual([
      'Family marina since 1947',
      'Transparent itemized quotes',
    ]);
  });

  it('drops an item that stacks multiple anchor classes', () => {
    expect(filterToOneBlogCredibilityAnchor([
      'Family-run since 1947 and a Mercury Premier Dealer',
      'Mercury dealer since 1965',
    ])).toEqual(['Mercury dealer since 1965']);
  });

  it('detects Chinese heritage terms across bilingual item text', () => {
    expect(classifyBlogCredibilityAnchors('Family-run shop / 三代家族经营')).toEqual(['heritage']);
    expect(classifyBlogCredibilityAnchors('1947 年至今，第三代经营，Premier 经销商')).toEqual([
      'heritage',
      'premier',
    ]);
  });

  it('supports structured items through a text selector', () => {
    const items = [
      { en: 'Mercury Premier Dealer', zh: 'Premier 认证经销商' },
      { en: 'Transparent pricing', zh: '透明报价' },
      { en: 'Family marina since 1947', zh: '自 1947 年家族经营' },
    ];
    expect(filterToOneBlogCredibilityAnchor(items, (item) => `${item.en} ${item.zh}`)).toEqual(items.slice(0, 2));
  });
});
