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
  navy: '#0A1628',
  navyMuted: '#4B5563',
  red: '#C8102E',
  cream: '#F7F7F7',
  paper: '#FFFFFF',
  border: '#D1D5DB',
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
    backgroundColor: colors.paper,
    color: colors.navy,
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 20,
    paddingHorizontal: 28,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5.5,
    marginBottom: 9,
    borderBottom: `1.5 solid ${colors.red}`,
  },
  logos: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  harrisLogo: { width: 58, height: 40, objectFit: 'contain' },
  brandDivider: { width: 1, height: 27, backgroundColor: colors.border },
  mercuryLogo: { width: 106, height: 21, objectFit: 'contain' },
  headerTitle: { color: colors.navy, fontSize: 13, fontWeight: 'bold', textAlign: 'right' },
  headerKicker: { fontSize: 7, color: colors.navyMuted, textAlign: 'right', marginTop: 3 },
  overview: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  overviewLeft: { flex: 1.18 },
  overviewRight: { flex: 0.82 },
  eyebrow: { fontSize: 7.5, color: colors.red, fontWeight: 'bold', letterSpacing: 1.1, marginBottom: 4 },
  productName: { fontSize: 21, lineHeight: 1.05, fontWeight: 'bold', marginBottom: 7 },
  productMeta: { color: colors.navyMuted, fontSize: 8.5, marginBottom: 8 },
  codeBox: { backgroundColor: colors.white, borderLeft: `2 solid ${colors.red}`, paddingVertical: 5, paddingLeft: 8 },
  codeTitle: { fontSize: 8.5, fontWeight: 'bold', marginBottom: 3 },
  codeItem: { color: colors.navyMuted, fontSize: 7.5, lineHeight: 1.3, marginBottom: 1 },
  totalCard: { backgroundColor: colors.white, border: `1.25 solid ${colors.navy}`, borderTop: `3 solid ${colors.red}`, padding: 10, marginBottom: 8 },
  totalLabel: { color: colors.navyMuted, fontSize: 7.5, letterSpacing: 0.65, marginBottom: 3 },
  totalPrice: { color: colors.navy, fontSize: 23, fontWeight: 'bold', marginBottom: 3 },
  savings: { color: colors.red, fontSize: 9, fontWeight: 'bold' },
  customerCard: { backgroundColor: colors.white, border: `1 solid ${colors.border}`, padding: 8 },
  cardTitle: { fontSize: 9.5, fontWeight: 'bold', marginBottom: 5 },
  infoRow: { flexDirection: 'row', marginBottom: 2.5 },
  infoLabel: { width: 55, color: colors.navyMuted, fontSize: 7.5 },
  infoValue: { flex: 1, fontSize: 7.8 },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 11.5, fontWeight: 'bold', marginBottom: 6, paddingBottom: 4, borderBottom: `1 solid ${colors.red}` },
  table: { backgroundColor: colors.white, border: `1 solid ${colors.border}` },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.white, borderBottom: `1 solid ${colors.border}`, paddingVertical: 5, paddingHorizontal: 7 },
  tableHeaderText: { fontSize: 7.5, fontWeight: 'bold', color: colors.navyMuted, letterSpacing: 0.6 },
  groupLabel: { backgroundColor: colors.white, borderTop: `1 solid ${colors.navy}`, borderBottom: `0.5 solid ${colors.border}`, paddingVertical: 4, paddingHorizontal: 7, fontSize: 7.5, color: colors.navyMuted, fontWeight: 'bold', letterSpacing: 0.45 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 4, paddingHorizontal: 7, borderBottom: `0.5 solid ${colors.border}` },
  rowText: { flex: 1, flexDirection: 'column', gap: 2 },
  rowPrimary: { fontSize: 8.4, color: colors.navy },
  rowLabel: { flex: 1, fontSize: 8.4 },
  rowDescription: { color: colors.navyMuted, fontSize: 7, marginTop: 3, lineHeight: 1.25 },
  rowValue: { width: 92, textAlign: 'right', fontSize: 8.4 },
  discount: { color: colors.red, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 7, borderTop: `1.5 solid ${colors.navy}` },
  totalRowText: { fontSize: 10.5, fontWeight: 'bold' },
  twoUp: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  panel: { flex: 1, backgroundColor: colors.white, border: `1 solid ${colors.border}`, padding: 9 },
  panelAccent: { borderTop: `3 solid ${colors.red}` },
  panelTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  panelLead: { fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  panelText: { color: colors.navyMuted, fontSize: 7.8, lineHeight: 1.35, marginBottom: 3 },
  protectionPrice: { fontSize: 11, fontWeight: 'bold', marginTop: 3 },
  protectionDelta: { color: colors.red, fontSize: 9, fontWeight: 'bold', marginTop: 3 },
  noteBox: { backgroundColor: colors.white, borderLeft: `2 solid ${colors.red}`, paddingVertical: 5, paddingLeft: 8, marginBottom: 9 },
  noteText: { fontSize: 8, lineHeight: 1.35 },
  cta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', border: `1.5 solid ${colors.red}`, backgroundColor: colors.white, padding: 5, marginBottom: 7 },
  ctaTitle: { fontSize: 10.5, fontWeight: 'bold', marginBottom: 3 },
  ctaText: { fontSize: 8, color: colors.navyMuted, marginBottom: 2 },
  qrBlock: { width: 76, alignItems: 'center' },
  qr: { width: 58, height: 58 },
  qrCaption: { color: colors.navyMuted, fontSize: 6.5, marginTop: 3, textAlign: 'center' },
  deposit: { backgroundColor: colors.white, border: `1.25 solid ${colors.navy}`, borderLeft: `3 solid ${colors.red}`, padding: 9, marginBottom: 10 },
  depositTitle: { fontSize: 10.5, fontWeight: 'bold', marginBottom: 5 },
  footer: { position: 'absolute', left: 28, right: 28, bottom: 18, borderTop: `1 solid ${colors.border}`, paddingTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { color: colors.navyMuted, fontSize: 6.7 },
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

function validUntilText(quoteDate: string, validUntil?: string, promoEndDate?: string): string {
  if (validUntil) return dateAtEndOfDay(validUntil).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
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
  if (codeMatch?.[1]) items.push(`${codeMatch[1]} = ${codeMatch[1]} horsepower`);
  if (modelCode.includes('M')) items.push('M = Manual start');
  else if (modelCode.includes('E')) items.push('E = Electric start');
  if (modelCode.includes('H')) items.push('H = Tiller handle');
  else if (modelCode.includes('R')) items.push('R = Remote control');
  if (modelCode.includes('XXL')) items.push('XXL = 30-inch shaft');
  else if (modelCode.includes('XL')) items.push('XL = 25-inch shaft');
  else if (modelCode.includes('L')) items.push('L = 20-inch shaft');
  else items.push(`Standard ${rig.shaft_inches}-inch shaft`);
  if (modelCode.includes('PT')) items.push('PT = Power Trim and Tilt');
  if (modelCode.includes('CT')) items.push('CT = Command Thrust gearcase');
  if (upper.includes('EFI')) items.push('EFI = Electronic Fuel Injection');
  return items;
}

function tradeDescription(info?: QuotePDFProps['quoteData']['tradeInInfo']): string {
  if (!info) return '';
  return [info.year, info.brand, `${info.horsepower} HP`, info.model].filter(Boolean).join(' ');
}

function LineItemRow({ item }: { item: LineItem }) {
  const displayPrice = item.price === 0 ? (item.name.toLowerCase().includes('existing') ? 'Use existing' : 'Included') : `$${money(item.price)}`;
  return (
    <View style={styles.row} wrap={false}>
      <View style={styles.rowText}>
        <Text style={styles.rowPrimary}>{item.name}</Text>
        {item.description ? <Text style={styles.rowDescription}>{item.description}</Text> : null}
      </View>
      <Text style={styles.rowValue}>{displayPrice}</Text>
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

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <View style={styles.logos}>
            <Image src={harrisLogo} style={styles.harrisLogo} />
            <View style={styles.brandDivider} />
            <Image src={mercuryLogo} style={styles.mercuryLogo} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Mercury Outboard Quote</Text>
            <Text style={styles.headerKicker}>Prepared by Harris Boat Works | Mercury Marine Premier Dealer</Text>
          </View>
        </View>

        <View style={styles.overview} wrap={false}>
          <View style={styles.overviewLeft}>
            <Text style={styles.eyebrow}>CONFIGURED FOR YOU</Text>
            <Text style={styles.productName}>{quoteData.productName}</Text>
            <Text style={styles.productMeta}>{quoteData.modelYear} Mercury {quoteData.category} | {quoteData.horsepower}</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeTitle}>Understanding the motor code</Text>
              {motorCodeBreakdown(quoteData.productName).map((item) => <Text key={item} style={styles.codeItem}>- {item}</Text>)}
            </View>
          </View>
          <View style={styles.overviewRight}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>TOTAL CASH PRICE INCLUDING HST</Text>
              <Text style={styles.totalPrice}>${quoteData.total}</Text>
              <Text style={styles.savings}>You save ${quoteData.totalSavings} versus MSRP</Text>
            </View>
            <View style={styles.customerCard}>
              <Text style={styles.cardTitle}>Quote Details</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Customer</Text><Text style={styles.infoValue}>{quoteData.customerName}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{quoteData.customerEmail || '-'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{quoteData.customerPhone || '-'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Quote</Text><Text style={styles.infoValue}>{quoteData.quoteNumber}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Issued</Text><Text style={styles.infoValue}>{quoteData.date}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Valid until</Text><Text style={styles.infoValue}>{expiry}</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transparent Price Breakdown</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}><Text style={styles.tableHeaderText}>ITEM</Text><Text style={styles.tableHeaderText}>PRICE (CAD)</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Mercury outboard MSRP</Text><Text style={[styles.rowValue, { textDecoration: 'line-through' }]}>${quoteData.msrp}</Text></View>
            {Number(String(quoteData.dealerDiscount).replace(/,/g, '')) > 0 ? <View style={styles.row}><Text style={styles.rowLabel}>HBW dealer discount</Text><Text style={[styles.rowValue, styles.discount]}>-${quoteData.dealerDiscount}</Text></View> : null}
            {(quoteData.pricing?.adminDiscount || 0) > 0 ? <View style={styles.row}><Text style={styles.rowLabel}>Additional quote discount</Text><Text style={[styles.rowValue, styles.discount]}>-${money(quoteData.pricing?.adminDiscount)}</Text></View> : null}
            {Number(String(quoteData.promoSavings).replace(/,/g, '')) > 0 ? (
              <View style={styles.row} wrap={false}>
                <View style={styles.rowText}><Text style={styles.rowPrimary}>{quoteData.promotionName || 'Mercury Canada promotion'}</Text><Text style={styles.rowDescription}>Factory promotional savings applied to this quote</Text></View>
                <Text style={[styles.rowValue, styles.discount]}>-${quoteData.promoSavings}</Text>
              </View>
            ) : null}
            <View style={styles.row}><Text style={[styles.rowLabel, { fontWeight: 'bold' }]}>Motor price after discounts</Text><Text style={[styles.rowValue, { fontWeight: 'bold' }]}>${quoteData.motorSubtotal}</Text></View>
            <View style={styles.row} wrap={false}>
              <View style={styles.rowText}>
                <Text style={styles.rowPrimary}>Purchase configuration</Text>
                <Text style={styles.rowDescription}>{quoteData.includesInstallation ? 'Professional installation and setup included as itemized below' : 'Loose motor supply; installation is not included'}</Text>
              </View>
              <Text style={styles.rowValue}>{quoteData.includesInstallation ? 'Installed repower' : 'Loose motor'}</Text>
            </View>
            {groups.map((group) => (
              <View key={group.key}>
                <View wrap={false}>
                  <Text style={styles.groupLabel}>{group.title}</Text>
                  <LineItemRow item={group.items[0]} />
                </View>
                {group.items.slice(1).map((item, index) => <LineItemRow key={`${group.key}-${index + 1}-${item.name}`} item={item} />)}
              </View>
            ))}
            {groups.length === 0 ? <View style={styles.row}><Text style={styles.rowLabel}>{quoteData.includesInstallation ? 'Configured installation and setup' : 'Loose motor supply - installation not included'}</Text><Text style={styles.rowValue}>As shown</Text></View> : null}
            {quoteData.tradeInValue && quoteData.tradeInValue > 0 ? (
              <>
                <View style={styles.row}><View style={styles.rowText}><Text style={styles.rowPrimary}>Estimated trade-in value</Text><Text style={styles.rowDescription}>{tradeDescription(quoteData.tradeInInfo)}</Text></View><Text style={[styles.rowValue, styles.discount]}>-${money(quoteData.tradeInValue)}</Text></View>
                <View style={styles.row}><View style={styles.rowText}><Text style={styles.rowPrimary}>HST savings from trade-in</Text><Text style={styles.rowDescription}>HST is not charged on the eligible trade-in portion</Text></View><Text style={styles.rowValue}>${money(quoteData.tradeInValue * 0.13)} saved</Text></View>
              </>
            ) : null}
            <View style={styles.row}><Text style={styles.rowLabel}>Subtotal</Text><Text style={styles.rowValue}>${quoteData.subtotal}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>HST (13%)</Text><Text style={styles.rowValue}>${quoteData.tax}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalRowText}>Total cash price</Text><Text style={styles.totalRowText}>${quoteData.total} CAD</Text></View>
          </View>
        </View>

        <View wrap={false}>
          <Text style={styles.sectionTitle}>Coverage, Payment and Next Steps</Text>
          <View style={styles.twoUp}>
            <View style={[styles.panel, styles.panelAccent]}>
              <Text style={styles.panelTitle}>Mercury Coverage</Text>
              <Text style={styles.panelLead}>{coverageTotal} years total</Text>
              <Text style={styles.panelText}>{includedCoverage} years of combined Mercury factory and applicable promotional coverage are included.</Text>
              {quoteData.productProtection ? (
                <>
                  <Text style={styles.protectionPrice}>{quoteData.productProtection.planYears} additional years of Platinum Product Protection</Text>
                  <Text style={styles.panelText}>${money(quoteData.productProtection.priceBeforeTax)} before HST</Text>
                  {hasFinancing && quoteData.productProtection.monthlyDelta ? <Text style={styles.protectionDelta}>Approximately +${quoteData.productProtection.monthlyDelta}/month with this financing estimate</Text> : null}
                </>
              ) : <Text style={styles.panelText}>No additional paid Product Protection plan selected.</Text>}
              <Text style={styles.panelText}>Final eligibility and coverage dates are confirmed using the engine serial number. Installation, trade-in and propeller fit remain subject to final inspection where applicable.</Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{hasFinancing ? 'Financing Estimate' : 'Purchase Method'}</Text>
              {hasFinancing ? (
                <>
                  <Text style={styles.panelLead}>${money(quoteData.monthlyPayment).replace('.00', '')}/month</Text>
                  <Text style={styles.panelText}>{quoteData.financingRate}% APR | {quoteData.financingTerm}-month amortization</Text>
                  {quoteData.financingAmount ? <Text style={styles.panelText}>Amount financed: ${money(quoteData.financingAmount)} CAD</Text> : null}
                  {quoteData.dealerFee ? <Text style={styles.panelText}>Includes ${money(quoteData.dealerFee)} DealerPlan administration fee</Text> : null}
                  <Text style={styles.panelText}>On approved credit. DealerPlan contract term is up to {quoteData.financingContractTerm || 60} months.</Text>
                  <Text style={styles.panelText}>Payment figures are estimates and may vary with the final financed amount and lender approval.</Text>
                  {(quoteData.financingTerm || 0) > (quoteData.financingContractTerm || 60) ? <Text style={styles.panelText}>Because the amortization is longer than the contract term, a balance may remain at maturity and may need to be paid or refinanced.</Text> : null}
                </>
              ) : (
                <>
                  <Text style={styles.panelLead}>{quoteData.selectedPaymentMethod === 'cash_purchase' ? 'Cash purchase' : 'Financing not shown'}</Text>
                  <Text style={styles.panelText}>{quoteData.selectedPaymentMethod === 'cash_purchase' ? 'No financing fee or payment estimate is included.' : 'Ask us for current financing options if you would like a payment estimate.'}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {quoteData.promotionName || quoteData.selectedPromoOption ? (
          <View style={styles.noteBox} wrap={false}>
            <Text style={[styles.noteText, { fontWeight: 'bold' }]}>{quoteData.promotionName || 'Mercury Canada promotion'}</Text>
            {quoteData.selectedPromoOption === 'special_financing' ? <Text style={styles.noteText}>Promotional financing selected{quoteData.selectedPromoValue ? `: ${quoteData.selectedPromoValue}` : ''}. Any layered factory rebate shown above remains applied.</Text> : null}
            {quoteData.selectedPromoOption === 'cash_rebate' ? <Text style={styles.noteText}>Factory rebate selected and applied to the price above.</Text> : null}
            {quoteData.selectedPaymentMethod === 'cash_purchase' ? <Text style={styles.noteText}>Cash purchase selected. An eligible layered rebate remains applied where shown.</Text> : null}
            {quoteData.promoEndDate ? <Text style={styles.noteText}>Promotion ends {dateAtEndOfDay(quoteData.promoEndDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}.</Text> : null}
          </View>
        ) : null}

        {quoteData.customerNotes ? <View style={styles.noteBox} wrap={false}><Text style={[styles.noteText, { fontWeight: 'bold', marginBottom: 2 }]}>A note from Harris Boat Works</Text><Text style={styles.noteText}>{quoteData.customerNotes}</Text></View> : null}

        {quoteData.depositInfo ? (
          <View style={styles.deposit} wrap={false}>
            <Text style={styles.depositTitle}>Deposit Payment Confirmed - ${money(quoteData.depositInfo.amount)} CAD</Text>
            <Text style={styles.panelText}>Reference: {quoteData.depositInfo.referenceNumber} | Date: {quoteData.depositInfo.paymentDate}</Text>
            {quoteData.depositInfo.paymentMethod ? <Text style={styles.panelText}>Method: {quoteData.depositInfo.paymentMethod}</Text> : null}
            <Text style={styles.panelText}>Balance due: ${money((quoteData.pricing?.totalCashPrice || Number(String(quoteData.total).replace(/,/g, ''))) - quoteData.depositInfo.amount)} CAD</Text>
          </View>
        ) : null}

        {!quoteData.depositInfo ? (
          <View style={styles.cta} wrap={false}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.ctaTitle}>{savedQuoteQrCode ? 'Reopen this quote online' : 'Questions or ready to proceed?'}</Text>
              {savedQuoteQrCode ? (
                <>
                  <Text style={styles.ctaText}>Scan the QR code to reopen this saved quote and continue when you are ready.</Text>
                  <Text style={styles.ctaText}>Questions? Call or text Harris Boat Works at (905) 342-2153.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.ctaText}>Call or text Harris Boat Works at (905) 342-2153</Text>
                  <Text style={styles.ctaText}>Reply to your quote email, or visit mercuryrepower.ca</Text>
                </>
              )}
            </View>
            {savedQuoteQrCode ? (
              <View style={styles.qrBlock}>
                <Image src={savedQuoteQrCode} style={styles.qr} />
                <Text style={styles.qrCaption}>Scan to reopen quote</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Harris Boat Works | 5369 Harris Boat Works Rd, Gore's Landing, ON K0K 2E0 | (905) 342-2153</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalQuotePDF;
