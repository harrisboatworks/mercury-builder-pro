import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Database types (matching original MotorSelection.tsx)
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

function hpToNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (typeof v === "number" ? v : NaN);
  return Number.isFinite(n) ? n : 0;
}

const HP_BUCKETS = [
  { id: "all", label: "All HP", test: (_:number)=>true },
  { id: "2_20", label: "2.5–20 HP", test: (hp:number)=>hp>=2.5 && hp<=20 },
  { id: "25_60", label: "25–60 HP", test: (hp:number)=>hp>=25 && hp<=60 },
  { id: "75_150", label: "75–150 HP", test: (hp:number)=>hp>=75 && hp<=150 },
  { id: "175_300", label: "175–300 HP", test: (hp:number)=>hp>=175 && hp<=300 },
  { id: "350p", label: "350+ HP", test: (hp:number)=>hp>=350 },
];

// Promotion detection utilities (from original)
const isPromotionActive = (promo: Promotion): boolean => {
  if (!promo.is_active) return false;
  const now = new Date();
  const start = promo.start_date ? new Date(promo.start_date) : null;
  const end = promo.end_date ? new Date(promo.end_date) : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
};

const applyPromotions = (motor: DbMotor, promotions: Promotion[], rules: PromotionRule[]) => {
  const basePrice = Number(motor.base_price || 0);
  const salePrice = motor.sale_price != null ? Number(motor.sale_price) : null;
  const originalPrice = salePrice && salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
  
  let effectivePrice = originalPrice;
  const appliedPromotions: string[] = [];
  const bonusOffers: any[] = [];
  
  // Apply matching promotions
  for (const promo of promotions) {
    const matchingRules = rules.filter(r => r.promotion_id === promo.id);
    
    for (const rule of matchingRules) {
      let matches = false;
      
      if (rule.rule_type === 'all') {
        matches = true;
      } else if (rule.rule_type === 'model' && rule.model === motor.model) {
        matches = true;
      } else if (rule.rule_type === 'motor_type' && rule.motor_type === motor.motor_type) {
        matches = true;
      } else if (rule.rule_type === 'horsepower_range') {
        const hp = motor.horsepower;
        const min = rule.horsepower_min || 0;
        const max = rule.horsepower_max || 9999;
        matches = hp >= min && hp <= max;
      }
      
      if (matches) {
        if (promo.kind === 'discount') {
          const ruleDiscount = rule.discount_fixed_amount || (effectivePrice * (rule.discount_percentage / 100));
          effectivePrice -= ruleDiscount;
          appliedPromotions.push(promo.name);
        } else if (promo.kind === 'bonus') {
          bonusOffers.push({
            id: promo.id,
            title: promo.bonus_title || promo.name,
            shortBadge: promo.bonus_short_badge,
            description: promo.bonus_description,
            warrantyExtraYears: promo.warranty_extra_years,
            termsUrl: promo.terms_url,
            highlight: promo.highlight,
            endsAt: promo.end_date,
            priority: promo.priority,
            image_url: promo.image_url,
            image_alt_text: promo.image_alt_text
          });
        }
        break;
      }
    }
  }
  
  return {
    effectivePrice: Math.max(0, effectivePrice),
    appliedPromotions,
    bonusOffers,
    originalPrice,
    savings: originalPrice - effectivePrice
  };
};

