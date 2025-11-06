import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';
import { FinancingProvider } from '@/contexts/FinancingContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoImageScraping } from '@/hooks/useAutoImageScraping';
import { useHpSuggestions } from '@/hooks/useHpSuggestions';
import { HpSuggestionsDropdown } from '@/components/motors/HpSuggestionsDropdown';
import MotorCardPreview from '@/components/motors/MotorCardPreview';
import { Button } from '@/components/ui/button';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import '@/styles/premium-motor.css';
import '@/styles/sticky-quote-mobile.css';
import { classifyMotorFamily, getMotorFamilyDisplay } from '@/lib/motor-family-classifier';
// Removed obsolete pricing importer import

// Database types
interface DbMotor {
  id: string;
  model: string;
  model_display?: string | null;
  model_number?: string | null;
  horsepower: number;
  base_price: number;
  sale_price?: number | null;
  msrp?: number | null;
  dealer_price?: number | null;
  motor_type: string;
  engine_type?: string | null;
  image_url?: string | null;
  availability?: string | null;
  stock_number?: string | null;
  stock_quantity?: number | null;
  in_stock?: boolean | null;
  year: number;
  make: string;
  description?: string | null;
  features?: string[] | null;
  specifications?: Record<string, any> | null;
  detail_url?: string | null;
  manual_overrides?: Record<string, any> | null;
  images?: any[] | null;
  hero_media_id?: string | null;
  // Hero media joined data
  hero_media?: {
    id: string;
    media_url: string;
    media_type: string;
  } | null;
}

interface Promotion {
  id: string;
  name: string;
  discount_percentage: number;
  discount_fixed_amount: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  stackable: boolean;
  kind: 'discount' | 'bonus';
  bonus_title: string | null;
  bonus_short_badge: string | null;
  bonus_description: string | null;
  warranty_extra_years: number | null;
  terms_url: string | null;
  highlight: boolean;
  priority: number;
  details?: any;
  image_url: string | null;
  image_alt_text: string | null;
}

interface PromotionRule {
  id: string;
  promotion_id: string;
  rule_type: 'all' | 'model' | 'motor_type' | 'horsepower_range';
  model: string | null;
  motor_type: string | null;
  horsepower_min: number | null;
  horsepower_max: number | null;
  discount_percentage: number;
  discount_fixed_amount: number;
}

// Critical models that should always be visible when in stock
const CRITICAL_MODELS = ['1A10201LK', '1C08201LK']; // 9.9MH, 8MH - popular portable models

