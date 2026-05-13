import { Link } from 'react-router-dom';
import { mandarinBlogArticles } from '@/data/mandarinBlogArticles';
import { koreanBlogArticles } from '@/data/koreanBlogArticles';
import { frenchBlogArticles } from '@/data/frenchBlogArticles';
import { spanishBlogArticles } from '@/data/spanishBlogArticles';

type LangCard = {
  code: 'zh' | 'ko' | 'fr' | 'es';
  native: string;
  subtitle: string;
  count: number;
  featuredSlug: string;
  featuredLabel: string;
  span: 1 | 2;
};

export function MultilingualHub() {
  const cards: LangCard[] = [
    {
      code: 'zh',
      native: '中文',
      subtitle: 'Mandarin buying & boating guides for GTA Chinese boaters',
      count: mandarinBlogArticles.length,
      featuredSlug: 'mercury-repower-guide-gta',
      featuredLabel: 'GTA Mercury 換新指南',
      span: 2,
    },
    {
      code: 'ko',
      native: '한국어',
      subtitle: 'Korean guides for Toronto-area Korean boaters',
      count: koreanBlogArticles.length,
      featuredSlug: 'ontario-boat-buying-guide',
      featuredLabel: '온타리오 보트 구매 가이드',
      span: 1,
    },
    {
      code: 'fr',
      native: 'Français',
      subtitle: "Guides pour plaisanciers francophones de l'Ontario",
      count: frenchBlogArticles.length,
      featuredSlug: 'prix-remotorisation-mercury-ontario',
      featuredLabel: 'Prix de remotorisation Mercury',
      span: 1,
    },
    {
      code: 'es',
      native: 'Español',
      subtitle: 'Guías de navegación para boteros hispanohablantes',
      count: spanishBlogArticles.length,
      featuredSlug: 'guia-comprar-bote-ontario',
      featuredLabel: 'Guía para comprar un bote',
      span: 1,
    },
  ];

  return (
    <section aria-label="Multilingual collections" className="mb-14">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-8 bg-repower-mercury-red" />
        <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
          Available in Your Language
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const url = `/blog/${c.code}/${c.featuredSlug}`;
          const isPriority = c.span === 2;
          return (
            <Link
              key={c.code}
              to={url}
              className={[
                'group flex flex-col p-5 rounded-lg border transition-all',
                isPriority
                  ? 'sm:col-span-2 bg-repower-navy-900 text-white border-repower-navy-900 hover:bg-repower-navy-900/95'
                  : 'bg-white border-repower-navy-900/10 text-repower-navy-900 hover:border-repower-mercury-red',
              ].join(' ')}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span
                  className={[
                    'font-display font-bold',
                    isPriority ? 'text-2xl text-white' : 'text-xl text-repower-navy-900',
                  ].join(' ')}
                >
                  {c.native}
                </span>
                <span
                  className={[
                    'font-sans text-xs uppercase tracking-wider',
                    isPriority ? 'text-white/70' : 'text-repower-navy-900/55',
                  ].join(' ')}
                >
                  {c.count} {c.count === 1 ? 'article' : 'articles'}
                </span>
              </div>
              <p
                className={[
                  'font-sans text-sm mb-4',
                  isPriority ? 'text-white/85' : 'text-repower-navy-900/70',
                ].join(' ')}
              >
                {c.subtitle}
              </p>
              <span
                className={[
                  'font-sans text-sm font-medium mt-auto',
                  isPriority ? 'text-repower-gold' : 'text-repower-mercury-red',
                ].join(' ')}
              >
                {c.featuredLabel} →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
