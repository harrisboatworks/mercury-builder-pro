import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from '@/lib/helmet';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackAgentEvent } from '@/lib/agentEvents';

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
 * MotorRedirect, it does NOT auto-redirect — that broke the prerendered
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
  horsepower: number | null;
  shaft: string | null;
  shaft_code: string | null;
  start_type: string | null;
  control_type: string | null;
  msrp: number | null;
  sale_price: number | null;
  dealer_price: number | null;
  base_price: number | null;
  manual_overrides: Record<string, any> | null;
  availability: string | null;
  in_stock: boolean | null;
  hero_image_url: string | null;
  image_url: string | null;
}

function resolveSellingPrice(m: MotorRow): number | null {
  const overrides = m.manual_overrides || {};
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

export default function MotorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [motor, setMotor] = useState<MotorRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      navigate('/quote/motor-selection', { replace: true });
      return;
    }
    let cancelled = false;
    const resolve = async () => {
      // Try canonical model_key match first (slug = model_key.toLowerCase().replace(/_/g, '-'))
      const modelKey = slug.toUpperCase().replace(/-/g, '_');
      let { data } = await supabase
        .from('motor_models')
        .select(
          'id, model_key, model_display, model, model_number, mercury_model_no, family, horsepower, shaft, shaft_code, start_type, control_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, hero_image_url, image_url'
        )
        .eq('model_key', modelKey)
        .limit(1)
        .maybeSingle();

      if (!data) {
        // Fuzzy fallback for legacy slugs
        const { data: fuzzy } = await supabase
          .from('motor_models')
          .select(
            'id, model_key, model_display, model, model_number, mercury_model_no, family, horsepower, shaft, shaft_code, start_type, control_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, hero_image_url, image_url'
          )
          .ilike('model_key', `%${modelKey}%`)
          .limit(1)
          .maybeSingle();
        data = fuzzy;
      }

      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setMotor(data as MotorRow);
      setLoading(false);
      trackAgentEvent({
        event_type: 'motor_viewed',
        motor_id: (data as MotorRow).id,
        motor_model: (data as MotorRow).model_display || (data as MotorRow).model || null,
        motor_hp: (data as MotorRow).horsepower ?? null,
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
  const image = motor.hero_image_url || motor.image_url || '/social-share.jpg';

  const title = `${display} — Mercury Outboard | Harris Boat Works`;
  const description = `${display} (${hp} HP ${family}${shaft ? `, ${shaft} shaft` : ''}${
    modelNo ? `, model ${modelNo}` : ''
  }). ${price ? `${formatCAD(price)} CAD` : 'Contact for pricing'} · ${
    inStock ? 'In stock' : 'Special order'
  } · Pickup at Gores Landing, ON · Mercury Marine Platinum Dealer since 1965.`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.mercuryrepower.ca/motors/${slug}`} />
      </Helmet>

      <article className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:underline">Home</Link>
            {' › '}
            <Link to="/mercury-outboards-ontario" className="hover:underline">Mercury Outboards</Link>
            {' › '}
            <span>{display}</span>
          </nav>

          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{display}</h1>
            <p className="text-lg text-muted-foreground">
              Mercury {family} · {hp} HP{shaft ? ` · ${shaft} shaft` : ''}
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
              <div>
                <p className="text-3xl font-bold text-primary">
                  {formatCAD(price)}
                  {price ? <span className="text-base font-normal text-muted-foreground"> CAD</span> : null}
                </p>
                <p className={`text-sm font-medium ${inStock ? 'text-green-600' : 'text-amber-600'}`}>
                  {inStock ? '✓ In Stock' : 'Special Order'}
                </p>
              </div>

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

              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate(`/quote/motor-selection?motor=${motor.id}`)}
              >
                Build a Quote with This Motor
              </Button>
            </div>
          </div>

          <section className="prose dark:prose-invert max-w-none">
            <h2>About the {display}</h2>
            <p>
              The {display} is a Mercury {family} outboard rated at {hp} HP, sold and serviced by Harris Boat Works on Rice
              Lake, Ontario — Mercury Marine Platinum Dealer since 1965 and family-owned since 1947. All Mercury motors
              are sold with full factory warranty, registered to you on pickup at our Gores Landing location. We do not
              ship outboards.
            </p>

            {/* Model-aware AI-answer copy for high-intent Ontario queries */}
            {hp === 9.9 && family.toLowerCase().includes('fourstroke') && (
              <p>
                The Mercury 9.9 FourStroke is the most popular small outboard for Ontario tin boats, cottage tenders,
                and second-motor / kicker setups on Rice Lake and the Kawarthas. Quiet, EFI-equipped, fuel-efficient,
                and easy to lift on and off the transom. Live CAD pricing online, real Ontario stock, pickup only at
                our Gores Landing shop on Rice Lake — Mercury dealer since 1965.
              </p>
            )}
            {hp === 60 && (display.toLowerCase().includes('command thrust') || (motor.model_display || '').toLowerCase().includes('command thrust')) && (
              <p>
                The Mercury 60 ELPT Command Thrust FourStroke is our go-to repower for Ontario aluminum fishing boats
                and lighter pontoons in the 16–18 ft range. The Command Thrust gearcase swings a bigger prop for more
                hole-shot and load-carrying ability — exactly what Rice Lake, Kawartha, and Bay of Quinte boats need.
                Real CAD pricing, in stock at Harris Boat Works, pickup only at Gores Landing. Mercury Platinum Dealer
                since 1965.
              </p>
            )}
            {hp === 150 && family.toLowerCase().includes('proxs') && (
              <p>
                The Mercury 150 Pro XS is the tournament-grade choice for Ontario bass boats and high-performance
                fibreglass — best-in-class hole-shot, top-end, and lightweight 4-cylinder design. Sold with live CAD
                pricing and full factory warranty by Harris Boat Works on Rice Lake — Mercury Marine Platinum Dealer
                since 1965, family-owned since 1947. Pickup only at Gores Landing, Ontario; we do not ship outboards.
              </p>
            )}

            <p>
              Build a real, itemized quote in three minutes — motor, controls, propeller, install, financing, and
              trade-in credit — with live CAD pricing. No forms, no waiting.{' '}
              <Link to={`/quote/motor-selection?motor=${motor.id}`}>Start your quote →</Link>{' '}
              Local to Rice Lake?{' '}
              <Link to="/locations/rice-lake-mercury-repower">See our Rice Lake Mercury repower page →</Link>
            </p>
          </section>
        </div>
      </article>
    </>
  );
}
