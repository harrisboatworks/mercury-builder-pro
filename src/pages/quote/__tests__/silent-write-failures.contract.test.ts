import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

function sliceBetween(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  expect(from).toBeGreaterThan(-1);
  expect(to).toBeGreaterThan(from);
  return source.slice(from, to);
}

describe('silent write failure contracts', () => {
  it('does not call the never-created increment_contact_attempts RPC', () => {
    const source = read('src/components/admin/ContactLog.tsx');
    expect(source).not.toContain("rpc('increment_contact_attempts'");
    expect(source).toContain('quote_contact_log');
  });

  it('does not call the never-created get_table_schema RPC', () => {
    const source = read('src/components/admin/SecurityDashboard.tsx');
    expect(source).not.toContain("rpc('get_table_schema'");
    expect(source).not.toContain('rls-status');
  });

  it('checks the profiles theme upsert error before claiming Theme updated', () => {
    const themeFn = sliceBetween(
      read('src/pages/Settings.tsx'),
      'const handleThemeChange',
      'const isGoogleUser',
    );
    expect(themeFn).toContain('if (error)');
    expect(themeFn).toContain('Could not save theme');
    expect(themeFn).not.toMatch(/\.then\(\(\) => \{/);
  });

  it('throws when an admin_sources upsert fails during file capture', () => {
    const fileUpload = sliceBetween(
      read('src/pages/AdminConnectors.tsx'),
      'const handleFileUpload',
      'const handleUrlFetch',
    );
    expect(fileUpload).toContain('if (sourceError) throw sourceError');
    expect(fileUpload).toContain("title: \"Files Uploaded\"");
  });

  it('does not toast Promotion Extended unless updatePromotion returned true', () => {
    const extendFn = sliceBetween(
      read('src/pages/AdminPromotions.tsx'),
      'const extendPromotion',
      'const renewPromotion',
    );
    expect(extendFn).toContain('if (!saved) return');
    expect(extendFn).toContain("title: 'Promotion Extended'");
  });

  it('throws when a pending motor match review write fails', () => {
    const reviewFn = sliceBetween(
      read('src/components/admin/MotorMatchReview.tsx'),
      'const handleMatchSelection',
      'Review Motor Matches',
    );
    expect(reviewFn).toContain('if (reviewError) throw reviewError');
    expect(reviewFn).toContain('if (motorError) throw motorError');
  });

  it('writes motor_media.media_category, not a nonexistent category column', () => {
    const fixer = read('src/components/admin/media/MediaCategoryFixer.tsx');
    expect(fixer).toContain(".update({ media_category: 'specs' })");
    expect(fixer).toContain(".eq('media_category', 'gallery')");
    expect(fixer).not.toContain(".update({ category: 'specs' })");
    expect(fixer).not.toContain(".eq('category', 'gallery')");
  });

  it('does not toast Upload complete when zero files persisted', () => {
    const uploadFn = sliceBetween(
      read('src/components/admin/QuickMediaUpload.tsx'),
      'const handleUpload = async',
      'return (',
    );
    expect(uploadFn).toContain('if (successCount === 0)');
    expect(uploadFn).toContain('title: "Upload failed"');
  });

  it('toasts when clearing a follow-up reminder write fails', () => {
    const clearFn = sliceBetween(
      read('src/components/admin/FollowUpReminder.tsx'),
      'const handleClear',
      'const isOverdue',
    );
    expect(clearFn).toContain('Failed to clear reminder');
    expect(clearFn).toContain("variant: 'destructive'");
  });

  it('surfaces motor option assignment update failures', () => {
    const updateMut = sliceBetween(
      read('src/components/admin/options/MotorOptionsManager.tsx'),
      'const updateMutation',
      'const selectedMotor',
    );
    expect(updateMut).toContain('onError:');
    expect(updateMut).toContain('Failed to update option');
  });

  it('surfaces quote_change_log insert failure after an admin quote save', () => {
    const saveChanges = sliceBetween(
      read('src/pages/AdminQuoteDetail.tsx'),
      'const handleSaveChanges',
      'const getStatusBadge',
    );
    expect(saveChanges).toContain('changeLogError');
    expect(saveChanges).toContain("title: 'Change log not saved'");
  });

  it('surfaces quote_change_log insert failure from AdminQuoteControls', () => {
    const controls = read('src/components/admin/AdminQuoteControls.tsx');
    expect(controls).toContain('changeLogError');
    expect(controls).toContain("title: 'Change log not saved'");
  });

  it('toasts from the auto-save catch instead of swallowing it', () => {
    const hook = read('src/hooks/useAutoSaveQuoteOnAuth.ts');
    const catchBlock = hook.slice(hook.lastIndexOf('} catch (err)'));
    expect(catchBlock).toContain("title: 'Could not save quote'");
    expect(catchBlock).toContain("variant: 'destructive'");
  });
});

