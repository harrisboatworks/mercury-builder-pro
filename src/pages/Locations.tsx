import { Link } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { getGroupedLocations } from '@/data/locations';

export default function Locations() {
  const groups = getGroupedLocations();
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Mercury Outboard Pickup Areas | Harris Boat Works</title>
        <meta name="description" content="Regional Mercury buyer guides for Peterborough, Cobourg, Northumberland, the Kawarthas, Rice Lake, Durham Region (Whitby, Ajax, Pickering, Oshawa, Bowmanville/Courtice), and the GTA. Pickup only at Gores Landing — sales catchments only, no mobile service or delivery." />
        <link rel="canonical" href={`${SITE_URL}/locations`} />
      </Helmet>
      <LuxuryHeader />
      <main className="container mx-auto px-4 py-12">
        <header className="max-w-3xl mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">Mercury outboard pickup areas</h1>
          <p className="text-lg text-muted-foreground mb-3">
            Regional buyer guides for Ontario Mercury customers. These are sales catchments only. Every order is picked up at our Gores Landing shop on Rice Lake, with CAD-only pricing. Harris Boat Works does not perform mobile service, on-site installs, or driveway/marina visits in any listed city.
          </p>
        </header>
        {groups.map((group) => (
          <section key={group.heading} className="mb-10">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{group.heading}</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((location) => (
                <article key={location.slug} className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    <Link to={`/locations/${location.slug}`}>{location.title}</Link>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{location.metaDescription}</p>
                  <p className="text-sm text-foreground mb-4"><strong>Drive:</strong> {location.driveTime}</p>
                  <Link to={`/locations/${location.slug}`} className="text-primary hover:underline">Open page →</Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
