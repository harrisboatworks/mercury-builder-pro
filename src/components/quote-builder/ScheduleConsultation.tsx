import { RequiredMark } from "@/components/ui/required-mark";
import { useState, useEffect } from 'react';
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
import { ArrowLeft, ArrowRight, Calendar, Download, Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { QuoteData } from '../QuoteBuilder';
import { computeTotals } from '@/lib/finance';
import { z } from 'zod';
import { isQuotePdfSnapshot } from '@/lib/quote-pdf-data';
import { useQuote } from '@/contexts/QuoteContext';

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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const pdfSnapshot = isQuotePdfSnapshot(quoteData.pdfSnapshot) ? quoteData.pdfSnapshot : null;
  const isLoosePickup = (purchasePath || quoteData.purchasePath) === 'loose';

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

    setIsSubmitting(true);

    // Declare variables that need to be accessible throughout the function
    let quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
    let pdfUrl: string | null = null;
    let quoteId: string | undefined;

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

      if (user) {
        // Authenticated path: unchanged direct insert under user's RLS.
        const { data: inserted, error } = await supabase
          .from('customer_quotes')
          .insert({ user_id: user.id, ...insertPayload } as any)
          .select('id')
          .single();
        if (error) throw error;
        quoteId = inserted?.id;
      } else {
        // Anonymous path: route through service-role edge function so we don't
        // silently no-op when nobody is logged in (the original bug). The
        // function returns the new row id directly.
        const { data: fnData, error: fnError } = await supabase.functions.invoke('submit-quote-lead', {
          body: {
            user_id: null,
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
          },
        });
        if (fnError) throw fnError;
        if (fnData && fnData.success === false) {
          throw new Error(fnData.error || 'Failed to submit quote');
        }
        quoteId = fnData?.quoteId;
      }

      // Mark the final step only after the lead record has been persisted.
      // useQuoteActivityTracker converts this confirmed state change into quote_submitted.
      dispatch({ type: 'COMPLETE_STEP', payload: 7 });

      console.log('🔍 [NOTIFICATIONS] Starting notification process... quoteId:', quoteId);

      // 1. Trigger hot lead webhooks (score is 75, >= 70 threshold)
      console.log('🔍 [NOTIFICATIONS] Step 1: Triggering hot lead webhooks...');
      try {
        console.log('🔍 [NOTIFICATIONS] Importing webhook functions...');
        const { triggerHotLeadWebhooks } = await import('@/lib/webhooks');
        const { triggerHotLeadSMS } = await import('@/lib/leadCapture');
        console.log('✅ [NOTIFICATIONS] Webhook functions imported successfully');
        
        const leadWebhookData = {
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
        };
        
        console.log('🔍 [NOTIFICATIONS] Lead webhook data:', leadWebhookData);
        console.log('🔍 [NOTIFICATIONS] Calling triggerHotLeadWebhooks...');
        const webhookResult = await triggerHotLeadWebhooks(leadWebhookData);
        console.log('✅ [NOTIFICATIONS] Hot lead webhooks triggered. Result:', webhookResult);
        
        // Send SMS to admin about hot lead
        console.log('🔍 [NOTIFICATIONS] Calling triggerHotLeadSMS...');
        const smsData = {
          customerName: sanitizedContactInfo.name,
          leadScore: 75,
          finalPrice: Math.round(totalCashPrice),
          motorModel: quoteData.motor?.model || 'Mercury Motor',
          phoneNumber: sanitizedContactInfo.phone,
        };
        console.log('🔍 [NOTIFICATIONS] SMS data:', smsData);
        const smsResult = await triggerHotLeadSMS(smsData);
        console.log('✅ [NOTIFICATIONS] Hot lead SMS sent to admin. Result:', smsResult);
      } catch (error) {
        console.error('❌ [NOTIFICATIONS] Hot lead notification error:', error);
        console.error('❌ [NOTIFICATIONS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('❌ [NOTIFICATIONS] Error message:', error instanceof Error ? error.message : String(error));
      }

      // 2. Send quote email to customer
      console.log('🔍 [NOTIFICATIONS] Step 2: Preparing quote email...');
      try {
        console.log('🔍 [NOTIFICATIONS] Quote number:', quoteNumber);
        
        // 2.1. Generate and upload PDF before sending email
        console.log('🔍 [PDF] Generating PDF quote...');
        try {
          // Import PDF generation utilities
          const { generatePDFBlob } = await import('@/lib/react-pdf-generator');
          
          const pdfQuoteData = buildPdfData(quoteNumber, {
            name: sanitizedContactInfo.name,
            email: sanitizedContactInfo.email,
            phone: sanitizedContactInfo.phone,
          });
          
          console.log('🔍 [PDF] Generating PDF blob...');
          const pdfBlob = await generatePDFBlob(pdfQuoteData);
          console.log('✅ [PDF] PDF generated, size:', pdfBlob.size, 'bytes');
          
          // Upload to Supabase Storage
          const fileName = `quote-${quoteNumber}-${Date.now()}.pdf`;
          const filePath = `${quoteId}/${fileName}`;
          
          console.log('🔍 [PDF] Uploading to Supabase Storage:', filePath);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('spec-sheets')
            .upload(filePath, pdfBlob, {
              contentType: 'application/pdf',
              upsert: false
            });
          
          if (uploadError) {
            console.error('❌ [PDF] Upload error:', uploadError);
            throw uploadError;
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('spec-sheets')
            .getPublicUrl(filePath);
          
          console.log('✅ [PDF] PDF uploaded successfully. Public URL:', publicUrl);
          pdfUrl = publicUrl;
          
        } catch (pdfError) {
          console.error('❌ [PDF] PDF generation/upload error:', pdfError);
          console.error('❌ [PDF] Error stack:', pdfError instanceof Error ? pdfError.stack : 'No stack trace');
          // Don't fail the submission if PDF fails, but log it
          pdfUrl = null;
        }
        
        // 2.2. Send email with PDF attachment
        console.log('🔍 [NOTIFICATIONS] Sending quote email with PDF...');
        const emailPayload = {
          customerEmail: sanitizedContactInfo.email,
          customerName: sanitizedContactInfo.name,
          quoteNumber: quoteNumber,
          motorModel: quoteData.motor?.model || 'Mercury Motor',
          totalPrice: Math.round(totalCashPrice),
          pdfUrl: pdfUrl,
          emailType: 'quote_delivery'
        };
        console.log('🔍 [NOTIFICATIONS] Email payload:', emailPayload);
        console.log('🔍 [NOTIFICATIONS] Invoking send-quote-email edge function...');
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-quote-email', {
          body: emailPayload
        });
        
        if (emailError) {
          console.error('❌ [NOTIFICATIONS] Email error object:', emailError);
          throw emailError;
        }
        console.log('✅ [NOTIFICATIONS] Quote email sent successfully. Response:', emailData);
      } catch (error) {
        console.error('❌ [NOTIFICATIONS] Quote email error:', error);
        console.error('❌ [NOTIFICATIONS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('❌ [NOTIFICATIONS] Error message:', error instanceof Error ? error.message : String(error));
      }

      // 3. Send SMS confirmation to customer (if they selected text as contact method)
      console.log('🔍 [NOTIFICATIONS] Step 3: Checking SMS confirmation...');
      console.log('🔍 [NOTIFICATIONS] Contact method:', sanitizedContactInfo.contactMethod);
      if (sanitizedContactInfo.contactMethod === 'text') {
        console.log('🔍 [NOTIFICATIONS] Sending SMS to customer...');
        try {
          const smsPayload = {
            to: sanitizedContactInfo.phone,
            message: `Hi ${sanitizedContactInfo.name}! Thank you for requesting a Mercury motor quote. We've received your information and will contact you soon to discuss your ${quoteData.motor?.model} quote. - Harris Boat Works`,
            messageType: 'quote_confirmation'
          };
          console.log('🔍 [NOTIFICATIONS] SMS payload:', smsPayload);
          console.log('🔍 [NOTIFICATIONS] Invoking send-sms edge function...');
          
          const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms', {
            body: smsPayload
          });
          
          if (smsError) {
            console.error('❌ [NOTIFICATIONS] SMS error object:', smsError);
            throw smsError;
          }
          console.log('✅ [NOTIFICATIONS] SMS confirmation sent to customer. Response:', smsData);
        } catch (error) {
          console.error('❌ [NOTIFICATIONS] Customer SMS error:', error);
          console.error('❌ [NOTIFICATIONS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          console.error('❌ [NOTIFICATIONS] Error message:', error instanceof Error ? error.message : String(error));
        }
      } else {
        console.log('ℹ️ [NOTIFICATIONS] Skipping customer SMS - contact method is not text');
      }

      // 4. Send admin notification email
      console.log('🔍 [NOTIFICATIONS] Step 4: Sending admin notification email...');
      try {
        const adminEmailPayload = {
          customerEmail: 'info@harrisboatworks.ca',
          customerName: 'Harris Boat Works Admin',
          quoteNumber: quoteNumber,
          motorModel: quoteData.motor?.model || 'Mercury Motor',
          totalPrice: Math.round(totalCashPrice),
          pdfUrl: pdfUrl,
          emailType: 'admin_quote_notification',
          leadData: {
            customerName: sanitizedContactInfo.name,
            customerEmail: sanitizedContactInfo.email,
            customerPhone: sanitizedContactInfo.phone,
            contactMethod: sanitizedContactInfo.contactMethod,
            leadScore: 75,
            quoteId: quoteId
          }
        };
        
        console.log('🔍 [NOTIFICATIONS] Admin email payload:', adminEmailPayload);
        
        const { data: adminEmailData, error: adminEmailError } = await supabase.functions.invoke('send-quote-email', {
          body: adminEmailPayload
        });
        
        if (adminEmailError) {
          console.error('❌ [NOTIFICATIONS] Admin email error:', adminEmailError);
          throw adminEmailError;
        }
        console.log('✅ [NOTIFICATIONS] Admin email sent successfully. Response:', adminEmailData);
      } catch (error) {
        console.error('❌ [NOTIFICATIONS] Admin email failed:', error);
      }

      // 5. Send admin SMS notification
      console.log('🔍 [NOTIFICATIONS] Step 5: Sending admin SMS notification...');
      try {
        const adminSmsPayload = {
          to: '+19053766208',
          message: `🔥 NEW QUOTE SUBMITTED!\n\nCustomer: ${sanitizedContactInfo.name}\nMotor: ${quoteData.motor?.model || 'Mercury Motor'}\nQuote: $${Math.round(totalCashPrice).toLocaleString()}\nContact: ${sanitizedContactInfo.contactMethod}\n\nView: mercuryrepower.ca/admin/quotes\n\n- Harris Boat Works`,
          messageType: 'hot_lead'
        };
        
        console.log('🔍 [NOTIFICATIONS] Admin SMS payload:', adminSmsPayload);
        
        const { data: adminSmsData, error: adminSmsError } = await supabase.functions.invoke('send-sms', {
          body: adminSmsPayload
        });
        
        if (adminSmsError) {
          console.error('❌ [NOTIFICATIONS] Admin SMS error:', adminSmsError);
          throw adminSmsError;
        }
        console.log('✅ [NOTIFICATIONS] Admin SMS sent successfully. Response:', adminSmsData);
      } catch (error) {
        console.error('❌ [NOTIFICATIONS] Admin SMS failed:', error);
      }

      console.log('✅ [NOTIFICATIONS] Notification process complete');

      // Navigate to quote success page with reference number and contact info for account creation
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

  const handleSendByEmail = async () => {
    if (!contactInfo.email || !/\S+@\S+\.\S+/.test(contactInfo.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
      
      // Generate PDF first
      const { generatePDFBlob } = await import('@/lib/react-pdf-generator');
      const pdfQuoteData = buildPdfData(quoteNumber, {
        name: contactInfo.name || 'Customer',
        email: contactInfo.email,
        phone: contactInfo.phone,
      });
      
      const pdfBlob = await generatePDFBlob(pdfQuoteData);
      
      // Upload to Supabase Storage
      const fileName = `quote-${quoteNumber}-${Date.now()}.pdf`;
      const filePath = `temp/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('spec-sheets')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('spec-sheets')
        .getPublicUrl(filePath);
      
      // Send email
      const { error: emailError } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail: contactInfo.email,
          customerName: contactInfo.name || 'Customer',
          quoteNumber,
          motorModel: quoteData.motor?.model || 'Mercury Motor',
          totalPrice: Math.round(totalCashPrice),
          pdfUrl: publicUrl,
          emailType: 'quote_delivery'
        }
      });
      
      if (emailError) throw emailError;
      
      toast({
        title: "Quote Sent!",
        description: `Quote sent to ${contactInfo.email}`
      });
    } catch (error) {
      console.error('Send by email error:', error);
      toast({
        title: "Error",
        description: "Failed to send quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendByText = async () => {
    const cleanPhone = contactInfo.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    setIsSendingText(true);
    try {
      const quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
      const formattedPhone = `+1${cleanPhone}`;
      
      // Generate PDF first
      const { generatePDFBlob } = await import('@/lib/react-pdf-generator');
      const pdfQuoteData = buildPdfData(quoteNumber, {
        name: contactInfo.name || 'Customer',
        email: contactInfo.email,
        phone: contactInfo.phone,
      });
      
      const pdfBlob = await generatePDFBlob(pdfQuoteData);
      
      // Upload to Supabase Storage
      const fileName = `quote-${quoteNumber}-${Date.now()}.pdf`;
      const filePath = `temp/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('spec-sheets')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('spec-sheets')
        .getPublicUrl(filePath);
      
      // Send SMS with link
      const message = `Hi${contactInfo.name ? ` ${contactInfo.name}` : ''}! Here's your Mercury motor quote for ${quoteData.motor?.model || 'your motor'}: ${publicUrl} - Harris Boat Works`;
      
      const { error: smsError } = await supabase.functions.invoke('send-sms', {
        body: {
          to: formattedPhone,
          message,
          messageType: 'quote_confirmation'
        }
      });
      
      if (smsError) throw smsError;
      
      toast({
        title: "Quote Sent!",
        description: `Quote sent to ${contactInfo.phone}`
      });
    } catch (error) {
      console.error('Send by text error:', error);
      toast({
        title: "Error",
        description: "Failed to send quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingText(false);
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
                <SelectTrigger id="contactMethod" className="min-h-12 rounded-sm border-repower-navy-900/10 bg-repower-cream font-sans">
                  <SelectValue placeholder="How would you like us to contact you?" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
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
                Want a copy before you submit? <span className="font-normal text-repower-navy-900/50">(optional)</span>
              </summary>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleSendByEmail}
                  disabled={!contactInfo.email || !/\S+@\S+\.\S+/.test(contactInfo.email) || isSendingEmail}
                  className="group inline-flex w-full items-center justify-center gap-2 border border-repower-navy-900/15 bg-repower-cream px-5 py-3.5 font-sans text-[14px] font-semibold text-repower-navy-900 transition-colors hover:border-repower-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Mail className="w-4 h-4" />
                  {isSendingEmail ? 'Sending…' : 'Email Me a Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleSendByText}
                  disabled={!contactInfo.phone || contactInfo.phone.replace(/\D/g, '').length !== 10 || isSendingText}
                  className="group inline-flex w-full items-center justify-center gap-2 border border-repower-navy-900/15 bg-repower-cream px-5 py-3.5 font-sans text-[14px] font-semibold text-repower-navy-900 transition-colors hover:border-repower-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MessageSquare className="w-4 h-4" />
                  {isSendingText ? 'Sending…' : 'Text Me a Copy'}
                </button>
                <button
                  type="button"
                  onClick={generatePDF}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 font-sans text-[13px] text-repower-navy-900/65 hover:text-repower-navy-900 transition-colors"
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
