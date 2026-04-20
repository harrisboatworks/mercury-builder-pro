// Public, read-only motor inventory feed for AI agents and external integrations.
// CORS-open, no-auth. Cached 5 minutes at the edge.
// Pricing hierarchy: manual_overrides.sale → manual_overrides.base → sale_price → dealer_price → msrp → base_price
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SITE_URL = 'https://mercuryrepower.ca';

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function detectFamily(model: string, motorType: string, family: string | null): string {
  if (family) return family;
  const m = (model || '').toLowerCase();
  if (m.includes('proxs') || m.includes('pro xs')) return 'Pro XS';
  if (m.includes('seapro') || m.includes('sea pro')) return 'SeaPro';
  if (m.includes('racing')) return 'Racing';
  if (m.includes('verado')) return 'Verado';
  return 'FourStroke';
}

function resolveSellingPrice(motor: any): number | null {
  const overrides = motor.manual_overrides || {};
  const candidates = [
    overrides.sale_price,
    overrides.base_price,
    motor.sale_price,
    motor.dealer_price,
    motor.msrp,
    motor.base_price,
  ];
  for (const v of candidates) {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n === 'number' && !isNaN(n) && n > 0) return n;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch active, non-Verado motors
    const { data, error } = await supabase
      .from('motor_models')
      .select(
        'id, model, model_display, model_number, family, horsepower, shaft, shaft_code, control_type, motor_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, image_url, hero_image_url, is_brochure'
      )
      .neq('availability', 'Exclude')
      .order('horsepower', { ascending: true })
      .limit(500);

    if (error) {
      console.error('[public-motors-api] DB error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const motors = (data || [])
      .filter((m) => {
        // Exclude Verado per company policy
        const display = (m.model_display || m.model || '').toLowerCase();
        if (display.includes('verado')) return false;
        return true;
      })
      .map((m) => {
        const family = detectFamily(m.model_display || m.model, m.motor_type, m.family);
        const sellingPrice = resolveSellingPrice(m);
        const slug = slugify(`${family}-${m.horsepower}hp-${m.model_display || m.model}`);
        return {
          id: m.id,
          slug,
          modelDisplay: m.model_display || m.model,
          modelNumber: m.model_number || null,
          family,
          horsepower: m.horsepower,
          shaftLength: m.shaft_code || m.shaft || null,
          controlType: m.control_type || null,
          motorType: m.motor_type,
          msrp: m.msrp,
          salePrice: m.sale_price,
          dealerPrice: m.dealer_price,
          sellingPrice,
          currency: 'CAD',
          availability: m.availability || (m.in_stock ? 'In Stock' : 'Special Order'),
          inStock: !!m.in_stock,
          imageUrl: m.hero_image_url || m.image_url || null,
          url: `${SITE_URL}/motors/${slug}`,
        };
      });

    const body = {
      site: 'mercuryrepower.ca',
      currency: 'CAD',
      lastUpdated: now.toISOString(),
      priceValidUntil: validUntil.toISOString(),
      count: motors.length,
      docs: `${SITE_URL}/agents`,
      brand: `${SITE_URL}/.well-known/brand.json`,
      notice:
        'Read-only public feed. Prices in CAD. Final out-the-door price requires human confirmation. Pickup only at Gores Landing, ON. We do not sell or service Mercury Verado.',
      motors,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    console.error('[public-motors-api] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
