import { getPublishedKoreanArticles, KO_LANGUAGE_NOTE } from './koreanBlogArticles';
import { getPublishedSpanishArticles, ES_LANGUAGE_NOTE } from './spanishBlogArticles';
import { getPublishedPunjabiArticles, PA_LANGUAGE_NOTE } from './punjabiBlogArticles';
import { getPublishedUrduArticles, UR_LANGUAGE_NOTE } from './urduBlogArticles';
import { getPublishedTagalogArticles, TL_LANGUAGE_NOTE } from './tagalogBlogArticles';
import type { BlogArticle } from './blogArticles';

export type LocaleHubCode = 'ko' | 'es' | 'pa' | 'ur' | 'tl';

export interface LocaleHubCopy {
  path: string;
  lang: string;
  dir: 'ltr' | 'rtl';
  hrefLang: string;
  ogLocale: string;
  title: string;
  heading: string;
  intro: string;
  disclaimer: string;
  postsHeading: string;
  blogPrefix: string;
  getArticles: () => BlogArticle[];
}

/**
 * Top-level locale hub copy. Headings come from the existing /blog/{lang}
 * index pages. Disclaimers are the exact language notes already exported
 * from the localized article files. No new translated prose.
 */
export const LOCALE_HUBS: Record<LocaleHubCode, LocaleHubCopy> = {
  ko: {
    path: '/ko',
    lang: 'ko',
    dir: 'ltr',
    hrefLang: 'ko',
    ogLocale: 'ko_KR',
    title: 'Mercury 한국어 가이드 | Harris Boat Works',
    heading: 'Mercury 한국어 가이드',
    intro: '온타리오 보터를 위한 Mercury 한국어 가이드: 선외기, 엔진 교체, 정비, 안전 및 Rice Lake 낚시 정보.',
    disclaimer: KO_LANGUAGE_NOTE,
    postsHeading: '전체 가이드',
    blogPrefix: '/blog/ko',
    getArticles: getPublishedKoreanArticles,
  },
  es: {
    path: '/es',
    lang: 'es',
    dir: 'ltr',
    hrefLang: 'es',
    ogLocale: 'es',
    title: 'Guías Mercury en español | Harris Boat Works',
    heading: 'Guías Mercury en español',
    intro: 'Guías Mercury y consejos náuticos en español para Ontario: motores, remotorización, mantenimiento, seguridad y pesca en Rice Lake.',
    disclaimer: ES_LANGUAGE_NOTE,
    postsHeading: 'Todas las guías',
    blogPrefix: '/blog/es',
    getArticles: getPublishedSpanishArticles,
  },
  pa: {
    path: '/pa',
    lang: 'pa',
    dir: 'ltr',
    hrefLang: 'pa',
    ogLocale: 'pa_IN',
    title: 'Mercury ਪੰਜਾਬੀ ਗਾਈਡ | Harris Boat Works',
    heading: 'Mercury ਪੰਜਾਬੀ ਗਾਈਡ',
    intro: 'Ontario ਦੇ ਬੋਟਰਾਂ ਲਈ Mercury ਪੰਜਾਬੀ ਗਾਈਡ: ਆਊਟਬੋਰਡ, ਰਿਪਾਵਰ, ਮੇਨਟੀਨੈਂਸ, ਸੁਰੱਖਿਆ ਅਤੇ Rice Lake ਸਲਾਹ।',
    disclaimer: PA_LANGUAGE_NOTE,
    postsHeading: 'ਸਾਰੀਆਂ ਗਾਈਡਾਂ',
    blogPrefix: '/blog/pa',
    getArticles: getPublishedPunjabiArticles,
  },
  ur: {
    path: '/ur',
    lang: 'ur',
    dir: 'rtl',
    hrefLang: 'ur',
    ogLocale: 'ur_PK',
    title: 'Mercury اردو گائیڈ | Harris Boat Works',
    heading: 'Mercury اردو گائیڈ',
    intro: 'Ontario کے بوٹرز کے لیے Mercury اردو گائیڈ: آؤٹ بورڈ، ری پاور، دیکھ بھال، حفاظت اور Rice Lake مشورہ۔',
    disclaimer: UR_LANGUAGE_NOTE,
    postsHeading: 'تمام گائیڈز',
    blogPrefix: '/blog/ur',
    getArticles: getPublishedUrduArticles,
  },
  tl: {
    path: '/tl',
    lang: 'tl',
    dir: 'ltr',
    hrefLang: 'tl',
    ogLocale: 'tl_PH',
    title: 'Mga gabay sa Mercury sa Tagalog | Harris Boat Works',
    heading: 'Mga gabay sa Mercury sa Tagalog',
    intro: 'Mga Mercury Tagalog na gabay para sa mga boater ng Ontario: outboard, repower, pag-mantine, kaligtasan at payo sa Rice Lake.',
    disclaimer: TL_LANGUAGE_NOTE,
    postsHeading: 'Lahat ng gabay',
    blogPrefix: '/blog/tl',
    getArticles: getPublishedTagalogArticles,
  },
};

export const LOCALE_HUB_CODES = Object.keys(LOCALE_HUBS) as LocaleHubCode[];
