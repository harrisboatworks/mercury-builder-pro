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

export const downloadPDF = async (pdfUrl: string, filename: string) => {
  console.log('📥 Attempting to download PDF:', { pdfUrl, filename });
  
  try {
    // Method 1: Try direct download with link element
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    
    // Add a small delay to ensure the element is in the DOM
    setTimeout(() => {
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    }, 10);
    
    console.log('✅ PDF download triggered via link element');
    
    // Fallback: If download attribute doesn't work, open in new tab
    setTimeout(() => {
      window.open(pdfUrl, '_blank');
      console.log('📋 PDF opened in new tab as fallback');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Download failed, trying fallback:', error);
    
    // Fallback method: Open in new window/tab
    try {
      window.open(pdfUrl, '_blank');
      console.log('✅ PDF opened in new tab (fallback method)');
    } catch (fallbackError) {
      console.error('❌ All download methods failed:', fallbackError);
      
      // Last resort: Copy URL to clipboard and show user
      try {
        await navigator.clipboard.writeText(pdfUrl);
        alert(`Download failed. PDF URL copied to clipboard:\n${pdfUrl}`);
      } catch (clipboardError) {
        alert(`Download failed. Please copy this URL manually:\n${pdfUrl}`);
      }
    }
  }
};