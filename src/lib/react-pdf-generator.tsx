import React from 'react';
import { pdf } from '@react-pdf/renderer';
import ProfessionalQuotePDF from '@/components/quote-pdf/ProfessionalQuotePDF';
import { calculateMonthlyPayment, getFinancingTerm } from '@/lib/finance';

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
  subtotal: string;
  tax: string;
  total: string;
  totalSavings: string;
  selectedPackage?: {
    id: string;
    label: string;
    coverageYears: number;
    features: string[];
  };
  monthlyPayment?: number;
  financingTerm?: number;
  financingRate?: number;
}

// Transform existing quote data to React PDF format
export const transformQuoteData = (quoteData: any): ReactPdfQuoteData => {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const msrp = quoteData.pricing?.msrp || quoteData.motor?.msrp || 0;
  const discount = quoteData.pricing?.discount || 0;
  const promoValue = quoteData.pricing?.promoValue || 0;
  
  // ALWAYS calculate motor-only subtotal for PDF display (ignore pre-calculated subtotal with accessories)
  const motorSubtotal = msrp - discount - promoValue;
  const hst = motorSubtotal * 0.13;
  const total = motorSubtotal + hst;
  const savings = discount + promoValue;

  // Calculate actual financing based on total price with HST
  const financing = calculateMonthlyPayment(total, quoteData.financing?.rate || null);

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
    subtotal: formatCurrency(motorSubtotal),
    tax: formatCurrency(hst),
    total: formatCurrency(total),
    totalSavings: formatCurrency(savings),
    selectedPackage: quoteData.selectedPackage,
    monthlyPayment: Math.round(financing.payment),
    financingTerm: financing.termMonths,
    financingRate: financing.rate
  };
};

// Generate PDF blob for download
export const generateQuotePDF = async (quoteData: any): Promise<string> => {
  try {
    console.log('🔄 Generating React PDF with data:', { 
      quoteNumber: quoteData.quoteNumber, 
      motorModel: quoteData.motor?.model,
      customerName: quoteData.customerName 
    });

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

// Generate PDF blob for email attachment
export const generatePDFBlob = async (quoteData: any): Promise<Blob> => {
  const transformedData = transformQuoteData(quoteData);
  return await pdf(<ProfessionalQuotePDF quoteData={transformedData} />).toBlob();
};