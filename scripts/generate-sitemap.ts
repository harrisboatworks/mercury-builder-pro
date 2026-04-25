/**
 * Build-time script to generate sitemap.xml
 *
 * Includes static pages, all published blog articles, AND
 * every active motor model (so /motors/{slug} pages are crawlable).
 *
 * Run automatically before vite build, or manually via:
 *   npx tsx scripts/generate-sitemap.ts
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

async function generateSitemap() {
  try {
    const { generateFullSitemapXML } = await import('../src/utils/generateSitemap');
    const sitemap = await generateFullSitemapXML();

    const outputPath = resolve(__dirname, '../public/sitemap.xml');
    const outputDir = dirname(outputPath);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, sitemap);

    const urlCount = (sitemap.match(/<url>/g) || []).length;
    console.log(`✓ Sitemap generated with ${urlCount} URLs → public/sitemap.xml`);

    return sitemap;
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    throw error;
  }
}

generateSitemap();

export { generateSitemap };
