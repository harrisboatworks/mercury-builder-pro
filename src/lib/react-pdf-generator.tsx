// Simplified PDF generator - Quote PDFs still use this
// Motor spec sheets now use server-side generation via edge function
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

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
  // Selected promo option
  selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
  selectedPromoValue?: string;
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

const currency = (value: unknown) => {
  const amount = typeof value === 'number' ? value : Number(value || 0);
  return amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 });
};

const drawRow = (doc: jsPDF, label: string, value: string, y: number, bold = false) => {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.text(label, 18, y);
  doc.text(value, 192, y, { align: 'right' });
};

const buildQuotePDFBlob = async (data: ReactPdfQuoteData): Promise<Blob> => {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  doc.setFillColor(4, 12, 26);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Harris Boat Works', 18, 17);
  doc.setFontSize(10);
  doc.text('Mercury Certified Repower Center', 18, 25);
  doc.text(`Quote ${data.quoteNumber}`, pageWidth - 18, 17, { align: 'right' });
  doc.text(new Date().toLocaleDateString('en-CA'), pageWidth - 18, 25, { align: 'right' });

  y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Mercury Outboard Quote', 18, y);

  y += 14;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${data.customerName || 'Valued Customer'}`, 18, y);
  y += 7;
  if (data.customerEmail) doc.text(`Email: ${data.customerEmail}`, 18, y);
  if (data.customerPhone) doc.text(`Phone: ${data.customerPhone}`, 118, y);

  y += 14;
  doc.setFillColor(244, 247, 251);
  doc.roundedRect(14, y - 7, pageWidth - 28, 35, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(data.motor?.model || 'Mercury Outboard', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${data.motor?.hp || 0} HP · ${data.motor?.category || 'FourStroke'} · ${data.motor?.model_year || 2026}`, 18, y + 8);
  if (data.selectedPackage?.label) doc.text(`${data.selectedPackage.label} package`, 18, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(currency(data.pricing?.totalCashPrice || data.total), pageWidth - 18, y + 8, { align: 'right' });

  y += 45;
  doc.setFontSize(13);
  doc.text('Pricing Summary', 18, y);
  y += 10;
  drawRow(doc, 'MSRP', currency(data.pricing?.msrp || data.motor?.msrp), y);
  y += 8;
  if (data.pricing?.discount) {
    drawRow(doc, 'Dealer discount', `-${currency(data.pricing.discount)}`, y);
    y += 8;
  }
  if (data.pricing?.promoValue) {
    drawRow(doc, 'Promotion savings', `-${currency(data.pricing.promoValue)}`, y);
    y += 8;
  }
  if (data.tradeInValue) {
    drawRow(doc, 'Trade-in credit', `-${currency(data.tradeInValue)}`, y);
    y += 8;
  }
  doc.line(18, y, pageWidth - 18, y);
  y += 8;
  drawRow(doc, 'Subtotal', currency(data.pricing?.subtotal || data.subtotal), y, true);
  y += 8;
  drawRow(doc, 'HST (13%)', currency(data.pricing?.hst || data.hst), y);
  y += 8;
  drawRow(doc, 'Total Price', currency(data.pricing?.totalCashPrice || data.total), y, true);

  const accessories = data.accessoryBreakdown || data.accessories || [];
  if (accessories.length) {
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Included Items', 18, y);
    doc.setFontSize(10);
    accessories.slice(0, 12).forEach((item: any) => {
      y += 7;
      drawRow(doc, item.name || item.label || 'Item', currency(item.price || item.cost || 0), y);
    });
  }

  if (data.financingQrCode) {
    try {
      doc.addImage(data.financingQrCode, 'PNG', pageWidth - 48, 180, 30, 30);
      doc.setFontSize(8);
      doc.text('Scan to view quote', pageWidth - 33, 214, { align: 'center' });
    } catch (error) {
      console.warn('Could not add QR code to PDF:', error);
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(87, 99, 115);
  const footer = 'All prices in Canadian dollars. Pickup only at Harris Boat Works. Installation, rigging, and trade-in values subject to inspection and verification.';
  doc.text(doc.splitTextToSize(footer, pageWidth - 36), 18, 242);

  return doc.output('blob');
};

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
      msrp: (data.motor?.msrp || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      dealerDiscount: (data.pricing?.discount || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      promoSavings: (data.pricing?.promoValue || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      motorSubtotal: (data.pricing?.motorSubtotal || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      subtotal: (data.pricing?.subtotal || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      tax: (data.pricing?.hst || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      total: (data.pricing?.totalCashPrice || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalSavings: (data.pricing?.savings || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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
      selectedPromoOption: data.selectedPromoOption,
      selectedPromoValue: data.selectedPromoValue,
      pricing: data.pricing,
      customerNotes: data.customerNotes,
      depositInfo: data.depositInfo,
    };
    
    const blob = await pdf(<ProfessionalQuotePDF quoteData={transformedData} />).toBlob();
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
      msrp: (data.motor?.msrp || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      dealerDiscount: (data.pricing?.discount || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      promoSavings: (data.pricing?.promoValue || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      motorSubtotal: (data.pricing?.motorSubtotal || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      subtotal: (data.pricing?.subtotal || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      tax: (data.pricing?.hst || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      total: (data.pricing?.totalCashPrice || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalSavings: (data.pricing?.savings || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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
      selectedPromoOption: data.selectedPromoOption,
      selectedPromoValue: data.selectedPromoValue,
      pricing: data.pricing,
      customerNotes: data.customerNotes,
      depositInfo: data.depositInfo,
    };
    
    const blob = await pdf(<ProfessionalQuotePDF quoteData={transformedData} />).toBlob();
    return blob;
  } catch (error) {
    console.error('Failed to generate PDF blob:', error);
    throw error;
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
}
