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
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

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
  grey: '#5B6472',
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
    backgroundColor: colors.white,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  harrisLogo: { width: 42, height: 30, objectFit: 'contain' },
  brandDivider: { width: 1, height: 24, backgroundColor: colors.line },
  mercuryLogo: { width: 84, height: 17, objectFit: 'contain' },
  documentLabel: { color: colors.white, fontSize: 10, fontWeight: 'bold', textAlign: 'right', letterSpacing: 0.5 },
  documentKicker: { color: '#9AA4B5', fontSize: 6.7, textAlign: 'right', letterSpacing: 1.2, marginTop: 3 },
  heroMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18 },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: colors.gold, fontSize: 7.2, fontWeight: 'bold', letterSpacing: 2, marginBottom: 6 },
  heroProduct: { color: colors.white, fontSize: 27, lineHeight: 1.02, fontWeight: 'bold', letterSpacing: -0.6 },
  heroMeta: { color: '#B9C2D2', fontSize: 8.5, lineHeight: 1.35, marginTop: 7 },
  motorPanel: {
    width: 128,
    height: 94,
    backgroundColor: colors.cream,
    border: '1 solid #2A3752',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motorImage: { width: 112, height: 78, objectFit: 'contain' },
  motorFallbackLogo: { width: 92, height: 22, objectFit: 'contain' },
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
  priceEyebrow: { color: colors.grey, fontSize: 7.3, fontWeight: 'bold', letterSpacing: 1.7, marginBottom: 3 },
  priceAmount: { color: colors.ink, fontSize: 25, lineHeight: 1, fontWeight: 'bold' },
  savingsPill: { backgroundColor: colors.red, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 11 },
  savingsPillText: { color: colors.white, fontSize: 8.4, fontWeight: 'bold' },
  pageOneBody: { flex: 1, flexDirection: 'row', gap: 18, paddingTop: 15, paddingHorizontal: 34, paddingBottom: 32 },
  breakdownColumn: { flex: 1.62 },
  sidebar: { flex: 0.98 },
  sectionHeader: {
    color: colors.red,
    fontSize: 8.2,
    fontWeight: 'bold',
    letterSpacing: 1.65,
    borderBottom: `1.5 solid ${colors.ink}`,
    paddingBottom: 5,
    marginBottom: 4,
  },
  table: { width: '100%' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4.3,
    borderBottom: `0.5 solid ${colors.line}`,
  },
  rowCompact: { paddingVertical: 3.2 },
  rowText: { flex: 1 },
  rowPrimary: { color: colors.ink2, fontSize: 7.9, lineHeight: 1.2 },
  rowDescription: { color: colors.grey, fontSize: 6.25, lineHeight: 1.3, marginTop: 2 },
  rowValue: { width: 78, color: colors.ink2, textAlign: 'right', fontSize: 7.9, lineHeight: 1.2, fontWeight: 'bold' },
  discount: { color: colors.red },
  groupLabel: {
    color: colors.grey,
    fontSize: 6.8,
    fontWeight: 'bold',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
    borderBottom: `0.75 solid ${colors.ink}`,
    paddingTop: 6,
    paddingBottom: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  totalRowText: { color: colors.white, fontSize: 9.5, fontWeight: 'bold' },
  card: { backgroundColor: colors.cream, border: `1 solid ${colors.line}`, borderRadius: 6, padding: 10, marginBottom: 9 },
  cardTitle: { color: colors.ink, fontSize: 8.8, fontWeight: 'bold', marginBottom: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 3 },
  infoLabel: { color: colors.grey, fontSize: 7.1 },
  infoValue: { flex: 1, color: colors.ink2, fontSize: 7.2, textAlign: 'right' },
  codeCard: { backgroundColor: colors.cream, borderLeft: `3 solid ${colors.red}`, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 9 },
  codeTitle: { color: colors.ink, fontSize: 8, fontWeight: 'bold', marginBottom: 4 },
  codeText: { color: colors.ink2, fontSize: 6.55, lineHeight: 1.45, marginBottom: 2 },
  qrRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  qr: { width: 57, height: 57, backgroundColor: colors.white, padding: 3 },
  qrCopy: { flex: 1 },
  qrTitle: { color: colors.ink, fontSize: 7.9, fontWeight: 'bold', lineHeight: 1.2, marginBottom: 3 },
  qrText: { color: colors.grey, fontSize: 6.55, lineHeight: 1.35 },
  reserve: { backgroundColor: colors.ink, color: colors.white, borderRadius: 6, padding: 11 },
  reserveTitle: { color: colors.white, fontSize: 9.5, fontWeight: 'bold', marginBottom: 5 },
  reserveText: { color: '#B9C2D2', fontSize: 6.9, lineHeight: 1.42 },
  reserveChip: { alignSelf: 'flex-start', backgroundColor: colors.red, borderRadius: 4, marginTop: 7, paddingVertical: 5, paddingHorizontal: 8 },
  reserveChipText: { color: colors.white, fontSize: 7.2, fontWeight: 'bold' },
  reservePolicy: { color: '#9AA4B5', fontSize: 5.8, lineHeight: 1.3, marginTop: 6 },
  pageTwoTitle: { color: colors.ink, fontSize: 20, fontWeight: 'bold', borderBottom: `3 solid ${colors.red}`, paddingBottom: 8, marginBottom: 15 },
  twoUp: { flexDirection: 'row', gap: 12, marginBottom: 19 },
  featureCard: { flex: 1, border: `1 solid ${colors.line}`, borderTop: `4 solid ${colors.ink}`, borderRadius: 6, padding: 14 },
  featureCardRed: { borderTop: `4 solid ${colors.red}` },
  cardEyebrow: { color: colors.grey, fontSize: 7, fontWeight: 'bold', letterSpacing: 1.4, marginBottom: 6 },
  cardLead: { color: colors.ink, fontSize: 21, fontWeight: 'bold', lineHeight: 1.05, marginBottom: 7 },
  cardBody: { color: colors.grey, fontSize: 7.2, lineHeight: 1.45, marginBottom: 3 },
  promoFinance: { color: colors.red, fontSize: 7.3, fontWeight: 'bold', lineHeight: 1.35, marginTop: 5 },
  stepsHeader: { color: colors.red, fontSize: 8.2, fontWeight: 'bold', letterSpacing: 1.65, marginBottom: 10 },
  steps: { flexDirection: 'row', gap: 10, marginBottom: 19 },
  step: { flex: 1, backgroundColor: colors.cream, borderRadius: 6, padding: 12, minHeight: 112 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepNumberText: { color: colors.white, fontSize: 8, fontWeight: 'bold' },
  stepTitle: { color: colors.ink, fontSize: 9, fontWeight: 'bold', marginBottom: 5 },
  stepBody: { color: colors.grey, fontSize: 7.1, lineHeight: 1.45 },
  trust: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: colors.ink, borderRadius: 6, paddingVertical: 14, paddingHorizontal: 9, marginBottom: 14 },
  trustItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  trustItemBorder: { borderLeft: '0.5 solid #2A3752' },
  trustLead: { color: colors.gold, fontSize: 12.5, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  trustLabel: { color: '#AAB3C1', fontSize: 5.8, lineHeight: 1.35, letterSpacing: 0.6, textAlign: 'center' },
  closeout: { borderLeft: `3 solid ${colors.gold}`, backgroundColor: colors.cream, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12 },
  closeoutTitle: { color: colors.ink, fontSize: 9.2, fontWeight: 'bold', marginBottom: 4 },
  closeoutText: { color: colors.grey, fontSize: 7.25, lineHeight: 1.45 },
  noteBox: { border: `1 solid ${colors.line}`, borderLeft: `3 solid ${colors.red}`, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 10 },
  noteTitle: { color: colors.ink, fontSize: 8.3, fontWeight: 'bold', marginBottom: 3 },
  noteText: { color: colors.grey, fontSize: 7, lineHeight: 1.4 },
  depositBox: { backgroundColor: colors.cream, border: `1 solid ${colors.ink}`, borderLeft: `4 solid ${colors.red}`, padding: 10, marginBottom: 10 },
  footer: { position: 'absolute', left: 34, right: 34, bottom: 15, borderTop: `1 solid ${colors.line}`, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  footerText: { flex: 1, color: colors.grey, fontSize: 5.9 },
  footerPage: { width: 48, color: colors.grey, fontSize: 5.9, textAlign: 'right' },
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

function motorMetaLine(quoteData: QuotePDFProps['quoteData'], codeItems: string[]): string {
  const decoded = codeItems
    .filter((item) => !item.endsWith('= horsepower'))
    .slice(0, 3)
    .map((item) => item.split(' = ')[1] || item)
    .join(' | ');
  return [
    `${quoteData.modelYear} Mercury ${quoteData.category}`,
    quoteData.horsepower,
    decoded,
  ].filter(Boolean).join(' | ');
}

function tradeDescription(info?: QuotePDFProps['quoteData']['tradeInInfo']): string {
  if (!info) return '';
  return [info.year, info.brand, `${info.horsepower} HP`, info.model].filter(Boolean).join(' ');
}

function LineItemRow({ item, compact }: { item: LineItem; compact: boolean }) {
  return (
    <View style={[styles.row, compact ? styles.rowCompact : {}]} wrap={false}>
      <View style={styles.rowText}>
        <Text style={styles.rowPrimary}>{item.name}</Text>
        {item.description ? <Text style={styles.rowDescription}>{item.description}</Text> : null}
      </View>
      <Text style={styles.rowValue}>${money(item.price)}</Text>
    </View>
  );
}

function StepCard({ number, title, children }: { number: string; title: string; children: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepBody}>{children}</Text>
    </View>
  );
}

function TrustItem({ lead, label, bordered = false }: { lead: string; label: string; bordered?: boolean }) {
  return (
    <View style={[styles.trustItem, bordered ? styles.trustItemBorder : {}]}>
      <Text style={styles.trustLead}>{lead}</Text>
      <Text style={styles.trustLabel}>{label}</Text>
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
  const compactRows = items.length >= 5 || Boolean(quoteData.tradeInValue);
  const codeItems = motorCodeBreakdown(quoteData.productName);
  const firstCodeLine = codeItems.slice(0, 3).join(' | ');
  const secondCodeLine = codeItems.slice(3).join(' | ');
  const savingsNumber = Number(String(quoteData.totalSavings).replace(/,/g, ''));
  const promoEndCopy = quoteData.promoEndDate ? ` | ends ${formattedDate(quoteData.promoEndDate)}` : '';
  const footerAddress = 'Harris Boat Works | 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.brandPlate}>
              <Image src={harrisLogo} style={styles.harrisLogo} />
              <View style={styles.brandDivider} />
              <Image src={mercuryLogo} style={styles.mercuryLogo} />
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
            <View style={styles.motorPanel}>
              {quoteData.motorImageUrl ? (
                <Image src={quoteData.motorImageUrl} style={styles.motorImage} />
              ) : (
                <Image src={mercuryLogo} style={styles.motorFallbackLogo} />
              )}
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

        <View style={styles.pageOneBody}>
          <View style={styles.breakdownColumn}>
            <Text style={styles.sectionHeader}>TRANSPARENT PRICE BREAKDOWN</Text>
            <View style={styles.table}>
              <View style={[styles.row, compactRows ? styles.rowCompact : {}]}>
                <Text style={styles.rowPrimary}>Mercury outboard MSRP</Text>
                <Text style={[styles.rowValue, { color: colors.grey, textDecoration: 'line-through' }]}>${quoteData.msrp}</Text>
              </View>
              {Number(String(quoteData.dealerDiscount).replace(/,/g, '')) > 0 ? (
                <View style={[styles.row, compactRows ? styles.rowCompact : {}]}>
                  <Text style={styles.rowPrimary}>HBW dealer discount</Text>
                  <Text style={[styles.rowValue, styles.discount]}>-${quoteData.dealerDiscount}</Text>
                </View>
              ) : null}
              {(quoteData.pricing?.adminDiscount || 0) > 0 ? (
                <View style={[styles.row, compactRows ? styles.rowCompact : {}]}>
                  <Text style={styles.rowPrimary}>Additional quote discount</Text>
                  <Text style={[styles.rowValue, styles.discount]}>-${money(quoteData.pricing?.adminDiscount)}</Text>
                </View>
              ) : null}
              {Number(String(quoteData.promoSavings).replace(/,/g, '')) > 0 ? (
                <View style={[styles.row, compactRows ? styles.rowCompact : {}]} wrap={false}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowPrimary}>{quoteData.promotionName || 'Mercury Canada promotion'}</Text>
                    <Text style={styles.rowDescription}>Factory promotional savings applied{promoEndCopy}</Text>
                  </View>
                  <Text style={[styles.rowValue, styles.discount]}>-${quoteData.promoSavings}</Text>
                </View>
              ) : null}
              <View style={[styles.row, compactRows ? styles.rowCompact : {}]}>
                <Text style={[styles.rowPrimary, { fontWeight: 'bold' }]}>Motor price after discounts</Text>
                <Text style={styles.rowValue}>${quoteData.motorSubtotal}</Text>
              </View>
              <View style={[styles.row, compactRows ? styles.rowCompact : {}]} wrap={false}>
                <View style={styles.rowText}>
                  <Text style={styles.rowPrimary}>{quoteData.includesInstallation ? 'Installed repower configuration' : 'Loose motor configuration'}</Text>
                  <Text style={styles.rowDescription}>{quoteData.includesInstallation ? 'Professional setup is itemized below' : 'Installation is not included'}</Text>
                </View>
                <Text style={styles.rowValue}>{quoteData.includesInstallation ? 'Installed' : 'Loose'}</Text>
              </View>
              {groups.map((group) => (
                <View key={group.key}>
                  <View wrap={false}>
                    <Text style={styles.groupLabel}>{group.title}</Text>
                    <LineItemRow item={group.items[0]} compact={compactRows} />
                  </View>
                  {group.items.slice(1).map((item, index) => <LineItemRow key={`${group.key}-${index + 1}-${item.name}`} item={item} compact={compactRows} />)}
                </View>
              ))}
              {groups.length === 0 ? (
                <View style={[styles.row, compactRows ? styles.rowCompact : {}]}>
                  <Text style={styles.rowPrimary}>{quoteData.includesInstallation ? 'Configured installation and setup' : 'Loose motor supply - installation not included'}</Text>
                  <Text style={styles.rowValue}>As shown</Text>
                </View>
              ) : null}
              {quoteData.tradeInValue && quoteData.tradeInValue > 0 ? (
                <>
                  <View style={[styles.row, compactRows ? styles.rowCompact : {}]} wrap={false}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowPrimary}>Estimated trade-in value</Text>
                      <Text style={styles.rowDescription}>{tradeDescription(quoteData.tradeInInfo)}</Text>
                    </View>
                    <Text style={[styles.rowValue, styles.discount]}>-${money(quoteData.tradeInValue)}</Text>
                  </View>
                  <View style={[styles.row, compactRows ? styles.rowCompact : {}]} wrap={false}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowPrimary}>HST savings from trade-in</Text>
                      <Text style={styles.rowDescription}>HST is not charged on the eligible trade-in portion</Text>
                    </View>
                    <Text style={styles.rowValue}>${money(quoteData.tradeInValue * 0.13)} saved</Text>
                  </View>
                </>
              ) : null}
              <View style={[styles.row, compactRows ? styles.rowCompact : {}]}>
                <Text style={styles.rowPrimary}>Subtotal</Text><Text style={styles.rowValue}>${quoteData.subtotal}</Text>
              </View>
              <View style={[styles.row, compactRows ? styles.rowCompact : {}]}>
                <Text style={styles.rowPrimary}>HST (13%)</Text><Text style={styles.rowValue}>${quoteData.tax}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalRowText}>TOTAL CASH PRICE</Text><Text style={styles.totalRowText}>${quoteData.total} CAD</Text>
              </View>
            </View>
          </View>

          <View style={styles.sidebar}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quote Details</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Customer</Text><Text style={styles.infoValue}>{quoteData.customerName}</Text></View>
              {quoteData.customerEmail ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{quoteData.customerEmail}</Text></View> : null}
              {quoteData.customerPhone ? <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{quoteData.customerPhone}</Text></View> : null}
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Quote #</Text><Text style={styles.infoValue}>{quoteData.quoteNumber}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Issued</Text><Text style={styles.infoValue}>{quoteData.date}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Valid until</Text><Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{expiry}</Text></View>
            </View>

            <View style={styles.codeCard}>
              <Text style={styles.codeTitle}>Understanding your motor code</Text>
              <Text style={styles.codeText}>{firstCodeLine}</Text>
              {secondCodeLine ? <Text style={styles.codeText}>{secondCodeLine}</Text> : null}
            </View>

            {savedQuoteQrCode ? (
              <View style={styles.card}>
                <View style={styles.qrRow}>
                  <Image src={savedQuoteQrCode} style={styles.qr} />
                  <View style={styles.qrCopy}>
                    <Text style={styles.qrTitle}>Scan to reopen this quote</Text>
                    <Text style={styles.qrText}>Your exact configuration, saved. Continue whenever you are ready.</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {!quoteData.depositInfo ? (
              <View style={styles.reserve}>
                <Text style={styles.reserveTitle}>Ready to lock this in?</Text>
                <Text style={styles.reserveText}>A ${money(recommendedDeposit).replace('.00', '')} deposit holds this motor and your place in the schedule. The deposit applies to your final invoice.</Text>
                <View style={styles.reserveChip}><Text style={styles.reserveChipText}>Call / text (905) 342-2153</Text></View>
                <Text style={styles.reservePolicy}>Refundability depends on stock or special-order status and when the order is committed.</Text>
              </View>
            ) : (
              <View style={styles.reserve}>
                <Text style={styles.reserveTitle}>Deposit received</Text>
                <Text style={styles.reserveText}>${money(quoteData.depositInfo.amount)} received. Reference {quoteData.depositInfo.referenceNumber}.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{footerAddress}</Text>
          <Text style={styles.footerPage}>Page 1 of 2</Text>
        </View>
      </Page>

      <Page size="LETTER" style={styles.pageTwo}>
        <Text style={styles.pageTwoTitle}>Coverage, Payment &amp; Next Steps</Text>

        <View style={styles.twoUp}>
          <View style={styles.featureCard}>
            <Text style={styles.cardEyebrow}>MERCURY COVERAGE</Text>
            <Text style={styles.cardLead}>{coverageTotal} years total</Text>
            <Text style={styles.cardBody}>{includedCoverage} years of combined Mercury factory and applicable promotional coverage are included.</Text>
            {quoteData.productProtection ? (
              <>
                <Text style={[styles.cardBody, { color: colors.ink, fontWeight: 'bold', marginTop: 3 }]}>{quoteData.productProtection.planYears} additional years of Platinum Product Protection</Text>
                <Text style={styles.cardBody}>${money(quoteData.productProtection.priceBeforeTax)} before HST</Text>
                {hasFinancing && quoteData.productProtection.monthlyDelta ? <Text style={styles.promoFinance}>Approximately +${quoteData.productProtection.monthlyDelta}/month with this financing estimate</Text> : null}
              </>
            ) : <Text style={styles.cardBody}>No additional paid Product Protection plan selected.</Text>}
            <Text style={[styles.cardBody, { marginTop: 3 }]}>Final eligibility and coverage dates are confirmed using the engine serial number.</Text>
          </View>

          <View style={[styles.featureCard, styles.featureCardRed]}>
            <Text style={styles.cardEyebrow}>{hasFinancing ? 'FINANCING ESTIMATE' : 'PURCHASE METHOD'}</Text>
            {hasFinancing ? (
              <>
                <Text style={styles.cardLead}>${money(quoteData.monthlyPayment).replace('.00', '')}/month</Text>
                <Text style={styles.cardBody}>{quoteData.financingRate}% APR | {quoteData.financingTerm}-month amortization</Text>
                {quoteData.financingAmount ? <Text style={styles.cardBody}>Amount financed: ${money(quoteData.financingAmount)} CAD</Text> : null}
                {quoteData.dealerFee ? <Text style={styles.cardBody}>Includes ${money(quoteData.dealerFee)} DealerPlan administration fee</Text> : null}
                <Text style={styles.cardBody}>On approved credit. DealerPlan contract term is up to {quoteData.financingContractTerm || 60} months.</Text>
                {(quoteData.financingTerm || 0) > (quoteData.financingContractTerm || 60) ? <Text style={styles.cardBody}>A balance may remain at contract maturity and may need to be paid or refinanced.</Text> : null}
              </>
            ) : (
              <>
                <Text style={styles.cardLead}>{quoteData.selectedPaymentMethod === 'cash_purchase' ? 'Cash purchase' : 'Financing not shown'}</Text>
                <Text style={styles.cardBody}>{quoteData.selectedPaymentMethod === 'cash_purchase' ? 'No financing fee or monthly-payment estimate is included in this quote.' : 'Ask us for current Canadian marine financing options if you would like a payment estimate.'}</Text>
              </>
            )}
            {showAlternatePromotion && alternatePromotion ? <Text style={styles.promoFinance}>Promotional {alternatePromotion.rate}% APR for {alternatePromotion.termMonths} months may also be available on approved credit - ask us.</Text> : null}
            {quoteData.promotionName ? <Text style={[styles.cardBody, { marginTop: 5 }]}>{quoteData.promotionName}{quoteData.promoEndDate ? ` | ends ${formattedDate(quoteData.promoEndDate)}` : ''}</Text> : null}
          </View>
        </View>

        <Text style={styles.stepsHeader}>WHAT HAPPENS NEXT</Text>
        <View style={styles.steps}>
          <StepCard number="1" title="Reserve">A ${money(recommendedDeposit).replace('.00', '')} deposit reserves your motor and your place in the schedule.</StepCard>
          {quoteData.includesInstallation ? (
            <StepCard number="2" title="We rig and water-test">Installed, commissioned, and run on Rice Lake. Prop setup is checked and adjusted as needed.</StepCard>
          ) : (
            <StepCard number="2" title="We prep and test-run">Your motor is prepared, test-run, and commissioned before pickup.</StepCard>
          )}
          <StepCard number="3" title={quoteData.includesInstallation ? 'Pick up and go boating' : 'Pick up your motor'}>{quoteData.includesInstallation ? 'Get a complete walkthrough of your new Mercury at our Gores Landing shop, about 90 minutes from Toronto.' : 'Review the motor, included equipment, and commissioning details with our team before leaving.'}</StepCard>
        </View>

        <View style={styles.trust}>
          <TrustItem lead="1947" label="FAMILY-OWNED SINCE" />
          <TrustItem lead="1965" label="MERCURY DEALER SINCE" bordered />
          <TrustItem lead="Premier" label="MERCURY MARINE DEALER" bordered />
          <TrustItem lead={quoteData.includesInstallation ? 'Rice Lake' : 'Tested'} label={quoteData.includesInstallation ? 'INSTALLED REPOWERS WATER-TESTED' : 'PRE-DELIVERY MOTOR CHECK'} bordered />
          <TrustItem lead="Ontario" label="GORES LANDING SHOP" bordered />
        </View>

        <View style={styles.closeout}>
          <Text style={styles.closeoutTitle}>Straight answers, complete pricing</Text>
          <Text style={styles.closeoutText}>This quote is built from the motor, equipment, promotion, trade-in and installation choices shown here. If anything about your boat changes, call or text us and we will update the configuration before you commit.</Text>
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

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Harris Boat Works | Gores Landing, ON | (905) 342-2153 | mercuryrepower.ca</Text>
          <Text style={styles.footerPage}>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalQuotePDF;
