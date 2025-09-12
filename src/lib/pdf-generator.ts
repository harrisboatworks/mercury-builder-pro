import { supabase } from '@/integrations/supabase/client';

export interface PdfQuoteData {
  quoteNumber: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  motor: {
    model: string;
    hp: number;
    year?: number;
    sku?: string;
    category?: string;
  };
  motorSpecs?: {
    cylinders?: string;
    displacement?: string;
    weight_kg?: number;
    fuel_system?: string;
    starting?: string;
    alternator?: string;
    gear_ratio?: string;
    max_rpm?: string;
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
  accessories?: Array<{ name: string; price: number }>;
  specs?: Array<{ label: string; value: string }>;
  financing?: {
    monthlyPayment: number;
    term: number;
    rate: number;
  };
  customerReview?: {
    comment: string;
    reviewer: string;
    location: string;
    rating: number;
  };
}

export const generateQuotePDF = async (quoteData: PdfQuoteData): Promise<string> => {
  try {
    console.log('🔄 Generating PDF with data:', { 
      quoteNumber: quoteData.quoteNumber, 
      motorModel: quoteData.motor.model,
      customerName: quoteData.customerName 
    });

    // Call the Supabase edge function to generate PDF
    const { data, error } = await supabase.functions.invoke('generate-professional-pdf', {
      body: { quoteData }
    });

    // Handle Supabase function errors
    if (error) {
      console.error('📛 PDF Generation Supabase Error:', error);
      throw new Error(`Failed to generate PDF: ${error.message || 'Unknown Supabase error'}`);
    }

    // Handle API response errors
    if (data?.error) {
      console.error('📛 PDF.co API Error:', data);
      throw new Error(data.message || data.error || 'PDF generation service failed');
    }

    // Check for successful response with URL
    if (!data?.success) {
      console.error('📛 PDF Generation Failed - No Success Flag:', data);
      throw new Error('PDF generation failed - service returned unsuccessful response');
    }

    if (!data.pdfUrl && !data.url) {
      console.error('📛 PDF Generation Failed - No URL:', data);
      throw new Error('PDF generation failed - no URL returned from service');
    }

    // Return the PDF URL (handle both possible response formats)
    const pdfUrl = data.pdfUrl || data.url;
    console.log('✅ PDF Generated Successfully:', { url: pdfUrl });
    
    return pdfUrl;

  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    
    // Re-throw with more specific error message
    if (error instanceof Error) {
      throw new Error(`PDF Generation Failed: ${error.message}`);
    } else {
      throw new Error(`PDF Generation Failed: Unknown error occurred`);
    }
  }
};

export const downloadPDF = async (pdfUrl: string, filename: string) => {
  // Simple approach - just open in new tab
  window.open(pdfUrl, '_blank');
};