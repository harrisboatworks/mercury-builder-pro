import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { calculateRunningTotal } from '@/hooks/useQuoteRunningTotal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import { QuoteSummarySkeleton } from '@/components/quote-builder/QuoteSummarySkeleton';
import StickySummary from '@/components/quote-builder/StickySummary';
import { getRecommendedDeposit } from '@/components/quote-builder/PaymentPreferenceSelector';
import { DepositInfoDialog, type DepositCustomerInfo } from '@/components/quote-builder/DepositInfoDialog';

import { PricingTable } from '@/components/quote-builder/PricingTable';
import { BonusOffers } from '@/components/quote-builder/BonusOffers';


import { SaveQuoteDialog } from '@/components/quote-builder/SaveQuoteDialog';
import { QuoteRevealCinematic } from '@/components/quote-builder/QuoteRevealCinematic';
import { isTillerMotor, requiresMercuryControls, includesPropeller, canAddExternalFuelTank } from '@/lib/motor-helpers';
import { getPropellerAllowance } from '@/lib/propeller-allowance';
import { hasElectricStart } from '@/lib/motor-config-utils';
import { buildAccessoryBreakdown } from '@/lib/build-accessory-breakdown';

import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminQuoteControls } from '@/components/admin/AdminQuoteControls';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, ChevronLeft } from 'lucide-react';
import { computeTotals, calculateMonthlyPayment, getFinancingTerm, DEALERPLAN_FEE, FINANCING_MINIMUM } from '@/lib/finance';
import { calculateQuotePricing, calculateWarrantyExtensionCost } from '@/lib/quote-utils';
import { supabase } from '@/integrations/supabase/client';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import { generateQuotePDF, downloadPDF } from '@/lib/react-pdf-generator';
import QRCode from 'qrcode';
import { SITE_URL } from '@/lib/site';

// Package warranty year constants
const COMPLETE_TARGET_YEARS = 7;
const PREMIUM_TARGET_YEARS = 8;

