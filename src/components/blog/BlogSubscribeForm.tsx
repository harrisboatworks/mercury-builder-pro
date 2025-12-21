import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2, Rss, CheckCircle } from 'lucide-react';

export function BlogSubscribeForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('subscribe-blog', {
        body: { email, name: name || undefined }
      });

      if (error) throw error;

      if (data.alreadySubscribed) {
        toast.info("You're already subscribed!");
      } else if (data.reactivated) {
        toast.success('Welcome back! Your subscription has been reactivated.');
        setIsSubscribed(true);
      } else {
        toast.success('Successfully subscribed! Check your email for confirmation.');
        setIsSubscribed(true);
      }

      setEmail('');
      setName('');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-medium text-foreground mb-2">
          You're Subscribed!
        </h3>
        <p className="text-muted-foreground">
          We'll notify you when new articles are published.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
      <div className="max-w-xl mx-auto text-center">
        <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-light text-foreground mb-2">
          Stay Updated
        </h3>
        <p className="text-muted-foreground mb-6">
          Get notified when we publish new guides, tips, and industry insights. 
          No spam, unsubscribe anytime.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="subscribe-email" className="sr-only">Email address</Label>
              <Input
                id="subscribe-email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="sm:w-40">
              <Label htmlFor="subscribe-name" className="sr-only">Name (optional)</Label>
              <Input
                id="subscribe-name"
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full sm:w-auto px-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <a 
            href="/rss.xml" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Rss className="h-4 w-4" />
            Subscribe via RSS
          </a>
        </div>
      </div>
    </div>
  );
}
