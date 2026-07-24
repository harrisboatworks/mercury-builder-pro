export function isDiagnosticArticle(category = '', slug = ''): boolean {
  const cat = category.toLowerCase();
  const s = slug.toLowerCase();

  return (
    cat.includes('troubleshoot') ||
    /(?:alarm|beep|fault-code|wont-start|won't-start|overheat|electrical|impeller|gearcase-oil|diagnostic)/.test(s)
  );
}
