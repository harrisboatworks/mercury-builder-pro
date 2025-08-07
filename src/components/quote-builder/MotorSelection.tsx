import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, Check, Star, Sparkles } from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Motor } from '../QuoteBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MotorFilters } from './MotorFilters';
import { useIsMobile } from '@/hooks/use-mobile';

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
  year: number;
  make: string;
}

interface Promotion {
  id: string;
  name: string;
  discount_percentage: number;
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
}

interface PromotionRule {
  id: string;
  promotion_id: string;
  rule_type: 'all' | 'model' | 'motor_type' | 'horsepower_range';
  model: string | null;
  motor_type: string | null;
  horsepower_min: number | null;
  horsepower_max: number | null;
}

interface MotorSelectionProps {
  onStepComplete: (motor: Motor) => void;
}

export const MotorSelection = ({ onStepComplete }: MotorSelectionProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [motors, setMotors] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [celebrationParticles, setCelebrationParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    priceRange: [0, 50000] as [number, number],
    hpRange: [2.5, 600] as [number, number]
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Load motors from database
  useEffect(() => {
    loadMotors();
  }, []);

  const loadMotors = async () => {
    try {
      const [{ data: motorRows, error: motorsError }, { data: promos, error: promosError }, { data: rules, error: rulesError }] = await Promise.all([
        supabase.from('motor_models').select('*').order('horsepower'),
        supabase.from('promotions').select('*'),
        supabase.from('promotions_rules').select('*')
      ]);

      if (motorsError) throw motorsError;
      if (promosError) throw promosError;
      if (rulesError) throw rulesError;

      const activePromos: Promotion[] = (promos as Promotion[] | null)?.filter(p => isPromotionActive(p)) || [];
      const promoRules: PromotionRule[] = (rules as PromotionRule[] | null) || [];

      // Transform database data to Motor interface with effective pricing
      const transformedMotors: Motor[] = (motorRows as DbMotor[] | null || []).map((m) => {
        const basePrice = Number(m.base_price || 0);
        const salePrice = m.sale_price != null ? Number(m.sale_price) : null;
        const original = salePrice && salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;

        const { effectivePrice, appliedPromotions, promoEndsAt, bonusOffers } = applyPromotions(m, original, activePromos, promoRules);
        const savings = Math.max(0, original - effectivePrice);

        return {
          id: m.id,
          model: m.model,
          hp: Number(m.horsepower),
          price: effectivePrice,
          image: m.image_url || '/placeholder.svg',
          stockStatus: m.availability === 'In Stock' ? 'In Stock' : m.availability === 'On Order' ? 'On Order' : 'Out of Stock',
          category: categorizeMotor(Number(m.horsepower)),
          type: m.motor_type,
          specs: `${m.engine_type || ''} ${m.year} ${m.make} ${m.model}`.trim(),
          basePrice,
          salePrice,
          originalPrice: original,
          savings,
          appliedPromotions,
          promoEndsAt,
          bonusOffers,
        };
      });

      setMotors(transformedMotors);
    } catch (error) {
      console.error('Error loading motors or promotions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory or promotions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const categorizeMotor = (hp: number): 'portable' | 'mid-range' | 'high-performance' | 'v8-racing' => {
    if (hp <= 20) return 'portable';
    if (hp <= 100) return 'mid-range';
    return 'v8-racing';
  };
  const isPromotionActive = (p: Promotion) => {
    const now = new Date();
    const startsOk = !p.start_date || new Date(p.start_date) <= now;
    const endsOk = !p.end_date || new Date(p.end_date) >= now;
    return p.is_active && startsOk && endsOk;
  };

  const ruleMatches = (m: DbMotor, r: PromotionRule) => {
    if (r.rule_type === 'all') return true;
    if (r.rule_type === 'model') return !!r.model && m.model.toLowerCase().includes(r.model.toLowerCase());
    if (r.rule_type === 'motor_type') return !!r.motor_type && m.motor_type.toLowerCase() === r.motor_type.toLowerCase();
    if (r.rule_type === 'horsepower_range') {
      const hp = Number(m.horsepower);
      const min = r.horsepower_min != null ? Number(r.horsepower_min) : -Infinity;
      const max = r.horsepower_max != null ? Number(r.horsepower_max) : Infinity;
      return hp >= min && hp <= max;
    }
    return false;
  };

  const applyPromotions = (
    m: DbMotor,
    startingPrice: number,
    promos: Promotion[],
    rules: PromotionRule[]
  ) => {
    const applicable = promos.filter((p) => {
      const prules = rules.filter((r) => r.promotion_id === p.id);
      if (prules.length === 0) return false; // must have at least one rule
      return prules.some((r) => ruleMatches(m, r));
    });

    let price = startingPrice;
    const applied: string[] = [];
    let endsAt: string | null = null;

    // Separate bonuses and discounts
    const bonusOnly = applicable
      .filter((p) => p.kind === 'bonus')
      .sort((a, b) => (b.highlight === a.highlight ? (b.priority - a.priority) : (b.highlight ? 1 : -1)));

    const discounts = applicable.filter((p) => p.kind !== 'bonus' && Number(p.discount_percentage) > 0);

    // Apply stackable discounts first
    const stackables = discounts.filter((p) => p.stackable);
    for (const p of stackables) {
      price = price * (1 - Number(p.discount_percentage) / 100);
      applied.push(p.name);
      if (p.end_date) {
        if (!endsAt || new Date(p.end_date) < new Date(endsAt)) endsAt = p.end_date;
      }
    }

    // Then best non-stackable discount
    const nonStackables = discounts.filter((p) => !p.stackable);
    if (nonStackables.length > 0) {
      const best = nonStackables.reduce((a, b) => (Number(a.discount_percentage) > Number(b.discount_percentage) ? a : b));
      price = price * (1 - Number(best.discount_percentage) / 100);
      applied.push(best.name);
      if (best.end_date) {
        if (!endsAt || new Date(best.end_date) < new Date(endsAt)) endsAt = best.end_date;
      }
    }

    // Collect bonus offers (do not change price)
    const bonusOffers = bonusOnly.map((b) => {
      if (b.end_date) {
        if (!endsAt || new Date(b.end_date) < new Date(endsAt)) endsAt = b.end_date;
      }
      applied.push(b.name);
      return {
        id: b.id,
        title: b.bonus_title || b.name,
        shortBadge: b.bonus_short_badge || (b.warranty_extra_years ? `+${b.warranty_extra_years}Y Warranty` : 'Bonus Offer'),
        description: b.bonus_description || null,
        warrantyExtraYears: b.warranty_extra_years || null,
        termsUrl: b.terms_url || null,
        highlight: !!b.highlight,
        endsAt: b.end_date || null,
        priority: b.priority || 0,
      };
    });

    return {
      effectivePrice: Math.round(price),
      appliedPromotions: applied,
      promoEndsAt: endsAt,
      bonusOffers,
    };
  };

  const updateInventory = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-inventory');
      
      if (error) throw error;
      
      toast({
        title: "Success", 
        description: `Updated ${data.count} motors from Harris Boat Works`,
      });
      
      // Reload motors after update
      await loadMotors();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const categories = [
    { key: 'all', label: 'All Motors', color: 'primary' },
    { key: 'portable', label: 'Portable (2.5-20hp)', color: 'portable' },
    { key: 'mid-range', label: 'Mid-Range (25-100hp)', color: 'mid-range' },
    { key: 'high-performance', label: 'High Performance (115-200hp)', color: 'high-performance' },
    { key: 'v8-racing', label: 'V8 & Racing (225-600hp)', color: 'v8-racing' }
  ];

  const filteredMotors = motors.filter(motor => {
    if (filters.category !== 'all' && motor.category !== filters.category) return false;
    if (filters.stockStatus !== 'all' && motor.stockStatus !== filters.stockStatus) return false;
    if (motor.price < filters.priceRange[0] || motor.price > filters.priceRange[1]) return false;
    if (motor.hp < filters.hpRange[0] || motor.hp > filters.hpRange[1]) return false;
    return true;
  });

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-500 text-white hover:bg-green-600';
      case 'On Order': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'Out of Stock': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getCategoryColor = (category: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (category) {
      case 'portable': return 'secondary';
      case 'mid-range': return 'outline';
      case 'high-performance': return 'default';
      case 'v8-racing': return 'destructive';
      default: return 'default';
    }
  };

  const handleMotorSelection = (motor: Motor) => {
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
      title: "🎉 Excellent Choice!",
      description: `${motor.model} selected - Let's continue!`,
      duration: 2000,
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
          <p>Loading motor inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <MotorFilters
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        resultsCount={filteredMotors.length}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      <div className="flex-1 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-12 w-auto" />
            <h2 className="text-3xl font-bold text-foreground">Select Your Mercury Outboard</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our current inventory of Mercury outboard motors. All prices and availability are updated from Harris Boat Works.
          </p>
          <Button 
            onClick={updateInventory} 
            disabled={updating}
            variant="outline"
            size="sm"
          >
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Inventory
              </>
            )}
          </Button>
        </div>

        {filteredMotors.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No motors found matching your filters.</p>
          </Card>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredMotors.map(motor => {
              const hasSale = !!(motor.salePrice && motor.basePrice && motor.salePrice < motor.basePrice);
              const hasBonus = !!(motor.bonusOffers && motor.bonusOffers.length > 0);
              const topBonus = hasBonus
                ? [...(motor.bonusOffers || [])].sort((a, b) => (b.highlight === a.highlight ? (b.priority - a.priority) : (b.highlight ? 1 : -1)))[0]
                : null;

              return (
                <Card 
                  key={motor.id}
                  className={`relative cursor-pointer transition-all duration-500 hover:shadow-lg group overflow-hidden ${
                    (selectedMotor?.id === motor.id) 
                      ? 'ring-3 ring-green-500 shadow-xl shadow-green-500/20 scale-[1.02] motor-selected border-green-500' 
                      : 'hover:scale-[1.01]'
                  } ${
                    selectedMotor && selectedMotor.id !== motor.id 
                      ? 'opacity-70' 
                      : ''
                  }`}
                  onClick={() => handleMotorSelection(motor)}
                >
                  {selectedMotor?.id === motor.id && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-green-500 text-white rounded-full p-2 shadow-lg animate-in zoom-in-50 duration-500">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  
                  {selectedMotor?.id === motor.id && (
                    <div className="absolute top-0 right-0 z-10">
                      <div className="bg-green-500 text-white px-4 py-1 text-xs font-bold transform rotate-45 translate-x-6 translate-y-2">
                        SELECTED
                      </div>
                    </div>
                  )}

                  {hasSale && (
                    <div className="absolute top-4 left-4 z-20">
                      <Badge className="bg-primary text-primary-foreground">SALE</Badge>
                    </div>
                  )}
                  {!hasSale && motor.appliedPromotions && motor.appliedPromotions.length > 0 && (
                    <div className="absolute top-4 left-4 z-20">
                      <Badge variant="outline">PROMO</Badge>
                    </div>
                  )}
                  {!hasSale && !motor.appliedPromotions?.length && hasBonus && topBonus && (
                    <div className="absolute top-4 left-4 z-20">
                      <Badge className="bg-secondary text-secondary-foreground">
                        {topBonus.shortBadge || 'BONUS'}
                      </Badge>
                    </div>
                  )}

                  <div className="p-6 space-y-4 relative">
                    <div className="flex items-start justify-between">
                      <Badge variant={getCategoryColor(motor.category)}>
                        {motor.hp}HP
                      </Badge>
                      <Badge className={getStockBadgeColor(motor.stockStatus)}>
                        {motor.stockStatus}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">{motor.model}</h3>
                      <p className="text-muted-foreground text-sm">{motor.specs}</p>
                    </div>

                    {motor.image && motor.image !== '/placeholder.svg' && (
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={motor.image} 
                          alt={motor.model}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {hasBonus && (
                      <div className="flex flex-wrap gap-2">
                        {(motor.bonusOffers || []).slice(0, 2).map((b) => (
                          <Badge key={b.id} variant="outline" className="border-secondary text-secondary-foreground">
                            {b.shortBadge || b.title}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                      <div className="space-y-1">
                        {motor.savings && motor.savings > 0 ? (
                          <>
                            <p className="text-sm line-through text-muted-foreground">
                              ${motor.originalPrice?.toLocaleString()}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              ${motor.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              You save ${Math.round(motor.savings).toLocaleString()} {motor.promoEndsAt ? `• Ends in ${Math.max(0, Math.ceil((new Date(motor.promoEndsAt).getTime() - Date.now())/86400000))}d` : ''}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-foreground">
                              ${motor.price.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">CAD</p>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <img src="/lovable-uploads/29fca629-fbe7-44e9-ab71-703477b2c852.png" alt="Mercury outboard logo" className="w-5 h-5 object-contain" loading="lazy" />
                          <span className="text-sm font-medium text-muted-foreground">{motor.type}</span>
                        </div>
                        {motor.appliedPromotions && motor.appliedPromotions.length > 0 && (
                          <div className="text-xs text-primary">{motor.appliedPromotions.join(' + ')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectedMotor && !showStickyBar && (
          <div className="flex justify-center pt-8 animate-in slide-in-from-bottom-4 duration-500">
            <Button 
              onClick={() => onStepComplete(selectedMotor)}
              className="btn-primary px-8 animate-pulse"
            >
              Continue with {selectedMotor.model}
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {showStickyBar && selectedMotor && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-background/95 backdrop-blur-lg border-t-4 border-green-500 shadow-2xl">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                      🎉 Excellent Choice!
                    </p>
                    <p className="font-bold text-lg">
                      {selectedMotor.model} - ${selectedMotor.price.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedMotor(null);
                      setShowStickyBar(false);
                    }}
                  >
                    Change Selection
                  </Button>
                  <Button 
                    onClick={() => onStepComplete(selectedMotor)}
                    className="btn-primary px-6 animate-pulse-green shadow-lg bg-green-600 hover:bg-green-700"
                  >
                    Continue to Boat Info
                    <Zap className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStickyBar && selectedMotor && isMobile && (
        <div className="fixed bottom-20 right-4 z-40 animate-in zoom-in-50 duration-500">
          <Button 
            onClick={() => onStepComplete(selectedMotor)}
            className="rounded-full w-14 h-14 shadow-2xl bg-green-600 hover:bg-green-700 animate-bounce"
          >
            <Check className="w-6 h-6" />
          </Button>
        </div>
      )}

      {celebrationParticles.map(particle => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-30 text-2xl animate-in zoom-in-50 fade-out-100 duration-2000"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${Math.random() * 500}ms`,
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {showCelebration && selectedMotor && (
        <div className="fixed top-4 right-4 z-40 animate-in slide-in-from-right-5 duration-500">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">Great Choice!</span>
            <Star className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
};
