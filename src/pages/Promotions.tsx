import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RepowerHeader } from '@/components/repower/RepowerHeader';
import { SiteFooter } from '@/components/ui/site-footer';
import { 
  Bell, ChevronRight, Calendar, Tag, Gift, Sparkles, Mail, MessageSquare,
  Award, Wrench, Waves, MapPin, Star, ChevronLeft, ChevronDown, BadgeCheck, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import useEmblaCarousel from 'embla-carousel-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { generateDailyTestimonials } from '@/lib/activityGenerator';
import { useGoogleReviewStats } from '@/hooks/useGoogleReviewStats';
import { allTestimonials } from '@/lib/testimonialData';
import { PromotionsPageSEO } from '@/components/seo/PromotionsPageSEO';
import { PromotionHero } from '@/components/promotions/PromotionHero';
import { ChooseOneSection } from '@/components/promotions/ChooseOneSection';
import { RebateMatrix } from '@/components/promotions/RebateMatrix';
import { RebateCalculator } from '@/components/promotions/RebateCalculator';
import { TDAlwaysOnCard, isTDAlwaysOnActive } from '@/components/promotions/TDAlwaysOnOffer';
import { TDRateCardImage } from '@/components/promotions/TDRateCardImage';

const TD_RATE_CARD_IMAGE = '/lovable-uploads/td-financing-2026-rate-card.jpg';
const TD_RATE_CARD_ALT =
  'Mercury TD Always On financing offer: 5.48% APR up to 240-month amortization through December 31, 2026';

const csiAwardBadge = "/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png";

const whyBuyReasons = [
  {
    icon: null,
    useCsiLogo: true,
    title: "CSI Award-Winning Service",
    description: "Mercury's highest honor for customer satisfaction, earned, not given"
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

  // Find the main promotion, prefer "choose one" type, fall back to first active
  const mainPromotion = promotions.find(p => p.promo_options?.type === 'choose_one') || promotions[0] || null;
  const chooseOneOptions = mainPromotion?.promo_options?.type === 'choose_one' ? mainPromotion.promo_options.options : [];

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
    const { totalReviews: reviewCount } = useGoogleReviewStats();

    return (
      <section className="bg-white py-20 md:py-24 px-6 md:px-14 border-t border-repower-navy-900/10">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-3" style={{ letterSpacing: '-0.025em' }}>
              What Our Customers Say
            </h2>
            <p className="font-sans text-repower-navy-900/65">
              <span className="font-medium text-repower-navy-900">{reviewCount}+</span> five-star reviews from Ontario boaters
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
                    <div className="bg-white border border-repower-navy-900/10 rounded-lg p-6 h-full card-hover">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-repower-gold text-repower-gold" />
                        ))}
                      </div>

                      <p className="font-sans text-repower-navy-900 mb-4 italic">
                        "{testimonial.quote}"
                      </p>

                      <div className="text-sm">
                        <span className="font-medium text-repower-navy-900">{testimonial.name}</span>
                        <span className="text-repower-navy-900/60">, {testimonial.location}</span>
                      </div>

                      <p className="text-xs text-repower-navy-900/60 mt-1 mb-3">
                        {testimonial.dateLabel}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-repower-navy-900/10">
                        <div className="flex items-center gap-2">
                          <img src={mercuryLogo} alt="Mercury" className="h-4" />
                          <span className="text-xs text-repower-navy-900/60">Mercury Owner</span>
                        </div>
                        <div className="flex items-center gap-1 text-repower-navy-900">
                          <BadgeCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
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
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full border border-repower-navy-900/10 shadow-sm hidden md:flex items-center justify-center hover:border-repower-navy-900/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-repower-navy-900" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full border border-repower-navy-900/10 shadow-sm hidden md:flex items-center justify-center hover:border-repower-navy-900/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-repower-navy-900" />
            </button>
          </div>

          <div className="flex flex-row keep-flex justify-center gap-2 mt-6">
            {dailyTestimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                className={`w-2 h-2 p-0 rounded-full transition-colors ${
                  selectedIndex === index ? 'bg-repower-gold' : 'bg-repower-navy-900/20'
                }`}
                style={{ minHeight: 8, minWidth: 8 }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  const promotionFaqs = mainPromotion?.promo_options?.type === 'choose_one' ? [
    { 
      question: "What is the Harris Boat Works 7-Year Warranty + Choose One promotion?", 
      answer: "When you buy any new Mercury outboard from Harris Boat Works, you get 7 full years of factory-backed warranty coverage, that's 3 years standard plus 4 bonus years. Plus, you choose one additional bonus: 6 months no payments, special financing rates, OR a factory rebate based on your motor's horsepower." 
    },
    { 
      question: "Does this apply to repower installations?", 
      answer: "Yes! This promotion applies to both new boat packages and repower installations." 
    }
  ] : [
    { 
      question: "What is the 7-Year Warranty promotion?", 
      answer: "When you buy any new Mercury outboard from Harris Boat Works, you get 7 full years of factory-backed warranty coverage, that's 3 years standard plus 4 bonus years. No third-party insurance, just straight Mercury protection." 
    },
    { 
      question: "Which motors are eligible?", 
      answer: "Every new Mercury outboard we sell qualifies, from a 2.5hp portable all the way up to a 300hp Verado. If it's new and it's Mercury, you're covered for 7 years." 
    },
    { 
      question: "Is this a third-party warranty?", 
      answer: "No. This is factory-backed Mercury coverage. Your warranty is honoured at any authorized Mercury dealer, and Harris Boat Works handles all warranty service in-house as a Platinum Dealer." 
    },
    { 
      question: "Does this apply to repowers?", 
      answer: "Yes! Whether you're buying a new package or dropping off your boat for a full repower, the 7-year warranty applies." 
    },
    { 
      question: "When does this offer end?", 
      answer: "This offer is available for a limited time. Check this page or contact us for current availability." 
    },
    { 
      question: "Do I need to do anything special to activate the warranty?", 
      answer: "Nope. Buy your motor from Harris Boat Works and the 7-year coverage is automatically included. We handle all the registration." 
    }
  ];

  const hasActivePromos = promotions.length > 0;

  return (
    <div className="min-h-screen bg-repower-paper">
      <PromotionsPageSEO promotions={promotions} />
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" />

      {/* Hero Section, only when promos are active */}
      {hasActivePromos && <PromotionHero endDate={mainPromotion?.end_date} bonusTitle={mainPromotion?.bonus_title} bonusDescription={mainPromotion?.bonus_description} />}

      {/* No DB promo active: lead with the TD Always-On financing offer as the active promotion */}
      {!loading && !hasActivePromos && isTDAlwaysOnActive() && (
        <section className="relative py-16 md:py-24 px-6 md:px-14 overflow-hidden bg-repower-navy-900">
          <div className="relative max-w-[1100px] mx-auto">
            <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-3 mb-6">
                  <span className="h-px w-8 bg-repower-mercury-red" />
                  <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-repower-mercury-red">Active Mercury Offer</span>
                </div>

                <h1 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(32px, 4vw, 48px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                  Low-Rate TD Financing on Your Mercury Repower
                </h1>
                <p className="font-sans text-base md:text-lg text-white/75 mb-6 leading-relaxed">
                  5.48% APR, terms up to 240 months, through December 31, 2026. Plus the standard 3-year factory warranty on every new Mercury.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
                  <Link to="/financing-application">
                    <Button size="lg" className="bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep min-w-[200px] w-full sm:w-auto">
                      Apply for Financing
                    </Button>
                  </Link>
                  <Link to="/quote/motor-selection">
                    <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 min-w-[200px] w-full sm:w-auto">
                      Build Your Quote
                    </Button>
                  </Link>
                </div>

                <p className="font-sans text-xs md:text-sm text-white/55 leading-relaxed max-w-md">
                  Not all customers will qualify. Approval depends on TD's credit review.
                </p>
              </div>

              <div className="order-first md:order-last">
                <TDRateCardImage
                  src={TD_RATE_CARD_IMAGE}
                  alt={TD_RATE_CARD_ALT}
                  className="w-full h-auto rounded-md shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Choose One Section */}
      {chooseOneOptions.length > 0 && (
        <ChooseOneSection options={chooseOneOptions} />
      )}

      {/* Mercury TD "Always On" Financing, only show the standalone card if a DB promo is also active (so TD sits as a sibling). Otherwise the hero above already presents it. */}
      {hasActivePromos && <TDAlwaysOnCard />}

      {/* Full Rebate Matrix Table with Interactive Calculator */}
      {rebateMatrix.length > 0 && (
        <section className="bg-repower-cream py-20 md:py-24 px-6 md:px-14 border-t border-repower-navy-900/10">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-repower-navy-900 mb-3" style={{ letterSpacing: '-0.025em' }}>
                Factory Rebate by Horsepower
              </h2>
              <p className="font-sans text-repower-navy-900/65">
                If you choose the rebate option, here's what you'll get based on your motor
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <RebateCalculator matrix={rebateMatrix} initialHP={115} />
              <div className="space-y-4">
                <h3 className="font-display text-lg font-semibold text-repower-navy-900">All Rebate Tiers</h3>
                <RebateMatrix matrix={rebateMatrix} />
              </div>
            </div>

            <p className="text-center text-sm text-repower-navy-900/60">
              Rebate applied at time of purchase. See dealer for complete details.
            </p>
          </div>
        </section>
      )}

      {/* Loading state for other promotions */}
      {loading && (
        <section className="max-w-[1100px] mx-auto px-6 md:px-14 py-12">
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-repower-navy-900/10 p-6 animate-pulse">
                <div className="h-6 bg-repower-navy-900/10 rounded w-3/4 mb-4" />
                <div className="h-4 bg-repower-navy-900/10 rounded w-1/2 mb-2" />
                <div className="h-4 bg-repower-navy-900/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials Carousel */}
      <TestimonialsSection />

      {/* Why Buy from Harris */}
      <section className="bg-repower-paper py-20 md:py-24 px-6 md:px-14 border-t border-repower-navy-900/10">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-center text-repower-navy-900 mb-12" style={{ letterSpacing: '-0.025em' }}>
            Why Buy from Harris Boat Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyBuyReasons.map((reason, index) => (
              <div
                key={index}
                className="bg-white border border-repower-navy-900/10 rounded-lg p-6 card-hover"
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
                  <div className="h-10 md:h-12 flex items-center mb-4">
                    {reason.icon && <reason.icon className="w-6 h-6 md:w-7 md:h-7 text-repower-mercury-red" strokeWidth={1.5} />}
                  </div>
                )}
                <h3 className="font-display font-semibold text-repower-navy-900 mb-2">{reason.title}</h3>
                <p className="font-sans text-sm text-repower-navy-900/70 leading-relaxed">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section, only when promos are active */}
      {hasActivePromos && (
        <section className="bg-white py-20 md:py-24 px-6 md:px-14 border-t border-repower-navy-900/10">
          <div className="max-w-[880px] mx-auto">
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,40px)] text-center text-repower-navy-900 mb-3" style={{ letterSpacing: '-0.025em' }}>
              Promotion FAQs
            </h2>
            <p className="font-sans text-repower-navy-900/65 text-center mb-10">
              Common questions about the current Mercury promotion.
            </p>
            <Accordion type="single" collapsible className="border-t border-repower-navy-900/10">
              {promotionFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-b border-repower-navy-900/10 group">
                  <AccordionTrigger className="text-left hover:no-underline py-5 px-2 hover:bg-repower-navy-900/[0.04] rounded-sm transition-colors [&>svg]:text-repower-navy-900">
                    <span className="font-sans font-semibold text-[16px] md:text-[17px] text-repower-navy-900 pr-4 relative inline-block group-data-[state=open]:after:content-[''] group-data-[state=open]:after:absolute group-data-[state=open]:after:left-0 group-data-[state=open]:after:-bottom-1 group-data-[state=open]:after:h-[2px] group-data-[state=open]:after:w-10 group-data-[state=open]:after:bg-repower-gold">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-[15px] text-repower-navy-900/75 pb-5 px-2 leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Newsletter Signup */}
      <section id="promo-signup" className="bg-repower-cream py-20 md:py-24 px-6 md:px-14 border-t border-repower-navy-900/10">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2 mb-6">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-8" />
            <span className="text-xs text-repower-navy-900/60">Authorized Mercury Dealer</span>
          </div>
          <Bell className="w-10 h-10 text-repower-mercury-red mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="font-display font-bold text-[clamp(24px,3vw,32px)] text-repower-navy-900 mb-3" style={{ letterSpacing: '-0.025em' }}>
            Get Notified of Future Sales
          </h2>
          <p className="font-sans text-repower-navy-900/70 mb-6">
            Be the first to know when we launch new promotions. No spam, just savings.
          </p>

          <form onSubmit={handleGeneralSubscribe} className="max-w-md mx-auto space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-left block text-repower-navy-900">How should we notify you?</Label>
              <RadioGroup
                value={channel}
                onValueChange={(v) => setChannel(v as 'email' | 'sms' | 'both')}
                className="flex gap-2"
              >
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border bg-white cursor-pointer transition-colors ${
                    channel === 'email'
                      ? 'border-repower-mercury-red ring-1 ring-repower-mercury-red'
                      : 'border-repower-navy-900/10 hover:border-repower-navy-900/30'
                  }`}
                >
                  <RadioGroupItem value="email" id="general-email-option" className="sr-only" />
                  <Mail className="h-4 w-4 text-repower-mercury-red" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-repower-navy-900">Email</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border bg-white cursor-pointer transition-colors ${
                    channel === 'sms'
                      ? 'border-repower-mercury-red ring-1 ring-repower-mercury-red'
                      : 'border-repower-navy-900/10 hover:border-repower-navy-900/30'
                  }`}
                >
                  <RadioGroupItem value="sms" id="general-sms-option" className="sr-only" />
                  <MessageSquare className="h-4 w-4 text-repower-mercury-red" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-repower-navy-900">Text</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border bg-white cursor-pointer transition-colors ${
                    channel === 'both'
                      ? 'border-repower-mercury-red ring-1 ring-repower-mercury-red'
                      : 'border-repower-navy-900/10 hover:border-repower-navy-900/30'
                  }`}
                >
                  <RadioGroupItem value="both" id="general-both-option" className="sr-only" />
                  <span className="text-sm font-medium text-repower-navy-900">Both</span>
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
                className="bg-white border-repower-navy-900/15"
              />
            )}

            {(channel === 'sms' || channel === 'both') && (
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                required={channel === 'sms' || channel === 'both'}
                className="bg-white border-repower-navy-900/15"
              />
            )}

            <Button type="submit" disabled={subscribing} className="w-full bg-repower-mercury-red text-white hover:bg-repower-mercury-red-deep">
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>

          <p className="text-xs text-repower-navy-900/55 mt-4">
            You can unsubscribe at any time. We respect your privacy.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
