import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Download, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { QuoteData } from '../QuoteBuilder';

interface ScheduleConsultationProps {
  quoteData: QuoteData;
  onBack: () => void;
}

export const ScheduleConsultation = ({ quoteData, onBack }: ScheduleConsultationProps) => {
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredTime: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real implementation, this would save to database and send notifications
    console.log('Quote submitted:', { quoteData, contactInfo });
  };

  const generatePDF = () => {
    // In real implementation, this would generate a PDF with current inventory data
    console.log('Generating PDF for:', quoteData);
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={contactInfo.firstName}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={contactInfo.lastName}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Consultation Time</Label>
              <Input
                id="preferredTime"
                value={contactInfo.preferredTime}
                onChange={(e) => setContactInfo(prev => ({ ...prev, preferredTime: e.target.value }))}
                placeholder="e.g., Weekday mornings, Saturday afternoons"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={contactInfo.notes}
                onChange={(e) => setContactInfo(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information about your boat or installation requirements"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Consultation
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