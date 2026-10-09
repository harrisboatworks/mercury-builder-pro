import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FROM_MONTHLY_PAYMENT_PATTERN,
  PROMO_FINANCING_LINE_PATTERN,
  collectFromPayments,
  findPromoFinancingLine,
  requireFromPayments,
  requirePromoFinancingLine,
} from './promo-quote-live-check.mjs';

const compactLine = '$311/mo · 24 mo · 2.99% OAC';
const summaryText = [
  'Mercury Rebate + 2.99% APR',
  'Factory rebate applied',
  `From ${compactLine}`,
  'Apply for Financing →',
  `From ${compactLine} · You save $400`,
].join('\n');

test('accepts the compact #674 teaser and nearby wording variants', () => {
  for (const line of [
    compactLine,
    'From $311/mo · 24-mo · 2.99% APR',
    'From $311/month · 24 months · 2.99% OAC',
    '2.99% APR · 24 months',
    '2.99% for 24 months (OAC)',
    '24-month promotional financing at 2.99% APR',
  ]) {
    assert.match(line, PROMO_FINANCING_LINE_PATTERN, line);
    assert.ok(findPromoFinancingLine(line), line);
  }
});

test('requires 2.99% and 24 mo on the same financing line', () => {
  assert.equal(requirePromoFinancingLine(summaryText).includes('2.99%'), true);
  assert.equal(
    findPromoFinancingLine('Mercury Rebate + 2.99% APR\nFrom $200/mo · 60 mo · 5.48% OAC'),
    null,
  );
  assert.equal(findPromoFinancingLine('$311/mo · 60 mo · 2.99% OAC'), null);
  assert.equal(findPromoFinancingLine('$311/mo · 24 mo · 5.48% OAC'), null);
  assert.equal(findPromoFinancingLine('$311/mo · 24 mo · 3.99% OAC'), null);
  assert.throws(
    () => requirePromoFinancingLine('Cash purchase selected\nMercury Rebate −$400'),
    /Missing promotional financing line with 2\.99% and 24 mo/,
  );
});

test('reads From $/mo and From $/month payments from both quote surfaces', () => {
  assert.match('From $311/mo · 24 mo · 2.99% OAC', FROM_MONTHLY_PAYMENT_PATTERN);
  assert.match('From $1,234/month', FROM_MONTHLY_PAYMENT_PATTERN);
  assert.deepEqual(collectFromPayments(summaryText), [311, 311]);
  assert.equal(requireFromPayments(summaryText), 311);
  assert.throws(
    () => requireFromPayments('From $311/mo'),
    /Expected at least 2 From/,
  );
  assert.throws(
    () => requireFromPayments('From $311/mo\nFrom $400/mo'),
    /Payment mismatch/,
  );
});
