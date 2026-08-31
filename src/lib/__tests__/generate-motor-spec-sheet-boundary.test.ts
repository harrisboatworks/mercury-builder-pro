import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('supabase/functions/generate-motor-spec-sheet/index.ts', 'utf8');

describe('generate-motor-spec-sheet public response boundary', () => {
  it('queries only the public fields needed to render the sheet', () => {
    expect(source).toContain("typeof motorId !== 'string' || !UUID_PATTERN.test(motorId)");
    expect(source).toContain(
      ".select('model, year, horsepower, msrp, specifications')",
    );
    expect(source).toContain(
      ".select('name, bonus_description, description')",
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
    expect(source).toContain("escapeHtml(promo.bonus_description || promo.description || '')");
    expect(source).not.toContain('<strong>${promo.name}</strong>');
  });
});
