import { SITE_URL } from '@/lib/site';
import { getBlogHreflangAlternates } from '@/data/blogI18nRegistry.js';

interface BlogHreflangLinksProps {
  locale: string;
  slug: string;
}

export function BlogHreflangLinks({ locale, slug }: BlogHreflangLinksProps) {
  return (
    <>
      {getBlogHreflangAlternates(locale, slug).map((alternate) => (
        <link
          key={alternate.hrefLang}
          rel="alternate"
          hrefLang={alternate.hrefLang}
          href={`${SITE_URL}${alternate.path}`}
        />
      ))}
    </>
  );
}
