import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedTagalogArticles } from '@/data/tagalogBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  'Tagalog Guide': 'choose',
};

const strings: BlogHubStrings = {
  heroTitleLine1: 'Mga gabay sa boat motor',
  heroTitleLine2: 'at deretsahang sagot.',
  heroSubhead:
    'Totoong payo mula sa isang family-owned na Mercury dealer sa Rice Lake. Repower, troubleshooting, at pagpili ng tamang outboard — sinulat ng mga taong mismong nag-iinstall nito.',
  searchLabel: 'Maghanap ng gabay',
  searchPlaceholder: 'Maghanap ng gabay, modelo, o paksa…',
  trustItems: [],
  intentHeading: 'Ano ang kailangan mo?',
  intents: {
    repower: 'Repower at gastos',
    choose: 'Pumili ng motor',
    trouble: 'Troubleshooting',
    local: 'Rice Lake at lokal',
  },
  featuredEyebrow: 'Cover story',
  featuredReadCta: 'Basahin ang gabay',
  latestHeading: 'Pinakabagong mga gabay',
  latestSubhead: 'Sariwa mula sa shop at sa dock.',
  newBadge: 'Bago',
  updatedBadge: 'Na-update',
  categorySections: [
    { id: 'choose', heading: 'Mga gabay sa pagbili' },
    { id: 'trouble', heading: 'Troubleshooting at pag-mantine' },
    { id: 'local', heading: 'Rice Lake at lokal' },
  ],
  allHeading: 'Lahat ng gabay',
  showAll: 'Tingnan ang lahat ng gabay',
  hideAll: 'Itago ang buong listahan',
  noResults: 'Walang gabay na tumutugma sa iyong paghahanap. Subukan ang ibang salita o alisin ang filter.',
  clearFilters: 'Alisin ang mga filter',
  activeFilterLabel: 'Na-filter na resulta',
  ctaHeading: 'Handa nang kuwentahin ang iyong repower?',
  ctaSubhead: 'Gumawa ng totoong quote sa loob ng ilang minuto. Pickup lang, walang pressure.',
  ctaButton: 'Gawin ang Aking Quote',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Tawagan ang Harris Boat Works',
};

export default function BlogIndexTl() {
  const articles = getPublishedTagalogArticles();
  const url = `${SITE_URL}/blog/tl`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'tl',
    name: 'Mga gabay sa Mercury sa Tagalog — Harris Boat Works',
    description: 'Mga Mercury Tagalog na gabay para sa mga boater ng Ontario: motor, repower, pag-mantine, kaligtasan at payo sa Rice Lake.',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/tl/${a.slug}`,
      inLanguage: 'tl',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="tl">
      <Helmet>
        <title>Mga gabay sa Mercury sa Tagalog | Harris Boat Works</title>
        <meta
          name="description"
          content="Mga Mercury Tagalog na gabay para sa mga boater ng Ontario: outboard, repower, pag-mantine, kaligtasan at payo sa Rice Lake."
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="tl" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Mga gabay sa Mercury sa Tagalog — Harris Boat Works" />
        <meta property="og:description" content="Mga Mercury Tagalog na gabay para sa mga boater ng Ontario." />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="tl_PH" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/tl"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
