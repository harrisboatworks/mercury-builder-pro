import { Link } from 'react-router-dom';
import { Helmet } from '@/lib/helmet';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
const heroImage = '/lovable-uploads/hero-rice-lake-boating-guide.png';

export default function AboutJayHarris() {
  const url = `${SITE_URL}/about/jay-harris`;
  const title = 'Jay Harris — Owner, Harris Boat Works (3rd Generation)';
  const description =
    'Jay Harris is the 3rd-generation owner of Harris Boat Works, a Mercury Marine Premier Dealer on Rice Lake in Gores Landing, Ontario. Family-owned since 1947, Mercury dealer since 1965.';

  return (
    <div className="min-h-screen bg-repower-paper">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content={`${SITE_URL}${heroImage}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}${heroImage}`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Jay Harris',
          jobTitle: 'Owner, Harris Boat Works',
          worksFor: { '@type': 'Organization', name: 'Harris Boat Works', url: SITE_URL },
          url,
          image: `${SITE_URL}${heroImage}`,
        })}</script>
      </Helmet>

      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      <main className="container mx-auto px-6 md:px-14 py-10 md:py-14">
        <article className="max-w-[820px] mx-auto">
          <div
            className="aspect-[16/9] overflow-hidden rounded-lg bg-repower-navy-900 mb-10"
            aria-hidden="true"
          >
            <img
              src={heroImage}
              alt="Harris Boat Works marina on Rice Lake, Ontario"
              className="w-full h-full object-cover"
            />
          </div>

          <header className="mb-8">
            <h1
              className="font-display font-bold text-repower-navy-900 mb-2"
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
            >
              Jay Harris
            </h1>
            <p className="italic text-repower-navy-900/70">
              Owner, Harris Boat Works · 3rd Generation
            </p>
          </header>

          <div className="prose prose-gray max-w-none">
            <p>
              Jay Harris is the owner of Harris Boat Works, a Mercury Marine Premier Dealer on Rice Lake
              in Gores Landing, Ontario. The marina has been in the same family since 1947, and a Mercury
              dealer continuously since 1965.
            </p>

            <h2>Background</h2>
            <p>
              Jay grew up around outboards. His grandfather George opened Harris Boat Works in 1947 as a
              small marine service operation on the south shore of Rice Lake, and added the Mercury
              dealership in 1965. His father Jim ran the business from 1978 until his passing in 2015.
              Jay took over operations in 2015 as the third generation, representing the same family
              running the same dock on the same lake.
            </p>
            <p>
              The marina has serviced Mercury outboards continuously for 60+ years. That kind of
              continuity is rare in the marine industry. It means Mercury parts knowledge dating back to
              the 70s, customers whose grandparents were also HBW customers, and an institutional memory
              of how Rice Lake (and Mercury) actually behaves through real-world seasons.
            </p>

            <h2>What HBW does today</h2>
            <p>
              Harris Boat Works is one of Mercury's Premier Dealers in Ontario, the highest tier in the
              Mercury dealer-recognition program. The shop carries the full Mercury outboard lineup,
              from 2.5 HP portables to 600 HP Verados, and specializes in:
            </p>
            <ul>
              <li>Mercury repowers (motor + rigging install on existing hulls)</li>
              <li>Mercury-certified service and warranty work</li>
              <li>New Legend Boats and Uttern boat sales (paired with Mercury power)</li>
              <li>Boat valuations, trade-ins, and consignment</li>
              <li>Seasonal service: spring commissioning, winterization, storage</li>
            </ul>
            <p>
              The online quote builder at{' '}
              <Link to="/quote/motor-selection" className="text-primary hover:underline">
                mercuryrepower.ca
              </Link>{' '}
              was built specifically to make Mercury pricing transparent for Ontario buyers. Most
              Ontario dealers do not publish their Mercury prices online; HBW does.
            </p>

            <img
              src="/lovable-uploads/diagram-hbw-service-area-map.png"
              alt="HBW service area map across southern Ontario"
              className="w-full rounded-lg my-6"
            />

            <h2>Editorial approach</h2>
            <p>
              Jay writes (or directly oversees) every blog post on mercuryrepower.ca and
              harrisboatworks.ca. The voice is intentionally smart-friend, not sales-pitchy:
              brand-honest about what Mercury does well and where it's overkill, geographically specific
              to Rice Lake / Kawarthas / GTA boaters, and grounded in actual shop-floor experience.
            </p>
            <p>
              If you spot a factual error in any HBW article, email{' '}
              <a href="mailto:info@harrisboatworks.ca" className="text-primary hover:underline">
                info@harrisboatworks.ca
              </a>{' '}
              with "Article correction" in the subject line. We log every correction and publish
              updates with date stamps.
            </p>

            <h2>Contact</h2>
            <p>
              <strong>Phone:</strong> 905-342-2153
              <br />
              <strong>Email:</strong>{' '}
              <a href="mailto:info@harrisboatworks.ca" className="text-primary hover:underline">
                info@harrisboatworks.ca
              </a>
              <br />
              <strong>Address:</strong> 5369 Harris Boat Works Rd, Gores Landing, ON, K0K 2E0
            </p>
            <p>
              <strong>Configurator:</strong>{' '}
              <Link to="/quote/motor-selection" className="text-primary hover:underline">
                mercuryrepower.ca/quote/motor-selection
              </Link>
              <br />
              <strong>Service booking:</strong>{' '}
              <a
                href="https://hbw.wiki/service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                hbw.wiki/service
              </a>
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
