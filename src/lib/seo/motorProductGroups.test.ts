// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildMotorProductGroup } from '@/data/motorProductGroups.js';
import { buildMotorProductSchema } from './buildMotorProductSchema';

const prerender = readFileSync('scripts/static-prerender.mjs', 'utf8');
const schemaFunction = prerender.slice(
  prerender.indexOf('function motorPageSchema('),
  prerender.indexOf('\nfunction mercury99MhSaleNoscript('),
);
// Execute the real static schema builder without running live inventory fetches.
const staticSchema = new Function(
  'SITE_URL', 'buildMotorProductGroup', 'detectMotorFamily', 'resolveMotorSellingPrice',
  'isMercury99MhSale', 'isVerifiedMotorImage',
  `${schemaFunction}; return motorPageSchema;`,
)(
  'https://www.mercuryrepower.ca', buildMotorProductGroup,
  (motor: { family: string }) => motor.family,
  () => 5999, () => false, () => false,
);

function runGuard(schema: object) {
  const dist = mkdtempSync(join(tmpdir(), 'motor-group-schema-'));
  try {
    writeFileSync(join(dist, 'index.html'),
      `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    return spawnSync(process.execPath, ['scripts/check-structured-data.mjs'], {
      encoding: 'utf8', env: { ...process.env, SCHEMA_DIST: dist },
    });
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
}

describe('motor ProductGroup definitions', () => {
  it.each([
    ['FourStroke', '60 ELPT Command Thrust FourStroke', 'mercury-fourstroke-outboards', 'Mercury FourStroke Outboards'],
    ['Four Stroke', '2.5 MH', 'mercury-fourstroke-outboards', 'Mercury FourStroke Outboards'],
    ['ProXS', '200 ELPT ProXS DTS', 'mercury-pro-xs-outboards', 'Mercury Pro XS Outboards'],
    ['Pro XS', '150 EXLPT ProXS', 'mercury-pro-xs-outboards', 'Mercury Pro XS Outboards'],
    ['Sea Pro', 'SeaPro 150', 'mercury-seapro-outboards', 'Mercury SeaPro Outboards'],
    ['ProKicker', '9.9 ProKicker', 'mercury-prokicker-outboards', 'Mercury ProKicker Outboards'],
    ['FourStroke', '9.9 Pro Kicker', 'mercury-prokicker-outboards', 'Mercury ProKicker Outboards'],
  ])('keeps %s %s complete and identical in static and hydrated schema', (family, name, id, groupName) => {
    const product = buildMotorProductSchema({ family, name, url: 'https://www.mercuryrepower.ca/motors/example' });
    const graph = staticSchema({ family, model_display: name, horsepower: 60 }, 'example');
    expect(product.isVariantOf).toEqual(graph['@graph'][0].isVariantOf);
    expect(product.isVariantOf).toMatchObject({ '@type': 'ProductGroup', productGroupID: id, name: groupName });
    expect((product.isVariantOf as { description: string }).description).toContain('no shipping');
  });

  it.each(['Verado', 'Racing', undefined])('omits unsupported family %s', (family) => {
    const product = buildMotorProductSchema({ family, name: 'Example', url: 'https://www.mercuryrepower.ca/motors/example' });
    expect(product).not.toHaveProperty('isVariantOf');
  });

  it('rejects the exact nameless inline group from the Search Console alert', () => {
    const result = runGuard({ '@type': 'Product', name: '60 ELPT', isVariantOf: {
      '@type': 'ProductGroup', productGroupID: 'mercury-fourstroke-outboards',
    } });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('ProductGroup missing required field "name"');
  });

  it('accepts a complete inline group and a resolved ID-only reference', () => {
    const group = { ...buildMotorProductGroup('FourStroke'), '@id': '#family' };
    const result = runGuard({ '@graph': [group,
      { '@type': 'Product', name: '60 ELPT', isVariantOf: { '@id': '#family' } },
      { '@type': 'Product', name: '25 ELPT', isVariantOf: group },
    ] });
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });
});
