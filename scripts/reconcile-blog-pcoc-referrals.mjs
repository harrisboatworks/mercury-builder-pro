#!/usr/bin/env node
// Incremental editorial generator. Preserves current article copy, including
// corrections made since the one-shot Wave 1 import, and updates only the
// verified referral offer and known stale Transport Canada destinations.
import ts from 'typescript';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleIssues, isReferralParagraph } from './check-blog-pcoc-referrals.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const referral = 'https://myboatcard.com/card/harrisboat';
const pcoc = 'https://tc.canada.ca/en/marine-transportation/preparing-operate-your-vessel/pleasure-craft-operator-card-pcoc';
const pcl = 'https://tc.canada.ca/en/marine-transportation/vessel-licensing-registration/licensing-pleasure-craft/apply-manage-pleasure-craft-licence-pcl/apply-manage-pleasure-craft-licence-pcl';
const providers = 'https://tc.canada.ca/en/marine-transportation/buying-boat/find-education-resources-recreational-boaters';
const safety = 'https://tc.canada.ca/sites/default/files/2026-07/tp-511-boating-guide-2026-EN-acc.pdf';
const old = 'https://tc.canada.ca/en/marine-transportation/';
const replacements = new Map([
  [old + 'marine-safety/operator-competency-requirements', pcoc],
  [old + 'marine-safety/pleasure-craft-operator-competency-program', providers],
  [old + 'marine-safety/pleasure-craft-operator-competency', pcoc],
  [old + 'marine-safety/pleasure-craft-operator-card', pcoc],
  [old + 'marine-safety/pleasure-craft-licences', pcl],
  [old + 'marine-safety/pleasure-craft-licensing-system', pcl],
  [old + 'marine-personnel/pleasure-craft-licence', pcl],
  [old + 'marine-safety/pleasure-craft-licensing', pcl],
  [old + 'marine-safety/transport-canada-boating-safety-guide-tp-511', safety],
  [old + 'marine-safety/office-boating-safety/boating-safety-recreational-boaters', safety],
  [old + 'preparing-operate-your-vessel/boating-safety/boating-safety-courses-across-canada', providers],
  [old + 'preparing-operate-your-vessel/boating-safety/pleasure-craft-operator-card-pcoc', pcoc],
  ['https://tc.canada.ca/sites/default/files/2026-07/tp-511-boating-guide-2026-en-acc.pdf', safety],
]);
const offers = {
  en: `Need your PCOC? Take the online course through [HBW's MyBoatCard referral link](${referral}) and use **HARRIS15** for **15% off**.`,
  fr: `Besoin de votre CCEP (PCOC)? Suivez le cours en ligne avec [le lien de parrainage MyBoatCard de HBW](${referral}) et utilisez le code **HARRIS15** pour obtenir **15% de réduction**.`,
  zh: `需要考取 PCOC？通过 [HBW 的 MyBoatCard 推荐链接](${referral})参加在线课程，使用优惠码 **HARRIS15** 可享 **15% 折扣**。`,
  'zh-hant': `需要考取 PCOC？透過 [HBW 的 MyBoatCard 推薦連結](${referral})參加網上課程，使用優惠碼 **HARRIS15** 可享 **15% 折扣**。`,
  ko: `PCOC가 필요하신가요? [HBW의 MyBoatCard 추천 링크](${referral})에서 온라인 과정을 수강하고 할인 코드 **HARRIS15**로 **15% 할인**을 받으세요.`,
  es: `¿Necesita su PCOC? Haga el curso en línea con [el enlace de recomendación de HBW a MyBoatCard](${referral}) y use el código **HARRIS15** para obtener **15% de descuento**.`,
  hi: `PCOC चाहिए? [HBW के MyBoatCard रेफ़रल लिंक](${referral}) से ऑनलाइन कोर्स करें और **15% छूट** के लिए कोड **HARRIS15** इस्तेमाल करें।`,
  pa: `PCOC ਚਾਹੀਦਾ ਹੈ? [HBW ਦੇ MyBoatCard ਰੈਫ਼ਰਲ ਲਿੰਕ](${referral}) ਰਾਹੀਂ ਆਨਲਾਈਨ ਕੋਰਸ ਕਰੋ ਅਤੇ **15% ਛੋਟ** ਲਈ ਕੋਡ **HARRIS15** ਵਰਤੋ।`,
  ur: `PCOC چاہیے؟ [HBW کے MyBoatCard ریفرل لنک](${referral}) سے آن لائن کورس کریں اور **15% رعایت** کے لیے کوڈ **HARRIS15** استعمال کریں۔`,
  tl: `Kailangan ng PCOC? Kunin ang online course gamit ang [MyBoatCard referral link ng HBW](${referral}) at gamitin ang code na **HARRIS15** para sa **15% diskuwento**.`,
};
const locales = { blogArticles: 'en', archivedBlogArticles: 'en', frenchBlogArticles: 'fr', mandarinBlogArticles: 'zh', traditionalChineseBlogArticles: 'zh-hant', koreanBlogArticles: 'ko', spanishBlogArticles: 'es', hindiBlogArticles: 'hi', punjabiBlogArticles: 'pa', urduBlogArticles: 'ur', tagalogBlogArticles: 'tl' };
export function reconcileOfferContent(raw, offer) {
  // Recognize prior offers by their affiliate link/code/discount, so a revised
  // localized sentence replaces the old copy instead of leaving it behind.
  const paragraphs = raw.split('\n\n').filter(p => !isReferralParagraph(p));
  const firstProse = paragraphs.findIndex(p => !/^\s*#/.test(p) && !/^\s*\*?Last reviewed:/i.test(p));
  paragraphs.splice(firstProse < 0 ? paragraphs.length : firstProse + 1, 0, offer);
  return paragraphs.join('\n\n');
}

function reconcileArticles() {
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
let changed = 0;
for (const file of readdirSync(resolve(root, 'src/data')).filter(f => locales[f.replace(/\.ts$/, '')])) {
  const path = resolve(root, 'src/data', file), source = readFileSync(path, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const edits = [];
  const literal = n => ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ? n.text : ts.isTemplateExpression(n) ? n.head.text + n.templateSpans.map(s => s.literal.text).join('') : ts.isArrayLiteralExpression(n) ? n.elements.map(literal) : ts.isObjectLiteralExpression(n) ? Object.fromEntries(n.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText(ast).replace(/^["']|["']$/g, ''), literal(p.initializer)])) : undefined;
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const article = literal(node);
      if (article.slug && article.content) {
        const block = source.slice(node.getStart(ast), node.end);
        let next = block;
        // Exact URL boundaries avoid replacing prefixes or manufacturing PDFs.
        for (const [before, after] of replacements) next = next.replaceAll(new RegExp(before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[\\s)\\]<>"\x27`।]|$)', 'g'), after);
        const { triggered: mentions, issues } = articleIssues(article);
        const offerText = offers[locales[file.replace(/\.ts$/, '')]];
        const generatedOffer = article.content.split('\n\n').some(isReferralParagraph);
        if (generatedOffer || (mentions && issues.some(issue => issue.startsWith('PCOC reference')))) {
          const prop = node.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(ast) === 'content');
          if (!prop || !(ts.isNoSubstitutionTemplateLiteral(prop.initializer) || ts.isTemplateExpression(prop.initializer))) throw new Error(`Cannot safely update content: ${file}:${article.slug}`);
          const contentStart = prop.initializer.getStart(ast) + 1 - node.getStart(ast);
          // Place the offer after the quick answer/intro, before tables, FAQs
          // or source lists which some renderers remove or collapse.
          const contentEnd = prop.initializer.end - 1 - node.getStart(ast);
          const raw = reconcileOfferContent(block.slice(contentStart, contentEnd), offerText);
          // URL substitutions can alter positions before content, so insert
          // into the original block first, then perform the substitutions.
          next = block.slice(0, contentStart) + raw + block.slice(contentEnd);
          for (const [before, after] of replacements) next = next.replaceAll(new RegExp(before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[\\s)\\]<>"\x27`।]|$)', 'g'), after);
        }
        if (next !== block) {
          next = next.replace(/dateModified:\s*(['"])\d{4}-\d{2}-\d{2}\1/, `dateModified: '${today}'`);
          edits.push({ start: node.getStart(ast), end: node.end, text: next });
          changed++; console.log(`${file}: ${article.slug}`);
        }
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  let output = source;
  for (const e of edits.sort((a,b) => b.start - a.start)) output = output.slice(0,e.start) + e.text + output.slice(e.end);
  if (output !== source) writeFileSync(path, output);
}
console.log(`Reconciled ${changed} articles. Source: HBW rentals referral offer and Transport Canada pages verified 2026-10-04.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) reconcileArticles();
