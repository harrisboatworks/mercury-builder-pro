import jsPDF from "jspdf";
import QRCode from "qrcode";
import harrisLogo from "../assets/harris-logo.png";
import mercuryLogo from "../assets/mercury-logo.png";

// Minimal type to avoid coupling; extend as needed
export interface PDFExecutiveQuoteData {
  customerName?: string;
  boatDetails?: string;
  boatLength?: number | string;
  motorModel?: string;
  horsepower?: number | string;
  totalPrice?: number;
  warranty?: number | string;
  monthlyPayment?: number | string;
  quoteNumber?: string | number;
  validUntil?: Date | string;
}

function formatNumber(value?: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!num && num !== 0) return "-";
  return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatDate(value?: Date | string): string {
  const d = !value ? new Date() : value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

async function urlToDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function calculateTopSpeed(quoteData: PDFExecutiveQuoteData): number {
  const hp = Number(quoteData.horsepower) || 0;
  const boatLength = Number(quoteData.boatLength) || 16;
  return Math.round(hp * 0.8 + boatLength * 0.5);
}

function calculateCruiseSpeed(quoteData: PDFExecutiveQuoteData): number {
  return Math.round(calculateTopSpeed(quoteData) * 0.75);
}

function calculateROI(_quoteData: PDFExecutiveQuoteData): string {
  return "2-3";
}

export async function generateExecutivePDF(quoteData: PDFExecutiveQuoteData) {
  const doc = new jsPDF("p", "mm", "a4");

  // Corporate palette (RGB)
  const colors = {
    navy: [25, 45, 85] as [number, number, number], // #192D55
    gold: [212, 175, 55] as [number, number, number], // #D4AF37
    charcoal: [51, 51, 51] as [number, number, number], // #333333
    gray: [130, 130, 130] as [number, number, number], // #828282
    lightGray: [245, 245, 245] as [number, number, number], // #F5F5F5
    success: [34, 197, 94] as [number, number, number], // #22C55E
  };

  // Preload images as Data URLs
  const [harrisDataUrl, mercuryDataUrl, csiDataUrl, repowerDataUrl] = await Promise.all([
    urlToDataURL(harrisLogo),
    urlToDataURL(mercuryLogo),
    urlToDataURL('/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png'),
    urlToDataURL('/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png'),
  ]);

  // PAGE 1 - EXECUTIVE COVER
  // Navy header band
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, 210, 60, "F");

  // Gold accent line
  doc.setFillColor(...colors.gold);
  doc.rect(0, 60, 210, 2, "F");

  // Logos
  doc.addImage(harrisDataUrl, "PNG", 20, 15, 40, 15);
  doc.addImage(mercuryDataUrl, "PNG", 150, 15, 40, 15);
  // Credibility badges
  doc.addImage(csiDataUrl, "PNG", 100, 13, 25, 12);
  doc.addImage(repowerDataUrl, "PNG", 100, 28, 45, 15);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(24);
  doc.text("MARINE PROPULSION", 105, 40, { align: "center" });
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVESTMENT ANALYSIS", 105, 50, { align: "center" });

  // Client Box
  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(20, 75, 170, 40, 3, 3, "F");

  doc.setTextColor(...colors.charcoal);
  doc.setFontSize(10);
  doc.text("PREPARED FOR", 30, 85);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text((quoteData.customerName || "Valued Client").toUpperCase(), 30, 95);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(quoteData.boatDetails || "16ft Fishing Vessel", 30, 102);
  doc.text(formatDate(new Date()), 30, 108);

  // Executive Summary
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 125, 170, 80, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...colors.navy);
  doc.text("EXECUTIVE SUMMARY", 30, 138);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...colors.charcoal);

  const summary: string[] = [
    `Recommended Solution: ${quoteData.motorModel || "Mercury Outboard"}`,
    `Power Output: ${quoteData.horsepower || "-"} HP`,
    `Investment: $${formatNumber(quoteData.totalPrice)}`,
    `Warranty Coverage: ${quoteData.warranty || 5} Years`,
    `ROI Period: ${calculateROI(quoteData)} seasons`,
  ];

  let yPos = 148;
  summary.forEach((line) => {
    doc.text(line, 30, yPos);
    yPos += 8;
  });

  // Key metrics
  const metrics = [
    { label: "TOTAL INVESTMENT", value: `$${formatNumber(quoteData.totalPrice)}`, color: colors.navy },
    { label: "MONTHLY PAYMENT", value: `$${formatNumber((quoteData as any).monthlyPayment)}/mo`, color: colors.gold },
    { label: "FUEL EFFICIENCY", value: "4.2 GPH", color: colors.success },
  ];

  let xPos = 20;
  metrics.forEach((metric) => {
    doc.setFillColor(...metric.color);
    doc.roundedRect(xPos, 215, 53, 30, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(metric.label, xPos + 26.5, 225, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, xPos + 26.5, 235, { align: "center" });

    xPos += 58;
  });

  // Quote validity bar
  doc.setFillColor(...colors.gold);
  doc.rect(0, 255, 210, 15, "F");
  doc.setTextColor(...colors.navy);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Quote #${quoteData.quoteNumber || "-"} | Valid Until ${formatDate(quoteData.validUntil || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30))}`,
    105,
    264,
    { align: "center" }
  );

  // PAGE 2 - PERFORMANCE ANALYSIS
  doc.addPage();

  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("PERFORMANCE PROJECTIONS", 105, 16, { align: "center" });

  doc.setFillColor(...colors.lightGray);
  doc.roundedRect(20, 35, 170, 90, 3, 3, "F");

  doc.setTextColor(...colors.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("EXPECTED PERFORMANCE METRICS", 30, 48);

  const perfData: [string, string, string][] = [
    ["Top Speed", `${calculateTopSpeed(quoteData)} mph`, "Based on vessel specifications"],
    ["Cruise Speed", `${calculateCruiseSpeed(quoteData)} mph`, "Optimal fuel efficiency"],
    ["Range", "120 nautical miles", "With standard fuel tank"],
    ["Fuel Economy", "4.2 GPH", "At cruise speed"],
    ["Acceleration", "0-20mph in 4.5s", "With standard prop"],
  ];

  doc.setFontSize(10);
  yPos = 60;
  perfData.forEach(([metric, value, note]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.charcoal);
    doc.text(metric, 35, yPos);

    doc.setTextColor(...colors.navy);
    doc.text(value, 100, yPos);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.gray);
    doc.setFontSize(9);
    doc.text(note, 35, yPos + 4);

    yPos += 14;
  });

  // Competitive Analysis
  doc.setTextColor(...colors.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("COMPETITIVE ANALYSIS", 30, 140);

  const comparisons = [
    { label: "Your Current Motor", value: 60, color: colors.gray },
    { label: quoteData.motorModel || "Mercury Outboard", value: 95, color: colors.success },
    { label: "Industry Average", value: 75, color: colors.gold },
  ];

  yPos = 150;
  comparisons.forEach((comp) => {
    doc.setFontSize(10);
    doc.setTextColor(...colors.charcoal);
    doc.text(comp.label, 35, yPos);

    doc.setFillColor(...comp.color);
    doc.rect(35, yPos + 2, comp.value, 6, "F");

    doc.setTextColor(...comp.color);
    doc.text(`${comp.value}%`, 140, yPos);

    yPos += 15;
  });

  // PAGE 3 - TCO
  doc.addPage();

  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("5-YEAR TOTAL COST OF OWNERSHIP", 105, 16, { align: "center" });

  const totalPrice = Number(quoteData.totalPrice) || 0;
  const tcoData: Array<[string, number | string]> = [
    ["Initial Investment", totalPrice],
    ["Fuel Costs (5 years)", 8500],
    ["Maintenance", 1200],
    ["Insurance", 2500],
    ["Winterization", 750],
    ["", ""],
  ];

  const tcoTotal = totalPrice + 12950;
  tcoData.push(["Total 5-Year Cost", tcoTotal]);
  tcoData.push(["Cost per Season", Math.round(tcoTotal / 5)]);
  tcoData.push(["Cost per Trip (40/year)", Math.round(tcoTotal / 5 / 40)]);

  yPos = 40;
  tcoData.forEach(([label, value], index) => {
    if (!label) {
      doc.setDrawColor(...colors.gray);
      doc.line(30, yPos - 3, 180, yPos - 3);
    } else {
      doc.setFont("helvetica", index >= 6 ? "bold" : "normal");
      doc.setFontSize(index === 6 ? 12 : 10);
      doc.setTextColor(...colors.charcoal);
      doc.text(label, 35, yPos);

      if (value !== undefined && value !== null && value !== "") {
        if (index === 6) {
          doc.setTextColor(...colors.navy);
        } else {
          doc.setTextColor(...colors.charcoal);
        }
        const val = typeof value === "number" ? `$${formatNumber(value)}` : String(value);
        doc.text(val, 170, yPos, { align: "right" });
      }
    }
    yPos += 10;
  });

  // Savings highlight (solid fill for compatibility)
  doc.setFillColor(...colors.success);
  doc.roundedRect(20, 140, 170, 40, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("YOUR ADVANTAGE", 30, 153);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const savings = [
    "✓ 30% better fuel efficiency than older 2-stroke models",
    "✓ 5-year warranty saves $1,500 vs standard coverage",
    "✓ Reduced maintenance costs with EFI technology",
  ];

  yPos = 163;
  doc.setTextColor(255, 255, 255);
  savings.forEach((save) => {
    doc.text(save, 35, yPos);
    yPos += 7;
  });

  // QR section
  doc.setFillColor(...colors.navy);
  doc.roundedRect(20, 195, 170, 45, 3, 3, "F");

  const qrCodeUrl = `https://mercuryrepower.ca/quote/${quoteData.quoteNumber || ""}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
    width: 120,
    margin: 1,
    color: { dark: "#FFFFFF", light: "#192D55" },
  });

  doc.addImage(qrCodeDataUrl, "PNG", 30, 200, 35, 35);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("ACCESS YOUR QUOTE ANYWHERE", 75, 210);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Scan to view on mobile", 75, 218);
  doc.text("Share with family or financing", 75, 225);
  doc.text("Valid for 30 days", 75, 232);

  // Footer
  doc.setFillColor(...colors.gold);
  doc.rect(0, 270, 210, 27, "F");

  doc.setTextColor(...colors.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("HARRIS BOAT WORKS | EXCLUSIVE MERCURY DEALER", 105, 280, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("905.342.2153 | mercuryrepower.ca", 105, 287, { align: "center" });

  return doc;
}
