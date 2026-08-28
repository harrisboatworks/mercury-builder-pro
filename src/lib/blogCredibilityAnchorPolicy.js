export const BLOG_CREDIBILITY_ANCHOR_CLASSES = Object.freeze({
  heritage: /\b1947\b|third[- ]generation|three generations|第三代|三代/i,
  tenure: /\b1965\b/i,
  premier: /\bpremier\b/i,
});

export function classifyBlogCredibilityAnchors(value) {
  const text = String(value || '');
  return Object.entries(BLOG_CREDIBILITY_ANCHOR_CLASSES)
    .filter(([, pattern]) => pattern.test(text))
    .map(([anchorClass]) => anchorClass);
}

export function filterToOneBlogCredibilityAnchor(items, textSelector = (item) => item) {
  let anchorUsed = false;

  return items.filter((item) => {
    const anchorClasses = classifyBlogCredibilityAnchors(textSelector(item));
    if (anchorClasses.length === 0) return true;
    if (anchorClasses.length > 1 || anchorUsed) return false;
    anchorUsed = true;
    return true;
  });
}
