import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, RefreshCcw, ShieldCheck, Zap, Check, Star, Sparkles, Ship, Gauge, Fuel, MapPin, Wrench, Battery, Settings, AlertTriangle, Calculator, Info, Flame, TrendingUp, CheckCircle, Tag, Anchor, Heart, Eye, Search, X, Menu, Filter } from 'lucide-react';
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
import harrisLogo from '@/assets/harris-logo.png';
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
  // NEW: rule-level discount overrides
  discount_percentage: number;
  discount_fixed_amount: number;
}

// Shared promotions detection (single source for modal + banner)
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
  PROMO_MAP.forEach(p => {
    if (p.test.test(text || '')) keys.add(p.key as PromoKey);
  });
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
  type Item = {
    code: string;
    meaning: string;
    benefit: string;
  };
  const decoded: Item[] = [];
  const name = modelName || '';
  const upper = name.toUpperCase();
  const added = new Set<string>();
  const add = (code: string, meaning: string, benefit: string) => {
    if (!added.has(code)) {
      decoded.push({
        code,
        meaning,
        benefit
      });
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
  if (upper.includes('ELHPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('L', 'Long Shaft (20\")', 'Standard transom height');
    add('H', 'Tiller Handle', 'Direct steering control');
    add('PT', 'Power Tilt', 'Easy motor lifting');
  }
  if (upper.includes('ELXPT') || upper.includes('EXLPT')) {
    add('E', 'Electric Start', 'Push-button start');
    add('XL', 'Extra Long Shaft (25\")', 'For 25\" transom boats');
    add('PT', 'Power Trim & Tilt', 'Adjust angle on the fly');
  }
  if (upper.includes('ELPT')) {
    add('E', 'Electric Start', 'Push-button convenience');
    add('L', 'Long Shaft (20\")', 'For 20\" transom boats');
    add('PT', 'Power Trim & Tilt', 'Adjust angle on the fly');
  }
  // Handle standalone EL (Electric start + Long shaft) - must check after longer combos
  if (upper.includes('EL') && !upper.includes('ELH') && !upper.includes('ELP') && !upper.includes('ELX')) {
    add('E', 'Electric Start', 'Push-button convenience');
    add('L', 'Long Shaft (20\")', 'For 20\" transom boats');
  }
  if (upper.includes('MLH')) {
    add('M', 'Manual Start', 'Pull cord — simple & reliable');
    add('L', 'Long Shaft (20\")', 'For 20\" transom boats');
    add('H', 'Tiller Handle', 'Steer directly from motor');
  }
  if (upper.includes('MH')) {
    add('M', 'Manual Start', 'Pull cord — simple & reliable');
    add('H', 'Tiller Handle', 'Steer directly from motor');
  }
  if (upper.includes('EH')) {
    add('E', 'Electric Start', 'Push-button convenience');
    add('H', 'Tiller Handle', 'Direct steering control');
  }

  // Steering and control
  if (hasWord('RC') || upper.includes('ERC')) add('RC', 'Remote Control', 'Steering wheel & console controls');
  if (hp >= 40 && !added.has('RC')) add('RC', 'Remote Control', 'Steering wheel & console controls');
  // Command Thrust
  if (hasWord('CT') || /COMMAND\s*THRUST/i.test(name)) add('CT', 'Command Thrust', 'Larger gearcase & prop for superior control');

  // Shaft length (check longer tokens first, skip if already handled in combos)
  if (!added.has('XX') && !added.has('XL') && !added.has('L') && !added.has('S')) {
    if (hasWord('XXL') || hasWord('XX')) {
      add('XX', 'Ultra Long Shaft (30\")', 'For 30\" transom boats');
    } else if (hasWord('XL') || (hasWord('X') && !hasWord('XX'))) {
      add('XL', 'Extra Long Shaft (25\")', 'For 25\" transom boats');
    } else if (hasWord('L')) {
      add('L', 'Long Shaft (20\")', 'For 20\" transom boats');
    } else if (hasWord('S')) {
      add('S', 'Short Shaft (15\")', 'For 15\" transom boats');
    } else {
      // Default: No shaft indicators means Short Shaft (15")
      add('S', 'Short Shaft (15\")', 'For 15\" transom boats');
    }
  }

  // Features / technology
  if (hasWord('PT')) add('PT', 'Power Trim & Tilt', 'Adjust motor angle on the fly');
  if (hasWord('T')) add('T', 'Power Tilt', 'Easy motor lifting');
  if (hasWord('GA')) add('GA', 'Gas Assist Tilt', 'Lighter effort when tilting');
  if (hasWord('EFI')) add('EFI', 'Electronic Fuel Injection', 'Reliable starting & efficiency');
  if (hasWord('DTS')) add('DTS', 'Digital Throttle & Shift', 'Smooth precise electronic controls');
  if (hasWord('PXS') || /PROXS/i.test(name)) add('PXS', 'ProXS (High Performance)', 'Sport-tuned for acceleration');

  // Single flags
  if (hasWord('E') && !added.has('E')) add('E', 'Electric Start', 'Push-button convenience');
  if (hasWord('M') && !added.has('M')) add('M', 'Manual Start', 'Pull cord — simple & reliable');
  if (hp <= 30 && hasWord('H') && !added.has('H')) add('H', 'Tiller Handle', 'Steer directly from motor');
  return decoded;
};

// Buyer-critical helper functions for Quick View
const getRecommendedBoatSize = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return 'Up to 12ft';
  if (n <= 15) return '12-16ft';
  if (n <= 30) return '14-18ft';
  if (n <= 60) return '16-20ft';
  if (n <= 90) return '18-22ft';
  if (n <= 115) return '20-24ft';
  if (n <= 150) return '22-26ft';
  if (n <= 200) return '24-28ft';
  return '26ft+';
};
const getEstimatedSpeed = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return '5-8 mph';
  if (n <= 15) return '15-20 mph';
  if (n <= 30) return '25-30 mph';
  if (n <= 60) return '35-40 mph';
  if (n <= 90) return '40-45 mph';
  if (n <= 115) return '45-50 mph';
  if (n <= 150) return '50-55 mph';
  return '55+ mph';
};
const getFuelConsumption = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return '0.5-1 gph';
  if (n <= 15) return '1-2 gph';
  if (n <= 30) return '2-3 gph';
  if (n <= 60) return '4-6 gph';
  if (n <= 90) return '7-9 gph';
  if (n <= 115) return '9-11 gph';
  if (n <= 150) return '12-15 gph';
  return '15+ gph';
};
const getRange = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  if (n <= 6) return 'N/A (portable tank)';
  if (n <= 15) return '80-120 miles';
  if (n <= 30) return '70-110 miles';
  if (n <= 60) return '60-100 miles';
  if (n <= 90) return '55-90 miles';
  if (n <= 115) return '50-85 miles';
  if (n <= 150) return '45-80 miles';
  return '40-70 miles';
};
const getTransomRequirement = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  const shaft = (motor as any).specifications?.shaft_length as string | undefined;
  
  // Check specifications first
  if (shaft?.includes('30')) return '30" (XXL) transom';
  if (shaft?.includes('25')) return '25" (XL) transom';
  if (shaft?.includes('20')) return '20" (L) transom';
  
  // Check model codes
  if (/\bXXL\b/.test(model)) return '30" (XXL) transom';
  if (/\bXL\b|EXLPT/.test(model)) return '25" (XL) transom';
  if (/\bL\b|ELPT|MLH|LPT|\bEL\b/.test(model)) return '20" (L) transom';
  if (/\bS\b/.test(model)) return '15" (S) transom';
  
  // Default: No shaft indicators means Short Shaft (15")
  return '15" (S) transom';
};
const getBatteryRequirement = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  if (/\bM\b/.test(model)) return 'Not required (manual start)';
  const n = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  if (n <= 30) return '12V marine battery';
  if (n <= 115) return '12V marine cranking battery (min 800 CCA)';
  return 'High-output 12V (or dual) marine battery';
};
const getControlRequirement = (motor: Motor) => {
  const model = (motor.model || '').toUpperCase();
  const n = typeof motor.hp === 'string' ? parseInt(motor.hp) : motor.hp;
  if (n <= 30 && /\bH\b/.test(model)) return 'Tiller handle (built-in)';
  if (n >= 40) return 'Remote control kit required (~$800-1500)';
  return 'Tiller or remote available';
};
const getFuelRequirement = (_motor: Motor) => {
  return 'Unleaded 87 octane gasoline (E10 up to 10%)';
};
const getOilRequirement = (_motor: Motor) => {
  return '4-stroke marine oil 10W-30 or 25W-40 (Mercury)';
};
const getIdealUses = (hp: number | string) => {
  const n = typeof hp === 'string' ? parseInt(hp) : hp;
  const Bullets = ({
    items
  }: {
    items: string[];
  }) => <ul className="space-y-1">
      {items.map((txt, i) => <li key={i} className="flex items-start">
          <span className="mr-2">•</span>
          <span>{txt}</span>
        </li>)}
    </ul>;
  if (n <= 6) {
    return <Bullets items={['Dinghies & tenders', 'Canoes & kayaks', 'Emergency backup', 'Trolling']} />;
  }
  if (n <= 30) {
    return <Bullets items={['Aluminum fishing boats', 'Small pontoons', 'Day cruising', 'Lake fishing']} />;
  }
  if (n <= 90) {
    return <Bullets items={['Family pontoons', 'Bass boats', 'Runabouts', 'Water sports']} />;
  }
  if (n <= 150) {
    return <Bullets items={['Large pontoons', 'Offshore fishing', 'Performance boats', 'Tournament fishing']} />;
  }
  return <Bullets items={['High-performance boats', 'Commercial use', 'Offshore racing', 'Heavy loads']} />;
};

