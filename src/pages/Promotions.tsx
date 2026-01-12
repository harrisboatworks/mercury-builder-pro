import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { 
  Bell, ChevronRight, Calendar, Tag, Gift, Sparkles, Mail, MessageSquare,
  Award, Wrench, Waves, MapPin, Star, ChevronLeft, BadgeCheck, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import useEmblaCarousel from 'embla-carousel-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { generateDailyTestimonials, generateReviewCount } from '@/lib/activityGenerator';
import { allTestimonials } from '@/lib/testimonialData';
import { PromotionsPageSEO } from '@/components/seo/PromotionsPageSEO';
import { PromotionHero } from '@/components/promotions/PromotionHero';
import { ChooseOneSection } from '@/components/promotions/ChooseOneSection';
import { RebateMatrix } from '@/components/promotions/RebateMatrix';

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
  promo_options?: any;
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

  // Find the main "Get 7 + Choose One" promotion
  const mainPromotion = promotions.find(p => p.promo_options?.type === 'choose_one');
  const chooseOneOptions = mainPromotion?.promo_options?.options || [];

  // Get rebate matrix for the full table display
  const rebateMatrix = chooseOneOptions.find((o: any) => o.id === 'cash_rebate')?.matrix || [];

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
    
    const dailyTestimonials = useMemo(() => 
      generateDailyTestimonials(allTestimonials, 6), 
      []
    );
    const reviewCount = useMemo(() => generateReviewCount(), []);

    return (
      <section className="bg-stone-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
              What Our Customers Say
            </h2>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">{reviewCount}+</span> five-star reviews from Ontario boaters
            </p>
          </div>
          
          <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-6">
                {dailyTestimonials.map((testimonial, index) => (
                  <div 
                    key={index}
                    className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0"
                  >
                    <div className="bg-white rounded-xl border border-border p-6 h-full">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      
                      <p className="text-foreground mb-4 italic">
                        "{testimonial.quote}"
                      </p>
                      
                      <div className="text-sm">
                        <span className="font-medium text-foreground">{testimonial.name}</span>
                        <span className="text-muted-foreground"> — {testimonial.location}</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                        {testimonial.dateLabel}
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <img src={mercuryLogo} alt="Mercury" className="h-4" />
                          <span className="text-xs text-muted-foreground">Mercury Owner</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

          <div className="flex justify-center gap-2 mt-6">
            {dailyTestimonials.map((_, index) => (
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

  const promotionFaqs = [
    { 
      question: "What is the Mercury Get 7 + Choose One promotion?", 
      answer: "This promotion gives you 7 years of factory warranty coverage (3 years standard + 4 years FREE extension) on qualifying Mercury outboard motors. PLUS, you choose one additional bonus: 6 months no payments, special financing rates as low as 2.99% APR, OR a factory rebate up to $1,000 based on your motor's horsepower." 
    },
    { 
      question: "How do I choose my bonus?", 
      answer: "When you finalize your purchase with us, our sales team will help you select the bonus option that works best for your situation. All three options provide great value — it just depends on whether you prefer deferred payments, lower monthly payments with promotional rates, or cash back." 
    },
    { 
      question: "Can I combine the warranty with all three bonuses?", 
      answer: "No, you get to choose ONE of the three bonuses (no payments, special financing, or rebate) in addition to the 7-year warranty. However, the 7-year warranty is included with ALL options automatically." 
    },
    { 
      question: "What is the minimum for special financing rates?", 
      answer: "The special promotional financing rates (2.99% for 24 months, 3.99% for 36 months, 4.49% for 48 months, 5.49% for 60 months) require a minimum financed amount of $5,000. Credit approval required." 
    },
    { 
      question: "How much is the factory rebate for my motor?", 
      answer: "Rebates range from $100 to $1,000 based on horsepower: 2.5-6HP ($100), 8-20HP ($250), 25HP ($300), 30-60HP ($350), 65-75HP ($400), 80-115HP ($500), 150-200HP ($650), 225-425HP ($1,000)." 
    },
    { 
      question: "When does this promotion end?", 
      answer: "The Mercury Get 7 + Choose One promotion runs from January 12, 2026 through March 31, 2026. Don't wait — build your quote today to lock in these savings!" 
    },
    { 
      question: "Does this apply to repower installations?", 
      answer: "Yes! This promotion applies to both new boat packages and repower installations. Our Certified Repower Center can help you maximize savings on your engine replacement project." 
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PromotionsPageSEO promotions={promotions} />
      <LuxuryHeader />
      
      {/* Hero Section */}
      <PromotionHero endDate={mainPromotion?.end_date} />

      {/* Choose One Section */}
      {chooseOneOptions.length > 0 && (
        <ChooseOneSection options={chooseOneOptions} />
      )}

      {/* Full Rebate Matrix Table */}
      {rebateMatrix.length > 0 && (
        <section className="bg-stone-50 py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                Factory Rebate by Horsepower
              </h2>
              <p className="text-muted-foreground">
                If you choose the rebate option, here's what you'll get based on your motor
              </p>
            </div>
            <RebateMatrix matrix={rebateMatrix} />
            <p className="text-center text-sm text-muted-foreground mt-4">
              Rebate applied at time of purchase. See dealer for complete details.
            </p>
          </div>
        </section>
      )}

      {/* Loading state for other promotions */}
      {loading && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-4">
          Promotion FAQs
        </h2>
        <p className="text-muted-foreground text-center mb-10">
          Common questions about the Mercury Get 7 + Choose One promotion.
        </p>
        <Accordion type="single" collapsible className="space-y-3">
          {promotionFaqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`} className="bg-white rounded-lg border-0 shadow-sm px-6">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium text-foreground">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
