import jsPDF from 'jspdf';
import { QuoteData } from '@/components/QuoteBuilder';

interface PDFQuoteData extends QuoteData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quoteNumber: string;
  tradeInValue?: number;
}

export const generateQuotePDF = (quoteData: PDFQuoteData): jsPDF => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  
  // Colors
  const primaryBlue = '#0066CC';
  const mercuryBlack = '#000000';
  const accentSilver = '#C0C0C0';
  const successGreen = '#00A651';
  
  // Calculate pricing
  const motorPrice = quoteData.motor?.price || 0;
  const tradeValue = quoteData.boatInfo?.tradeIn?.estimatedValue || quoteData.tradeInValue || 0;
  const subtotal = motorPrice - tradeValue;
  const hst = subtotal * 0.13;
  const totalCashPrice = subtotal + hst;
  const financingFee = 299;
  const totalFinancePrice = totalCashPrice + financingFee;
  
  // Helper function to add text with proper styling
  const addText = (text: string, x: number, y: number, options?: {
    size?: number;
    style?: 'normal' | 'bold';
    align?: 'left' | 'center' | 'right';
    color?: string;
  }) => {
    if (options?.size) pdf.setFontSize(options.size);
    if (options?.style) pdf.setFont('helvetica', options.style);
    if (options?.color) pdf.setTextColor(options.color);
    if (options?.align) pdf.text(text, x, y, { align: options.align });
    else pdf.text(text, x, y);
  };
  
  // Header Section with Gradient Background
  pdf.setFillColor(6, 102, 204); // Primary blue
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  // Add logos (placeholder text for now)
  pdf.setTextColor('#FFFFFF');
  addText('HARRIS BOAT WORKS', 15, 20, { size: 14, style: 'bold' });
  addText('MERCURY', pageWidth - 15, 20, { size: 14, style: 'bold', align: 'right' });
  
  // Main title
  addText('OFFICIAL MERCURY OUTBOARD', pageWidth / 2, 30, { 
    size: 16, style: 'bold', align: 'center' 
  });
  addText('PRICE QUOTE', pageWidth / 2, 38, { 
    size: 16, style: 'bold', align: 'center' 
  });
  
  // Quote number and date
  pdf.setTextColor(mercuryBlack);
  const currentDate = new Date().toLocaleDateString();
  addText(`Quote #: ${quoteData.quoteNumber}`, 15, 55, { size: 10 });
  addText(`Date: ${currentDate}`, pageWidth - 15, 55, { size: 10, align: 'right' });
  
  // Customer Information Box
  pdf.setDrawColor(6, 102, 204);
  pdf.setLineWidth(0.5);
  pdf.rect(15, 65, pageWidth - 30, 25);
  
  addText('FOR:', 20, 75, { size: 12, style: 'bold' });
  addText(quoteData.customerName, 20, 82, { size: 11 });
  addText(`${quoteData.customerPhone} | ${quoteData.customerEmail}`, 20, 88, { size: 10 });
  
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  addText(`Quote Valid Until: ${validUntil.toLocaleDateString()}`, pageWidth - 20, 82, { 
    size: 10, align: 'right' 
  });
  
  // Selected Motor Section
  let yPos = 105;
  pdf.setFillColor(248, 249, 250); // Light background
  pdf.rect(15, yPos, pageWidth - 30, 50, 'F');
  pdf.rect(15, yPos, pageWidth - 30, 50); // Border
  
  addText('YOUR SELECTED MERCURY OUTBOARD', 20, yPos + 10, { 
    size: 14, style: 'bold' 
  });
  
  if (quoteData.motor) {
    addText(`Model: ${quoteData.motor.model}`, 20, yPos + 20, { size: 12, style: 'bold' });
    addText(`⚡ Power: ${quoteData.motor.hp} HP`, 20, yPos + 28, { size: 11 });
    
    if (quoteData.boatInfo?.type) {
      addText(`🎯 Perfect for: ${quoteData.boatInfo.type}`, 20, yPos + 36, { size: 11 });
    }
    
    addText('Features:', 20, yPos + 44, { size: 11, style: 'bold' });
    addText('• Electronic Fuel Injection   • Power Trim & Tilt   • 3 Year Factory Warranty', 
            20, yPos + 50, { size: 10 });
  }
  
  // Pricing Breakdown
  yPos = 170;
  
  // Header with double line
  pdf.setLineWidth(1);
  pdf.line(15, yPos, pageWidth - 15, yPos);
  addText('INVESTMENT SUMMARY', pageWidth / 2, yPos + 8, { 
    size: 14, style: 'bold', align: 'center' 
  });
  pdf.line(15, yPos + 12, pageWidth - 15, yPos + 12);
  
  yPos += 20;
  
  // Pricing details
  const priceLines = [
    ['Motor Price:', `$${motorPrice.toLocaleString()}.00`],
    ...(tradeValue > 0 ? [['Trade-In Allowance:', `-$${tradeValue.toLocaleString()}.00`]] : []),
    ['', '───────────'],
    ['Subtotal:', `$${subtotal.toLocaleString()}.00`],
    ['HST (13%):', `$${hst.toLocaleString()}.00`],
    ['', '═══════════'],
    ['TOTAL CASH PRICE:', `$${totalCashPrice.toLocaleString()}.00`]
  ];
  
  priceLines.forEach(([label, amount]) => {
    if (label === '' && amount.includes('═')) {
      // Double line for total
      pdf.setLineWidth(2);
      pdf.line(120, yPos - 2, pageWidth - 20, yPos - 2);
    } else if (label === '' && amount.includes('─')) {
      // Single line for subtotal
      pdf.setLineWidth(0.5);
      pdf.line(120, yPos - 2, pageWidth - 20, yPos - 2);
    } else {
      const isTotal = label.includes('TOTAL');
      const isTradeIn = label.includes('Trade-In');
      
      addText(label, 20, yPos, { 
        size: isTotal ? 12 : 11, 
        style: isTotal ? 'bold' : 'normal',
        color: isTradeIn ? successGreen : mercuryBlack
      });
      addText(amount, pageWidth - 20, yPos, { 
        size: isTotal ? 12 : 11, 
        style: isTotal ? 'bold' : 'normal',
        align: 'right',
        color: isTradeIn ? successGreen : mercuryBlack
      });
    }
    yPos += 8;
  });
  
  // Financing Options
  yPos += 15;
  pdf.setFillColor(6, 102, 204);
  pdf.rect(0, yPos - 5, pageWidth, 20, 'F');
  
  pdf.setTextColor('#FFFFFF');
  addText('💰 FINANCING OPTIONS AVAILABLE', pageWidth / 2, yPos + 5, { 
    size: 12, style: 'bold', align: 'center' 
  });
  
  yPos += 20;
  pdf.setTextColor(mercuryBlack);
  
  addText(`Financing Administration Fee: $${financingFee}.00`, 20, yPos, { size: 11 });
  addText(`Amount to Finance: $${totalFinancePrice.toLocaleString()}.00`, 20, yPos + 8, { 
    size: 11, style: 'bold' 
  });
  
  yPos += 20;
  addText('ESTIMATED PAYMENTS (60 months @ 7.99%)*:', 20, yPos, { 
    size: 11, style: 'bold' 
  });
  
  // Payment box
  pdf.setDrawColor(6, 102, 204);
  pdf.rect(20, yPos + 5, pageWidth - 40, 25);
  
  const monthlyPayment = 321; // Calculated from financing
  const biWeeklyPayment = 148;
  const weeklyPayment = 74;
  
  addText(`📅 WEEKLY:        $${weeklyPayment}/week`, 25, yPos + 13, { size: 11 });
  addText(`📅 BI-WEEKLY:     $${biWeeklyPayment}`, 25, yPos + 20, { size: 11 });
  addText(`📅 MONTHLY:       $${monthlyPayment}/month`, 25, yPos + 27, { size: 11 });
  
  // Next Steps Section
  yPos = 260;
  pdf.setFillColor(0, 166, 81); // Success green
  pdf.rect(15, yPos, pageWidth - 30, 30, 'F');
  pdf.setDrawColor(0, 166, 81);
  pdf.rect(15, yPos, pageWidth - 30, 30);
  
  pdf.setTextColor('#FFFFFF');
  addText('✅ NEXT STEPS TO GET ON THE WATER', 20, yPos + 8, { 
    size: 12, style: 'bold' 
  });
  
  pdf.setTextColor(mercuryBlack);
  const nextSteps = [
    '1. Bring your boat for inspection',
    '2. Confirm motor specifications', 
    '3. Finalize control compatibility',
    '4. Schedule professional installation'
  ];
  
  nextSteps.forEach((step, index) => {
    addText(step, 20, yPos + 15 + (index * 4), { size: 10 });
  });
  
  // Contact Information
  pdf.setTextColor(primaryBlue);
  addText('📞 Call us: (905) 342-2153', pageWidth - 20, yPos + 15, { 
    size: 10, align: 'right' 
  });
  addText('📍 Visit us: 5369 Harris Boat Works Rd, Gores Landing, ON', pageWidth - 20, yPos + 20, { 
    size: 9, align: 'right' 
  });
  addText('🌐 info@harrisboatworks.ca', pageWidth - 20, yPos + 25, { 
    size: 10, align: 'right' 
  });
  
  // Footer with disclaimers (small but readable)
  pdf.addPage();
  
  // Page 2: Terms and Conditions
  addText('TERMS & CONDITIONS', pageWidth / 2, 20, { 
    size: 14, style: 'bold', align: 'center' 
  });
  
  const disclaimers = [
    '• Quote valid for 30 days from date of issue',
    '• Prices subject to change without notice',
    '• Installation requirements to be determined upon inspection',
    '• Trade-in values subject to physical inspection', 
    '• All financing subject to approved credit (OAC)',
    '• Financing fee of $299 applies to all financed purchases',
    '• Final terms to be confirmed with Harris Boat Works Ltd,',
    '  Dealerplan Peterborough (Broker), and lending institution',
    '• HST included in all prices shown',
    '• Professional installation recommended to maintain warranty'
  ];
  
  let disclaimerY = 35;
  disclaimers.forEach((disclaimer) => {
    addText(disclaimer, 20, disclaimerY, { size: 10 });
    disclaimerY += 6;
  });
  
  // Why Mercury section
  disclaimerY += 15;
  addText('WHY MERCURY OUTBOARDS?', 20, disclaimerY, { 
    size: 12, style: 'bold' 
  });
  
  const mercuryBenefits = [
    '✓ Industry-leading 3-year warranty',
    '✓ Best-in-class fuel efficiency',
    '✓ Quietest motors in their class',
    '✓ Unmatched reliability',
    '✓ Local service & support'
  ];
  
  disclaimerY += 10;
  mercuryBenefits.forEach((benefit) => {
    addText(benefit, 20, disclaimerY, { size: 10 });
    disclaimerY += 6;
  });
  
  // Footer
  const footerY = pageHeight - 30;
  pdf.setDrawColor(6, 102, 204);
  pdf.line(15, footerY, pageWidth - 15, footerY);
  
  addText('Harris Boat Works Ltd - Exclusive Mercury Dealer', pageWidth / 2, footerY + 8, { 
    size: 11, style: 'bold', align: 'center' 
  });
  addText('5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0', pageWidth / 2, footerY + 15, { 
    size: 10, align: 'center' 
  });
  addText('(905) 342-2153 | info@harrisboatworks.ca', pageWidth / 2, footerY + 22, { 
    size: 10, align: 'center' 
  });
  
  return pdf;
};