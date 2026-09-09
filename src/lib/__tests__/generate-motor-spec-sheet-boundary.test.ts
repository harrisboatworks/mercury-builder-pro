import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('supabase/functions/generate-motor-spec-sheet/index.ts', 'utf8');
const client = readFileSync('src/lib/react-pdf-generator.tsx', 'utf8');
const config = readFileSync('supabase/config.toml', 'utf8');

describe('generate-motor-spec-sheet public response boundary', () => {
  it('queries only the public fields needed to render the sheet', () => {
    expect(source).toContain("typeof motorId !== 'string' || !UUID_PATTERN.test(motorId)");
    expect(source).toContain(
      ".select('model, year, horsepower, msrp, specifications')",
    );
    expect(source).toContain(
      ".select('name, bonus_description')",
    );
    expect(source).not.toContain(".select('*')");
    expect(source).not.toContain('motor.dealer_price');
    expect(source).not.toContain('motor.model_year');
    expect(source).not.toContain("details: (error instanceof Error");
  });

  it('does not return raw service-role rows to the caller', () => {
    const responseMarker = source.indexOf('motorModel:');
    const responseStart = source.lastIndexOf('JSON.stringify({', responseMarker);
    const responseEnd = source.indexOf('}),', responseMarker);
    const responseBody = source.slice(responseStart, responseEnd);

    expect(responseBody).toContain('motorModel:');
    expect(responseBody).toContain('htmlContent,');
    expect(responseBody).not.toMatch(/\bmotor\s*,/);
    expect(responseBody).not.toMatch(/\bpromotions\s*:/);
  });

  it('escapes every database text field interpolated into returned HTML', () => {
    expect(source).toContain('function escapeHtml(value: unknown)');
    expect(source).toContain("escapeHtml(motor.model || 'Motor')");
    expect(source).toContain('escapeHtml(motor.year || 2026)');
    expect(source).toContain("escapeHtml(specs['Engine Type'] || 'FourStroke')");
    expect(source).toContain('escapeHtml(promo.name)');
    expect(source).toContain("escapeHtml(promo.bonus_description || '')");
    expect(source).not.toContain('<strong>${promo.name}</strong>');
  });

  it('accepts { motorId } and returns { motorModel, htmlContent }', () => {
    expect(source).toContain('const { motorId } = await req.json()');
    expect(source).toContain('motorModel: motor.model || \'Motor Specifications\'');
    expect(source).toContain('htmlContent,');
    expect(source).not.toContain('quoteData');
    expect(source).not.toContain("format: 'pdf'");
    expect(source).not.toMatch(/\bresult\.html\b/);
  });

  it('gates browser callers on the shared origin allowlist, not requireAdmin or *', () => {
    expect(source).toContain('from "../_shared/origin-check.ts"');
    expect(source).toContain('isAllowedOrigin(req)');
    expect(source).toContain('forbiddenOriginResponse(corsHeaders)');
    expect(source).not.toContain('requireAdmin');
    expect(source).not.toContain("'Access-Control-Allow-Origin': '*'");
    expect(source).not.toContain('"Access-Control-Allow-Origin": "*"');
    expect(config).toMatch(/\[functions\.generate-motor-spec-sheet\]\s*\nverify_jwt = false/);
  });

  it('removes the unreachable quote-pdf client that posted the stale contract', () => {
    expect(client).not.toContain('generateMotorSpecSheet');
    expect(client).not.toContain('generate-motor-spec-sheet');
    expect(client).not.toContain('quoteData: data');
    expect(client).not.toContain("format: 'pdf'");
    expect(client).not.toContain('result.html');
  });
});
