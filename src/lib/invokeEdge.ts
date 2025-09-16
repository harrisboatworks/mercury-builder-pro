import { supabase } from '@/integrations/supabase/client';

export async function invokePricelist(body: any) {
  try {
    const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (error) {
      // Bubble up useful fields
      return { 
        success: false, 
        step: error?.context?.step || 'invoke', 
        error: error.message || 'invoke_failed', 
        detail: JSON.stringify(error) 
      };
    }
    
    return data;
  } catch (e: any) {
    return { 
      success: false, 
      step: 'network', 
      error: e?.message || 'network_failed' 
    };
  }
}