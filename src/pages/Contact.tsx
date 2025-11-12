import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { COMPANY_INFO } from '@/lib/companyInfo';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Zap, 
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  MessageCircle
} from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  inquiry_type: z.string().min(1, 'Please select an inquiry type'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferred_contact_method: z.string(),
  urgency_level: z.string(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const inquiryTypes = [
  { value: 'general', label: 'General Inquiry', icon: MessageCircle },
  { value: 'sales', label: 'Sales & Pricing', icon: Phone },
  { value: 'service', label: 'Service & Repairs', icon: AlertCircle },
  { value: 'parts', label: 'Parts & Accessories', icon: CheckCircle2 },
  { value: 'quote', label: 'Custom Quote Request', icon: MessageSquare },
  { value: 'warranty', label: 'Warranty Support', icon: Zap },
];

export default function Contact() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: user?.user_metadata?.full_name || '',
      email: user?.email || '',
      preferred_contact_method: 'email',
      urgency_level: 'normal',
    },
  });

  const watchedValues = watch();
  const selectedInquiryType = inquiryTypes.find(type => type.value === watchedValues.inquiry_type);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('send-contact-inquiry', {
        body: data
      });

      if (error) throw error;

      if (result.success) {
        setSubmitted(true);
        toast.success('Inquiry submitted successfully!', {
          description: `We'll respond within ${result.estimated_response_time}`
        });
        reset();
      } else {
        throw new Error(result.error || 'Failed to submit inquiry');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to submit inquiry', {
        description: 'Please try again or contact us directly'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Thank You!</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Your inquiry has been submitted successfully. We'll get back to you soon!
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Submit Another Inquiry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Get In Touch</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Have questions about our motors, need a custom quote, or require service support? 
            We're here to help you get back on the water.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Contact Form
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Basic Info */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            placeholder="Your full name"
                            {...register('name')}
                            className={errors.name ? 'border-destructive' : ''}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            {...register('email')}
                            className={errors.email ? 'border-destructive' : ''}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(905) 555-0123"
                          {...register('phone')}
                        />
                      </div>

                      <div>
                        <Label>What can we help you with? *</Label>
                        <div className="grid md:grid-cols-2 gap-3 mt-3">
                          {inquiryTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <Card
                                key={type.value}
                                className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${
                                  watchedValues.inquiry_type === type.value
                                    ? 'ring-2 ring-primary bg-primary/5'
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => setValue('inquiry_type', type.value)}
                              >
                                <CardContent className="p-4 flex items-center gap-3">
                                  <Icon className="w-5 h-5 text-primary" />
                                  <span className="text-sm font-medium">{type.label}</span>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                        {errors.inquiry_type && (
                          <p className="text-sm text-destructive mt-1">{errors.inquiry_type.message}</p>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!watchedValues.name || !watchedValues.email || !watchedValues.inquiry_type}
                        className="w-full"
                      >
                        Continue
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Message & Preferences */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <User className="w-4 h-4" />
                        {watchedValues.name} • {selectedInquiryType?.label}
                      </div>

                      <div>
                        <Label htmlFor="message">Your Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Please provide details about your inquiry..."
                          rows={5}
                          {...register('message')}
                          className={errors.message ? 'border-destructive' : ''}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
                        )}
                      </div>

                      <div>
                        <Label>How would you prefer we contact you?</Label>
                        <RadioGroup
                          value={watchedValues.preferred_contact_method}
                          onValueChange={(value) => setValue('preferred_contact_method', value)}
                          className="mt-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="email" id="email-contact" />
                            <Label htmlFor="email-contact" className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email (Recommended)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="phone" id="phone-contact" />
                            <Label htmlFor="phone-contact" className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone Call
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sms" id="sms-contact" />
                            <Label htmlFor="sms-contact" className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Text Message
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label>How urgent is this inquiry?</Label>
                        <RadioGroup
                          value={watchedValues.urgency_level}
                          onValueChange={(value) => setValue('urgency_level', value)}
                          className="mt-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="normal" id="normal-urgency" />
                            <Label htmlFor="normal-urgency">
                              Normal <span className="text-muted-foreground text-sm">(24 hour response)</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="urgent" id="urgent-urgency" />
                            <Label htmlFor="urgent-urgency" className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-orange-500" />
                              Urgent <span className="text-muted-foreground text-sm">(2-4 hour response)</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Inquiry
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{COMPANY_INFO.contact.phone}</p>
                    <p className="text-sm text-muted-foreground">Monday - Saturday, 8 AM - 5 PM</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{COMPANY_INFO.contact.email}</p>
                    <p className="text-sm text-muted-foreground">We respond within 24 hours</p>
                  </div>
                </div>
                
                <Separator />
                
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=5369+Harris+Boat+Works+Rd,+Gores+Landing,+ON+K0K+2E0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors cursor-pointer group"
                >
                  <MapPin className="w-5 h-5 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">Visit Our Location</p>
                    <p className="text-sm text-muted-foreground">{COMPANY_INFO.address.full}</p>
                    <p className="text-xs text-primary mt-1">Get Directions →</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Normal Inquiries</span>
                  <Badge variant="secondary">24 hours</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Urgent Requests</span>
                  <Badge variant="destructive">2-4 hours</Badge>
                </div>
                
                <Separator className="my-4" />
                
                <a 
                  href="http://hbw.wiki/service" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full" variant="default">
                    Schedule Service
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Need immediate help?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Call us directly at {COMPANY_INFO.contact.phone} for urgent service needs or emergency support.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}