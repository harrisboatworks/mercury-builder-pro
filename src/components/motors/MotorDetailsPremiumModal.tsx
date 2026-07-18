import React, { useEffect, useState, useRef, useMemo, lazy, Suspense } from "react";

// Lazy-loaded — keeps the 22k-line blogArticles import OUT of the motor bundle
const RelatedPostsGrid = lazy(() =>
  import('../blog/RelatedPostsGrid').then(m => ({ default: m.RelatedPostsGrid }))
);
import { getDisplayPrices } from '@/lib/pricing';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useNavigate } from "react-router-dom";
import { Calculator, CheckCircle, Download, Loader2, Calendar, Shield, BarChart3, X, Wrench, Settings, Package, Gauge, AlertCircle, Gift, ChevronLeft, Bell, Sparkles, ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Note: useAIChat is NOT used here because this component is rendered via portal
// The openChat function is passed as a prop from the parent component
import { SpecSheetPDFDownload } from './SpecSheetPDFDownload';
import { supabase } from "../../integrations/supabase/client";
import { useIsMobile } from "../../hooks/use-mobile";
import { MotorInlineChatPanel } from './MotorInlineChatPanel';
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useScrollCoordination } from "../../hooks/useScrollCoordination";
import { money } from "../../lib/money";
import { PromoReminderModal } from "../quote-builder/PromoReminderModal";
import { MotorImageGallery } from './MotorImageGallery';
import { MonthlyPaymentDisplay } from '../quote-builder/MonthlyPaymentDisplay';
import { MotorCompatibilityBadge } from './MotorCompatibilityBadge';
import { useQuote } from "../../contexts/QuoteContext";
import {
  decodeModelName,
  requiresMercuryControls,
  getIncludedAccessories,
  getAdditionalRequirements,
  getRecommendedBoatSize,
  getEstimatedSpeed,
  getFuelConsumption,
  getSoundLevel,
  getBatteryRequirement,
  getFuelRequirement,
  getOilRequirement,
  getStartType,
  getMotorImageGallery,
  type Motor
} from "../../lib/motor-helpers";
import {
  generateDisplacement,
  generateCylinders,
  generateBoreStroke,
  generateRPMRange,
  generateFuelSystem,
  generateWeight,
  generateGearRatio,
  generateAlternator,
} from "../../lib/motor-spec-generators";
import { findMotorSpecs } from "../../lib/data/mercury-motors";
import { formatMotorDisplayName } from "@/lib/motor-display-formatter";
import { useSmartReviewRotation } from "../../lib/smart-review-rotation";
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import MotorDocumentsSection from './MotorDocumentsSection';
import MotorVideosSection from './MotorVideosSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { FinanceCalculatorDrawer } from './FinanceCalculatorDrawer';
import { StockStatusIndicator } from './StockStatusIndicator';
import { TrustSignals } from './TrustSignals';
import { generateMotorDescription, isDescriptionSuspicious } from "../../lib/motor-description-generator";

interface MotorDetailsPremiumModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
  title: string;
  img?: string | null;
  gallery?: string[];
  msrp?: number | null;
  price?: number | null;
  promoText?: string | null;
  hp?: number | string;
  shaft?: string;
  features?: string[];
  motor?: Motor;
  openChat?: () => void; // Passed from parent to avoid context issues with portals
}

interface WarrantyPricing {
  year_4_price: number;
  year_5_price: number;
}

