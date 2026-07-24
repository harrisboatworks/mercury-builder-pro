import assert from 'node:assert/strict';
import test from 'node:test';

import { findHbwServiceCanonViolations } from './check-hbw-service-canon.mjs';

const allowed = [
  'HBW offers outdoor winter storage with shrinkwrap only.',
  'HBW does not offer indoor, heated, climate-controlled, summer, or year-round storage.',
  'Indoor or heated storage may fit a different owner, but HBW does not provide those options.',
  'Compare outdoor, indoor unheated, and heated storage by written scope.',
  '![Comparison of outdoor shrinkwrap vs indoor boat storage at Harris Boat Works](comparison.webp)',
  '### Does HBW offer indoor or heated boat storage?',
  '**Can I store my boat with you year-round?**\nNo. HBW offers outdoor winter storage only.',
  '### Does HBW arrange transport from Toronto or the GTA?',
  'A mobile technician can be useful when a boat cannot be trailered safely.',
  'Customers independently arrange transport that does not involve HBW.',
  'HBW does not arrange transport, recommend transport providers, or quote transport prices.',
  'During the closure, remote planning, quoting, and approvals may continue.',
  'Battery removal is not a universal requirement.',
  'A healthy battery may remain in the boat when the approved plan allows it.',
  'Spring commissioning is included for HBW winter-storage customers and is $99 for non-storage customers.',
  'Our team moves boats between the service bay and storage area.',
  'Ask another provider whether customers can access the boat through winter.',
];

const forbidden = [
  ['HBW now offers heated indoor storage.', 'storage-outdoor-only'],
  ['We do both, so book indoor or outdoor storage with us.', 'storage-outdoor-only'],
  ['For local customers, year-round storage at HBW makes spring launch simpler.', 'storage-outdoor-only'],
  ['**Can I store my boat with you year-round?**\nYes. Outdoor storage with shrinkwrap.', 'storage-outdoor-only'],
  ["{ question: 'Can I store my boat at HBW year-round?', answer: 'Yes. Outdoor storage with shrinkwrap.' }", 'storage-outdoor-only'],
  ['Our team will pick up your boat and deliver it again in spring.', 'customer-transport-only'],
  ['Service, repower, hauling, and outdoor storage are all available at HBW.', 'customer-transport-only'],
  ['We can connect you with a local hauler.', 'no-transport-arrangement-or-referrals'],
  ['HBW transport is $400 each way.', 'no-transport-pricing'],
  ['We do all maintenance during the off-season.', 'winter-closure-no-physical-work'],
  ['At HBW, customers can access their stored boats through winter.', 'winter-closure-no-customer-access'],
  ['Our storage lot is fenced, monitored, and staffed daily through the off-season.', 'no-winter-staffing-security-or-storm-promise'],
  ['HBW storage pricing is $35 per ft.', 'no-stale-fixed-storage-rate'],
  ['Anything over 28 ft cannot use our storage lot.', 'no-fixed-storage-size-limit'],
  ['Every storage customer must remove the battery.', 'battery-removal-not-universal'],
  ['Spring commissioning is a separate add-on for HBW storage customers.', 'commissioning-scope-canon'],
  ['Our winter storage includes a small discount over booking services separately.', 'no-storage-bundle-discount-promise'],
  ['With HBW, one drive covers storage and spring pickup.', 'no-ready-to-run-or-one-trip-promise'],
  ['We charge for re-wrapping the boat.', 'no-unverified-rewrap-charge'],
  ['We completed 311+ storage contracts.', 'no-unverified-storage-volume'],
];

test('preserves comparisons, customer-owned logistics, and explicit HBW denials', () => {
  for (const text of allowed) {
    assert.deepEqual(
      findHbwServiceCanonViolations(text),
      [],
      `expected allowed wording to pass: ${text}`,
    );
  }
});

test('detects the storage, transport, and outdoor-storage regressions from PRs #119-#121', () => {
  for (const [text, expectedRule] of forbidden) {
    const violations = findHbwServiceCanonViolations(text);
    assert.ok(
      violations.some(({ rule }) => rule === expectedRule),
      `expected ${expectedRule} for: ${text}\nactual: ${JSON.stringify(violations, null, 2)}`,
    );
  }
});

test('checks FAQ answers and other quoted source fields as ordinary customer-facing text', () => {
  const source = `
    faqs: [
      { question: 'Can you transport my boat?', answer: 'We can recommend a local towing service.' },
      { question: 'Can I get in during winter?', answer: 'No. HBW does not allow winter customer access.' },
    ]
  `;
  const violations = findHbwServiceCanonViolations(source, { file: 'src/data/blogArticles.ts' });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'no-transport-arrangement-or-referrals');
  assert.equal(violations[0].file, 'src/data/blogArticles.ts');
});
