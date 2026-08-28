import { Link } from 'react-router-dom';
import { blogArticles } from '@/data/blogArticles';
import { blogClusters } from '@/data/blogClusters';
import { stripMarkdown } from '@/lib/strip-markdown';

type PillarCard = {
  id: number;
  name: string;
  slug: string;
  title: string;
  description: string;
};

const ARTICLE_BY_SLUG = new Map(blogArticles.map((article) => [article.slug, article]));

export const PILLAR_CARDS: PillarCard[] = blogClusters.flatMap((cluster) => {
  const pillar = ARTICLE_BY_SLUG.get(cluster.pillar);
  if (!pillar) return [];
  return [
    {
      id: cluster.id,
      name: cluster.name,
      slug: pillar.slug,
      title: pillar.title,
      description: stripMarkdown(pillar.description || ''),
    },
  ];
});

export function BlogIndexPillars() {
  if (PILLAR_CARDS.length === 0) return null;

  return (
    <section aria-labelledby="start-here-heading" className="mb-14 md:mb-16 scroll-mt-36">
      <h2
        id="start-here-heading"
        className="font-display text-2xl md:text-3xl font-bold text-repower-navy-900"
        style={{ letterSpacing: '-0.02em' }}
      >
        Start here
      </h2>
      <p className="mt-2 max-w-[62ch] font-sans text-sm md:text-base text-repower-navy-900/65 leading-relaxed">
        Each cluster starts with a pillar guide. Use these as the entry point, then browse the rest by topic.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {PILLAR_CARDS.map((card) => (
          <article
            key={card.id}
            className="bg-surface-card border border-repower-navy-900/10 rounded-md p-5 flex flex-col"
          >
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-repower-navy-900/50">
              {card.name}
            </p>
            <h3
              className="mt-2 font-display text-lg font-semibold text-repower-navy-900 leading-snug"
              style={{ letterSpacing: '-0.015em' }}
            >
              <Link
                to={`/blog/${card.slug}`}
                className="hover:text-repower-mercury-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
              >
                {card.title}
              </Link>
            </h3>
            {card.description ? (
              <p className="mt-2 font-sans text-sm text-repower-navy-900/65 leading-relaxed line-clamp-3">
                {card.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
