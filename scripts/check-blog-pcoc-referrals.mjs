#!/usr/bin/env node
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { cleanBlogContent } from '../src/lib/cleanBlogContent.js';

export const REFERRAL = 'https://myboatcard.com/card/harrisboat';
const mention = /\b(?:PCOC|CC[ÉE]P)\b|pleasure craft operators? (?:card|licen[cs]e)|boating licen[cs]e|boat operator'?s? licen[cs]e|carte de conducteur d['’]embarcation/i;
const publicText = value => typeof value === 'string' ? value : Array.isArray(value) ? value.map(publicText).join('\n') : value && typeof value === 'object' ? Object.values(value).map(publicText).join('\n') : '';
const stale = new Set([
  'marine-safety/operator-competency-requirements',
  'marine-safety/pleasure-craft-operator-competency',
  'marine-safety/pleasure-craft-operator-competency-program',
  'marine-safety/pleasure-craft-operator-card',
  'marine-safety/pleasure-craft-licences',
  'marine-safety/pleasure-craft-licensing-system',
  'marine-safety/pleasure-craft-licensing',
  'marine-personnel/pleasure-craft-licence',
  'marine-safety/transport-canada-boating-safety-guide-tp-511',
  'marine-safety/office-boating-safety/boating-safety-recreational-boaters',
  'preparing-operate-your-vessel/boating-safety/boating-safety-courses-across-canada',
  'preparing-operate-your-vessel/boating-safety/pleasure-craft-operator-card-pcoc',
].map(p => 'https://tc.canada.ca/en/marine-transportation/' + p));
stale.add('https://tc.canada.ca/sites/default/files/2026-07/tp-511-boating-guide-2026-en-acc.pdf');
const articleFiles = /^(?:blogArticles|archivedBlogArticles|(?:mandarin|traditionalChinese|korean|french|spanish|hindi|punjabi|tagalog|urdu)BlogArticles)\.ts$/;

// Read public copy statically; importing the modules would execute business
// helpers and fail on image imports. Include text around template expressions.
export function extractArticles(source, file = 'article.ts') {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const literal = n => ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ? n.text : ts.isTemplateExpression(n) ? n.head.text + n.templateSpans.map(s => s.literal.text).join('') : ts.isArrayLiteralExpression(n) ? n.elements.map(literal) : ts.isObjectLiteralExpression(n) ? Object.fromEntries(n.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText(ast).replace(/^["']|["']$/g, ''), literal(p.initializer)])) : undefined;
  const articles = [];
  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const a = literal(node);
      if (a.slug && ('content' in a)) {
        if (typeof a.content !== 'string') throw new Error(`${file}:${a.slug}: content cannot be checked statically`);
        articles.push(a);
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return articles;
}

export function articleIssues(article) {
  const issues = [];
  const visible = publicText([article.title, article.description, article.content, article.faqs, article.howToSteps, article.citations]);
  const triggered = mention.test(visible);
  if (triggered) {
    // The offer must survive FAQ/source-list cleanup: require a complete prose
    // paragraph, a clickable exact affiliate URL, the code and its percentage.
    const cleaned = cleanBlogContent(article.content, { hasStructuredFaqs: Boolean(article.faqs?.length) });
    const paragraphs = marked.lexer(cleaned).filter(token => token.type === 'paragraph');
    const hasOffer = paragraphs.some(p => isReferralParagraph(p.raw));
    if (!hasOffer) issues.push('PCOC reference needs a visible MyBoatCard referral paragraph with HARRIS15 and 15%');
  }
  const sourceCopy = publicText([article.content, article.faqs, article.howToSteps, article.officialSources, article.citations]);
  const urls = sourceCopy.match(/https?:\/\/(?:www\.)?tc\.canada\.ca\/[^\s\)\]<>"'`\\]+/g) || [];
  for (const u of new Set(urls)) if (stale.has(u.replace(/[।.,;]$/, '').replace(/\/$/, '').replace('https://www.tc.canada.ca/', 'https://tc.canada.ca/'))) issues.push(`Known broken Transport Canada link: ${u}`);
  return { triggered, issues };
}

export function isReferralParagraph(text) {
  const tokens = marked.lexer(text);
  const paragraph = tokens.find(t => t.type === 'paragraph');
  return Boolean(paragraph && tokens.every(t => t.type === 'paragraph' || t.type === 'space') && paragraph.tokens.some(t => t.type === 'link' && t.raw.startsWith('[') && [REFERRAL, REFERRAL + '/'].includes(t.href)) && /\bHARRIS15\b/.test(paragraph.text) && /15\s*%/.test(paragraph.text));
}

export function checkDirectory(directory) {
  const failures = [];
  let total = 0, pcoc = 0;
  for (const file of readdirSync(directory).filter(f => articleFiles.test(f))) {
    for (const article of extractArticles(readFileSync(resolve(directory, file), 'utf8'), file)) {
      total++;
      const result = articleIssues(article);
      if (result.triggered) pcoc++;
      failures.push(...result.issues.map(issue => `${file}:${article.slug}: ${issue}`));
    }
  }
  return { total, pcoc, failures };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../src/data/', import.meta.url));
  const result = checkDirectory(root);
  if (result.failures.length) {
    console.error(result.failures.join('\n'));
    process.exitCode = 1;
  } else console.log(`PCOC referral check passed: ${result.pcoc} articles with offers; ${result.total} articles checked; no known broken Transport Canada URLs.`);
}
