import { Link } from 'react-router-dom';

/**
 * Editorial masthead for the blog index.
 * Small-caps eyebrow, large display H1, one-line dek, refined credibility
 * line, and quiet language-edition links separated by hairline dots.
 */
export function BlogMasthead() {
  return (
    <header className="max-w-[880px] mx-auto text-center mb-12 md:mb-16">
      <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.3em] text-repower-mercury-red mb-6">
        Harris Boat Works Journal
      </p>
      <h1
        id="blog-title"
        className="font-display font-bold text-repower-navy-900 mb-5"
        style={{ fontSize: 'clamp(44px, 6vw, 76px)', letterSpacing: '-0.03em', lineHeight: 1.02 }}
      >
        Boat Motor Guides &amp; Tips
      </h1>
      <p className="font-sans text-[17px] md:text-[18px] text-repower-navy-900/60 max-w-[58ch] mx-auto leading-relaxed">
        Expert advice on choosing, maintaining, and getting the most from your Mercury outboard.
      </p>
      <p className="mt-4 font-sans text-[12px] uppercase tracking-[0.16em] text-repower-navy-900/45">
        Family marina on Rice Lake since 1947
        <span aria-hidden="true" className="mx-2 text-repower-navy-900/25">·</span>
        Mercury Platinum Dealer
      </p>

      {/* Language editions: quiet text links under the masthead */}
      <nav aria-label="Language editions" className="mt-7">
        <p className="font-sans text-[13px] text-repower-navy-900/55">
          <Link
            to="/blog/zh/mercury-repower-guide-gta"
            lang="zh-Hans"
            className="hover:text-repower-mercury-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
          >
            中文
          </Link>
          <span aria-hidden="true" className="mx-3 text-repower-navy-900/20">·</span>
          <Link
            to="/blog/ko/ontario-boat-buying-guide"
            lang="ko"
            className="hover:text-repower-mercury-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
          >
            한국어
          </Link>
          <span aria-hidden="true" className="mx-3 text-repower-navy-900/20">·</span>
          <Link
            to="/blog/fr"
            lang="fr"
            className="hover:text-repower-mercury-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
          >
            Français
          </Link>
          <span aria-hidden="true" className="mx-3 text-repower-navy-900/20">·</span>
          <Link
            to="/blog/es/guia-comprar-bote-ontario"
            lang="es"
            className="hover:text-repower-mercury-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/60 rounded-sm"
          >
            Español
          </Link>
        </p>
      </nav>
    </header>
  );
}
