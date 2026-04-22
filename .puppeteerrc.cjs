/**
 * Puppeteer config — pin Chromium cache inside the repo so Vercel's build
 * cache persists the downloaded browser across deploys. Without this, the
 * cache lands in $HOME/.cache/puppeteer which Vercel does NOT preserve, and
 * every build re-downloads (~170 MB).
 */
const { join } = require('path');

module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
