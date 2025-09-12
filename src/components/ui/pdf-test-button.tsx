import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ProfessionalQuotePDF from '@/components/quote-pdf/ProfessionalQuotePDF';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const TestPDFButton: React.FC = () => {
  // Sample quote data for testing
  const sampleQuoteData = {
    quoteNumber: 'HBW-TEST123',
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '(905) 555-0123',
    customerId: 'TEST-001',
    productName: '2025 Mercury FourStroke 9.9HP Command Thrust ProKicker EXLHPT',
    horsepower: '9.9HP',
    category: 'FourStroke',
    modelYear: '2025',
    msrp: '7,632.00',
    dealerDiscount: '546.00',
    promoSavings: '400.00',
    subtotal: '6,686.00',
    tax: '869.18',
    total: '7,555.18',
    totalSavings: '946.00'
  };

  return (
    <PDFDownloadLink 
      document={<ProfessionalQuotePDF quoteData={sampleQuoteData} />} 
      fileName={`Test-Quote-${Date.now()}.pdf`}
    >
      {({ loading }) => (
        <Button 
          variant="outline" 
          disabled={loading}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {loading ? 'Generating PDF...' : 'Test React PDF Download'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default TestPDFButton;