// Animation variants
const sectionVariants = {
  hidden: { y: 8 },
  visible: {
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const pricingTableVariants = {
  hidden: { y: 15 },
  visible: {
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: 0.2
    }
  }
};

export default function QuoteSummaryPage() {
  const navigate = useNavigate();
  const { state, dispatch, getQuoteData } = useQuote();
  const { user, isAdmin } = useAuth();
  const { promo } = useActiveFinancingPromo();
  const { promotions, getWarrantyPromotions, getTotalWarrantyBonusYears, getTotalPromotionalSavings, getRebateForHP, getSpecialFinancingRates } = useActivePromotions();
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [completeWarrantyCost, setCompleteWarrantyCost] = useState<number>(0);
  const [premiumWarrantyCost, setPremiumWarrantyCost] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Deposit processing state - amount is auto-calculated from HP
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  
  // Cinematic reveal - show for fresh quotes coming from package selection
  const [showCinematic, setShowCinematic] = useState(false);
  const cinematicTriggeredRef = useRef(false);
  
  // Extract stable motor ID outside the effect to prevent re-triggers on object reference changes
  const currentMotorId = state.motor?.id || (state.motor as any)?.sku;

  const handleCinematicComplete = useCallback(() => {
    sessionStorage.setItem('quote-reveal-seen', 'true');
    if (currentMotorId) {
      sessionStorage.setItem('quote-reveal-motor-id', String(currentMotorId));
    }
    setShowCinematic(false);
  }, [currentMotorId]);

  // Check if we should show cinematic (fresh from package selection OR new motor)
  useEffect(() => {
    // Guard: prevent double-trigger on same mount or if already showing
    if (cinematicTriggeredRef.current || showCinematic) return;
    
    const hasSeenReveal = sessionStorage.getItem('quote-reveal-seen');
    const lastRevealedMotor = sessionStorage.getItem('quote-reveal-motor-id');
    
    // Show cinematic if never seen OR different motor selected
    if (!hasSeenReveal || (currentMotorId && lastRevealedMotor !== String(currentMotorId))) {
      cinematicTriggeredRef.current = true;
      setShowCinematic(true);
    }
    
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentMotorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut to replay cinematic (Ctrl/Cmd + Shift + R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        sessionStorage.removeItem('quote-reveal-seen');
        setShowCinematic(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ensure minimum mount time
  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
    }, 500);
    
    return () => clearTimeout(mountTimer);
  }, []);

  // Set document title
  useEffect(() => {
    document.title = 'Your Mercury Motor Quote | Harris Boat Works';
  }, []);

  // Redirect if no package selected (wait for loading to complete first)
  useEffect(() => {
    if (isMounted && !state.isLoading) {
      if (!state.motor) {
        navigate('/quote/motor-selection');
      } else if (!state.selectedPromoOption) {
        navigate('/quote/promo-selection');
      } else if (!state.selectedPackage) {
        navigate('/quote/package-selection');
      }
    }
  }, [isMounted, state.isLoading, state.motor, state.selectedPromoOption, state.selectedPackage, navigate]);

  const handleStepComplete = () => {
    dispatch({ type: 'COMPLETE_STEP', payload: 6 });
    navigate('/quote/schedule');
  };

  const handleBack = () => {
    navigate('/quote/package-selection');
  };

  const handleChangePackage = () => {
    navigate('/quote/package-selection');
  };

  const quoteData = getQuoteData();

  // Motor details
  const motor = state?.motor ?? {} as any;
  const motorName = motor?.model ?? motor?.name ?? motor?.displayName ?? "Mercury Outboard";
  const modelYear = motor?.year ?? motor?.modelYear ?? undefined;
  const hp = quoteData.motor?.hp || motor?.hp || motor?.horsepower || 0;
  const motorHp = hp;
  const sku = motor?.sku ?? motor?.partNumber ?? null;
  const imageUrl = motor?.imageUrl ?? motor?.thumbnail ?? null;
  
  // Auto-calculated deposit based on motor HP (no user selection)
  const depositAmount = getRecommendedDeposit(hp);

  // Spec pills
  const specs = [
    motor?.shaftLength ? { label: "Shaft", value: String(motor.shaftLength) } : null,
    motor?.starting ? { label: "Start", value: String(motor.starting) } : null,
    motor?.controls ? { label: "Controls", value: String(motor.controls) } : null,
    motor?.weight ? { label: "Weight", value: `${motor.weight} lb` } : null,
    motor?.alternatorOutput ? { label: "Alt", value: `${motor.alternatorOutput} A` } : null,
  ].filter(Boolean) as Array<{label:string; value:string}>;


  // Helper to get display value for promo option
  const getPromoDisplayValue = (
    option: 'no_payments' | 'special_financing' | 'cash_rebate' | null | undefined,
    motorHP: number
  ): string => {
    if (!option) return '';
    
    switch (option) {
      case 'no_payments':
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 6);
        return `Payments begin ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      case 'special_financing':
        const rates = getSpecialFinancingRates();
        return rates?.[0]?.rate ? `${rates[0].rate}%` : '2.99%';
      case 'cash_rebate':
        const rebate = getRebateForHP(motorHP);
        return rebate ? `$${rebate.toLocaleString()}` : '$0';
      default:
        return '';
    }
  };

  const specSheetUrl = motor?.specSheetUrl ?? null;
  
  // Motor type calculations
  const motorModel = motor?.model || state.motor?.model || '';
  const isManualTiller = isTillerMotor(motorModel);
  const needsControls = requiresMercuryControls(motor);
  const isElectricStart = hasElectricStart(motorModel);
  
  // Calculate base accessory costs
  const motorHP = typeof motor.hp === 'string' ? parseFloat(motor.hp) : motor.hp;
  
  const getControlsCostFromSelection = (): number => {
    if (!needsControls) return 0;
    const controlsOption = state.boatInfo?.controlsOption;
    switch (controlsOption) {
      case 'none': return 1200;
      case 'adapter': return 125;
      case 'compatible': return 0;
      default: return 0;
    }
  };
  
  const controlsCost = getControlsCostFromSelection();
  // Only charge installation labor for installed path AND remote motors
  const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;
  const batteryCost = isElectricStart ? 179.99 : 0;
  const includesProp = includesPropeller(motor);
  const propAllowance = getPropellerAllowance(hp);
  const propCost = (!includesProp && propAllowance) ? propAllowance.price : 0;
  const canAddFuelTank = canAddExternalFuelTank(motor);
  const baseAccessoryCost = controlsCost + installationLaborCost;
  // Only apply tiller installation cost if purchasePath is 'installed'
  const tillerInstallCost = isManualTiller && state.purchasePath === 'installed' 
    ? (state.installConfig?.installationCost || 0) 
    : 0;
  const warrantyPrice = state.warrantyConfig?.warrantyPrice || 0;
  
  // Calculate pricing
  const motorMSRP = quoteData.motor?.msrp || quoteData.motor?.basePrice || 0;
  const motorSalePrice = quoteData.motor?.salePrice || quoteData.motor?.price || motorMSRP;
  const motorDiscount = motorMSRP - motorSalePrice;
  
  // Calculate promo savings including rebate if selected
  const basePromoSavings = getTotalPromotionalSavings?.(motorMSRP) || 0;
  const rebateAmount = state.selectedPromoOption === 'cash_rebate' 
    ? (getRebateForHP?.(hp) || 0) 
    : 0;
  const promoSavings = basePromoSavings + rebateAmount;
  const selectedOptionsTotal = (state.selectedOptions || []).reduce((sum, opt) => sum + opt.price, 0);
  
  const totals = calculateQuotePricing({
    motorMSRP,
    motorDiscount,
    adminDiscount: state.adminDiscount || 0,
    accessoryTotal: baseAccessoryCost + selectedOptionsTotal + propCost,
    warrantyPrice,
    promotionalSavings: promoSavings,
    tradeInValue: state.tradeInInfo?.estimatedValue || 0,
    financingFee: 0,
    taxRate: 0.13
  });

  // Coverage years
  const baseYears = 3;
  const promoYears = getTotalWarrantyBonusYears?.() ?? 0;
  const currentCoverageYears = useMemo(() => Math.min(baseYears + promoYears, 8), [promoYears]);

  // Fetch warranty costs for accessory breakdown
  useEffect(() => {
    async function fetchWarrantyCosts() {
      const completeCost = await calculateWarrantyExtensionCost(motorHP, currentCoverageYears, COMPLETE_TARGET_YEARS);
      const premiumCost = await calculateWarrantyExtensionCost(motorHP, currentCoverageYears, PREMIUM_TARGET_YEARS);
      setCompleteWarrantyCost(completeCost);
      setPremiumWarrantyCost(premiumCost);
    }
    if (motorHP > 0) fetchWarrantyCosts();
  }, [motorHP, currentCoverageYears]);

  // Use selected package from context
  const selectedPackage = state.selectedPackage?.id || 'good';
  const selectedPackageLabel = state.selectedPackage?.label || 'Essential • Best Value';
  const selectedPackagePriceBeforeTax = state.selectedPackage?.priceBeforeTax || 0;
  
  // Get coverage years for selected package
  const selectedPackageCoverageYears = useMemo(() => {
    if (selectedPackage === 'best') return PREMIUM_TARGET_YEARS;
    if (selectedPackage === 'better') return COMPLETE_TARGET_YEARS;
    return currentCoverageYears;
  }, [selectedPackage, currentCoverageYears]);

  // Build accessory breakdown
  const accessoryBreakdown = useMemo(() => {
    return buildAccessoryBreakdown({
      selectedOptions: state.selectedOptions,
      motor,
      boatInfo: state.boatInfo,
      purchasePath: state.purchasePath,
      installConfig: state.installConfig,
      looseMotorBattery: state.looseMotorBattery,
      selectedPackage,
      adminCustomItems: state.adminCustomItems || [],
      completeWarrantyCost,
      premiumWarrantyCost,
      currentCoverageYears,
    });
  }, [state.selectedOptions, motor, state.boatInfo, state.purchasePath, state.installConfig, state.looseMotorBattery, selectedPackage, state.adminCustomItems, completeWarrantyCost, premiumWarrantyCost, currentCoverageYears]);

  // Calculate package-specific totals
  const packageSpecificTotals = useMemo(() => {
    const accessoryTotal = accessoryBreakdown.reduce((sum, item) => sum + item.price, 0);
    return calculateQuotePricing({
      motorMSRP,
      motorDiscount,
      adminDiscount: state.adminDiscount || 0,
      accessoryTotal,
      warrantyPrice: 0,
      promotionalSavings: promoSavings,
      tradeInValue: state.tradeInInfo?.estimatedValue || 0,
      taxRate: 0.13
    });
  }, [motorMSRP, motorDiscount, state.adminDiscount, accessoryBreakdown, promoSavings, state.tradeInInfo?.estimatedValue]);

  // Monthly payment calculation
  const amountToFinance = (packageSpecificTotals.subtotal * 1.13) + DEALERPLAN_FEE;
  const { payment: monthlyPayment, termMonths, rate: financingRate } = calculateMonthlyPayment(amountToFinance, promo?.rate || null);

  // CTA handlers
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
      const packageTax = packageSpecificTotals.subtotal * 0.13;
      const packageTotal = packageSpecificTotals.subtotal + packageTax;
      
      // Generate QR code
      // IMPORTANT: Do NOT rely on saved_quotes here. Live currently has 0 rows in saved_quotes,
      // so QR scans must be able to prefill the financing app from URL params alone.
      const financingParams = new URLSearchParams({
        motorModel: motorName,
        motorPrice: (packageTotal + DEALERPLAN_FEE).toFixed(2),
        packageName: selectedPackageLabel.split('•')[0].trim(),
        downPayment: '0',
        tradeInValue: state.tradeInInfo?.hasTradeIn ? String(state.tradeInInfo.estimatedValue || '0') : '0',
        fromQr: 'true',
      });
      const financingUrl = `${SITE_URL}/financing-application?${financingParams.toString()}`;
      
      let qrCodeDataUrl = '';
      try {
        qrCodeDataUrl = await QRCode.toDataURL(financingUrl, {
          width: 200,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' }
        });
      } catch (error) {
        console.error('QR code generation failed:', error);
      }
      
      const pdfData = {
        quoteNumber,
        customerName: state.customerName || 'Valued Customer',
        customerEmail: state.customerEmail || '',
        customerPhone: state.customerPhone || '',
        motor: {
          model: motorName,
          hp: hp,
          msrp: motorMSRP,
          base_price: motorMSRP - motorDiscount,
          sale_price: motorMSRP - motorDiscount - promoSavings,
          dealer_price: motorMSRP - motorDiscount,
          model_year: modelYear || 2026,
          category: motor?.category || 'FourStroke',
          imageUrl: imageUrl
        },
        selectedPackage: {
          id: selectedPackage,
          label: selectedPackageLabel,
          coverageYears: selectedPackageCoverageYears,
          features: []
        },
        accessoryBreakdown: (() => { console.log('[PDF] accessoryBreakdown items:', accessoryBreakdown.length, JSON.stringify(accessoryBreakdown)); return accessoryBreakdown; })(),
        ...(state.tradeInInfo?.hasTradeIn && state.tradeInInfo?.estimatedValue && state.tradeInInfo.estimatedValue > 0 && state.tradeInInfo?.brand ? {
          tradeInValue: state.tradeInInfo.estimatedValue,
          tradeInInfo: {
            brand: state.tradeInInfo.brand,
            year: state.tradeInInfo.year,
            horsepower: state.tradeInInfo.horsepower,
            model: state.tradeInInfo.model
          }
        } : {}),
        includesInstallation: state.purchasePath === 'installed',
        pricing: {
          msrp: motorMSRP,
          discount: motorDiscount,
          adminDiscount: state.adminDiscount || 0,
          promoValue: promoSavings,
          motorSubtotal: motorMSRP - motorDiscount - (state.adminDiscount || 0) - promoSavings,
          subtotal: packageSpecificTotals.subtotal,
          hst: packageTax,
          totalCashPrice: packageTotal,
          savings: motorDiscount + (state.adminDiscount || 0) + promoSavings
        },
        // Only include financing data if total meets minimum threshold
        ...(packageTotal >= FINANCING_MINIMUM ? {
          monthlyPayment,
          financingTerm: termMonths,
          financingRate,
          financingQrCode: qrCodeDataUrl,
        } : {}),
        selectedPromoOption: state.selectedPromoOption,
        selectedPromoValue: getPromoDisplayValue(state.selectedPromoOption, hp),
        customerNotes: state.customerNotes || undefined,
      };
      
      // Save lead
      try {
        const { saveLead } = await import('@/lib/leadCapture');
        await saveLead({
          motor_model: quoteData.motor?.model,
          motor_hp: quoteData.motor?.hp,
          base_price: packageSpecificTotals.subtotal,
          final_price: packageTotal,
          lead_status: 'downloaded',
          lead_source: 'pdf_download',
          quote_data: quoteData
        });
      } catch (leadError) {
        console.error('Failed to save lead:', leadError);
      }
      
      const pdfUrl = await generateQuotePDF(pdfData);
      await downloadPDF(pdfUrl, `Mercury-Quote-${quoteNumber}.pdf`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error", 
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleApplyForFinancing = () => {
    const tradeInValue = state.tradeInInfo?.estimatedValue || 0;
    
    // Use the actual package subtotal (already net of discounts, trade-in, promos)
    // Add tax and financing fee for the total amount to finance
    const subtotalWithTax = packageSpecificTotals.subtotal * 1.13;
    const totalWithFees = subtotalWithTax + DEALERPLAN_FEE;
    
    const packageName = selectedPackageLabel.split('•')[0].trim();
    
    const financingData = {
      ...state,
      financingAmount: {
        packageSubtotal: packageSpecificTotals.subtotal,
        hst: packageSpecificTotals.subtotal * 0.13,
        financingFee: DEALERPLAN_FEE,
        totalWithFees: totalWithFees,
        motorModel: quoteData.motor?.model || motorName,
        packageName: packageName,
        tradeInValue: tradeInValue,
        // Include promo details for financing application
        promoOption: state.selectedPromoOption,
        promoRate: state.selectedPromoRate,
        promoTerm: state.selectedPromoTerm,
        promoValue: state.selectedPromoValue,
      }
    };
    
    localStorage.setItem('quote_state', JSON.stringify(financingData));
    navigate('/financing/apply');
  };

  const handleBookConsult = () => {
    navigate('/quote/schedule');
  };

  // Open the deposit info dialog (replaces direct payment flow)
  const handleReserveDeposit = () => {
    setShowDepositDialog(true);
  };

  // Handle deposit after customer info is collected
  const handleDepositSubmit = async (customerInfo: DepositCustomerInfo) => {
    setShowDepositDialog(false);
    setIsProcessingDeposit(true);
    try {
      const { generatePDFBlob } = await import('@/lib/react-pdf-generator');
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
      const packageTax = packageSpecificTotals.subtotal * 0.13;
      const packageTotal = packageSpecificTotals.subtotal + packageTax;
      const referenceNumber = `HBW-DEP-${quoteNumber.slice(4)}`;
      
      const basePdfData = {
        quoteNumber,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        motor: {
          model: motorName,
          hp: hp,
          msrp: motorMSRP,
          base_price: motorMSRP - motorDiscount,
          sale_price: motorMSRP - motorDiscount - promoSavings,
          dealer_price: motorMSRP - motorDiscount,
          model_year: modelYear || 2026,
          category: motor?.category || 'FourStroke',
          imageUrl: imageUrl
        },
        selectedPackage: {
          id: selectedPackage,
          label: selectedPackageLabel,
          coverageYears: selectedPackageCoverageYears,
          features: []
        },
        accessoryBreakdown,
        ...(state.tradeInInfo?.hasTradeIn && state.tradeInInfo?.estimatedValue && state.tradeInInfo.estimatedValue > 0 && state.tradeInInfo?.brand ? {
          tradeInValue: state.tradeInInfo.estimatedValue,
          tradeInInfo: {
            brand: state.tradeInInfo.brand,
            year: state.tradeInInfo.year,
            horsepower: state.tradeInInfo.horsepower,
            model: state.tradeInInfo.model
          }
        } : {}),
        includesInstallation: state.purchasePath === 'installed',
        pricing: {
          msrp: motorMSRP,
          discount: motorDiscount,
          adminDiscount: state.adminDiscount || 0,
          promoValue: promoSavings,
          motorSubtotal: motorMSRP - motorDiscount - (state.adminDiscount || 0) - promoSavings,
          subtotal: packageSpecificTotals.subtotal,
          hst: packageTax,
          totalCashPrice: packageTotal,
          savings: motorDiscount + (state.adminDiscount || 0) + promoSavings
        },
        selectedPromoOption: state.selectedPromoOption,
        selectedPromoValue: getPromoDisplayValue(state.selectedPromoOption, hp),
        customerNotes: state.customerNotes || undefined,
      };

      // Generate TWO PDFs: clean quote + deposit-confirmed version
      let quotePdfPath: string | undefined;
      let depositPdfPath: string | undefined;
      
      try {
        // 1. Clean quote PDF
        const cleanBlob = await generatePDFBlob(basePdfData);
        const cleanFileName = `deposit-quotes/${quoteNumber}-${Date.now()}.pdf`;
        const { error: cleanErr } = await supabase.storage
          .from('quotes')
          .upload(cleanFileName, cleanBlob, { contentType: 'application/pdf' });
        if (!cleanErr) {
          quotePdfPath = cleanFileName;
          console.log('Clean quote PDF uploaded:', cleanFileName);
        }

        // 2. Deposit-confirmed PDF (with depositInfo baked in)
        const depositPdfData = {
          ...basePdfData,
          depositInfo: {
            amount: depositAmount,
            referenceNumber,
            paymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            paymentMethod: 'Credit Card (Stripe)',
            status: 'Confirmed',
          },
        };
        const depositBlob = await generatePDFBlob(depositPdfData);
        const depositFileName = `deposit-quotes/${quoteNumber}-${Date.now()}-deposit.pdf`;
        const { error: depositErr } = await supabase.storage
          .from('quotes')
          .upload(depositFileName, depositBlob, { contentType: 'application/pdf' });
        if (!depositErr) {
          depositPdfPath = depositFileName;
          console.log('Deposit-confirmed PDF uploaded:', depositFileName);
        }
      } catch (pdfErr) {
        console.warn('Could not generate quote PDFs for deposit:', pdfErr);
      }

      // Save/update saved_quotes record with PDF paths
      let savedQuoteId: string | undefined;
      try {
        const { data: savedQuote, error: sqError } = await supabase
          .from('saved_quotes')
          .insert({
            email: customerInfo.email,
            resume_token: `dep_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
            quote_state: state as any,
            user_id: user?.id || null,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            quote_pdf_path: quotePdfPath || null,
            deposit_pdf_path: depositPdfPath || null,
            deposit_status: 'pending',
            deposit_amount: depositAmount,
          } as any)
          .select('id')
          .single();
        if (!sqError && savedQuote) {
          savedQuoteId = savedQuote.id;
          console.log('Saved quote created for deposit tracking:', savedQuoteId);
        }
      } catch (sqErr) {
        console.warn('Could not create saved_quotes record:', sqErr);
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          paymentType: 'deposit',
          depositAmount: String(depositAmount),
          customerInfo: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
          motorInfo: {
            model: motorName,
            hp: hp,
            year: modelYear || 2026
          },
          quotePdfPath: depositPdfPath || quotePdfPath,
          savedQuoteId,
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Payment",
          description: "Opening secure payment window...",
        });
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate deposit. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Listen for deposit trigger from UnifiedMobileBar
  useEffect(() => {
    const handleInitiateDeposit = () => {
      handleReserveDeposit();
    };
    window.addEventListener('initiate-deposit', handleInitiateDeposit);
    return () => window.removeEventListener('initiate-deposit', handleInitiateDeposit);
  }, [depositAmount, user, motorName, hp, modelYear]);

  // Package features for display
  const isInstalled = state.purchasePath === 'installed';
  const selectedPackageFeatures = useMemo(() => {
    if (selectedPackage === 'best') {
      return [
        "Everything in Complete",
        `Maximum ${PREMIUM_TARGET_YEARS} years coverage`,
        "Premium propeller",
        "🧢👕 FREE Hat + Shirt ($75)",
        ...(isInstalled ? ["White-glove installation"] : [])
      ];
    }
    if (selectedPackage === 'better') {
      return [
        "Mercury motor",
        `${COMPLETE_TARGET_YEARS} years coverage`,
        "Marine battery included",
        "🧢 FREE Mercury Hat ($35)",
        ...(isInstalled ? ["Priority installation"] : [])
      ];
    }
    return [
      "Mercury motor",
      `${currentCoverageYears} years coverage`,
      ...(isInstalled ? ["Standard installation"] : [])
    ];
  }, [selectedPackage, currentCoverageYears, isInstalled]);

  return (
    <>
      {/* Deposit Info Dialog */}
      <DepositInfoDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
        onSubmit={handleDepositSubmit}
        depositAmount={depositAmount}
        defaultValues={{
          name: state.customerName || user?.user_metadata?.full_name || '',
          email: state.customerEmail || user?.email || '',
          phone: state.customerPhone || '',
        }}
        isProcessing={isProcessingDeposit}
      />
      {/* Cinematic Quote Reveal */}
      <QuoteRevealCinematic
        isVisible={showCinematic && isMounted}
        onComplete={handleCinematicComplete}
        motorName={motorName}
        finalPrice={packageSpecificTotals.subtotal}
        msrp={motorMSRP}
        savings={totals.savings}
        tradeInValue={state.tradeInInfo?.estimatedValue}
        coverageYears={selectedPackageCoverageYears}
        imageUrl={imageUrl}
        selectedPromoOption={state.selectedPromoOption}
        selectedPromoValue={getPromoDisplayValue(state.selectedPromoOption, hp)}
        monthlyPayment={monthlyPayment}
      />
      
      <ScrollToTop />
      <PageTransition>
        <QuoteLayout showProgress={false}>
          {!isMounted ? (
            <QuoteSummarySkeleton />
          ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid lg:grid-cols-[1fr_360px] gap-8">
              {/* Main Content - Left Column */}
              <div className="space-y-6">
                {/* Package Header with Change Link */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedPackageLabel}</span> Package
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/quote/package-selection')}
                    className="h-auto p-0 text-sm text-primary hover:text-primary/80 gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Change Package
                  </Button>
                </div>

                {/* Detailed Pricing Breakdown */}
                <motion.div
                  variants={pricingTableVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <PricingTable
                    pricing={packageSpecificTotals}
                    motorName={quoteData.motor?.model || 'Mercury Motor'}
                    accessoryBreakdown={accessoryBreakdown}
                    tradeInValue={state.tradeInInfo?.estimatedValue || 0}
                    tradeInInfo={state.tradeInInfo?.hasTradeIn ? {
                      brand: state.tradeInInfo.brand,
                      year: state.tradeInInfo.year,
                      horsepower: state.tradeInInfo.horsepower,
                      model: state.tradeInInfo.model
                    } : undefined}
                    packageName={selectedPackageLabel}
                    includesInstallation={state.purchasePath === 'installed'}
                    onApplyForFinancing={handleApplyForFinancing}
                    selectedPromoOption={state.selectedPromoOption}
                    selectedPromoValue={getPromoDisplayValue(state.selectedPromoOption, hp)}
                  />
                </motion.div>

                {/* Bonus Offers */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    ...sectionVariants,
                    visible: {
                      ...sectionVariants.visible,
                      transition: {
                        ...sectionVariants.visible.transition,
                        delay: 0.4
                      }
                    }
                  }}
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <BonusOffers motor={quoteData.motor} />
                  </div>
                </motion.div>

                {/* Admin Controls - Only visible to admins */}
                {isAdmin && state.isAdminQuote && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      ...sectionVariants,
                      visible: {
                        ...sectionVariants.visible,
                        transition: {
                          ...sectionVariants.visible.transition,
                          delay: 0.5
                        }
                      }
                    }}
                  >
                    <AdminQuoteControls 
                      onSave={() => navigate('/admin/quotes')}
                    />
                  </motion.div>
                )}

                {/* Mobile CTA Section */}
                <div className="lg:hidden space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => setShowSaveDialog(true)}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Save for Later
                    </Button>
                    <Button 
                      onClick={handleDownloadPDF}
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled={isGeneratingPDF}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isGeneratingPDF ? 'PDF' : 'Download PDF'}
                    </Button>
                  </div>
                  {packageSpecificTotals.total >= FINANCING_MINIMUM && (
                    <Button 
                      onClick={handleApplyForFinancing}
                      variant="default"
                      className="w-full"
                      size="lg"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Apply for Financing
                    </Button>
                  )}
                  <Button 
                    onClick={handleStepComplete}
                    className="w-full bg-primary hover:opacity-90 text-primary-foreground premium-pulse"
                    size="lg"
                  >
                    Continue to Schedule
                  </Button>
                </div>
              </div>

              {/* Sticky Summary - Right Column (Desktop) */}         
              <div>
                <StickySummary
                  packageLabel={selectedPackageLabel}
                  yourPriceBeforeTax={packageSpecificTotals.subtotal}
                  totalSavings={totals.savings}
                  monthly={monthlyPayment}
                  bullets={selectedPackageFeatures}
                  onReserve={handleReserveDeposit}
                  depositAmount={depositAmount}
                  coverageYears={selectedPackageCoverageYears}
                  onDownloadPDF={handleDownloadPDF}
                  onSaveForLater={() => setShowSaveDialog(true)}
                  onApplyForFinancing={packageSpecificTotals.total >= FINANCING_MINIMUM ? handleApplyForFinancing : undefined}
                  isGeneratingPDF={isGeneratingPDF}
                  showUpgradePrompt={false}
                  isProcessingPayment={isProcessingDeposit}
                />
              </div>
            </div>
          </div>
          )}
          
          <SaveQuoteDialog 
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            quoteData={state}
            motorModel={motorName}
            finalPrice={packageSpecificTotals.total}
          />
        </QuoteLayout>
      </PageTransition>
    </>
  );
}
