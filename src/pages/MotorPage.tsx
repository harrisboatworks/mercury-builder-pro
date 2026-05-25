import { useEffect, useState, lazy, Suspense } from 'react';

// Lazy-loaded — keeps the 22k-line blogArticles import OUT of the motor bundle
const RelatedPostsGrid = lazy(() =>
  import('@/components/blog/RelatedPostsGrid').then(m => ({ default: m.RelatedPostsGrid }))
);
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from '@/lib/helmet';
import { Loader2, Award, MapPin, ShieldCheck, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackAgentEvent } from '@/lib/agentEvents';
import { getMotorImageByPriority } from '@/lib/motor-helpers';
import { DealerTrustStrip } from '@/components/trust/DealerTrustStrip';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { MotorPageSEO } from '@/components/seo/MotorPageSEO';

/**
 * Public-facing motor detail page rendered at /motors/{slug}.
 *
 * The static prerender (scripts/static-prerender.mjs) writes a fully
 * stamped dist/motors/{slug}/index.html with title, description, canonical,
 * Product/Offer JSON-LD, and a noscript article body for crawlers.
 *
 * On hydration this React component takes over: it resolves the slug to
 * a motor record, renders a friendly summary, and exposes a CTA that
 * sends the user to /quote/motor-selection?motor={id}. Unlike the legacy
 * MotorRedirect, it does NOT auto-redirect, that broke the prerendered
 * crawler experience and prevented users from sharing motor URLs.
 */

interface MotorRow {
  id: string;
  model_key: string | null;
  model_display: string | null;
  model: string | null;
  model_number: string | null;
  mercury_model_no: string | null;
  family: string | null;
  motor_type: string | null;
  horsepower: number | null;
  shaft: string | null;
  shaft_code: string | null;
  start_type: string | null;
  control_type: string | null;
  msrp: number | null;
  sale_price: number | null;
  dealer_price: number | null;
  base_price: number | null;
  manual_overrides: Record<string, unknown> | null;
  availability: string | null;
  in_stock: boolean | null;
  hero_media_id: string | null;
  hero_image_url: string | null;
  image_url: string | null;
}

type ManualOverrides = {
  sale_price?: number | string | null;
  base_price?: number | string | null;
};

function resolveSellingPrice(m: MotorRow): number | null {
  const overrides = (m.manual_overrides || {}) as ManualOverrides;
  const candidates = [
    overrides.sale_price,
    overrides.base_price,
    m.sale_price,
    m.dealer_price,
    m.msrp,
    m.base_price,
  ];
  for (const v of candidates) {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n === 'number' && !isNaN(n) && n > 0) return n;
  }
  return null;
}

