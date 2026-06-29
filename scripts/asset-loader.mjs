// Node ESM loader hook used by scripts/generate-sitemap.ts so that
// importing modules which pull in binary assets (.png/.jpg/.webp/etc.) via
// Vite-style ES6 imports doesn't crash the sitemap generator under plain Node.
// Vite handles these at dev/build time; under tsx + Node we stub them to a
// string URL matching the file path.

const ASSET_EXT_RX = /\.(png|jpe?g|webp|gif|svg|avif|ico|bmp|tiff?|mp4|webm|mov|mp3|wav|ogg|woff2?|ttf|otf|pdf)(\?.*)?$/i;

export async function resolve(specifier, context, nextResolve) {
  if (ASSET_EXT_RX.test(specifier)) {
    const resolved = await nextResolve(specifier, context).catch(() => null);
    return {
      url: resolved?.url ?? new URL(specifier, context.parentURL ?? 'file:///').href,
      shortCircuit: true,
      format: 'asset-stub',
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (context.format === 'asset-stub' || ASSET_EXT_RX.test(url)) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)};`,
    };
  }
  return nextLoad(url, context);
}
