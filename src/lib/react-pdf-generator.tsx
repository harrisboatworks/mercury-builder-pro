// Simplified PDF generator - Quote PDFs still use this
// Motor spec sheets now use server-side generation via edge function
import { supabase } from './supabase';

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
 * Generate a quote PDF using PDF.co API or other service
 * This is a placeholder - implement your preferred PDF generation service
 */
export async function generateQuotePDF(data: ReactPdfQuoteData): Promise<string> {
  // For now, return a data URL placeholder
  // TODO: Implement actual PDF generation service integration
  console.log('PDF generation requested for quote:', data.quoteNumber);

  // Return a placeholder URL
  // In production, this would call PDF.co or another service
  return 'data:application/pdf;base64,placeholder';
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
