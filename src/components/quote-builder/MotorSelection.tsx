import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, RefreshCcw, ShieldCheck, Zap, Check, Star, Sparkles, Ship, Gauge, Fuel, MapPin, Wrench, Battery, Settings, AlertTriangle, Calculator, Info, Flame, TrendingUp, CheckCircle, Tag, Anchor, Heart, Eye, Search, X } from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Motor } from '../QuoteBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MotorFinderWizard } from './MotorFinderWizard';
import { TestimonialCarousel } from './TestimonialCarousel';
import { PromoDetailsModal } from './PromoDetailsModal';
import { ActivityTicker } from './ActivityTicker';
import { RotatingTestimonials } from './RotatingTestimonials';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getPriceDisplayState } from '@/lib/pricing';
import { formatVariantSubtitle, formatMotorTitle } from '@/lib/card-title';
import { useSocialProofNotifications } from '@/hooks/useSocialProofNotifications';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { canadianEncouragement, loadingMessages, emptyStateMessages, friendlyErrors } from '@/lib/canadian-messages';
import { MonthlyPaymentDisplay } from './MonthlyPaymentDisplay';
import { processHarrisLogoBackground } from '@/utils/processHarrisLogo';
// Mobile optimization imports
import { MobileTrustAccordion } from '@/components/ui/mobile-trust-accordion';
import { MobileFilterSheet } from '@/components/ui/mobile-filter-sheet';
import { MobileStickyCTA } from '@/components/ui/mobile-sticky-cta';
import { MobileQuoteForm } from '@/components/ui/mobile-quote-form';

// Database types
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

// Shared promotions detection
const PROMO_MAP = [{
  key: 'get5',
  test: /(mercury\s*)?(get\s*5|get5|5\s*year(\s*warranty)?)/i,
  label: 'Warranty bonus active'
}, {
  key: 'repower',
  test: /(repower\s*rebate|repower)/i,
  label: 'Repower Rebate Promo active'
}] as const;

type PromoKey = typeof PROMO_MAP[number]['key'];

const REPOWER_INFO_URL = 'https://www.mercurymarine.com/en/us/engines/outboard/promotions/';

