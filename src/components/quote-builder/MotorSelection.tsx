import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, Check, Star, Sparkles, Eye, Scale } from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Motor } from '../QuoteBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MotorFilters } from './MotorFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getPriceDisplayState } from '@/lib/pricing';
import { formatVariantSubtitle, formatMotorTitle } from '@/lib/card-title';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { canadianEncouragement, loadingMessages, comparisonHumor, emptyStateMessages, friendlyErrors } from '@/lib/canadian-messages';

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
  // New enhanced fields
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

// Shared promotions detection (single source for modal + banner)
const PROMO_MAP = [
  { key: 'get5', test: /(mercury\s*)?(get\s*5|get5|5\s*year(\s*warranty)?)/i, label: 'Warranty bonus active' },
  { key: 'repower', test: /(repower\s*rebate|repower)/i, label: 'Repower Rebate Promo active' },
] as const;

type PromoKey = typeof PROMO_MAP[number]['key'];

const REPOWER_INFO_URL = 'https://www.mercurymarine.com/en/us/engines/outboard/promotions/';

const detectPromoKeysFromText = (text?: string | null): PromoKey[] => {
  if (!text) return [];
  const keys = new Set<PromoKey>();
  PROMO_MAP.forEach(p => { if (p.test.test(text || '')) keys.add(p.key as PromoKey); });
  return Array.from(keys);
};

const getPromoKeysForMotor = (motor: Motor): PromoKey[] => {
  const parts: string[] = [];
  (motor.appliedPromotions || []).forEach(s => parts.push(String(s)));
  (motor.bonusOffers || []).forEach(b => {
    if (b?.title) parts.push(String(b.title));
    if (b?.shortBadge) parts.push(String(b.shortBadge));
    if (b?.warrantyExtraYears && b.warrantyExtraYears > 0) parts.push(`${b.warrantyExtraYears} Year Warranty`);
  });
  const blob = parts.join(' ');
  const set = new Set<PromoKey>();
  detectPromoKeysFromText(blob).forEach(k => set.add(k));
  parts.forEach(s => detectPromoKeysFromText(s).forEach(k => set.add(k)));
  if ((motor.bonusOffers || []).some(b => !!b.warrantyExtraYears && b.warrantyExtraYears > 0)) set.add('get5');
  return Array.from(set);
};

const getPromoLabelsForMotor = (motor: Motor): string[] => {
  const keys = getPromoKeysForMotor(motor);
  return keys.map(k => PROMO_MAP.find(p => p.key === k)?.label || k);
};

const decodeModelName = (modelName: string) => {
  type Item = { code: string; meaning: string; benefit: string };
  const decoded: Item[] = [];
  const name = modelName || '';
  const upper = name.toUpperCase();
  const added = new Set<string>();
  const add = (code: string, meaning: string, benefit: string) => {
    if (!added.has(code)) {
      decoded.push({ code, meaning, benefit });
      added.add(code);
    }
  };
  const hasWord = (w: string) => new RegExp(`\\b${w}\\b`).test(upper);
  const hpMatch = upper.match(/(\d+(?:\.\d+)?)HP/);
  const hp = hpMatch ? parseFloat(hpMatch[1]) : 0;

  // Engine family & special designations
  if (/FOUR\s*STROKE|FOURSTROKE/i.test(name)) add('FourStroke', '4-Stroke Engine', 'Quiet, fuel-efficient, no oil mixing');
  if (/SEAPRO/i.test(name)) add('SeaPro', 'Commercial Grade', 'Built for heavy use & durability');
  if (/PROKICKER/i.test(name)) add('ProKicker', 'Kicker Motor', 'Optimized for trolling & backup power');
  if (/JET\b/i.test(name)) add('Jet', 'Jet Drive', 'Great for shallow water operation');
  if (/BIGFOOT/i.test(name)) add('BigFoot', 'High Thrust', 'Ideal for pontoons & heavy boats');

  // Multi-part combos (match first to avoid partial overlaps)
  if (upper.includes('ELHPT')) { add('E','Electric Start','Push-button start'); add('L','Long Shaft (20\")','Standard transom height'); add('H','Tiller Handle','Direct steering control'); add('PT','Power Tilt','Easy motor lifting'); }
  if (upper.includes('ELXPT') || upper.includes('EXLPT')) { add('E','Electric Start','Push-button start'); add('XL','Extra Long Shaft (25\")','For 25\" transom boats'); add('PT','Power Trim & Tilt','Adjust angle on the fly'); }
  if (upper.includes('ELPT')) { add('E','Electric Start','Push-button convenience'); add('L','Long Shaft (20\")','For 20\" transom boats'); add('PT','Power Trim & Tilt','Adjust angle on the fly'); }
  if (upper.includes('MLH')) { add('M','Manual Start','Pull cord — simple & reliable'); add('L','Long Shaft (20\")','For 20\" transom boats'); add('H','Tiller Handle','Steer directly from motor'); }
  if (upper.includes('MH')) { add('M','Manual Start','Pull cord — simple & reliable'); add('H','Tiller Handle','Steer directly from motor'); }
  if (upper.includes('EH')) { add('E','Electric Start','Push-button convenience'); add('H','Tiller Handle','Direct steering control'); }

  // Steering and control
  if (hasWord('RC') || upper.includes('ERC')) add('RC','Remote Control','Steering wheel & console controls');
  if (hp >= 40 && !added.has('RC')) add('RC','Remote Control','Steering wheel & console controls');
  // Command Thrust
  if (hasWord('CT') || /COMMAND\s*THRUST/i.test(name)) add('CT','Command Thrust','Larger gearcase & prop for superior control');

  // Shaft length (check longer tokens first)
  if (hasWord('XXL') || hasWord('XX')) add('XX','Ultra Long Shaft (30\")','For 30\" transom boats');
  else if (hasWord('XL') || (hasWord('X') && !hasWord('XX'))) add('XL','Extra Long Shaft (25\")','For 25\" transom boats');
  else if (hasWord('L')) add('L','Long Shaft (20\")','For 20\" transom boats');
  else if (hasWord('S')) add('S','Short Shaft (15\")','For 15\" transom boats');

  // Features / technology
  if (hasWord('PT')) add('PT','Power Trim & Tilt','Adjust motor angle on the fly');
  if (hasWord('T')) add('T','Power Tilt','Easy motor lifting');
  if (hasWord('GA')) add('GA','Gas Assist Tilt','Lighter effort when tilting');
  if (hasWord('EFI')) add('EFI','Electronic Fuel Injection','Reliable starting & efficiency');
  if (hasWord('DTS')) add('DTS','Digital Throttle & Shift','Smooth precise electronic controls');
  if (hasWord('PXS') || /PROXS/i.test(name)) add('PXS','ProXS (High Performance)','Sport-tuned for acceleration');

  // Single flags
  if (hasWord('EL')) add('EL','Electric Start','Push-button convenience');
  if (hasWord('E') && !added.has('E')) add('E','Electric Start','Push-button convenience');
  if (hasWord('M') && !added.has('M')) add('M','Manual Start','Pull cord — simple & reliable');
  if (hp <= 30 && hasWord('H') && !added.has('H')) add('H','Tiller Handle','Steer directly from motor');

  return decoded;
};

