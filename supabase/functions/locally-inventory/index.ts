import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Locally API base URL
const LOCALLY_API_BASE = "https://www.locally.com";

// Harris Boat Works store configuration
const HARRIS_STORE = {
  store_id: 422544,
  lat: "43.3255",
  lng: "-79.7990",
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
      const results: Record<string, any> = {};
      
      // 1. Try the conversion start endpoint
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
          `map_center_lat=${HARRIS_STORE.lat}&map_center_lng=${HARRIS_STORE.lng}`;
        console.log('[Locally] Trying store_data URL:', storeDataUrl);
        const response = await fetch(storeDataUrl, { headers });
        const text = await response.text();
        results.store_data = { status: response.status, body: text.substring(0, 2000) };
      } catch (e) {
        results.store_data = { error: String(e) };
      }

      // 3. Try v2 brand API
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

    // Standard inventory lookup - build the store_data URL
    const urlParams = new URLSearchParams({
      map_distance_unit: 'mi',
      map_distance_diag: '1',
      only_store_id: String(HARRIS_STORE.store_id),
    });

    // Add company_id if provided
    if (params.company_id) {
      urlParams.set('company_id', String(params.company_id));
    }

    // Add UPC if searching by UPC
    if (params.upc) {
      urlParams.set('upc', params.upc);
    }

    // If searching by part number, we can try adding it as a query or UPC
    // Mercury part numbers sometimes work as UPCs with leading zeros
    if (params.part_number && !params.upc) {
      // Try the part number as-is first (some systems use part numbers directly)
      urlParams.set('upc', params.part_number);
    }

    // If searching by query string
    if (params.query) {
      urlParams.set('query', params.query);
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
          error_code: data.error_code || 'api_error',
          query: params.query || params.upc || params.part_number,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process successful response
    const inventory = extractInventoryInfo(data, params.query || params.upc || params.part_number || '');

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
    // Extract fulfillment options from store
    const fulfillment = {
      bopis: store.bopis ?? false,
      local_delivery: store.local_delivery ?? false,
      same_day_delivery: store.same_day_delivery ?? false,
      curbside_pickup: store.curbside_pickup ?? false,
    };

    if (store.in_stock_upcs && Array.isArray(store.in_stock_upcs)) {
      for (const item of store.in_stock_upcs) {
        products.push({
          upc: item.upc,
          product_id: item.product_id,
          product_url: item.product_url,
          store_id: store.store_id,
          store_name: store.name,
          in_stock: true,
          price: item.price || null,
          quantity: item.qoh ?? item.quantity ?? null, // qoh = quantity on hand
          stock_status: item.stock_status || 'in_stock',
          fulfillment,
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
        quantity: p.qoh ?? p.quantity ?? null,
        stock_status: p.stock_status || (p.in_stock ? 'in_stock' : 'out_of_stock'),
        fulfillment: {
          bopis: p.bopis ?? false,
          local_delivery: p.local_delivery ?? false,
          same_day_delivery: p.same_day_delivery ?? false,
          curbside_pickup: p.curbside_pickup ?? false,
        },
      });
    }
  }

  // Extract store-level fulfillment for display
  const storeFulfillment = stores.length > 0 ? {
    bopis: stores[0].bopis ?? false,
    local_delivery: stores[0].local_delivery ?? false,
    same_day_delivery: stores[0].same_day_delivery ?? false,
    curbside_pickup: stores[0].curbside_pickup ?? false,
    store_hours: stores[0].store_hours || null,
  } : null;

  return {
    stores_count: stores.length,
    stores: stores.map((s: any) => ({
      store_id: s.store_id,
      name: s.name,
      address: s.address,
      city: s.city,
      state: s.state,
      phone: s.phone,
      bopis: s.bopis,
      local_delivery: s.local_delivery,
    })),
    products,
    fulfillment: storeFulfillment,
    search_term: searchTerm,
    checked_at: new Date().toISOString(),
  };
}
