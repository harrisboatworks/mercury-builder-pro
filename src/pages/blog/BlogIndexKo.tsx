import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedKoreanArticles } from '@/data/koreanBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  '구매 가이드': 'choose',
  '규정 가이드': 'local',
  '낚시 가이드': 'local',
  '엔진 교체': 'repower',
  '엔진 비교': 'choose',
  '정비 가이드': 'trouble',
};

const strings: BlogHubStrings = {
  heroTitleLine1: '선외기 가이드',
  heroTitleLine2: '와 정직한 답변.',
  heroSubhead:
    'Rice Lake의 가족 운영 Mercury 딜러가 전하는 현장 조언. 엔진 교체, 문제 해결, 알맞은 선외기 선택까지—직접 장착하는 사람들이 씁니다.',
  searchLabel: '가이드 검색',
  searchPlaceholder: '가이드, 모델, 주제 검색…',
  trustItems: [],
  intentHeading: '무엇이 필요하신가요?',
  intents: {
    repower: '엔진 교체와 비용',
    choose: '선외기 선택',
    trouble: '문제 해결',
    local: 'Rice Lake와 지역 정보',
  },
  featuredEyebrow: '주요 기사',
  featuredReadCta: '가이드 읽기',
  latestHeading: '최신 가이드',
  latestSubhead: '작업장과 부두에서 막 나온 따끈한 내용.',
  newBadge: '신규',
  updatedBadge: '업데이트',
  categorySections: [
    { id: 'choose', heading: '구매 가이드' },
    { id: 'trouble', heading: '문제 해결 및 정비' },
    { id: 'local', heading: 'Rice Lake와 지역 정보' },
  ],
  allHeading: '전체 가이드',
  showAll: '전체 가이드 보기',
  hideAll: '전체 목록 숨기기',
  noResults: '검색 결과와 일치하는 가이드가 없습니다. 다른 단어로 검색하거나 필터를 해제해 보세요.',
  clearFilters: '필터 해제',
  activeFilterLabel: '필터링된 결과',
  ctaHeading: '엔진 교체 견적을 받을 준비가 되셨나요?',
  ctaSubhead: '몇 분이면 실제 견적을 받을 수 있습니다. 픽업 전용, 부담 없습니다.',
  ctaButton: '내 견적 만들기',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Harris Boat Works에 전화하기',
};

export default function BlogIndexKo() {
  const articles = getPublishedKoreanArticles();
  const url = `${SITE_URL}/blog/ko`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'ko',
    name: 'Mercury 한국어 가이드 — Harris Boat Works',
    description: '온타리오 보터를 위한 Mercury 한국어 가이드: 엔진 교체, 정비, 규정 및 Rice Lake 낚시 정보.',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/ko/${a.slug}`,
      inLanguage: 'ko',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="ko">
      <Helmet>
        <title>Mercury 한국어 가이드 | Harris Boat Works</title>
        <meta
          name="description"
          content="온타리오 보터를 위한 Mercury 한국어 가이드: 선외기, 엔진 교체, 정비, 안전 및 Rice Lake 낚시 정보."
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="ko" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Mercury 한국어 가이드 — Harris Boat Works" />
        <meta property="og:description" content="온타리오 보터를 위한 Mercury 한국어 가이드." />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/ko"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
