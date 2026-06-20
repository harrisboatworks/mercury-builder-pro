import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedTraditionalChineseArticles } from '@/data/traditionalChineseBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  'mandarin': 'choose',
};

const strings: BlogHubStrings = {
  heroTitleLine1: '舷外機指南',
  heroTitleLine2: '與中肯解答。',
  heroSubhead:
    '來自 Rice Lake 一家家庭式 Mercury 經銷商的實戰建議。換裝新機、故障排查、如何選對舷外機——由真正動手裝機的人撰寫。',
  searchLabel: '搜尋指南',
  searchPlaceholder: '搜尋指南、型號或主題…',
  trustItems: [],
  intentHeading: '您想了解什麼？',
  intents: {
    repower: '換裝新機與費用',
    choose: '選購舷外機',
    trouble: '故障排查',
    local: 'Rice Lake 與本地',
  },
  featuredEyebrow: '封面文章',
  featuredReadCta: '閱讀指南',
  latestHeading: '最新指南',
  latestSubhead: '來自廠房與碼頭的最新內容。',
  newBadge: '新',
  updatedBadge: '已更新',
  categorySections: [
    { id: 'choose', heading: '選購指南' },
    { id: 'trouble', heading: '故障排查與保養' },
    { id: 'local', heading: 'Rice Lake 與本地' },
  ],
  allHeading: '全部指南',
  showAll: '查看全部指南',
  hideAll: '收起完整列表',
  noResults: '暫無符合搜尋條件的指南。請嘗試其他關鍵字或清除篩選。',
  clearFilters: '清除篩選',
  activeFilterLabel: '篩選結果',
  ctaHeading: '準備好為您的換裝新機報價了嗎？',
  ctaSubhead: '幾分鐘內取得真實報價。僅限自取，無壓力。',
  ctaButton: '建立我的報價',
  ctaPhone: '(905) 342-2153',
  phoneLabel: '致電 Harris Boat Works',
};

export default function BlogIndexZhHant() {
  const articles = getPublishedTraditionalChineseArticles();
  const url = `${SITE_URL}/blog/zh-hant`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'zh-Hant',
    name: 'Mercury 繁體中文指南 — Harris Boat Works',
    description: '為安省船主提供的 Mercury 繁體中文指南：換裝新機、保養、法規與 Rice Lake 釣魚建議。',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/zh-hant/${a.slug}`,
      inLanguage: 'zh-Hant',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="zh-Hant">
      <Helmet>
        <title>Mercury 繁體中文指南 | Harris Boat Works</title>
        <meta
          name="description"
          content="為安省船主提供的 Mercury 繁體中文指南：舷外機、換裝新機、保養、安全與 Rice Lake 釣魚建議。"
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="zh-Hant" href={url} />
        <link rel="alternate" hrefLang="zh-Hans" href={`${SITE_URL}/blog/zh`} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Mercury 繁體中文指南 — Harris Boat Works" />
        <meta property="og:description" content="為安省船主提供的 Mercury 繁體中文指南。" />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="zh_TW" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/zh-hant"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
