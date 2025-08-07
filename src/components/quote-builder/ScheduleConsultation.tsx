import { useState } from 'react';
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
    preferredTime: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    try {
      const validationData = {
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        preferredTime: contactInfo.preferredTime || 'No preference'
      };
      contactInfoSchema.parse(validationData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const calculateMonthlyPayment = () => {
    if (!quoteData.motor) return 0;
    const principal = quoteData.motor.price - quoteData.financing.downPayment;
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
      const sanitizedContactInfo = {
        name: sanitizeInput(contactInfo.name),
        email: sanitizeInput(contactInfo.email),
        phone: sanitizeInput(contactInfo.phone),
        preferredTime: sanitizeInput(contactInfo.preferredTime || 'No preference'),
        notes: sanitizeInput(contactInfo.notes)
      };

      const { error } = await supabase
        .from('customer_quotes')
        .insert({
          user_id: user.id,
          base_price: quoteData.motor.price,
          final_price: quoteData.motor.price - quoteData.financing.downPayment,
          deposit_amount: quoteData.financing.downPayment,
          loan_amount: quoteData.motor.price - quoteData.financing.downPayment,
          monthly_payment: calculateMonthlyPayment(),
          term_months: quoteData.financing.term,
          total_cost: calculateTotalCost(),
          customer_name: sanitizedContactInfo.name,
          customer_email: sanitizedContactInfo.email,
          customer_phone: sanitizedContactInfo.phone
        });

      if (error) throw error;

      toast({
        title: "Quote Saved Successfully!",
        description: "Your quote has been saved and we'll contact you soon to schedule your consultation.",
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
    const sanitizedValue = field === 'phone' ? formatPhoneNumber(value) : value;
    setContactInfo(prev => ({ ...prev, [field]: sanitizedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generatePDF = () => {
    toast({
      title: "PDF Generation",
      description: "PDF generation will be available after consultation scheduling.",
    });
  };

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
                <Alert className="border-on-order bg-on-order/10">
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
            <h3 className="text-xl font-semibold">Contact Information</h3>
            
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
                placeholder="(555) 123-4567"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Consultation Time</Label>
              <Select value={contactInfo.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                <SelectTrigger className={errors.preferredTime ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select your preferred time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday-morning">Weekday Morning (9 AM - 12 PM)</SelectItem>
                  <SelectItem value="weekday-afternoon">Weekday Afternoon (1 PM - 5 PM)</SelectItem>
                  <SelectItem value="saturday-morning">Saturday Morning (9 AM - 12 PM)</SelectItem>
                  <SelectItem value="saturday-afternoon">Saturday Afternoon (1 PM - 5 PM)</SelectItem>
                  <SelectItem value="flexible">I'm flexible</SelectItem>
                </SelectContent>
              </Select>
              {errors.preferredTime && (
                <p className="text-sm text-destructive">{errors.preferredTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
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
              {isSubmitting ? 'Saving Quote...' : 'Schedule Consultation'}
            </Button>
          </form>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Harris Boat Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-muted-foreground">(555) 123-4567</p>
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
              <p className="text-muted-foreground">Marina Drive, ON</p>
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
          Back to Quote
        </Button>
      </div>
    </div>
  );
};