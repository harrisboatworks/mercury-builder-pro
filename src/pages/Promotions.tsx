import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { 
  Bell, ChevronRight, Calendar, Tag, Gift, Sparkles, Mail, MessageSquare,
  Award, Wrench, Waves, MapPin, Star, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { format } from 'date-fns';
import useEmblaCarousel from 'embla-carousel-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { CountdownTimer } from '@/components/ui/countdown-timer';
// Curated testimonials emphasizing loyalty and long-term relationships
const testimonials = [
  {
    quote: "My dad bought his first Merc from Harris in 1971. Still go there.",
    name: "Tony Russo",
    location: "Oshawa",
    rating: 5
  },
  {
    quote: "Drive past 3 dealers to get to Harris. Worth it.",
    name: "Derek Thompson",
    location: "Whitby",
    rating: 5
  },
  {
    quote: "Been dealing with Harris since the 80s. They know their stuff.",
    name: "Jim Crawford",
    location: "Peterborough",
    rating: 5
  },
  {
    quote: "Third generation buying from Harris. Reliable and honest service.",
    name: "Rob Peterson",
    location: "Cobourg",
    rating: 5
  },
  {
    quote: "Harris treats customers like family. Been going there for 20 years.",
    name: "Linda Davies",
    location: "Bowmanville",
    rating: 5
  }
];

const csiAwardBadge = "/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png";

const whyBuyReasons = [
  {
    icon: null,
    useCsiLogo: true,
    title: "CSI Award-Winning Service",
    description: "Mercury's highest honor for customer satisfaction — earned, not given"
  },
  {
    icon: Calendar,
    title: "Serving Boaters Since 1947",
    description: "78 years of family-owned marine expertise on Rice Lake"
  },
  {
    icon: null,
    useMercuryLogo: true,
    title: "Mercury Dealer Since 1965",
    description: "60 years as an authorized Mercury dealer and service center"
  },
  {
    icon: Wrench,
    title: "Factory-Certified Installation",
    description: "Master-level Mercury technicians ensure your motor runs perfectly"
  },
  {
    icon: Waves,
    title: "Water Testing Included",
    description: "Every repower is tested and tuned on the water, not just on paper"
  },
  {
    icon: MapPin,
    title: "Worth the Drive",
    description: "Customers drive past other dealers because we do it right"
  }
];

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
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'both'>('email');
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

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handleGeneralSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (channel === 'email' && !email) {
      toast.error('Please enter an email address');
      return;
    }
    if (channel === 'sms' && !phone) {
      toast.error('Please enter a phone number');
      return;
    }
    if (channel === 'both' && (!email || !phone)) {
      toast.error('Please enter both email and phone number');
      return;
    }

    setSubscribing(true);
    try {
      const { error } = await supabase.functions.invoke('subscribe-promo-reminder', {
        body: {
          customerEmail: email || null,
          customerPhone: phone || null,
          customerName: null,
          preferredChannel: channel,
          motorModelId: null,
          motorDetails: null,
          quoteConfig: null
        }
      });

      if (error) throw error;
      toast.success('You\'re subscribed! We\'ll notify you of future promotions.');
      setEmail('');
      setPhone('');
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

  // Testimonials Carousel Component
  const TestimonialsSection = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
      if (!emblaApi) return;
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
      if (!emblaApi) return;
      emblaApi.on('select', onSelect);
      
      // Auto-rotate every 6 seconds
      const interval = setInterval(() => {
        emblaApi.scrollNext();
      }, 6000);

      return () => {
        emblaApi.off('select', onSelect);
        clearInterval(interval);
      };
    }, [emblaApi, onSelect]);

    return (
      <section className="bg-stone-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-12">
            What Our Customers Say
          </h2>
          
          <div className="relative">
            {/* Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={index}
                    className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0"
                  >
                    <div className="bg-white rounded-xl border border-border p-6 h-full">
                      {/* Stars */}
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      
                      {/* Quote */}
                      <p className="text-foreground mb-4 italic">
                        "{testimonial.quote}"
                      </p>
                      
                      {/* Author */}
                      <div className="text-sm mb-3">
                        <span className="font-medium text-foreground">{testimonial.name}</span>
                        <span className="text-muted-foreground"> — {testimonial.location}</span>
                      </div>
                      
                      {/* Mercury Owner Badge */}
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <img src={mercuryLogo} alt="Mercury" className="h-4" />
                        <span className="text-xs text-muted-foreground">Mercury Owner</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full border border-border shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full border border-border shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  selectedIndex === index ? 'bg-foreground' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <LuxuryHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-stone-50 to-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-10" />
            <span className="text-sm text-muted-foreground font-medium">Official Mercury Promotions</span>
          </div>
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
                    
                    {/* Countdown Timer */}
                    {promo.end_date && (
                      <div className="space-y-2">
                        <CountdownTimer endDate={promo.end_date} />
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Ends {format(new Date(promo.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
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

      {/* Testimonials Carousel */}
      <TestimonialsSection />

      {/* Why Buy from Harris */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-12">
          Why Buy from Harris Boat Works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyBuyReasons.map((reason, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              {reason.useCsiLogo ? (
                <div className="h-10 md:h-12 flex items-center mb-4">
                  <img src={csiAwardBadge} alt="Mercury CSI Award" className="h-8 md:h-10" />
                </div>
              ) : reason.useMercuryLogo ? (
                <div className="h-10 md:h-12 flex items-center mb-4">
                  <img src={mercuryLogo} alt="Mercury Marine" className="h-6 md:h-8" />
                </div>
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  {reason.icon && <reason.icon className="w-5 h-5 md:w-6 md:h-6 text-foreground" />}
                </div>
              )}
              <h3 className="font-semibold text-foreground mb-2">{reason.title}</h3>
              <p className="text-sm text-muted-foreground">{reason.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-stone-50 py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2 mb-6">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-8" />
            <span className="text-xs text-muted-foreground">Authorized Mercury Dealer</span>
          </div>
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Get Notified of Future Sales
          </h2>
          <p className="text-muted-foreground mb-6">
            Be the first to know when we launch new promotions. No spam, just savings.
          </p>
          
          <form onSubmit={handleGeneralSubscribe} className="max-w-md mx-auto space-y-4">
            {/* Channel Toggle */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-left block">How should we notify you?</Label>
              <RadioGroup
                value={channel}
                onValueChange={(v) => setChannel(v as 'email' | 'sms' | 'both')}
                className="flex gap-2"
              >
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    channel === 'email' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <RadioGroupItem value="email" id="general-email-option" className="sr-only" />
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">Email</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    channel === 'sms' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <RadioGroupItem value="sms" id="general-sms-option" className="sr-only" />
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Text</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    channel === 'both' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <RadioGroupItem value="both" id="general-both-option" className="sr-only" />
                  <span className="text-sm font-medium">Both</span>
                </label>
              </RadioGroup>
            </div>

            {/* Email Input */}
            {(channel === 'email' || channel === 'both') && (
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={channel === 'email' || channel === 'both'}
                className="bg-white"
              />
            )}

            {/* Phone Input */}
            {(channel === 'sms' || channel === 'both') && (
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                required={channel === 'sms' || channel === 'both'}
                className="bg-white"
              />
            )}

            <Button type="submit" disabled={subscribing} className="w-full">
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
