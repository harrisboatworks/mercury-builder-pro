import { useEffect } from 'react';
import { MotorSelection } from '@/components/quote-builder/MotorSelection';

const StagingImageSizing = () => {
  useEffect(() => {
    document.title = 'Motor image sizing demo | Staging';
    const desc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    desc.setAttribute('name', 'description');
    desc.setAttribute('content', 'Staging demo: motor image sizing — current vs taller box vs conditional scaling.');
    document.head.appendChild(desc);
    const robots = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    robots.setAttribute('name', 'robots');
    robots.setAttribute('content', 'noindex, nofollow');
    document.head.appendChild(robots);
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
        <h1 className="text-2xl font-bold text-foreground">Motor image sizing demo</h1>
        <p className="text-muted-foreground">A/B/C: Current vs Increased height vs Conditional scale. Use ?debug=1 to ensure discounted cards appear for comparison.</p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <article>
          <h2 className="text-xl font-semibold mb-3 text-foreground">A: Current (baseline)</h2>
          <MotorSelection onStepComplete={handleNoop} noSalePriceLayout="placeholder" imageSizingMode="current" />
        </article>
        <article>
          <h2 className="text-xl font-semibold mb-3 text-foreground">B: Increased height (h-52 / md:h-60 / lg:h-68)</h2>
          <MotorSelection onStepComplete={handleNoop} noSalePriceLayout="placeholder" imageSizingMode="taller" />
        </article>
        <article>
          <h2 className="text-xl font-semibold mb-3 text-foreground">C: Conditional scale-105 for MSRP-only</h2>
          <MotorSelection onStepComplete={handleNoop} noSalePriceLayout="placeholder" imageSizingMode="scale-msrp" />
        </article>
      </section>
    </main>
  );
};

export default StagingImageSizing;
