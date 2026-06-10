import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mandarinBlogArticles } from '@/data/mandarinBlogArticles';
import { koreanBlogArticles } from '@/data/koreanBlogArticles';
import { frenchBlogArticles } from '@/data/frenchBlogArticles';
import { spanishBlogArticles } from '@/data/spanishBlogArticles';

type LangCode = 'zh' | 'ko' | 'fr' | 'es' | 'en';

const LANGS: Record<Exclude<LangCode, 'en'>, {
  native: string;
  cta: string;
  featuredSlug: string;
  articleWord: string;
  count: () => number;
}> = {
  zh: {
    native: '中文',
    cta: '在这里查看我们的中文指南',
    featuredSlug: 'mercury-repower-guide-gta',
    articleWord: '篇文章',
    count: () => mandarinBlogArticles.length,
  },
  ko: {
    native: '한국어',
    cta: '한국어 가이드 보기',
    featuredSlug: 'ontario-boat-buying-guide',
    articleWord: '개의 게시물',
    count: () => koreanBlogArticles.length,
  },
  fr: {
    native: 'Français',
    cta: 'Voir nos guides en français',
    featuredSlug: 'prix-remotorisation-mercury-ontario',
    articleWord: 'articles',
    count: () => frenchBlogArticles.length,
  },
  es: {
    native: 'Español',
    cta: 'Ver nuestras guías en español',
    featuredSlug: 'guia-comprar-bote-ontario',
    articleWord: 'artículos',
    count: () => spanishBlogArticles.length,
  },
};

export function MultilingualHub() {
  const [detectedLang, setDetectedLang] = useState<LangCode>('en');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('zh')) setDetectedLang('zh');
    else if (browserLang.startsWith('ko')) setDetectedLang('ko');
    else if (browserLang.startsWith('fr')) setDetectedLang('fr');
    else if (browserLang.startsWith('es')) setDetectedLang('es');
  }, []);

  // Non-English visitor: prominent banner in their language
  if (detectedLang !== 'en') {
    const lang = LANGS[detectedLang];
    return (
      <section aria-label="Multilingual content for your language" className="mb-10">
        <Link
          to={`/blog/${detectedLang}/${lang.featuredSlug}`}
          className="block bg-repower-navy-900 text-white p-5 rounded-lg hover:bg-repower-navy-900/95 transition-colors"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="font-display font-bold text-2xl text-white block mb-1">
                {lang.native}
              </span>
              <span className="font-sans text-sm text-white/85">
                {lang.cta}
              </span>
            </div>
            <span className="font-sans text-sm text-repower-gold font-medium whitespace-nowrap">
              {lang.count()} {lang.articleWord} →
            </span>
          </div>
        </Link>
      </section>
    );
  }

  // English visitor: compact one-line strip (default)
  return (
    <section aria-label="Available in other languages" className="mb-8">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red whitespace-nowrap">
          Also in
        </span>
        <p className="font-sans text-sm text-repower-navy-900/70">
          <Link
            to="/blog/zh/mercury-repower-guide-gta"
            className="hover:text-repower-mercury-red transition-colors"
          >
            中文 ({mandarinBlogArticles.length})
          </Link>
          <span className="mx-2 text-repower-navy-900/30">·</span>
          <Link
            to="/blog/ko/ontario-boat-buying-guide"
            className="hover:text-repower-mercury-red transition-colors"
          >
            한국어 ({koreanBlogArticles.length})
          </Link>
          <span className="mx-2 text-repower-navy-900/30">·</span>
          <Link
            to="/blog/fr"
            className="hover:text-repower-mercury-red transition-colors"
          >
            Français ({frenchBlogArticles.length})
          </Link>
          <span className="mx-2 text-repower-navy-900/30">·</span>
          <Link
            to="/blog/es/guia-comprar-bote-ontario"
            className="hover:text-repower-mercury-red transition-colors"
          >
            Español ({spanishBlogArticles.length})
          </Link>
        </p>
      </div>
    </section>
  );
}
