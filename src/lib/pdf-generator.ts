import { supabase } from '@/integrations/supabase/client';

export interface PdfQuoteData {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  motor: {
    model: string;
    hp: number;
    year?: number;
    sku?: string;
  };
  pricing: {
    msrp: number;
    discount: number;
    promoValue: number;
    subtotal: number;
    tradeInValue?: number;
    subtotalAfterTrade: number;
    hst: number;
    totalCashPrice: number;
    savings: number;
  };
  specs?: Array<{ label: string; value: string }>;
  financing?: {
    monthlyPayment: number;
    term: number;
    rate: number;
  };
}

export const generateQuotePDF = async (quoteData: PdfQuoteData): Promise<string> => {
  try {
    // Call the Supabase edge function to generate PDF
    const { data, error } = await supabase.functions.invoke('generate-professional-pdf', {
      body: { quoteData }
    });

    if (error) {
      console.error('PDF Generation Error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }

    if (!data?.success || !data?.pdfUrl) {
      throw new Error('PDF generation failed - no URL returned');
    }

    return data.pdfUrl;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`Failed to generate professional PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const downloadPDF = (pdfUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};