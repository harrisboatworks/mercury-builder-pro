import { Link } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { locations } from '@/data/locations';

export default function Locations() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mercury Service Areas | Harris Boat Works</title>
        <meta name="description" content="Regional Mercury outboard and repower pages for Peterborough, Kawartha Lakes, Rice Lake, Cobourg, Northumberland, Durham, and the GTA." />
        <link rel="canonical" href={`${SITE_URL}/locations`} />
      </Helmet>
      <LuxuryHeader />
      <main className="container mx-auto px-4 py-12">
        <header className="max-w-3xl mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">Mercury outboard service areas</h1>
          <p className="text-lg text-muted-foreground">Region-specific guidance for Ontario buyers, always with pickup at Gores Landing and CAD-only pricing.</p>
        </header>
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <article key={location.slug} className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                <Link to={`/locations/${location.slug}`}>{location.title}</Link>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{location.intro}</p>
              <p className="text-sm text-foreground mb-4">Drive time: {location.driveTime}</p>
              <Link to={`/locations/${location.slug}`} className="text-primary hover:underline">Open page</Link>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
