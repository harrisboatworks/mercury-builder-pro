import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Locally API base URL
const LOCALLY_API_BASE = "https://www.locally.com";

// Harris Boat Works location for geo queries
const HARRIS_LOCATION = {
  lat: "44.2619", // Burlington, Ontario approximate
  lng: "-79.7893",
};

interface LocallyParams {
  action?: 'discover' | 'search' | 'store_data';
  query?: string;
  upc?: string;
  part_number?: string;
  company_id?: number;
  store_id?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOCALLY_API_KEY = Deno.env.get('LOCALLY_API_KEY');
    if (!LOCALLY_API_KEY) {
      console.error('[Locally] API key not configured');
      return new Response(
        JSON.stringify({ error: 'Locally API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params: LocallyParams = await req.json();
    
    console.log('[Locally] Request:', params);

    const headers = {
      'Locally-Api-Token': LOCALLY_API_KEY,
      'Accept': 'application/json',
    };

    // Action: discover - Try to find company/store info associated with API key
    if (params.action === 'discover') {
      // Try multiple discovery endpoints to find our company/store info
      const results: Record<string, any> = {};
      
      // 1. Try the conversion start endpoint (requires some default values)
      try {
        const startUrl = `${LOCALLY_API_BASE}/headless/api/1.0/conversion/start?style=test&company_id=1`;
        const response = await fetch(startUrl, { headers });
        const text = await response.text();
        results.start = { status: response.status, body: text.substring(0, 500) };
      } catch (e) {
        results.start = { error: String(e) };
      }

      // 2. Try store_data with location-based search
      try {
        const storeDataUrl = `${LOCALLY_API_BASE}/headless/api/1.0/conversion/store_data?` +
          `map_distance_unit=mi&map_distance_diag=50&` +
          `map_center_lat=${HARRIS_LOCATION.lat}&map_center_lng=${HARRIS_LOCATION.lng}`;
        console.log('[Locally] Trying store_data URL:', storeDataUrl);
        const response = await fetch(storeDataUrl, { headers });
        const text = await response.text();
        results.store_data = { status: response.status, body: text.substring(0, 2000) };
      } catch (e) {
        results.store_data = { error: String(e) };
      }

      // 3. Try v2 brand API to see what brands we have access to
      try {
        const brandsUrl = `${LOCALLY_API_BASE}/api/v2/brands`;
        const response = await fetch(brandsUrl, { headers });
        const text = await response.text();
        results.brands = { status: response.status, body: text.substring(0, 1000) };
      } catch (e) {
        results.brands = { error: String(e) };
      }

      return new Response(
        JSON.stringify({ success: true, discovery: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Standard inventory lookup
    // Build the store_data URL with required parameters
    const urlParams = new URLSearchParams({
      map_distance_unit: 'mi',
      map_distance_diag: params.store_id ? '1' : '50',
    });

    // Add location or store_id
    if (params.store_id) {
      urlParams.set('only_store_id', String(params.store_id));
    } else {
      urlParams.set('map_center_lat', HARRIS_LOCATION.lat);
      urlParams.set('map_center_lng', HARRIS_LOCATION.lng);
    }

    // Add company_id if provided
    if (params.company_id) {
      urlParams.set('company_id', String(params.company_id));
    }

    // Add UPC if searching by UPC
    if (params.upc) {
      urlParams.set('upc', params.upc);
    }

    const searchUrl = `${LOCALLY_API_BASE}/headless/api/1.0/conversion/store_data?${urlParams.toString()}`;
    console.log('[Locally] Search URL:', searchUrl);

    const response = await fetch(searchUrl, { headers });
    const responseText = await response.text();
    
    console.log('[Locally] Response status:', response.status);
    console.log('[Locally] Response preview:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON response',
          status: response.status,
          raw: responseText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for API errors
    if (data.success === false) {
      console.log('[Locally] API returned error:', data.msg);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.msg || 'API error',
          error_code: data.error_code,
          query: params.query || params.upc || params.part_number,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process successful response
    const inventory = extractInventoryInfo(data, params.query || params.upc || '');

    return new Response(
      JSON.stringify({ 
        success: true, 
        query: params.query || params.upc || params.part_number,
        inventory,
        raw_data: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Locally] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to extract inventory info from Locally response
function extractInventoryInfo(data: any, searchTerm: string): any {
  if (!data?.data) return null;

  const stores = data.data.stores || [];
  const products: any[] = [];

  for (const store of stores) {
    if (store.in_stock_upcs && Array.isArray(store.in_stock_upcs)) {
      for (const item of store.in_stock_upcs) {
        products.push({
          upc: item.upc,
          product_id: item.product_id,
          product_url: item.product_url,
          store_id: store.store_id,
          store_name: store.name,
          in_stock: true,
        });
      }
    }
  }

  // If there's a products array at the top level
  if (data.data.products && Array.isArray(data.data.products)) {
    for (const p of data.data.products) {
      products.push({
        name: p.name || p.title,
        upc: p.upc,
        price: p.price,
        in_stock: p.in_stock ?? true,
        quantity: p.quantity,
      });
    }
  }

  return {
    stores_count: stores.length,
    stores: stores.map((s: any) => ({
      store_id: s.store_id,
      name: s.name,
      address: s.address,
      city: s.city,
      state: s.state,
      phone: s.phone,
    })),
    products,
  };
}
