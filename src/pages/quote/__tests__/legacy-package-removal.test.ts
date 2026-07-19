import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('legacy quote package removal', () => {
  it('redirects the retired package-selection route to the summary', () => {
    const appSource = readFileSync('src/App.tsx', 'utf8');

    expect(appSource).toContain(
      '<Route path="/quote/package-selection" element={<Navigate to="/quote/summary" replace />} />',
    );
    expect(appSource).not.toContain('const PackageSelectionPage = lazy');
  });

  it('keeps package-tier controls out of the customer summary', () => {
    const summarySource = readFileSync('src/pages/quote/QuoteSummaryPage.tsx', 'utf8');
    const stickySource = readFileSync('src/components/quote-builder/StickySummary.tsx', 'utf8');

    expect(summarySource).not.toContain('Change Package');
    expect(summarySource).not.toContain("navigate('/quote/package-selection')");
    expect(stickySource).not.toContain('CoverageComparisonTooltip');
    expect(stickySource).not.toContain('Want more coverage?');
    expect(stickySource).toContain('Mercury coverage:');
  });

  it('removes legacy package names and merchandise bonuses from quote PDFs', () => {
    const pdfSource = readFileSync('src/components/quote-pdf/ProfessionalQuotePDF.tsx', 'utf8');

    expect(pdfSource).toContain('Mercury Coverage');
    expect(pdfSource).not.toContain('PACKAGE BONUS:');
    expect(pdfSource).not.toContain('FREE Mercury Hat + Shirt');
  });
});
