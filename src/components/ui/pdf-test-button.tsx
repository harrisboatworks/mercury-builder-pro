import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ProfessionalQuotePDF } from '@/components/quote-pdf/ProfessionalQuotePDF';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import QRCode from 'qrcode';

const TestPDFButton: React.FC = () => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>();

  useEffect(() => {
    QRCode.toDataURL('https://mercuryrepower.ca/quote/test-123', {
      width: 150,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrCodeDataUrl);
  }, []);

  const sampleQuoteData = {
    quoteNumber: 'HBW-TEST123',
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    customerName: 'John Smith',
    customerEmail: 'john.smith@example.com',
    customerPhone: '(905) 555-0123',
    customerId: 'TEST-001',
    productName: '2025 Mercury FourStroke 115HP EFI EXLPT',
    horsepower: '115HP',
    category: 'FourStroke',
    modelYear: '2025',
    msrp: '14,250.00',
    dealerDiscount: '1,200.00',
    promoSavings: '500.00',
    motorSubtotal: '12,550.00',
    subtotal: '14,050.00',
    tax: '1,826.50',
    total: '15,876.50',
    totalSavings: '1,700.00',
    tradeInValue: 3500,
    tradeInInfo: {
      brand: 'Yamaha',
      year: 2018,
      horsepower: 115,
      model: 'F115',
    },
    accessoryBreakdown: [
      { name: 'Controls (Side Mount)', price: 650, description: 'Mercury Gen II' },
      { name: 'Wiring Harness (20ft)', price: 185, description: 'SmartCraft harness' },
      { name: 'Gauge Kit', price: 420, description: 'VesselView 403 digital' },
    ],
    financingQrCode: qrCodeDataUrl,
    monthlyPayment: 165,
    financingTerm: 60,
    financingRate: 7.99,
    includesInstallation: true,
    selectedPromoOption: 'cash_rebate' as const,
    selectedPromoValue: '$500',
    customerNotes: 'Customer interested in spring installation. Prefers white cowling if available.',
  };

  return (
    <PDFDownloadLink
      document={<ProfessionalQuotePDF quoteData={sampleQuoteData} />}
      fileName={`Test-Quote-${Date.now()}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" disabled={loading || !qrCodeDataUrl} className="gap-2">
          <Download className="h-4 w-4" />
          {loading ? 'Generating PDF...' : !qrCodeDataUrl ? 'Preparing QR...' : 'Test PDF (Trade-In + QR)'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default TestPDFButton;
