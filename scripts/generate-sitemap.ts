/**
 * Build-time script to generate sitemap.xml
 * 
 * This script is called during the Vite build process to generate
 * a dynamic sitemap that includes all published blog articles.
 * 
 * Run manually: npx ts-node scripts/generate-sitemap.ts
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

// Dynamic import for the sitemap generator
async function generateSitemap() {
  try {
    const { generateSitemapXML } = await import('../src/utils/generateSitemap');
    const sitemap = generateSitemapXML();
    
    const outputPath = resolve(__dirname, '../public/sitemap.xml');
    const outputDir = dirname(outputPath);
    
    // Ensure public directory exists
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

// Run if called directly
generateSitemap();

export { generateSitemap };
