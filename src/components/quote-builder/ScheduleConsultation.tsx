import { useState, useEffect, useMemo } from 'react';
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
import { z } from 'zod';

interface ScheduleConsultationProps {
  quoteData: QuoteData;
  onBack: () => void;
}

export const ScheduleConsultation = ({ quoteData, onBack }: ScheduleConsultationProps) => {
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
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);

  // Load Calendly widget
  useEffect(() => {
    // Load Calendly CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(link);

    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => setCalendlyLoaded(true);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      const existingLink = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

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
    const principal = (quoteData.motor.salePrice ?? quoteData.motor.basePrice ?? quoteData.motor.price) - quoteData.financing.downPayment;
    const monthlyRate = quoteData.financing.rate / 100 / 12;
    const numPayments = quoteData.financing.term;
    
    if (principal <= 0) return 0;
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

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
          base_price: (quoteData.motor.salePrice ?? quoteData.motor.basePrice ?? quoteData.motor.price),
          final_price: (quoteData.motor.salePrice ?? quoteData.motor.basePrice ?? quoteData.motor.price) - quoteData.financing.downPayment,
          deposit_amount: quoteData.financing.downPayment,
          loan_amount: (quoteData.motor.salePrice ?? quoteData.motor.basePrice ?? quoteData.motor.price) - quoteData.financing.downPayment,
          monthly_payment: calculateMonthlyPayment(),
          term_months: quoteData.financing.term,
          total_cost: calculateTotalCost(),
          customer_name: sanitizedContactInfo.name,
          customer_email: sanitizedContactInfo.email,
          customer_phone: sanitizedContactInfo.phone,
          contact_method: sanitizedContactInfo.contactMethod,
          notes: sanitizedContactInfo.notes,
          // New trade-in penalty audit fields
          tradein_value_pre_penalty: quoteData.boatInfo?.tradeIn?.tradeinValuePrePenalty ?? null,
          tradein_value_final: quoteData.boatInfo?.tradeIn?.tradeinValueFinal ?? quoteData.boatInfo?.tradeIn?.estimatedValue ?? null,
          penalty_applied: Boolean(quoteData.boatInfo?.tradeIn?.penaltyApplied),
          penalty_factor: quoteData.boatInfo?.tradeIn?.penaltyFactor ?? null,
          penalty_reason: (quoteData.boatInfo?.tradeIn?.penaltyApplied ? 'brand_out_of_business' : null)
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

  const generatePDF = () => {
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
      
      import('@/lib/pdf-generator').then(({ generateQuotePDF }) => {
        const pdfData = {
          ...quoteData,
          customerName: contactInfo.name || 'Valued Customer',
          customerEmail: contactInfo.email || user?.email || '',
          customerPhone: contactInfo.phone || '',
          quoteNumber,
          tradeInValue: quoteData.boatInfo?.tradeIn?.estimatedValue || 0
        };
        
        generateQuotePDF(pdfData)
          .then((pdf) => {
            // Download the PDF
            pdf.save(`Mercury-Quote-${quoteNumber}.pdf`);
            
            toast({
              title: "PDF Generated Successfully!",
              description: "Your professional quote has been downloaded.",
            });
          })
          .catch(() => {
            toast({
              title: "PDF Generation Error",
              description: "Failed to generate PDF. Please try again.",
              variant: "destructive"
            });
          });
      });
    } catch (error) {
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const calendlyUrl = useMemo(() => {
    const base = 'https://calendly.com/harrisboatworks/sales';
    const name = contactInfo.name || '';
    const email = contactInfo.email || '';

    const motor = quoteData.motor;
    const motorDetails = motor ? `${motor.model} | ${motor.hp}HP${motor.specs ? ' | ' + motor.specs : ''}` : 'No motor selected';

    const trade = quoteData.boatInfo?.tradeIn;
    const tradeDetails = trade?.hasTradeIn
      ? `${trade.year || ''} ${trade.brand || ''} ${trade.horsepower ? trade.horsepower + 'HP' : ''} | Condition: ${trade.condition || ''} | Est: ${trade?.estimatedValue != null ? '$' + trade.estimatedValue : 'N/A'}`
      : 'No trade-in';

    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (email) params.set('email', email);
    params.set('a1', motorDetails);
    params.set('a2', tradeDetails);
    params.set('a3', `Preferred contact: ${contactInfo.contactMethod}`);
    if (contactInfo.notes) params.set('a4', contactInfo.notes);

    return `${base}?${params.toString()}`;
  }, [contactInfo, quoteData]);

  useEffect(() => {
    if (!calendlyLoaded) return;
    const el = document.querySelector('.calendly-inline-widget');
    const Calendly = (window as any).Calendly;
    if (el && Calendly?.initInlineWidget) {
      Calendly.initInlineWidget({ url: calendlyUrl, parentElement: el as HTMLElement });
    }
  }, [calendlyLoaded, calendlyUrl]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Schedule Your Consultation</h2>
        <p className="text-lg text-muted-foreground">
          Let's finalize the details and get your new Mercury outboard installed!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quote Summary */}
        <Card className="p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Quote Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{quoteData.motor?.model}</h4>
                  <p className="text-sm text-muted-foreground">{quoteData.motor?.hp}HP</p>
                </div>
                <p className="font-semibold">${quoteData.motor?.price.toLocaleString()}</p>
              </div>

              {quoteData.financing.downPayment > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Down Payment</span>
                  <span>-${quoteData.financing.downPayment.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Financed Amount</span>
                  <span>${((quoteData.motor?.price || 0) - quoteData.financing.downPayment).toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {quoteData.financing.term} months at {quoteData.financing.rate}% APR
                </p>
              </div>

              {quoteData.hasTradein && (
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <AlertDescription>
                    Trade-in value will be assessed during consultation
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button onClick={generatePDF} variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Quote PDF
            </Button>
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">Contact Information</h3>
              <p className="text-muted-foreground mt-2">We'll reach out as soon as possible to discuss your quote and schedule your consultation.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={contactInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(705) 555-1234"
                className={errors.phone ? 'border-destructive' : ''}
                maxLength={14}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
              <p className="text-xs text-muted-foreground">Enter 10 digits (with or without formatting)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactMethod">Preferred Contact Method *</Label>
              <Select value={contactInfo.contactMethod} onValueChange={(value) => handleInputChange('contactMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How would you like us to contact you?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Comments (Optional)</Label>
              <Textarea
                id="notes"
                value={contactInfo.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about your boat or installation requirements"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{contactInfo.notes.length}/500 characters</p>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              <Calendar className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving Quote...' : 'Generate Quote'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Calendly Integration */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Your Consultation
          </h3>
          <p className="text-muted-foreground">
            Book a time that works for you to review your quote and discuss installation details.
          </p>
          
          {calendlyLoaded ? (
            <div 
              className="calendly-inline-widget" 
              data-url={calendlyUrl}
              style={{ minWidth: '320px', height: '630px' }}
              key={calendlyUrl}
            ></div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
              <div className="text-center space-y-2">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
                <p className="text-muted-foreground">Loading scheduling calendar...</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Harris Boat Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-muted-foreground">(905) 342-2153</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">info@harrisboatworks.ca</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">5369 Harris Boat Works Rd, Gores Landing, ON</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-2">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
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
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quote Review
        </Button>
      </div>
    </div>
  );
};