import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import HeroPrice from '@/components/quote-builder/HeroPrice';
import { PackageCards, type PackageOption } from '@/components/quote-builder/PackageCards';
import StickySummary from '@/components/quote-builder/StickySummary';
import { PromoPanel } from '@/components/quote-builder/PromoPanel';
import { PricingTable } from '@/components/quote-builder/PricingTable';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';
import WarrantyAddOnUI, { type WarrantyTarget } from '@/components/quote-builder/WarrantyAddOnUI';
import BonusOffersBadge from '@/components/quote-builder/BonusOffersBadge';
import MotorHeader from '@/components/quote-builder/MotorHeader';
import CoverageComparisonTooltip from '@/components/quote-builder/CoverageComparisonTooltip';

import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { computeTotals } from '@/lib/finance';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, getQuoteData, isNavigationBlocked } = useQuote();
  const { promo } = useActiveFinancingPromo();
  const { getWarrantyPromotions, getTotalWarrantyBonusYears } = useActivePromotions();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>('better');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  useEffect(() => {
    // Add delay and loading check to prevent navigation during state updates
    const checkAccessibility = () => {
      if (!state.isLoading && !isNavigationBlocked && !isStepAccessible(6)) {
        navigate('/quote/motor-selection');
        return;
      }
    };

    // Standardized timeout to 500ms to match other pages
    const timeoutId = setTimeout(checkAccessibility, 500);

    document.title = 'Your Mercury Motor Quote | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Review your complete Mercury outboard motor quote with pricing, financing options, and bonus offers.';

    return () => clearTimeout(timeoutId);
  }, [state.isLoading, isStepAccessible, isNavigationBlocked, navigate]);

  const handleStepComplete = () => {
    dispatch({ type: 'COMPLETE_STEP', payload: 6 });
    navigate('/quote/schedule');
  };

  const handleBack = () => {
    if (state.purchasePath === 'installed') {
      navigate('/quote/installation');
    } else {
      navigate('/quote/trade-in');
    }
  };

  const quoteData = getQuoteData();

  // Calculate pricing breakdown
  const motorPrice = quoteData.motor?.salePrice || quoteData.motor?.basePrice || quoteData.motor?.price || 0;
  const hp = quoteData.motor?.hp || 0;

  // Motor details for header - use existing state only
  const motor = state?.motor ?? {} as any;
  const motorName = motor?.model ?? motor?.name ?? motor?.displayName ?? "Mercury Outboard";
  const modelYear = motor?.year ?? motor?.modelYear ?? undefined;
  const motorHp = motor?.hp ?? motor?.horsepower ?? hp;
  const sku = motor?.sku ?? motor?.partNumber ?? null;
  const imageUrl = motor?.imageUrl ?? motor?.thumbnail ?? null;

  // Build spec pills from known fields (show only those that exist)
  const specs = [
    motor?.shaftLength ? { label: "Shaft", value: String(motor.shaftLength) } : null,
    motor?.starting ? { label: "Start", value: String(motor.starting) } : null,
    motor?.controls ? { label: "Controls", value: String(motor.controls) } : null,
    motor?.weight ? { label: "Weight", value: `${motor.weight} lb` } : null,
    motor?.alternatorOutput ? { label: "Alt", value: `${motor.alternatorOutput} A` } : null,
  ].filter(Boolean) as Array<{label:string; value:string}>;

  // Short "why this motor" bullets – keep generic unless you already store use-case text
  const why = [
    "Quiet, low-vibration four-stroke performance",
    "Excellent fuel economy & range", 
    "Factory-backed service at Harris Boat Works",
  ];

  const specSheetUrl = motor?.specSheetUrl ?? null;
  
  // Mock data - replace with real quote data
  const data = {
    msrp: motorPrice + 2500, // Motor + base accessories
    discount: 546,
    promoValue: 400,
    subtotal: motorPrice + 2500 - 546 - 400,
    tax: (motorPrice + 2500 - 546 - 400) * 0.13,
    total: (motorPrice + 2500 - 546 - 400) * 1.13,
  };
  
  const totals = computeTotals(data);

  // Get financing rate
  const financingRate = promo?.rate || 7.99;

  // Coverage years calculation (no math beyond reading promo years)
  const baseYears = 3;
  const promoYears = getTotalWarrantyBonusYears?.() ?? 0;
  const currentCoverageYears = Math.min(baseYears + promoYears, 8);
  const maxCoverageYears = 8;

  // Mock warranty pricing data - in real app this would come from state.warrantyOptions
  const mockWarrantyPricing = [
    { years: 6, price: 899, monthlyDelta: 15 },
    { years: 7, price: 1199, monthlyDelta: 20 },
    { years: 8, price: 1499, monthlyDelta: 25 },
  ];

  const targets: WarrantyTarget[] = mockWarrantyPricing
    .filter(o => o.years > currentCoverageYears && o.years <= maxCoverageYears)
    .map(o => ({ targetYears: o.years, oneTimePrice: o.price, monthlyDelta: o.monthlyDelta }));

  // Currently selected target years (total), or null
  const selectedTargetYears =
    state?.warrantyConfig?.totalYears && state.warrantyConfig.totalYears > currentCoverageYears
      ? state.warrantyConfig.totalYears
      : null;

  // Precomputed "+$/mo" for the selected target (if any)
  const selectedMonthlyDelta = selectedTargetYears
    ? targets.find(t => t.targetYears === selectedTargetYears)?.monthlyDelta
    : undefined;

  const onSelectWarranty = (targetYears: number | null) => {
    if (targetYears === null) {
      dispatch({ type: "SET_WARRANTY_CONFIG", payload: { extendedYears: 0, warrantyPrice: 0, totalYears: currentCoverageYears } });
    } else {
      const opt = mockWarrantyPricing.find(o => o.years === targetYears);
      const extendedYears = Math.max(0, targetYears - currentCoverageYears);
      dispatch({
        type: "SET_WARRANTY_CONFIG",
        payload: {
          extendedYears,
          warrantyPrice: opt?.price ?? 0,
          totalYears: targetYears,
        },
      });
    }
  };

  // Promo warranty years for sticky summary
  const warrantyPromos = getWarrantyPromotions?.() ?? [];
  const promoWarrantyYears = warrantyPromos[0]?.warranty_extra_years ?? 0;

  // Package options with coverage info
  const packages: PackageOption[] = [
    { 
      id: "good", 
      label: "Essential", 
      priceBeforeTax: data.subtotal, 
      savings: totals.savings, 
      features: ["Mercury motor", "Standard controls & rigging", "Basic installation"],
      coverageYears: currentCoverageYears
    },
    { 
      id: "better", 
      label: "Complete", 
      priceBeforeTax: data.subtotal + 179.99, 
      savings: totals.savings + 50, 
      features: ["Mercury motor", "Premium controls & rigging", "Marine starting battery", "Standard propeller", "Priority installation"], 
      recommended: true,
      coverageYears: Math.max(currentCoverageYears, 6),
      targetWarrantyYears: Math.max(currentCoverageYears, 6)
    },
    { 
      id: "best", 
      label: "Premium • Max coverage", 
      priceBeforeTax: data.subtotal + 179.99 + 500, 
      savings: totals.savings + 150, 
      features: ["Max coverage", "Priority install", "Premium prop", "Extended warranty", "White-glove installation"],
      coverageYears: maxCoverageYears,
      targetWarrantyYears: maxCoverageYears
    },
  ];

  // Build accessory breakdown for legacy components
  const accessoryBreakdown = [
    { name: 'Controls & Rigging', price: 2500, description: 'Premium marine controls and installation hardware' }
  ];
  
  if (selectedPackage !== 'good') {
    accessoryBreakdown.push({
      name: 'Marine Battery',
      price: 179.99,
      description: 'Marine starting battery (standard)'
    });
  }
  
  if (selectedPackage === 'best') {
    accessoryBreakdown.push({
      name: 'Extended Warranty',
      price: 500,
      description: 'Additional coverage and peace of mind'
    });
  }

  // CTA handlers
  const handleReserveDeposit = () => {
    toast({
      title: "Reserve Your Motor",
      description: "Deposit functionality would be integrated here.",
    });
  };

  const handleDownloadPDF = () => {
    const quoteNum = Date.now().toString().slice(-6);
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mercury Quote - HBW-${quoteNum}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            color: #1f2937;
            line-height: 1.6;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          
          /* Header with Logo */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-info {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-box {
            width: 60px;
            height: 60px;
            background: #1e40af;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
            border-radius: 8px;
          }
          .company-text h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 5px;
          }
          .tagline {
            color: #6b7280;
            font-size: 14px;
          }
          
          /* Mercury Badge */
          .mercury-badge {
            display: inline-block;
            background: #000;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
            margin-left: 10px;
          }
          
          /* Rest of your existing styles... */
          .quote-info {
            text-align: right;
          }
          .quote-number {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          
          /* Motor Section with Mercury branding */
          .motor-section {
            background: linear-gradient(135deg, #000 0%, #333 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            position: relative;
          }
          .motor-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .mercury-watermark {
            position: absolute;
            top: 20px;
            right: 25px;
            font-size: 18px;
            font-weight: bold;
            opacity: 0.3;
            letter-spacing: 2px;
          }
          
          /* Professional badge */
          .authorized-dealer {
            background: #f9fafb;
            border: 2px solid #1e40af;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin: 30px 0;
            font-weight: bold;
            color: #1e40af;
          }
          
          /* Continue with all the other styles from before */
          .customer-section {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .section-title {
            color: #1e40af;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .motor-specs {
            display: flex;
            gap: 30px;
            margin-top: 15px;
          }
          .spec-item {
            flex: 1;
          }
          .spec-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
          }
          .spec-value {
            font-size: 20px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 16px;
          }
          td:last-child {
            text-align: right;
            font-weight: bold;
          }
          .discount-row td:last-child {
            color: #10b981;
          }
          .subtotal-row {
            background: #f9fafb;
            font-weight: bold;
          }
          .total-row {
            background: #1e40af;
            color: white;
            font-size: 18px;
            font-weight: bold;
          }
          .total-row td {
            padding: 15px;
            border: none;
          }
          .savings-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .savings-amount {
            font-size: 28px;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
          }
          .footer-company {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          
          @media print {
            .container { padding: 20px; }
            .motor-section { background: #000 !important; -webkit-print-color-adjust: exact; }
            .savings-badge { background: #10b981 !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header with Logo -->
          <div class="header">
            <div class="company-info">
              <div class="logo-box">HBW</div>
              <div class="company-text">
                <h1>Harris Boat Works</h1>
                <div class="tagline">Your Trusted Mercury Dealer Since 1947</div>
              </div>
            </div>
            <div class="quote-info">
              <div class="quote-number">Quote #HBW-${quoteNum}</div>
              <div class="date">${currentDate}</div>
              <div class="date" style="color: #dc2626; font-weight: bold;">Valid for 30 days</div>
            </div>
          </div>
          
          <!-- Authorized Dealer Badge -->
          <div class="authorized-dealer">
            ⚓ AUTHORIZED MERCURY MARINE DEALER ⚓
          </div>
          
          <!-- Customer Section -->
          <div class="customer-section">
            <div class="section-title">Customer Information</div>
            <div>Name: Valued Customer</div>
            <div>Email: To be provided</div>
            <div>Phone: To be provided</div>
          </div>
          
          <!-- Motor Section with Mercury branding -->
          <div class="motor-section">
            <div class="mercury-watermark">MERCURY</div>
            <div class="motor-title">${modelYear || '2025'} Mercury ${motorName}</div>
            <div class="motor-specs">
              <div class="spec-item">
                <div class="spec-label">Horsepower</div>
                <div class="spec-value">${motorHp}HP</div>
              </div>
              ${sku ? `
              <div class="spec-item">
                <div class="spec-label">Model</div>
                <div class="spec-value">${sku}</div>
              </div>
              ` : ''}
              <div class="spec-item">
                <div class="spec-label">Category</div>
                <div class="spec-value">FourStroke</div>
              </div>
            </div>
          </div>
          
          <!-- Pricing Table -->
          <div class="pricing-section">
            <div class="section-title">Investment Summary</div>
            <table>
              <tr>
                <td>Manufacturer's Suggested Retail Price</td>
                <td>$${totals.msrp.toLocaleString()}</td>
              </tr>
              <tr class="discount-row">
                <td>Harris Boat Works Discount</td>
                <td>-$${totals.discount.toLocaleString()}</td>
              </tr>
              ${totals.promoValue > 0 ? `
              <tr class="discount-row">
                <td>Promotional Savings</td>
                <td>-$${totals.promoValue.toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr class="subtotal-row">
                <td>Subtotal</td>
                <td>$${totals.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td>HST (13%)</td>
                <td>$${totals.tax.toLocaleString()}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL INVESTMENT</td>
                <td>$${totals.total.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          ${totals.savings > 0 ? `
          <div class="savings-badge">
            <div>YOUR TOTAL SAVINGS</div>
            <div class="savings-amount">$${totals.savings.toLocaleString()}</div>
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-company">Harris Boat Works</div>
            <div class="contact-info">
              5369 Harris Boat Works Rd, Gore's Landing, ON K0K 2E0<br>
              (905) 342-2153 | info@harrisboatworks.ca<br>
              www.harrisboatworks.com
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      setTimeout(() => {
        newWindow.print();
      }, 500);
    }
    
    toast({
      title: "Quote Generated",
      description: "Use Print → Save as PDF to download",
    });
  };

  const handleEmailQuote = () => {
    toast({
      title: "Email Quote",
      description: "Quote will be emailed to your address.",
    });
  };

  const handleTextQuote = () => {
    toast({
      title: "Text Quote",
      description: "Quote will be sent via SMS.",
    });
  };

  const handleBookConsult = () => {
    navigate('/quote/schedule');
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    // If package implies a target, apply it so engine reprices
    const pkg = packages.find(p => p.id === packageId);
    if (pkg?.targetWarrantyYears) {
      onSelectWarranty(pkg.targetWarrantyYears);
    }
  };

  const selectedPackageData = packages.find(p => p.id === selectedPackage) || packages[1];

  return (
    <QuoteLayout title="Your Mercury Motor Quote">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main Content - Left Column */}
          <div className="space-y-6">
            {/* Motor Header */}
            <MotorHeader
              name={motorName}
              modelYear={modelYear}
              hp={motorHp}
              sku={sku}
              imageUrl={imageUrl}
              specs={specs}
              why={why}
              specSheetUrl={specSheetUrl}
            />

            {/* Hero Price Section */}
            <HeroPrice 
              yourPriceBeforeTax={totals.subtotal}
              totalWithTax={totals.total}
              discount={totals.discount}
              promoValue={totals.promoValue}
              showMonthly={true}
              rate={financingRate}
            />

            {/* Bonus offers badge directly under hero price */}
            <BonusOffersBadge />

            {/* Package Selection */}
            <PackageCards
              options={packages}
              selectedId={selectedPackage}
              onSelect={handlePackageSelect}
              rate={financingRate}
            />

            {/* Active Promotions */}
            <PromoPanel motorHp={hp} />

            {/* Detailed Pricing Breakdown */}
            <PricingTable
              pricing={{
                msrp: totals.msrp,
                discount: totals.discount,
                promoValue: totals.promoValue,
                subtotal: totals.subtotal,
                tax: totals.tax,
                total: totals.total,
                savings: totals.savings
              }}
              motorName={quoteData.motor?.model || 'Mercury Motor'}
              accessoryBreakdown={accessoryBreakdown}
              tradeInValue={0}
            />
            
            {/* New Warranty Add-on UI */}
            <WarrantyAddOnUI
              currentCoverageYears={currentCoverageYears}
              maxCoverageYears={maxCoverageYears}
              targets={targets}
              selectedTargetYears={selectedTargetYears}
              onSelectWarranty={onSelectWarranty}
            />

            {/* Legacy Components - Keep for compatibility */}
            <div className="grid md:grid-cols-2 gap-6">
              <BonusOffers motor={quoteData.motor} />
            </div>

            {/* Mobile CTA Section */}
            <div className="lg:hidden space-y-4">
              <Button 
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={isGeneratingPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Quote'}
              </Button>
              <Button 
                onClick={handleStepComplete}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                Continue to Schedule
              </Button>
            </div>
          </div>

          {/* Sticky Summary - Right Column (Desktop) */}         
          <div>
            <StickySummary
              packageLabel={selectedPackageData.label}
              yourPriceBeforeTax={selectedPackageData.priceBeforeTax}
              totalSavings={selectedPackageData.savings}
              monthly={undefined}
              bullets={selectedPackageData.features}
              onReserve={handleReserveDeposit}
              depositAmount={200}
              coverageYears={selectedTargetYears ?? currentCoverageYears}
              monthlyDelta={selectedMonthlyDelta}
              onDownloadPDF={handleDownloadPDF}
              isGeneratingPDF={isGeneratingPDF}
            />
          </div>
        </div>
      </div>
    </QuoteLayout>
  );
}
