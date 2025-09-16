import { supabase } from '@/integrations/supabase/client';

export async function invokePricelist(body: any) {
  try {
    console.log('Invoking seed-from-pricelist with:', body);
    
    const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log('Function response:', { data, error });
    
    if (error) {
      console.error('Supabase function error:', error);
      const msg = error.message || 'invoke_failed';
      const status = error.status || 500;
      const step = error?.context?.step || 'invoke';
      throw new Error(`(status ${status}, step ${step}) ${msg}`);
    }
    
    // Handle non-2xx responses with detailed error information
    if (data && !data.ok) {
      console.error('Function returned error response:', data);
      const msg = data.error || data.message || 'Unknown error';
      const step = data.step || 'unknown';
      const status = data.status || 500;
      throw new Error(`(status ${status}, step ${step}) ${msg}`);
    }
    
    // Ensure we return a consistent response structure for successful calls
    if (!data) {
      throw new Error('(status 500, step response) Empty response from function');
    }
    
    return data;
  } catch (e: any) {
    console.error('Network/client error:', e);
    // Re-throw with consistent format if not already formatted
    if (e.message && e.message.includes('(status')) {
      throw e;
    }
    throw new Error(`(status 0, step network) ${e?.message || 'network_failed'}`);
  }
}