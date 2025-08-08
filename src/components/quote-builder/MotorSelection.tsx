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
}

interface PromotionRule {
  id: string;
  promotion_id: string;
  rule_type: 'all' | 'model' | 'motor_type' | 'horsepower_range';
  model: string | null;
  motor_type: string | null;
  horsepower_min: number | null;
  horsepower_max: number | null;
  // NEW: rule-level discount overrides
  discount_percentage: number;
  discount_fixed_amount: number;
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

  // Realtime updates for promotions changes
  useEffect(() => {
    const channel = supabase
      .channel('promos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        loadMotors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions_rules' }, () => {
        loadMotors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    // Include promos that have either promo-level discount OR a rule-level override for this motor
    const discounts = applicable.filter((p) => {
      const matchingRules = rules
        .filter((r) => r.promotion_id === p.id)
        .filter((r) => ruleMatches(m, r));
      const hasRuleOverride = matchingRules.some(
        (r) => Number(r.discount_percentage) > 0 || Number(r.discount_fixed_amount) > 0
      );
      return p.kind !== 'bonus' && (
        Number(p.discount_percentage) > 0 ||
        Number(p.discount_fixed_amount) > 0 ||
        hasRuleOverride
      );
    });

    const calcAfter = (current: number, fixed: number, pct: number) => {
      let result = current;
      if (Number(fixed) > 0) result = Math.max(0, result - Number(fixed));
      if (Number(pct) > 0) result = result * (1 - Number(pct) / 100);
      return result;
    };

    const bestPriceForPromo = (current: number, promo: Promotion) => {
      const matchingRules = rules
        .filter((r) => r.promotion_id === promo.id)
        .filter((r) => ruleMatches(m, r));

      // Default to promo-level if no matching rules (shouldn't happen due to applicable filter)
      let best = calcAfter(current, Number(promo.discount_fixed_amount) || 0, Number(promo.discount_percentage) || 0);

      for (const r of matchingRules) {
        const hasOverride = (Number(r.discount_fixed_amount) > 0 || Number(r.discount_percentage) > 0);
        const fixed = hasOverride ? Number(r.discount_fixed_amount) || 0 : Number(promo.discount_fixed_amount) || 0;
        const pct = hasOverride ? Number(r.discount_percentage) || 0 : Number(promo.discount_percentage) || 0;
        const candidate = calcAfter(current, fixed, pct);
        if (candidate < best) best = candidate;
      }
      return best;
    };

    // Apply stackable discounts first (using best rule-level or promo-level value)
    const stackables = discounts.filter((p) => p.stackable);
    for (const p of stackables) {
      const newPrice = bestPriceForPromo(price, p);
      price = newPrice;
      applied.push(p.name);
      if (p.end_date) {
        if (!endsAt || new Date(p.end_date) < new Date(endsAt)) endsAt = p.end_date;
      }
    }

    // Then best non-stackable discount
    const nonStackables = discounts.filter((p) => !p.stackable);
    if (nonStackables.length > 0) {
      let best: Promotion | null = null;
      let bestPrice = price;
      for (const p of nonStackables) {
        const candidate = bestPriceForPromo(price, p);
        if (!best || candidate < bestPrice) {
          best = p;
          bestPrice = candidate;
        }
      }
      if (best) {
        price = bestPrice;
        applied.push(best.name);
        if (best.end_date) {
          if (!endsAt || new Date(best.end_date) < new Date(endsAt)) endsAt = best.end_date;
        }
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

    // Gamified promotion toast (if any promos apply)
    const hasSale = motor.stockStatus === 'In Stock' && motor.salePrice != null && motor.basePrice != null && (motor.salePrice as number) < (motor.basePrice as number);
    const savings = hasSale ? ((motor.basePrice as number) - (motor.salePrice as number)) : 0;
    const hasWarrantyBonus = (motor.bonusOffers || []).some(b => !!b.warrantyExtraYears && b.warrantyExtraYears > 0);

    if (hasSale || hasWarrantyBonus) {
      toast({
        title: "Promotions applied",
        description: (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {hasWarrantyBonus && (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold animate-fade-in">
                <span className="mr-1">🛡️</span> Warranty bonus active
              </span>
            )}
            {hasSale && (
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold animate-fade-in" style={{ animationDelay: '120ms' }}>
                <span className="mr-1">💰</span> Save ${savings.toLocaleString()} applied
              </span>
            )}
          </div>
        ),
        duration: 2600,
      });
    }

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
              const hasSale = motor.stockStatus === 'In Stock' && motor.salePrice != null && motor.basePrice != null && motor.salePrice < motor.basePrice;
              const hasBonus = !!(motor.bonusOffers && motor.bonusOffers.length > 0);
              const topBonus = hasBonus
                ? [...(motor.bonusOffers || [])].sort((a, b) => (b.highlight === a.highlight ? (b.priority - a.priority) : (b.highlight ? 1 : -1)))[0]
                : null;

              // Per-card promo parsing (case/whitespace tolerant)
              const promoBlob = `${(motor.appliedPromotions || []).join(' ')} ${(motor.bonusOffers || []).map(b => `${b.title ?? ''} ${b.shortBadge ?? ''}`).join(' ')}`;
              const hasGet5 = /(mercury\s*)?(get\s*5|get5|5\s*year)/i.test(promoBlob);
              const hasRepower = /(repower(\s*rebate)?)/i.test(promoBlob);
              const warrantyBonus = (motor.bonusOffers || []).find(b => (b.warrantyExtraYears || 0) > 0);
              const showWarrantyBadge = hasGet5 || !!warrantyBonus;
              const otherPromoNames = (motor.appliedPromotions || []).filter(name => {
                const t = name.toLowerCase();
                if (/(mercury\s*)?(get\s*5|get5|5\s*year)/i.test(t)) return false;
                if (/(repower(\s*rebate)?)/i.test(t)) return false;
                return true;
              });

              return (
                <Card 
                  key={motor.id}
                  className={`product-card relative cursor-pointer transition-all duration-500 hover:shadow-lg group overflow-hidden ${
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

                    <div className="flex items-center justify-between pt-4">
                      <div className="space-y-1">
                        {hasSale ? (
                          <>
                            <p className="text-sm line-through text-muted-foreground">
                              ${motor.basePrice?.toLocaleString()}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                              ${motor.salePrice?.toLocaleString()}
                            </p>
                            <div className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              Save ${((motor.basePrice || 0) - (motor.salePrice || 0)).toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-foreground">
                              ${(motor.salePrice || motor.basePrice || motor.price).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <img src="/lovable-uploads/29fca629-fbe7-44e9-ab71-703477b2c852.png" alt="Mercury outboard logo" className="w-5 h-5 object-contain" loading="lazy" />
                          <span className="text-sm font-medium text-muted-foreground">{motor.type}</span>
                        </div>
                        {otherPromoNames.length > 0 && (
                          <div className="text-xs text-primary">{otherPromoNames.join(' + ')}</div>
                        )}
                      </div>
                    </div>

                    {(hasGet5 || hasRepower) && (
                      <div className="promo-badges flex justify-center mt-3">
                        {hasGet5 && (
                          <span className="promo-badge-base promo-badge-warranty badge" aria-label="5 Year Warranty">
                            <span className="mr-1">🛡️</span>
                            <span>{warrantyBonus?.shortBadge || '5 Year Warranty'}</span>
                          </span>
                        )}
                        {hasRepower && (
                          <span className="badge badge--shimmer" data-badge="repower" aria-label="Repower Rebate Promo">
                            <svg className="badge__icon" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 2l3 6 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 8.9 9 8z" fill="currentColor"/>
                            </svg>
                            <span className="badge__text">Repower Rebate Promo</span>
                          </span>
                        )}
                      </div>
                    )}
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
                    <div className="flex gap-2 mt-1">
                      {selectedMotor.stockStatus === 'In Stock' && selectedMotor.salePrice != null && selectedMotor.basePrice != null && (selectedMotor.salePrice as number) < (selectedMotor.basePrice as number) && (
                        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold animate-fade-in">
                          <span className="mr-1">💰</span> Save ${((selectedMotor.basePrice as number) - (selectedMotor.salePrice as number)).toLocaleString()}
                        </span>
                      )}
                      {selectedMotor.bonusOffers?.some(b => !!b.warrantyExtraYears && b.warrantyExtraYears > 0) && (
                        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold animate-fade-in" style={{ animationDelay: '120ms' }}>
                          <span className="mr-1">🛡️</span> Warranty bonus active
                        </span>
                      )}
                    </div>
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
