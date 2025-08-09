import { useEffect } from 'react';
import { MotorSelection } from '@/components/quote-builder/MotorSelection';

const StagingPricingTweaks = () => {
  useEffect(() => {
    document.title = 'Motor card pricing spacing demo | Staging';
    // meta description
    const desc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    desc.setAttribute('name', 'description');
    desc.setAttribute('content', 'Staging demo: motor card pricing spacing — placeholder vs vertical centering.');
    document.head.appendChild(desc);
    // robots noindex
    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex, nofollow');
    document.head.appendChild(robots);
    // canonical
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    const canonical = existingCanonical || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', window.location.href);
    if (!existingCanonical) document.head.appendChild(canonical);
  }, []);

  const handleNoop = () => {};

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Motor card pricing spacing demo</h1>
        <p className="text-muted-foreground">Compare two safe approaches side-by-side. Use ?debug=1 and optional &model=... to force a discounted card.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <article>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Approach A: Placeholder block</h2>
          <MotorSelection onStepComplete={handleNoop} noSalePriceLayout="placeholder" />
        </article>
        <article>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Approach B: Vertical centering</h2>
          <MotorSelection onStepComplete={handleNoop} noSalePriceLayout="centered" />
        </article>
      </section>
    </main>
  );
};

export default StagingPricingTweaks;
