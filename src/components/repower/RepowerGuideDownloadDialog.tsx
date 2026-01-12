import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Check, BookOpen, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface RepowerGuideDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const guideHighlights = [
  'When repowering makes financial sense',
  'Transparent pricing breakdown by HP',
  'The 4-step Harris repower process',
  'Pro tips to maximize value',
];

export function RepowerGuideDownloadDialog({ open, onOpenChange }: RepowerGuideDownloadDialogProps) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hasBoat, setHasBoat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the edge function to save lead and send email
      const { data, error } = await supabase.functions.invoke('send-repower-guide-email', {
        body: {
          email,
          name: name || undefined,
          phone: phone || undefined,
          hasBoatToRepower: hasBoat,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Check your email for the guide!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadNow = () => {
    // Direct download link
    window.open('https://www.dropbox.com/scl/fi/y62hund2y8bewio56nwhx/Cottage_Boat_Repower_Guide.pdf?rlkey=b25z6yoys2f8squm23byop4rg&dl=1', '_blank');
    onOpenChange(false);
    setIsSuccess(false);
    setEmail('');
    setName('');
    setPhone('');
    setHasBoat(false);
  };

  const resetAndClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setIsSuccess(false);
      setEmail('');
      setName('');
      setPhone('');
      setHasBoat(false);
    }, 300);
  };

  // Shared header content for form state
  const formHeader = (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <BookOpen className="w-6 h-6 text-primary" />
      </div>
      <div>
        <div className="text-xl font-semibold">Download Your Free Guide</div>
        <div className="text-sm text-muted-foreground">
          The Complete Cottage Repower Guide
        </div>
      </div>
    </div>
  );

  // Shared highlights section
  const highlightsSection = (
    <div className="bg-muted/50 rounded-lg p-4 mb-4">
      <p className="text-sm font-medium mb-2">This 15-page guide covers:</p>
      <ul className="space-y-1.5">
        {guideHighlights.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  // Shared form content
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="hasBoat"
          checked={hasBoat}
          onCheckedChange={(checked) => setHasBoat(checked === true)}
        />
        <Label htmlFor="hasBoat" className="text-sm cursor-pointer leading-tight">
          I have a boat I'm considering repowering
        </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={resetAndClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Get the Guide
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" />
        We respect your privacy. No spam, ever.
      </p>
    </form>
  );

  // Shared success content
  const successContent = (
    <div className="text-center py-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <div className="text-xl font-semibold mb-2">Check Your Email!</div>
      <p className="text-muted-foreground mb-6">
        We've sent the guide to <strong>{email}</strong>. 
        You can also download it directly below.
      </p>
      <div className="space-y-3">
        <Button onClick={handleDownloadNow} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Download Now
        </Button>
        <Button variant="outline" onClick={resetAndClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );

  // Mobile: Bottom drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={resetAndClose}>
        <DrawerContent className="px-4 pb-8">
          {!isSuccess ? (
            <>
              <DrawerHeader className="text-left px-0">
                {formHeader}
              </DrawerHeader>
              {highlightsSection}
              {formContent}
            </>
          ) : (
            successContent
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered dialog
  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              {formHeader}
            </DialogHeader>
            {highlightsSection}
            {formContent}
          </>
        ) : (
          successContent
        )}
      </DialogContent>
    </Dialog>
  );
}
