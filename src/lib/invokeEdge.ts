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
      // Bubble up useful fields
      return { 
        success: false, 
        step: error?.context?.step || 'invoke', 
        error: error.message || 'invoke_failed', 
        detail: `Supabase error: ${JSON.stringify(error)}` 
      };
    }
    
    // Ensure we return a consistent response structure
    if (!data) {
      return {
        success: false,
        step: 'response',
        error: 'Empty response from function',
        detail: 'Function returned null/undefined data'
      };
    }
    
    return data;
  } catch (e: any) {
    console.error('Network/client error:', e);
    return { 
      success: false, 
      step: 'network', 
      error: e?.message || 'network_failed',
      detail: `Client error: ${e?.stack || e}`
    };
  }
}