import React from 'react';
import {
  Document as _Document,
  Font,
  Image as _Image,
  Page as _Page,
  StyleSheet,
  Text as _Text,
  View as _View,
} from '@react-pdf/renderer';
import type { ComponentType } from 'react';
import { parseMercuryRigCodes } from '@/lib/mercury-codes';
import { getRecommendedDeposit } from '@/lib/deposit';
import { GOOGLE_REVIEWS_FALLBACK } from '@/config/googleReviews';
import harrisLogoWhite from '@/assets/harris-logo-white.png';
import mercuryLogoWhite from '@/assets/mercury-logo-white.png';

const Document = _Document as unknown as ComponentType<any>;
const Page = _Page as unknown as ComponentType<any>;
const Text = _Text as unknown as ComponentType<any>;
const View = _View as unknown as ComponentType<any>;
const Image = _Image as unknown as ComponentType<any>;

// Keep product names and technical terms intact. React PDF otherwise creates
// distracting breaks such as "Elec-tro" in narrow columns.
Font.registerHyphenationCallback((word) => [word]);

const colors = {
  ink: '#0D1526',
  ink2: '#141E33',
  red: '#C8102E',
  gold: '#B98D36',
  cream: '#FAF7F0',
  line: '#E3E0D8',
  white: '#FFFFFF',
};

