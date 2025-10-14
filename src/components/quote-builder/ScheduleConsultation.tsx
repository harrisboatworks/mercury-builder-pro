import { useState, useEffect } from 'react';
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
import { ArrowLeft, Calendar, Download, Phone, Mail, MapPin, Clock } from 'lucide-react';
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
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    contactMethod: 'email',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Use same pricing calculations as QuoteSummaryPage
  const motorPrice = quoteData.motor?.salePrice || quoteData.motor?.basePrice || quoteData.motor?.price || 0;
  
  // Calculate pricing breakdown using same logic as summary page
  const data = {
    msrp: motorPrice + 2500, // Motor + base accessories
    discount: 546,
    promoValue: 400,
    subtotal: motorPrice + 2500 - 546 - 400,
    tax: (motorPrice + 2500 - 546 - 400) * 0.13,
    total: (motorPrice + 2500 - 546 - 400) * 1.13,
  };
  
  const totals = computeTotals(data);
  
  const hasTradeIn = quoteData.boatInfo?.tradeIn?.hasTradeIn || false;
  const tradeInValue = quoteData.boatInfo?.tradeIn?.estimatedValue || 0;
  
  // Adjust for trade-in if present
  const subtotalAfterTrade = totals.subtotal - (hasTradeIn ? tradeInValue : 0);
  const hst = subtotalAfterTrade * 0.13;
  const totalCashPrice = subtotalAfterTrade + hst;

  const calculateTotalCost = () => {
    const monthlyPayment = calculateMonthlyPayment();
    return (monthlyPayment * quoteData.financing.term) + quoteData.financing.downPayment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!quoteData.motor || !user) return;

    setIsSubmitting(true);
    
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

      toast({
        title: "✅ Quote Submitted Successfully!",
        description: `Thank you for your interest in the Mercury ${quoteData.motor?.model}. We'll contact you as soon as possible to review your quote details, schedule your boat inspection, discuss installation requirements, and finalize your trade-in value (if applicable). You should receive an email with your quote PDF shortly.`,
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
      toast({
        title: "Error",
        description: "No motor selected for quote generation.",
        variant: "destructive"
      });
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
      
      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your professional quote.",
      });
      
      // Generate PDF using PDF.co API
      const pdfUrl = await generateQuotePDF(pdfData);
      
      // Download the PDF
      downloadPDF(pdfUrl, `Mercury-Quote-${quoteNumber}.pdf`);
      
      toast({
        title: "PDF Generated Successfully!",
        description: "Your professional quote has been downloaded.",
      });
      
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
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-light tracking-wide text-foreground">Submit Your Quote</h2>
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
                <div className="flex justify-between text-gray-700 text-sm font-light">
                  <span>Discount:</span>
                  <span>-${totals.discount.toLocaleString()}</span>
                </div>
              )}

              {totals.promoValue > 0 && (
                <div className="flex justify-between text-gray-700 text-sm font-light">
                  <span>Promo Value:</span>
                  <span>-${totals.promoValue.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between font-light">
                <span>Your Price:</span>
                <span className="font-medium">${totals.subtotal.toLocaleString()}</span>
              </div>

              {hasTradeIn && (
                <div className="flex justify-between text-gray-700 font-light">
                  <span className="text-muted-foreground">Trade-in Credit</span>
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
                <div className="bg-stone-50 dark:bg-stone-950/20 p-3 rounded-sm border border-gray-200">
                  <div className="text-gray-700 dark:text-gray-300 text-sm font-light">
                    You Save ${totals.savings.toLocaleString()}
                  </div>
                </div>
              )}

              {hasTradeIn && (
                <Alert className="border-gray-300 bg-stone-50 dark:bg-stone-950/20 rounded-sm">
                  <AlertDescription className="font-light text-muted-foreground">
                    Trade-in value will be assessed during consultation
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button onClick={generatePDF} variant="outline" className="w-full border-gray-900 text-gray-900 hover:bg-gray-50 rounded-sm font-light tracking-wide">
              <Download className="w-4 h-4 mr-2" />
              Download Quote PDF
            </Button>
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="p-6 border-gray-200 rounded-sm hover:border-gray-300 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-xl font-light tracking-wide">Contact Information</h3>
              <p className="text-muted-foreground font-light mt-2">We'll reach out as soon as possible to discuss your quote and schedule your consultation</p>
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
              <p className="text-xs text-muted-foreground font-light">Enter 10 digits (with or without formatting)</p>
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
              <p className="text-xs text-muted-foreground font-light">{contactInfo.notes.length}/500 characters</p>
            </div>

            <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-sm border border-gray-900 font-light tracking-wide" disabled={isSubmitting}>
              <Calendar className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving Quote...' : 'Generate Quote'}
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
              <p className="text-muted-foreground font-light">(905) 342-2153</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-700" />
            <div>
              <p className="font-light tracking-wide">Email</p>
              <p className="text-muted-foreground font-light">info@harrisboatworks.ca</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-700" />
            <div>
              <p className="font-light tracking-wide">Location</p>
              <p className="text-muted-foreground font-light">5369 Harris Boat Works Rd, Gores Landing, ON</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-stone-50 rounded-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-700 mt-0.5" />
            <div>
              <p className="font-light tracking-wide mb-2">What happens next?</p>
              <ul className="text-sm text-muted-foreground font-light space-y-1">
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