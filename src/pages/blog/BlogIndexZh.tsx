import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedMandarinArticles } from '@/data/mandarinBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  'Buying Guides': 'choose',
  'HBW 中文介绍': 'local',
  'Maintenance': 'trouble',
  'Mercury 型号比较': 'choose',
  'mandarin': 'choose',
  '中马力指南': 'choose',
  '产品对比': 'choose',
  '安省法规中文': 'local',
  '家庭买船指南': 'choose',
  '小马力指南': 'choose',
  '成本分析': 'repower',
  '法规安全': 'local',
  '租船与钓鱼': 'local',
  '钓鱼指南': 'local',
};

const strings: BlogHubStrings = {
  heroTitleLine1: '舷外机指南',
  heroTitleLine2: '与中肯解答。',
  heroSubhead:
    '来自 Rice Lake 一家家庭式 Mercury 经销商的实战建议。换装新机、故障排查、如何选对舷外机——由真正动手装机的人撰写。',
  searchLabel: '搜索指南',
  searchPlaceholder: '搜索指南、型号或主题…',
  trustItems: [],
  intentHeading: '您想了解什么？',
  intents: {
    repower: '换装新机与费用',
    choose: '选购舷外机',
    trouble: '故障排查',
    local: 'Rice Lake 与本地',
  },
  featuredEyebrow: '封面文章',
  featuredReadCta: '阅读指南',
  latestHeading: '最新指南',
  latestSubhead: '来自工厂车间与码头的最新内容。',
  newBadge: '新',
  updatedBadge: '已更新',
  categorySections: [
    { id: 'choose', heading: '选购指南' },
    { id: 'trouble', heading: '故障排查与保养' },
    { id: 'local', heading: 'Rice Lake 与本地' },
  ],
  allHeading: '全部指南',
  showAll: '查看全部指南',
  hideAll: '收起完整列表',
  noResults: '暂无符合搜索条件的指南。请尝试其他关键词或清除筛选。',
  clearFilters: '清除筛选',
  activeFilterLabel: '筛选结果',
  ctaHeading: '准备好为您的换装新机报价了吗？',
  ctaSubhead: '几分钟内获取真实报价。仅限自取，无压力。',
  ctaButton: '创建我的报价',
  ctaPhone: '(905) 342-2153',
  phoneLabel: '致电 Harris Boat Works',
};

export default function BlogIndexZh() {
  const articles = getPublishedMandarinArticles();
  const url = `${SITE_URL}/blog/zh`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'zh-Hans',
    name: 'Mercury 中文指南 — Harris Boat Works',
    description: '为安省船主提供的 Mercury 中文指南：换装新机、保养、法规与 Rice Lake 钓鱼建议。',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/zh/${a.slug}`,
      inLanguage: 'zh-Hans',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="zh-Hans">
      <Helmet>
        <title>Mercury 中文指南 | Harris Boat Works</title>
        <meta
          name="description"
          content="为安省船主提供的 Mercury 中文指南：舷外机、换装新机、保养、安全与 Rice Lake 钓鱼建议。"
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="zh-Hans" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Mercury 中文指南 — Harris Boat Works" />
        <meta property="og:description" content="为安省船主提供的 Mercury 中文指南。" />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/zh"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
