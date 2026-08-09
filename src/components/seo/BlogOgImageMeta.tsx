import { Helmet } from '@/lib/helmet';
import { getBlogOgImagePath } from '@/lib/blogOgImage.js';
import { SITE_URL } from '@/lib/site';

interface BlogOgImageMetaProps {
  image?: string;
}

export function BlogOgImageMeta({ image }: BlogOgImageMetaProps) {
  const shareImage = getBlogOgImagePath(image);
  if (!shareImage) return null;
  const absoluteShareImage = shareImage.startsWith('http') ? shareImage : `${SITE_URL}${shareImage}`;
  const hasGeneratedShareImage = shareImage.startsWith('/generated-og/');

  return (
    <Helmet>
      <meta property="og:image" content={absoluteShareImage} />
      {hasGeneratedShareImage && <meta property="og:image:width" content="1200" />}
      {hasGeneratedShareImage && <meta property="og:image:height" content="630" />}
      {hasGeneratedShareImage && <meta property="og:image:type" content="image/webp" />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={absoluteShareImage} />
    </Helmet>
  );
}
