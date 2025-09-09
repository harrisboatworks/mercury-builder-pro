import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';
import StickyQuoteBar from '@/components/quote/StickyQuoteBar';
import { useMotorMonthlyPayment } from '@/hooks/useMotorMonthlyPayment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import MotorCardPremium from '@/components/motors/MotorCardPremium';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import '@/styles/premium-motor.css';
import '@/styles/sticky-quote-mobile.css';

// Types for Supabase data
interface DbMotor {
  id: string;
  model: string;
  horsepower: number;
  base_price: number;
  sale_price?: number | null;
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

const HP_RANGES = [
  { id: 'all', label: 'All HP', min: 0, max: 999 },
  { id: '2_20', label: '2.5–20 HP', min: 2.5, max: 20 },
  { id: '25_60', label: '25–60 HP', min: 25, max: 60 },
  { id: '75_150', label: '75–150 HP', min: 75, max: 150 },
  { id: '175_300', label: '175–300 HP', min: 175, max: 300 },
  { id: '350p', label: '350+ HP', min: 350, max: 999 },
];

export default function MotorSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const { toast } = useToast();
  
  // State for motor data and filters
  const [motors, setMotors] = useState<DbMotor[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hpRange, setHpRange] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  
  // Get monthly payment if motor is selected
  const monthlyPayment = useMotorMonthlyPayment({ 
    motorPrice: selectedMotor?.price || 0 
  });

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
        
        // Filter out Jet models (same as original)
        const filteredMotors = motorsData?.filter(motor => 
          !motor.model?.toLowerCase().includes('jet') &&
          motor.horsepower <= 600 // HP cap same as original
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
      let effectivePrice = dbMotor.sale_price || dbMotor.base_price;
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
        model: dbMotor.model,
        year: dbMotor.year,
        hp: dbMotor.horsepower,
        price: Math.round(effectivePrice),
        image: dbMotor.image_url || '',
        stockStatus: dbMotor.availability === 'In Stock' ? 'In Stock' : 'On Order',
        stockNumber: dbMotor.stock_number,
        category: dbMotor.horsepower <= 20 ? 'portable' : 
                 dbMotor.horsepower <= 60 ? 'mid-range' : 
                 dbMotor.horsepower <= 150 ? 'high-performance' : 'v8-racing',
        type: dbMotor.motor_type || 'FourStroke',
        specs: `${dbMotor.horsepower}HP ${dbMotor.motor_type || 'FourStroke'}`,
        basePrice: dbMotor.base_price,
        salePrice: dbMotor.sale_price,
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
    if (hpRange !== 'all') {
      const range = HP_RANGES.find(r => r.id === hpRange);
      if (range) {
        filtered = filtered.filter(motor => 
          motor.hp >= range.min && motor.hp <= range.max
        );
      }
    }

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter(motor => motor.stockStatus === 'In Stock');
    }

    return filtered;
  }, [processedMotors, searchTerm, hpRange, inStockOnly]);

  const handleMotorSelect = (motor: Motor) => {
    setSelectedMotor(motor);
    dispatch({ type: 'SET_MOTOR', payload: motor });
  };

  const handleContinue = () => {
    if (!selectedMotor) return;
    dispatch({ type: 'COMPLETE_STEP', payload: 1 });
    navigate('/quote/purchase-path');
  };

  const getModelString = () => {
    if (!selectedMotor) return undefined;
    return `${selectedMotor.year} Mercury ${selectedMotor.hp}HP ${selectedMotor.model}`;
  };

  const getTotalWithTax = () => {
    if (!selectedMotor?.price) return undefined;
    return Math.round(selectedMotor.price * 1.13); // 13% HST
  };

  const getCoverageYears = () => {
    const baseYears = 3; // Standard Mercury warranty
    const extendedYears = state.warrantyConfig?.extendedYears || 0;
    return baseYears + extendedYears;
  };

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
      <QuoteLayout title="Select Your Mercury Motor">
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
    <QuoteLayout title="Select Your Mercury Motor">
      <div className="space-y-6">
        {/* Filters */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          
          {/* Filters */}
          <div className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search motors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* HP Range + Stock Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Desktop: Show all filter chips */}
              <div className="hidden sm:contents">
                {HP_RANGES.map(range => (
                  <button
                    key={range.id}
                    onClick={() => setHpRange(range.id)}
                    className={`filter-chip rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      hpRange === range.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Mobile: Compact dropdown */}
              <div className="sm:hidden">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <span>{HP_RANGES.find(r => r.id === hpRange)?.label || 'All HP'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-1">
                      {HP_RANGES.map(range => (
                        <button
                          key={range.id}
                          onClick={() => setHpRange(range.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            hpRange === range.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-accent'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                In Stock Only
              </label>
            </div>
          </div>
        </div>

        {/* Motors Grid */}
        {filteredMotors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <MotorCardPremium
                  key={motor.id}
                  img={motor.image}
                  title={motor.model}
                  hp={motor.hp}
                  msrp={motor.basePrice}
                  price={motor.price}
                  monthly={monthlyPayment?.amount || null}
                  promoText={motor.appliedPromotions?.join(' • ') || null}
                  selected={selectedMotor?.id === motor.id}
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
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-amber-900 dark:text-amber-200">
              No motors match your current filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchTerm('');
                setHpRange('all');
                setInStockOnly(false);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

      </div>

      {/* Sticky Quote Bar - show when motor is selected */}
      {selectedMotor && (
        <StickyQuoteBar
          model={getModelString()}
          total={getTotalWithTax()}
          monthly={monthlyPayment?.amount || null}
          coverageYears={getCoverageYears()}
          stepLabel="Step 1 of 7"
          primaryLabel="Continue"
          secondaryLabel="Change Motor"
          onPrimary={handleContinue}
          onSecondary={() => {
            setSelectedMotor(null);
            dispatch({ type: 'SET_MOTOR', payload: null });
          }}
        />
      )}
    </QuoteLayout>
  );
}