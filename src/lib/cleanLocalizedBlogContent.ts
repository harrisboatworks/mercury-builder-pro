const RELATED_LABELS: Record<string, string> = {
  ko: '관련 자료',
  zh: '相关阅读',
  es: 'Lecturas relacionadas',
  pa: 'ਸੰਬੰਧਿਤ ਗਾਈਡਾਂ',
  ur: 'متعلقہ رہنما',
  tl: 'Kaugnay na mga gabay',
  hi: 'संबंधित गाइड',
};

const FAQ_LABELS: Record<string, string[]> = {
  ko: ['자주 묻는 질문'],
  zh: ['常见问题'],
  es: ['Preguntas frecuentes'],
  pa: ['ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ'],
  ur: ['اکثر پوچھے جانے والے سوالات'],
  tl: ['Mga madalas itanong'],
  hi: ['अक्सर पूछे जाने वाले प्रश्न'],
};

const INTERNAL_LINK_LABELS = [
  'Internal Links',
  '내부 링크',
  '内部链接',
  'Enlaces internos',
  'ਅੰਦਰੂਨੀ ਲਿੰਕ',
  'اندرونی روابط',
  'Mga panloob na link',
  'आंतरिक लिंक',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Remove publishing scaffold while preserving the translated article copy. */
export function cleanLocalizedBlogContent(content: string, language: string, hasFaqs = false): string {
  let cleaned = String(content || '');
  cleaned = cleaned.replace(
    /^[*_\s]*(?:Language[*_\s:：]+English|Canonical URL\s*:[*_\s]*https?:\/\/\S+)[*_\s]*\r?\n(?:\s*---\s*\r?\n)?/gim,
    '',
  );
  cleaned = cleaned.replace(/^[*_\s]*\**\s*Last\s+(?:updated|reviewed)\b[^\n]*$/gim, '');
  cleaned = cleaned.replace(/^##\s+(?:CTA|Full Article)\s*$/gim, '');
  const internalLinks = new RegExp(`^(##\\s+)(?:${INTERNAL_LINK_LABELS.map(escapeRegExp).join('|')})\\s*$`, 'gim');
  cleaned = cleaned.replace(internalLinks, `$1${RELATED_LABELS[language] || 'Related reading'}`);

  if (hasFaqs) {
    const faqLabels = ['Frequently Asked Questions', 'FAQ', 'FAQs', 'Common Questions', ...(FAQ_LABELS[language] || [])];
    const faqHeading = new RegExp(
      `\\n##\\s+(?:${faqLabels.map(escapeRegExp).join('|')})\\s*[^\\n]*\\n[\\s\\S]*?(?=\\n##\\s|\\s*$)`,
      'gi',
    );
    cleaned = cleaned.replace(faqHeading, '\n');
  }

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}
