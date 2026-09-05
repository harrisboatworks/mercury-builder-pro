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

export async function adminConsultationDocument(quoteId: string, action: 'admin-download' | 'admin-share' | 'admin-email') {
  const { data, error } = await supabase.functions.invoke('admin-consultation-document', { body: { action, quoteId } });
  if (error || data?.error) throw new Error(data?.error || 'The original quote document is unavailable.');
  if (action === 'admin-download' && typeof data?.signedUrl !== 'string') throw new Error('The original quote document is unavailable.');
  if (action === 'admin-share' && typeof data?.documentAccessUrl !== 'string') throw new Error('Could not create a private quote link.');
  if (action === 'admin-email' && data?.success !== true) throw new Error('Quote email could not be sent.');
  return data;
}
