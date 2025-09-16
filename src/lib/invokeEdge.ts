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
      // Enhanced error handling with status and step information
      return { 
        success: false,
        ok: false,
        step: error?.context?.step || 'invoke', 
        error: error.message || 'invoke_failed', 
        status: error.status || 500,
        details: {
          supabase_error: error,
          raw_response: data
        }
      };
    }
    
    // Handle non-2xx responses with detailed error information
    if (data && !data.ok && !data.success) {
      console.error('Function returned error response:', data);
      return {
        ...data, // includes ok: false, step, error, stack, details
        status: data.status || 500
      };
    }
    
    // Ensure we return a consistent response structure for successful calls
    if (!data) {
      return {
        success: false,
        ok: false,
        step: 'response',
        error: 'Empty response from function',
        status: 500,
        details: { raw_response: null }
      };
    }
    
    return data;
  } catch (e: any) {
    console.error('Network/client error:', e);
    return { 
      success: false,
      ok: false, 
      step: 'network', 
      error: e?.message || 'network_failed',
      status: 0,
      details: {
        client_error: e,
        stack: e?.stack
      }
    };
  }
}