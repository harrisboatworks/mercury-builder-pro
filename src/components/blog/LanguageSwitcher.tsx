import { Link } from 'react-router-dom';

export type BlogLanguage = 'en' | 'fr' | 'ko' | 'zh' | 'es' | 'hi' | 'pa';

interface LanguageOption {
  code: BlogLanguage;
  label: string;
  /** Path to that language's blog index (or English `/blog`). */
  indexPath: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', indexPath: '/blog' },
  { code: 'fr', label: 'Français', indexPath: '/blog/fr' },
  { code: 'ko', label: '한국어', indexPath: '/blog/ko' },
  { code: 'zh', label: '中文', indexPath: '/blog/zh' },
  { code: 'es', label: 'Español', indexPath: '/blog/es' },
  { code: 'hi', label: 'हिन्दी', indexPath: '/blog/hi' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', indexPath: '/blog/pa' },
];

interface Props {
  currentLang: BlogLanguage;
}

/**
 * Compact language switcher rendered near the top of every blog post.
 *
 * v1: links to each language's blog index path. Per-post translation
 * mapping is a follow-up — for now readers can hop to a language's
 * landing/index and pick a post manually.
 */
export function LanguageSwitcher({ currentLang }: Props) {
  const others = LANGUAGES.filter((l) => l.code !== currentLang);
  return (
    <div
      role="navigation"
      aria-label="Read this article in another language"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 my-4 text-xs text-repower-navy-900/70"
    >
      <span className="font-semibold uppercase tracking-wider text-repower-navy-900/60">
        Read in:
      </span>
      {others.map((opt, i) => (
        <span key={opt.code} className="flex items-center gap-x-2">
          <Link
            to={opt.indexPath}
            hrefLang={opt.code}
            className="hover:text-repower-navy-900 hover:underline underline-offset-4 transition-colors"
          >
            {opt.label}
          </Link>
          {i < others.length - 1 && (
            <span aria-hidden="true" className="text-repower-navy-900/30">
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
