import { Helmet } from '@/lib/helmet';
import { getPageCategory, getPageId } from '@/lib/analytics';

interface PageMetaProps {
  /** Optional explicit page id override (Bucket-2 ID). */
  pageId?: string;
  /** Optional explicit page category override. */
  pageCategory?: string;
  pathname: string;
}

/**
 * Emits <meta name="page-id"> and <meta name="page-category"> for every route.
 * Defaults to the slug-derived mapping in src/lib/analytics.ts.
 */
export function PageMeta({ pageId, pageCategory, pathname }: PageMetaProps) {
  const id = pageId || getPageId(pathname);
  const category = pageCategory || getPageCategory(pathname);
  return (
    <Helmet>
      <meta name="page-id" content={id} />
      <meta name="page-category" content={category} />
    </Helmet>
  );
}
