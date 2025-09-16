import { supabase } from '@/integrations/supabase/client';

export async function invokePricelist(body: any) {
  // Construct the edge function URL
  const supabaseUrl = 'https://eutsoqdpjurknjsshxes.supabase.co';
  const functionUrl = `${supabaseUrl}/functions/v1/seed-from-pricelist`;
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU';

  try {
    console.log(`Invoking edge function at: ${functionUrl}`);
    console.log('Request payload:', body);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify(body),
    });

    console.log(`Function response status: ${response.status} ${response.statusText}`);
    
    let data: any;
    try {
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (responseText) {
        data = JSON.parse(responseText);
      } else {
        data = null;
      }
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error(`(status ${response.status}, step parse_response) Invalid JSON response from edge function`);
    }

    // Handle non-2xx HTTP responses
    if (!response.ok) {
      console.error('HTTP error response:', { status: response.status, statusText: response.statusText, data });
      const errorMsg = data?.error || data?.message || response.statusText || 'HTTP request failed';
      const step = data?.step || 'http_response';
      throw new Error(`(status ${response.status}, step ${step}) ${errorMsg}`);
    }
    
    // Handle function-level errors (successful HTTP but function returned error)
    if (data && !data.ok && !data.success) {
      console.error('Function returned error response:', data);
      const msg = data.error || data.message || 'Function returned error';
      const step = data.step || 'function_error';
      const status = data.status || response.status;
      throw new Error(`(status ${status}, step ${step}) ${msg}`);
    }
    
    // Ensure we return a consistent response structure for successful calls
    if (!data) {
      throw new Error(`(status ${response.status}, step response) Empty response from edge function`);
    }
    
    console.log('Successfully received function response:', data);
    return data;
    
  } catch (e: any) {
    console.error('Edge function invocation failed:', e);
    
    // Re-throw with consistent format if not already formatted
    if (e.message && e.message.includes('(status')) {
      throw e;
    }
    
    // Network/fetch errors
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error(`(status 0, step network) Failed to reach edge function at ${functionUrl}: ${e.message}`);
    }
    
    // Other errors
    throw new Error(`(status 0, step network) ${e?.message || 'network_failed'}`);
  }
}