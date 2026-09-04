// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import viteConfig from '../../../vite.config';

describe('Vite 8 config compatibility', () => {
  it('preserves the browser floor previously supplied by Vite 5', async () => {
    expect(typeof viteConfig).toBe('function');

    const config = await viteConfig({
      command: 'build',
      mode: 'production',
      isSsrBuild: false,
      isPreview: false,
    });

    expect(config.build?.target).toEqual([
      'es2020',
      'edge88',
      'firefox78',
      'chrome87',
      'safari14',
    ]);
  });

  it('keeps RSS generation in the pre-Vite build script', async () => {
    const packageJson = JSON.parse(
      await readFile(new URL('../../../package.json', import.meta.url), 'utf8'),
    ) as { scripts: { build: string } };

    expect(packageJson.scripts.build).toContain(
      'node scripts/generate-rss.mjs',
    );

    const config = await viteConfig({
      command: 'build',
      mode: 'production',
      isSsrBuild: false,
      isPreview: false,
    });
    const pluginNames = config.plugins
      ?.flat()
      .filter((plugin) => plugin && typeof plugin === 'object' && 'name' in plugin)
      .map((plugin) => plugin.name);

    expect(pluginNames).not.toContain('generate-rss');
  });
});
