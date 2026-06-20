import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedHindiArticles } from '@/data/hindiBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  'हिन्दी गाइड': 'choose',
};

const strings: BlogHubStrings = {
  heroTitleLine1: 'बोट मोटर गाइड',
  heroTitleLine2: 'और सीधी-सच्ची सलाह।',
  heroSubhead:
    'Rice Lake पर एक पारिवारिक Mercury डीलर की असली अनुभव से दी गई सलाह। रिपावर, ट्रबलशूटिंग और सही आउटबोर्ड चुनना — उन लोगों द्वारा लिखा गया जो खुद इन्हें लगाते हैं।',
  searchLabel: 'गाइड खोजें',
  searchPlaceholder: 'गाइड, मॉडल, विषय खोजें…',
  trustItems: [],
  intentHeading: 'आपको क्या चाहिए?',
  intents: {
    repower: 'रिपावर और लागत',
    choose: 'मोटर चुनें',
    trouble: 'ट्रबलशूटिंग',
    local: 'Rice Lake और स्थानीय जानकारी',
  },
  featuredEyebrow: 'मुख्य लेख',
  featuredReadCta: 'गाइड पढ़ें',
  latestHeading: 'नवीनतम गाइड',
  latestSubhead: 'शॉप और डॉक से ताज़ा।',
  newBadge: 'नया',
  updatedBadge: 'अपडेटेड',
  categorySections: [
    { id: 'choose', heading: 'खरीदारी गाइड' },
    { id: 'trouble', heading: 'ट्रबलशूटिंग और रखरखाव' },
    { id: 'local', heading: 'Rice Lake और स्थानीय जानकारी' },
  ],
  allHeading: 'सभी गाइड',
  showAll: 'सभी गाइड देखें',
  hideAll: 'पूरी सूची छिपाएँ',
  noResults: 'आपकी खोज से मेल खाने वाली कोई गाइड नहीं मिली। कोई और शब्द आज़माएँ या फ़िल्टर हटाएँ।',
  clearFilters: 'फ़िल्टर हटाएँ',
  activeFilterLabel: 'फ़िल्टर किए गए परिणाम',
  ctaHeading: 'अपने रिपावर का कोटेशन लेने को तैयार हैं?',
  ctaSubhead: 'कुछ ही मिनटों में असली कोटेशन बनाएँ। केवल पिकअप, कोई दबाव नहीं।',
  ctaButton: 'मेरा कोटेशन बनाएँ',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Harris Boat Works को कॉल करें',
};

export default function BlogIndexHi() {
  const articles = getPublishedHindiArticles();
  const url = `${SITE_URL}/blog/hi`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'hi',
    name: 'Mercury हिन्दी गाइड — Harris Boat Works',
    description: 'Ontario के बोटर्स के लिए Mercury हिन्दी गाइड: मोटर, रिपावर, रखरखाव, सुरक्षा और Rice Lake सलाह।',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/hi/${a.slug}`,
      inLanguage: 'hi',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="hi">
      <Helmet>
        <title>Mercury हिन्दी गाइड | Harris Boat Works</title>
        <meta
          name="description"
          content="Ontario के बोटर्स के लिए Mercury हिन्दी गाइड: आउटबोर्ड, रिपावर, रखरखाव, सुरक्षा और Rice Lake सलाह।"
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="hi" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Mercury हिन्दी गाइड — Harris Boat Works" />
        <meta property="og:description" content="Ontario के बोटर्स के लिए Mercury हिन्दी गाइड।" />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="hi_IN" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/hi"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
