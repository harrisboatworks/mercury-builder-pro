import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedUrduArticles } from '@/data/urduBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  'اردو گائیڈ': 'choose',
};

const strings: BlogHubStrings = {
  heroTitleLine1: 'بوٹ موٹر گائیڈز',
  heroTitleLine2: 'اور سیدھے جوابات۔',
  heroSubhead:
    'Rice Lake پر ایک فیملی Mercury ڈیلر کی حقیقی تجربے پر مبنی مشورہ۔ ری پاور، ٹربل شوٹنگ اور صحیح آؤٹ بورڈ کا انتخاب — ان لوگوں کی لکھی ہوئی جو خود اسے فٹ کرتے ہیں۔',
  searchLabel: 'گائیڈز تلاش کریں',
  searchPlaceholder: 'گائیڈز، ماڈلز، موضوعات تلاش کریں…',
  trustItems: [],
  intentHeading: 'آپ کو کیا چاہیے؟',
  intents: {
    repower: 'ری پاور اور لاگت',
    choose: 'موٹر کا انتخاب',
    trouble: 'ٹربل شوٹنگ',
    local: 'Rice Lake اور مقامی معلومات',
  },
  featuredEyebrow: 'سرورق کہانی',
  featuredReadCta: 'گائیڈ پڑھیں',
  latestHeading: 'تازہ ترین گائیڈز',
  latestSubhead: 'شاپ اور ڈاک سے تازہ۔',
  newBadge: 'نیا',
  updatedBadge: 'اپڈیٹ شدہ',
  categorySections: [
    { id: 'choose', heading: 'خریداری گائیڈز' },
    { id: 'trouble', heading: 'ٹربل شوٹنگ اور دیکھ بھال' },
    { id: 'local', heading: 'Rice Lake اور مقامی معلومات' },
  ],
  allHeading: 'تمام گائیڈز',
  showAll: 'تمام گائیڈز دیکھیں',
  hideAll: 'مکمل فہرست چھپائیں',
  noResults: 'آپ کی تلاش سے مطابقت رکھنے والی کوئی گائیڈ نہیں ملی۔ دوسرا لفظ آزمائیں یا فلٹر ہٹا دیں۔',
  clearFilters: 'فلٹرز ہٹائیں',
  activeFilterLabel: 'فلٹر شدہ نتائج',
  ctaHeading: 'اپنے ری پاور کی قیمت لینے کے لیے تیار ہیں؟',
  ctaSubhead: 'چند منٹوں میں اصل کوٹیشن بنائیں۔ صرف پک اپ، کوئی دباؤ نہیں۔',
  ctaButton: 'میرا کوٹ بنائیں',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Harris Boat Works کو کال کریں',
};

export default function BlogIndexUr() {
  const articles = getPublishedUrduArticles();
  const url = `${SITE_URL}/blog/ur`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'ur',
    name: 'Mercury اردو گائیڈ — Harris Boat Works',
    description: 'Ontario کے بوٹرز کے لیے Mercury اردو گائیڈ: موٹر، ری پاور، دیکھ بھال، حفاظت اور Rice Lake مشورہ۔',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/ur/${a.slug}`,
      inLanguage: 'ur',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="ur" dir="rtl">
      <Helmet>
        <title>Mercury اردو گائیڈ | Harris Boat Works</title>
        <meta
          name="description"
          content="Ontario کے بوٹرز کے لیے Mercury اردو گائیڈ: آؤٹ بورڈ، ری پاور، دیکھ بھال، حفاظت اور Rice Lake مشورہ۔"
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="ur" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Mercury اردو گائیڈ — Harris Boat Works" />
        <meta property="og:description" content="Ontario کے بوٹرز کے لیے Mercury اردو گائیڈ۔" />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="ur_PK" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/ur"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
