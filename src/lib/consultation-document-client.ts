import { supabase } from '@/integrations/supabase/client';

export async function redeemConsultationDocument(token: string): Promise<{
  signedUrl: string;
  expiresIn: number;
}> {
  const { data, error } = await supabase.functions.invoke('consultation-document-api', {
    body: { action: 'redeem', token },
  });
  if (error || typeof data?.signedUrl !== 'string' || typeof data?.expiresIn !== 'number') {
    throw new Error('Not found');
  }
  return { signedUrl: data.signedUrl, expiresIn: data.expiresIn };
}
