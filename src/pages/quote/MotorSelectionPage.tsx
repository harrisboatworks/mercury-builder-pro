import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';
import { FinancingProvider } from '@/contexts/FinancingContext';
import { MotorViewProvider } from '@/contexts/MotorViewContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAutoImageScraping } from '@/hooks/useAutoImageScraping';
import { useExitIntent } from '@/hooks/useExitIntent';
import { useGroupedMotors } from '@/hooks/useGroupedMotors';
import { useMotorComparison } from '@/hooks/useMotorComparison';
import { useFavoriteMotors } from '@/hooks/useFavoriteMotors';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { daysUntil } from '@/lib/finance';
import { Clock } from 'lucide-react';
// useScrollDirection removed - search bar scrolls naturally now
import { HybridMotorSearch } from '@/components/motors/HybridMotorSearch';
import MotorCardPreview from '@/components/motors/MotorCardPreview';
import { MotorCardSkeleton } from '@/components/motors/MotorCardSkeleton';
import { HPMotorCard } from '@/components/motors/HPMotorCard';
// ViewModeToggle removed - using expert view only
import { MotorConfiguratorModal } from '@/components/motors/MotorConfiguratorModal';
import { type ConfigFiltersState } from '@/components/motors/ConfigFilterPills';
import { ConfigFilterSheet } from '@/components/motors/ConfigFilterSheet';
import { RecentlyViewedBar } from '@/components/motors/RecentlyViewedBar';
import { ComparisonDrawer } from '@/components/motors/ComparisonDrawer';
import { SearchOverlay } from '@/components/ui/SearchOverlay';
// ComparisonFloatingPill removed - comparison now integrated into UnifiedMobileBar
import { Button } from '@/components/ui/button';
import { QuoteLayout } from '@/components/quote-builder/QuoteLayout';
import { PageTransition } from '@/components/ui/page-transition';
import { MotorRecommendationQuiz } from '@/components/quote-builder/MotorRecommendationQuiz';
import { PromoReminderModal } from '@/components/quote-builder/PromoReminderModal';
import { VoiceStatusBanner } from '@/components/voice/VoiceStatusBanner';

import { fuzzySearch } from '@/lib/fuzzySearch';
import { preloadConfiguratorImages } from '@/lib/configurator-preload';
import '@/styles/premium-motor.css';
import '@/styles/sticky-quote-mobile.css';
import { classifyMotorFamily, getMotorFamilyDisplay } from '@/lib/motor-family-classifier';
import { getMotorImages } from '@/lib/mercury-product-images';
import { VOICE_NAVIGATION_EVENT, type VoiceNavigationEvent } from '@/lib/voiceNavigation';
import { setVisibleMotors, type VisibleMotor } from '@/lib/visibleMotorsStore';
import type { MotorGroup } from '@/hooks/useGroupedMotors';
import { hasElectricStart, hasManualStart, hasTillerControl, hasRemoteControl } from '@/lib/motor-config-utils';
import { parseMercuryRigCodes } from '@/lib/mercury-codes';

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
  hero_image_url?: string | null;
  availability?: string | null;
  stock_number?: string | null;
  stock_quantity?: number | null;
  in_stock?: boolean | null;
  year: number;
  make: string;
  description?: string | null;
  features?: string[] | null;
  specifications?: Record<string, any> | null;
  spec_json?: Record<string, any> | null;
  detail_url?: string | null;
  manual_overrides?: Record<string, any> | null;
  images?: any[] | null;
  shaft?: string | null;
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

function MotorSelectionContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, dispatch } = useQuote();
  const { toast } = useToast();
  
  
  // UX feature hooks
  const { 
    comparisonList, 
    toggleComparison, 
    isInComparison, 
    removeFromComparison, 
    clearComparison, 
    count: comparisonCount, 
    isFull: comparisonFull 
  } = useMotorComparison();
  const { toggleFavorite, isFavorite } = useFavoriteMotors();
  const { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [showComparison, setShowComparison] = useState(false);
  
  // Search overlay state - triggered from header search icon
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  
  const [motors, setMotors] = useState<DbMotor[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MotorGroup | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  
  // Quiz state - local state since we removed the view mode toggle
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Config filter state - shared by UI pills and voice commands
  const [configFilters, setConfigFilters] = useState<ConfigFiltersState | null>(null);
  
  // Exit intent for promo reminder
  const { showExitIntent, dismiss: dismissExitIntent } = useExitIntent({
    delay: 10000, // Show after 10 seconds on page
    triggerOnce: true,
    storageKey: 'promo_reminder_motor_selection'
  });
  
  // Get the currently viewed motor for the promo modal
  const exitIntentMotor = useMemo(() => {
    // If user has selected a motor, use that
    if (state.motor) {
      return {
        id: state.motor.id,
        model: state.motor.model,
        horsepower: state.motor.hp,
        price: state.motor.price
      };
    }
    // Otherwise use first motor in filtered list
    return null;
  }, [state.motor]);

  // Scroll to top of motor grid when filter changes (not on initial load)
  useEffect(() => {
    if (searchQuery && hasInitiallyLoaded) {
      const gridSection = document.querySelector('.motor-grid-section');
      if (gridSection) {
        const headerOffset = 180;
        const elementPosition = gridSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'auto' });
      }
    }
  }, [searchQuery, hasInitiallyLoaded]);

  // Track initial load to avoid scroll/animation issues on filter changes
  useEffect(() => {
    if (motors.length > 0 && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [motors.length, hasInitiallyLoaded]);

  // Listen for voice navigation events from the voice agent
  useEffect(() => {
    const handleVoiceNavigation = (e: CustomEvent<VoiceNavigationEvent>) => {
      const event = e.detail;
      
      if (event.type === 'filter_motors') {
        const { horsepower, model, inStock, startType, controlType, shaftLength } = event.payload;
        
        // Set HP/model as search query (fuzzy search handles this well)
        if (horsepower) {
          setSearchQuery(String(horsepower));
        } else if (model) {
          setSearchQuery(model);
        } else if (inStock) {
          setSearchQuery('stock');
        }
        
        // Store structured filters separately for real filtering
        if (startType || controlType || shaftLength || inStock) {
          setConfigFilters({
            startType: startType as 'electric' | 'manual' | undefined,
            controlType: controlType as 'tiller' | 'remote' | undefined,
            shaftLength: shaftLength as 'short' | 'long' | 'xl' | 'xxl' | undefined,
            inStock: inStock ? true : undefined,
          });
        } else {
          setConfigFilters(null);
        }
        
        // Scroll to the motor grid
        setTimeout(() => {
          const gridSection = document.querySelector('.motor-grid-section');
          if (gridSection) {
            const headerOffset = 180;
            const elementPosition = gridSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
          }
        }, 100);
        
        // Build descriptive toast message
        const descParts: string[] = [];
        if (horsepower) descParts.push(`${horsepower}HP`);
        if (startType) descParts.push(startType === 'electric' ? 'electric start' : 'pull-start');
        if (shaftLength) descParts.push(`${shaftLength} shaft`);
        if (controlType) descParts.push(controlType);
        
        const filterDesc = descParts.length > 0 
          ? descParts.join(', ') + ' motors'
          : model 
            ? `"${model}" motors`
            : 'in-stock motors';
            
        toast({
          title: "Motors filtered",
          description: `Showing ${filterDesc}`,
        });
      }
    };
    
    window.addEventListener(VOICE_NAVIGATION_EVENT, handleVoiceNavigation as EventListener);
    return () => window.removeEventListener(VOICE_NAVIGATION_EVENT, handleVoiceNavigation as EventListener);
  }, [toast]);

  // Auto-trigger background image scraping for motors without images
  const imageScrapeStatus = useAutoImageScraping(motors.map(motor => ({
    id: motor.id,
    model: motor.model,
    images: motor.images,
    image_url: motor.image_url,
    detail_url: motor.detail_url
  })));

  // Load motors and promotions from Supabase
  const loadData = useCallback(async () => {
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
      const filteredMotors = (motorsData?.filter(motor => 
        !motor.model?.toLowerCase().includes('jet') &&
        motor.horsepower <= 600 && // HP cap same as original
        motor.availability !== 'Exclude' // Exclude motors marked as "Exclude"
      ) || []).map(motor => {
        // Normalize features: extract title if features are objects
        if (motor.features && Array.isArray(motor.features) && motor.features.length > 0) {
          const firstFeature = motor.features[0];
          if (typeof firstFeature === 'object' && firstFeature !== null && 'title' in firstFeature) {
            motor.features = motor.features.map((f: any) => 
              typeof f === 'object' && f !== null && f.title ? f.title : String(f)
            );
          }
        }
        return motor;
      });
      
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
  }, [toast]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);


  // Preload configurator images after motors load (non-blocking)
  useEffect(() => {
    if (!loading && motors.length > 0) {
      preloadConfiguratorImages();
    }
  }, [loading, motors.length]);

  // Convert DB motor to Motor type and apply promotions (same logic as original)
  const processedMotors = useMemo(() => {
    return motors.map(dbMotor => {
      // Apply promotions - prioritize manual overrides, then msrp
      const manualOverrides = dbMotor.manual_overrides || {};
      const basePrice = manualOverrides.base_price || dbMotor.msrp || dbMotor.base_price || 0;
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

      // Use database images only - let MotorCardPreview handle fallback via getMotorImageByPriority
      const heroImage = dbMotor.hero_image_url || dbMotor.image_url || '';
      const dbImages = Array.isArray(dbMotor.images) 
        ? (dbMotor.images as Array<{url: string} | string>).map(img => typeof img === 'string' ? img : img.url)
        : [];
      const galleryImages = dbImages.length > 0 ? dbImages : (getMotorImages(dbMotor.horsepower)?.galleryImages || []);

      // Convert to Motor type (same as original)
      const convertedMotor: Motor = {
        id: dbMotor.id,
        model: dbMotor.model_display || dbMotor.model, // Use model_display for proper names like "6 MH FourStroke"
        year: dbMotor.year,
        hp: Number(dbMotor.horsepower),
        price: Math.round(effectivePrice),
        image: heroImage,
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
        msrp: dbMotor.msrp || basePrice, // Preserve original MSRP from database
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
        }).filter(Boolean) as any[],
        // Pass through database fields for accurate specs and descriptions
        specifications: dbMotor.specifications,
        description: dbMotor.description,
        spec_json: dbMotor.spec_json,
        features: dbMotor.features,
        shaft: dbMotor.shaft,
        images: galleryImages
      };
      
      return convertedMotor;
    });
  }, [motors, promotions, promotionRules]);

  // Calculate monthly payments for each motor
  
  // Get active financing promo for dynamic rate
  const { promo: financingPromo } = useActiveFinancingPromo();
  const currentFinancingRate = financingPromo?.rate ?? 7.99;
  
  const monthlyPayments = useMemo(() => {
    const payments: Record<string, number | null> = {};
    
    processedMotors.forEach(motor => {
      // Simple calculation without hook - matches useMotorMonthlyPayment logic
      if (motor.price > 5000) {
        const annualRate = currentFinancingRate; // Dynamic rate from promo
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
  }, [processedMotors, currentFinancingRate]);

  // Filter motors with intelligent search + fuzzy matching
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
    
    // Parse advanced search syntax first
    if (query.includes('hp:')) {
      const hpMatch = query.match(/hp:(\d+(?:\.\d+)?)/);
      if (hpMatch) return processedMotors.filter(m => m.hp === Number(hpMatch[1]));
    }
    
    if (query.includes('hp:>')) {
      const hpMatch = query.match(/hp:>(\d+(?:\.\d+)?)/);
      if (hpMatch) return processedMotors.filter(m => m.hp > Number(hpMatch[1]));
    }
    
    if (query.includes('hp:<')) {
      const hpMatch = query.match(/hp:<(\d+(?:\.\d+)?)/);
      if (hpMatch) return processedMotors.filter(m => m.hp < Number(hpMatch[1]));
    }
    
    if (query.includes('stock') || query.includes('instock')) {
      return processedMotors.filter(m => m.in_stock === true);
    }
    
    // Numeric queries: smart HP match
    const isNumericQuery = /^\d+(\.\d+)?$/.test(query);
    if (isNumericQuery) {
      const searchHP = Number(query);
      return processedMotors.filter(motor => {
        // Exact match
        if (Number(motor.hp) === searchHP) return true;
        // Allow "9" to match "9.9" (user typed integer, motor has decimal)
        if (Number.isInteger(searchHP) && Math.floor(motor.hp) === searchHP && motor.hp !== Math.floor(motor.hp)) return true;
        return false;
      });
    }
    
    // Use fuzzy search for text queries
    const fuzzyResults = fuzzySearch(processedMotors, query, ['model', 'type', 'model_number'], {
      threshold: 0.35,
      maxResults: 50
    });
    
    return fuzzyResults.map(r => r.item);
  }, [processedMotors, searchQuery]);

  // Apply structured config filters AFTER fuzzy search
  const finalFilteredMotors = useMemo(() => {
    if (!configFilters) return filteredMotors;
    
    return filteredMotors.filter(motor => {
      const modelName = motor.model || '';
      const hp = motor.hp;
      
      // In stock filter
      if (configFilters.inStock && motor.in_stock !== true) {
        return false;
      }
      
      // Start type filter using robust extraction
      if (configFilters.startType === 'electric') {
        // Large motors (>=40HP) are always electric - no code needed
        if (hp < 40 && !hasElectricStart(modelName)) return false;
      }
      if (configFilters.startType === 'manual') {
        // Large motors can't be manual start
        if (hp >= 40) return false;
        if (!hasManualStart(modelName)) return false;
      }
      
      // Control type filter
      if (configFilters.controlType === 'tiller') {
        // Large motors don't have tiller
        if (hp >= 40) return false;
        if (!hasTillerControl(modelName)) return false;
      }
      if (configFilters.controlType === 'remote') {
        if (!hasRemoteControl(modelName)) return false;
      }
      
      // Shaft length filter using parseMercuryRigCodes
      if (configFilters.shaftLength) {
        const rig = parseMercuryRigCodes(modelName);
        const shaftMap: Record<string, string> = { 
          short: 'S', 
          long: 'L', 
          xl: 'XL', 
          xxl: 'XXL' 
        };
        const targetCode = shaftMap[configFilters.shaftLength];
        // Short shaft is detected by ABSENCE of L/XL/XXL in the rig code
        if (configFilters.shaftLength === 'short') {
          if (rig.shaft_code && ['L', 'XL', 'XXL'].includes(rig.shaft_code)) return false;
        } else {
          if (rig.shaft_code !== targetCode) return false;
        }
      }
      
      return true;
    });
  }, [filteredMotors, configFilters]);

  // Update the visible motors store for voice agent access
  useEffect(() => {
    // Parse HP from search query if numeric
    const queryNum = searchQuery ? parseFloat(searchQuery) : null;
    const filterHP = queryNum && !isNaN(queryNum) ? queryNum : null;
    
    // Map to VisibleMotor format for the store
    const visibleMotors: VisibleMotor[] = finalFilteredMotors.map(m => ({
      id: m.id,
      model: m.model_number || m.model,
      model_display: m.model,
      horsepower: m.hp,
      price: m.price,
      msrp: m.msrp,
      in_stock: m.in_stock,
      type: m.type,
    }));
    
    setVisibleMotors(visibleMotors, filterHP, searchQuery || null);
  }, [finalFilteredMotors, searchQuery]);

  // Group motors by HP for simple view
  const groupedMotors = useGroupedMotors(processedMotors);

  // Track deep-linked motor ID for direct modal opening
  const [deepLinkedMotorId, setDeepLinkedMotorId] = useState<string | null>(null);
  
  // Handle URL parameter for deep-linking to a specific motor (from AI chat links)
  useEffect(() => {
    const motorId = searchParams.get('motor') || searchParams.get('select');
    if (!motorId || processedMotors.length === 0 || groupedMotors.length === 0) return;
    
    // Small delay to ensure state is fully computed
    const timer = setTimeout(() => {
      // Find the group containing this motor
      const targetGroup = groupedMotors.find(g => 
        g.variants.some(v => v.id === motorId)
      );
      if (targetGroup) {
        setSelectedGroup(targetGroup);
        setDeepLinkedMotorId(motorId);  // Store the specific motor ID for direct modal
        setShowConfigurator(true);
        // Clear the param so refresh doesn't re-trigger
        searchParams.delete('motor');
        searchParams.delete('select');
        setSearchParams(searchParams, { replace: true });
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [processedMotors, groupedMotors, searchParams, setSearchParams]);
  
  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedMotors;
    const query = searchQuery.toLowerCase().trim();
    const queryNum = parseFloat(query);
    if (!isNaN(queryNum)) {
      return groupedMotors.filter(g => g.hp === queryNum || g.hp.toString().includes(query));
    }
    return groupedMotors.filter(g => 
      g.families.some(f => f.toLowerCase().includes(query))
    );
  }, [groupedMotors, searchQuery]);

  const handleConfigureGroup = (group: MotorGroup) => {
    setSelectedGroup(group);
    setShowConfigurator(true);
  };

  const handleMotorSelect = (motor: Motor) => {
    // Add motor to quote context
    dispatch({ type: 'SET_MOTOR', payload: motor });
    
    // Auto-navigate to options step
    setTimeout(() => {
      navigate('/quote/options');
    }, 500);
  };

  const handleContinue = () => {
    if (!state.motor) return;
    dispatch({ type: 'COMPLETE_STEP', payload: 1 });
    navigate('/quote/options');
  };

  const handleHpSuggestionSelect = (hp: number) => {
    setSearchQuery(hp.toString());
    setConfigFilters(null); // Clear config filters when user manually changes search
  };
  
  // Clear config filters when user types in search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setConfigFilters(null);
  };
  
  // Handle recently viewed click - open motor details
  const handleRecentlyViewedClick = (motorId: string) => {
    const motor = processedMotors.find(m => m.id === motorId);
    if (motor) {
      // Find the group containing this motor and open configurator
      const targetGroup = groupedMotors.find(g => 
        g.variants.some(v => v.id === motorId)
      );
      if (targetGroup) {
        setSelectedGroup(targetGroup);
        setDeepLinkedMotorId(motorId);
        setShowConfigurator(true);
      }
    }
  };
  
  // Handle comparison motor select
  const handleComparisonSelect = (motor: any) => {
    const fullMotor = processedMotors.find(m => m.id === motor.id);
    if (fullMotor) {
      handleMotorSelect(fullMotor);
      setShowComparison(false);
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
      <PageTransition>
        <QuoteLayout>
          <div className="bg-stone-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid gap-6 sm:gap-8 lg:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <MotorCardSkeleton key={i} index={i} />
                ))}
              </div>
            </div>
          </div>
        </QuoteLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <FinancingProvider>
        <QuoteLayout 
          showProgress={false}
          onSearchClick={() => setShowSearchOverlay(true)}
          showSearchIcon={true}
        >

        <VoiceStatusBanner />
        
{/* Search Bar - Scrolls naturally with content */}
        <div className="bg-stone-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <HybridMotorSearch
                  query={searchQuery}
                  onQueryChange={handleSearchChange}
                  motors={processedMotors}
                  onHpSelect={handleHpSuggestionSelect}
                  className="w-full"
                />
              </div>
              <ConfigFilterSheet
                motors={processedMotors}
                activeHpFilter={searchQuery}
                onHpFilterChange={handleSearchChange}
                filters={configFilters}
                onFilterChange={setConfigFilters}
              />
            </div>
            
            {(searchQuery || configFilters) && (
              <div className="text-center mt-2 text-xs text-luxury-gray">
                {finalFilteredMotors.length} results
                {configFilters && (
                  <span className="ml-2 text-primary">
                    (filtered by: {[
                      configFilters.inStock && 'in stock',
                      configFilters.startType,
                      configFilters.controlType,
                      configFilters.shaftLength && `${configFilters.shaftLength} shaft`
                    ].filter(Boolean).join(', ')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Search Overlay for Desktop (opens from nav icon) */}
        <SearchOverlay
          isOpen={showSearchOverlay}
          onClose={() => setShowSearchOverlay(false)}
          searchQuery={searchQuery}
          onQueryChange={handleSearchChange}
          motors={processedMotors}
          onHpSelect={handleHpSuggestionSelect}
        />
        
        {/* Recently Viewed Bar */}
        <RecentlyViewedBar 
          items={recentlyViewed}
          onSelect={handleRecentlyViewedClick}
          onClear={clearRecentlyViewed}
        />

        <div className="bg-gradient-to-b from-stone-50 to-white py-16 motor-grid-section">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Motors Grid - Expert View Only */}
          {finalFilteredMotors.length > 0 ? (
            <motion.div 
              className="grid gap-8 sm:gap-10 lg:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              initial={hasInitiallyLoaded ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.06,
                    delayChildren: 0.08
                  }
                }
              }}
            >
              {finalFilteredMotors.map(motor => {
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
                 
                 // Get hero image URL from joined data or fallback - always provide placeholder
                 const heroImageUrl = (dbMotor as any)?.hero_media?.media_url || dbMotor?.image_url || motor.image || '/lovable-uploads/speedboat-transparent.png';
                 
                 return (
                   <motion.div
                     key={motor.id}
                      variants={{
                        hidden: { opacity: 0, y: 16, scale: 0.97 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            duration: 0.4,
                            ease: [0.25, 0.1, 0.25, 1]
                          }
                        }
                      }}
                   >
                   <MotorCardPreview
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
                   </motion.div>
               );
             })}
           </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500 font-light mb-4">
                No motors match your current filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            </div>
          )}
          
          {/* Financing Disclaimer */}
          {finalFilteredMotors.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-xs font-light text-gray-500 text-center max-w-3xl mx-auto">
                * Monthly payment estimates based on recommended financing term at {currentFinancingRate}% APR with $0 down, 
                including HST and finance fee. Terms vary by purchase amount. Subject to credit approval.
                {financingPromo?.promo_end_date && (
                  <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <Clock className="h-3 w-3" />
                    Promo rate ends in {daysUntil(financingPromo.promo_end_date)} days
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
          </div>
        </QuoteLayout>
        
        {/* Motor Recommendation Quiz Modal */}
        <MotorRecommendationQuiz
          isOpen={showQuiz}
          onClose={() => setShowQuiz(false)}
          motors={processedMotors}
          onSelectMotor={handleMotorSelect}
        />
        
        {/* Exit Intent Promo Reminder Modal */}
        <PromoReminderModal
          isOpen={showExitIntent && !!exitIntentMotor}
          onClose={dismissExitIntent}
          motorId={exitIntentMotor?.id}
          motorDetails={exitIntentMotor ? {
            model: exitIntentMotor.model,
            horsepower: exitIntentMotor.horsepower,
            price: exitIntentMotor.price
          } : undefined}
          quoteConfig={state.motor ? {
            motorId: state.motor.id,
            boatInfo: state.boatInfo,
            purchasePath: state.purchasePath
          } : undefined}
        />
        {/* Motor Configurator Modal */}
        <MotorConfiguratorModal
          open={showConfigurator}
          onClose={() => {
            setShowConfigurator(false);
            setDeepLinkedMotorId(null);  // Clear when closing
          }}
          group={selectedGroup}
          onSelectMotor={handleMotorSelect}
          initialMotorId={deepLinkedMotorId}
        />
        
        {/* Comparison Floating Pill removed - now integrated into UnifiedMobileBar */}
        
        {/* Comparison Drawer */}
        <ComparisonDrawer 
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          motors={comparisonList}
          onRemove={removeFromComparison}
          onClear={clearComparison}
          onSelectMotor={handleComparisonSelect}
        />
      </FinancingProvider>
    </PageTransition>
  );
}

// Wrap with provider
export default function MotorSelectionPage() {
  return (
    <MotorViewProvider>
      <MotorSelectionContent />
    </MotorViewProvider>
  );
}