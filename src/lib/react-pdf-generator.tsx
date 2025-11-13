import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { calculateMonthlyPayment, getFinancingTerm, DEALERPLAN_FEE } from '@/lib/finance';

export interface ReactPdfQuoteData {
  quoteNumber: string | number;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId?: string;
  productName: string;
  horsepower: string;
  category: string;
  modelYear: string | number;
  msrp: string;
  dealerDiscount: string;
  promoSavings: string;
  motorSubtotal: string;
  subtotal: string;
  tax: string;
  total: string;
  totalSavings: string;
  accessoryBreakdown?: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  tradeInValue?: number;
  tradeInInfo?: {
    brand: string;
    year: number;
    horsepower: number;
    model?: string;
  };
  selectedPackage?: {
    id: string;
    label: string;
    coverageYears: number;
    features: string[];
  };
  monthlyPayment?: number;
  financingTerm?: number;
  financingRate?: number;
  includesInstallation?: boolean;
}

// Transform existing quote data to React PDF format
export const transformQuoteData = (quoteData: any): ReactPdfQuoteData => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const msrp = quoteData.pricing?.msrp || quoteData.motor?.msrp || 0;
  const discount = quoteData.pricing?.discount || 0;
  const promoValue = quoteData.pricing?.promoValue || 0;
  const motorSubtotal = quoteData.pricing?.motorSubtotal || (msrp - discount - promoValue);
  
  // Use package totals (includes accessories)
  const subtotal = quoteData.pricing?.subtotal || motorSubtotal;
  const hst = quoteData.pricing?.hst || (subtotal * 0.13);
  const total = quoteData.pricing?.totalCashPrice || (subtotal + hst);
  const savings = discount + promoValue;

  // Calculate actual financing based on total price with HST + mandatory Dealerplan fee
  const financing = calculateMonthlyPayment(total + DEALERPLAN_FEE, quoteData.financing?.rate || null);

  return {
    quoteNumber: quoteData.quoteNumber || `HBW-${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    customerName: quoteData.customerName || 'Valued Customer',
    customerEmail: quoteData.customerEmail || '',
    customerPhone: quoteData.customerPhone || '',
    customerId: quoteData.customerId,
    productName: quoteData.motor?.model || quoteData.motor?.name || 'Mercury Motor',
    horsepower: `${quoteData.motor?.hp || ''}HP`,
    category: quoteData.motor?.category || 'FourStroke',
    modelYear: quoteData.motor?.year || new Date().getFullYear(),
    msrp: formatCurrency(msrp),
    dealerDiscount: formatCurrency(discount),
    promoSavings: formatCurrency(promoValue),
    motorSubtotal: formatCurrency(motorSubtotal),
    subtotal: formatCurrency(subtotal),
    tax: formatCurrency(hst),
    total: formatCurrency(total),
    totalSavings: formatCurrency(savings),
    accessoryBreakdown: quoteData.accessoryBreakdown || [],
    tradeInValue: quoteData.tradeInValue || 0,
    tradeInInfo: quoteData.tradeInInfo,
    selectedPackage: quoteData.selectedPackage,
    monthlyPayment: Math.round(financing.payment),
    financingTerm: financing.termMonths,
    financingRate: financing.rate,
    includesInstallation: quoteData.includesInstallation || false
  };
};

// Generate PDF blob for download (dynamically imports PDF component)
export const generateQuotePDF = async (quoteData: any): Promise<string> => {
  try {
    console.log('🔄 Generating React PDF with data:', { 
      quoteNumber: quoteData.quoteNumber, 
      motorModel: quoteData.motor?.model,
      customerName: quoteData.customerName 
    });

    // Dynamically import PDF component (~450KB)
    const { default: ProfessionalQuotePDF } = await import('@/components/quote-pdf/ProfessionalQuotePDF');
    
    const transformedData = transformQuoteData(quoteData);
    const blob = await pdf(<ProfessionalQuotePDF quoteData={transformedData} />).toBlob();
    
    // Create object URL for download
    const url = URL.createObjectURL(blob);
    
    console.log('✅ React PDF Generated Successfully');
    return url;

  } catch (error) {
    console.error('❌ React PDF Generation Error:', error);
    throw new Error(`PDF Generation Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Download PDF with proper filename
export const downloadPDF = async (pdfUrl: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = filename || `Quote-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL
  URL.revokeObjectURL(pdfUrl);
};

// Generate PDF blob for email attachment (dynamically imports PDF component)
export const generatePDFBlob = async (quoteData: any): Promise<Blob> => {
  // Dynamically import PDF component (~450KB)
  const { default: ProfessionalQuotePDF } = await import('@/components/quote-pdf/ProfessionalQuotePDF');
  
  const transformedData = transformQuoteData(quoteData);
  return await pdf(<ProfessionalQuotePDF quoteData={transformedData} />).toBlob();
};