export default function MotorDetailsPremiumModal({
  open,
  onClose,
  onSelect,
  title,
  img,
  gallery = [],
  msrp,
  price,
  promoText,
  hp,
  shaft,
  features = [],
  motor,
  openChat: openChatProp
}: MotorDetailsPremiumModalProps) {
  const navigate = useNavigate();
  const [warrantyPricing, setWarrantyPricing] = useState<WarrantyPricing | null>(null);
  const [showFullPricing, setShowFullPricing] = useState(false);
  const isMobile = useIsMobile();
  const { promo: activePromo } = useActiveFinancingPromo();
  const { promotions: activePromotions } = useActivePromotions();
  const { setScrollLock } = useScrollCoordination();
  const { state } = useQuote();
  const { triggerHaptic } = useHapticFeedback();

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const calculatorOpenRef = useRef(false);
  const [canScrollMore, setCanScrollMore] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const hpValue = typeof hp === 'string' ? parseInt(hp) : hp || 0;
  const smartReview = useSmartReviewRotation(hpValue, title);
  const motorSpecs = motor ? findMotorSpecs(hpValue, title) : undefined;
  const decoded = decodeModelName(motor?.model || title, hpValue);
  // Display-only: guarantees proper spacing, e.g. "9.9 MLH FourStroke" never "9.9MLH FourStroke"
  const displayTitle = formatMotorDisplayName(title);
  const hasValidPrice = typeof price === 'number' && Number.isFinite(price) && price > 0;


  // Generate fallback description if missing or suspicious
  const displayDescription = useMemo(() => {
    if (!motor?.description || isDescriptionSuspicious(motor.description, {
      hp: hpValue,
      family: motor.family || '',
      modelDisplay: motor.model_display || motor.model || title
    })) {
      return generateMotorDescription({
        hp: hpValue,
        family: motor?.family || 'FourStroke',
        model: motor?.model,
        modelDisplay: motor?.model_display || title
      });
    }
    return motor.description;
  }, [motor, hpValue, title]);

  // Component for consistent spec row formatting
  const SpecRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-3 px-4">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right">{value}</span>
    </div>
  );

  // Body scroll lock with proper cleanup
  useEffect(() => {
    if (open) {
      // Store current scroll position
      const scrollPosition = window.scrollY;
      setScrollLock(true, 'modal-opening');

      document.body.setAttribute('data-scroll-y', scrollPosition.toString());
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      // Cleanup function - runs when modal closes OR component unmounts
      return () => {
        const storedScrollY = document.body.getAttribute('data-scroll-y') || '0';
        const targetScrollY = parseInt(storedScrollY, 10);

        // Remove all body styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.removeAttribute('data-scroll-y');

        // Restore scroll position immediately
        window.scrollTo(0, targetScrollY);

        // Release scroll lock
        setScrollLock(false, 'modal-closed');
      };
    }
  }, [open, setScrollLock]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !calculatorOpenRef.current) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Keep keyboard and assistive-technology focus inside the portaled dialog.
  // The rest of the app is inert until the modal closes, then focus returns to
  // the control that opened it.
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const backgroundElements = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlayRef.current);
    const priorInertState = backgroundElements.map((element) => ({
      element,
      wasInert: element.hasAttribute('inert'),
    }));
    backgroundElements.forEach((element) => element.setAttribute('inert', ''));

    const getFocusable = () => Array.from(
      modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []
    ).filter((element) => element.getClientRects().length > 0);

    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = getFocusable()[0];
      (firstFocusable || modalRef.current)?.focus();
    });

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || calculatorOpenRef.current) return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        modalRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', trapFocus);
      priorInertState.forEach(({ element, wasInert }) => {
        if (!wasInert) element.removeAttribute('inert');
      });
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  // Browser history management - handle back button
  useEffect(() => {
    if (open) {
      // Push a history state so back button closes modal instead of navigating away
      window.history.pushState({ modalOpen: true }, '');

      const handlePopState = () => {
        onClose();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [open, onClose]);

  // Scroll tracking for hint indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !open) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setHasScrolled(scrollTop > 20);
      setCanScrollMore(scrollTop + clientHeight < scrollHeight - 50);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    return () => container.removeEventListener('scroll', handleScroll);
  }, [open]);

  // Fetch warranty pricing - deferred to not block initial render
  useEffect(() => {
    if (!motor?.id || !open) return;

    // Defer fetch to let modal animation complete first
    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('warranty_pricing')
          .select('*')
          .lte('hp_min', hpValue)
          .gte('hp_max', hpValue)
          .single();
        setWarrantyPricing(data);
      } catch (error) {
        setWarrantyPricing({
          year_4_price: Math.round(hpValue <= 15 ? 247 : hpValue <= 50 ? 576 : 1149),
          year_5_price: Math.round(hpValue <= 15 ? 293 : hpValue <= 50 ? 684 : 1365),
        });
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [hpValue, motor?.id, open]);

  // Fetch images from motor_media table directly
  const [loadedGalleryImages, setLoadedGalleryImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  useEffect(() => {
    if (open && motor?.id) {
      setImagesLoading(true);
      getMotorImageGallery(motor).then(images => {
        setLoadedGalleryImages(images);
        setImagesLoading(false);
      }).catch(() => {
        setLoadedGalleryImages([]);
        setImagesLoading(false);
      });
    } else if (!open) {
      // Reset when modal closes
      setLoadedGalleryImages([]);
      setImagesLoading(true);
    }
  }, [open, motor]);

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [promoReminderOpen, setPromoReminderOpen] = useState(false);
  const [inlineChatOpen, setInlineChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [relatedSlugs, setRelatedSlugs] = useState<string[]>([]);

  useEffect(() => {
    calculatorOpenRef.current = calculatorOpen;
  }, [calculatorOpen]);

  useEffect(() => {
    if (!motor) { setRelatedSlugs([]); return; }
    let cancelled = false;
    import('@/lib/motor-related-blog-posts')
      .then(({ getMotorRelatedBlogSlugs }) => {
        if (cancelled) return;
        try {
          setRelatedSlugs(getMotorRelatedBlogSlugs(motor));
        } catch (err) {
          console.error('[Related Guides] compute failed:', err);
          setRelatedSlugs([]);
        }
      })
      .catch((err) => {
        console.error('[Related Guides] dynamic import failed:', err);
      });
    return () => { cancelled = true; };
  }, [motor]);
  // openChat comes from props (openChatProp) since this component is portaled outside the context tree

  const handleCalculatePayment = () => {
    setCalculatorOpen(true);
  };

  const handleAskAI = () => {
    // Use lg breakpoint (1024px) to match when the right column with inline chat is visible
    const isDesktopWithInlineChat = window.innerWidth >= 1024;

    if (isDesktopWithInlineChat) {
      // Desktop: open inline chat panel (visible in right column)
      setInlineChatOpen(true);
    } else if (openChatProp) {
      // Mobile/tablet: open chat drawer - motor context flows through QuoteContext.previewMotor
      openChatProp();
      onClose();
    }
  };

  const handleSelectMotor = () => {
    if (onSelect) onSelect();
    onClose();
  };

  const includedAccessories = motor ? getIncludedAccessories(motor) : [];
  const additionalRequirements = motor ? getAdditionalRequirements(motor) : [];

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[60] pointer-events-none">
      {/* Click-blocker - starts below header so header remains clickable */}
      <div className="absolute inset-x-0 top-14 bottom-0 pointer-events-auto" onClick={onClose} />

      {/* Visible backdrop - navy tint + blur (reduced blur on mobile to save GPU) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="absolute inset-x-0 top-14 bottom-0 pointer-events-auto backdrop-blur-[4px] sm:backdrop-blur-[8px]"
        style={{ backgroundColor: 'rgba(5, 14, 28, 0.65)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal Container - TWO COLUMN LAYOUT (60/40) */}
      <div className="absolute inset-x-0 top-14 bottom-0 sm:inset-0 flex items-start sm:items-center justify-center sm:p-4 pointer-events-auto">
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ boxShadow: '0 30px 80px rgba(10, 22, 40, 0.25)' }}
          role="dialog"
          aria-modal="true"
          aria-label={`${displayTitle} details`}
          tabIndex={-1}
          className="relative min-w-0 bg-repower-paper sm:bg-repower-cream w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[12px]
          lg:grid lg:grid-cols-[60fr_40fr] lg:max-w-6xl lg:h-[90vh] lg:overflow-hidden
          flex flex-col">

          {/* One unambiguous desktop close control, above both content columns. */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-[70] hidden h-11 w-11 items-center justify-center rounded-full border border-repower-navy-900/10 bg-white text-repower-navy-900 shadow-md transition-colors hover:bg-repower-paper lg:flex"
            aria-label="Close motor details"
          >
            <X className="h-5 w-5" />
          </button>

          {/* LEFT COLUMN: Tabbed Content (Desktop & Mobile) */}
          <div ref={scrollContainerRef} className="modal-content min-w-0 flex-1 overflow-y-auto lg:h-full">
            <Tabs value={activeTab} className="w-full" onValueChange={(value) => {
              if (value === 'chat') {
                handleAskAI();
                // Don't switch to chat tab - it's an action, not a content tab
              } else {
                setActiveTab(value);
                scrollContainerRef.current?.scrollTo(0, 0);
              }
            }}>
              {/* Mobile/Tablet Sticky Navigation - Back/X buttons only */}
            <div className="lg:hidden sticky top-0 z-40 bg-repower-paper">
                <div className="flex justify-between items-center p-4">
                  <button
                    onClick={onClose}
                    className="inline-flex flex-row items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors active:scale-95 touch-action-manipulation min-h-[44px] px-2"
                    aria-label="Go back"
                  >
                    <ChevronLeft className="w-6 h-6 flex-shrink-0" />
                    <span className="text-base font-medium">Back</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="p-2 text-muted-foreground hover:text-gray-700 transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile/Tablet Scrollable Header - Title and Tabs */}
              <div className="lg:hidden bg-repower-paper" style={{ borderTop: '1px solid rgba(10, 22, 40, 0.08)' }}>
                {/* Stock Status and Title */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">{displayTitle}</h2>
                  </div>
                  {motor?.model_number && (
                    <p className="text-xs font-mono text-muted-foreground mb-1">{motor.model_number}</p>
                  )}
                  {motor && <StockStatusIndicator motor={motor} />}
                </div>

                {/* Tabs - scrolls with content */}
                <TabsList className="flex w-full flex-nowrap justify-start overflow-x-auto border-b border-gray-200 rounded-none bg-white p-0 h-auto scrollbar-hide">
                  <TabsTrigger
                    value="overview"
                    className="shrink-0 text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="specs"
                    className="shrink-0 text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger
                    value="included"
                    className="shrink-0 text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Included
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="shrink-0 text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Resources
                  </TabsTrigger>
                </TabsList>

                {/* Price belongs in the first mobile viewport, not below the gallery. */}
                <div className="flex items-end justify-between gap-4 border-b border-repower-navy-900/10 bg-repower-cream px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-repower-navy-900/50">Motor price</p>
                    {(() => {
                      const dp = getDisplayPrices(msrp, price);
                      return (
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-display text-2xl font-bold text-repower-navy-900">
                            {dp.callForPrice ? 'Call for price' : money(dp.displayPrice!)}
                          </span>
                          {dp.showMsrp && dp.displayMsrp && (
                            <span className="text-xs text-repower-navy-900/45 line-through">{money(dp.displayMsrp)}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {hasValidPrice && (
                    <button
                      type="button"
                      onClick={handleCalculatePayment}
                      className="min-h-[44px] shrink-0 text-sm font-semibold text-repower-mercury-red underline underline-offset-4"
                    >
                      Payment estimate
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Header */}
            <div className="hidden lg:block sticky top-0 z-50 bg-repower-cream">
                <div className="px-12 pt-12 pb-0">
                  <div className="flex flex-col pr-12">
                    {/* Eyebrow: HP · FAMILY */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="block w-7 h-px bg-[#C8102E]" />
                      <span className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#C8102E]">
                        {hp} HP{motor?.family ? ` · ${String(motor.family).toUpperCase()}` : ''}
                      </span>
                    </div>

                    {/* H1, motor name */}
                    <h2 className="font-display font-bold text-[32px] tracking-[-0.025em] leading-tight text-[#050E1C]">
                      {displayTitle}
                    </h2>
                    {motor?.model_number && (
                      <p className="text-[13px] font-mono text-[#050E1C]/45 mt-2">{motor.model_number}</p>
                    )}

                    {/* Stock Status Indicator */}
                    {motor && <div className="mt-3"><StockStatusIndicator motor={motor} /></div>}
                  </div>

                  {/* Hairline divider */}
                  <div className="mt-8 border-t" style={{ borderColor: 'rgba(10, 22, 40, 0.08)' }} />
                </div>

                {/* 3. Tabs - new line, clear separation */}
              <TabsList className="w-full justify-start rounded-none bg-repower-cream p-0 h-auto px-12" style={{ borderBottom: '1px solid rgba(10, 22, 40, 0.08)' }}>
                  <TabsTrigger
                    value="overview"
                    className="text-[12px] uppercase tracking-[0.14em] border-b-2 border-transparent data-[state=active]:border-[#050E1C] data-[state=active]:text-[#050E1C] text-[#050E1C]/60 rounded-none font-semibold px-5 py-4 bg-transparent"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="specs"
                    className="text-[12px] uppercase tracking-[0.14em] border-b-2 border-transparent data-[state=active]:border-[#050E1C] data-[state=active]:text-[#050E1C] text-[#050E1C]/60 rounded-none font-semibold px-5 py-4 bg-transparent"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger
                    value="included"
                    className="text-[12px] uppercase tracking-[0.14em] border-b-2 border-transparent data-[state=active]:border-[#050E1C] data-[state=active]:text-[#050E1C] text-[#050E1C]/60 rounded-none font-semibold px-5 py-4 bg-transparent"
                  >
                    Included
                  </TabsTrigger>
                  <TabsTrigger
                    value="resources"
                    className="text-[12px] uppercase tracking-[0.14em] border-b-2 border-transparent data-[state=active]:border-[#050E1C] data-[state=active]:text-[#050E1C] text-[#050E1C]/60 rounded-none font-semibold px-5 py-4 bg-transparent"
                  >
                    Resources
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="text-[12px] uppercase tracking-[0.14em] border-b-2 border-transparent data-[state=active]:border-[#050E1C] data-[state=active]:text-[#050E1C] text-[#050E1C]/60 rounded-none font-semibold px-5 py-4 bg-transparent"
                  >
                    <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                    Chat
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Tab Content */}
              <div className="space-y-8 p-4 pt-3 pb-28 sm:p-6 sm:pt-4 lg:pb-24">
                <TabsContent value="overview" className="space-y-8 mt-4">
                    {/* Enhanced Image Gallery - Fetched from motor_media table */}
                    <div
                      className="rounded-lg py-2"
                      style={{ background: 'var(--gradient-image-bg)' }}
                    >
                      {imagesLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'rgba(5, 14, 28, 0.45)' }} />
                        </div>
                      ) : (
                        <MotorImageGallery
                          images={loadedGalleryImages}
                          motorTitle={title}
                          enhanced={true}
                        />
                      )}
                    </div>

                    {/* Model Code Breakdown - Below Image */}
                    {decoded.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-stone-100 text-gray-700">
                          {hpValue} HP
                        </span>
                        {(() => {
                          // Define logical order: Start type → Shaft → Trim/Tilt → Engine family → Control → Other
                          const FEATURE_ORDER = [
                            'E', 'M',              // Start type
                            'S', 'L', 'XL', 'XX',  // Shaft length
                            'PT', 'T', 'GA',       // Trim/Tilt
                            'FourStroke', 'SeaPro', 'ProKicker', 'Jet', 'BigFoot', 'PXS',  // Engine family
                            'RC', 'H',             // Control type
                            'CT',                  // Command Thrust
                            'EFI', 'DTS'           // Other features
                          ];
                          const sortedDecoded = [...decoded].sort((a, b) => {
                            const indexA = FEATURE_ORDER.indexOf(a.code);
                            const indexB = FEATURE_ORDER.indexOf(b.code);
                            if (indexA === -1 && indexB === -1) return 0;
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                          });
                          return sortedDecoded.map((feature, idx) => (
                            <span
                              key={`${feature.code}-${idx}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-stone-100 text-gray-700"
                            >
                              <span className="font-mono font-semibold text-gray-600">{feature.code}</span>
                              <span className="text-gray-500">·</span>
                              <span>{feature.meaning
                                .replace('Long Shaft (20")', 'Long 20"')
                                .replace('Short Shaft (15")', 'Short 15"')
                                .replace('Extra Long Shaft (25")', 'XL 25"')
                                .replace('Extra Extra Long Shaft (30")', 'XXL 30"')
                                .replace('Power Trim & Tilt', 'Power Trim')
                                .replace('Tiller Handle', 'Tiller')
                                .replace('Electric Start', 'Electric')
                                .replace('Manual Start', 'Manual')
                                .replace('Remote Control', 'Remote')
                                .replace('Electronic Fuel Injection', 'EFI')
                                .replace('Digital Throttle & Shift', 'Digital')
                              }</span>
                            </span>
                          ));
                        })()}
                      </div>
                    )}

                    {/* About This Motor - Description with fallback */}
                    {displayDescription && (
                      <div className="space-y-3">
                        <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C]">
                          About This Motor
                        </h3>
                        <p className="text-base text-gray-700 font-normal leading-relaxed">
                          {displayDescription}
                        </p>
                      </div>
                    )}

                    {/* Key Takeaways - Customer Benefits */}
                    {motor?.spec_json?.keyTakeaways && Array.isArray(motor.spec_json.keyTakeaways) && motor.spec_json.keyTakeaways.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C]">
                          Why You'll Love It
                        </h3>
                        <div className="space-y-3">
                          {motor.spec_json.keyTakeaways.map((takeaway: string, idx: number) => (
                            <div key={idx} className="flex flex-row items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-[#C9A24A] shrink-0 mt-0.5" />
                              <span className="text-base text-gray-700">{takeaway}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* What's Included */}
                    {includedAccessories.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C]">
                          What's Included
                        </h3>
                        <div className="space-y-3">
                          {includedAccessories.map((item, idx) => (
                            <div key={idx} className="flex flex-row items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-[#C9A24A] shrink-0 mt-0.5" />
                              <span className="text-base text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Features - Top 4 only */}
                    {features.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C]">
                          Key Features
                        </h3>
                        <div className="space-y-3">
                          {features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex flex-row items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-[#C9A24A] shrink-0 mt-0.5" />
                              <span className="text-base text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Review */}
                    {smartReview && (
                      <div className="border-t border-gray-100 pt-6">
                        <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4">
                          Customer Review
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-1 text-[#C9A24A] text-sm">
                            <span>★★★★★</span>
                          </div>
                          <blockquote className="text-sm font-normal italic text-gray-700 pl-4 border-l-2 border-gray-200">
                            "{smartReview.comment}"
                          </blockquote>
                          <footer className="text-xs text-gray-500">
                           , {smartReview.reviewer}, {smartReview.location}
                          </footer>
                        </div>
                      </div>
                    )}

                    {/* Controls Notice */}
                    {motor && (
                      requiresMercuryControls(motor) ? (
                        <div
                          className="p-4 rounded-lg bg-repower-cream"
                          style={{ border: '1px solid rgba(10, 22, 40, 0.10)' }}
                        >
                          <div className="flex items-start gap-3">
                            <Wrench className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'rgba(5, 14, 28, 0.70)' }} />
                            <div>
                              <h4 className="font-display font-semibold text-[16px] tracking-[-0.015em] text-[#050E1C]">Mercury Controls Required</h4>
                              <p className="text-sm font-normal mt-1 text-[#050E1C]/65">
                                Installation requires throttle & shift controls ($800-1,500)
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="p-4 rounded-lg bg-repower-cream"
                          style={{ border: '1px solid rgba(10, 22, 40, 0.10)' }}
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-[#C9A24A] flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-display font-semibold text-[16px] tracking-[-0.015em] text-[#050E1C]">No Additional Controls Required</h4>
                              <p className="text-sm font-normal mt-1 text-[#050E1C]/65">
                                Tiller motor includes integrated controls - mount and go!
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </TabsContent>

                  {/* SPECS TAB */}
                  <TabsContent value="specs" className="space-y-5 mt-0">
                    <div className="p-6 pt-8 pb-12 space-y-8">
                      {/* Model Code Breakdown - First in Specs */}
                      {decoded.length > 0 && (
                        <div>
                          <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4 flex items-center gap-2">
                            📖 Model Code Breakdown
                          </h3>
                          <div className="bg-gradient-to-br from-stone-50 to-slate-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
                            {decoded.map((feature, idx) => (
                              <div key={`spec-${feature.code}-${idx}`} className="flex justify-between items-center py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 text-sm">{feature.code}</span>
                                </div>
                                <div className="text-right max-w-[65%]">
                                  <span className="text-sm text-gray-900 font-medium">{feature.meaning}</span>
                                  {feature.benefit && (
                                    <p className="text-xs text-gray-500 mt-0.5">{feature.benefit}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Understanding the model code helps you identify exactly what features this motor includes.
                          </p>
                        </div>
                      )}

                      {/* Engine Specifications */}
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Engine Specifications
                      </h3>
                        <div className="bg-slate-50 rounded-lg divide-y divide-gray-200">
                        {motor?.model_number && (
                          <div className="flex justify-between items-center py-3 px-4">
                            <span className="text-sm text-muted-foreground">Mercury Model #</span>
                            <span className="text-sm font-mono tracking-wide">{motor.model_number}</span>
                          </div>
                        )}
                        <SpecRow label="Engine Type" value={motor?.specifications?.cylinders || generateCylinders(hpValue)} />
                        <SpecRow label="Displacement" value={motor?.specifications?.displacement || generateDisplacement(hpValue)} />
                        <SpecRow label="Bore & Stroke" value={motor?.specifications?.boreStroke || generateBoreStroke(hpValue)} />
                        <SpecRow label="Fuel System" value={motor?.specifications?.fuelSystem || generateFuelSystem(hpValue)} />
                        <SpecRow label="Max RPM Range" value={`${motor?.specifications?.fullThrottleRPM || motorSpecs?.max_rpm || generateRPMRange(hpValue)} RPM`} />
                        <SpecRow label="Starting System" value={motor?.specifications?.startingSystem || getStartType(motor.model)} />
                      </div>
                    </div>

                    {/* Physical Specifications */}
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Physical Specifications
                      </h3>
                      <div className="bg-slate-50 rounded-lg divide-y divide-gray-200">
                        <SpecRow label="Dry Weight" value={motor?.specifications?.weight ? `${motor.specifications.weight} lbs` : generateWeight(hpValue)} />
                        <SpecRow label="Gear Ratio" value={motor?.specifications?.gearRatio || generateGearRatio(hpValue)} />
                        <SpecRow label="Alternator Output" value={motor?.specifications?.alternatorOutput || generateAlternator(hpValue)} />
                        <SpecRow label="Shaft Length" value={motor?.specifications?.shaftLength || motor?.shaft || shaft || "20\""} />
                      </div>
                    </div>

                    {/* Performance Data */}
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4 flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary" />
                        Performance Estimates
                      </h3>
                      <div className="bg-slate-50 rounded-lg divide-y divide-gray-200">
                        <SpecRow label="Recommended Boat Size" value={getRecommendedBoatSize(hpValue)} />
                        <SpecRow label="Estimated Top Speed" value={getEstimatedSpeed(hpValue)} />
                        <SpecRow label="Fuel Consumption" value={getFuelConsumption(hpValue)} />
                        <SpecRow label="Sound Level" value={getSoundLevel(hpValue)} />
                      </div>
                    </div>

                      {/* Requirements */}
                      <div>
                        <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-primary" />
                          Requirements
                        </h3>
                        <div className="bg-slate-50 rounded-lg divide-y divide-gray-200">
                          <SpecRow label="Battery" value={getBatteryRequirement(motor)} />
                          <SpecRow label="Recommended Fuel" value={getFuelRequirement(motor)} />
                          <SpecRow label="Oil Type" value={getOilRequirement(motor)} />
                        </div>
                      </div>

                      {/* Download Spec Sheet - natural place after viewing specs */}
                      <div className="border-t border-gray-100 pt-6">
                        <SpecSheetPDFDownload
                          motor={motor}
                          promotions={activePromotions}
                          motorModel={motor?.model || title}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* INCLUDED TAB */}
                  <TabsContent value="included" className="space-y-6 mt-0 pt-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4">
                        What's Included
                      </h3>
                      <div className="space-y-3">
                        {includedAccessories.map((item, idx) => (
                          <div key={idx} className="flex flex-row items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-[#C9A24A] shrink-0 mt-0.5" />
                            <span className="text-base text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warranty Info */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4">
                        Warranty Coverage
                      </h3>
                      <div className="space-y-3">
                        <div className="flex flex-row items-center gap-3 text-left">
                          <Shield className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(5, 14, 28, 0.70)" }} />
                          <span className="text-sm font-normal text-gray-700 flex-1">
                            3-Year Mercury Factory Warranty
                          </span>
                        </div>
                        {(() => {
                          const promoYears = activePromotions.find(p => p.warranty_extra_years)?.warranty_extra_years || 0;
                          if (promoYears > 0) {
                            const totalYears = 3 + promoYears;
                            return (
                              <div className="flex flex-row items-center gap-3 text-left">
                                <CheckCircle className="w-5 h-5 text-[#C9A24A] flex-shrink-0" />
                                <span className="text-sm font-normal text-gray-700 flex-1">
                                  +{promoYears} Year Extended Coverage = <strong>{totalYears} Years Total</strong>
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </TabsContent>

                  {/* RESOURCES TAB */}
                  <TabsContent value="resources" className="space-y-5 mt-0">
                    <div className="p-6 pt-8 pb-12 space-y-8">
                      {/* Related Guides — first for buyer education. Lazy-loaded so blogArticles never enters the motor bundle */}
                      {relatedSlugs.length > 0 && (
                        <div className="border-b border-gray-100 pb-6 mb-6">
                          <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-1">
                            Related Guides
                          </h3>
                          <p className="text-sm text-[#050E1C]/70 mb-4">
                            Hand-picked HBW articles for boaters considering this motor class.
                          </p>
                          <Suspense fallback={null}>
                            <RelatedPostsGrid slugs={relatedSlugs} hideHeader />
                          </Suspense>
                        </div>
                      )}

                      {/* Videos Section */}
                      {motor?.id && (
                        <div>
                          <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4">
                            Videos & Demonstrations
                          </h3>
                          <MotorVideosSection
                            motorId={motor.id}
                            motorFamily={motor.family || motor.model}
                          />
                        </div>
                      )}

                      {/* Documents Section */}
                      {motor?.id && (
                        <div className="border-t border-gray-100 pt-6">
                          <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C] mb-4">
                            Downloads & Documentation
                          </h3>
                          <MotorDocumentsSection motorId={motor.id} />
                        </div>
                      )}

                    </div>
                  </TabsContent>
                </div>
            </Tabs>
          </div>

          {/* RIGHT COLUMN: Sticky Pricing Card OR Inline Chat (Desktop Only) */}
          <div className="hidden lg:block border-l border-gray-200">
            <AnimatePresence mode="wait">
              {inlineChatOpen ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-[90vh]"
                >
                  <MotorInlineChatPanel
                    motor={motor!}
                    motorTitle={title}
                    hp={hpValue}
                    price={price || 0}
                    onClose={() => setInlineChatOpen(false)}
                    initialQuestion={`Tell me about the ${title}. What makes it a good choice?`}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="sticky top-0 p-6 space-y-6 max-h-[90vh] overflow-y-auto"
                >
                  {/* Motor Name & Thumbnail */}
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-[-0.015em] text-[#050E1C]">
                      {displayTitle}
                    </h3>
                  </div>

                  {/* Price Display */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-light mb-2">
                      from
                    </p>
                    {(() => {
                      const dp = getDisplayPrices(msrp, price);
                      return <>
                        {dp.showMsrp && dp.displayMsrp && (
                          <p className="text-base text-muted-foreground font-normal line-through">
                            {money(dp.displayMsrp)}
                          </p>
                        )}
                        <p className="text-3xl font-bold tracking-tight text-gray-900 mt-1">
                          {dp.callForPrice ? 'Call for Price' : money(dp.displayPrice!)}
                        </p>
                        {/* SAVE + Ask AI inline */}
                        <div className="flex items-center justify-between mt-2">
                          {dp.showSavings && dp.savingsRounded > 0 ? (
                            <p className="text-sm text-red-600 font-normal">
                              SAVE {money(dp.savingsRounded)}
                            </p>
                          ) : (
                            <div />
                          )}
                          <button
                            onClick={handleAskAI}
                            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Ask AI
                          </button>
                        </div>
                      </>;
                    })()}
                  </div>

                  {/* Key Spec Badges - All Features */}
                  <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-6">
                    {/* HP Badge - Always shown first */}
                    <span className="px-3 py-1 bg-stone-100 text-gray-700 text-xs font-medium rounded-full">
                      {hp} HP
                    </span>

                    {/* All Decoded Features */}
                    {(() => {
                      const decoded = decodeModelName(title, typeof hp === 'string' ? parseFloat(hp) : hp);

                      // Helper to shorten badge text for compactness
                      const shortenMeaning = (meaning: string) => {
                        return meaning
                          .replace('Long Shaft (20")', 'Long (20")')
                          .replace('Short Shaft (15")', 'Short (15")')
                          .replace('Extra Long Shaft (25")', 'XL (25")')
                          .replace('Extra Extra Long Shaft (30")', 'XXL (30")')
                          .replace('Ultra Long Shaft (30")', 'XXL (30")')
                          .replace('Power Trim & Tilt', 'Power Trim')
                          .replace('Tiller Handle', 'Tiller')
                          .replace('Electric Start', 'Electric')
                          .replace('Manual Start', 'Manual')
                          .replace('Remote Control', 'Remote')
                          .replace('Electronic Fuel Injection', 'EFI')
                          .replace('Digital Throttle & Shift', 'Digital Controls')
                          .replace('Gas Assist Tilt', 'Gas Assist')
                          .replace('High Thrust', 'High Thrust')
                          .replace('4-Stroke', 'FourStroke');
                      };

                      return decoded.map((feature, idx) => (
                        <span
                          key={`${feature.code}-${idx}`}
                          className="px-3 py-1 bg-stone-100 text-gray-700 text-xs font-medium rounded-full"
                        >
                          {shortenMeaning(feature.meaning)}
                        </span>
                      ));
                    })()}
                  </div>

                  {/* Trust Signals */}
                  <TrustSignals />

                  {/* ADD TO QUOTE Button, hero CTA spec */}
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      handleSelectMotor();
                    }}
                    style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                    className="group w-full flex items-center justify-between bg-[#C8102E] text-white px-7 py-4 rounded-[4px] text-[13px] font-bold uppercase tracking-[0.06em]
                      transition-all duration-300 ease-out
                      hover:bg-[#9A0C24] hover:-translate-y-px hover:shadow-[0_12px_30px_rgba(154,12,36,0.35)]
                      active:translate-y-0"
                  >
                    <span>Configure This Motor</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>

                  {/* Calculate Payment Link */}
                  {hasValidPrice && (
                    <button
                      onClick={handleCalculatePayment}
                      className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 font-medium
                        transition-all duration-200 ease-out
                        hover:text-black hover:scale-[1.02]
                        active:scale-[0.98]"
                    >
                      <Calculator className="w-4 h-4" />
                      Calculate Payment
                    </button>
                  )}

                  {/* Notify Me of Sales Button */}
                  <button
                    onClick={() => setPromoReminderOpen(true)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground font-normal transition-colors py-2"
                  >
                    <Bell className="w-4 h-4" />
                    Notify me of sales
                  </button>

                  {/* Promo Badges */}
                  <div className="space-y-2 border-t border-gray-100 pt-6">
                    {(() => {
                      const warrantyPromo = activePromotions.find(p => p.warranty_extra_years && p.warranty_extra_years > 0);
                      if (!warrantyPromo) return null;

                      const standardWarranty = 3; // Mercury's base warranty
                      const totalCoverage = standardWarranty + warrantyPromo.warranty_extra_years;

                      return (
                        <div className="flex items-center gap-2 text-xs text-gray-600 font-normal">
                          <Gift className="w-4 h-4" />
                          <span>{totalCoverage}-Year Total Coverage</span>
                        </div>
                      );
                    })()}
                    {activePromo && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-normal">
                        <BarChart3 className="w-4 h-4" />
                        <span>{activePromo.rate}% APR Available</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile sticky CTA */}
          <div
            className="lg:hidden sticky bottom-0 left-0 right-0 bg-repower-paper px-4 py-3 z-40"
            style={{ borderTop: '1px solid rgba(10, 22, 40, 0.08)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-repower-navy-900/50">Motor price</span>
                <span className="block truncate font-display text-xl font-bold text-repower-navy-900">
                  {(() => {
                    const dp = getDisplayPrices(msrp, price);
                    return dp.callForPrice ? 'Call for price' : money(dp.displayPrice!);
                  })()}
                </span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  handleSelectMotor();
                }}
                style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0.8,0.2, 1)' }}
                className="group flex min-h-[48px] shrink-0 items-center justify-between gap-3 rounded-[4px] bg-[#C8102E] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-all duration-300 ease-out hover:bg-[#9A0C24] active:translate-y-0"
              >
                <span>Configure</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>

          {/* Mobile scroll hint - fades out after scrolling */}
          <AnimatePresence>
            {canScrollMore && !hasScrolled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground pointer-events-none z-50"
              >
                <span className="text-xs font-normal bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">Swipe up for more</span>
                <ChevronDown className="w-4 h-4 animate-bounce" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {hasValidPrice && (
        <FinanceCalculatorDrawer
          open={calculatorOpen}
          onOpenChange={setCalculatorOpen}
          motor={{
            id: motor?.id || `${title}-${hp}`,
            model: title,
            year: new Date().getFullYear(),
            price,
            hp: hpValue
          }}
        />
      )}

      {/* Promo Reminder Modal */}
      <PromoReminderModal
        isOpen={promoReminderOpen}
        onClose={() => setPromoReminderOpen(false)}
        motorId={motor?.id || null}
        motorDetails={{
          model: title,
          horsepower: hpValue,
          price: price || 0
        }}
      />
    </div>
  );
}
