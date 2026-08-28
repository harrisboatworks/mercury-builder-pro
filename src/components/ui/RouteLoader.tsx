import harrisLogo from '@/assets/harris-logo-white.png';
import mercuryLogo from '@/assets/mercury-logo-white.png';

export const RouteLoader = () => {
  return (
    <div
      className="min-h-screen bg-repower-paper"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      aria-busy="true"
    >
      <header className="h-[64px] bg-repower-navy-900 px-5 md:h-[72px] md:px-10">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={harrisLogo}
              alt=""
              aria-hidden="true"
              className="h-10 w-auto opacity-90 md:h-11"
            />
            <span className="h-8 w-px bg-repower-cream/20" aria-hidden="true" />
            <img
              src={mercuryLogo}
              alt=""
              aria-hidden="true"
              className="h-7 w-auto opacity-90 md:h-8"
            />
          </div>
          <div className="h-10 w-24 animate-pulse bg-repower-cream/10" aria-hidden="true" />
        </div>
      </header>

      <main className="px-6 py-14 md:px-14 md:py-20">
        <div className="mx-auto max-w-[1100px] animate-pulse" aria-hidden="true">
          <div className="mb-6 h-3 w-36 bg-repower-mercury-red/20" />
          <div className="mb-4 h-11 w-full max-w-2xl bg-repower-navy-900/10 md:h-14" />
          <div className="mb-3 h-5 w-full max-w-xl bg-repower-navy-900/[0.07]" />
          <div className="mb-10 h-5 w-3/4 max-w-lg bg-repower-navy-900/[0.07]" />
          <div className="mb-14 h-12 w-44 bg-repower-mercury-red/15" />

          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 border border-repower-navy-900/10 bg-white/70" />
            ))}
          </div>
        </div>
      </main>
      <span className="sr-only">Loading the next page</span>
    </div>
  );
};
