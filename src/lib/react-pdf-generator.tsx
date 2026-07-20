// Simplified PDF generator - Quote PDFs still use this
// Motor spec sheets now use server-side generation via edge function
import { supabase } from '@/integrations/supabase/client';
import { validateQuotePdfSnapshot, type QuotePdfSnapshot } from '@/lib/quote-pdf-data';
import { getRecommendedDeposit } from '@/lib/deposit';

export interface ReactPdfQuoteData {
  quoteNumber: string;
  quoteDate?: string;
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
  snapshot?: QuotePdfSnapshot;
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
    amountFinanced?: number;
    dealerFee?: number;
    contractTermMonths?: number;
  };
  monthlyPayment?: number;
  financingTerm?: number;
  financingRate?: number;
  savedQuoteQrCode?: string;
  recommendedDepositAmount?: number;
  promotionalFinancingAlternative?: {
    rate: number;
    termMonths: number;
  };
  /** @deprecated Use savedQuoteQrCode. Kept for older callers during migration. */
  financingQrCode?: string;
  pricing?: any;
  // Selected promo option
  selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
  selectedPromoValue?: string;
  selectedPaymentMethod?: 'cash_purchase' | 'standard_financing' | 'special_financing' | null;
  promotionName?: string;
  promotionCombinationMode?: 'layered' | 'choose_one';
  promoEndDate?: string;
  customerNotes?: string;
  // Deposit/payment confirmation info
  depositInfo?: {
    amount: number;
    referenceNumber: string;
    paymentDate: string;
    paymentMethod?: string;
    paymentId?: string;
    status?: string;
  };
}

type QuotePdfRenderer = {
  pdf: typeof import('@react-pdf/renderer')['pdf'];
  ProfessionalQuotePDF: typeof import('@/components/quote-pdf/ProfessionalQuotePDF')['default'];
};

let quotePdfRendererPromise: Promise<QuotePdfRenderer> | null = null;

async function loadQuotePdfRenderer(): Promise<QuotePdfRenderer> {
  quotePdfRendererPromise ??= Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/quote-pdf/ProfessionalQuotePDF'),
  ]).then(([renderer, pdfModule]) => ({
    pdf: renderer.pdf,
    ProfessionalQuotePDF: pdfModule.default,
  }));

  return quotePdfRendererPromise;
}

function formatDate(value?: string): string {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function buildProfessionalQuotePdfData(data: ReactPdfQuoteData) {
  const snapshot = data.snapshot;
  const motor = snapshot?.motor ?? data.motor ?? {};
  const pricing = snapshot?.pricing ?? data.pricing ?? {};
  const financing = snapshot?.financing ?? (data.monthlyPayment || data.financing?.monthlyPayment ? {
    monthlyPayment: data.monthlyPayment ?? data.financing?.monthlyPayment,
    amortizationMonths: data.financingTerm ?? data.financing?.term,
    rate: data.financingRate ?? data.financing?.rate,
    amountFinanced: data.financing?.amountFinanced,
    dealerFee: data.financing?.dealerFee,
    contractTermMonths: data.financing?.contractTermMonths,
  } : undefined);
  const productProtection = snapshot?.productProtection;
  const promotion = snapshot?.promotion;
  const includedCoverageYears = snapshot?.includedCoverageYears
    ?? data.selectedPackage?.coverageYears
    ?? 3;

  return {
    quoteNumber: data.quoteNumber,
    date: formatDate(data.quoteDate ?? snapshot?.createdAt),
    validUntil: snapshot?.validUntil,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone || '',
    customerId: '',
    productName: motor.model || '',
    horsepower: `${motor.hp || 0}HP`,
    category: motor.category || 'FourStroke',
    modelYear: motor.modelYear || motor.model_year || 2026,
    msrp: Number(pricing.msrp ?? motor.msrp ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    dealerDiscount: Number(pricing.discount || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    promoSavings: Number(pricing.promoValue || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    motorSubtotal: Number(pricing.motorSubtotal || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    subtotal: Number(pricing.subtotal || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    tax: Number(pricing.hst || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    total: Number(pricing.totalCashPrice || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    totalSavings: Number(pricing.savings || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    accessoryBreakdown: snapshot?.accessoryBreakdown ?? data.accessoryBreakdown ?? data.accessories,
    tradeInValue: snapshot?.tradeInValue ?? data.tradeInValue,
    tradeInInfo: snapshot?.tradeInInfo ?? data.tradeInInfo,
    includedCoverageYears,
    productProtection,
    selectedPackage: data.selectedPackage || (snapshot ? {
      id: 'configured',
      label: 'Configured Quote',
      coverageYears: productProtection?.totalCoverageYears ?? includedCoverageYears,
      features: [],
    } : undefined),
    warrantyTargets: [],
    monthlyPayment: financing?.monthlyPayment,
    financingTerm: financing?.amortizationMonths,
    financingRate: financing?.rate,
    financingAmount: financing?.amountFinanced,
    dealerFee: financing?.dealerFee,
    financingContractTerm: financing?.contractTermMonths,
    savedQuoteQrCode: data.savedQuoteQrCode ?? data.financingQrCode,
    recommendedDepositAmount: data.recommendedDepositAmount
      ?? getRecommendedDeposit(Number(motor.hp || 0)),
    promotionalFinancingAlternative: data.promotionalFinancingAlternative,
    includesInstallation: snapshot ? snapshot.purchasePath === 'installed' : data.includesInstallation,
    selectedPromoOption: promotion?.selectedOption ?? data.selectedPromoOption,
    selectedPromoValue: promotion?.selectedValue ?? data.selectedPromoValue,
    selectedPaymentMethod: snapshot?.paymentMethod ?? data.selectedPaymentMethod,
    promotionName: promotion?.name ?? data.promotionName,
    promotionCombinationMode: promotion?.combinationMode ?? data.promotionCombinationMode,
    promoEndDate: promotion?.endDate ?? data.promoEndDate,
    pricing,
    customerNotes: snapshot?.customerNotes ?? data.customerNotes,
    depositInfo: data.depositInfo,
  };
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
    const blob = await generatePDFBlob(data);
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
  try {
    console.log('Generating PDF blob for:', data.quoteNumber);
    if (data.snapshot) {
      const validation = validateQuotePdfSnapshot(data.snapshot);
      if (!validation.isValid) {
        throw new Error(`Quote totals need to be refreshed before creating the PDF: ${validation.errors.join(' ')}`);
      }
    }
    const { pdf, ProfessionalQuotePDF } = await loadQuotePdfRenderer();
    const transformedData = buildProfessionalQuotePdfData(data);

    return pdf(<ProfessionalQuotePDF quoteData={transformedData} />).toBlob();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error('Failed to generate PDF blob:', errMsg, errStack);
    throw new Error(`PDF generation failed: ${errMsg}`);
  }
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
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
