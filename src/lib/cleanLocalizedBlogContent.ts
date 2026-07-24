const RELATED_LABELS: Record<string, string> = {
  en: 'Related reading',
  fr: 'Lectures connexes',
  ko: '관련 자료',
  zh: '相关阅读',
  'zh-Hant': '相關閱讀',
  es: 'Lecturas relacionadas',
  pa: 'ਸੰਬੰਧਿਤ ਗਾਈਡਾਂ',
  ur: 'متعلقہ رہنما',
  tl: 'Kaugnay na mga gabay',
  hi: 'संबंधित गाइड',
};

const FAQ_LABELS: Record<string, string[]> = {
  fr: ['Questions fréquentes'],
  ko: ['자주 묻는 질문'],
  zh: ['常见问题'],
  'zh-Hant': ['常見問題', '常见问题'],
  es: ['Preguntas frecuentes'],
  pa: ['ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ', 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ', 'Aksar puchhe jaande sawaal'],
  ur: ['اکثر پوچھے جانے والے سوالات', 'اکثر پوچھے گئے سوالات', 'کشتی کی ونٹرائزیشن اور اسٹوریج کے بارے میں عام سوالات'],
  tl: ['Mga madalas itanong', 'Mga karaniwang tanong'],
  hi: ['अक्सर पूछे जाने वाले प्रश्न'],
};

const INTERNAL_LINK_LABELS = [
  'Internal Links',
  'Liens internes',
  '내부 링크',
  '内部链接',
  '內部連結',
  'Enlaces internos',
  'ਅੰਦਰੂਨੀ ਲਿੰਕ',
  'اندرونی روابط',
  'Mga panloob na link',
  'आंतरिक लिंक',
];

const AUTHORING_HEADING_LABELS = [
  'Full Article',
  'Article complet',
  'Artículo completo',
  '전체 기사',
  '다음 단계 / CTA',
  '行动呼吁（CTA）',
  '行動呼籲（CTA）',
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
  const authoringHeadings = new RegExp(
    `^#{2,3}\\s+(?:${AUTHORING_HEADING_LABELS.map(escapeRegExp).join('|')}|CTA(?:\\s*[,/|:：—-]\\s*[^\\n]*)?)\\s*$`,
    'gim',
  );
  cleaned = cleaned.replace(authoringHeadings, '');
  const internalLinks = new RegExp(`^(##\\s+)(?:${INTERNAL_LINK_LABELS.map(escapeRegExp).join('|')})\\s*$`, 'gim');
  cleaned = cleaned.replace(internalLinks, `$1${RELATED_LABELS[language] || 'Related reading'}`);
  cleaned = cleaned.replace(/\*\*Quick answer\*\*(?!\s*:)/gi, '**Quick answer:**');

  if (hasFaqs) {
    const faqLabels = [
      'Frequently Asked Questions',
      'FAQs',
      'FAQ',
      'Common Questions',
      'Common questions about HBW',
      ...(FAQ_LABELS[language] || []),
    ];
    const faqHeading = new RegExp(
      `\\n##\\s+(?:${faqLabels.map(escapeRegExp).join('|')})(?:\\s*(?:\\||:|,|\\(|（|—|-)\\s*[^\\n]*)?\\s*\\n[\\s\\S]*?(?=\\n##\\s|\\s*$)`,
      'gi',
    );
    cleaned = cleaned.replace(faqHeading, '\n');
  }

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}