export default function MotorSelectionPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  
  // Data state (matching original MotorSelection.tsx exactly)
  const [motors, setMotors] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  
  // UI filter state
  const [hpBucket, setHpBucket] = useState<string>("all");
  const [stockOnly, setStockOnly] = useState<boolean>(false);

  // Load motors from database (exact same logic as original)
  const loadMotors = async () => {
    try {
      const [
        { data: motorRows, error: motorsError },
        { data: promos, error: promosError },
        { data: rules, error: rulesError }
      ] = await Promise.all([
        supabase.from('motor_models').select('*').order('horsepower'),
        supabase.from('promotions').select('*'),
        supabase.from('promotions_rules').select('*')
      ]);

      if (motorsError) throw motorsError;
      if (promosError) throw promosError;
      if (rulesError) throw rulesError;

      const activePromos: Promotion[] = (promos as Promotion[] | null)?.filter(p => isPromotionActive(p)) || [];
      const promoRules: PromotionRule[] = rules as PromotionRule[] | null || [];

      // Filter out Jet models and cap horsepower at 300 (matching original)
      const filteredMotorRows = (motorRows as DbMotor[] | null || []).filter(m => {
        const isJetModel = m.model.toLowerCase().includes('jet');
        const isOverHpLimit = m.horsepower > 300;
        return !isJetModel && !isOverHpLimit;
      });

      // Transform database data to Motor interface with effective pricing (matching original)
      const transformedMotors: Motor[] = filteredMotorRows.map(m => {
        const { effectivePrice, appliedPromotions, bonusOffers, originalPrice, savings } = applyPromotions(m, activePromos, promoRules);
        
        // Determine category based on HP (matching original logic)
        let category: Motor['category'] = 'mid-range';
        if (m.horsepower <= 30) category = 'portable';
        else if (m.horsepower >= 200) category = 'high-performance';
        else if (m.horsepower >= 350) category = 'v8-racing';
        
        // Stock status mapping (matching original)
        let stockStatus: Motor['stockStatus'] = 'In Stock';
        if (m.availability === 'On Order') stockStatus = 'On Order';
        else if (m.availability === 'Order Now') stockStatus = 'Order Now';
        else if (m.availability === 'Sold') stockStatus = 'Sold';

        return {
          id: m.id,
          model: m.model,
          year: m.year,
          hp: m.horsepower,
          price: effectivePrice,
          image: m.image_url || '',
          stockStatus,
          stockNumber: m.stock_number,
          category,
          type: m.motor_type,
          specs: '', // Not used in premium UI
          basePrice: Number(m.base_price || 0),
          salePrice: m.sale_price,
          originalPrice,
          savings,
          appliedPromotions,
          bonusOffers,
          specifications: m.specifications,
          features: m.features,
          description: m.description,
          detailUrl: m.detail_url
        };
      });

      setMotors(transformedMotors);
    } catch (error) {
      console.error('Error loading motors:', error);
    } finally {
      setLoading(false);
    }
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
    
    loadMotors();
  }, []);

  // Filter motors based on UI state
  const bucket = HP_BUCKETS.find(b => b.id === hpBucket) ?? HP_BUCKETS[0];
  let filtered = motors.filter(m => bucket.test(hpToNum(m.hp)));

  if (stockOnly) {
    filtered = filtered.filter(m => m.stockStatus === 'In Stock');
  }

  // Reset helper
  const showReset = filtered.length === 0 && motors.length > 0;

  // Motor selection handler
  const handleMotorSelect = (motor: Motor) => {
    setSelectedMotor(motor);
  };

  const handleContinue = () => {
    if (selectedMotor) {
      dispatch({ type: 'SET_MOTOR', payload: selectedMotor });
      dispatch({ type: 'COMPLETE_STEP', payload: 1 });
      navigate('/quote/purchase-path');
    }
  };

  // UI Components
  function Tag({label, active, onClick}:{label:string;active?:boolean;onClick:()=>void}) {
    return (
      <button onClick={onClick}
        className={`rounded-full border px-3 py-1 text-sm transition-all ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300 hover:border-slate-400"}`}>
        {label}
      </button>
    );
  }

  function MotorCard({m, selected, onSelect}:{m:Motor; selected?:boolean; onSelect:()=>void}) {
    const msrp = m.originalPrice && m.originalPrice > m.price ? m.originalPrice : undefined;
    const promoText = m.bonusOffers?.[0]?.shortBadge || (m.appliedPromotions?.length ? m.appliedPromotions[0] : null);

    return (
      <button onClick={onSelect} aria-pressed={selected}
        className={`text-left w-full rounded-2xl border p-4 transition-all hover:shadow-sm ${selected ? "border-blue-600 ring-2 ring-blue-600/15 bg-blue-50/50 dark:bg-blue-950/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}>
        
        <div className="aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
          {m.image ? <img src={m.image} alt={m.model} className="w-full h-full object-contain" /> : null}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">
              {m.model.replace(/ - \d+(\.\d+)?HP$/i, '')}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              m.stockStatus === 'In Stock' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
            }`}>
              {m.stockStatus}
            </span>
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {m.hp} HP
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {msrp && (
                <span className="text-sm text-slate-500 line-through">
                  ${msrp.toLocaleString()}
                </span>
              )}
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                ${m.price.toLocaleString()}
              </span>
            </div>
          </div>
          
          {promoText && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {promoText}
            </div>
          )}
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        <header className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-[28px] font-semibold text-slate-900 dark:text-white">Select Your Mercury Motor</div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Loading motors...</p>
        </header>
      </div>
    );
  }

  // Main render
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <header className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="text-[28px] font-semibold text-slate-900 dark:text-white">Select Your Mercury Motor</div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">All motors include current promotions and live pricing.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {HP_BUCKETS.map(b => (
            <Tag key={b.id} label={b.label} active={hpBucket===b.id} onClick={()=>setHpBucket(b.id)} />
          ))}
          <div className="ml-auto flex items-center space-x-2">
            <Switch 
              id="in-stock-only"
              checked={stockOnly}
              onCheckedChange={setStockOnly}
            />
            <Label htmlFor="in-stock-only" className="text-sm">
              In Stock Only
            </Label>
          </div>
        </div>
      </header>

      {showReset && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          No motors match your current filters.
          <button
            className="ml-3 rounded-full border border-amber-300 px-3 py-1 text-xs hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
            onClick={()=>{ setHpBucket("all"); setStockOnly(false); }}
          >
            Show all motors
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <MotorCard
            key={m.id}
            m={m}
            selected={selectedMotor?.id === m.id}
            onSelect={()=>handleMotorSelect(m)}
          />
        ))}
      </section>

      {/* Sticky Continue Button */}
      <div className="sticky bottom-4 z-10">
        <button
          disabled={!selectedMotor}
          onClick={handleContinue}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white shadow-sm disabled:opacity-50 hover:bg-blue-700 transition-colors text-base font-medium"
        >
          Continue with {selectedMotor ? selectedMotor.model.replace(/ - \d+(\.\d+)?HP$/i, '') : 'Selected Motor'}
        </button>
      </div>
    </div>
  );
}