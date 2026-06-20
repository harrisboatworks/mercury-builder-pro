import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedPunjabiArticles } from '@/data/punjabiBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  'ਪੰਜਾਬੀ ਗਾਈਡ': 'choose',
};

const strings: BlogHubStrings = {
  heroTitleLine1: 'ਬੋਟ ਮੋਟਰ ਗਾਈਡ',
  heroTitleLine2: 'ਅਤੇ ਸਿੱਧੇ ਜਵਾਬ।',
  heroSubhead:
    'Rice Lake ਉੱਤੇ ਇੱਕ ਫੈਮਿਲੀ Mercury ਡੀਲਰ ਵੱਲੋਂ ਅਸਲ ਤਜਰਬੇ ਦੀ ਸਲਾਹ। ਰਿਪਾਵਰ, ਟ੍ਰਬਲਸ਼ੂਟਿੰਗ ਅਤੇ ਸਹੀ ਆਊਟਬੋਰਡ ਚੁਣਨਾ — ਉਹਨਾਂ ਲੋਕਾਂ ਦੁਆਰਾ ਲਿਖਿਆ ਜੋ ਖੁਦ ਇਹਨਾਂ ਨੂੰ ਲਗਾਉਂਦੇ ਹਨ।',
  searchLabel: 'ਗਾਈਡ ਖੋਜੋ',
  searchPlaceholder: 'ਗਾਈਡ, ਮਾਡਲ, ਵਿਸ਼ੇ ਖੋਜੋ…',
  trustItems: [],
  intentHeading: 'ਤੁਹਾਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ?',
  intents: {
    repower: 'ਰਿਪਾਵਰ ਅਤੇ ਲਾਗਤ',
    choose: 'ਮੋਟਰ ਚੁਣੋ',
    trouble: 'ਟ੍ਰਬਲਸ਼ੂਟਿੰਗ',
    local: 'Rice Lake ਅਤੇ ਲੋਕਲ ਜਾਣਕਾਰੀ',
  },
  featuredEyebrow: 'ਮੁੱਖ ਲੇਖ',
  featuredReadCta: 'ਗਾਈਡ ਪੜ੍ਹੋ',
  latestHeading: 'ਨਵੀਆਂ ਗਾਈਡਾਂ',
  latestSubhead: 'ਸ਼ੌਪ ਅਤੇ ਡੌਕ ਤੋਂ ਤਾਜ਼ਾ।',
  newBadge: 'ਨਵਾਂ',
  updatedBadge: 'ਅੱਪਡੇਟ',
  categorySections: [
    { id: 'choose', heading: 'ਖਰੀਦ ਗਾਈਡਾਂ' },
    { id: 'trouble', heading: 'ਟ੍ਰਬਲਸ਼ੂਟਿੰਗ ਅਤੇ ਮੇਨਟੀਨੈਂਸ' },
    { id: 'local', heading: 'Rice Lake ਅਤੇ ਲੋਕਲ ਜਾਣਕਾਰੀ' },
  ],
  allHeading: 'ਸਾਰੀਆਂ ਗਾਈਡਾਂ',
  showAll: 'ਸਾਰੀਆਂ ਗਾਈਡਾਂ ਵੇਖੋ',
  hideAll: 'ਪੂਰੀ ਸੂਚੀ ਲੁਕਾਓ',
  noResults: 'ਤੁਹਾਡੀ ਖੋਜ ਨਾਲ ਮਿਲਦੀ ਕੋਈ ਗਾਈਡ ਨਹੀਂ ਮਿਲੀ। ਕੋਈ ਹੋਰ ਸ਼ਬਦ ਅਜ਼ਮਾਓ ਜਾਂ ਫ਼ਿਲਟਰ ਹਟਾਓ।',
  clearFilters: 'ਫ਼ਿਲਟਰ ਹਟਾਓ',
  activeFilterLabel: 'ਫ਼ਿਲਟਰ ਕੀਤੇ ਨਤੀਜੇ',
  ctaHeading: 'ਆਪਣੇ ਰਿਪਾਵਰ ਦਾ ਕੋਟ ਲੈਣ ਲਈ ਤਿਆਰ ਹੋ?',
  ctaSubhead: 'ਕੁਝ ਮਿੰਟਾਂ ਵਿੱਚ ਅਸਲ ਕੋਟ ਬਣਾਓ। ਸਿਰਫ਼ ਪਿਕਅੱਪ, ਕੋਈ ਦਬਾਅ ਨਹੀਂ।',
  ctaButton: 'ਮੇਰਾ ਕੋਟ ਬਣਾਓ',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Harris Boat Works ਨੂੰ ਕਾਲ ਕਰੋ',
};

export default function BlogIndexPa() {
  const articles = getPublishedPunjabiArticles();
  const url = `${SITE_URL}/blog/pa`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'pa',
    name: 'Mercury ਪੰਜਾਬੀ ਗਾਈਡ — Harris Boat Works',
    description: 'Ontario ਦੇ ਬੋਟਰਾਂ ਲਈ Mercury ਪੰਜਾਬੀ ਗਾਈਡ: ਮੋਟਰ, ਰਿਪਾਵਰ, ਮੇਨਟੀਨੈਂਸ, ਸੁਰੱਖਿਆ ਅਤੇ Rice Lake ਸਲਾਹ।',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/pa/${a.slug}`,
      inLanguage: 'pa',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="pa">
      <Helmet>
        <title>Mercury ਪੰਜਾਬੀ ਗਾਈਡ | Harris Boat Works</title>
        <meta
          name="description"
          content="Ontario ਦੇ ਬੋਟਰਾਂ ਲਈ Mercury ਪੰਜਾਬੀ ਗਾਈਡ: ਆਊਟਬੋਰਡ, ਰਿਪਾਵਰ, ਮੇਨਟੀਨੈਂਸ, ਸੁਰੱਖਿਆ ਅਤੇ Rice Lake ਸਲਾਹ।"
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="pa" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Mercury ਪੰਜਾਬੀ ਗਾਈਡ — Harris Boat Works" />
        <meta property="og:description" content="Ontario ਦੇ ਬੋਟਰਾਂ ਲਈ Mercury ਪੰਜਾਬੀ ਗਾਈਡ।" />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="pa_IN" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/pa"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
