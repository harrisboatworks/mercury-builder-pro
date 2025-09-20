import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';
import { FinancingProvider } from '@/contexts/FinancingContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoImageScraping } from '@/hooks/useAutoImageScraping';
import MotorCardPremium from '@/components/motors/MotorCardPremium';
import { Button } from '@/components/ui/button';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { StickySearch } from '@/components/ui/sticky-search';
import { createPortal } from 'react-dom';
import '@/styles/premium-motor.css';
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
  year: number;
  make: string;
  description?: string | null;
  features?: string[] | null;
  specifications?: Record<string, any> | null;
  detail_url?: string | null;
  images?: any[] | null;
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


export default function MotorSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { toast } = useToast();
  
  const [motors, setMotors] = useState<DbMotor[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHpRange, setSelectedHpRange] = useState<{ min: number; max: number }>({ min: 0, max: Infinity });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mountPointReady, setMountPointReady] = useState(false);
  

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
        // Load motors (same query as original)
        const { data: motorsData, error: motorsError } = await supabase
          .from('motor_models')
          .select('*')
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
      // Apply promotions (same logic as original MotorSelection) 
      // Use msrp and dealer_price as fallbacks if base_price/sale_price are missing
      const basePrice = dbMotor.base_price || dbMotor.msrp || 0;
      const salePrice = dbMotor.sale_price || 
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
        hp: dbMotor.horsepower,
        price: Math.round(effectivePrice),
        image: dbMotor.image_url || '',
        stockStatus: dbMotor.availability === 'In Stock' ? 'In Stock' : 'On Order',
        stockNumber: dbMotor.stock_number,
        model_number: dbMotor.model_number,
        category: dbMotor.horsepower <= 20 ? 'portable' :
                 dbMotor.horsepower <= 60 ? 'mid-range' : 
                 dbMotor.horsepower <= 150 ? 'high-performance' : 'v8-racing',
        type: getMotorFamilyDisplay(classifyMotorFamily(dbMotor.horsepower, dbMotor.model_display || dbMotor.model, dbMotor.features)),
        specs: `${dbMotor.horsepower}HP ${dbMotor.motor_type || 'FourStroke'}`,
        basePrice: basePrice,
        salePrice: salePrice,
        originalPrice: dbMotor.sale_price || dbMotor.base_price,
        savings: (dbMotor.sale_price || dbMotor.base_price) - effectivePrice,
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

  // Filter motors
  const filteredMotors = useMemo(() => {
    let filtered = processedMotors;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(motor => 
        motor.model.toLowerCase().includes(term) ||
        motor.hp.toString().includes(term)
      );
    }

    // HP range filter
    if (selectedHpRange.min !== 0 || selectedHpRange.max !== Infinity) {
      filtered = filtered.filter(motor => 
        motor.hp >= selectedHpRange.min && motor.hp <= selectedHpRange.max
      );
    }

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter(motor => motor.stockStatus === 'In Stock');
    }

    return filtered;
  }, [processedMotors, searchTerm, selectedHpRange, inStockOnly]);

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

  // Detect when portal mount point becomes available
  useEffect(() => {
    const checkMountPoint = () => {
      const mountPoint = document.getElementById('sticky-search-mount');
      if (mountPoint) {
        setMountPointReady(true);
      }
    };
    
    // Check immediately and set up a timeout for fallback
    checkMountPoint();
    const timeout = setTimeout(checkMountPoint, 100);
    
    return () => clearTimeout(timeout);
  }, []);


  if (loading) {
    return (
      <QuoteLayout title="Select Mercury Outboard Motor">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading Mercury motors...</p>
          </div>
        </div>
      </QuoteLayout>
    );
  }

  return (
    <FinancingProvider>
      <QuoteLayout title="Select Mercury Outboard Motor">
        {/* Portal for sticky search */}
        {mountPointReady &&
          createPortal(
            <StickySearch
              searchTerm={searchTerm}
              selectedHpRange={selectedHpRange}
              inStockOnly={inStockOnly}
              onSearchChange={setSearchTerm}
              onHpRangeChange={setSelectedHpRange}
              onInStockChange={setInStockOnly}
            />,
            document.getElementById('sticky-search-mount')!
          )
        }

        <div className="space-y-6 pt-4">
        
        <div>
          {/* Motors Grid */}
          {filteredMotors.length > 0 ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
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
                
                 return (
                  <div className="w-full max-w-sm mx-auto">
                    <MotorCardPremium
                    key={motor.id}
                    img={motor.image}
                    title={motor.model}
                    hp={motor.hp}
                    msrp={motor.basePrice}
                    price={motor.price}
                    promoText={motor.appliedPromotions?.join(' • ') || null}
                    selected={state.motor?.id === motor.id}
                    onSelect={() => handleMotorSelect(motor)}
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
                  </div>
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
                onClick={() => {
                  setSearchTerm('');
                  setSelectedHpRange({ min: 0, max: Infinity });
                  setInStockOnly(false);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
        </div>
      </QuoteLayout>
    </FinancingProvider>
  );
}