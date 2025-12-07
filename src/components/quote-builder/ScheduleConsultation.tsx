import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Calendar, Download, Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { QuoteData } from '../QuoteBuilder';
import { computeTotals } from '@/lib/finance';
import { z } from 'zod';

interface ScheduleConsultationProps {
  quoteData: QuoteData;
  onBack: () => void;
  purchasePath?: string;
}

export const ScheduleConsultation = ({ quoteData, onBack, purchasePath }: ScheduleConsultationProps) => {
  const { user } = useAuth();
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
    if (!quoteData.motor) return 0;
    const principal = Math.round(totalCashPrice) - quoteData.financing.downPayment;
    const monthlyRate = quoteData.financing.rate / 100 / 12;
    const numPayments = quoteData.financing.term;
    
    if (principal <= 0) return 0;
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  // Calculate pricing dynamically (same logic as GlobalStickyQuoteBar)
  const motorPrice = quoteData.motor?.price || 0;
  const motorMSRP = quoteData.motor?.msrp || quoteData.motor?.basePrice || motorPrice;
  const motorDiscount = motorMSRP - motorPrice;
  
  // Calculate accessories dynamically
  let accessoryTotal = 0;
  
  // Controls cost from boat info
  if (quoteData.boatInfo?.controlsOption === 'none') accessoryTotal += 1200;
  else if (quoteData.boatInfo?.controlsOption === 'adapter') accessoryTotal += 125;
  
  // Installation labor for remote motors (only if installed path)
  const isTiller = quoteData.motor?.model?.includes('TLR') || quoteData.motor?.model?.includes('MH');
  if ((purchasePath === 'installed' || quoteData.purchasePath === 'installed') && !isTiller) {
    accessoryTotal += 450; // Professional installation labor
  }
  
  // Add mounting hardware for tillers (installConfig)
  if (quoteData.installConfig?.installationCost) {
    accessoryTotal += quoteData.installConfig.installationCost;
  }
  
  // Add fuel tank for small tillers (fuelTankConfig)
  if (quoteData.fuelTankConfig?.tankCost) {
    accessoryTotal += quoteData.fuelTankConfig.tankCost;
  }
  
  // Warranty
  const warrantyPrice = quoteData.warrantyConfig?.warrantyPrice || 0;
  accessoryTotal += warrantyPrice;
  
  // Calculate totals
  const subtotal = motorPrice + accessoryTotal;
  const hasTradeIn = quoteData.tradeInInfo?.hasTradeIn || false;
  const tradeInValue = quoteData.tradeInInfo?.estimatedValue || 0;
  const subtotalAfterTrade = subtotal - (hasTradeIn ? tradeInValue : 0);
  const hst = subtotalAfterTrade * 0.13;
  const totalCashPrice = subtotalAfterTrade + hst;
  
  // Create pricing data object for use throughout component
  const data = {
    msrp: motorMSRP + accessoryTotal,
    discount: motorDiscount,
    promoValue: 0,
    motorSubtotal: motorPrice,
    subtotal: subtotal,
    savings: motorDiscount
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
    return (monthlyPayment * quoteData.financing.term) + quoteData.financing.downPayment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Validation errors shown inline
      return;
    }

    if (!quoteData.motor || !user) return;

    setIsSubmitting(true);
    
    // Declare variables that need to be accessible throughout the function
    let quoteNumber = `HBW-${Date.now().toString().slice(-6)}`;
    let pdfUrl: string | null = null;
    
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

      const { error } = await supabase
        .from('customer_quotes')
        .insert({
          user_id: user.id,
          base_price: totals.subtotal,
          final_price: Math.round(totalCashPrice),
          deposit_amount: quoteData.financing.downPayment,
          loan_amount: Math.round(totalCashPrice) - quoteData.financing.downPayment,
          monthly_payment: calculateMonthlyPayment(),
          term_months: quoteData.financing.term,
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
          // Required fields with defaults
          discount_amount: 0
        } as any);

      if (error) throw error;

      console.log('🔍 [NOTIFICATIONS] Starting notification process...');

      // Get the inserted record with proper typing
      console.log('🔍 [NOTIFICATIONS] Fetching inserted quote ID...');
      const { data: insertedData, error: fetchError } = await supabase
        .from('customer_quotes')
        .select('id')
        .eq('customer_email', sanitizedContactInfo.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('❌ [NOTIFICATIONS] Failed to fetch quote ID:', fetchError);
      }

      const quoteId = insertedData?.id;
      console.log('🔍 [NOTIFICATIONS] Quote ID:', quoteId);

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
          
          // Prepare complete quote data for PDF
          const pdfQuoteData = {
            quoteNumber: quoteNumber,
            customerName: sanitizedContactInfo.name,
            customerEmail: sanitizedContactInfo.email,
            customerPhone: sanitizedContactInfo.phone,
            motor: quoteData.motor,
            pricing: {
              msrp: data.msrp,
              discount: data.discount,
              promoValue: data.promoValue,
              motorSubtotal: motorPrice,
              subtotal: subtotalAfterTrade,
              hst: hst,
              totalCashPrice: totalCashPrice
            },
            financing: quoteData.financing,
            tradeInValue: hasTradeIn ? tradeInValue : undefined,
            tradeInInfo: hasTradeIn ? quoteData.boatInfo?.tradeIn : undefined
          };
          
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
          message: `🔥 NEW QUOTE SUBMITTED!\n\nCustomer: ${sanitizedContactInfo.name}\nMotor: ${quoteData.motor?.model || 'Mercury Motor'}\nQuote: $${Math.round(totalCashPrice).toLocaleString()}\nContact: ${sanitizedContactInfo.contactMethod}\n\nView: quote.harrisboatworks.ca/admin/quotes\n\n- Harris Boat Works`,
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

      // Navigate to quote success page with reference number
      navigate(`/quote/success?ref=${quoteNumber}`);
      
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
      
      const pdfData = {
        quoteNumber,
        customerName: contactInfo.name || 'Valued Customer',
        customerEmail: contactInfo.email || user?.email || '',
        customerPhone: contactInfo.phone || '',
        motor: {
          model: quoteData.motor?.model || 'Mercury Motor',
          hp: quoteData.motor?.hp || 0,
          year: quoteData.motor?.year,
          sku: (quoteData.motor as any)?.sku,
        },
        pricing: {
          msrp: totals.msrp,
          discount: totals.discount,
          promoValue: totals.promoValue,
          subtotal: totals.subtotal,
          tradeInValue: hasTradeIn ? tradeInValue : undefined,
          subtotalAfterTrade: Math.round(subtotalAfterTrade),
          hst: Math.round(hst),
          totalCashPrice: Math.round(totalCashPrice),
          savings: totals.savings
        },
        specs: [
          { label: "HP", value: `${quoteData.motor?.hp || 0}` },
          { label: "Year", value: `${quoteData.motor?.year || 2025}` }
        ].filter(spec => spec.value && spec.value !== '0'),
        financing: {
          monthlyPayment: Math.round(calculateMonthlyPayment()),
          term: quoteData.financing.term,
          rate: quoteData.financing.rate
        }
      };
      
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
      const pdfQuoteData = {
        quoteNumber,
        customerName: contactInfo.name || 'Customer',
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        motor: quoteData.motor,
        pricing: {
          msrp: data.msrp,
          discount: data.discount,
          promoValue: data.promoValue,
          motorSubtotal: motorPrice,
          subtotal: subtotalAfterTrade,
          hst: hst,
          totalCashPrice: totalCashPrice
        },
        financing: quoteData.financing,
        tradeInValue: hasTradeIn ? tradeInValue : undefined,
        tradeInInfo: hasTradeIn ? quoteData.boatInfo?.tradeIn : undefined
      };
      
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
      const pdfQuoteData = {
        quoteNumber,
        customerName: contactInfo.name || 'Customer',
        customerEmail: contactInfo.email,
        customerPhone: contactInfo.phone,
        motor: quoteData.motor,
        pricing: {
          msrp: data.msrp,
          discount: data.discount,
          promoValue: data.promoValue,
          motorSubtotal: motorPrice,
          subtotal: subtotalAfterTrade,
          hst: hst,
          totalCashPrice: totalCashPrice
        },
        financing: quoteData.financing,
        tradeInValue: hasTradeIn ? tradeInValue : undefined,
        tradeInInfo: hasTradeIn ? quoteData.boatInfo?.tradeIn : undefined
      };
      
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
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-light tracking-wide text-slate-900">Submit Your Quote</h2>
        <p className="text-lg text-muted-foreground font-light">
          Complete your contact information and we'll reach out to finalize the details
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1.2fr] gap-8">
        {/* Quote Summary */}
        <Card className="p-6 border-gray-200 rounded-sm hover:border-gray-300 transition-colors duration-300">
          <div className="space-y-6">
            <h3 className="text-xl font-light tracking-wide">Quote Summary</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-light tracking-wide">{quoteData.motor?.model}</h4>
                    <p className="text-sm text-muted-foreground font-light">{quoteData.motor?.hp}HP</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-muted-foreground text-sm font-light">
                <span>MSRP:</span>
                <span className="line-through">${totals.msrp.toLocaleString()}</span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between text-gray-700 dark:text-gray-300 text-sm font-light">
                  <span>Discount:</span>
                  <span>-${totals.discount.toLocaleString()}</span>
                </div>
              )}

              {totals.promoValue > 0 && (
                <div className="flex justify-between text-gray-700 dark:text-gray-300 text-sm font-light">
                  <span>Promo Value:</span>
                  <span>-${totals.promoValue.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between font-light">
                <span>Your Price:</span>
                <span className="font-medium">${totals.subtotal.toLocaleString()}</span>
              </div>

              {hasTradeIn && (
                <div className="flex justify-between text-gray-700 dark:text-gray-300 font-light">
                  <span className="text-muted-foreground">Estimated Trade Value</span>
                  <span>-${tradeInValue.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between font-light">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${Math.round(subtotalAfterTrade).toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-light">
                <span className="text-muted-foreground">HST (13%)</span>
                <span>${Math.round(hst).toLocaleString()}</span>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-light tracking-wide">Total Price</span>
                  <span className="font-medium">${Math.round(totalCashPrice).toLocaleString()}</span>
                </div>
              </div>

              {totals.savings > 0 && (
                <div className="bg-stone-50 dark:bg-stone-950/20 p-3 rounded-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-gray-700 dark:text-gray-300 text-sm font-light">
                    You Save ${totals.savings.toLocaleString()}
                  </div>
                </div>
              )}

              {hasTradeIn && (
                <Alert className="border-gray-300 bg-stone-50 dark:bg-stone-950/20 rounded-sm">
                  <AlertDescription className="font-light text-muted-foreground">
                    Estimated trade value subject to physical inspection during consultation
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="p-6 border-gray-200 rounded-sm hover:border-gray-300 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-xl font-light tracking-wide">Contact Information</h3>
              <p className="text-muted-foreground dark:text-gray-400 font-light mt-2">We'll reach out as soon as possible to discuss your quote and schedule your consultation</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="font-light">Full Name *</Label>
              <Input
                id="name"
                value={contactInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={`border-gray-200 focus:border-gray-400 rounded-sm transition-colors duration-300 ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-destructive font-light">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-light">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className={`border-gray-200 focus:border-gray-400 rounded-sm transition-colors duration-300 ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive font-light">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-light">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(705) 555-1234"
                className={`border-gray-200 focus:border-gray-400 rounded-sm transition-colors duration-300 ${errors.phone ? 'border-destructive' : ''}`}
                maxLength={14}
              />
              {errors.phone && (
                <p className="text-sm text-destructive font-light">{errors.phone}</p>
              )}
              <p className="text-xs text-muted-foreground dark:text-gray-400 font-light">Enter 10 digits (with or without formatting)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactMethod" className="font-light">Preferred Contact Method *</Label>
              <Select value={contactInfo.contactMethod} onValueChange={(value) => handleInputChange('contactMethod', value)}>
                <SelectTrigger className="border-gray-200 rounded-sm">
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
              <Label htmlFor="notes" className="font-light">Additional Comments (Optional)</Label>
              <Textarea
                id="notes"
                value={contactInfo.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about your boat or installation requirements"
                rows={3}
                maxLength={500}
                className="border-gray-200 focus:border-gray-400 rounded-sm transition-colors duration-300"
              />
              <p className="text-xs text-muted-foreground dark:text-gray-400 font-light">{contactInfo.notes.length}/500 characters</p>
            </div>

            {/* Send Quote Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-light text-muted-foreground">Send Quote To:</h4>
              
              {/* Send via Email */}
              <Button 
                onClick={handleSendByEmail}
                disabled={!contactInfo.email || !/\S+@\S+\.\S+/.test(contactInfo.email) || isSendingEmail}
                variant="outline" 
                className="w-full border-gray-900 text-gray-900 hover:bg-gray-50 rounded-sm font-light tracking-wide disabled:opacity-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isSendingEmail ? 'Sending...' : 'Send to Email'}
              </Button>
              
              {/* Send via Text */}
              <Button 
                onClick={handleSendByText}
                disabled={!contactInfo.phone || contactInfo.phone.replace(/\D/g, '').length !== 10 || isSendingText}
                variant="outline" 
                className="w-full border-gray-900 text-gray-900 hover:bg-gray-50 rounded-sm font-light tracking-wide disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {isSendingText ? 'Sending...' : 'Send by Text'}
              </Button>
              
              {/* Download as tertiary option */}
              <Button 
                onClick={generatePDF}
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-gray-900 hover:bg-gray-50 rounded-sm font-light tracking-wide"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-sm border border-gray-900 font-light tracking-wide" disabled={isSubmitting}>
              <Calendar className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Quote'}
            </Button>
          </form>
        </Card>
      </div>


      {/* Contact Information */}
      <Card className="p-6 border-gray-200 rounded-sm">
        <h3 className="text-xl font-light tracking-wide mb-4">Harris Boat Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-700" />
            <div>
              <p className="font-light tracking-wide">Phone</p>
              <p className="text-muted-foreground dark:text-gray-400 font-light">(905) 342-2153</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-700" />
            <div>
              <p className="font-light tracking-wide">Email</p>
              <p className="text-muted-foreground dark:text-gray-400 font-light">info@harrisboatworks.ca</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-700" />
            <div>
              <p className="font-light tracking-wide">Location</p>
              <p className="text-muted-foreground dark:text-gray-400 font-light">5369 Harris Boat Works Rd, Gores Landing, ON</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-stone-50 rounded-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-700 mt-0.5" />
            <div>
              <p className="font-light tracking-wide mb-2">What happens next?</p>
              <ul className="text-sm text-muted-foreground dark:text-gray-400 font-light space-y-1">
                <li>• We'll contact you within 24 hours to schedule your consultation</li>
                <li>• Our technician will inspect your boat and verify all specifications</li>
                <li>• You'll receive a final quote including installation costs</li>
                <li>• Professional installation by certified Mercury technicians</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="border-gray-900 text-gray-900 hover:bg-gray-50 rounded-sm font-light tracking-wide">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quote Review
        </Button>
      </div>
    </div>
  );
};