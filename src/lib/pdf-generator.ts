import jsPDF from 'jspdf';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { QuoteData } from '@/components/QuoteBuilder';
import { getBrandPenaltyFactor } from '@/lib/trade-valuation';
interface PDFQuoteData extends QuoteData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quoteNumber: string;
  tradeInValue?: number;
}

export const generateQuotePDF = async (quoteData: PDFQuoteData): Promise<jsPDF> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;

  // Helpers
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const formatNumber = (num: number) =>
    num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const formatDate = (date?: string | number | Date) =>
    new Date(date || Date.now()).toLocaleDateString('en-CA');

  // Colors (RGB)
  const navy = { r: 30, g: 58, b: 138 };      // #1e3a8a
  const green = { r: 5, g: 150, b: 105 };     // #059669
  const gold = { r: 251, g: 191, b: 36 };     // #fbbf24
  const text = { r: 31, g: 41, b: 55 };       // #1f2937
  const light = { r: 243, g: 244, b: 246 };   // #f3f4f6
  const subtle = { r: 245, g: 245, b: 245 };  // #f5f5f5

  // Pricing
  const motorPrice = (quoteData.motor?.salePrice ?? quoteData.motor?.basePrice ?? quoteData.motor?.price) || 0;
  const tradeValue = quoteData.boatInfo?.tradeIn?.estimatedValue || quoteData.tradeInValue || 0;
  const subtotal = Math.max(0, motorPrice - tradeValue);
  const hst = subtotal * 0.13;
  const totalCash = subtotal + hst;
  const financingFee = 299; // Mentioned only in terms page

  // Finance calc (if provided)
  const hasFinancing = !!quoteData.financing;
  const principal = hasFinancing
    ? Math.max(0, ((quoteData.motor?.salePrice ?? quoteData.motor?.basePrice ?? quoteData.motor?.price) || 0) - (quoteData.financing?.downPayment || 0))
    : 0;
  const monthlyRate = hasFinancing ? ((quoteData.financing!.rate || 0) / 100) / 12 : 0;
  const term = hasFinancing ? (quoteData.financing!.term || 0) : 0;
  const monthlyPayment = hasFinancing && principal > 0 && monthlyRate > 0 && term > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
    : 0;

  // PAGE 1 - Header
  doc.setFillColor(navy.r, navy.g, navy.b);
  doc.rect(0, 0, 210, 40, 'F');

  // Logos and credibility badges
  try {
    const [hbwImg, mercImg, csiImg, repowerImg] = await Promise.all([
      loadImage(harrisLogo),
      loadImage(mercuryLogo),
      loadImage('/lovable-uploads/mercury-csi-award.png'),
      loadImage('/lovable-uploads/mercury-repower-center.png'),
    ]);
    doc.addImage(hbwImg, 'PNG', 20, 10, 50, 20);
    doc.addImage(mercImg, 'PNG', 140, 10, 50, 20);
    // Small credibility badges
    doc.addImage(csiImg, 'PNG', 100, 8, 25, 12);
    doc.addImage(repowerImg, 'PNG', 100, 22, 25, 12);
  } catch {}

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('OFFICIAL MERCURY OUTBOARD QUOTE', 105, 35, { align: 'center' });

  // Quote info bar
  doc.setFillColor(light.r, light.g, light.b);
  doc.rect(0, 40, 210, 15, 'F');
  doc.setTextColor(text.r, text.g, text.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Quote #: ${quoteData.quoteNumber}`, 20, 48);
  doc.text(`Date: ${formatDate(Date.now())}`, 105, 48, { align: 'center' });
  const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 30);
  doc.text(`Valid Until: ${formatDate(validUntil)}`, 190, 48, { align: 'right' });

  // Customer Information
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  // @ts-ignore - roundedRect is available in jsPDF
  doc.roundedRect(20, 65, 170, 30, 3, 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PREPARED FOR:', 30, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(quoteData.customerName || 'Valued Customer', 30, 82);
  doc.text(quoteData.customerEmail || '', 30, 88);
  doc.text(quoteData.customerPhone || '', 120, 88);

  // Motor Details
  doc.setFillColor(subtle.r, subtle.g, subtle.b);
  // @ts-ignore
  doc.roundedRect(20, 105, 170, 60, 3, 3, 'FD');

  const motorImage = (quoteData as any).motor?.image as string | undefined;
  if (motorImage) {
    try {
      const motorImg = await loadImage(motorImage);
      doc.addImage(motorImg, 'PNG', 25, 110, 40, 40);
    } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('YOUR SELECTED MERCURY OUTBOARD', 70, 115);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const model = quoteData.motor?.model || '';
  const hp = quoteData.motor?.hp ? `${quoteData.motor?.hp} HP` : '';
  const boatType = quoteData.boatInfo?.type || '';
  if (model) doc.text(`Model: ${model}`, 70, 125);
  if (hp) doc.text(`Power: ${hp}`, 70, 132);
  if (boatType) doc.text(`Configuration: ${boatType}`, 70, 139);

  doc.setFontSize(10);
  doc.text('Features:', 70, 148);
  doc.text('• Electronic Fuel Injection', 70, 154);
  doc.text('• Power Trim & Tilt', 120, 154);
  doc.text('• 3 Year Factory Warranty', 70, 160);

  // Pricing Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text('INVESTMENT SUMMARY', 105, 180, { align: 'center' });

  doc.setTextColor(text.r, text.g, text.b);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const priceY = 190;
  doc.text('Motor Price:', 30, priceY);
  doc.text(`$${formatNumber(motorPrice)}`, 180, priceY, { align: 'right' });

  if (tradeValue > 0) {
    doc.text('Trade-In Value:', 30, priceY + 7);
    doc.setTextColor(green.r, green.g, green.b);
    doc.text(`-$${formatNumber(tradeValue)}`, 180, priceY + 7, { align: 'right' });
    doc.setTextColor(text.r, text.g, text.b);

    try {
      const brand = (quoteData.boatInfo?.tradeIn?.brand || '').toString();
      const factor = getBrandPenaltyFactor(brand);
      const penaltyApplied = factor < 1;
      if (penaltyApplied) {
        // Small warning icon next to amount
        doc.setFontSize(11);
        doc.text('⚠', 184, priceY + 7, { align: 'right' });
        // Footnote under the line
        doc.setFontSize(9);
        const prePenalty = (quoteData.boatInfo as any)?.tradeIn?.tradeinValuePrePenalty as number | undefined;
        const preNote = prePenalty ? ` Was $${formatNumber(prePenalty)} before adjustment.` : '';
        doc.text(`Adjusted for brand (-50%) — Manufacturer out of business; parts & service availability limited.${preNote}`, 30, priceY + 11);
      }
    } catch {}
  }

  // Subtotal line
  doc.setDrawColor(200, 200, 200);
  doc.line(30, priceY + 15, 180, priceY + 15);

  doc.text('Subtotal:', 30, priceY + 22);
  doc.text(`$${formatNumber(subtotal)}`, 180, priceY + 22, { align: 'right' });
  doc.text('HST (13%):', 30, priceY + 29);
  doc.text(`$${formatNumber(hst)}`, 180, priceY + 29, { align: 'right' });

  // Total line
  doc.setLineWidth(2);
  doc.setDrawColor(navy.r, navy.g, navy.b);
  doc.line(30, priceY + 35, 180, priceY + 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TOTAL CASH PRICE:', 30, priceY + 44);
  doc.text(`$${formatNumber(totalCash)}`, 180, priceY + 44, { align: 'right' });

  // Financing Box (optional)
  if (hasFinancing) {
    doc.setFillColor(240, 253, 244); // Light green
    // @ts-ignore
    doc.roundedRect(20, 245, 170, 35, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(green.r, green.g, green.b);
    doc.text('FINANCING AVAILABLE', 30, 255);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(text.r, text.g, text.b);
    const mp = Math.round(monthlyPayment || 0).toString();
    doc.text(`Monthly Payment: $${mp}/month`, 30, 263);
    doc.text(`${term} months @ ${quoteData.financing!.rate}% APR`, 30, 270);
    doc.setFontSize(9);
    doc.text('*OAC. All payments include HST.', 30, 276);
  }

  // Footer credibility line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Mercury CSI Award Winner • Certified Repower Center', 105, 292, { align: 'center' });

  // PAGE 2 - Next Steps and Terms
  doc.addPage();

  doc.setFillColor(navy.r, navy.g, navy.b);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXT STEPS & TERMS', 105, 13, { align: 'center' });

  // Next Steps
  doc.setFillColor(240, 253, 244);
  // @ts-ignore
  doc.roundedRect(20, 30, 170, 50, 3, 3, 'F');

  doc.setTextColor(green.r, green.g, green.b);
  doc.setFontSize(14);
  doc.text('✓ NEXT STEPS TO GET ON THE WATER', 30, 42);

  doc.setTextColor(text.r, text.g, text.b);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const steps = [
    '1. Contact us to schedule your consultation',
    '2. Bring your boat for inspection',
    '3. Confirm motor specifications and compatibility',
    '4. Schedule professional installation'
  ];
  steps.forEach((step, i) => doc.text(step, 35, 52 + (i * 7)));

  // Contact Info
  doc.setFillColor(245, 245, 245);
  // @ts-ignore
  doc.roundedRect(20, 90, 170, 35, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CONTACT US', 30, 100);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('📞 (905) 342-2153', 30, 108);
  doc.text('📧 info@harrisboatworks.ca', 30, 115);
  doc.text('📍 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0', 30, 122);

  // Terms & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text('TERMS & CONDITIONS', 30, 140);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);

  const terms = [
    '• Quote valid for 30 days from date of issue',
    '• Prices subject to change without notice',
    '• Installation requirements to be determined upon inspection',
    '• Trade-in values subject to physical inspection',
    '• All financing subject to approved credit (OAC)',
    '• Financing fee of $299 applies to all financed purchases',
    '• Final terms to be confirmed with Harris Boat Works Ltd, Dealerplan Peterborough (Broker), and lending institution',
    '• HST included in all prices shown',
    '• Professional installation recommended to maintain warranty'
  ];
  let yPos2 = 148;
  terms.forEach((t) => { doc.text(t, 30, yPos2); yPos2 += 6; });

  // Why Mercury
  doc.setFillColor(240, 249, 255);
  // @ts-ignore
  doc.roundedRect(20, 210, 170, 45, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.text('WHY MERCURY OUTBOARDS?', 30, 220);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(text.r, text.g, text.b);
  const benefits = [
    '✓ Industry-leading 3-year warranty',
    '✓ Best-in-class fuel efficiency',
    '✓ Quietest motors in their class',
    '✓ Unmatched reliability',
    '✓ Local service & support'
  ];
  benefits.forEach((b, i) => doc.text(b, 35, 228 + (i * 6)));

  // Footer bar
  doc.setFillColor(navy.r, navy.g, navy.b);
  doc.rect(0, 270, 210, 27, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Harris Boat Works Ltd - Exclusive Mercury Dealer', 105, 280, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0', 105, 287, { align: 'center' });
  doc.text('(905) 342-2153 | info@harrisboatworks.ca | harrisboatworks.ca', 105, 293, { align: 'center' });

  return doc;
};