// Normalize scraped/spec data into consistent keys used by the UI
const normalizeSpecifications = (raw: any, context: {
  hp?: number;
  model?: string;
} = {}): Record<string, any> => {
  const r = raw || {};
  const model = (context.model || '').toUpperCase();
  const out: Record<string, any> = {};
  const get = (...keys: string[]) => {
    for (const k of keys) {
      if (r[k] != null && r[k] !== '') return r[k];
    }
    return undefined;
  };
  out.powerHP = get('powerHP', 'power_hp', 'hp', 'horsepower') ?? context.hp;
  out.weight = get('weight', 'weight_lbs', 'dry_weight', 'dryWeight', 'weight_kg');
  out.shaftLength = get('shaftLength', 'shaft_length', 'shaft');
  out.startType = get('startType', 'start_type', 'starting');
  out.fuelSystem = get('fuelSystem', 'fuel_system', 'fuel');
  const warranty = get('warrantyPromo', 'warranty_promo', 'warranty');
  if (typeof warranty === 'number') out.warrantyPromo = `${warranty} Year`;else out.warrantyPromo = warranty;

  // Inference from model codes if missing
  if (!out.startType) {
    if (/\bMH\b|\bM\b/.test(model)) out.startType = 'Manual';
    if (/\bEL|\bEH|\bE\b|EFI/.test(model)) out.startType = out.startType || 'Electric';
  }
  if (!out.shaftLength) {
    if (/\bXXL\b/.test(model)) out.shaftLength = '30"';else if (/\bXL\b/.test(model)) out.shaftLength = '25"';else if (/\bL\b/.test(model)) out.shaftLength = '20"';else if (/\bS\b/.test(model)) out.shaftLength = '15"';
  }
  if (!out.fuelSystem && /EFI/.test(model)) out.fuelSystem = 'EFI';

  // Merge back to preserve any additional keys
  return {
    ...r,
    ...out
  };
};
interface MotorSelectionProps {
  onStepComplete: (motor: Motor) => void;
  noSalePriceLayout?: 'default' | 'placeholder' | 'centered';
  imageSizingMode?: 'current' | 'taller' | 'scale-msrp' | 'v2' | 'uniform-112';
}
export const MotorSelection = ({
  onStepComplete,
  noSalePriceLayout = 'placeholder',
  imageSizingMode = 'uniform-112'
}: MotorSelectionProps) => {
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const [motors, setMotors] = useState<Motor[]>([]);
  const { notifications: socialProofNotifications, trackInteraction } = useSocialProofNotifications(motors);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [celebrationParticles, setCelebrationParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    emoji: string;
  }>>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    priceRange: [0, 50000] as [number, number],
    hpRange: [2.5, 300] as [number, number]
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [bannerPromosOpen, setBannerPromosOpen] = useState(false);
  // Phase 1 scaffolding & features

  const [activePromoModal, setActivePromoModal] = useState<Promotion | null>(null);
  const [promotionsState, setPromotionsState] = useState<Promotion[]>([]);
  const [quickViewMotor, setQuickViewMotor] = useState<Motor | null>(null);
  
  const [recentlyViewed, setRecentlyViewed] = useState<Motor[]>([]);
  const [modelSearch, setModelSearch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHPRange, setSelectedHPRange] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [selectedEngineType, setSelectedEngineType] = useState<string>('all');
  const debugPricing = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';
  const [quickViewLoading, setQuickViewLoading] = useState(false);

  // Allow URL param override for the no-sale price layout only on staging routes
  const isStagingRoute = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/staging');
  const urlLayout = isStagingRoute ? new URLSearchParams(window.location.search).get('noSalePriceLayout') : null;
  const paramNoSaleLayout: 'placeholder' | 'centered' | null = urlLayout === 'placeholder' || urlLayout === 'centered' ? urlLayout as 'placeholder' | 'centered' : null;
  const effectiveNoSaleLayout: 'default' | 'placeholder' | 'centered' = paramNoSaleLayout as any ?? noSalePriceLayout;

  // Staging-only image sizing override via ?imgMode=current|taller|scale-msrp|v2|uniform-112
  const urlImgMode = isStagingRoute ? new URLSearchParams(window.location.search).get('imgMode') : null;
  const paramImgMode: 'current' | 'taller' | 'scale-msrp' | 'v2' | 'uniform-112' | null = urlImgMode === 'taller' || urlImgMode === 'scale-msrp' || urlImgMode === 'current' || urlImgMode === 'v2' || urlImgMode === 'uniform-112' ? urlImgMode as any : null;
  const effectiveImageSizingMode: 'current' | 'taller' | 'scale-msrp' | 'v2' | 'uniform-112' = paramImgMode as any ?? imageSizingMode;
  // Mobile-specific state additions
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteFormModel, setQuoteFormModel] = useState('');
  const [mobileFilters, setMobileFilters] = useState({
    inStockOnly: false,
    hpRange: '',
    engineType: ''
  });

  const navigate = useNavigate();
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const loadingText = useMemo<string>(() => pick(loadingMessages as readonly string[]), []);
  const track = (name: string, payload: Record<string, any>) => {
    try {
      (window as any).analytics?.track?.(name, payload);
    } catch {}
    console.log('[analytics]', name, payload);
  };


  // Automatic inventory refresh state
  const [lastInventoryUpdate, setLastInventoryUpdate] = useState<string | null>(null);
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
    // Clear any sticky bar state on component mount
    console.log('[MotorSelection] Component mounted, clearing sticky bar state');
    setShowStickyBar(false);
    setSelectedMotor(null);
    setShowCelebration(false);
    setCelebrationParticles([]);
    
    loadMotors();
  }, []);

  // Realtime updates for promotions changes
  useEffect(() => {
    const channel = supabase.channel('promos-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'promotions'
    }, () => {
      loadMotors();
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'promotions_rules'
    }, () => {
      loadMotors();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const loadMotors = async () => {
    try {
      const [{
        data: motorRows,
        error: motorsError
      }, {
        data: promos,
        error: promosError
      }, {
        data: rules,
        error: rulesError
      }] = await Promise.all([supabase.from('motor_models').select('*').order('horsepower'), supabase.from('promotions').select('*'), supabase.from('promotions_rules').select('*')]);
      if (motorsError) throw motorsError;
      if (promosError) throw promosError;
      if (rulesError) throw rulesError;
      const activePromos: Promotion[] = (promos as Promotion[] | null)?.filter(p => isPromotionActive(p)) || [];
      setPromotionsState(activePromos);
      const promoRules: PromotionRule[] = rules as PromotionRule[] | null || [];

      // Filter out Jet models and cap horsepower at 300
      const filteredMotorRows = (motorRows as DbMotor[] | null || []).filter(m => {
        // Exclude Jet models (check model name for "Jet" case-insensitive)
        const isJetModel = m.model.toLowerCase().includes('jet');
        // Cap horsepower at 300
        const isOverHpLimit = m.horsepower > 300;
        return !isJetModel && !isOverHpLimit;
      });

      // Transform database data to Motor interface with effective pricing
      const transformedMotors: Motor[] = filteredMotorRows.map(m => {
        const basePrice = Number(m.base_price || 0);
        const salePrice = m.sale_price != null ? Number(m.sale_price) : null;
        const original = salePrice && salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
        const {
          effectivePrice,
          appliedPromotions,
          promoEndsAt,
          bonusOffers
        } = applyPromotions(m, original, activePromos, promoRules);
        const savings = Math.max(0, original - effectivePrice);
        return {
          id: m.id,
          model: m.model,
          year: m.year,
          hp: Number(m.horsepower),
          price: effectivePrice,
          image: m.image_url || '/placeholder.svg',
          stockStatus: m.availability === 'In Stock' ? 'In Stock' : 
                      m.availability === 'Sold' ? 'Sold' :
                      m.availability === 'On Order' ? 'On Order' : 'Order Now',
          stockNumber: m.stock_number,
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
          specifications: normalizeSpecifications(m.specifications, {
            hp: Number(m.horsepower),
            model: m.model
          }),
          features: Array.isArray(m.features) ? m.features as string[] : [],
          description: m.description || null,
          detailUrl: m.detail_url || null
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
            arr[i] = {
              ...m,
              salePrice: sale
            };
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
        variant: 'destructive'
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
  const applyPromotions = (m: DbMotor, startingPrice: number, promos: Promotion[], rules: PromotionRule[]) => {
    const applicable = promos.filter(p => {
      const prules = rules.filter(r => r.promotion_id === p.id);
      if (prules.length === 0) return false; // must have at least one rule
      return prules.some(r => ruleMatches(m, r));
    });
    let price = startingPrice;
    const applied: string[] = [];
    let endsAt: string | null = null;

    // Separate bonuses and discounts
    const bonusOnly = applicable.filter(p => p.kind === 'bonus').sort((a, b) => b.highlight === a.highlight ? b.priority - a.priority : b.highlight ? 1 : -1);

    // Include promos that have either promo-level discount OR a rule-level override for this motor
    const discounts = applicable.filter(p => {
      const matchingRules = rules.filter(r => r.promotion_id === p.id).filter(r => ruleMatches(m, r));
      const hasRuleOverride = matchingRules.some(r => Number(r.discount_percentage) > 0 || Number(r.discount_fixed_amount) > 0);
      return p.kind !== 'bonus' && (Number(p.discount_percentage) > 0 || Number(p.discount_fixed_amount) > 0 || hasRuleOverride);
    });
    const calcAfter = (current: number, fixed: number, pct: number) => {
      let result = current;
      if (Number(fixed) > 0) result = Math.max(0, result - Number(fixed));
      if (Number(pct) > 0) result = result * (1 - Number(pct) / 100);
      return result;
    };
    const bestPriceForPromo = (current: number, promo: Promotion) => {
      const matchingRules = rules.filter(r => r.promotion_id === promo.id).filter(r => ruleMatches(m, r));

      // Default to promo-level if no matching rules (shouldn't happen due to applicable filter)
      let best = calcAfter(current, Number(promo.discount_fixed_amount) || 0, Number(promo.discount_percentage) || 0);
      for (const r of matchingRules) {
        const hasOverride = Number(r.discount_fixed_amount) > 0 || Number(r.discount_percentage) > 0;
        const fixed = hasOverride ? Number(r.discount_fixed_amount) || 0 : Number(promo.discount_fixed_amount) || 0;
        const pct = hasOverride ? Number(r.discount_percentage) || 0 : Number(promo.discount_percentage) || 0;
        const candidate = calcAfter(current, fixed, pct);
        if (candidate < best) best = candidate;
      }
      return best;
    };

    // Apply stackable discounts first (using best rule-level or promo-level value)
    const stackables = discounts.filter(p => p.stackable);
    for (const p of stackables) {
      const newPrice = bestPriceForPromo(price, p);
      price = newPrice;
      applied.push(p.name);
      if (p.end_date) {
        if (!endsAt || new Date(p.end_date) < new Date(endsAt)) endsAt = p.end_date;
      }
    }

    // Then best non-stackable discount
    const nonStackables = discounts.filter(p => !p.stackable);
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
    const bonusOffers = bonusOnly.map(b => {
      if (b.end_date) {
        if (!endsAt || new Date(b.end_date) < new Date(endsAt)) endsAt = b.end_date;
      }
      applied.push(b.name);
      return {
        id: b.id,
        title: b.bonus_title || b.name,
        shortBadge: b.bonus_short_badge || (b.warranty_extra_years ? `+${b.warranty_extra_years}Y Warranty` : 'Bonus Offer'),
        image_url: b.image_url,
        image_alt_text: b.image_alt_text,
        description: b.bonus_description || null,
        warrantyExtraYears: b.warranty_extra_years || null,
        termsUrl: b.terms_url || null,
        highlight: !!b.highlight,
        endsAt: b.end_date || null,
        priority: b.priority || 0
      };
    });
    return {
      effectivePrice: Math.round(price),
      appliedPromotions: applied,
      promoEndsAt: endsAt,
      bonusOffers
    };
  };
  const updateInventory = async () => {
    setUpdating(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('scrape-inventory');
      if (error) throw error;

      // Reload motors after update
      await loadMotors();

      // Save last update timestamp
      const nowIso = new Date().toISOString();
      setLastInventoryUpdate(nowIso);
      toast({
        title: 'Success',
        description: `Updated ${data?.count ?? ''} motors from Harris Boat Works`
      });
    } catch (error) {
      // Log error silently instead of showing scary error to users
      console.log('Inventory sync issue - using cached data:', error);
      
      // Still reload motors (will use existing cached data)
      await loadMotors();
      
      // Show a reassuring message instead of an error
      toast({
        title: 'Inventory Updated',
        description: 'Showing current inventory (last sync a few minutes ago)',
        variant: 'default' // Changed from 'destructive' to normal
      });
    } finally {
      setUpdating(false);
    }
  };
  const categories = [{
    key: 'all',
    label: 'All Motors',
    color: 'primary'
  }, {
    key: 'portable',
    label: 'Portable (2.5-20hp)',
    color: 'portable'
  }, {
    key: 'mid-range',
    label: 'Mid-Range (25-100hp)',
    color: 'mid-range'
  }, {
    key: 'high-performance',
    label: 'High Performance (115-200hp)',
    color: 'high-performance'
  }, {
    key: 'v8-racing',
    label: 'V8 & Racing (225-600hp)',
    color: 'v8-racing'
  }];
  const filterByHPRange = (minHP: number, maxHP: number) => {
    // Update hpRange filter
    setFilters({
      ...filters,
      hpRange: [minHP, maxHP]
    });
    // Compute how many would match with the new range and current filters
    const count = motors.filter(motor => {
      if (filters.category !== 'all' && motor.category !== filters.category) return false;
      if (filters.stockStatus !== 'all' && motor.stockStatus !== filters.stockStatus) return false;
      if (motor.price < filters.priceRange[0] || motor.price > filters.priceRange[1]) return false;
      if (modelSearch && !motor.model?.toLowerCase().includes(modelSearch.toLowerCase())) return false;
      return motor.hp >= minHP && motor.hp <= maxHP;
    }).length;
    if (count === 0) {
      toast({
        title: 'No motors found',
        description: `No motors available in the ${minHP}-${maxHP} HP range`
      });
    }
  };
  const filteredMotors = motors.filter(motor => {
    // Search functionality - check both model search (sidebar) and main search query
    if (modelSearch && !motor.model?.toLowerCase().includes(modelSearch.toLowerCase())) return false;
    if (searchQuery && !motor.model?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !motor.hp.toString().includes(searchQuery)) return false;
    
    // In Stock Only toggle
    if (inStockOnly && motor.stockStatus !== 'In Stock') return false;
    
    // Engine Type filtering
    if (selectedEngineType !== 'all') {
      const model = motor.model?.toLowerCase() || '';
      switch (selectedEngineType) {
        case 'fourstroke':
          if (!model.includes('fourstroke') && !model.includes('4-stroke')) return false;
          break;
        case 'verado':
          if (!model.includes('verado')) return false;
          break;
        case 'proxs':
          if (!model.includes('proxs') && !model.includes('pro xs')) return false;
          break;
        case 'seapro':
          if (!model.includes('seapro')) return false;
          break;
      }
    }
    
    // HP Range filtering from tabs
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
    'v8-racing': filteredMotors.filter(m => m.category === 'v8-racing').length
  };
  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-in-stock text-in-stock-foreground';
      case 'On Order':
        return 'bg-on-order text-on-order-foreground';
      case 'Sold':
        return 'bg-destructive text-destructive-foreground';
      case 'Order Now':
        return 'bg-special-order text-special-order-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const getCategoryColor = (category: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (category) {
      case 'portable':
        return 'secondary';
      case 'mid-range':
        return 'outline';
      case 'high-performance':
        return 'default';
      case 'v8-racing':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Inline renderer for bottom banner promotions (badges + "+N more")
  const renderBannerPromos = (motor: Motor) => {
    const labels = getPromoLabelsForMotor(motor);
    if (!labels.length) return null;
    const inlineCount = Math.min(labels.length, isMobile ? 1 : 2);
    const remaining = labels.length - inlineCount;
    return <div className="promos-summary flex items-center gap-2" aria-live="polite">
      <span className="promos-summary__label text-xs font-semibold text-muted-foreground">Promotions applied</span>
      <div className="promos-summary__badges flex items-center gap-1 overflow-hidden whitespace-nowrap" role="list">
        {labels.slice(0, inlineCount).map((lab, idx) => <span key={idx} role="listitem" className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
            <span className="mr-1" aria-hidden="true">✅</span>
            {lab}
          </span>)}
      </div>
      {remaining > 0 && <>
          <Button type="button" variant="outline" size="sm" className="promos-summary__more rounded-full h-6 px-2 py-0 text-xs" aria-haspopup="dialog" aria-expanded={bannerPromosOpen} onClick={() => setBannerPromosOpen(true)}>
            +{remaining} more
          </Button>
          <Dialog open={bannerPromosOpen} onOpenChange={setBannerPromosOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Active promotions</DialogTitle>
              </DialogHeader>
                <div className="promos-popover__badges flex flex-wrap gap-2" role="list">
                  {labels.map((l, idx) => <span key={idx} role="listitem" className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-sm font-semibold">
                      <span className="mr-1" aria-hidden="true">✅</span>
                      {l}
                    </span>)}
                </div>
              <DialogFooter>
                <Button type="button" onClick={() => setBannerPromosOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>}
    </div>;
  };
  const calculatePayment = (motor: Motor) => {
    const url = `/finance-calculator?model=${encodeURIComponent(motor.id)}`;
    track('calculate_button_click', {
      model_id: motor.id,
      model_name: motor.model,
      action: 'deeplink'
    });
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
      supabase.functions.invoke('scrape-motor-details', {
        body: {
          motor_id: quickViewMotor.id,
          detail_url: quickViewMotor.detailUrl
        }
      }).then(({
        data,
        error
      }) => {
        if (error) {
          console.warn('scrape-motor-details error', error);
          return;
        }
        if (data?.success) {
          const {
            description,
            features,
            specifications
          } = data as any;
          // Update list and quick view motor in place
          setMotors(prev => prev.map(mm => mm.id === quickViewMotor.id ? {
            ...mm,
            description,
            features,
            specifications
          } : mm));
          setQuickViewMotor(prev => prev ? {
            ...prev,
            description,
            features,
            specifications
          } as Motor : prev);
        }
      }).finally(() => setQuickViewLoading(false));
    }
  }, [quickViewMotor?.id]);
  const handleMotorSelection = (motor: Motor) => {
    // Track interaction for social proof
    trackInteraction(motor.id);
    
    // Check if clicking on already selected motor to deselect
    if (selectedMotor?.id === motor.id) {
      setSelectedMotor(null);
      setShowCelebration(false);
      setShowStickyBar(false);
      setCelebrationParticles([]);
      toast({
        title: "Motor deselected 🔄",
        description: "You can pick another one, eh!",
        duration: 2000
      });
      return;
    }

    // Select new motor
    // Recently viewed scaffold
    setRecentlyViewed(prev => {
      const without = prev.filter(p => p.id !== motor.id);
      const next = [motor, ...without];
      return next.slice(0, 6);
    });
    setSelectedMotor(motor);
    setShowCelebration(true);
    const particles = Array.from({
      length: 6
    }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: ['✨', '🎉', '⭐', '💚', '✅', '🚤'][i]
    }));
    setCelebrationParticles(particles);
    toast({
      title: pick(canadianEncouragement.motorSelected),
      description: `${motor.model} selected — let's continue, eh!`,
      duration: 2200
    });

    // Gamified promotion toast (if any promos apply)
    const hasSale = motor.stockStatus === 'In Stock' && motor.salePrice != null && motor.basePrice != null && motor.salePrice as number < (motor.basePrice as number);
    const savings = hasSale ? (motor.basePrice as number) - (motor.salePrice as number) : 0;
    const hasWarrantyBonus = (motor.bonusOffers || []).some(b => !!b.warrantyExtraYears && b.warrantyExtraYears > 0);
    const promoItems = getPromoLabelsForMotor(motor);
    if (hasSale || hasWarrantyBonus) {
      toast({
        title: "Promotions applied",
        description: <div className="modal">
            <div className="modal-promos" aria-live="polite">
              {promoItems.length > 0 && <div className="promo-list" role="list">
                  {promoItems.map((txt, idx) => <div className="promo-item" role="listitem" key={idx}>
                      <svg className="pi" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 16.2l-3.5-3.5-1.4 1.4 4.9 4.9 10-10-1.4-1.4z" />
                      </svg>
                      <span className="promo-note">{txt}</span>
                    </div>)}
                </div>}
            </div>
          </div>,
        duration: 2600
      });
    }
    setTimeout(() => {
      console.log('[MotorSelection] Setting sticky bar to true for motor:', motor.model);
      setShowStickyBar(true);
    }, 500);
    setTimeout(() => {
      setShowCelebration(false);
      setCelebrationParticles([]);
    }, 2000);
  };
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p>{loadingText}</p>
        </div>
      </div>;
  }
  return <div className={`${showCelebration ? 'canadian-celebration' : ''}`}>
      {/* Mobile-Only Sticky Search Bar - Compact Single Row */}
      <div className="sticky top-[72px] z-30 bg-white border-b shadow-sm lg:hidden">
        <div className="p-3">
          {/* Single Row: Search + Stock Toggle + Filter Button */}
          <div className="flex items-center gap-2 h-11">
            {/* Search Input - Full Width with iOS zoom prevention */}
            <div className="flex-1 relative">
              <Input 
                type="search" 
                placeholder="Search HP"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Fire search_performed analytics event
                  if (e.target.value && typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'search_performed', {
                      search_query: e.target.value
                    });
                  }
                }}
                className="w-full pl-8 pr-3 py-2 border rounded-lg text-[16px] focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                style={{ fontSize: '16px' }} // iOS zoom prevention
              />
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Compact Icon Buttons */}
            <div className="flex items-center gap-1">
              {/* Stock Toggle Button */}
              <button
                className={`p-2 rounded-lg border transition-colors flex items-center justify-center min-w-[44px] h-[44px] ${
                  inStockOnly 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
                onClick={() => {
                  setInStockOnly(!inStockOnly);
                  // Fire analytics
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'filter_applied', {
                      filter_type: 'in_stock_only',
                      filter_value: !inStockOnly
                    });
                  }
                }}
                aria-label={inStockOnly ? "Show all motors" : "Show in-stock only"}
              >
                <span className="text-xs font-bold">✓</span>
              </button>
              
              {/* Filters Button */}
              <div className="min-w-[44px] h-[44px]">
                <MobileFilterSheet 
                  filters={{
                    inStockOnly,
                    hpRange: selectedHPRange === 'all' ? '' : selectedHPRange,
                    engineType: selectedEngineType === 'all' ? '' : selectedEngineType
                  }}
                  onFiltersChange={(filters) => {
                    // Apply filters to the component state
                    setInStockOnly(filters.inStockOnly);
                    setSelectedHPRange(filters.hpRange || 'all');
                    setSelectedEngineType(filters.engineType || 'all');
                    
                    // Fire analytics
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'filter_applied', {
                        hp_range: filters.hpRange || 'all',
                        engine_type: filters.engineType || 'all', 
                        in_stock_only: filters.inStockOnly
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Active Filters Chips */}
          {(selectedHPRange !== 'all' || selectedEngineType !== 'all' || searchQuery) && (
            <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
              {selectedHPRange !== 'all' && (
                <button 
                  className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium whitespace-nowrap"
                  onClick={() => {
                    setSelectedHPRange('all');
                    // Fire analytics
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'filter_chip_removed', {
                        filter_type: 'hp_range',
                        filter_value: selectedHPRange
                      });
                    }
                  }}
                >
                  {selectedHPRange === '2.5-20' && 'Portable (2.5-20 HP)'}
                  {selectedHPRange === '25-60' && 'Mid-Range (25-60 HP)'}
                  {selectedHPRange === '75-150' && 'High Power (75-150 HP)'}
                  {selectedHPRange === '175-300' && 'V6 (175-300 HP)'}
                  {selectedHPRange === '350+' && 'V8 (350+ HP)'}
                  <span>✕</span>
                </button>
              )}
              {selectedEngineType !== 'all' && (
                <button 
                  className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium whitespace-nowrap"
                  onClick={() => {
                    setSelectedEngineType('all');
                    // Fire analytics
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'filter_chip_removed', {
                        filter_type: 'engine_type',
                        filter_value: selectedEngineType
                      });
                    }
                  }}
                >
                  {selectedEngineType === 'fourstroke' && 'FourStroke'}
                  {selectedEngineType === 'verado' && 'Verado'}
                  {selectedEngineType === 'proxs' && 'Pro XS'}
                  {selectedEngineType === 'seapro' && 'SeaPro'}
                  <span>✕</span>
                </button>
              )}
              {searchQuery && (
                <button 
                  className="flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium whitespace-nowrap"
                  onClick={() => {
                    setSearchQuery('');
                    // Fire analytics
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'search_cleared', {
                        search_query: searchQuery
                      });
                    }
                  }}
                >
                  "{searchQuery}" <span>✕</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Count - Outside and Below Search Bar */}
      <div className="px-4 py-2 bg-gray-50/50 border-b lg:hidden">
        <p className="text-sm text-muted-foreground">
          Showing {filteredMotors.length} motor{filteredMotors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Desktop Search and Filter Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border mb-6 hidden lg:block">
        <div className="container mx-auto px-4 py-3 space-y-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input 
                type="search" 
                placeholder="Search HP (e.g., '150' or '9.9')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                🔍
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              Showing {filteredMotors.length} motor{filteredMotors.length !== 1 ? 's' : ''}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedHPRange('all');
                setInStockOnly(false);
              }}
            >
              Clear
            </Button>
          </div>
          
          {/* HP Range Filter Tabs and Stock Toggle Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="hp-filter-buttons flex gap-2 overflow-x-auto flex-1">
            <Button 
              variant={selectedHPRange === 'all' ? 'default' : 'outline'}
              size="sm"
              className="hp-filter-button whitespace-nowrap rounded-full"
              onClick={() => setSelectedHPRange('all')}
            >
              All
            </Button>
            <Button 
              variant={selectedHPRange === '2.5-20' ? 'default' : 'outline'}
              size="sm"
              className="hp-filter-button whitespace-nowrap rounded-full"
              onClick={() => setSelectedHPRange('2.5-20')}
            >
              2.5-20 HP
            </Button>
            <Button 
              variant={selectedHPRange === '25-60' ? 'default' : 'outline'}
              size="sm"
              className="hp-filter-button whitespace-nowrap rounded-full"
              onClick={() => setSelectedHPRange('25-60')}
            >
              25-60 HP
            </Button>
            <Button 
              variant={selectedHPRange === '75-150' ? 'default' : 'outline'}
              size="sm"
              className="hp-filter-button whitespace-nowrap rounded-full"
              onClick={() => setSelectedHPRange('75-150')}
            >
              75-150 HP
            </Button>
            <Button 
              variant={selectedHPRange === '175-300' ? 'default' : 'outline'}
              size="sm"
              className="hp-filter-button whitespace-nowrap rounded-full"
              onClick={() => setSelectedHPRange('175-300')}
            >
              175-300 HP
            </Button>
            <Button 
              variant={selectedHPRange === '350+' ? 'default' : 'outline'}
              size="sm"
              className="hp-filter-button whitespace-nowrap rounded-full"
              onClick={() => setSelectedHPRange('350+')}
            >
              350+ HP
            </Button>
            </div>
            
            {/* In Stock Only Toggle */}
            <label className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-colors ${
              inStockOnly 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-muted text-muted-foreground border border-border'
            }`}>
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span className="text-sm font-medium whitespace-nowrap">In Stock Only</span>
            </label>
          </div>
          
          {/* Mobile Filter Button */}
          <div className="flex justify-end lg:hidden">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="text-xs"
            >
              🎚️ Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className={`${filtersOpen ? 'w-80' : 'w-16'} transition-all duration-300 flex-shrink-0 hidden lg:block sticky top-[88px] self-start`}>
          {filtersOpen ? (
            <>
              <div className="border-t border-border my-4" />
              <MotorFinderWizard 
                filters={filters} 
                setFilters={setFilters} 
                viewMode={viewMode} 
                setViewMode={setViewMode} 
                resultsCount={filteredMotors.length} 
                isOpen={filtersOpen} 
                onToggle={() => setFiltersOpen(!filtersOpen)} 
              />
            </>
          ) : (
            <div className="bg-background border border-border rounded-lg flex flex-col items-center py-4 space-y-4 h-fit">
              {/* Expand button */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Expand filters"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Filter icon */}
              <div className="p-2 text-muted-foreground" title="Filters">
                <Filter className="w-5 h-5" />
              </div>
              
              {/* Just show motor count */}
              <div className="text-center">
                <div className="text-2xl font-bold">{filteredMotors.length}</div>
                <div className="text-xs text-muted-foreground">motors</div>
              </div>
            </div>
          )}
        
        {/* Live Activities Section */}
        <div className="mt-6">
          <ActivityTicker />
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Customer Reviews (4.6/5 ⭐)
          </h4>
          <TestimonialCarousel />
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="text-center space-y-4 hidden lg:block">
          <div className="flex items-center justify-center gap-4">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-12 w-auto" />
          </div>
        </div>



        {selectedMotor && (typeof selectedMotor.hp === 'number' ? selectedMotor.hp : parseInt(String(selectedMotor.hp))) >= 40 && <div className="controls-savings-banner rounded-md border border-border bg-accent/20 p-3 mt-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">MONEY SAVER</Badge>
              <p className="text-sm">Have Mercury controls from your old motor? Save over $1,000 with our adapter harness!</p>
            </div>
          </div>}


        {/* Mobile Trust Accordion - Replaces desktop badges on mobile */}
        <MobileTrustAccordion />

        <div className="dealer-credentials rounded-lg mb-6 p-4 md:p-6 bg-gradient-to-r from-primary/5 to-muted/40 border border-border hidden sm:block">
          <div className="dealer-credentials-banner flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* CSI Award */}
            <div className="credential-group flex items-center gap-3">
              <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-12 md:h-16 w-auto" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Customer-Nominated</p>
                <p className="text-sm text-muted-foreground">Service Excellence</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-10 w-px bg-border" />

            {/* Repower Center */}
            <div className="credential-group flex items-center gap-3">
              <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-12 md:h-16 w-auto" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Certified Repower Center</p>
                <p className="text-sm text-muted-foreground">Expert Repower Consultation</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-10 w-px bg-border" />

            {/* Platinum Dealer Heritage */}
            <div className="credential-group flex items-center gap-3">
              <img src={harrisLogo} alt="Harris Boat Works Since 1947 logo" loading="lazy" className="h-10 md:h-16 w-auto" />
              <div className="text-left">
                <p className="font-semibold text-foreground">Platinum Mercury Dealer</p>
                <p className="text-sm text-muted-foreground">Family Owned Since 1947 • Serving Rice Lake Area</p>
              </div>
            </div>
          </div>
        </div>

        {filteredMotors.length === 0 ? <Card className="p-12 text-center space-y-2">
            <div className="text-2xl">🍁</div>
            <p className="font-semibold">{emptyStateMessages.noResults.message}</p>
            <p className="text-muted-foreground">{emptyStateMessages.noResults.submessage}</p>
          </Card> : <div className={`grid motors-grid items-stretch gap-2 sm:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredMotors.map(motor => {
          const msrp = motor.basePrice && motor.basePrice > 0 ? motor.basePrice : null;
          const sale = motor.salePrice && motor.salePrice > 0 ? motor.salePrice : null;
          const state = getPriceDisplayState(msrp, sale);
          const hasSaleDisplay = state.hasSale;
          const callForPrice = state.callForPrice;
          const savingsAmount = state.savingsRounded;
          const savingsPct = state.percent;
          if (sale != null && msrp != null && sale >= msrp) {
            console.warn('[pricing] sale_price not less than base_price', {
              id: motor.id,
              model: motor.model,
              base_price: msrp,
              sale_price: sale
            });
          }
          const hasBonus = !!(motor.bonusOffers && motor.bonusOffers.length > 0);
          const topBonus = hasBonus ? [...(motor.bonusOffers || [])].sort((a, b) => b.highlight === a.highlight ? b.priority - a.priority : b.highlight ? 1 : -1)[0] : null;

          // Per-card promo parsing (case/whitespace tolerant)
          const promoBlob = `${(motor.appliedPromotions || []).join(' ')} ${(motor.bonusOffers || []).map(b => `${b.title ?? ''} ${b.shortBadge ?? ''}`).join(' ')}`;
          const hasGet5 = /(mercury\s*)?(get\s*5|get5|5\s*year)/i.test(promoBlob);
          const hasRepower = /(repower(\s*rebate)?)/i.test(promoBlob);
          const warrantyBonus = (motor.bonusOffers || []).find(b => (b.warrantyExtraYears || 0) > 0);
          const repowerBonus = (motor.bonusOffers || []).find(b => /(repower(\s*rebate)?)/i.test(`${b.title ?? ''} ${b.shortBadge ?? ''}`));
          const showWarrantyBadge = hasGet5 || !!warrantyBonus;
          const otherPromoNames = (motor.appliedPromotions || []).filter(name => {
            const t = name.toLowerCase();
            if (/(mercury\s*)?(get\s*5|get5|5\s*year)/i.test(t)) return false;
            if (/(repower(\s*rebate)?)/i.test(t)) return false;
            return true;
          });
          const stockCount = (motor as any)?.stockCount as number | undefined;
          const recentSales = (motor as any)?.recentSales as number | undefined;
           return <Card key={motor.id} className={`motor-card relative bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${selectedMotor?.id === motor.id ? 'ring-3 ring-green-500 shadow-xl shadow-green-500/20 scale-[1.02] motor-selected border-green-500' : 'hover:scale-[1.01] active:scale-[0.98]'} ${selectedMotor && selectedMotor.id !== motor.id ? 'opacity-70' : ''} ${(motor as any).stockStatus === 'Sold' ? 'opacity-50 cursor-not-allowed' : ''} flex flex-col`} onClick={() => (motor as any).stockStatus !== 'Sold' && handleMotorSelection(motor)}>

                   {/* Image Section - Moved to top for better layout consistency */}
                   {motor.image && motor.image !== '/placeholder.svg' && (
                     <div className="motor-card-image-container relative">
                       <img 
                         src={motor.image} 
                         alt={motor.model} 
                         loading="lazy" 
                         className="motor-card-image w-full object-contain"
                       />

                       {/* HP Badge - Top left */}
                       <div className="absolute top-3 left-3 z-20">
                         <div className="px-2 py-1 rounded-md bg-gray-900/90 text-white text-xs font-medium">
                           {motor.hp} HP
                         </div>
                       </div>

                       {/* Stock Badge - Top right, aligned with HP badge */}
                       <div className="absolute top-3 right-3 z-20">
                         {motor.stockStatus === 'In Stock' && (
                           <span className="in-stock-badge px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                             IN STOCK
                           </span>
                         )}
                         {motor.stockStatus === 'Order Now' && (
                           <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                             ORDER NOW
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

                      {/* Urgency: low stock */}
                      {typeof stockCount === 'number' && stockCount > 0 && stockCount <= 2 && (
                        <div className="absolute top-3 left-3 z-20 animate-fade-in" style={{ marginTop: '2.5rem' }}>
                          <Badge variant="discount" className="flex items-center gap-1 shadow">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Only {stockCount} left</span>
                          </Badge>
                        </div>
                      )}

                      {/* Social proof: recent sales */}
                      {typeof recentSales === 'number' && recentSales > 5 && (
                        <div className="absolute top-3 left-3 z-20 animate-fade-in" style={{ 
                          marginTop: typeof stockCount === 'number' && stockCount > 0 && stockCount <= 2 ? '5rem' : '2.5rem'
                        }}>
                          <Badge variant="warranty" className="flex items-center gap-1 shadow">
                            <Star className="w-3.5 h-3.5" />
                            <span>{recentSales} sold this month</span>
                          </Badge>
                        </div>
                      )}

                      {/* Info button */}
                      <button 
                        type="button" 
                        className="absolute top-16 right-4 z-20 w-8 h-8 rounded-full bg-background/95 text-foreground border border-border shadow-md flex items-center justify-center opacity-90 transition-transform transition-opacity hover:opacity-100 hover:scale-110"
                        aria-label="Motor info" 
                        onClick={e => {
                          e.stopPropagation();
                          openQuickView(motor);
                        }}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                          
                      {/* Selection overlay */}
                      {selectedMotor?.id === motor.id && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center animate-fade-in selection-overlay" aria-hidden="true">
                          <Check className="w-20 h-20 text-green-600 drop-shadow-lg animate-scale-in checkmark-icon" strokeWidth={4} aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Info Section */}
                  <div className="p-3 space-y-2 flex-1">
                    {/* Model Name - Clamped to 2 lines for consistency */}
                    <div className="motor-model text-xl font-bold text-gray-900 leading-tight line-clamp-2">
                      {(() => {
                        const title = formatMotorTitle(motor.year, motor.model);
                        return title;
                      })()}
                    </div>
                    
                    
                    {/* Price */}
                    <div className="motor-price space-y-1">
                      {callForPrice ? (
                        <div className="text-lg font-bold text-foreground">Call for Price</div>
                      ) : hasSaleDisplay ? (
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground line-through">
                            MSRP ${motor.basePrice?.toLocaleString() || motor.price.toLocaleString()}
                          </div>
                          <div className="text-lg font-bold text-red-600">
                            Our Price ${motor.salePrice?.toLocaleString() || motor.price.toLocaleString()}
                          </div>
                          <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                            SAVE ${savingsAmount.toLocaleString()} ({savingsPct}%)
                          </div>
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-foreground">
                          ${motor.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="flex gap-1 flex-wrap">
                      {showWarrantyBadge && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          {warrantyBonus?.shortBadge || '5 Year Warranty'}
                        </span>
                      )}
                      {hasRepower && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Repower Rebate
                        </span>
                      )}
                      {otherPromoNames.slice(0, 1).map((name, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          {name}
                        </span>
                      ))}
                    </div>
                    
                    {/* Monthly Payment Display */}
                    <MonthlyPaymentDisplay motorPrice={motor.price} />
                  </div>

          </Card>;
        })}
        </div>}
                                <p>Mercury’s Repower Rebate Program — trade in or repower for potential savings. See details.</p>


        {selectedMotor && !showStickyBar && (selectedMotor as any).stockStatus !== 'Sold' && <div className="flex justify-center pt-8 animate-in slide-in-from-bottom-4 duration-500">
            <Button onClick={() => onStepComplete(selectedMotor)} className="btn-primary px-8 animate-pulse">
              Continue with {selectedMotor.model}
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </div>}
      </div>

      {showStickyBar && selectedMotor && (selectedMotor as any).stockStatus !== 'Sold' && <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5 duration-500">
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
                        {selectedMotor.stockStatus === 'In Stock' && selectedMotor.salePrice != null && selectedMotor.basePrice != null && selectedMotor.salePrice as number < (selectedMotor.basePrice as number) && <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold animate-fade-in">
                            <span className="mr-1">💰</span> Save ${((selectedMotor.basePrice as number) - (selectedMotor.salePrice as number)).toLocaleString()}
                          </span>}
                        {renderBannerPromos(selectedMotor)}
                      </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="btn-secondary" onClick={() => {
                console.log('[MotorSelection] Change Selection clicked, clearing state');
                setSelectedMotor(null);
                setShowStickyBar(false);
                setShowCelebration(false);
                setCelebrationParticles([]);
              }}>
                    Change Selection
                  </Button>
                  <Button onClick={() => onStepComplete(selectedMotor)} 
                    disabled={(selectedMotor as any).stockStatus === 'Sold'}
                    className={`btn-primary px-6 shadow-lg ${(selectedMotor as any).stockStatus === 'Sold' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 animate-pulse-green'}`}>
                    {(selectedMotor as any).stockStatus === 'Sold' ? 'Motor Sold' : 'Continue to Boat Info'}
                    <Zap className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {showStickyBar && selectedMotor && isMobile && (selectedMotor as any).stockStatus !== 'Sold' && <div className="fixed bottom-20 right-4 z-40 animate-in zoom-in-50 duration-500">
          <Button onClick={() => onStepComplete(selectedMotor)} className="rounded-full w-14 h-14 shadow-2xl bg-green-600 hover:bg-green-700 animate-bounce">
            <Check className="w-6 h-6" />
          </Button>
        </div>}

      {celebrationParticles.map(particle => <div key={particle.id} className="fixed pointer-events-none z-30 text-2xl animate-in zoom-in-50 fade-out-100 duration-2000" style={{
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      animationDelay: `${Math.random() * 500}ms`
    }}>
          {particle.emoji}
        </div>)}

      {showCelebration && selectedMotor && <div className="fixed top-4 right-4 z-40 animate-in slide-in-from-right-5 duration-500">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">Great Choice!</span>
            <Star className="w-5 h-5" />
          </div>
        </div>}

      {/* Promo Details Modal */}
      <PromoDetailsModal promo={activePromoModal} open={!!activePromoModal} onOpenChange={open => {
      if (!open) setActivePromoModal(null);
    }} />


      {/* Quick View Dialog */}
      <Dialog open={!!quickViewMotor} onOpenChange={o => {
      if (!o) setQuickViewMotor(null);
    }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{(quickViewMotor?.model || '').replace(/ - \d+(\.\d+)?HP$/i, '')}</DialogTitle>
            <DialogDescription className="sr-only">
              Quick view details for {(quickViewMotor?.model || '').replace(/ - \d+(\.\d+)?HP$/i, '')}
            </DialogDescription>
          </DialogHeader>
          {quickViewMotor && <div className="space-y-4">
              {quickViewLoading && <div className="text-sm text-muted-foreground">Loading details…</div>}
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
                      ${(quickViewMotor.salePrice || quickViewMotor.basePrice || quickViewMotor.price).toLocaleString()}
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
                    warranty: '3 Year'
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
                  features.forEach(f => {
                    const text = String(f);
                    // Weight
                    if (/weight/i.test(text) || /(lbs?|kg)/i.test(text)) {
                      const m = text.match(/(\d+\.?\d*)\s*(lbs?|kg)/i);
                      if (m) specs.weight = `${m[1]} ${m[2]}`;
                    }
                    // Starting
                    if (/start(ing)?:/i.test(text)) {
                      if (/electric/i.test(text)) specs.start = 'Electric';else if (/manual/i.test(text)) specs.start = 'Manual';
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
                    if (/efi|fuel injection/i.test(text)) specs.fuel = 'EFI';else if (/carb/i.test(text)) specs.fuel = 'Carburetor';
                  });

                  // Model-based hints
                  if (/\bMH\b/i.test(model)) specs.start = specs.start === 'See details' ? 'Manual' : specs.start;
                  if (/\bEH\b|\bELPT\b/i.test(model)) specs.start = specs.start === 'See details' ? 'Electric' : specs.start;
                  if (/EFI/i.test(model)) specs.fuel = 'EFI';
                  
                  // Fuel system for 2.5HP and 3.5HP motors (internal only, no external connection)
                  const hp = quickViewMotor.hp || 0;
                  if ((hp === 2.5 || hp === 3.5) && /tiller/i.test(model)) {
                    specs.fuel = 'Internal only';
                  }
                  if (/\bL\b/.test(model)) specs.shaft = specs.shaft === 'Multiple options' ? '20" (Long)' : specs.shaft;
                  if (/\bS\b/.test(model)) specs.shaft = specs.shaft === 'Multiple options' ? '15" (Short)' : specs.shaft;

                  // Final weight fallback: prefer scraped specification weight, else standard mapping
                  const specWeight = (quickViewMotor.specifications as any)?.weight;
                  if (specs.weight === 'Contact for specs') {
                    if (specWeight) specs.weight = String(specWeight);else specs.weight = getStandardWeight(model);
                  }
                  return specs;
                })();

                // Clean features for display (exclude nav/social links, urls, too short)
                const displayFeatures = features.filter(f => {
                  const t = String(f).trim();
                  return t.length > 5 && t.length < 200 && !/https?:\/\//i.test(t) && !/\[.*\]\(.*\)/.test(t) && !/^\s*URL:/i.test(t) && !/can't find/i.test(t) && !/click here/i.test(t) && !/looking for/i.test(t);
                }).slice(0, 8);
                const cleanedDescription = String(quickViewMotor.description || '').replace(/Can't find what you're looking for\?[\s\S]*/i, '').replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '').trim();
                return <>
                        <div className="grid grid-cols-2 gap-3 bg-accent p-4 rounded-md text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Power</span><strong>{quickViewMotor.hp} HP</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><strong>{displaySpecs.weight}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Shaft</span><strong>{displaySpecs.shaft}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Start</span><strong>{displaySpecs.start}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Fuel</span><strong>{displaySpecs.fuel}</strong></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Warranty</span><strong>{displaySpecs.warranty}</strong></div>
                        </div>

                        {(!quickViewMotor.description || !quickViewMotor.specifications || Object.keys(quickViewMotor.specifications as any).length === 0) && <Button variant="outline" size="sm" disabled={quickViewLoading} onClick={async () => {
                    try {
                      setQuickViewLoading(true);
                      const {
                        data,
                        error
                      } = await supabase.functions.invoke('scrape-motor-details', {
                        body: {
                          motor_id: quickViewMotor.id,
                          detail_url: quickViewMotor.detailUrl
                        }
                      });
                      if (error) throw error;
                      const {
                        description,
                        features,
                        specifications
                      } = data as any || {};
                      setMotors(prev => prev.map(mm => mm.id === quickViewMotor.id ? {
                        ...mm,
                        description,
                        features,
                        specifications
                      } : mm));
                      setQuickViewMotor(prev => prev ? {
                        ...prev,
                        description,
                        features,
                        specifications
                      } as Motor : prev);
                    } catch (e) {
                      console.log('Motor details sync issue - using available data:', e);
                      toast({
                         title: 'Motor Details',
                         description: 'Showing available specifications',
                         variant: 'default'
                      });
                    } finally {
                      setQuickViewLoading(false);
                    }
                  }}>
                            {quickViewLoading ? 'Loading…' : 'Load Full Specs'}
                          </Button>}

                        {displayFeatures.length > 0 && <div className="features-list">
                            <h4 className="font-semibold mb-2">Key Features:</h4>
                            <ul className="text-sm space-y-1">
                              {displayFeatures.map((feature, i) => <li key={`${feature}-${i}`} className="flex items-start">
                                  <span className="text-green-500 mr-2">✓</span>
                                  {feature}
                                </li>)}
                            </ul>
                          </div>}

                        {/* Buyer-critical information */}
                        <hr className="my-4 border-border" />
                        </>;
              })()}
                </div>
              </div>

              {/* Understanding This Model - full width section */}
              <div className="bg-accent border border-border p-4 rounded-md mt-6">
                <h4 className="font-semibold mb-2">Understanding This Model</h4>
                <div className="space-y-2">
                  {decodeModelName(quickViewMotor.model).map((item, idx) => <div key={idx} className="flex items-start gap-3">
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">
                        {item.code}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">{item.meaning}</span>
                        <span className="text-muted-foreground text-sm ml-2">- {item.benefit}</span>
                      </div>
                    </div>)}
                </div>

                {/* Helpful tips */}
                {quickViewMotor.hp >= 40 && <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                    <strong>Remote Control Only:</strong> This motor requires console steering with remote throttle and shift controls. Too powerful for tiller operation.
                  </div>}
                {quickViewMotor.hp <= 30 && /(MH|MLH|EH|ELH)/i.test(quickViewMotor.model) && <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                    <strong>Tiller Handle:</strong> Perfect if you sit at the back of the boat. Great for fishing where precise control matters.
                  </div>}
                {!quickViewMotor.model.includes('E') && quickViewMotor.model.includes('M') && <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                    <strong>Manual Start:</strong> No battery needed — ideal for occasional use or as a backup motor. Very reliable.
                  </div>}
              </div>

              {/* Two-column grid for remaining info blocks - spans full modal width */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Installation Requirements */}
                <div className="bg-secondary text-secondary-foreground p-4 rounded-md requirements-section">
                  <h4 className="font-semibold mb-2 flex items-center"><Wrench size={16} className="mr-2" /> Installation Requirements</h4>
                  {quickViewMotor.hp >= 40 && <div className="text-destructive font-semibold flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} />
                      <span>Note: Remote controls required (additional ~$1,200)</span>
                    </div>}
                  <ul className="text-sm space-y-1">
                    <li>✓ Transom Height: {getTransomRequirement(quickViewMotor)}</li>
                    <li>✓ Battery Required: {getBatteryRequirement(quickViewMotor)}</li>
                    <li>✓ Control Type: {(() => {
                  const hp = typeof quickViewMotor.hp === 'string' ? parseInt(quickViewMotor.hp) : quickViewMotor.hp;
                  if (hp < 40) return 'Tiller or Remote';
                  return <>
                          Remote required
                          <span className="text-in-stock text-xs block">(Existing Mercury controls? Save $1,075 with adapter!)</span>
                        </>;
                })()}</li>
                    <li>✓ Fuel Type: {getFuelRequirement(quickViewMotor)}</li>
                    <li>✓ Oil Requirements: {getOilRequirement(quickViewMotor)}</li>
                  </ul>
                </div>

                {/* Perfect For */}
                <div className="bg-accent p-4 rounded-md use-cases-section">
                  <h4 className="font-semibold mb-2">🎯 Perfect For</h4>
                  <div className="text-sm">
                    {getIdealUses(quickViewMotor.hp)}
                  </div>
                </div>

                {/* Total Investment Estimate */}
                <div className="bg-accent p-3 rounded-md text-sm total-investment">
                  <h4 className="font-semibold flex items-center gap-2"><Calculator size={16} /> Total Investment Estimate</h4>
                  <div className="text-sm space-y-1">
                    {(() => {
                const price = Number((quickViewMotor as any).salePrice ?? (quickViewMotor as any).basePrice ?? (quickViewMotor as any).price ?? 0);
                const hp = typeof quickViewMotor.hp === 'string' ? parseInt(quickViewMotor.hp) : quickViewMotor.hp;
                const model = (quickViewMotor.model || '').toUpperCase();
                const needsControls = hp >= 40;
                const needsBattery = /\bE\b|EL|ELPT|EH|EFI/.test(model) && !/\bM\b/.test(model);
                const propCost = hp >= 25 ? hp >= 150 ? 950 : 350 : 0;
                const total = price + (needsControls ? 1200 : 0) + (needsBattery ? 179.99 : 0) + propCost + 500;
                return <>
                           <div>Motor: {'$' + price.toLocaleString()}</div>
                           {needsControls && <div>Controls: ~$1,200</div>}
                           {needsBattery && <div>Battery: ~$179.99</div>}
                           {propCost > 0 && <div>Propeller: ~${propCost}</div>}
                          <div>Installation: ~$500</div>
                          <div className="font-bold pt-1 border-t border-border">Total: ~{'$' + total.toLocaleString()} + HST</div>
                          <div className="investment-note text-xs mt-2">
                            <p>* Includes all required accessories:</p>
                            <ul className="text-xs list-disc pl-5">
                              {hp >= 40 && <li>Remote controls</li>}
                              {hp >= 25 && <li>Propeller ({hp >= 150 ? 'SS' : 'Alum'})</li>}
                              <li>Battery (if electric start)</li>
                              <li>FREE water testing</li>
                            </ul>
                            <p className="text-xs mt-2 text-muted-foreground">*Approximate amounts only. Confirm with Harris Boat Works.</p>
                          </div>
                        </>;
              })()}
                  </div>
                </div>

                {/* Performance Estimates - moved from top */}
                <div className="bg-accent p-4 rounded-md performance-section">
                  <h4 className="font-semibold mb-2 flex items-center">⚡ Performance Estimates</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Ship size={16} /> <span>Boat Size</span>
                      </div>
                      <strong className="block">{getRecommendedBoatSize(quickViewMotor.hp)}</strong>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Gauge size={16} /> <span>Top Speed</span>
                      </div>
                      <strong className="block">{getEstimatedSpeed(quickViewMotor.hp)}</strong>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Fuel size={16} /> <span>Fuel Use</span>
                      </div>
                      <strong className="block">{getFuelConsumption(quickViewMotor.hp)}</strong>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin size={16} /> <span>Range</span>
                      </div>
                      <strong className="block">{getRange(quickViewMotor.hp)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
            const d = String(quickViewMotor.description || '').replace(/Can't find what you're looking for\?[\s\S]*/i, '').replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '').trim();
            return d ? <div className="text-sm text-muted-foreground">{d}</div> : null;
          })()}




              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => {
                calculatePayment(quickViewMotor);
                setQuickViewMotor(null);
              }}>
                    Calculate Payment
                  </Button>
                </div>
                <Button size="lg" onClick={() => {
              handleMotorSelection(quickViewMotor);
              setQuickViewMotor(null);
            }}>
                  Select This Motor →
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky CTA */}
      <MobileStickyCTA onQuoteClick={() => {
        // Fire analytics event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'cta_quote_open', {
            source: 'sticky_mobile_cta'
          });
        }
        setQuoteFormModel(''); // Clear any previous selection
        setShowQuoteForm(true);
      }} />

      {/* Mobile Quote Form */}
      <MobileQuoteForm 
        isOpen={showQuoteForm}
        onClose={() => {
          setShowQuoteForm(false);
          setQuoteFormModel(''); // Clear model when closing
        }}
        prefilledModel={quoteFormModel}
      />

      {/* Sticky Bottom Price Bar - Mobile Only */}
      {selectedMotor && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary/20 shadow-2xl p-4 z-40 lg:hidden backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Price Display */}
            <div className="flex-shrink-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Selected Motor</div>
              <div className="text-xl font-bold text-foreground">${selectedMotor.price.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{selectedMotor.model}</div>
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
  </div>;
};