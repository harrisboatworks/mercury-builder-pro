import { RequiredMark } from "@/components/ui/required-mark";
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { contactInfoSchema, sanitizeInput, formatPhoneNumber } from '@/lib/validation';
import { ArrowLeft, ArrowRight, Calendar, Download, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { QuoteData } from '../QuoteBuilder';
import { computeTotals } from '@/lib/finance';
import { z } from 'zod';
import { isQuotePdfSnapshot } from '@/lib/quote-pdf-data';
import { useQuote } from '@/contexts/QuoteContext';
import { getTurnstileSiteKey, loadTurnstileScript } from '@/lib/turnstile-client';

interface ScheduleConsultationProps {
  quoteData: QuoteData;
  onBack: () => void;
  purchasePath?: string;
}

export const ScheduleConsultation = ({ quoteData, onBack, purchasePath }: ScheduleConsultationProps) => {
  const { user } = useAuth();
  const { dispatch } = useQuote();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    contactMethod: 'email',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileHostRef = useRef<HTMLDivElement | null>(null);
  const pdfSnapshot = isQuotePdfSnapshot(quoteData.pdfSnapshot) ? quoteData.pdfSnapshot : null;
  const isLoosePickup = (purchasePath || quoteData.purchasePath) === 'loose';
  const turnstileSiteKey = getTurnstileSiteKey();

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileHostRef.current) return;
    let cancelled = false;
    let widgetId: string | undefined;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !turnstileHostRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(turnstileHostRef.current, {
          sitekey: turnstileSiteKey,
          callback: (token: string) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => setTurnstileToken(''),
        });
      })
      .catch(() => {
        if (!cancelled) setTurnstileToken('');
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    };
  }, [turnstileSiteKey]);

  const buildPdfData = (quoteNumber: string, customer: { name: string; email: string; phone?: string }) => {
    if (!pdfSnapshot) {
      throw new Error('The exact quote snapshot is missing. Return to the quote summary once, then try again.');
    }
    return {
      quoteNumber,
      customerName: customer.name || 'Valued Customer',
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
      snapshot: pdfSnapshot,
    };
  };

  const formatPhoneAsUserTypes = (value: string) => {
    // Remove all non-digits
    const phone = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phone.length <= 3) {
      return phone;
    } else if (phone.length <= 6) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    } else {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!contactInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!contactInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(contactInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!contactInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = contactInfo.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.phone = 'Please enter a 10-digit phone number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMonthlyPayment = () => {
    if (pdfSnapshot?.financing?.monthlyPayment) return pdfSnapshot.financing.monthlyPayment;
    if (!quoteData.motor) return 0;
    const principal = Math.round(totalCashPrice) - quoteData.financing.downPayment;
    const monthlyRate = quoteData.financing.rate / 100 / 12;
    const numPayments = quoteData.financing.term;
    
    if (principal <= 0) return 0;
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  // Calculate pricing dynamically (matching QuoteSummaryPage.tsx exactly)
  const motorPrice = quoteData.motor?.price || 0;
  const motorMSRP = quoteData.motor?.msrp || quoteData.motor?.basePrice || motorPrice;
  const motorDiscount = motorMSRP - motorPrice;
  
  // Calculate accessories dynamically - MUST match QuoteSummaryPage.tsx
  let accessoryTotal = 0;
  
  // 1. Selected options from package selection (battery, propeller, etc.)
  const selectedOptionsTotal = (quoteData.selectedOptions || []).reduce((sum, opt) => sum + opt.price, 0);
  accessoryTotal += selectedOptionsTotal;
  
  // 2. Controls cost from boat info
  if (quoteData.boatInfo?.controlsOption === 'none') accessoryTotal += 1200;
  else if (quoteData.boatInfo?.controlsOption === 'adapter') accessoryTotal += 125;
  
  // 3. Installation labor for remote motors (only if installed path)
  const isTiller = quoteData.motor?.model?.includes('TLR') || quoteData.motor?.model?.includes('MH');
  const installationLaborCost = ((purchasePath === 'installed' || quoteData.purchasePath === 'installed') && !isTiller) ? 450 : 0;
  accessoryTotal += installationLaborCost;
  
  // 4. Add mounting hardware for tillers (installConfig)
  if (quoteData.installConfig?.installationCost) {
    accessoryTotal += quoteData.installConfig.installationCost;
  }
  
  // 5. Add fuel tank for small tillers (fuelTankConfig)
  if (quoteData.fuelTankConfig?.tankCost) {
    accessoryTotal += quoteData.fuelTankConfig.tankCost;
  }
  
  // 6. Warranty
  const warrantyPrice = quoteData.warrantyConfig?.warrantyPrice || 0;
  accessoryTotal += warrantyPrice;
  
  // Calculate totals
  const subtotal = motorPrice + accessoryTotal;
  const hasTradeIn = quoteData.tradeInInfo?.hasTradeIn || false;
  const tradeInValue = quoteData.tradeInInfo?.estimatedValue || 0;
  const calculatedSubtotalAfterTrade = subtotal - (hasTradeIn ? tradeInValue : 0);
  const subtotalAfterTrade = pdfSnapshot?.pricing.subtotal ?? calculatedSubtotalAfterTrade;
  const hst = pdfSnapshot?.pricing.hst ?? (subtotalAfterTrade * 0.13);
  const totalCashPrice = pdfSnapshot?.pricing.totalCashPrice ?? (subtotalAfterTrade + hst);
  
  // Create pricing data object - MSRP is just motor MSRP, not including accessories
  const data = {
    msrp: pdfSnapshot?.pricing.msrp ?? motorMSRP,
    discount: pdfSnapshot?.pricing.discount ?? motorDiscount,
    promoValue: pdfSnapshot?.pricing.promoValue ?? 0,
    motorSubtotal: pdfSnapshot?.pricing.motorSubtotal ?? motorPrice,
    accessoryTotal: pdfSnapshot
      ? pdfSnapshot.accessoryBreakdown.reduce((sum, item) => sum + item.price, 0)
      : accessoryTotal,
    subtotal: pdfSnapshot?.pricing.subtotal ?? subtotal,
    savings: pdfSnapshot?.pricing.savings ?? motorDiscount
  };
  
  // Create totals object for backward compatibility
  const totals = {
    msrp: data.msrp,
    discount: data.discount,
    promoValue: data.promoValue,
    subtotal: data.subtotal,
    savings: data.savings
  };

  const calculateTotalCost = () => {
    const monthlyPayment = calculateMonthlyPayment();
    const amortization = pdfSnapshot?.financing?.amortizationMonths ?? quoteData.financing.term;
    return (monthlyPayment * amortization) + quoteData.financing.downPayment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Validation errors shown inline
      return;
    }

    // Anonymous users MUST be able to submit — the lead-capture step happens
    // BEFORE any account is created (the success page offers account creation).
    if (!quoteData.motor) return;
    if (!pdfSnapshot) {
      toast({
        title: 'Quote needs to be refreshed',
        description: 'Return to the quote summary once, then send the complete quote for review.',
        variant: 'destructive',
      });
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setErrors((prev) => ({ ...prev, turnstile: 'Please complete the verification check.' }));
      return;
    }

    setIsSubmitting(true);

    let quoteId: string | undefined;
    let quoteNumber = '';

    try {
      const cleanPhone = contactInfo.phone.replace(/\D/g, '');
      const formattedPhone = `+1${cleanPhone}`;

      const sanitizedContactInfo = {
        name: sanitizeInput(contactInfo.name),
        email: sanitizeInput(contactInfo.email),
        phone: formattedPhone,
        contactMethod: contactInfo.contactMethod,
        notes: sanitizeInput(contactInfo.notes)
      };

      const insertPayload = {
        base_price: totals.subtotal,
        final_price: Math.round(totalCashPrice),
        deposit_amount: quoteData.financing.downPayment,
        loan_amount: pdfSnapshot?.financing?.amountFinanced ?? (Math.round(totalCashPrice) - quoteData.financing.downPayment),
        monthly_payment: calculateMonthlyPayment(),
        term_months: pdfSnapshot?.financing?.amortizationMonths ?? quoteData.financing.term,
        total_cost: calculateTotalCost(),
        customer_name: sanitizedContactInfo.name,
        customer_email: sanitizedContactInfo.email,
        customer_phone: sanitizedContactInfo.phone,
        // Lead tracking fields
        lead_status: 'scheduled',
        lead_source: 'consultation',
        lead_score: 75, // High score for scheduled consultations
        // New trade-in penalty audit fields
        tradein_value_pre_penalty: quoteData.boatInfo?.tradeIn?.tradeinValuePrePenalty ?? null,
        tradein_value_final: quoteData.boatInfo?.tradeIn?.tradeinValueFinal ?? quoteData.boatInfo?.tradeIn?.estimatedValue ?? null,
        penalty_applied: Boolean(quoteData.boatInfo?.tradeIn?.penaltyApplied),
        penalty_factor: quoteData.boatInfo?.tradeIn?.penaltyFactor ?? null,
        penalty_reason: (quoteData.boatInfo?.tradeIn?.penaltyApplied ? 'brand_out_of_business' : null),
        discount_amount: 0,
      };

      const { data: fnData, error: fnError } = await supabase.functions.invoke('submit-quote-lead', {
        body: {
          customer_name: sanitizedContactInfo.name,
          customer_email: sanitizedContactInfo.email,
          customer_phone: sanitizedContactInfo.phone,
          contact_method: sanitizedContactInfo.contactMethod,
          notes: sanitizedContactInfo.notes,
          motor_model: quoteData.motor?.model || null,
          base_price: insertPayload.base_price,
          final_price: insertPayload.final_price,
          deposit_amount: insertPayload.deposit_amount,
          loan_amount: insertPayload.loan_amount,
          monthly_payment: insertPayload.monthly_payment,
          term_months: insertPayload.term_months,
          total_cost: insertPayload.total_cost,
          tradein_value_pre_penalty: insertPayload.tradein_value_pre_penalty,
          tradein_value_final: insertPayload.tradein_value_final,
          penalty_applied: insertPayload.penalty_applied,
          penalty_factor: insertPayload.penalty_factor,
          penalty_reason: insertPayload.penalty_reason,
          quote_snapshot: pdfSnapshot,
          ...(turnstileToken ? { turnstileToken } : {}),
        },
      });
      if (fnError) throw fnError;
      if (fnData && fnData.success === false) {
        throw new Error(fnData.error || 'Failed to submit quote');
      }
      quoteId = fnData?.quoteId;
      quoteNumber = typeof fnData?.quoteNumber === 'string' ? fnData.quoteNumber : '';
      if (!quoteId || !quoteNumber) {
        throw new Error('Failed to submit quote');
      }

      // Mark the final step only after the lead record has been persisted.
      // useQuoteActivityTracker converts this confirmed state change into quote_submitted.
      dispatch({ type: 'COMPLETE_STEP', payload: 7 });

      try {
        const { triggerHotLeadWebhooks } = await import('@/lib/webhooks');
        await triggerHotLeadWebhooks({
          id: quoteId,
          customer_name: sanitizedContactInfo.name,
          customer_email: sanitizedContactInfo.email,
          customer_phone: sanitizedContactInfo.phone,
          lead_score: 75,
          final_price: Math.round(totalCashPrice),
          motor_model_id: quoteData.motor?.model || 'Mercury Motor',
          created_at: new Date().toISOString(),
          lead_source: 'consultation',
          lead_status: 'scheduled'
        });
      } catch (error) {
        console.error('Hot lead webhook error:', error);
      }

      navigate(`/quote/success?ref=${quoteNumber}`, {
        state: {
          contactInfo: {
            name: sanitizedContactInfo.name,
            email: sanitizedContactInfo.email,
            phone: sanitizedContactInfo.phone
          },
          quoteId
        }
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = field === 'phone' ? formatPhoneAsUserTypes(value) : value;
    setContactInfo(prev => ({ ...prev, [field]: sanitizedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generatePDF = async () => {
    if (!quoteData.motor) {
      // Silent - button shouldn't be available without motor
      return;
    }

    try {
      // Generate a unique quote number
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
      
      // Import PDF generator
      const { generateQuotePDF, downloadPDF } = await import('@/lib/react-pdf-generator');
      
      const pdfData = buildPdfData(quoteNumber, {
        name: contactInfo.name || 'Valued Customer',
        email: contactInfo.email || user?.email || '',
        phone: contactInfo.phone,
      });
      
      // Generate PDF using PDF.co API
      const pdfUrl = await generateQuotePDF(pdfData);
      
      // Download the PDF
      downloadPDF(pdfUrl, `Mercury-Quote-${quoteNumber}.pdf`);
      
      // Silent success - browser download provides feedback
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="max-w-2xl mx-auto">
        {/* Contact Form */}
        <Card className="rounded-sm border-repower-navy-900/10 bg-repower-paper p-6 shadow-none transition-colors duration-300 hover:border-repower-navy-900/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-repower-navy-900">Where should we send the reviewed quote?</h2>
              <p className="mt-2 font-sans text-repower-navy-900/65">
                Choose how you would like us to reply. No payment or obligation.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">Full Name <RequiredMark /></Label>
              <Input
                id="name"
                value={contactInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={`min-h-12 rounded-sm border-repower-navy-900/10 bg-repower-cream font-sans transition-colors duration-300 focus:border-repower-gold ${errors.name ? 'border-destructive' : ''}`}
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="text-sm text-destructive font-light">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">Email Address <RequiredMark /></Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className={`min-h-12 rounded-sm border-repower-navy-900/10 bg-repower-cream font-sans transition-colors duration-300 focus:border-repower-gold ${errors.email ? 'border-destructive' : ''}`}
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-destructive font-light">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">Phone Number <RequiredMark /></Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(705) 555-1234"
                className={`min-h-12 rounded-sm border-repower-navy-900/10 bg-repower-cream font-sans transition-colors duration-300 focus:border-repower-gold ${errors.phone ? 'border-destructive' : ''}`}
                maxLength={14}
                aria-required="true"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'phone-error phone-help' : 'phone-help'}
              />
              {errors.phone && (
                <p id="phone-error" role="alert" className="text-sm text-destructive font-light">{errors.phone}</p>
              )}
              <p id="phone-help" className="text-xs text-muted-foreground font-light">Enter 10 digits (with or without formatting)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactMethod" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">Preferred Contact Method</Label>
              <Select value={contactInfo.contactMethod} onValueChange={(value) => handleInputChange('contactMethod', value)}>
                <SelectTrigger id="contactMethod" aria-describedby="contact-method-help" className="min-h-12 rounded-sm border-repower-navy-900/10 bg-repower-cream font-sans">
                  <SelectValue placeholder="How would you like us to contact you?" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
              <p id="contact-method-help" className="text-xs text-muted-foreground font-light">
                This tells our team how to follow up. Choosing text asks for a later message from a person, not an automated SMS.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">Additional Comments (Optional)</Label>
              <Textarea
                id="notes"
                value={contactInfo.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about your boat or installation requirements"
                rows={3}
                maxLength={500}
                className="rounded-sm border-repower-navy-900/10 bg-repower-cream font-sans transition-colors duration-300 focus:border-repower-gold"
              />
              <p className="text-xs text-muted-foreground  font-light">{contactInfo.notes.length}/500 characters</p>
            </div>

            <div className="mt-2 mb-4 bg-repower-cream border border-repower-navy-900/10 p-4 rounded-sm text-[13px] text-repower-navy-900/80 leading-relaxed">
              A real person at Harris Boat Works reviews every request. This does not place an order or take payment. We usually confirm everything within 1 business day.
            </div>
            <div className="space-y-2">
              <div ref={turnstileHostRef} data-testid="consultation-turnstile" />
              {errors.turnstile && (
                <p role="alert" className="text-sm text-destructive font-light">{errors.turnstile}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full inline-flex items-center justify-center gap-2 bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-navy-900 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              {isSubmitting ? 'Sending for review…' : 'Send My Quote for Review'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-center font-sans text-[12px] leading-relaxed text-repower-navy-900/55">
              We use your details to review this quote and contact you about it.{' '}
              <Link to="/privacy" className="font-semibold text-repower-navy-900 underline decoration-repower-gold/70 underline-offset-2 hover:decoration-repower-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-gold/50">
                Privacy Policy
              </Link>
            </p>

            <details className="border-t border-repower-navy-900/10 pt-5">
              <summary className="cursor-pointer font-sans text-[13px] font-semibold text-repower-navy-900/70 hover:text-repower-navy-900">
                Want a PDF on this device? <span className="font-normal text-repower-navy-900/50">(optional)</span>
              </summary>
              <div className="mt-4 space-y-3">
                <p className="font-sans text-[13px] leading-relaxed text-repower-navy-900/65">
                  Download a local copy of this quote. This does not email, text, or store the PDF on Harris Boat Works systems.
                </p>
                <button
                  type="button"
                  onClick={generatePDF}
                  className="group inline-flex w-full items-center justify-center gap-2 border border-repower-navy-900/15 bg-repower-cream px-5 py-3.5 font-sans text-[14px] font-semibold text-repower-navy-900 transition-colors hover:border-repower-gold"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </details>
          </form>
        </Card>
      </div>


      {/* Contact Information */}
      <Card className="p-6 border-repower-navy-900/10 rounded-sm">
        <h3 className="text-xl font-light tracking-wide mb-4">Harris Boat Works</h3>
        <div className="w-full grid grid-cols-3 gap-2 md:gap-6">
          <a href="tel:9053422153" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-light">Phone</span>
          </a>
          <a href="mailto:info@harrisboatworks.ca" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-light">Email</span>
          </a>
          <a href="https://maps.google.com/?q=5369+Harris+Boat+Works+Rd,+Gores+Landing,+ON" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-light">Location</span>
          </a>
        </div>
        
        <div className="mt-6 p-4 bg-repower-cream rounded-sm border border-repower-navy-900/10">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-repower-navy-900/75 mt-0.5" />
            <div>
              <p className="font-light tracking-wide mb-2">What happens next?</p>
              <ul className="text-sm text-muted-foreground  font-light space-y-1">
                {isLoosePickup ? (
                  <>
                    <li>• We contact you within 1 business day</li>
                    <li>• We confirm the exact motor, shaft, controls, and rigging requirements</li>
                    <li>• We send the final pickup-ready price and availability</li>
                    <li>• Pickup is arranged only after you approve the quote</li>
                  </>
                ) : (
                  <>
                    <li>• We contact you within 1 business day</li>
                    <li>• We confirm your boat specifications and any inspection needs</li>
                    <li>• We finalize the installation scope, price, and timing</li>
                    <li>• Installation is booked only after you approve the quote</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-repower-navy-900 text-repower-navy-900 hover:bg-repower-navy-900/[0.04] rounded-sm font-light tracking-wide">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quote Review
        </Button>
      </div>
    </div>
  );
};
