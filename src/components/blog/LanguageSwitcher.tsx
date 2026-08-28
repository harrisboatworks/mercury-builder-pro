import { Link } from 'react-router-dom';
import { blogArticles } from '@/data/blogArticles';
import { frenchBlogArticles } from '@/data/frenchBlogArticles';
import { koreanBlogArticles } from '@/data/koreanBlogArticles';
import { mandarinBlogArticles } from '@/data/mandarinBlogArticles';
import { spanishBlogArticles } from '@/data/spanishBlogArticles';
import { hindiBlogArticles } from '@/data/hindiBlogArticles';
import { punjabiBlogArticles } from '@/data/punjabiBlogArticles';
import { urduBlogArticles } from '@/data/urduBlogArticles';
import { tagalogBlogArticles } from '@/data/tagalogBlogArticles';

export type BlogLanguage = 'en' | 'fr' | 'ko' | 'zh' | 'es' | 'hi' | 'pa' | 'ur' | 'tl';

interface LanguageOption {
  code: BlogLanguage;
  label: string;
  /** URL path prefix for an article in this language. */
  pathPrefix: string;
  /** Article array used to check if a translation exists for the current slug. */
  articles: { slug: string }[];
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', pathPrefix: '/blog', articles: blogArticles },
  { code: 'fr', label: 'Français', pathPrefix: '/blog/fr', articles: frenchBlogArticles },
  { code: 'ko', label: '한국어', pathPrefix: '/blog/ko', articles: koreanBlogArticles },
  { code: 'zh', label: '中文', pathPrefix: '/blog/zh', articles: mandarinBlogArticles },
  { code: 'es', label: 'Español', pathPrefix: '/blog/es', articles: spanishBlogArticles },
  { code: 'hi', label: 'हिन्दी', pathPrefix: '/blog/hi', articles: hindiBlogArticles },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', pathPrefix: '/blog/pa', articles: punjabiBlogArticles },
  { code: 'ur', label: 'اردو', pathPrefix: '/blog/ur', articles: urduBlogArticles },
  { code: 'tl', label: 'Tagalog', pathPrefix: '/blog/tl', articles: tagalogBlogArticles },
];

interface Props {
  currentLang: BlogLanguage;
  /** Slug of the current article. Used to only show languages that have a translation. */
  currentSlug?: string;
}

/**
 * Compact language switcher rendered near the top of every blog post.
 *
 * Only renders language options where a translation of the current slug
 * actually exists. If no translations exist, the switcher renders nothing.
 */
export function LanguageSwitcher({ currentLang, currentSlug }: Props) {
  // Without a slug we can't do per-post matching — render nothing rather
  // than dump readers onto the wrong index.
  if (!currentSlug) return null;

  const others = LANGUAGES.filter(
    (l) => l.code !== currentLang && l.articles.some((a) => a.slug === currentSlug),
  );

  if (others.length === 0) return null;

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
            to={`${opt.pathPrefix}/${currentSlug}`}
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
