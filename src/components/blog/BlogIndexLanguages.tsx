import { Link } from 'react-router-dom';
import { frenchBlogArticles } from '@/data/frenchBlogArticles';
import { mandarinBlogArticles } from '@/data/mandarinBlogArticles';
import { traditionalChineseBlogArticles } from '@/data/traditionalChineseBlogArticles';
import { koreanBlogArticles } from '@/data/koreanBlogArticles';
import { spanishBlogArticles } from '@/data/spanishBlogArticles';
import { punjabiBlogArticles } from '@/data/punjabiBlogArticles';
import { urduBlogArticles } from '@/data/urduBlogArticles';
import { tagalogBlogArticles } from '@/data/tagalogBlogArticles';
import { hindiBlogArticles } from '@/data/hindiBlogArticles';

type LanguagePost = {
  slug: string;
  title: string;
};

type LanguageEdition = {
  code: string;
  nativeName: string;
  htmlLang: string;
  dir?: 'ltr' | 'rtl';
  basePath: string;
  posts: LanguagePost[];
};

function toPosts(articles: ReadonlyArray<{ slug: string; title: string }>): LanguagePost[] {
  return articles.map((article) => ({ slug: article.slug, title: article.title }));
}

export const LANGUAGE_EDITIONS: LanguageEdition[] = [
  {
    code: 'fr',
    nativeName: 'Français',
    htmlLang: 'fr',
    basePath: '/blog/fr',
    posts: toPosts(frenchBlogArticles),
  },
  {
    code: 'zh',
    nativeName: '简体中文',
    htmlLang: 'zh-Hans',
    basePath: '/blog/zh',
    posts: toPosts(mandarinBlogArticles),
  },
  {
    code: 'zh-hant',
    nativeName: '繁體中文',
    htmlLang: 'zh-Hant',
    basePath: '/blog/zh-hant',
    posts: toPosts(traditionalChineseBlogArticles),
  },
  {
    code: 'ko',
    nativeName: '한국어',
    htmlLang: 'ko',
    basePath: '/blog/ko',
    posts: toPosts(koreanBlogArticles),
  },
  {
    code: 'es',
    nativeName: 'Español',
    htmlLang: 'es',
    basePath: '/blog/es',
    posts: toPosts(spanishBlogArticles),
  },
  {
    code: 'pa',
    nativeName: 'ਪੰਜਾਬੀ',
    htmlLang: 'pa',
    basePath: '/blog/pa',
    posts: toPosts(punjabiBlogArticles),
  },
  {
    code: 'ur',
    nativeName: 'اردو',
    htmlLang: 'ur',
    dir: 'rtl',
    basePath: '/blog/ur',
    posts: toPosts(urduBlogArticles),
  },
  {
    code: 'tl',
    nativeName: 'Tagalog',
    htmlLang: 'tl',
    basePath: '/blog/tl',
    posts: toPosts(tagalogBlogArticles),
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    htmlLang: 'hi',
    basePath: '/blog/hi',
    posts: toPosts(hindiBlogArticles),
  },
];

export function BlogIndexLanguages() {
  const editions = LANGUAGE_EDITIONS.filter((edition) => edition.posts.length > 0);
  if (editions.length === 0) return null;

  return (
    <section
      aria-labelledby="other-languages-heading"
      className="mb-16 md:mb-20 scroll-mt-36"
    >
      <h2
        id="other-languages-heading"
        className="font-display text-2xl md:text-3xl font-bold text-repower-navy-900"
        style={{ letterSpacing: '-0.02em' }}
      >
        Guides in other languages
      </h2>
      <p className="mt-2 max-w-[62ch] font-sans text-sm md:text-base text-repower-navy-900/65 leading-relaxed">
        The same shop advice, written for boaters who prefer to read in another language.
      </p>

      <div className="mt-8 space-y-10">
        {editions.map((edition) => (
          <section
            key={edition.code}
            aria-labelledby={`lang-${edition.code}-heading`}
            lang={edition.htmlLang}
            className="scroll-mt-36"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-repower-navy-900/10 pb-3">
              <h3
                id={`lang-${edition.code}-heading`}
                className="font-display text-xl font-bold text-repower-navy-900"
                style={{ letterSpacing: '-0.015em' }}
              >
                <Link
                  to={edition.basePath}
                  className="hover:text-repower-mercury-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
                >
                  {edition.nativeName}
                </Link>
              </h3>
              <p className="font-sans text-sm text-repower-navy-900/50">
                {edition.posts.length} {edition.posts.length === 1 ? 'guide' : 'guides'}
              </p>
            </div>
            <ul
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2"
              dir={edition.dir}
            >
              {edition.posts.map((post) => (
                <li key={`${edition.code}-${post.slug}`}>
                  <Link
                    to={`${edition.basePath}/${post.slug}`}
                    className="font-sans text-sm text-repower-navy-900 hover:text-repower-mercury-red transition-colors leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
