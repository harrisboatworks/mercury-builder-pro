import {
  type ConsultationDeliverySnapshot,
  parseConsultationQuoteNumber,
  validateQuotePdf,
} from "./consultation-document-policy.ts";

export const CONSULTATION_PDF_FINANCING_DISCLAIMER =
  "Payment figures are estimates and may change with the final financed amount, rate, term or lender approval.";

const LINES_PER_PAGE = 36;
const LINE_LEADING = 16;

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function pdfSafeText(value: string): string {
  return Array.from(value, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 32 && code <= 126) return char;
    if (code === 160 || code === 0x202f) return " ";
    if (code === 8211 || code === 8212) return "-";
    return "";
  }).join("");
}

function asciiPdf(parts: string[]): Uint8Array {
  return new TextEncoder().encode(parts.join(""));
}

export function formatConsultationCad(value: number): string {
  const sign = value < 0 ? "-" : "";
  const [whole, fraction = "00"] = Math.abs(value).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}$${grouped}.${fraction}`;
}

export function consultationFinancingTermsLine(input: {
  rate: number;
  contractTermMonths: number;
  amortizationMonths: number;
  offerSpecific?: boolean;
}): string {
  const contractCopy = `${input.offerSpecific ? "" : "up to "}${input.contractTermMonths}-month contract`;
  if (input.contractTermMonths === input.amortizationMonths) {
    return `${input.rate}% APR | ${contractCopy} and amortization`;
  }
  return `${input.rate}% APR | ${contractCopy} | payment based on ${input.amortizationMonths}-month amortization`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatConsultationDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return value;
  return `${month} ${Number(match[3])}, ${match[1]}`;
}

export function consultationInspectionCaveat(snapshot: ConsultationDeliverySnapshot): string | null {
  const hasTradeIn = Number(snapshot.tradeIn?.value || 0) > 0;
  const hasPropeller = Boolean(
    snapshot.accessories?.some((item) => item.name.toLowerCase().includes("propeller")),
  );
  if (hasTradeIn && hasPropeller) {
    return "Final trade-in value and propeller fit remain subject to final inspection and Lake Test.";
  }
  if (hasTradeIn) {
    return "Final trade-in value remains subject to final inspection and verification.";
  }
  if (hasPropeller) {
    return "Propeller fit remains subject to final inspection and Lake Test.";
  }
  return null;
}

function tradeDescription(snapshot: ConsultationDeliverySnapshot): string {
  const info = snapshot.tradeIn;
  if (!info) return "";
  return [info.year, info.brand, info.horsepower ? `${info.horsepower} HP` : null, info.model]
    .filter(Boolean)
    .join(" ");
}

export function buildConsultationQuotePdfLines(input: {
  quoteNumber: string;
  snapshot: ConsultationDeliverySnapshot;
}): string[] {
  const quoteNumber = parseConsultationQuoteNumber(input.quoteNumber);
  const snapshot = input.snapshot;
  const breakdown = snapshot.priceBreakdown;
  const accessories = snapshot.accessories || [];
  const hasCompleteQuote = Boolean(
    breakdown
    || accessories.length
    || snapshot.tradeIn
    || snapshot.financing
    || snapshot.productProtection,
  );

  const motor = snapshot.motorDetails;
  const lines = [
    "Harris Boat Works",
    "Private Mercury quote",
    "MERCURY OUTBOARD QUOTE",
    quoteNumber,
    snapshot.customerName,
    snapshot.customerEmail,
    snapshot.customerPhone,
    snapshot.motorModel,
    `Total ${snapshot.totalPrice} CAD`,
  ];
  if (snapshot.createdAt) lines.push(`Issued ${formatConsultationDate(snapshot.createdAt)}`);
  if (snapshot.validUntil) lines.push(`Valid until ${formatConsultationDate(snapshot.validUntil)}`);
  const motorMeta = [
    motor?.category,
    motor?.hp != null ? `${motor.hp}HP` : null,
    motor?.modelYear != null ? String(motor.modelYear) : null,
  ].filter(Boolean);
  if (motorMeta.length) lines.push(motorMeta.join(" | "));

  if (hasCompleteQuote) {
    lines.push("TRANSPARENT PRICE BREAKDOWN");
    if ((breakdown?.savings || 0) > 0) {
      lines.push(`You save ${formatConsultationCad(breakdown!.savings!)} vs MSRP`);
    }
    if (breakdown?.msrp != null) {
      lines.push(`Mercury outboard MSRP ${formatConsultationCad(breakdown.msrp)}`);
    }
    if ((breakdown?.discount || 0) > 0) {
      lines.push(`HBW dealer discount -${formatConsultationCad(breakdown!.discount!)}`);
    }
    if ((breakdown?.adminDiscount || 0) > 0) {
      lines.push(`Additional quote discount -${formatConsultationCad(breakdown!.adminDiscount!)}`);
    }
    if ((breakdown?.promoValue || 0) > 0) {
      lines.push(
        `${breakdown?.promoName || "Mercury Canada promotion"} -${formatConsultationCad(breakdown!.promoValue!)}`,
      );
    }
    if (breakdown?.motorSubtotal != null) {
      lines.push(`Motor price after discounts ${formatConsultationCad(breakdown.motorSubtotal)}`);
    }
    const purchasePath = snapshot.purchasePath || breakdown?.purchasePath;
    if (purchasePath === "loose") {
      lines.push("Loose motor configuration");
      lines.push("Installation is not included");
    } else if (purchasePath === "installed") {
      lines.push("Configured installation and setup");
    }
    const groups = [
      { title: "Equipment and Rigging", items: accessories.filter((item) => !item.category || item.category === "equipment") },
      { title: "Installation and Setup", items: accessories.filter((item) => item.category === "installation") },
      { title: "Mercury Product Protection", items: accessories.filter((item) => item.category === "protection") },
      { title: "Additional Items", items: accessories.filter((item) => item.category === "custom") },
    ];
    for (const group of groups) {
      if (!group.items.length) continue;
      lines.push(group.title);
      for (const item of group.items) {
        lines.push(`${item.name} ${formatConsultationCad(item.price)}`);
        if (item.description) lines.push(item.description);
      }
    }
    if ((snapshot.tradeIn?.value || 0) > 0) {
      lines.push(`Estimated trade-in value -${formatConsultationCad(snapshot.tradeIn!.value)}`);
      const description = tradeDescription(snapshot);
      if (description) lines.push(description);
      lines.push("HST savings from trade-in");
      lines.push("HST is not charged on the eligible trade-in portion");
      lines.push(`${formatConsultationCad(snapshot.tradeIn!.value * 0.13)} saved`);
    }
    if (breakdown?.subtotal != null) {
      lines.push(`Subtotal ${formatConsultationCad(breakdown.subtotal)}`);
    }
    if (breakdown?.hst != null) {
      lines.push(`HST (13%) ${formatConsultationCad(breakdown.hst)}`);
    }
    lines.push(`TOTAL CASH PRICE ${formatConsultationCad(snapshot.totalPrice)} CAD`);
  }

  const includedCoverage = snapshot.includedCoverageYears;
  const coverageTotal = snapshot.productProtection?.totalCoverageYears ?? includedCoverage;
  if (coverageTotal != null) {
    lines.push("MERCURY COVERAGE");
    lines.push(`${coverageTotal} years total`);
  }
  if (includedCoverage != null) {
    lines.push(
      `${includedCoverage} years of combined Mercury factory and applicable promotional coverage are included.`,
    );
  }
  if (snapshot.productProtection) {
    lines.push(
      `${snapshot.productProtection.planYears} additional years of Platinum Product Protection`,
    );
    lines.push(`${formatConsultationCad(snapshot.productProtection.priceBeforeTax)} before HST`);
    if (snapshot.productProtection.monthlyDelta) {
      lines.push(
        `Approximately +${formatConsultationCad(snapshot.productProtection.monthlyDelta).replace(".00", "")}/month with this financing estimate`,
      );
    }
  } else if (hasCompleteQuote) {
    lines.push("No additional paid Product Protection plan selected.");
  }

  const promotion = snapshot.promotion;
  if (promotion?.endDate) {
    lines.push(`Promotion ends ${formatConsultationDate(promotion.endDate)}`);
  }
  if (promotion?.selectedValue) {
    lines.push(`Selected promotion: ${promotion.selectedValue}`);
  }

  const financing = snapshot.financing;
  if (financing?.paymentMethod === "cash_purchase") {
    lines.push("Cash purchase");
    lines.push("No financing fee or monthly-payment estimate is included in this quote.");
  } else if (financing && financing.monthlyPayment > 0) {
    lines.push("FINANCING ESTIMATE");
    lines.push(`${formatConsultationCad(financing.monthlyPayment).replace(".00", "")}/month`);
    if (typeof financing.rate === "number" && financing.amortizationMonths > 0) {
      const contractTerm = financing.contractTermMonths || financing.amortizationMonths;
      lines.push(consultationFinancingTermsLine({
        rate: financing.rate,
        contractTermMonths: contractTerm,
        amortizationMonths: financing.amortizationMonths,
        offerSpecific: financing.paymentMethod === "special_financing",
      }));
    }
    if (financing.amountFinanced != null) {
      lines.push(`Amount financed: ${formatConsultationCad(financing.amountFinanced)} CAD`);
    }
    if ((financing.downPayment || 0) > 0) {
      lines.push(`Down payment: ${formatConsultationCad(financing.downPayment!)} CAD`);
    }
    if ((financing.dealerFee || 0) > 0) {
      lines.push(
        `Includes ${formatConsultationCad(financing.dealerFee!)} DealerPlan administration fee`,
      );
    }
    lines.push("On approved credit.");
    lines.push(CONSULTATION_PDF_FINANCING_DISCLAIMER);
  }

  const caveat = consultationInspectionCaveat(snapshot);
  if (caveat) lines.push(caveat);
  if (snapshot.customerNotes) {
    lines.push("A note from Harris Boat Works");
    lines.push(snapshot.customerNotes);
  }

  return lines.map(pdfSafeText).filter(Boolean);
}

function pageContent(lines: string[]): string {
  return [
    "BT",
    "/F1 11 Tf",
    "50 740 Td",
    ...lines.flatMap((line, index) => (
      index === 0
        ? [`(${escapePdfText(line)}) Tj`]
        : [`0 -${LINE_LEADING} Td`, `(${escapePdfText(line)}) Tj`]
    )),
    "ET",
  ].join("\n");
}

function chunkLines(lines: string[]): string[][] {
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += LINES_PER_PAGE) {
    pages.push(lines.slice(index, index + LINES_PER_PAGE));
  }
  return pages.length > 0 ? pages : [lines];
}

export function renderConsultationQuotePdf(input: {
  quoteNumber: string;
  snapshot: ConsultationDeliverySnapshot;
}): Uint8Array {
  const pages = chunkLines(buildConsultationQuotePdfLines(input));
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];
  objects.push(""); // placeholder catalog
  objects.push(""); // placeholder pages
  for (const pageLines of pages) {
    const content = pageContent(pageLines);
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = pageObjectNumber + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(
      `${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectNumber} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> >>\nendobj\n`,
    );
    objects.push(
      `${contentObjectNumber} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    );
  }
  const fontObjectNumber = objects.length + 1;
  objects.push(
    `${fontObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  );
  objects[0] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  objects[1] =
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`;

  let body = "%PDF-1.7\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xrefStart = body.length;
  const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
  for (let index = 1; index <= objects.length; index += 1) {
    xref.push(`${String(offsets[index]).padStart(10, "0")} 00000 n `);
  }
  body += `${xref.join("\n")}\n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  const bytes = asciiPdf([body]);
  validateQuotePdf(bytes, "application/pdf");
  return bytes;
}