export default function MotorSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { toast } = useToast();
  
  const [motors, setMotors] = useState<DbMotor[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHpSuggestions, setShowHpSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Remove selectedMotor state since we're not doing inline selection anymore

  // Auto-trigger background image scraping for motors without images
  const imageScrapeStatus = useAutoImageScraping(motors.map(motor => ({
    id: motor.id,
    model: motor.model,
    images: motor.images,
    image_url: motor.image_url,
    detail_url: motor.detail_url
  })));

  // Load motors and promotions from Supabase (same as original MotorSelection)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load motors with hero media data
        const { data: motorsData, error: motorsError } = await supabase
          .from('motor_models')
          .select(`
            *,
            hero_media:motor_media!hero_media_id(
              media_url
            )
          `)
          .order('horsepower', { ascending: true });

        if (motorsError) throw motorsError;
        
        // Filter out Jet models and excluded motors (same as original)
        const filteredMotors = motorsData?.filter(motor => 
          !motor.model?.toLowerCase().includes('jet') &&
          motor.horsepower <= 600 && // HP cap same as original
          motor.availability !== 'Exclude' // Exclude motors marked as "Exclude"
        ) || [];
        
        setMotors(filteredMotors);

        // Load promotions (same as original)
        const { data: promoData, error: promoError } = await supabase
          .from('promotions')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (promoError) throw promoError;
        setPromotions(promoData || []);

        // Load promotion rules (same as original)
        const { data: rulesData, error: rulesError } = await supabase
          .from('promotions_rules')
          .select('*');

        if (rulesError) throw rulesError;
        setPromotionRules(rulesData || []);
        
      } catch (error) {
        console.error('Error loading motor data:', error);
        toast({
          title: "Error loading motors",
          description: "Please refresh the page to try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Convert DB motor to Motor type and apply promotions (same logic as original)
  const processedMotors = useMemo(() => {
    return motors.map(dbMotor => {
      // Apply promotions - prioritize manual overrides
      const manualOverrides = dbMotor.manual_overrides || {};
      const basePrice = manualOverrides.base_price || dbMotor.base_price || dbMotor.msrp || 0;
      const salePrice = manualOverrides.sale_price || 
                       dbMotor.sale_price || 
                       (dbMotor.dealer_price && dbMotor.dealer_price < (dbMotor.msrp || basePrice) ? dbMotor.dealer_price : null);
      let effectivePrice = salePrice || basePrice;
      let promoTexts: string[] = [];
      
      // Find applicable promotions
      const applicableRules = promotionRules.filter(rule => {
        const promo = promotions.find(p => p.id === rule.promotion_id);
        if (!promo) return false;
        
        switch (rule.rule_type) {
          case 'all':
            return true;
          case 'model':
            return rule.model && dbMotor.model.toLowerCase().includes(rule.model.toLowerCase());
          case 'motor_type':
            return rule.motor_type && dbMotor.motor_type === rule.motor_type;
          case 'horsepower_range':
            return dbMotor.horsepower >= (rule.horsepower_min || 0) && 
                   dbMotor.horsepower <= (rule.horsepower_max || 999);
          default:
            return false;
        }
      });

      // Apply discounts and collect promo text
      applicableRules.forEach(rule => {
        const promo = promotions.find(p => p.id === rule.promotion_id);
        if (!promo) return;
        
        if (rule.discount_percentage > 0) {
          effectivePrice *= (1 - rule.discount_percentage / 100);
        }
        if (rule.discount_fixed_amount > 0) {
          effectivePrice -= rule.discount_fixed_amount;
        }
        
        if (promo.bonus_short_badge) {
          promoTexts.push(promo.bonus_short_badge);
        }
      });

      // Convert to Motor type (same as original)
      const convertedMotor: Motor = {
        id: dbMotor.id,
        model: dbMotor.model_display || dbMotor.model, // Use model_display for proper names like "6 MH FourStroke"
        year: dbMotor.year,
        hp: Number(dbMotor.horsepower),
        price: Math.round(effectivePrice),
        image: dbMotor.image_url || '',
        stockStatus: dbMotor.in_stock ? 'In Stock' : 'On Order',
        stockNumber: dbMotor.stock_number,
        model_number: dbMotor.model_number,
        // Add stock fields
        in_stock: dbMotor.in_stock,
        stock_quantity: dbMotor.stock_quantity,
        availability: dbMotor.availability,
        // Preserve hero_media_id for image priority logic
        hero_media_id: dbMotor.hero_media_id,
        category: dbMotor.horsepower <= 20 ? 'portable' :
                 dbMotor.horsepower <= 60 ? 'mid-range' : 
                 dbMotor.horsepower <= 150 ? 'high-performance' : 'v8-racing',
        type: getMotorFamilyDisplay(classifyMotorFamily(dbMotor.horsepower, dbMotor.model_display || dbMotor.model, dbMotor.features)),
        specs: `${dbMotor.horsepower}HP ${dbMotor.motor_type || 'FourStroke'}`,
        basePrice: basePrice,
        salePrice: salePrice,
        originalPrice: basePrice, // Use calculated basePrice with msrp fallback
        savings: Math.max(0, basePrice - effectivePrice), // Ensure savings is never negative
        appliedPromotions: promoTexts,
        bonusOffers: applicableRules.map(rule => {
          const promo = promotions.find(p => p.id === rule.promotion_id);
          return promo ? {
            id: promo.id,
            title: promo.bonus_title || promo.name,
            shortBadge: promo.bonus_short_badge,
            description: promo.bonus_description,
            warrantyExtraYears: promo.warranty_extra_years,
            termsUrl: promo.terms_url,
            highlight: promo.highlight
          } : null;
        }).filter(Boolean) as any[]
      };
      
      return convertedMotor;
    });
  }, [motors, promotions, promotionRules]);

  // Calculate monthly payments for each motor
  // HP suggestions for autocomplete
  const hpSuggestions = useHpSuggestions(searchQuery, processedMotors);
  
  const monthlyPayments = useMemo(() => {
    const payments: Record<string, number | null> = {};
    
    processedMotors.forEach(motor => {
      // Simple calculation without hook - matches useMotorMonthlyPayment logic
      if (motor.price > 5000) {
        const annualRate = 6.99; // Default rate
        const monthlyRate = annualRate / 100 / 12;
        const termMonths = 60;
        const priceWithHST = motor.price * 1.13;
        const monthlyAmount = priceWithHST * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
        payments[motor.id] = Math.round(monthlyAmount);
      } else {
        payments[motor.id] = null;
      }
    });
    
    return payments;
  }, [processedMotors]);

  // Filter motors with intelligent search
  const filteredMotors = useMemo(() => {
    // Always include critical in-stock models
    const criticalMotors = processedMotors.filter(motor => 
      CRITICAL_MODELS.includes(motor.model_number || '') && motor.in_stock
    );
    
    if (!searchQuery) {
      // When no search query, ensure critical motors are at the top
      const nonCritical = processedMotors.filter(m => 
        !criticalMotors.some(cm => cm.id === m.id)
      );
      return [...criticalMotors, ...nonCritical];
    }

    const query = searchQuery.toLowerCase().trim();
    
    return processedMotors.filter(motor => {
      // Parse advanced search syntax
      if (query.includes('hp:')) {
        const hpMatch = query.match(/hp:(\d+(?:\.\d+)?)/);
        if (hpMatch) return motor.hp === Number(hpMatch[1]);
      }
      
      if (query.includes('hp:>')) {
        const hpMatch = query.match(/hp:>(\d+(?:\.\d+)?)/);
        if (hpMatch) return motor.hp > Number(hpMatch[1]);
      }
      
      if (query.includes('hp:<')) {
        const hpMatch = query.match(/hp:<(\d+(?:\.\d+)?)/);
        if (hpMatch) return motor.hp < Number(hpMatch[1]);
      }
      
      if (query.includes('stock') || query.includes('instock')) {
        return motor.in_stock === true;
      }
      
      // Standard text search - prioritize exact HP match for numeric queries
      const isNumericQuery = /^\d+(\.\d+)?$/.test(query);
      const hpMatches = isNumericQuery 
        ? Number(motor.hp) === Number(query) 
        : motor.hp.toString().includes(query);
      
      const matches = hpMatches ||
        motor.model.toLowerCase().includes(query) ||
        motor.type?.toLowerCase().includes(query);
      
      return matches;
    });
  }, [processedMotors, searchQuery]);

  const handleMotorSelect = (motor: Motor) => {
    // Add motor to quote context
    dispatch({ type: 'SET_MOTOR', payload: motor });
    
    // Show success feedback
    toast({
      title: "Motor added to quote!",
      description: `${motor.model} has been added to your quote.`,
    });
    
    // Auto-navigate to next step
    setTimeout(() => {
      navigate('/quote/purchase-path');
    }, 500);
  };

  const handleContinue = () => {
    if (!state.motor) return;
    dispatch({ type: 'COMPLETE_STEP', payload: 1 });
    navigate('/quote/purchase-path');
  };

  const handleHpSuggestionSelect = (hp: number) => {
    setSearchQuery(hp.toString());
    setShowHpSuggestions(false);
    setSelectedSuggestionIndex(0);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showHpSuggestions || hpSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < hpSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (hpSuggestions[selectedSuggestionIndex]) {
          handleHpSuggestionSelect(hpSuggestions[selectedSuggestionIndex].hp);
        }
        break;
      case 'Escape':
        setShowHpSuggestions(false);
        setSelectedSuggestionIndex(0);
        break;
    }
  };

  const getModelString = () => {
    if (!state.motor) return undefined;
    return state.motor.model;
  };

  const getTotalWithTax = () => {
    if (!state.motor?.price) return undefined;
    return Math.round(state.motor.price * 1.13); // 13% HST
  };

  const getCoverageYears = () => {
    const baseYears = 3; // Standard Mercury warranty
    const extendedYears = state.warrantyConfig?.extendedYears || 0;
    return baseYears + extendedYears;
  };

  // Set page metadata
  useEffect(() => {
    document.title = 'Select Mercury Outboard Motor | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Choose from our selection of Mercury outboard motors with live pricing and current promotions.';
  }, []);


  if (loading) {
    return (
      <QuoteLayout>
        <div className="bg-stone-50 min-h-screen flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent"></div>
            <p className="text-gray-600 font-light tracking-wide">Loading Mercury motors...</p>
          </div>
        </div>
      </QuoteLayout>
    );
  }

  return (
    <FinancingProvider>
      <QuoteLayout showProgress={false}>
        {/* Search Bar - Elegant minimal style */}
        <div className="sticky top-14 sm:top-16 md:top-[72px] z-40 bg-stone-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Find your perfect Mercury..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowHpSuggestions(true);
                    setSelectedSuggestionIndex(0);
                  }}
                  onFocus={() => setShowHpSuggestions(true)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full h-16 px-6 pr-12 text-base font-light tracking-wide rounded-sm border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-all duration-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowHpSuggestions(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gray hover:text-luxury-ink transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {showHpSuggestions && hpSuggestions.length > 0 && (
                  <HpSuggestionsDropdown
                    suggestions={hpSuggestions}
                    onSelect={handleHpSuggestionSelect}
                    onClose={() => setShowHpSuggestions(false)}
                    selectedIndex={selectedSuggestionIndex}
                  />
                )}
              </div>
              {searchQuery && (
                <div className="text-center mt-2 text-xs text-luxury-gray">
                  {filteredMotors.length} results
                </div>
              )}
          </div>
        </div>

        <div className="bg-stone-50 py-12">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Motors Grid */}
          {filteredMotors.length > 0 ? (
            <div className="grid gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filteredMotors.map(motor => {
                // Find original DB motor to get specifications
                const dbMotor = motors.find(m => m.id === motor.id);
                const specs = dbMotor?.specifications || {};
                
                // Extract specification data with fallbacks
                const shaft = specs.shaftLength || 
                  (motor.model.includes('L') ? 'Long (20")' : 
                   motor.model.includes('XL') ? 'Extra Long (25")' : 
                   motor.model.includes('XXL') ? 'XX Long (30")' : undefined);
                
                const weightLbs = specs.weightLbs || specs.weight;
                const altOutput = specs.alternatorOutput || specs.alternator;
                const steering = specs.steering || 
                  (motor.model.includes('MLH') ? 'manual' :
                   motor.model.includes('ELPT') ? 'electric power tilt' :
                   motor.model.includes('DTS') ? 'digital throttle & shift' : undefined);
                
                 // Get hero image URL from joined data or fallback  
                 const heroImageUrl = (dbMotor as any)?.hero_media?.media_url || dbMotor?.image_url || motor.image || null;
                 
                 return (
                    <MotorCardPreview
                    key={motor.id}
                    img={heroImageUrl}
                    title={motor.model}
                    hp={motor.hp}
                    msrp={motor.basePrice}
                    price={motor.price}
                    promoText={motor.appliedPromotions?.join(' • ') || null}
                    selected={state.motor?.id === motor.id}
                    onSelect={() => handleMotorSelect(motor)}
                    inStock={motor.in_stock}
                    // New specification props
                    shaft={shaft}
                    weightLbs={weightLbs}
                    altOutput={altOutput}
                    steering={steering}
                    features={dbMotor?.features || []}
                    description={dbMotor?.description}
                    specSheetUrl={dbMotor?.detail_url}
                    motor={motor as any}
                    />
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-600 mb-3">
                No motors match your current filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
        </div>
      </QuoteLayout>
    </FinancingProvider>
  );
}