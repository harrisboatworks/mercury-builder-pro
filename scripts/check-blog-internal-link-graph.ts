import { blogArticles, isArticlePublished } from '../src/data/blogArticles';
import {
  blogClusters,
  getClusterForSlug,
  getRelatedSlugs,
} from '../src/data/blogClusters';
import { cleanBlogContent } from '../src/lib/cleanBlogContent.js';

const articles = blogArticles.filter(isArticlePublished);
const articleBySlug = new Map(articles.map((article) => [article.slug, article]));
const inbound = new Map(articles.map((article) => [article.slug, 0]));
const failures: string[] = [];
let spokeCount = 0;
let spokesLinkingPillar = 0;

function bodyLinks(content: string): Set<string> {
  return new Set(
    Array.from(content.matchAll(/(?:https:\/\/www\.mercuryrepower\.ca)?\/blog\/([a-z0-9-]+)/gi))
      .map((match) => match[1])
      .filter((slug) => articleBySlug.has(slug)),
  );
}

function stripAuthorFooter(content: string): string {
  return content
    .replace(/\n?-{3,}\s*\n+\s*\*?\*?By Jay Harris[\s\S]*$/i, '')
    .replace(/\n+\s*\*\*By Jay Harris\*\*[\s\S]*$/i, '')
    .replace(/\n+\s*By Jay Harris[\s\S]*$/i, '');
}

for (const article of articles) {
  const cluster = getClusterForSlug(article.slug);
  if (!cluster) {
    failures.push(`${article.slug}: not assigned to a cluster`);
    continue;
  }

  const cleanedContent = stripAuthorFooter(
    cleanBlogContent(article.content || '', {
      hasStructuredFaqs: Boolean(article.faqs?.length),
    }),
  );
  const linksInBody = bodyLinks(cleanedContent);
  // Match the static-prerender surface: ask for a larger candidate set, drop
  // links already present in the body, then render at most four related links.
  const renderedRelated = getRelatedSlugs(article.slug, 8)
    .filter((slug) => slug !== article.slug && !linksInBody.has(slug))
    .slice(0, 4);
  const outbound = new Set([...linksInBody, ...renderedRelated]);

  for (const target of outbound) {
    if (target !== article.slug) inbound.set(target, (inbound.get(target) || 0) + 1);
  }

  if (article.slug !== cluster.pillar) {
    spokeCount++;
    if (outbound.has(cluster.pillar)) spokesLinkingPillar++;
  }
}

for (const cluster of blogClusters) {
  if (!articleBySlug.has(cluster.pillar)) failures.push(`${cluster.name}: pillar route does not exist`);
  for (const slug of cluster.spokes) {
    if (!articleBySlug.has(slug)) failures.push(`${cluster.name}: spoke ${slug} does not exist`);
  }
}

const orphans = [...inbound].filter(([, count]) => count === 0).map(([slug]) => slug);
if (orphans.length) failures.push(`orphan routes: ${orphans.join(', ')}`);

const pillarLinkRate = spokeCount ? spokesLinkingPillar / spokeCount : 0;
if (pillarLinkRate < 0.8) {
  failures.push(
    `pillar-link rate ${(pillarLinkRate * 100).toFixed(1)}% is below the 80% floor`,
  );
}

if (failures.length) {
  console.error('Blog internal-link graph check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Blog internal-link graph passed: ${articles.length} routes, 0 orphans, ` +
    `${spokesLinkingPillar}/${spokeCount} spokes link their pillar ` +
    `(${(pillarLinkRate * 100).toFixed(1)}%).`,
);