function formatCAD(n: number | null): string {
  if (n == null) return 'Contact for pricing';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function detectFamily(model: string | null, motorType: string | null, family: string | null): string {
  if (family) return family;
  const source = `${model || ''} ${motorType || ''}`.toLowerCase();
  if (source.includes('proxs') || source.includes('pro xs')) return 'Pro XS';
  if (source.includes('seapro') || source.includes('sea pro')) return 'SeaPro';
  if (source.includes('racing')) return 'Racing';
  if (source.includes('verado')) return 'Verado';
  return 'FourStroke';
}

function publicMotorSlug(motor: MotorRow): string {
  const family = detectFamily(motor.model_display || motor.model, motor.motor_type, motor.family);
  return slugify(`${family}-${motor.horsepower}hp-${motor.model_display || motor.model || ''}`);
}

const MOTOR_SELECT =
  'id, model_key, model_display, model, model_number, mercury_model_no, family, motor_type, horsepower, shaft, shaft_code, start_type, control_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, hero_media_id, hero_image_url, image_url';

export default function MotorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [motor, setMotor] = useState<MotorRow | null>(null);
  const [motorImageUrl, setMotorImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedSlugs, setRelatedSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!motor) { setRelatedSlugs([]); return; }
    let cancelled = false;
    import('@/lib/motor-related-blog-posts')
      .then(({ getMotorRelatedBlogSlugs }) => {
        if (cancelled) return;
        try {
          setRelatedSlugs(getMotorRelatedBlogSlugs({
            hp: motor.horsepower ?? 0,
            model: motor.model ?? undefined,
            model_display: motor.model_display ?? undefined,
            model_number: motor.model_number ?? undefined,
          }));
        } catch (err) {
          console.error('[Related Guides] compute failed:', err);
          setRelatedSlugs([]);
        }
      })
      .catch((err) => {
        console.error('[Related Guides] dynamic import failed:', err);
      });
    return () => { cancelled = true; };
  }, [motor]);

  useEffect(() => {
    if (!slug) {
      navigate('/quote/motor-selection', { replace: true });
      return;
    }
    let cancelled = false;
    const resolve = async () => {
      // Try legacy model_key slugs first, then the public SEO slug used by
      // sitemap, markdown twins, public-motors-api, and motors-md.
      const modelKey = slug.toUpperCase().replace(/-/g, '_');
      let { data } = await supabase
        .from('motor_models')
        .select(MOTOR_SELECT)
        .eq('model_key', modelKey)
        .neq('availability', 'Exclude')
        .limit(1)
        .maybeSingle();

      if (!data) {
        // Fuzzy fallback for legacy slugs
        const { data: fuzzy } = await supabase
          .from('motor_models')
          .select(MOTOR_SELECT)
          .ilike('model_key', `%${modelKey}%`)
          .neq('availability', 'Exclude')
          .limit(1)
          .maybeSingle();
        data = fuzzy;
      }

      if (!data) {
        const { data: candidates } = await supabase
          .from('motor_models')
          .select(MOTOR_SELECT)
          .neq('availability', 'Exclude')
          .order('horsepower', { ascending: true })
          .limit(500);
        data = ((candidates || []) as MotorRow[]).find((candidate) => publicMotorSlug(candidate) === slug) || null;
      }

      // Final fallback: public-motors-api edge function (works for anonymous
      // users when RLS blocks direct SELECT on motor_models).
      if (!data) {
        try {
          const res = await fetch(
            'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api'
          );
          if (res.ok) {
            const json = await res.json();
            const match = (json?.motors || []).find((m: any) => m.slug === slug);
            if (match) {
              data = {
                id: match.id,
                model_key: null,
                model_display: match.modelDisplay,
                model: match.modelDisplay,
                model_number: match.modelNumber,
                mercury_model_no: match.modelNumber,
                family: match.family,
                motor_type: match.motorType,
                horsepower: match.horsepower,
                shaft: match.shaftLength,
                shaft_code: match.shaftLength,
                start_type: null,
                control_type: match.controlType,
                msrp: match.msrp,
                sale_price: match.salePrice,
                dealer_price: match.dealerPrice,
                base_price: null,
                manual_overrides: null,
                availability: match.availability,
                in_stock: match.inStock,
                hero_media_id: null,
                hero_image_url: match.imageUrl,
                image_url: match.imageUrl,
              } as MotorRow;
            }
          }
        } catch (err) {
          console.error('[MotorPage] public-motors-api fallback failed:', err);
        }
      }



      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const resolvedMotor = data as MotorRow;
      const imageInfo = await getMotorImageByPriority(resolvedMotor);
      if (cancelled) return;
      setMotor(resolvedMotor);
      setMotorImageUrl(imageInfo.url);
      setLoading(false);
      trackAgentEvent({
        event_type: 'motor_viewed',
        motor_id: resolvedMotor.id,
        motor_model: resolvedMotor.model_display || resolvedMotor.model || null,
        motor_hp: resolvedMotor.horsepower ?? null,
      });
    };
    resolve();
    return () => { cancelled = true; };
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading motor details…</p>
        </div>
      </div>
    );
  }

  if (notFound || !motor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Motor not found</h1>
          <p className="text-muted-foreground">
            The motor "{slug}" is no longer in our catalog. Browse our full Mercury lineup to find a similar option.
          </p>
          <Button onClick={() => navigate('/quote/motor-selection', { replace: true })}>
            Browse all Mercury motors
          </Button>
        </div>
      </div>
    );
  }

  const display = motor.model_display || motor.model || `Mercury ${motor.horsepower}HP`;
  const family = motor.family || 'FourStroke';
  const hp = motor.horsepower;
  const shaft = motor.shaft_code || motor.shaft || '';
  const modelNo = motor.model_number || motor.mercury_model_no || '';
  const price = resolveSellingPrice(motor);
  const inStock = motor.in_stock || motor.availability === 'In Stock';
  const image = motorImageUrl || motor.hero_image_url || motor.image_url || '/lovable-uploads/speedboat-transparent.png';

  const title = `${display}, Mercury Outboard | Harris Boat Works`;
  const description = `${display} (${hp} HP ${family}${shaft ? `, ${shaft} shaft` : ''}${
    modelNo ? `, model ${modelNo}` : ''
  }). ${price ? `${formatCAD(price)} CAD` : 'Contact for pricing'} · ${
    inStock ? 'In stock' : 'Special order'
  } · Pickup at Gores Landing, ON · Mercury Marine Platinum Dealer · Mercury dealer since 1965.`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.mercuryrepower.ca/motors/${slug}`} />
      </Helmet>
      <MotorPageSEO
        name={display}
        hp={hp}
        family={family}
        shaft={shaft || null}
        startType={motor.start_type}
        controlType={motor.control_type}
        modelNumber={modelNo || null}
        image={image && image !== '/social-share.jpg' && !image.startsWith('/lovable-uploads') ? image : null}
        priceCAD={price || null}
        inStock={inStock}
        url={`https://www.mercuryrepower.ca/motors/${slug}`}
      />

      <article className="min-h-screen bg-repower-paper">
        <RepowerHeader />
        <div className="pt-[64px] lg:pt-[72px]" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:underline">Home</Link>
            {' › '}
            <Link to="/mercury-outboards-ontario" className="hover:underline">Mercury Outboards</Link>
            {' › '}
            <span aria-current="page">{display}</span>
          </nav>

          <header className="mb-6 rounded-2xl border border-border bg-card p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
              <Award className="h-3.5 w-3.5" />
              <span>Mercury Marine Platinum Dealer · Gores Landing, ON</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{display}</h1>
              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                Mercury {family}
              </span>
            </div>
            <p className="text-base md:text-lg text-muted-foreground">
              {hp} HP{shaft ? ` · ${shaft} shaft` : ''}
              {modelNo ? ` · Model ${modelNo}` : ''}
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
              {image && image !== '/social-share.jpg' ? (
                <img src={image} alt={display} className="w-full h-full object-contain" loading="eager" />
              ) : (
                <span className="text-muted-foreground">Image coming soon</span>
              )}
            </div>

            <div className="space-y-4">
              {/* Price + stock + CTA card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-3xl font-bold text-primary leading-tight">
                  {formatCAD(price)}
                  {price ? <span className="text-base font-normal text-muted-foreground"> CAD</span> : null}
                </p>
                <p className={`text-sm font-medium mt-1 ${inStock ? 'text-repower-gold' : 'text-repower-navy-900/55'}`}>
                  {inStock ? '✓ In Stock' : 'Special Order'}
                </p>

                <Button
                  size="lg"
                  className="w-full mt-4"
                  onClick={() => navigate(`/quote/motor-selection?motor=${motor.id}`)}
                >
                  Build a Quote with This Motor
                </Button>

                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Real CAD pricing, no hidden fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Pickup at Gores Landing, ON (no shipping)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>3-year Mercury factory warranty included</span>
                  </li>
                </ul>
              </div>

              {/* Spec table */}
              <div className="rounded-xl border border-border bg-card p-5">
                <table className="w-full text-sm">
                  <caption className="sr-only">Specifications for {display}</caption>
                  <tbody>
                    <tr className="border-b"><th scope="row" className="text-left py-2 pr-4 font-medium">Horsepower</th><td className="py-2">{hp} HP</td></tr>
                    <tr className="border-b"><th scope="row" className="text-left py-2 pr-4 font-medium">Family</th><td className="py-2">Mercury {family}</td></tr>
                    {shaft && <tr className="border-b"><th scope="row" className="text-left py-2 pr-4 font-medium">Shaft</th><td className="py-2">{shaft}</td></tr>}
                    {motor.start_type && <tr className="border-b"><th scope="row" className="text-left py-2 pr-4 font-medium">Start</th><td className="py-2">{motor.start_type}</td></tr>}
                    {motor.control_type && <tr className="border-b"><th scope="row" className="text-left py-2 pr-4 font-medium">Control</th><td className="py-2">{motor.control_type}</td></tr>}
                    {modelNo && <tr className="border-b"><th scope="row" className="text-left py-2 pr-4 font-medium">Model #</th><td className="py-2">{modelNo}</td></tr>}
                    <tr className="border-b"><th scope="row" className="text-left py-2 pr-4 font-medium">Warranty</th><td className="py-2">3-year factory + bonus coverage available (up to 7 years)</td></tr>
                    <tr><th scope="row" className="text-left py-2 pr-4 font-medium">Pickup</th><td className="py-2">Gores Landing, ON (no shipping)</td></tr>
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-muted-foreground italic">
                  Specifications sourced from Mercury Marine official brochures.
                </p>
              </div>
            </div>
          </div>

          {/* Trust strip, verified facts only */}
          <DealerTrustStrip variant="full" className="mb-8" />

          <section className="prose dark:prose-invert max-w-none">
            <h2>About the {display}</h2>
            <p>
              The {display} is a Mercury {family} outboard rated at {hp} HP, sold and serviced by Harris Boat Works on Rice
              Lake, Ontario, Mercury Marine Platinum Dealer · Mercury dealer since 1965 and family-owned since 1947. All Mercury motors
              are sold with full factory warranty, registered to you on pickup at our Gores Landing location. We do not
              ship outboards.
            </p>

            {/* Model-aware AI-answer copy for high-intent Ontario queries */}
            {hp === 9.9 && family.toLowerCase().includes('fourstroke') && (
              <p>
                The Mercury 9.9 FourStroke is the most popular small outboard for Ontario tin boats, cottage tenders,
                and second-motor / kicker setups on Rice Lake and the Kawarthas. Quiet, EFI-equipped, fuel-efficient,
                and easy to lift on and off the transom. Live CAD pricing online, real Ontario stock, pickup only at
                our Gores Landing shop on Rice Lake, Mercury dealer since 1965.
              </p>
            )}
            {hp === 60 && (display.toLowerCase().includes('command thrust') || (motor.model_display || '').toLowerCase().includes('command thrust')) && (
              <p>
                The Mercury 60 ELPT Command Thrust FourStroke is our go-to repower for Ontario aluminum fishing boats
                and lighter pontoons in the 16–18 ft range. The Command Thrust gearcase swings a bigger prop for more
                hole-shot and load-carrying ability, exactly what Rice Lake, Kawartha, and Bay of Quinte boats need.
                Real CAD pricing, in stock at Harris Boat Works, pickup only at Gores Landing. Mercury Platinum Dealer
                since 1965.
              </p>
            )}
            {hp === 150 && family.toLowerCase().includes('proxs') && (
              <p>
                The Mercury 150 Pro XS is the tournament-grade choice for Ontario bass boats and high-performance
                fibreglass, best-in-class hole-shot, top-end, and lightweight 4-cylinder design. Sold with live CAD
                pricing and full factory warranty by Harris Boat Works on Rice Lake, Mercury Marine Platinum Dealer
                since 1965, family-owned since 1947. Pickup only at Gores Landing, Ontario; we do not ship outboards.
              </p>
            )}

            <p>
              Build a real, itemized quote in three minutes, motor, controls, propeller, install, financing, and
              trade-in credit, with live CAD pricing. No forms, no waiting.{' '}
              <Link to={`/quote/motor-selection?motor=${motor.id}`}>Start your quote →</Link>{' '}
              Local to Rice Lake?{' '}
              <Link to="/locations/rice-lake-mercury-repower">See our Rice Lake Mercury repower page →</Link>
            </p>
          </section>

          <RelatedMotorsAndCTA motor={motor} display={display} />

          {/* Related Mercury repower guides — lazy-loaded so blogArticles never enters the motor bundle */}
          {relatedSlugs.length > 0 && (
            <section className="mt-10 border-t border-gray-100 pt-8">
              <h2 className="font-display text-xl font-bold text-repower-navy-900 md:text-2xl mb-4">
                Related Mercury repower guides
              </h2>
              <Suspense fallback={null}>
                <RelatedPostsGrid slugs={relatedSlugs} hideHeader />
              </Suspense>
            </section>
          )}

        </div>

        {/* NOTE: No page-local sticky bottom CTA, the global UnifiedMobileBar
            already provides a contextual mobile bottom action across the app. */}
      </article>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Motors + secondary CTA + Rice Lake link card               */
/*  Rendered only for the three high-intent AI-answer target motors:   */
/*    - 9.9 FourStroke ELH                                             */
/*    - 60 Command Thrust ELPT                                         */
/*    - 150 Pro XS ELPT                                                */
/* ------------------------------------------------------------------ */

interface TargetConfig {
  highlights: string[];
  related: Array<{ slug: string; label: string; note: string }>;
}

function getTargetConfig(motor: MotorRow, display: string): TargetConfig | null {
  const hp = motor.horsepower;
  const family = (motor.family || '').toLowerCase();
  const displayLc = display.toLowerCase();
  const modelDisplayLc = (motor.model_display || '').toLowerCase();

  if (hp === 9.9 && family.includes('fourstroke')) {
    return {
      highlights: ['EFI fuel injection', 'Tiller-friendly', '~84 lb'],
      related: [
        { slug: 'fourstroke-9-9hp-9-9mh-fourstroke', label: '9.9 MH FourStroke', note: 'Manual-start, lighter sibling' },
        { slug: 'fourstroke-9-9hp-9-9eh-fourstroke', label: '9.9 EH FourStroke', note: 'Electric-start tiller' },
        { slug: 'fourstroke-15hp-15-mh-fourstroke', label: '15 MH FourStroke', note: 'Step-up portable, same footprint' },
      ],
    };
  }

  if (
    hp === 60 &&
    (displayLc.includes('command thrust') || modelDisplayLc.includes('command thrust'))
  ) {
    return {
      highlights: ['Big-prop Command Thrust gearcase', 'Power trim & tilt', 'Best for 16–18 ft'],
      related: [
        { slug: 'fourstroke-50hp-50-elpt-fourstroke', label: '50 ELPT FourStroke', note: 'Lighter mid-range option' },
        { slug: 'fourstroke-90hp-90-elpt-command-thrust-fourstroke', label: '90 ELPT Command Thrust', note: 'More power, same gearcase advantage' },
        { slug: 'fourstroke-115hp-115elpt-fourstroke', label: '115 ELPT FourStroke', note: 'Step-up for heavier pontoons' },
      ],
    };
  }

  if (hp === 150 && family.includes('proxs')) {
    return {
      highlights: ['3.0L 4-cylinder', '6300 RPM redline', 'Tournament-grade hole-shot'],
      related: [
        { slug: 'proxs-150hp-150-exlpt-proxs', label: '150 EXLPT Pro XS', note: 'Same motor, XL (25") shaft' },
        { slug: 'proxs-115hp-115-elpt-proxs', label: '115 ELPT Pro XS', note: 'Lighter Pro XS sibling' },
        { slug: 'proxs-200hp-200-elpt-proxs', label: '200 ELPT Pro XS', note: 'V6 step-up for big bass rigs' },
      ],
    };
  }

  return null;
}

function RelatedMotorsAndCTA({ motor, display }: { motor: MotorRow; display: string }) {
  const config = getTargetConfig(motor, display);
  if (!config) return null;

  const hp = motor.horsepower;

  return (
    <aside
      aria-labelledby="motor-related-heading"
      className="mt-12 border-t border-border pt-10"
    >
      <h2 id="motor-related-heading" className="sr-only">
        Build a quote, Rice Lake info, and related Mercury motors
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1, Build a Quote (primary CTA) */}
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Build your Mercury {hp} HP quote online
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Live CAD pricing. Pickup-only at Gores Landing, ON. About three minutes, no phone call required.
          </p>
          <ul className="flex flex-wrap gap-2 mb-5">
            {config.highlights.map((h) => (
              <li
                key={h}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-background border border-border text-foreground"
              >
                {h}
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-auto w-full">
            <Link to={`/quote/motor-selection?motor=${motor.id}`}>
              Get a quote online →
            </Link>
          </Button>
        </div>

        {/* Card 2, Rice Lake repower context */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Repowering on Rice Lake?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            We're 90 minutes east of Toronto via the 401, 35 minutes south of Peterborough, Mercury Marine Platinum
            Dealer since 1965, family-owned in Gores Landing since 1947. Pickup only.
          </p>
          <Button asChild variant="outline" className="mt-auto w-full">
            <Link to="/locations/rice-lake-mercury-repower">
              About our Rice Lake location →
            </Link>
          </Button>
        </div>

        {/* Card 3, Related motors */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Related Mercury motors
          </h3>
          <ul className="space-y-3 text-sm">
            {config.related.map((r) => (
              <li key={r.slug}>
                <Link
                  to={`/motors/${r.slug}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {r.label} →
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{r.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
