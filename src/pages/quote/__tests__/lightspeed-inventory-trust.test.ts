import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('quote-builder Lightspeed inventory trust boundary', () => {
  const motorSelection = read('src/components/quote-builder/MotorSelection.tsx');
  const motorSelectionPage = read('src/pages/quote/MotorSelectionPage.tsx');

  it('does not invoke inventory sync from an ordinary quote-builder visit', () => {
    expect(motorSelection).not.toContain("functions.invoke('sync-lightspeed-inventory')");
    expect(motorSelection).not.toContain('sync-lightspeed-inventory');
    expect(motorSelectionPage).not.toContain('sync-lightspeed-inventory');
  });

  it('removes mount, hourly, and query-string public sync triggers', () => {
    expect(motorSelection).not.toContain('lastInventoryUpdate');
    expect(motorSelection).not.toContain('needsInventoryUpdate');
    expect(motorSelection).not.toContain('updateInventory');
    expect(motorSelection).not.toContain('runScrape');
    expect(motorSelection).not.toContain('60 * 60 * 1000');
    expect(motorSelectionPage).not.toContain('runScrape');
  });

  it('still loads catalog data without triggering a sync', () => {
    expect(motorSelection).toContain('loadMotors()');
    expect(motorSelection).toMatch(/useEffect\(\(\) => \{[\s\S]*loadMotors\(\);/);
  });
});