interface MotorSelectionProps {
  onStepComplete: (motor: Motor) => void;
  noSalePriceLayout?: 'default' | 'placeholder' | 'centered';
  imageSizingMode?: 'current' | 'taller' | 'scale-msrp' | 'v2' | 'uniform-112';
}

export const MotorSelection = ({ onStepComplete, noSalePriceLayout = 'placeholder', imageSizingMode = 'uniform-112' }: MotorSelectionProps) => {
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
const [bannerPromosOpen, setBannerPromosOpen] = useState(false);
// Phase 1 scaffolding & features
const [selectionMode, setSelectionMode] = useState<'browse' | 'compare'>('browse');
const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
const [showRebateModal, setShowRebateModal] = useState(false);
const [quickViewMotor, setQuickViewMotor] = useState<Motor | null>(null);
const [recentlyViewed, setRecentlyViewed] = useState<Motor[]>([]);
const [showComparePanel, setShowComparePanel] = useState(false);
const debugPricing = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';
const [quickViewLoading, setQuickViewLoading] = useState(false);

// Allow URL param override for the no-sale price layout only on staging routes
const isStagingRoute = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/staging');
const urlLayout = isStagingRoute ? new URLSearchParams(window.location.search).get('noSalePriceLayout') : null;
const paramNoSaleLayout: 'placeholder' | 'centered' | null =
  urlLayout === 'placeholder' || urlLayout === 'centered' ? (urlLayout as 'placeholder' | 'centered') : null;
const effectiveNoSaleLayout: 'default' | 'placeholder' | 'centered' =
  (paramNoSaleLayout as any) ?? noSalePriceLayout;

// Staging-only image sizing override via ?imgMode=current|taller|scale-msrp|v2|uniform-112
const urlImgMode = isStagingRoute ? new URLSearchParams(window.location.search).get('imgMode') : null;
const paramImgMode: 'current' | 'taller' | 'scale-msrp' | 'v2' | 'uniform-112' | null =
  urlImgMode === 'taller' || urlImgMode === 'scale-msrp' || urlImgMode === 'current' || urlImgMode === 'v2' || urlImgMode === 'uniform-112' ? (urlImgMode as any) : null;
const effectiveImageSizingMode: 'current' | 'taller' | 'scale-msrp' | 'v2' | 'uniform-112' =
  (paramImgMode as any) ?? imageSizingMode;

const navigate = useNavigate();

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const loadingText = useMemo<string>(() => pick(loadingMessages as readonly string[]), []);

const track = (name: string, payload: Record<string, any>) => {
  try { (window as any).analytics?.track?.(name, payload); } catch {}
  console.log('[analytics]', name, payload);
};

// Automatic inventory refresh state
const [lastInventoryUpdate, setLastInventoryUpdate] = useState<string | null>(
  typeof localStorage !== 'undefined' ? localStorage.getItem('lastInventoryUpdate') : null
);

const needsInventoryUpdate = () => {
  if (!lastInventoryUpdate) return true;
  const last = new Date(lastInventoryUpdate);
  const now = new Date();
  const hours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  return hours >= 24;
};

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (hours < 48) return 'Yesterday';
  return `${Math.floor(hours / 24)} days ago`;
};

