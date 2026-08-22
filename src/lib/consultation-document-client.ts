import { supabase } from '@/integrations/supabase/client';

export type ConsultationDocumentFlow = 'submit' | 'send_email' | 'send_sms';

export interface ConsultationDocumentMeta {
  flow: ConsultationDocumentFlow;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  motorModel: string;
  totalPrice: number;
  customerQuoteId?: string | null;
}

export async function uploadConsultationDocument(
  meta: ConsultationDocumentMeta,
  pdfBlob: Blob,
): Promise<string> {
  const form = new FormData();
  form.append('meta', JSON.stringify(meta));
  form.append('pdf', pdfBlob, 'quote.pdf');

  const { data, error } = await supabase.functions.invoke('consultation-document-api', {
    body: form,
  });

  if (error || data?.success !== true || typeof data?.documentId !== 'string') {
    throw new Error('Unable to deliver the consultation document');
  }
  return data.documentId;
}

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
