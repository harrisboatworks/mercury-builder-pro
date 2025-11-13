// Simplified PDF generator - Quote PDFs still use this
// Motor spec sheets now use server-side generation via edge function
import { supabase } from '@/integrations/supabase/client';
import { pdf } from '@react-pdf/renderer';
import ProfessionalQuotePDF from '@/components/quote-pdf/ProfessionalQuotePDF';

export interface ReactPdfQuoteData {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  motor?: any;
  package?: {
    name?: string;
    id?: string;
    label?: string;
    description?: string;
  };
  selectedPackage?: {
    id: string;
    label: string;
    coverageYears: number;
    features: string[];
  };
  accessories?: Array<{
    name: string;
    price: number;
  }>;
  accessoryBreakdown?: any[];
  warranty?: {
    years: number;
    price: number;
  };
  installation?: {
    type: string;
    price: number;
  };
  includesInstallation?: boolean;
  tradeInValue?: any;
  tradeInInfo?: any;
  subtotal?: number;
  hst?: number;
  total?: number;
  specs?: Array<{
    label: string;
    value: string;
  }>;
  financing?: {
    monthlyPayment?: number;
    downPayment?: number;
    term: number;
    rate: number;
  };
  monthlyPayment?: number;
  financingTerm?: number;
  financingRate?: number;
  financingQrCode?: string;
  pricing?: any;
}

/**
 * Generate a motor spec sheet PDF using the edge function
 */
export async function generateMotorSpecSheet(data: ReactPdfQuoteData): Promise<string> {
  try {
    console.log('Generating motor spec sheet for quote:', data.quoteNumber);

    const { data: result, error } = await supabase.functions.invoke('generate-motor-spec-sheet', {
      body: {
        quoteData: data,
        format: 'pdf'
      }
    });

    if (error) {
      console.error('Error generating spec sheet:', error);
      throw error;
    }

    // The edge function returns HTML that should be converted to PDF
    // Return the HTML as a data URL for now
    const htmlContent = result.html || '';
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate spec sheet:', error);
    throw error;
  }
}

/**
 * Generate a quote PDF using @react-pdf/renderer
 */
export async function generateQuotePDF(data: ReactPdfQuoteData): Promise<string> {
  try {
    console.log('Generating quote PDF for:', data.quoteNumber);
    
    // Transform ReactPdfQuoteData to match QuotePDFProps format
    const transformedData = {
      quoteNumber: data.quoteNumber,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || '',
      customerId: '',
      productName: data.motor?.model || '',
      horsepower: `${data.motor?.hp || 0}HP`,
      category: data.motor?.category || 'FourStroke',
      modelYear: data.motor?.model_year || 2025,
      msrp: (data.motor?.msrp || 0).toFixed(2),
      dealerDiscount: (data.pricing?.discount || 0).toFixed(2),
      promoSavings: (data.pricing?.promoValue || 0).toFixed(2),
      motorSubtotal: (data.pricing?.motorSubtotal || 0).toFixed(2),
      subtotal: (data.pricing?.subtotal || 0).toFixed(2),
      tax: (data.pricing?.hst || 0).toFixed(2),
      total: (data.pricing?.totalCashPrice || 0).toFixed(2),
      totalSavings: (data.pricing?.savings || 0).toFixed(2),
      accessoryBreakdown: data.accessoryBreakdown || data.accessories,
      tradeInValue: data.tradeInValue,
      tradeInInfo: data.tradeInInfo,
      selectedPackage: data.selectedPackage || undefined,
      warrantyTargets: [],
      monthlyPayment: data.monthlyPayment,
      financingTerm: data.financingTerm,
      financingRate: data.financingRate,
      financingQrCode: data.financingQrCode,
      includesInstallation: data.includesInstallation,
    };
    
    // Generate PDF blob using @react-pdf/renderer
    const blob = await pdf(<ProfessionalQuotePDF quoteData={transformedData} />).toBlob();
    
    // Convert blob to URL for download
    const url = URL.createObjectURL(blob);
    return url;
  } catch (error) {
    console.error('Failed to generate quote PDF:', error);
    throw error;
  }
}

/**
 * Generate a PDF blob (for legacy compatibility)
 */
export async function generatePDFBlob(data: ReactPdfQuoteData): Promise<Blob> {
  // Return empty blob placeholder
  return new Blob([''], { type: 'application/pdf' });
}

/**
 * Download a PDF from a URL
 */
export function downloadPDF(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