// Auto-update on load and check hourly
useEffect(() => {
  const checkAndUpdateInventory = async () => {
    try {
      if (needsInventoryUpdate()) {
        await updateInventory();
      }
    } catch (e) {
      console.warn('Auto inventory update skipped:', e);
    }
  };

  checkAndUpdateInventory();
  const interval = setInterval(checkAndUpdateInventory, 60 * 60 * 1000);
  return () => clearInterval(interval);
}, []);

// One-off manual scrape trigger via query param
useEffect(() => {
  const run = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('runScrape') === '1';
  if (run) {
    console.log('[inventory] Manual scrape requested via ?runScrape=1');
    updateInventory();
  }
}, []);

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
          year: m.year,
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
          // Enhanced fields
          specifications: (m.specifications as Record<string, any> | null) || {},
          features: Array.isArray(m.features) ? (m.features as string[]) : [],
          description: m.description || null,
          detailUrl: m.detail_url || null,
        };
      });

      // Debug-only: simulate a few discounted items so card UI can be verified
      const simulatedMotors: Motor[] = (() => {
        if (!debugPricing) return transformedMotors;
        const arr = [...transformedMotors];
        const discounts = [0.15, 0.10, 0.08]; // 15%, 10%, 8%
        let applied = 0;
        for (let i = 0; i < arr.length && applied < discounts.length; i++) {
          const m = arr[i];
          if (m.basePrice && m.basePrice > 0) {
            const sale = Math.max(1, Math.round(m.basePrice * (1 - discounts[applied])));
            arr[i] = { ...m, salePrice: sale };
            applied++;
          }
        }
        return arr;
      })();

      setMotors(simulatedMotors);
    } catch (error) {
      console.error('Error loading motors or promotions:', error);
      toast({
        title: 'Network hiccup, eh?',
        description: friendlyErrors.networkError,
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

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
  const deriveVariant = (raw: string, title: string) => {
    if (!raw) return '';
    let v = ` ${raw} `;
    const removeTokens = new Set([...tokenize(title), 'mercury']);
    removeTokens.forEach(t => {
      v = v.replace(new RegExp(`\\b${escapeRegExp(t)}\\b`, 'gi'), ' ');
    });
    v = v.replace(/\s+/g, ' ').replace(/[\s,;:–-]+$/g, '').replace(/^[\s,;:–-]+/g, '').trim();
    // If what's left is too short or duplicates the model words, hide
    return v;
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

      // Reload motors after update
      await loadMotors();

      // Save last update timestamp
      const nowIso = new Date().toISOString();
      try {
        localStorage.setItem('lastInventoryUpdate', nowIso);
      } catch {}
      setLastInventoryUpdate(nowIso);

      toast({
        title: 'Success',
        description: `Updated ${data?.count ?? ''} motors from Harris Boat Works`,
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to update inventory',
        variant: 'destructive',
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

// Filtered counts per category (Phase 1 - filtered counts)
const categoryCounts: Record<string, number> = {
  all: filteredMotors.length,
  portable: filteredMotors.filter(m => m.category === 'portable').length,
  'mid-range': filteredMotors.filter(m => m.category === 'mid-range').length,
  'high-performance': filteredMotors.filter(m => m.category === 'high-performance').length,
  'v8-racing': filteredMotors.filter(m => m.category === 'v8-racing').length,
};

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-in-stock text-in-stock-foreground';
      case 'On Order': return 'bg-on-order text-on-order-foreground';
      case 'Out of Stock': return 'bg-out-of-stock text-out-of-stock-foreground';
      default: return 'bg-muted text-muted-foreground';
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

// Inline renderer for bottom banner promotions (badges + "+N more")
const renderBannerPromos = (motor: Motor) => {
  const labels = getPromoLabelsForMotor(motor);
  if (!labels.length) return null;
  const inlineCount = Math.min(labels.length, isMobile ? 1 : 2);
  const remaining = labels.length - inlineCount;
  return (
    <div className="promos-summary flex items-center gap-2" aria-live="polite">
      <span className="promos-summary__label text-xs font-semibold text-muted-foreground">Promotions applied</span>
      <div className="promos-summary__badges flex items-center gap-1 overflow-hidden whitespace-nowrap" role="list">
        {labels.slice(0, inlineCount).map((lab, idx) => (
          <span key={idx} role="listitem" className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
            <span className="mr-1" aria-hidden="true">✅</span>
            {lab}
          </span>
        ))}
      </div>
      {remaining > 0 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="promos-summary__more rounded-full h-6 px-2 py-0 text-xs"
            aria-haspopup="dialog"
            aria-expanded={bannerPromosOpen}
            onClick={() => setBannerPromosOpen(true)}
          >
            +{remaining} more
          </Button>
          <Dialog open={bannerPromosOpen} onOpenChange={setBannerPromosOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Active promotions</DialogTitle>
              </DialogHeader>
                <div className="promos-popover__badges flex flex-wrap gap-2" role="list">
                  {labels.map((l, idx) => (
                    <span
                      key={idx}
                      role="listitem"
                      className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-sm font-semibold"
                    >
                      <span className="mr-1" aria-hidden="true">✅</span>
                      {l}
                    </span>
                  ))}
                </div>
              <DialogFooter>
                <Button type="button" onClick={() => setBannerPromosOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

// Phase 1: Compare mode & quick actions helpers
const toggleCompare = (motor: Motor) => {
  setSelectedForCompare(prev => {
    const exists = prev.includes(motor.id);
    if (exists) return prev.filter(id => id !== motor.id);
    if (prev.length >= 3) {
      toast({
        title: 'Compare limit reached, eh!',
        description: `You can compare up to 3 motors. ${comparisonHumor.threeMotors}`,
        variant: 'destructive'
      });
      return prev;
    }
    return [...prev, motor.id];
  });
};

const calculatePayment = (motor: Motor) => {
  const url = `/finance-calculator?model=${encodeURIComponent(motor.id)}`;
  track('calculate_button_click', { model_id: motor.id, model_name: motor.model, action: 'deeplink' });
  navigate(url);
};

const openQuickView = (motor: Motor) => {
  setQuickViewMotor(motor);
};

// Fetch rich details on-demand for Quick View
useEffect(() => {
  const needsEnrichment = (m: Motor | null) => {
    if (!m) return false;
    const noDesc = !m.description || m.description.trim().length < 20;
    const noFeat = !Array.isArray(m.features) || m.features.length === 0;
    const noSpecs = !m.specifications || Object.keys(m.specifications || {}).length === 0;
    return noDesc || noFeat || noSpecs;
  };

  if (quickViewMotor && needsEnrichment(quickViewMotor)) {
    setQuickViewLoading(true);
    supabase.functions
      .invoke('scrape-motor-details', {
        body: { motor_id: quickViewMotor.id, detail_url: quickViewMotor.detailUrl },
      })
      .then(({ data, error }) => {
        if (error) {
          console.warn('scrape-motor-details error', error);
          return;
        }
        if (data?.success) {
          const { description, features, specifications } = data as any;
          // Update list and quick view motor in place
          setMotors((prev) => prev.map((mm) => mm.id === quickViewMotor.id ? { ...mm, description, features, specifications } : mm));
          setQuickViewMotor((prev) => prev ? { ...prev, description, features, specifications } as Motor : prev);
        }
      })
      .finally(() => setQuickViewLoading(false));
  }
}, [quickViewMotor?.id]);

const isCompared = (motorId: string) => selectedForCompare.includes(motorId);

const handleSelectionModeToggle = (mode: 'browse' | 'compare') => {
  setSelectionMode(mode);
  if (mode === 'browse') setSelectedForCompare([]);
  if (mode === 'compare') {
    toast({ title: canadianEncouragement.compareMode[0], duration: 1800 });
  }
};

const handleCompareClick = () => {
  if (selectedForCompare.length >= 2) setShowComparePanel(true);
  else toast({ title: 'Select at least 2 motors', description: canadianEncouragement.compareMode[1] || 'Pick two or more to compare.' });
};

const handleMotorSelection = (motor: Motor) => {
    // Recently viewed scaffold
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
      title: pick(canadianEncouragement.motorSelected),
      description: `${motor.model} selected — let's continue, eh!`,
      duration: 2200,
    });

    // Gamified promotion toast (if any promos apply)
    const hasSale = motor.stockStatus === 'In Stock' && motor.salePrice != null && motor.basePrice != null && (motor.salePrice as number) < (motor.basePrice as number);
    const savings = hasSale ? ((motor.basePrice as number) - (motor.salePrice as number)) : 0;
    const hasWarrantyBonus = (motor.bonusOffers || []).some(b => !!b.warrantyExtraYears && b.warrantyExtraYears > 0);

    const promoItems = getPromoLabelsForMotor(motor);

    if (hasSale || hasWarrantyBonus) {
      toast({
        title: "Promotions applied",
        description: (
          <div className="modal">
            <div className="modal-promos" aria-live="polite">
              {promoItems.length > 0 && (
                <div className="promo-list" role="list">
                  {promoItems.map((txt, idx) => (
                    <div className="promo-item" role="listitem" key={idx}>
                      <svg className="pi" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 16.2l-3.5-3.5-1.4 1.4 4.9 4.9 10-10-1.4-1.4z" />
                      </svg>
                      <span className="promo-note">{txt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
          <p>{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-6 ${showCelebration ? 'canadian-celebration' : ''}`}>
      <MotorFilters
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        resultsCount={filteredMotors.length}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
        categoryCounts={categoryCounts}
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
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastInventoryUpdate ? formatRelativeTime(lastInventoryUpdate) : 'Never'}
            </span>
            <Badge variant={needsInventoryUpdate() ? 'destructive' : 'secondary'}>
              {needsInventoryUpdate() ? 'Update recommended' : 'Fresh'}
            </Badge>
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
        </div>

        {/* Repower rebate banner (Phase 1) */}
        <div className="repower-rebate-banner rounded-md p-3 text-center text-sm font-semibold bg-[linear-gradient(135deg,hsl(var(--promo-gold-1)),hsl(var(--promo-gold-2)))] shadow-md">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span>💰 Repower Rebate Available! Trading in? You may qualify for additional savings.</span>
            <Button size="sm" variant="secondary" onClick={() => setShowRebateModal(true)}>Learn More</Button>
          </div>
        </div>

        {/* Browse vs Compare Mode (Phase 1) */}
        <div className="flex justify-center">
          <div className="view-mode-toggle">
            <Button
              variant={selectionMode === 'browse' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectionModeToggle('browse')}
              className={`flex items-center gap-2 ${selectionMode === 'browse' ? 'active' : ''}`}
            >
              <Eye className="w-4 h-4" /> Browse Mode
            </Button>
            <Button
              variant={selectionMode === 'compare' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectionModeToggle('compare')}
              className={`flex items-center gap-2 ${selectionMode === 'compare' ? 'active' : ''}`}
            >
              <Scale className="w-4 h-4" /> Compare Mode
            </Button>
          </div>
        </div>

        {filteredMotors.length === 0 ? (
          <Card className="p-12 text-center space-y-2">
            <div className="text-2xl">🍁</div>
            <p className="font-semibold">{emptyStateMessages.noResults.message}</p>
            <p className="text-muted-foreground">{emptyStateMessages.noResults.submessage}</p>
          </Card>
        ) : (
          <div className={`grid motors-grid items-stretch ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {filteredMotors.map(motor => {
              const msrp = motor.basePrice && motor.basePrice > 0 ? motor.basePrice : null;
              const sale = motor.salePrice && motor.salePrice > 0 ? motor.salePrice : null;
              const state = getPriceDisplayState(msrp, sale);
              const hasSaleDisplay = state.hasSale;
              const callForPrice = state.callForPrice;
              
              const savingsAmount = state.savingsRounded;
              const savingsPct = state.percent;
              if (sale != null && msrp != null && sale >= msrp) {
                console.warn('[pricing] sale_price not less than base_price', { id: motor.id, model: motor.model, base_price: msrp, sale_price: sale });
              }
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
                  } ${
                    isCompared(motor.id) ? 'ring-2 ring-primary border-primary bg-primary/5 scale-[1.02]' : ''
                  } flex flex-col`}
                  onClick={() => selectionMode === 'compare' ? toggleCompare(motor) : handleMotorSelection(motor)}
                >
                  {isCompared(motor.id) && (
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow">
                      {selectedForCompare.indexOf(motor.id) + 1}
                    </div>
                  )}

                  <Badge className={`stock-badge ${getStockBadgeColor(motor.stockStatus)}`}>
                    {motor.stockStatus}
                  </Badge>

                  <div className="p-3 space-y-3 relative h-full flex flex-col">
                    <div className="flex items-start justify-start">
                      <Badge variant={getCategoryColor(motor.category)}>
                        {motor.hp}HP
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {(() => {
const title = formatMotorTitle(motor.year, motor.model);
const raw = `${motor.model ?? ''} ${motor.description ?? motor.specs ?? ''}`.trim();
const subtitle = formatVariantSubtitle(raw, title);
                        return (
                          <>
                            <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2">{title}</h3>
                            <div className="min-h-[1rem]">
                              {subtitle ? (
                                <p className="text-foreground/90 text-xs line-clamp-1" title={subtitle}>{subtitle}</p>
                              ) : null}
                            </div>
                          </>
                        );
                      })()}
                    </div>

      {motor.image && motor.image !== '/placeholder.svg' && (
        <div className="motor-image-container image-wrap w-full h-[200px] shrink-0 bg-muted/10 overflow-hidden flex items-center justify-center rounded-lg p-2.5 relative">
          <img 
            src={motor.image} 
            alt={motor.model}
            loading="lazy"
            className="motor-image"
            style={{ height: '180px', width: 'auto', objectFit: 'contain', maxWidth: 'none', maxHeight: 'none' }}
          />
          {selectedMotor?.id === motor.id && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center animate-fade-in selection-overlay" aria-hidden="true">
              <Check className="w-20 h-20 text-green-600 drop-shadow-lg animate-scale-in checkmark-icon" strokeWidth={4} aria-hidden="true" />
            </div>
          )}
        </div>
      )}

                    <div className="mt-auto pt-3 border-t border-border">
                      <div className="price-area min-h-[60px] flex items-center">
                        {callForPrice ? (
                          <span className="text-sm md:text-base font-medium text-foreground">Call for Price</span>
                        ) : hasSaleDisplay ? (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="text-xs md:text-sm line-through text-muted-foreground">MSRP ${(msrp as number).toLocaleString()}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-destructive">${(sale as number).toLocaleString()}</span>
                              <span className="text-[10px] md:text-xs font-semibold px-2 py-1 rounded bg-destructive text-destructive-foreground">
                                SAVE ${savingsAmount.toLocaleString()} ({savingsPct}%)
                              </span>
                            </div>
                          </div>
                        ) : (
                          effectiveNoSaleLayout === 'placeholder' ? (
                            <div className="w-full flex items-center justify-between gap-2">
                              <span className="text-sm md:text-base font-semibold text-foreground">MSRP ${(msrp as number).toLocaleString()}</span>
                              <div className="flex items-center gap-2 opacity-0 select-none pointer-events-none" aria-hidden="true">
                                <span className="text-lg font-bold">Our Price $0</span>
                                <span className="text-xs font-semibold px-2 py-1 rounded">SAVE $0 (0%)</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full text-center">
                              <span className="text-lg font-semibold text-foreground">MSRP ${(msrp as number).toLocaleString()}</span>
                            </div>
                          )
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
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="badge badge--repower"
                                data-badge="repower"
                                aria-label="Repower Rebate Promo"
                                onMouseEnter={() => track('rebate_badge_hover', { model_id: motor.id, model_name: motor.model })}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="badge__icon" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12 2l3 6 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 8.9 9 8z" fill="currentColor"/>
                                </svg>
                                <span className="badge__text">Repower Rebate Promo</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-[260px] space-y-1">
                                <p>Mercury’s Repower Rebate Program — trade in or repower for potential savings. See details.</p>
                                <a
                                  href={REPOWER_INFO_URL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline"
                                  onClick={(e) => { e.stopPropagation(); track('rebate_badge_click', { model_id: motor.id, model_name: motor.model }); }}
                                >
                                  Learn More
                                </a>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}

                    {/* Quick actions overlay */}
                    <div className="absolute top-3 right-3 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openQuickView(motor); }}>👁️ Quick View</Button>
                      <Button size="sm" variant={isCompared(motor.id) ? 'default' : 'outline'} onClick={(e) => { e.stopPropagation(); toggleCompare(motor); }}>⚖️ {isCompared(motor.id) ? 'Remove' : 'Compare'}</Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); calculatePayment(motor); }}>💰 Calculate</Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-[240px]">Estimate monthly payment with our finance calculator.</div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectionMode === 'compare' && selectedForCompare.length >= 2 && (
          <Button
            className="fixed bottom-6 right-6 shadow-lg animate-in slide-in-from-bottom-4"
            onClick={handleCompareClick}
          >
            ⚖️ Compare Selected ({selectedForCompare.length}/3)
          </Button>
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
          <div className="checkout-banner bg-background/95 backdrop-blur-lg border-t-4 border-green-500 shadow-2xl">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {selectedMotor.model} - ${selectedMotor.price.toLocaleString()}
                    </p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedMotor.stockStatus === 'In Stock' && selectedMotor.salePrice != null && selectedMotor.basePrice != null && (selectedMotor.salePrice as number) < (selectedMotor.basePrice as number) && (
                          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold animate-fade-in">
                            <span className="mr-1">💰</span> Save ${((selectedMotor.basePrice as number) - (selectedMotor.salePrice as number)).toLocaleString()}
                          </span>
                        )}
                        {renderBannerPromos(selectedMotor)}
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

      {/* Rebate Learn More Dialog */}
      <Dialog open={showRebateModal} onOpenChange={setShowRebateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mercury Repower Rebate Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <h3 className="text-lg font-semibold">💰 Save Extra on Your Repower!</h3>
            <p>Trading in an older motor? You may qualify for Mercury's Repower Rebate:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Up to $1,000 rebate on select models</li>
              <li>Trade any brand 25HP or higher</li>
              <li>Motor must be 2019 or older</li>
              <li>Rebate applied at time of purchase</li>
            </ul>
            <div>
              <p className="font-semibold">How it works:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Select your new Mercury motor</li>
                <li>Tell us about your trade-in</li>
                <li>We'll apply applicable rebates</li>
                <li>Save even more!</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground">*Rebate amounts vary by model. Trade-in must be in working condition. See dealer for complete details.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRebateModal(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick View Dialog */}
      <Dialog open={!!quickViewMotor} onOpenChange={(o) => { if (!o) setQuickViewMotor(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{(quickViewMotor?.model || '').replace(/ - \d+(\.\d+)?HP$/i, '')}</DialogTitle>
            <DialogDescription className="sr-only">
              Quick view details for {(quickViewMotor?.model || '').replace(/ - \d+(\.\d+)?HP$/i, '')}
            </DialogDescription>
          </DialogHeader>
          {quickViewMotor && (
            <div className="space-y-4">
              {quickViewLoading && (
                <div className="text-sm text-muted-foreground">Loading details…</div>
              )}
              {(() => {
                console.log('Motor data:', quickViewMotor);
                console.log('Specifications:', (quickViewMotor as any).specifications);
                console.log('Features:', quickViewMotor.features);
                return null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column - image and price */}
                <div>
                  <div className="bg-muted rounded-md overflow-hidden">
                    <img src={quickViewMotor.image} alt={quickViewMotor.model} className="w-full max-h-[300px] object-contain" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      ${ (quickViewMotor.salePrice || quickViewMotor.basePrice || quickViewMotor.price).toLocaleString() }
                    </div>
                    <Badge className={getStockBadgeColor(quickViewMotor.stockStatus)}>{quickViewMotor.stockStatus}</Badge>
                  </div>
                </div>

                {/* Right column - specs and features */}
                <div className="space-y-4">
                  {(() => {
                    const features = Array.isArray(quickViewMotor.features) ? quickViewMotor.features as string[] : [];
                    const model = quickViewMotor.model || '';

                    // Parse features into displayable specs
                    const displaySpecs = (() => {
                      const specs = {
                        weight: 'Contact for specs',
                        shaft: 'Multiple options',
                        start: 'See details',
                        fuel: 'Standard',
                        warranty: '3 Year',
                      };

                      const getStandardWeight = (model: string): string => {
                        const upper = model.toUpperCase();
                        // Small portables (2.5-6 HP)
                        if (upper.includes('2.5HP')) return '57 lbs';
                        if (upper.includes('3.5HP')) return '59 lbs';
                        if (upper.includes('5HP')) return '60 lbs';
                        if (upper.includes('6HP')) return '60 lbs';
                        // Small motors (8-30 HP)
                        if (upper.includes('8HP')) return '78 lbs';
                        if (upper.includes('9.9HP')) {
                          if (upper.includes('COMMAND THRUST') || upper.includes(' CT')) return '90 lbs';
                          if (upper.includes('ELH') || upper.includes('ELPT')) return '87 lbs';
                          return '84 lbs';
                        }
                        if (upper.includes('15HP')) return '99 lbs';
                        if (upper.includes('20HP')) return '104 lbs';
                        if (upper.includes('25HP')) return '126 lbs';
                        if (upper.includes('30HP')) return '163 lbs';
                        // Mid-range (40-90 HP)
                        if (upper.includes('40HP')) return '209 lbs';
                        if (upper.includes('50HP')) return '216 lbs';
                        if (upper.includes('60HP')) return '256 lbs';
                        if (upper.includes('75HP')) return '359 lbs';
                        if (upper.includes('80HP')) return '359 lbs';
                        if (upper.includes('90HP')) return '359 lbs';
                        // Large motors (100+ HP)
                        if (upper.includes('100HP')) return '363 lbs';
                        if (upper.includes('115HP')) {
                          if (upper.includes('COMMAND THRUST') || upper.includes(' CT')) return '377 lbs';
                          if (upper.includes('PRO XS') || upper.includes('PROXS')) return '363 lbs';
                          return '363 lbs';
                        }
                        if (upper.includes('125HP')) return '363 lbs';
                        if (upper.includes('135HP')) return '468 lbs';
                        if (upper.includes('150HP')) {
                          if (upper.includes('PRO XS') || upper.includes('PROXS')) return '455 lbs';
                          return '468 lbs';
                        }
                        if (upper.includes('175HP')) return '468 lbs';
                        if (upper.includes('200HP')) return '475 lbs';
                        if (upper.includes('225HP')) return '475 lbs';
                        if (upper.includes('250HP')) return '527 lbs';
                        if (upper.includes('300HP')) return '556 lbs';
                        if (upper.includes('350HP')) return '668 lbs';
                        if (upper.includes('400HP')) return '668 lbs';
                        if (upper.includes('450HP')) return '689 lbs';
                        if (upper.includes('500HP')) return '705 lbs';
                        if (upper.includes('600HP')) return '1260 lbs';
                        return 'Contact for specs';
                      };

                      features.forEach((f) => {
                        const text = String(f);
                        // Weight
                        if (/weight/i.test(text) || /(lbs?|kg)/i.test(text)) {
                          const m = text.match(/(\d+\.?\d*)\s*(lbs?|kg)/i);
                          if (m) specs.weight = `${m[1]} ${m[2]}`;
                        }
                        // Starting
                        if (/start(ing)?:/i.test(text)) {
                          if (/electric/i.test(text)) specs.start = 'Electric';
                          else if (/manual/i.test(text)) specs.start = 'Manual';
                        }
                        // Warranty
                        if (/warranty/i.test(text)) {
                          const wm = text.match(/(\d+)\s*month/i);
                          if (wm) specs.warranty = `${Math.floor(parseInt(wm[1], 10) / 12)} Year`;
                        }
                        // Shaft length
                        if (/shaft/i.test(text) || /"/.test(text)) {
                          const sm = text.match(/(\d+["])/);
                          if (sm) specs.shaft = sm[1];
                        }
                        // Fuel system
                        if (/efi|fuel injection/i.test(text)) specs.fuel = 'EFI';
                        else if (/carb/i.test(text)) specs.fuel = 'Carburetor';
                      });

                      // Model-based hints
                      if (/\bMH\b/i.test(model)) specs.start = specs.start === 'See details' ? 'Manual' : specs.start;
                      if (/\bEH\b|\bELPT\b/i.test(model)) specs.start = specs.start === 'See details' ? 'Electric' : specs.start;
                      if (/EFI/i.test(model)) specs.fuel = 'EFI';
                      if (/\bL\b/.test(model)) specs.shaft = specs.shaft === 'Multiple options' ? '20" (Long)' : specs.shaft;
                      if (/\bS\b/.test(model)) specs.shaft = specs.shaft === 'Multiple options' ? '15" (Short)' : specs.shaft;

                      // Final weight fallback: prefer scraped specification weight, else standard mapping
                      const specWeight = (quickViewMotor.specifications as any)?.weight;
                      if (specs.weight === 'Contact for specs') {
                        if (specWeight) specs.weight = String(specWeight);
                        else specs.weight = getStandardWeight(model);
                      }

                      return specs;
                    })();

                    // Clean features for display (exclude nav/social links, urls, too short)
                    const displayFeatures = features
                      .filter((f) => {
                        const t = String(f).trim();
                        return t.length > 5 && t.length < 200 &&
                          !/https?:\/\//i.test(t) &&
                          !/\[.*\]\(.*\)/.test(t) &&
                          !/^\s*URL:/i.test(t) &&
                          !/can't find/i.test(t) &&
                          !/click here/i.test(t) &&
                          !/looking for/i.test(t);
                      })
                      .slice(0, 8);

                    const cleanedDescription = String(quickViewMotor.description || '')
                      .replace(/Can't find what you're looking for\?[\s\S]*/i, '')
                      .replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '')
                      .trim();

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3 bg-accent p-4 rounded-md text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Power</span><strong>{quickViewMotor.hp} HP</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><strong>{displaySpecs.weight}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Shaft</span><strong>{displaySpecs.shaft}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Start</span><strong>{displaySpecs.start}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Fuel</span><strong>{displaySpecs.fuel}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Warranty</span><strong>{displaySpecs.warranty}</strong></div>
                        </div>

                        {(!quickViewMotor.description || !quickViewMotor.specifications || Object.keys(quickViewMotor.specifications as any).length === 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={quickViewLoading}
                            onClick={async () => {
                              try {
                                setQuickViewLoading(true);
                                const { data, error } = await supabase.functions.invoke('scrape-motor-details', {
                                  body: { motor_id: quickViewMotor.id, detail_url: quickViewMotor.detailUrl }
                                });
                                if (error) throw error;
                                const { description, features, specifications } = (data as any) || {};
                                setMotors((prev) => prev.map((mm) => mm.id === quickViewMotor.id ? { ...mm, description, features, specifications } : mm));
                                setQuickViewMotor((prev) => prev ? { ...prev, description, features, specifications } as Motor : prev);
                              } catch (e) {
                                console.warn('manual scrape-motor-details error', e);
                                toast({ title: 'Couldn\'t load full specs', description: 'Please try again in a moment.', variant: 'destructive' });
                              } finally {
                                setQuickViewLoading(false);
                              }
                            }}
                          >
                            {quickViewLoading ? 'Loading…' : 'Load Full Specs'}
                          </Button>
                        )}

                        {displayFeatures.length > 0 && (
                          <div className="features-list">
                            <h4 className="font-semibold mb-2">Key Features:</h4>
                            <ul className="text-sm space-y-1">
                              {displayFeatures.map((feature, i) => (
                                <li key={`${feature}-${i}`} className="flex items-start">
                                  <span className="text-green-500 mr-2">✓</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {(() => {
                const d = String(quickViewMotor.description || '')
                  .replace(/Can't find what you're looking for\?[\s\S]*/i, '')
                  .replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '')
                  .trim();
                return d ? (<div className="text-sm text-muted-foreground">{d}</div>) : null;
              })()}


              {/* Model code decoder */}
              <div className="bg-accent border border-border p-4 rounded-md mt-2">
                <h4 className="font-semibold mb-2">Understanding This Model</h4>
                <div className="space-y-2">
                  {decodeModelName(quickViewMotor.model).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">
                        {item.code}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">{item.meaning}</span>
                        <span className="text-muted-foreground text-sm ml-2">- {item.benefit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Helpful tips */}
                {quickViewMotor.hp >= 40 && (
                  <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                    <strong>Remote Control Only:</strong> This motor requires console steering with remote throttle and shift controls. Too powerful for tiller operation.
                  </div>
                )}
                {quickViewMotor.hp <= 30 && /(MH|MLH|EH|ELH)/i.test(quickViewMotor.model) && (
                  <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                    <strong>Tiller Handle:</strong> Perfect if you sit at the back of the boat. Great for fishing where precise control matters.
                  </div>
                )}
                {!quickViewMotor.model.includes('E') && quickViewMotor.model.includes('M') && (
                  <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                    <strong>Manual Start:</strong> No battery needed — ideal for occasional use or as a backup motor. Very reliable.
                  </div>
                )}
              </div>


              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { toggleCompare(quickViewMotor); setQuickViewMotor(null); }}>
                    Add to Compare
                  </Button>
                  <Button variant="outline" onClick={() => { calculatePayment(quickViewMotor); setQuickViewMotor(null); }}>
                    Calculate Payment
                  </Button>
                </div>
                <Button size="lg" onClick={() => { handleMotorSelection(quickViewMotor); setQuickViewMotor(null); }}>
                  Select This Motor →
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compare Panel Dialog */}
      <Dialog open={showComparePanel} onOpenChange={setShowComparePanel}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Compare Motors</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {motors.filter(m => selectedForCompare.includes(m.id)).map((m) => (
              <Card key={m.id} className="p-4">
                <div className="aspect-video bg-muted rounded-md overflow-hidden mb-3">
                  <img src={m.image} alt={m.model} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{m.model}</h3>
                    <span className="text-sm text-muted-foreground">{m.hp} HP</span>
                  </div>
                  <Badge className={getStockBadgeColor(m.stockStatus)}>{m.stockStatus}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Price:</span><span className="font-semibold">${(m.salePrice || m.basePrice || m.price).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Power:</span><span className="font-semibold">{(m.specifications as any)?.powerHP || m.hp} HP</span></div>
                  <div className="flex justify-between"><span>Weight:</span><span className="font-semibold">{(m.specifications as any)?.weight || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Shaft:</span><span className="font-semibold">{(m.specifications as any)?.shaftLength || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Start:</span><span className="font-semibold">{(m.specifications as any)?.startType || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Fuel:</span><span className="font-semibold">{(m.specifications as any)?.fuelSystem || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Warranty:</span><span className="font-semibold">{(m.specifications as any)?.warrantyPromo || (m.specifications as any)?.warranty || 'N/A'}</span></div>
                </div>
                <Button className="mt-3 w-full" onClick={() => { handleMotorSelection(m); setShowComparePanel(false); }}>Select This Motor</Button>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComparePanel(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
