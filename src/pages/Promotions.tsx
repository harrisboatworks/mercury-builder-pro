import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { Bell, ChevronRight, Calendar, Tag, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Promotion {
  id: string;
  name: string;
  bonus_title: string | null;
  bonus_description: string | null;
  bonus_short_badge: string | null;
  discount_percentage: number;
  discount_fixed_amount: number;
  warranty_extra_years: number | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  terms_url: string | null;
  is_active: boolean;
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('priority', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubscribing(true);
    try {
      const { error } = await supabase.functions.invoke('subscribe-promo-reminder', {
        body: {
          email,
          name: '',
          channel: 'email',
          motorId: null, // General subscription
          motorDetails: null,
          quoteConfig: null
        }
      });

      if (error) throw error;
      toast.success('You\'re subscribed! We\'ll notify you of future promotions.');
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="min-h-screen bg-background">
      <LuxuryHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-50 to-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Limited Time Offers
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Current Promotions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take advantage of exclusive savings on Mercury outboard motors. These offers won't last forever.
          </p>
        </div>
      </section>

      {/* Promotions Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : promotions.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {promotions.map((promo) => {
              const daysRemaining = promo.end_date ? getDaysRemaining(promo.end_date) : null;
              
              return (
                <div
                  key={promo.id}
                  className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Promo Image */}
                  {promo.image_url && (
                    <div className="aspect-[2/1] bg-stone-100">
                      <img
                        src={promo.image_url}
                        alt={promo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6 space-y-4">
                    {/* Badge */}
                    {promo.bonus_short_badge && (
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <Gift className="w-3.5 h-3.5" />
                        {promo.bonus_short_badge}
                      </span>
                    )}
                    
                    {/* Title */}
                    <h2 className="text-xl font-semibold text-foreground">
                      {promo.bonus_title || promo.name}
                    </h2>
                    
                    {/* Description */}
                    {promo.bonus_description && (
                      <p className="text-muted-foreground">
                        {promo.bonus_description}
                      </p>
                    )}
                    
                    {/* Offer Details */}
                    <div className="flex flex-wrap gap-3 text-sm">
                      {promo.warranty_extra_years && promo.warranty_extra_years > 0 && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Tag className="w-4 h-4" />
                          +{promo.warranty_extra_years} Year{promo.warranty_extra_years > 1 ? 's' : ''} Warranty
                        </span>
                      )}
                      {promo.discount_percentage > 0 && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Tag className="w-4 h-4" />
                          {promo.discount_percentage}% Off
                        </span>
                      )}
                      {promo.discount_fixed_amount > 0 && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Tag className="w-4 h-4" />
                          ${promo.discount_fixed_amount} Off
                        </span>
                      )}
                    </div>
                    
                    {/* Expiry */}
                    {promo.end_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Ends {format(new Date(promo.end_date), 'MMM d, yyyy')}
                        </span>
                        {daysRemaining !== null && daysRemaining <= 14 && (
                          <span className="text-red-600 font-medium">
                            ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                      <Link to="/">
                        <Button variant="outline" className="gap-2">
                          View Eligible Motors
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      {promo.terms_url && (
                        <a 
                          href={promo.terms_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                          Terms & Conditions
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Active Promotions
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Check back soon! We regularly offer special promotions and savings on Mercury outboard motors.
            </p>
            <Link to="/">
              <Button variant="outline">
                Browse All Motors
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Newsletter Signup */}
      <section className="bg-stone-50 py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Get Notified of Future Sales
          </h2>
          <p className="text-muted-foreground mb-6">
            Be the first to know when we launch new promotions. No spam, just savings.
          </p>
          <form onSubmit={handleGeneralSubscribe} className="flex gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={subscribing}>
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            You can unsubscribe at any time. We respect your privacy.
          </p>
        </div>
      </section>
    </div>
  );
}