const money = (value: unknown): string => {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  pageTwo: {
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 25,
    paddingHorizontal: 34,
    paddingBottom: 38,
  },
  hero: {
    backgroundColor: colors.ink,
    color: colors.white,
    paddingTop: 21,
    paddingHorizontal: 34,
    paddingBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },
  brandPlate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  harrisLogo: { width: 45, height: 32, objectFit: 'contain' },
  brandDivider: { width: 1, height: 25, backgroundColor: '#39445A' },
  mercuryLogo: { width: 90, height: 18, objectFit: 'contain' },
  documentLabel: { color: colors.white, fontSize: 10, fontWeight: 'bold', textAlign: 'right', letterSpacing: 0.5 },
  documentKicker: { color: '#9AA4B5', fontSize: 6.7, textAlign: 'right', letterSpacing: 1.2, marginTop: 3 },
  heroMain: { paddingTop: 3 },
  heroCopy: { width: '100%' },
  heroEyebrow: { color: colors.gold, fontSize: 7.2, fontWeight: 'bold', letterSpacing: 2, marginBottom: 6 },
  heroProduct: { color: colors.white, fontSize: 27, lineHeight: 1.02, fontWeight: 'bold', letterSpacing: -0.6 },
  heroMeta: { color: '#B9C2D2', fontSize: 8.5, lineHeight: 1.35, marginTop: 7 },
  priceBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTop: `3 solid ${colors.red}`,
    borderBottom: `3 solid ${colors.red}`,
    paddingVertical: 11,
    paddingHorizontal: 34,
  },
  priceEyebrow: { color: colors.ink2, fontSize: 7.3, fontWeight: 'bold', letterSpacing: 1.7, marginBottom: 3 },
  priceAmount: { color: colors.ink, fontSize: 25, lineHeight: 1, fontWeight: 'bold' },
  savingsPill: { backgroundColor: colors.red, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 11 },
  savingsPillText: { color: colors.white, fontSize: 8.4, fontWeight: 'bold' },
  pageOneBody: { flex: 1, flexDirection: 'row', gap: 18, paddingTop: 15, paddingHorizontal: 34, paddingBottom: 32 },
  pageOneBodySpacious: { paddingBottom: 67 },
  breakdownColumn: { flex: 1.62 },
  sidebar: { flex: 0.98 },
  sidebarSpacious: { justifyContent: 'space-between' },
  sectionHeader: {
    color: colors.red,
    fontSize: 8.2,
    fontWeight: 'bold',
    letterSpacing: 1.65,
    borderBottom: `1.5 solid ${colors.ink}`,
    paddingBottom: 5,
    marginBottom: 4,
  },
  sectionHeaderSpacious: { fontSize: 9.2, paddingBottom: 6, marginBottom: 5 },
  table: { width: '100%' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4.3,
    borderBottom: `0.5 solid ${colors.line}`,
  },
  rowCompact: { paddingVertical: 3.2 },
  rowSpacious: { paddingVertical: 5.1 },
  rowText: { flex: 1 },
  rowPrimary: { color: colors.ink2, fontSize: 7.9, lineHeight: 1.2 },
  rowPrimarySpacious: { fontSize: 9.1, lineHeight: 1.25 },
  rowDescription: { color: colors.ink2, fontSize: 6.25, lineHeight: 1.3, marginTop: 2 },
  rowDescriptionSpacious: { fontSize: 7.25, lineHeight: 1.35, marginTop: 2.4 },
  rowValue: { width: 78, color: colors.ink2, textAlign: 'right', fontSize: 7.9, lineHeight: 1.2, fontWeight: 'bold' },
  rowValueSpacious: { width: 82, fontSize: 9.1, lineHeight: 1.25 },
  discount: { color: colors.red },
  groupLabel: {
    color: colors.ink2,
    fontSize: 6.8,
    fontWeight: 'bold',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
    borderBottom: `0.75 solid ${colors.ink}`,
    paddingTop: 6,
    paddingBottom: 3,
  },
  groupLabelSpacious: { fontSize: 7.6, paddingTop: 7, paddingBottom: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  totalRowSpacious: { paddingVertical: 9 },
  totalRowText: { color: colors.white, fontSize: 9.5, fontWeight: 'bold' },
  totalRowTextSpacious: { fontSize: 10.7 },
  card: { backgroundColor: colors.cream, border: `1 solid ${colors.line}`, borderRadius: 6, padding: 10, marginBottom: 9 },
  cardTitle: { color: colors.ink, fontSize: 8.8, fontWeight: 'bold', marginBottom: 6 },
  cardTitleSpacious: { fontSize: 9.7, marginBottom: 7 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  infoLabel: { color: colors.ink2, fontSize: 7.1 },
  infoLabelSpacious: { fontSize: 7.8 },
  infoValue: { flex: 1, color: colors.ink2, fontSize: 7.2, textAlign: 'right' },
  infoValueSpacious: { fontSize: 8 },
  codeCard: { backgroundColor: colors.cream, borderLeft: `3 solid ${colors.red}`, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 9 },
  codeTitle: { color: colors.ink, fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  codeTitleSpacious: { fontSize: 8.8 },
  codeText: { color: colors.ink2, fontSize: 6.55, lineHeight: 1.45, marginBottom: 2 },
  codeTextSpacious: { fontSize: 7.2 },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  qr: { width: 57, height: 57, backgroundColor: colors.white, padding: 3 },
  qrSpacious: { width: 78, height: 78, padding: 4 },
  qrCopy: { flex: 1 },
  qrTitle: { color: colors.ink, fontSize: 7.9, fontWeight: 'bold', lineHeight: 1.2, marginBottom: 3 },
  qrTitleSpacious: { fontSize: 8.7 },
  qrText: { color: colors.ink2, fontSize: 6.55, lineHeight: 1.35 },
  qrTextSpacious: { fontSize: 7.2 },
  reserve: { backgroundColor: colors.ink, color: colors.white, borderRadius: 6, padding: 11 },
  reserveSpacious: { padding: 13 },
  reserveTitle: { color: colors.white, fontSize: 9.5, fontWeight: 'bold', marginBottom: 5 },
  reserveTitleSpacious: { fontSize: 10.4 },
  reserveText: { color: '#B9C2D2', fontSize: 6.9, lineHeight: 1.42 },
  reserveTextSpacious: { fontSize: 7.5 },
  reserveChip: { alignSelf: 'flex-start', backgroundColor: colors.red, borderRadius: 4, marginTop: 7, paddingVertical: 5, paddingHorizontal: 8 },
  reserveChipText: { color: colors.white, fontSize: 7.2, fontWeight: 'bold' },
  reserveChipTextSpacious: { fontSize: 7.8 },
  reservePolicy: { color: '#9AA4B5', fontSize: 5.8, lineHeight: 1.3, marginTop: 6 },
  reservePolicySpacious: { fontSize: 6.2 },
  pageTwoTitle: { color: colors.ink, fontSize: 21, fontWeight: 'bold', borderBottom: `3 solid ${colors.red}`, paddingBottom: 9, marginBottom: 17 },
  pageTwoTitleSpacious: { fontSize: 22, paddingBottom: 9, marginBottom: 16 },
  twoUp: { flexDirection: 'row', gap: 12, marginBottom: 19 },
  twoUpSpacious: { marginBottom: 18 },
  featureCard: { flex: 1, border: `1 solid ${colors.line}`, borderTop: `4 solid ${colors.ink}`, borderRadius: 6, padding: 14, minHeight: 182 },
  featureCardSpacious: { minHeight: 184, padding: 16 },
  featureCardRed: { borderTop: `4 solid ${colors.red}` },
  cardEyebrow: { color: colors.ink2, fontSize: 7.4, fontWeight: 'bold', letterSpacing: 1.4, marginBottom: 6 },
  cardEyebrowSpacious: { fontSize: 8.2, marginBottom: 7 },
  cardLead: { color: colors.ink, fontSize: 22, fontWeight: 'bold', lineHeight: 1.05, marginBottom: 7 },
  cardLeadSpacious: { fontSize: 24, marginBottom: 9 },
  cardBody: { color: colors.ink2, fontSize: 7.6, lineHeight: 1.45, marginBottom: 3 },
  cardBodySpacious: { fontSize: 8.4, lineHeight: 1.48, marginBottom: 4 },
  promoFinance: { color: colors.red, fontSize: 7.7, fontWeight: 'bold', lineHeight: 1.35, marginTop: 5 },
  promoFinanceSpacious: { fontSize: 8.4, marginTop: 6 },
  stepsHeader: { color: colors.red, fontSize: 8.6, fontWeight: 'bold', letterSpacing: 1.65, marginBottom: 10 },
  stepsHeaderSpacious: { fontSize: 9.4, marginBottom: 10 },
  steps: { flexDirection: 'row', gap: 10, marginBottom: 19 },
  stepsSpacious: { marginBottom: 18 },
  step: { flex: 1, backgroundColor: colors.cream, borderRadius: 6, padding: 12, minHeight: 116 },
  stepSpacious: { minHeight: 122, padding: 14 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepNumberSpacious: { width: 25, height: 25, borderRadius: 12.5, marginBottom: 10 },
  stepNumberText: { color: colors.white, fontSize: 8, fontWeight: 'bold' },
  stepNumberTextSpacious: { fontSize: 9 },
  stepTitle: { color: colors.ink, fontSize: 9.3, fontWeight: 'bold', marginBottom: 5 },
  stepTitleSpacious: { fontSize: 10.3, marginBottom: 6 },
  stepBody: { color: colors.ink2, fontSize: 7.4, lineHeight: 1.45 },
  stepBodySpacious: { fontSize: 8.35, lineHeight: 1.48 },
  trust: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: colors.ink, borderRadius: 6, paddingVertical: 15, paddingHorizontal: 9, marginBottom: 15 },
  trustSpacious: { paddingVertical: 14, marginBottom: 14 },
  trustItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  trustItemBorder: { borderLeft: '0.5 solid #2A3752' },
  trustLead: { color: colors.gold, fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  trustLeadSpacious: { fontSize: 14.2, marginBottom: 5 },
  trustLabel: { color: '#AAB3C1', fontSize: 6.1, lineHeight: 1.35, letterSpacing: 0.6, textAlign: 'center' },
  trustLabelSpacious: { fontSize: 6.7 },
  reviewQuote: { borderLeft: `3 solid ${colors.gold}`, paddingVertical: 10, paddingLeft: 12, paddingRight: 8, marginBottom: 13 },
  reviewQuoteSpacious: { paddingVertical: 10, marginBottom: 12 },
  reviewText: { color: colors.ink2, fontSize: 8.7, lineHeight: 1.45, fontStyle: 'italic' },
  reviewTextSpacious: { fontSize: 9.5, lineHeight: 1.5 },
  reviewAttribution: { color: colors.ink2, fontSize: 7, marginTop: 5 },
  reviewAttributionSpacious: { fontSize: 7.5, marginTop: 6 },
  closeout: { borderLeft: `3 solid ${colors.gold}`, backgroundColor: colors.cream, paddingVertical: 11, paddingHorizontal: 12 },
  closeoutWithFollowingContent: { marginBottom: 12 },
  closeoutSpacious: { paddingVertical: 10, paddingHorizontal: 14 },
  closeoutTitle: { color: colors.ink, fontSize: 9.5, fontWeight: 'bold', marginBottom: 4 },
  closeoutTitleSpacious: { fontSize: 10.5, marginBottom: 5 },
  closeoutText: { color: colors.ink2, fontSize: 7.5, lineHeight: 1.45 },
  closeoutTextSpacious: { fontSize: 8.35, lineHeight: 1.48 },
  closeoutCaveat: { color: colors.ink2, fontSize: 7.4, lineHeight: 1.4, fontWeight: 'bold', marginTop: 5 },
  closeoutCaveatSpacious: { fontSize: 8.2, lineHeight: 1.45, marginTop: 6 },
  noteBox: { border: `1 solid ${colors.line}`, borderLeft: `3 solid ${colors.red}`, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 10 },
  noteTitle: { color: colors.ink, fontSize: 8.3, fontWeight: 'bold', marginBottom: 3 },
  noteText: { color: colors.ink2, fontSize: 7, lineHeight: 1.4 },
  depositBox: { backgroundColor: colors.cream, border: `1 solid ${colors.ink}`, borderLeft: `4 solid ${colors.red}`, padding: 10, marginBottom: 10 },
  waterTestBand: { position: 'absolute', left: 34, right: 34, bottom: 38, backgroundColor: colors.cream, borderLeft: `3 solid ${colors.gold}`, paddingVertical: 7, paddingHorizontal: 10 },
  waterTestBandText: { color: colors.ink2, fontSize: 7.3, lineHeight: 1.35, fontWeight: 'bold', textAlign: 'center' },
  footerRule: { position: 'absolute', left: 34, right: 34, bottom: 25, borderTop: `1 solid ${colors.line}` },
  footerText: { position: 'absolute', left: 34, bottom: 15, color: colors.ink2, fontSize: 5.9 },
  footerPage: { position: 'absolute', right: 34, bottom: 15, color: colors.ink2, fontSize: 5.9, textAlign: 'right' },
  pageTwoFooterText: { position: 'absolute', left: 68, bottom: 15, color: colors.ink2, fontSize: 5.9 },
  pageTwoFooterPage: { position: 'absolute', right: 68, bottom: 15, color: colors.ink2, fontSize: 5.9, textAlign: 'right' },
});

type LineItem = {
  name: string;
  price: number;
  description?: string;
  category?: 'equipment' | 'installation' | 'protection' | 'custom';
};

export interface QuotePDFProps {
  quoteData: {
    quoteNumber: string | number;
    date: string;
    validUntil?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productName: string;
    horsepower: string;
    category: string;
    modelYear: string | number;
    motorImageUrl?: string;
    msrp: string;
    dealerDiscount: string;
    promoSavings: string;
    motorSubtotal: string;
    subtotal: string;
    tax: string;
    total: string;
    totalSavings: string;
    accessoryBreakdown?: LineItem[];
    tradeInValue?: number;
    tradeInInfo?: { brand: string; year: number; horsepower: number; model?: string };
    customerNotes?: string;
    promoEndDate?: string;
    includedCoverageYears?: number;
    productProtection?: { planYears: number; totalCoverageYears: number; priceBeforeTax: number; monthlyDelta?: number };
    selectedPackage?: { id: string; label: string; coverageYears: number; features: string[] };
    monthlyPayment?: number;
    financingTerm?: number;
    financingRate?: number;
    financingAmount?: number;
    dealerFee?: number;
    financingContractTerm?: number;
    savedQuoteQrCode?: string;
    recommendedDepositAmount?: number;
    promotionalFinancingAlternative?: { rate: number; termMonths: number };
    /** @deprecated Use savedQuoteQrCode. */
    financingQrCode?: string;
    includesInstallation?: boolean;
    selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
    selectedPromoValue?: string | null;
    selectedPaymentMethod?: 'cash_purchase' | 'standard_financing' | 'special_financing' | null;
    promotionName?: string;
    promotionCombinationMode?: 'layered' | 'choose_one';
    googleRating?: number;
    googleReviewCount?: number;
    depositInfo?: { amount: number; referenceNumber: string; paymentDate: string; paymentMethod?: string; paymentId?: string; status?: string };
    pricing?: { msrp: number; discount: number; adminDiscount?: number; promoValue: number; motorSubtotal: number; subtotal: number; hst: number; totalCashPrice: number; savings: number };
  };
}

function dateAtEndOfDay(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T23:59:59`) : new Date(value);
}

function formattedDate(value: string): string {
  return dateAtEndOfDay(value).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function validUntilText(quoteDate: string, validUntil?: string, promoEndDate?: string): string {
  if (validUntil) return formattedDate(validUntil);
  const issued = new Date(quoteDate);
  const thirtyDays = new Date(issued);
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const promoEnd = promoEndDate ? dateAtEndOfDay(promoEndDate) : null;
  const expiry = promoEnd && promoEnd < thirtyDays ? promoEnd : thirtyDays;
  return expiry.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function motorCodeBreakdown(productName: string): string[] {
  const codeMatch = productName.match(/^([\d.]+)\s*([A-Z]+)?/i);
  const modelCode = codeMatch ? `${codeMatch[1]}${codeMatch[2] || ''}`.toUpperCase() : '';
  const upper = productName.toUpperCase();
  const rig = parseMercuryRigCodes(productName);
  const items: string[] = [];
  if (codeMatch?.[1]) items.push(`${codeMatch[1]} = horsepower`);
  if (modelCode.includes('M')) items.push('M = manual start');
  else if (modelCode.includes('E')) items.push('E = electric start');
  if (modelCode.includes('H')) items.push('H = tiller handle');
  else if (modelCode.includes('R')) items.push('R = remote control');
  if (modelCode.includes('XXL')) items.push('XXL = 30-inch shaft');
  else if (modelCode.includes('XL')) items.push('XL = 25-inch shaft');
  else if (modelCode.includes('L')) items.push('L = 20-inch shaft');
  else items.push(`Standard ${rig.shaft_inches}-inch shaft`);
  if (modelCode.includes('PT')) items.push('PT = Power Trim and Tilt');
  if (modelCode.includes('CT')) items.push('CT = Command Thrust gearcase');
  if (upper.includes('EFI')) items.push('EFI = Electronic Fuel Injection');
  return items;
}

export function mercuryFamilyLabel(productName: string, horsepower: string | number, rawCategory?: string): string {
  const product = productName.toUpperCase();
  const hp = Number.parseFloat(String(horsepower));

  if (product.includes('SEA PRO') || product.includes('SEAPRO')) return 'commercial';
  if (product.includes('VERADO')) return 'premium';
  if (product.includes('PRO XS')) return 'high-performance';
  if (product.includes('PROKICKER')) return 'trolling';
  if (product.includes('FOURSTROKE')) {
    if (Number.isFinite(hp) && hp <= 20) return 'portable';
    if (Number.isFinite(hp) && hp <= 150) return 'mid-range';
    return 'high-horsepower';
  }

  return rawCategory?.trim().toLowerCase().replace(/_/g, '-') || 'recreational';
}

export function motorMetaLine(quoteData: QuotePDFProps['quoteData'], codeItems: string[]): string {
  const decoded = codeItems
    .filter((item) => !item.endsWith('= horsepower'))
    .slice(0, 3)
    .map((item) => item.split(' = ')[1] || item)
    .join(' | ');
  return [
    `Mercury ${mercuryFamilyLabel(quoteData.productName, quoteData.horsepower, quoteData.category)}`,
    quoteData.horsepower,
    decoded,
  ].filter(Boolean).join(' | ');
}

export function financingTermsLine(rate: number, contractTerm: number, amortizationTerm: number): string {
  if (contractTerm === amortizationTerm) {
    return `${rate}% APR | ${contractTerm}-month contract and amortization`;
  }
  return `${rate}% APR | ${contractTerm}-month contract | payment based on ${amortizationTerm}-month amortization`;
}

export const FINANCING_ESTIMATE_DISCLAIMER = 'Payment figures are estimates and may change with the final financed amount, rate, term or lender approval.';

export function quoteInspectionCaveat(quoteData: Pick<QuotePDFProps['quoteData'], 'accessoryBreakdown' | 'tradeInValue'>): string | null {
  const hasTradeIn = Number(quoteData.tradeInValue || 0) > 0;
  const hasPropeller = Boolean(
    quoteData.accessoryBreakdown?.some((item) => item.name.toLowerCase().includes('propeller')),
  );

  if (hasTradeIn && hasPropeller) {
    return 'Final trade-in value and propeller fit remain subject to final inspection and water testing.';
  }
  if (hasTradeIn) {
    return 'Final trade-in value remains subject to final inspection and verification.';
  }
  if (hasPropeller) {
    return 'Propeller fit remains subject to final inspection and water testing.';
  }
  return null;
}

function tradeDescription(info?: QuotePDFProps['quoteData']['tradeInInfo']): string {
  if (!info) return '';
  return [info.year, info.brand, `${info.horsepower} HP`, info.model].filter(Boolean).join(' ');
}

function LineItemRow({ item, compact }: { item: LineItem; compact: boolean }) {
  return (
    <View style={[styles.row, compact ? styles.rowCompact : styles.rowSpacious]} wrap={false}>
      <View style={styles.rowText}>
        <Text style={[styles.rowPrimary, compact ? {} : styles.rowPrimarySpacious]}>{item.name}</Text>
        {item.description ? <Text style={[styles.rowDescription, compact ? {} : styles.rowDescriptionSpacious]}>{item.description}</Text> : null}
      </View>
      <Text style={[styles.rowValue, compact ? {} : styles.rowValueSpacious]}>${money(item.price)}</Text>
    </View>
  );
}

function StepCard({ number, title, children, spacious = false }: { number: string; title: string; children: React.ReactNode; spacious?: boolean }) {
  return (
    <View style={[styles.step, spacious ? styles.stepSpacious : {}]}>
      <View style={[styles.stepNumber, spacious ? styles.stepNumberSpacious : {}]}><Text style={[styles.stepNumberText, spacious ? styles.stepNumberTextSpacious : {}]}>{number}</Text></View>
      <Text style={[styles.stepTitle, spacious ? styles.stepTitleSpacious : {}]}>{title}</Text>
      <Text style={[styles.stepBody, spacious ? styles.stepBodySpacious : {}]}>{children}</Text>
    </View>
  );
}

function TrustItem({ lead, label, bordered = false, spacious = false }: { lead: string; label: string; bordered?: boolean; spacious?: boolean }) {
  return (
    <View style={[styles.trustItem, bordered ? styles.trustItemBorder : {}]}>
      <Text style={[styles.trustLead, spacious ? styles.trustLeadSpacious : {}]}>{lead}</Text>
      <Text style={[styles.trustLabel, spacious ? styles.trustLabelSpacious : {}]}>{label}</Text>
    </View>
  );
}

export const ProfessionalQuotePDF: React.FC<QuotePDFProps> = ({ quoteData }) => {
  const savedQuoteQrCode = quoteData.savedQuoteQrCode ?? quoteData.financingQrCode;
  const expiry = validUntilText(quoteData.date, quoteData.validUntil, quoteData.promoEndDate);
  const items = quoteData.accessoryBreakdown || [];
  const groups = [
    { key: 'equipment', title: 'Equipment and Rigging', items: items.filter((item) => !item.category || item.category === 'equipment') },
    { key: 'installation', title: 'Installation and Setup', items: items.filter((item) => item.category === 'installation') },
    { key: 'protection', title: 'Mercury Product Protection', items: items.filter((item) => item.category === 'protection') },
    { key: 'custom', title: 'Additional Items', items: items.filter((item) => item.category === 'custom') },
  ].filter((group) => group.items.length > 0);
  const includedCoverage = quoteData.includedCoverageYears ?? 3;
  const coverageTotal = quoteData.productProtection?.totalCoverageYears ?? includedCoverage;
  const hasFinancing = quoteData.selectedPaymentMethod !== 'cash_purchase'
    && Boolean(quoteData.monthlyPayment && quoteData.financingTerm && quoteData.financingRate != null);
  const alternatePromotion = quoteData.promotionalFinancingAlternative;
  const recommendedDeposit = quoteData.recommendedDepositAmount
    ?? getRecommendedDeposit(Number.parseFloat(quoteData.horsepower) || 0);
  const showAlternatePromotion = Boolean(
    alternatePromotion
      && (!hasFinancing
        || alternatePromotion.rate !== quoteData.financingRate
        || alternatePromotion.termMonths !== quoteData.financingTerm),
  );
  const compactRows = items.length >= 7
    || Boolean(quoteData.tradeInValue)
    || Boolean(quoteData.customerNotes)
    || Boolean(quoteData.depositInfo);
  const spaciousLayout = !compactRows;
  const firstPageRowStyle = [styles.row, compactRows ? styles.rowCompact : styles.rowSpacious];
  const firstPagePrimaryStyle = [styles.rowPrimary, spaciousLayout ? styles.rowPrimarySpacious : {}];
  const firstPageDescriptionStyle = [styles.rowDescription, spaciousLayout ? styles.rowDescriptionSpacious : {}];
  const firstPageValueStyle = [styles.rowValue, spaciousLayout ? styles.rowValueSpacious : {}];
  const firstPageInfoLabelStyle = [styles.infoLabel, spaciousLayout ? styles.infoLabelSpacious : {}];
  const firstPageInfoValueStyle = [styles.infoValue, spaciousLayout ? styles.infoValueSpacious : {}];
  const codeItems = motorCodeBreakdown(quoteData.productName);
  const firstCodeLine = codeItems.slice(0, 3).join(' | ');
  const secondCodeLine = codeItems.slice(3).join(' | ');
  const savingsNumber = Number(String(quoteData.totalSavings).replace(/,/g, ''));
  const promoEndCopy = quoteData.promoEndDate ? ` | ends ${formattedDate(quoteData.promoEndDate)}` : '';
  const footerAddress = 'Harris Boat Works | 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0';
  const financingContractTerm = quoteData.financingContractTerm || 60;
  const googleRating = typeof quoteData.googleRating === 'number' && Number.isFinite(quoteData.googleRating)
    ? quoteData.googleRating
    : GOOGLE_REVIEWS_FALLBACK.rating;
  const googleReviewCount = typeof quoteData.googleReviewCount === 'number' && Number.isFinite(quoteData.googleReviewCount)
    ? quoteData.googleReviewCount
    : GOOGLE_REVIEWS_FALLBACK.totalReviews;
  const inspectionCaveat = quoteInspectionCaveat(quoteData);
  const hasFollowingPageTwoContent = Boolean(quoteData.customerNotes || quoteData.depositInfo);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.brandPlate}>
              <Image src={harrisLogoWhite} style={styles.harrisLogo} />
              <View style={styles.brandDivider} />
              <Image src={mercuryLogoWhite} style={styles.mercuryLogo} />
            </View>
            <View>
              <Text style={styles.documentLabel}>MERCURY OUTBOARD QUOTE</Text>
              <Text style={styles.documentKicker}>MERCURY MARINE PREMIER DEALER</Text>
            </View>
          </View>

          <View style={styles.heroMain}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>CONFIGURED FOR YOU</Text>
              <Text style={styles.heroProduct}>{quoteData.productName}</Text>
              <Text style={styles.heroMeta}>{motorMetaLine(quoteData, codeItems)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceBand}>
          <View>
            <Text style={styles.priceEyebrow}>TOTAL CASH PRICE | HST INCLUDED</Text>
            <Text style={styles.priceAmount}>${quoteData.total}</Text>
          </View>
          <View style={styles.savingsPill}>
            <Text style={styles.savingsPillText}>{savingsNumber > 0 ? `You save $${quoteData.totalSavings} vs MSRP` : 'Clear Canadian pricing'}</Text>
          </View>
        </View>

        <View style={[styles.pageOneBody, spaciousLayout ? styles.pageOneBodySpacious : {}]}>
          <View style={styles.breakdownColumn}>
            <Text style={[styles.sectionHeader, spaciousLayout ? styles.sectionHeaderSpacious : {}]}>TRANSPARENT PRICE BREAKDOWN</Text>
            <View style={styles.table}>
              <View style={firstPageRowStyle}>
                <Text style={firstPagePrimaryStyle}>Mercury outboard MSRP</Text>
                <Text style={[...firstPageValueStyle, { color: colors.ink2, textDecoration: 'line-through' }]}>${quoteData.msrp}</Text>
              </View>
              {Number(String(quoteData.dealerDiscount).replace(/,/g, '')) > 0 ? (
                <View style={firstPageRowStyle}>
                  <Text style={firstPagePrimaryStyle}>HBW dealer discount</Text>
                  <Text style={[...firstPageValueStyle, styles.discount]}>-${quoteData.dealerDiscount}</Text>
                </View>
              ) : null}
              {(quoteData.pricing?.adminDiscount || 0) > 0 ? (
                <View style={firstPageRowStyle}>
                  <Text style={firstPagePrimaryStyle}>Additional quote discount</Text>
                  <Text style={[...firstPageValueStyle, styles.discount]}>-${money(quoteData.pricing?.adminDiscount)}</Text>
                </View>
              ) : null}
              {Number(String(quoteData.promoSavings).replace(/,/g, '')) > 0 ? (
                <View style={firstPageRowStyle} wrap={false}>
                  <View style={styles.rowText}>
                    <Text style={firstPagePrimaryStyle}>{quoteData.promotionName || 'Mercury Canada promotion'}</Text>
                    <Text style={firstPageDescriptionStyle}>Factory promotional savings applied{promoEndCopy}</Text>
                  </View>
                  <Text style={[...firstPageValueStyle, styles.discount]}>-${quoteData.promoSavings}</Text>
                </View>
              ) : null}
              <View style={firstPageRowStyle}>
                <Text style={[...firstPagePrimaryStyle, { fontWeight: 'bold' }]}>Motor price after discounts</Text>
                <Text style={firstPageValueStyle}>${quoteData.motorSubtotal}</Text>
              </View>
              {!quoteData.includesInstallation ? (
                <View style={firstPageRowStyle} wrap={false}>
                  <View style={styles.rowText}>
                    <Text style={firstPagePrimaryStyle}>Loose motor configuration</Text>
                    <Text style={firstPageDescriptionStyle}>Installation is not included</Text>
                  </View>
                </View>
              ) : null}
              {groups.map((group) => (
                <View key={group.key}>
                  <View wrap={false}>
                    <Text style={[styles.groupLabel, spaciousLayout ? styles.groupLabelSpacious : {}]}>{group.title}</Text>
                    <LineItemRow item={group.items[0]} compact={compactRows} />
                  </View>
                  {group.items.slice(1).map((item, index) => <LineItemRow key={`${group.key}-${index + 1}-${item.name}`} item={item} compact={compactRows} />)}
                </View>
              ))}
              {groups.length === 0 && quoteData.includesInstallation ? (
                <View style={firstPageRowStyle}>
                  <Text style={firstPagePrimaryStyle}>Configured installation and setup</Text>
                  <Text style={firstPageValueStyle}>As shown</Text>
                </View>
              ) : null}
              {quoteData.tradeInValue && quoteData.tradeInValue > 0 ? (
                <>
                  <View style={firstPageRowStyle} wrap={false}>
                    <View style={styles.rowText}>
                      <Text style={firstPagePrimaryStyle}>Estimated trade-in value</Text>
                      <Text style={firstPageDescriptionStyle}>{tradeDescription(quoteData.tradeInInfo)}</Text>
                    </View>
                    <Text style={[...firstPageValueStyle, styles.discount]}>-${money(quoteData.tradeInValue)}</Text>
                  </View>
                  <View style={firstPageRowStyle} wrap={false}>
                    <View style={styles.rowText}>
                      <Text style={firstPagePrimaryStyle}>HST savings from trade-in</Text>
                      <Text style={firstPageDescriptionStyle}>HST is not charged on the eligible trade-in portion</Text>
                    </View>
                    <Text style={firstPageValueStyle}>${money(quoteData.tradeInValue * 0.13)} saved</Text>
                  </View>
                </>
              ) : null}
              <View style={firstPageRowStyle}>
                <Text style={firstPagePrimaryStyle}>Subtotal</Text><Text style={firstPageValueStyle}>${quoteData.subtotal}</Text>
              </View>
              <View style={firstPageRowStyle}>
                <Text style={firstPagePrimaryStyle}>HST (13%)</Text><Text style={firstPageValueStyle}>${quoteData.tax}</Text>
              </View>
              <View style={[styles.totalRow, spaciousLayout ? styles.totalRowSpacious : {}]}>
                <Text style={[styles.totalRowText, spaciousLayout ? styles.totalRowTextSpacious : {}]}>TOTAL CASH PRICE</Text><Text style={[styles.totalRowText, spaciousLayout ? styles.totalRowTextSpacious : {}]}>${quoteData.total} CAD</Text>
              </View>
            </View>
          </View>

          <View style={[styles.sidebar, spaciousLayout ? styles.sidebarSpacious : {}]}>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, spaciousLayout ? styles.cardTitleSpacious : {}]}>Quote Details</Text>
              <View style={styles.infoRow}><Text style={firstPageInfoLabelStyle}>Customer</Text><Text style={firstPageInfoValueStyle}>{quoteData.customerName}</Text></View>
              {quoteData.customerEmail ? <View style={styles.infoRow}><Text style={firstPageInfoLabelStyle}>Email</Text><Text style={firstPageInfoValueStyle}>{quoteData.customerEmail}</Text></View> : null}
              {quoteData.customerPhone ? <View style={styles.infoRow}><Text style={firstPageInfoLabelStyle}>Phone</Text><Text style={firstPageInfoValueStyle}>{quoteData.customerPhone}</Text></View> : null}
              <View style={styles.infoRow}><Text style={firstPageInfoLabelStyle}>Quote #</Text><Text style={firstPageInfoValueStyle}>{quoteData.quoteNumber}</Text></View>
              <View style={styles.infoRow}><Text style={firstPageInfoLabelStyle}>Issued</Text><Text style={firstPageInfoValueStyle}>{quoteData.date}</Text></View>
              <View style={styles.infoRow}><Text style={firstPageInfoLabelStyle}>Valid until</Text><Text style={[...firstPageInfoValueStyle, { fontWeight: 'bold' }]}>{expiry}</Text></View>
            </View>

            <View style={styles.codeCard}>
              <Text style={[styles.codeTitle, spaciousLayout ? styles.codeTitleSpacious : {}]}>Understanding your motor code</Text>
              <Text style={[styles.codeText, spaciousLayout ? styles.codeTextSpacious : {}]}>{firstCodeLine}</Text>
              {secondCodeLine ? <Text style={[styles.codeText, spaciousLayout ? styles.codeTextSpacious : {}]}>{secondCodeLine}</Text> : null}
            </View>

            {savedQuoteQrCode ? (
              <View style={styles.card}>
                <View style={styles.qrRow}>
                  <Image src={savedQuoteQrCode} style={[styles.qr, spaciousLayout ? styles.qrSpacious : {}]} />
                  <View style={styles.qrCopy}>
                    <Text style={[styles.qrTitle, spaciousLayout ? styles.qrTitleSpacious : {}]}>Scan to reopen this quote</Text>
                    <Text style={[styles.qrText, spaciousLayout ? styles.qrTextSpacious : {}]}>Your exact configuration, saved. Continue whenever you are ready.</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {!quoteData.depositInfo ? (
              <View style={[styles.reserve, spaciousLayout ? styles.reserveSpacious : {}]}>
                <Text style={[styles.reserveTitle, spaciousLayout ? styles.reserveTitleSpacious : {}]}>Ready to lock this in?</Text>
                <Text style={[styles.reserveText, spaciousLayout ? styles.reserveTextSpacious : {}]}>A ${money(recommendedDeposit).replace('.00', '')} deposit holds this motor and your place in the schedule. The deposit applies to your final invoice.</Text>
                <View style={styles.reserveChip}><Text style={[styles.reserveChipText, spaciousLayout ? styles.reserveChipTextSpacious : {}]}>Call (905) 342-2153 | Text (647) 952-2153</Text></View>
                <Text style={[styles.reservePolicy, spaciousLayout ? styles.reservePolicySpacious : {}]}>Refundability depends on stock or special-order status and when the order is committed.</Text>
              </View>
            ) : (
              <View style={[styles.reserve, spaciousLayout ? styles.reserveSpacious : {}]}>
                <Text style={[styles.reserveTitle, spaciousLayout ? styles.reserveTitleSpacious : {}]}>Deposit received</Text>
                <Text style={[styles.reserveText, spaciousLayout ? styles.reserveTextSpacious : {}]}>${money(quoteData.depositInfo.amount)} received. Reference {quoteData.depositInfo.referenceNumber}.</Text>
              </View>
            )}
          </View>
        </View>

        {spaciousLayout ? (
          <View style={styles.waterTestBand}>
            <Text style={styles.waterTestBandText}>{quoteData.includesInstallation
              ? 'Every installed repower is water-tested on Rice Lake before pickup.'
              : 'Every loose motor is prepared, test-run and commissioned before pickup.'}</Text>
          </View>
        ) : null}

        <View style={styles.footerRule} />
        <Text style={styles.footerText}>{footerAddress}</Text>
        <Text style={styles.footerPage}>Page 1 of 2</Text>
      </Page>

      <Page size="LETTER" style={styles.pageTwo}>
        <Text style={[styles.pageTwoTitle, spaciousLayout ? styles.pageTwoTitleSpacious : {}]}>Coverage, Payment &amp; Next Steps</Text>

        <View style={[styles.twoUp, spaciousLayout ? styles.twoUpSpacious : {}]}>
          <View style={[styles.featureCard, spaciousLayout ? styles.featureCardSpacious : {}]}>
            <Text style={[styles.cardEyebrow, spaciousLayout ? styles.cardEyebrowSpacious : {}]}>MERCURY COVERAGE</Text>
            <Text style={[styles.cardLead, spaciousLayout ? styles.cardLeadSpacious : {}]}>{coverageTotal} years total</Text>
            <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>{includedCoverage} years of combined Mercury factory and applicable promotional coverage are included.</Text>
            {quoteData.productProtection ? (
              <>
                <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}, { color: colors.ink, fontWeight: 'bold', marginTop: 3 }]}>{quoteData.productProtection.planYears} additional years of Platinum Product Protection</Text>
                <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>${money(quoteData.productProtection.priceBeforeTax)} before HST</Text>
                {hasFinancing && quoteData.productProtection.monthlyDelta ? <Text style={[styles.promoFinance, spaciousLayout ? styles.promoFinanceSpacious : {}]}>Approximately +${quoteData.productProtection.monthlyDelta}/month with this financing estimate</Text> : null}
              </>
            ) : <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>No additional paid Product Protection plan selected.</Text>}
            <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}, { marginTop: 3 }]}>Final eligibility and coverage dates are confirmed using the engine serial number.</Text>
          </View>

          <View style={[styles.featureCard, styles.featureCardRed, spaciousLayout ? styles.featureCardSpacious : {}]}>
            <Text style={[styles.cardEyebrow, spaciousLayout ? styles.cardEyebrowSpacious : {}]}>{hasFinancing ? 'FINANCING ESTIMATE' : 'PURCHASE METHOD'}</Text>
            {hasFinancing ? (
              <>
                <Text style={[styles.cardLead, spaciousLayout ? styles.cardLeadSpacious : {}]}>${money(quoteData.monthlyPayment).replace('.00', '')}/month</Text>
                <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>{financingTermsLine(quoteData.financingRate!, financingContractTerm, quoteData.financingTerm!)}</Text>
                {quoteData.financingAmount ? <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>Amount financed: ${money(quoteData.financingAmount)} CAD</Text> : null}
                {quoteData.dealerFee ? <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>Includes ${money(quoteData.dealerFee)} DealerPlan administration fee</Text> : null}
                <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>{(quoteData.financingTerm || 0) > financingContractTerm
                  ? 'A balance may remain at contract end and may need to be paid or refinanced. On approved credit.'
                  : 'On approved credit.'}</Text>
                <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}, { marginTop: 3 }]}>{FINANCING_ESTIMATE_DISCLAIMER}</Text>
              </>
            ) : (
              <>
                <Text style={[styles.cardLead, spaciousLayout ? styles.cardLeadSpacious : {}]}>{quoteData.selectedPaymentMethod === 'cash_purchase' ? 'Cash purchase' : 'Financing not shown'}</Text>
                <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}]}>{quoteData.selectedPaymentMethod === 'cash_purchase' ? 'No financing fee or monthly-payment estimate is included in this quote.' : 'Ask us for current Canadian marine financing options if you would like a payment estimate.'}</Text>
              </>
            )}
            {showAlternatePromotion && alternatePromotion ? <Text style={[styles.promoFinance, spaciousLayout ? styles.promoFinanceSpacious : {}]}>Promotional {alternatePromotion.rate}% APR for {alternatePromotion.termMonths} months may also be available on approved credit - ask us.</Text> : null}
            {quoteData.promotionName ? <Text style={[styles.cardBody, spaciousLayout ? styles.cardBodySpacious : {}, { marginTop: 5 }]}>{quoteData.promotionName}{quoteData.promoEndDate ? ` | ends ${formattedDate(quoteData.promoEndDate)}` : ''}</Text> : null}
          </View>
        </View>

        <Text style={[styles.stepsHeader, spaciousLayout ? styles.stepsHeaderSpacious : {}]}>WHAT HAPPENS NEXT</Text>
        <View style={[styles.steps, spaciousLayout ? styles.stepsSpacious : {}]}>
          <StepCard number="1" title="Reserve" spacious={spaciousLayout}>A ${money(recommendedDeposit).replace('.00', '')} deposit reserves your motor and your place in the schedule.</StepCard>
          {quoteData.includesInstallation ? (
            <StepCard number="2" title="We rig and water-test" spacious={spaciousLayout}>Installed, commissioned, and run on Rice Lake. Prop setup is checked and adjusted as needed.</StepCard>
          ) : (
            <StepCard number="2" title="We prep and test-run" spacious={spaciousLayout}>Your motor is prepared, test-run, and commissioned before pickup.</StepCard>
          )}
          <StepCard number="3" title={quoteData.includesInstallation ? 'Pick up and go boating' : 'Pick up your motor'} spacious={spaciousLayout}>{quoteData.includesInstallation ? 'Get a complete walkthrough of your new Mercury at our Gores Landing shop, about 90 minutes from Toronto.' : 'Review the motor, included equipment, and commissioning details with our team before leaving.'}</StepCard>
        </View>

        <View style={[styles.trust, spaciousLayout ? styles.trustSpacious : {}]}>
          <TrustItem lead="1947" label="FAMILY-OWNED SINCE" spacious={spaciousLayout} />
          <TrustItem lead="1965" label="MERCURY DEALER SINCE" bordered spacious={spaciousLayout} />
          <TrustItem lead="Premier" label="MERCURY MARINE DEALER" bordered spacious={spaciousLayout} />
          <TrustItem lead={quoteData.includesInstallation ? 'Rice Lake' : 'Tested'} label={quoteData.includesInstallation ? 'INSTALLED REPOWERS WATER-TESTED' : 'PRE-DELIVERY MOTOR CHECK'} bordered spacious={spaciousLayout} />
          <TrustItem lead={`${googleRating} stars`} label={`${googleReviewCount} GOOGLE REVIEWS`} bordered spacious={spaciousLayout} />
        </View>

        <View style={[styles.reviewQuote, spaciousLayout ? styles.reviewQuoteSpacious : {}]}>
          <Text style={[styles.reviewText, spaciousLayout ? styles.reviewTextSpacious : {}]}>"Great service. Great price on a new outboard. Called from out of town and organized purchase and pickup, very easy. Had all the new features explained to me when I picked it up."</Text>
          <Text style={[styles.reviewAttribution, spaciousLayout ? styles.reviewAttributionSpacious : {}]}>- Erik F. | Google review</Text>
        </View>

        <View style={[styles.closeout, spaciousLayout ? styles.closeoutSpacious : {}, hasFollowingPageTwoContent ? styles.closeoutWithFollowingContent : {}]}>
          <Text style={[styles.closeoutTitle, spaciousLayout ? styles.closeoutTitleSpacious : {}]}>Straight answers, complete pricing</Text>
          <Text style={[styles.closeoutText, spaciousLayout ? styles.closeoutTextSpacious : {}]}>This quote is built from the motor, equipment, promotion, trade-in and installation choices shown here. If anything about your boat changes, call or text us and we will update the configuration before you commit.</Text>
          {inspectionCaveat ? <Text style={[styles.closeoutCaveat, spaciousLayout ? styles.closeoutCaveatSpacious : {}]}>{inspectionCaveat}</Text> : null}
        </View>

        {quoteData.customerNotes ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>A note from Harris Boat Works</Text>
            <Text style={styles.noteText}>{quoteData.customerNotes}</Text>
          </View>
        ) : null}

        {quoteData.depositInfo ? (
          <View style={styles.depositBox}>
            <Text style={styles.noteTitle}>Deposit Payment Confirmed - ${money(quoteData.depositInfo.amount)} CAD</Text>
            <Text style={styles.noteText}>Reference: {quoteData.depositInfo.referenceNumber} | Date: {quoteData.depositInfo.paymentDate}</Text>
            {quoteData.depositInfo.paymentMethod ? <Text style={styles.noteText}>Method: {quoteData.depositInfo.paymentMethod}</Text> : null}
            <Text style={styles.noteText}>Balance due: ${money((quoteData.pricing?.totalCashPrice || Number(String(quoteData.total).replace(/,/g, ''))) - quoteData.depositInfo.amount)} CAD</Text>
          </View>
        ) : null}

        <View style={styles.footerRule} />
        <Text style={styles.pageTwoFooterText}>Harris Boat Works | Call 905-342-2153 | Text 647-952-2153 | mercuryrepower.ca</Text>
        <Text style={styles.pageTwoFooterPage}>Page 2 of 2</Text>
      </Page>
    </Document>
  );
};

export default ProfessionalQuotePDF;
