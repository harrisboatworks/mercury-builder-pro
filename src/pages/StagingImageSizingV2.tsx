import { useEffect } from 'react';
import { MotorSelection } from '@/components/quote-builder/MotorSelection';

const StagingImageSizingV2 = () => {
  useEffect(() => {
    document.title = 'Motor image sizing v2 comparison | Staging';
    const desc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    desc.setAttribute('name', 'description');
    desc.setAttribute('content', 'Staging: compare current vs adjusted (v2) motor image sizing and spacing.');
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
        <h1 className="text-2xl font-bold text-foreground">Motor image sizing: Current vs Adjusted (v2)</h1>
        <p className="text-muted-foreground">Use ?debug=1 to ensure discounted cards appear for comparison. Right side applies tighter v2 layout.</p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <article>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Current (baseline)</h2>
          <MotorSelection onStepComplete={handleNoop} noSalePriceLayout="placeholder" imageSizingMode="current" useCategoryView={false} />
        </article>
        <article>
          <h2 className="text-xl font-semibold mb-3 text-foreground">Adjusted (v2 tighter layout)</h2>
          <MotorSelection onStepComplete={handleNoop} noSalePriceLayout="placeholder" imageSizingMode="v2" useCategoryView={false} />
        </article>
      </section>
    </main>
  );
};

export default StagingImageSizingV2;