const detectPromoKeysFromText = (text?: string | null): PromoKey[] => {
  if (!text) return [];
  const keys = new Set<PromoKey>();
  for (const promo of PROMO_MAP) {
    if (promo.test.test(text)) {
      keys.add(promo.key);
    }
  }
  return Array.from(keys);
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface MotorSelectionProps {
  onMotorSelected?: (motor: Motor) => void;
  onStepComplete: (motor: Motor) => void;
  existingBoatInfo?: any;
  quoteFocus?: 'performance' | 'efficiency' | 'value' | null;
  // Legacy props for staging pages
  noSalePriceLayout?: string;
  imageSizingMode?: string;
}

export function MotorSelection({ onMotorSelected, onStepComplete }: MotorSelectionProps) {
  const [loading, setLoading] = useState(true);
  const [motors, setMotors] = useState<Motor[]>([]);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHPRange, setSelectedHPRange] = useState<string>('all');
  const [selectedEngineType, setSelectedEngineType] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [quickViewMotor, setQuickViewMotor] = useState<Motor | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationParticles, setCelebrationParticles] = useState<Array<{id: number, x: number, y: number, emoji: string}>>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Motor[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    priceRange: [0, 50000] as [number, number],
    hpRange: [0, 600] as [number, number]
  });

  const loadingText = useMemo(() => pick([...loadingMessages]), []);

  // HP Ranges for filtering
  const hpRanges = [{
    key: 'all',
    label: 'All HP',
    color: 'default'
  }, {
    key: '2.5-20',
    label: '2.5-20 HP',
    color: 'portable'
  }, {
    key: '25-60',
    label: '25-60 HP',
    color: 'fishing'
  }, {
    key: '75-150',
    label: '75-150 HP',
    color: 'recreational'
  }, {
    key: '175-300',
    label: '175-300 HP',
    color: 'performance'
  }, {
    key: '350+',
    label: '350+ HP',
    color: 'v8-racing'
  }];

  // Motor filtering logic
  const filteredMotors = useMemo(() => {
    let filtered = motors.filter(motor => {
      // Search query
      if (searchQuery && !motor.model.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !motor.hp.toString().includes(searchQuery)) {
        return false;
      }

      // In stock filter
      if (inStockOnly && motor.stockStatus !== 'In Stock') {
        return false;
      }

      // HP Range filtering
      if (selectedHPRange !== 'all') {
        const hp = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
        switch (selectedHPRange) {
          case '2.5-20':
            if (hp < 2.5 || hp > 20) return false;
            break;
          case '25-60':
            if (hp < 25 || hp > 60) return false;
            break;
          case '75-150':
            if (hp < 75 || hp > 150) return false;
            break;
          case '175-300':
            if (hp < 175 || hp > 300) return false;
            break;
          case '350+':
            if (hp < 350) return false;
            break;
        }
      }

      return true;
    });

    return filtered;
  }, [motors, searchQuery, inStockOnly, selectedHPRange]);

  // Data loading effect
  useEffect(() => {
    const loadMotors = async () => {
      try {
        setLoading(true);
        
        // Load motors from database
        const { data: dbMotors, error } = await supabase
          .from('motors')
          .select('*')
          .order('horsepower', { ascending: true });

        if (error) throw error;

        // Transform database motors to frontend format
        const transformedMotors: Motor[] = (dbMotors || []).map(motor => ({
          id: motor.id,
          model: motor.model,
          hp: motor.horsepower,
          price: motor.sale_price || motor.base_price,
          basePrice: motor.base_price,
          salePrice: motor.sale_price,
          category: motor.motor_type,
          year: motor.year,
          make: motor.make,
          image: motor.image_url || '/placeholder.svg',
          stockStatus: motor.availability === 'In Stock' ? 'In Stock' : 
                      motor.availability === 'On Order' ? 'On Order' : 'Out of Stock',
          appliedPromotions: [],
          bonusOffers: [],
          type: motor.motor_type || 'outboard',
          specs: 'N/A'
        }));

        setMotors(transformedMotors);
      } catch (error) {
        console.error('Error loading motors:', error);
        toast({
          title: "Error loading motors",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadMotors();
  }, [toast]);

  const handleMotorSelection = (motor: Motor) => {
    if (selectedMotor?.id === motor.id) {
      return;
    }

    // Select new motor
    setRecentlyViewed(prev => {
      const without = prev.filter(p => p.id !== motor.id);
      const next = [motor, ...without];
      return next.slice(0, 6);
    });
    
    setSelectedMotor(motor);
    setShowCelebration(true);
    
    const particles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: ['✨', '🎉', '⭐', '💚', '✅', '🚤'][i]
    }));
    setCelebrationParticles(particles);
    
    toast({
      title: pick([...canadianEncouragement.motorSelected]),
      description: `${motor.model} selected — let's continue, eh!`,
      duration: 2200
    });

    setTimeout(() => {
      setShowStickyBar(true);
    }, 500);
    
    setTimeout(() => {
      setShowCelebration(false);
      setCelebrationParticles([]);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p>{loadingText as string}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${showCelebration ? 'canadian-celebration' : ''}`}>
      {/* Mobile-Only Sticky Search and Filter Bar */}
      <div className="sticky top-[56px] z-30 bg-white border-b shadow-sm lg:hidden">
        <div className="p-3">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Input 
                type="search" 
                placeholder="Search HP"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-8 border rounded-lg text-sm"
              />
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Stock Toggle */}
            <label className="flex items-center gap-1 px-2 py-2 border rounded-lg cursor-pointer text-sm">
              <input 
                type="checkbox" 
                className="w-4 h-4"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>Stock</span>
            </label>
            
            {/* Filter Button */}
            <MobileFilterSheet 
              filters={{
                inStockOnly,
                hpRange: selectedHPRange === 'all' ? '' : selectedHPRange,
                engineType: selectedEngineType === 'all' ? '' : selectedEngineType
              }}
              onFiltersChange={(filters) => {
                setInStockOnly(filters.inStockOnly);
                setSelectedHPRange(filters.hpRange || 'all');
                setSelectedEngineType(filters.engineType || 'all');
              }}
            />
          </div>
        </div>
      </div>

      {/* Desktop Search and Filter Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border mb-6 hidden lg:block">
        <div className="container mx-auto px-4 py-3 space-y-3">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                type="search" 
                placeholder="Search motors by model or HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>
            
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm" 
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
          
          {/* In Stock Toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span className="text-sm font-medium whitespace-nowrap">In Stock Only</span>
            </label>
          </div>
          
          {/* HP Range Filter Tabs */}
          <div className="hp-filter-buttons flex gap-2 overflow-x-auto pb-2">
            {hpRanges.map(range => (
              <Button 
                key={range.key}
                variant={selectedHPRange === range.key ? 'default' : 'outline'}
                size="sm"
                className="hp-filter-button whitespace-nowrap rounded-full"
                onClick={() => setSelectedHPRange(range.key)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredMotors.length} motor{filteredMotors.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Motor Grid */}
      {filteredMotors.length === 0 ? (
        <Card className="p-12 text-center space-y-2">
          <div className="text-2xl">🍁</div>
          <p className="font-semibold">{emptyStateMessages.noResults.message}</p>
          <p className="text-muted-foreground">{emptyStateMessages.noResults.submessage}</p>
        </Card>
      ) : (
        <div className={`grid motors-grid items-stretch gap-2 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {filteredMotors.map(motor => {
            const msrp = motor.basePrice && motor.basePrice > 0 ? motor.basePrice : null;
            const sale = motor.salePrice && motor.salePrice > 0 ? motor.salePrice : null;
            const state = getPriceDisplayState(msrp, sale);
            const callForPrice = state.callForPrice;

            return (
              <Card 
                key={motor.id} 
                className={`motor-card bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                  selectedMotor?.id === motor.id ? 'ring-3 ring-green-500 shadow-xl shadow-green-500/20 scale-[1.02] motor-selected border-green-500' : 'hover:scale-[1.01] active:scale-[0.98]'
                } ${selectedMotor && selectedMotor.id !== motor.id ? 'opacity-70' : ''} ${
                  motor.stockStatus === 'Sold' ? 'opacity-50 cursor-not-allowed' : ''
                } flex flex-col`} 
                onClick={() => motor.stockStatus !== 'Sold' && handleMotorSelection(motor)}
              >
                {/* Stock Badge - Positioned on individual cards */}
                <div className="absolute top-2 right-2 z-20">
                  {motor.stockStatus === 'In Stock' && (
                    <span className="in-stock-badge px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      IN STOCK
                    </span>
                  )}
                  {motor.stockStatus === 'Out of Stock' && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      OUT OF STOCK
                    </span>
                  )}
                  {motor.stockStatus === 'On Order' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                      ON ORDER
                    </span>
                  )}
                  {motor.stockStatus === 'Sold' && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                      SOLD
                    </span>
                  )}
                </div>

                {/* Card Info Section */}
                <div className="p-3 space-y-2">
                  {/* Price - HUGE and BOLD */}
                  <div className="motor-price text-2xl font-black text-gray-900">
                    {callForPrice ? 'Call for Price' : `$${motor.price.toLocaleString()}`}
                  </div>
                  
                  {/* HP - Clear and prominent */}
                  <div className="motor-hp text-lg font-bold text-gray-700">
                    {motor.hp} HP
                  </div>
                  
                  {/* Model - More prominent with variations */}
                  <div className="motor-details space-y-1">
                    <div className="text-sm font-semibold text-gray-800 leading-tight">
                      {formatMotorTitle(motor.year, motor.model)}
                    </div>
                    {(() => {
                      const title = formatMotorTitle(motor.year, motor.model);
                      const subtitle = formatVariantSubtitle(motor.model, title);
                      return subtitle ? (
                        <div className="text-xs font-medium text-gray-600">
                          {subtitle}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  
                  {/* Monthly Payment Display */}
                  <MonthlyPaymentDisplay motorPrice={motor.price} />
                </div>

                {/* Motor Image */}
                {motor.image && motor.image !== '/placeholder.svg' && (
                  <div className="motor-card-image-container relative p-4 bg-gradient-to-b from-gray-50 to-white">
                    <img 
                      src={motor.image} 
                      alt={motor.model} 
                      loading="lazy" 
                      className="motor-card img w-full h-auto" 
                      style={{
                        height: '180px',
                        width: 'auto',
                        objectFit: 'contain',
                        maxWidth: 'none',
                        maxHeight: 'none'
                      }} 
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Celebration particles */}
      {celebrationParticles.map(particle => (
        <div 
          key={particle.id} 
          className="fixed pointer-events-none z-30 text-2xl animate-in zoom-in-50 fade-out-100 duration-2000" 
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Sticky Bottom Bar */}
      {showStickyBar && selectedMotor && selectedMotor.stockStatus !== 'Sold' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary/20 shadow-2xl p-4 z-40 lg:hidden backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Selected Motor Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-muted-foreground truncate">
                Selected Motor
              </div>
              <div className="text-lg font-bold text-foreground truncate">
                {selectedMotor.model} ({selectedMotor.hp} HP)
              </div>
              <div className="text-sm text-primary font-semibold">
                ${selectedMotor.price.toLocaleString()}
              </div>
            </div>
            
            {/* CTA Button */}
            <button 
              className="flex-1 max-w-48 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-3 px-6 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-all hover:shadow-xl"
              onClick={() => onStepComplete(selectedMotor)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Mobile spacer to prevent sticky CTA from covering content */}
      <div className="mobile-cta-spacer lg:hidden" />
    </div>
  );
}