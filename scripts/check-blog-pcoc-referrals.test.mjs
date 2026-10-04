import test from 'node:test';
import assert from 'node:assert/strict';
import { articleIssues, extractArticles } from './check-blog-pcoc-referrals.mjs';
const offer = "Need your PCOC? Use [HBW's MyBoatCard referral link](https://myboatcard.com/card/harrisboat) and **HARRIS15** for **15% off**.";
const article = content => ({ slug: 'guide', title: 'Boat guide', content });

test('requires a working affiliate link, exact code and adjacent percentage', () => {
  assert.deepEqual(articleIssues(article(offer)).issues, []);
  for (const text of [offer.replace('HARRIS15', 'OTHER15'), offer.replace('harrisboat)', 'someoneelse)'), offer.replace("[HBW's MyBoatCard referral link](https://myboatcard.com/card/harrisboat)", 'https://myboatcard.com/card/harrisboat'), offer.replace('15% off', 'a discount'), offer.replace('and **HARRIS15** for **15% off**.', '\n\nHARRIS15 for 15% off.')]) assert.equal(articleIssues(article(text)).issues.length, 1);
});
test('catches FAQ, HowTo, title, description and French-only references', () => {
  for (const extra of [{ faqs: [{ question: 'Do I need a PCOC?', answer: 'Yes.' }] }, { howToSteps: [{ name: 'Before launch', text: 'Bring a Pleasure Craft Operator Card.' }] }, { title: 'CCÉP en Ontario' }, { description: 'Get your boating licence.' }]) {
    assert.equal(articleIssues({ ...article('Ordinary prose.'), ...extra }).issues.length, 1);
    assert.deepEqual(articleIssues({ ...article(offer), ...extra }).issues, []);
  }
});
test('checks literal text in interpolated content without executing imports', () => {
  const source = 'import image from "@/assets/test.png"; export const a = [{ slug: "x", content: `Intro ${languageNote}\n\nPCOC card` }];';
  assert.equal(articleIssues(extractArticles(source)[0]).issues.length, 1);
});
test('PCL, fishing licences and related slugs do not create operator-card requirements', () => {
  const a = { ...article('Update your Pleasure Craft Licence (PCL) and fishing licence.'), relatedSlugs: ['pcoc-guide'], image: '/pcoc.png' };
  assert.equal(articleIssues(a).triggered, false);
  assert.deepEqual(articleIssues(a).issues, []);
});
test('known broken official links fail even in sources; working citations stay', () => {
  const a = { ...article('Fishing guide.'), officialSources: ['https://tc.canada.ca/en/marine-transportation/marine-safety/pleasure-craft-licences'] };
  assert.equal(articleIssues(a).issues.length, 1);
  a.officialSources = ['https://tc.canada.ca/en/marine-transportation/preparing-operate-your-vessel/pleasure-craft-operator-card-pcoc'];
  assert.deepEqual(articleIssues(a).issues, []);
});
test('code blocks and removed FAQ copy cannot satisfy the visible-offer rule', () => {
  assert.equal(articleIssues(article('PCOC guide.\n\n```md\n\n' + offer + '\n\n```')).issues.length, 1);
  assert.equal(articleIssues({ ...article('PCOC guide.\n\n## Frequently Asked Questions\n\n' + offer), faqs: [{ question: 'Do I need a PCOC?', answer: 'Yes.' }] }).issues.length, 1);
});
