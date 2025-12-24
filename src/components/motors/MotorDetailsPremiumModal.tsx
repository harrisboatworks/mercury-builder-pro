import React, { useEffect, useState, useRef, useMemo } from "react";
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useNavigate } from "react-router-dom";
import { Calculator, CheckCircle, Download, Loader2, Calendar, Shield, BarChart3, X, Wrench, Settings, Package, Gauge, AlertCircle, Gift, ChevronLeft, Bell, Sparkles, ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChat } from '../chat/GlobalAIChat';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CleanSpecSheetPDF } from './CleanSpecSheetPDF';
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
  motor
}: MotorDetailsPremiumModalProps) {
  const navigate = useNavigate();
  const [warrantyPricing, setWarrantyPricing] = useState<any>(null);
  const [showFullPricing, setShowFullPricing] = useState(false);
  const isMobile = useIsMobile();
  const { promo: activePromo } = useActiveFinancingPromo();
  const { promotions: activePromotions } = useActivePromotions();
  const { setScrollLock } = useScrollCoordination();
  const { state } = useQuote();
  const { triggerHaptic } = useHapticFeedback();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const hpValue = typeof hp === 'string' ? parseInt(hp) : hp || 0;
  const smartReview = useSmartReviewRotation(hpValue, title);
  const motorSpecs = motor ? findMotorSpecs(hpValue, title) : undefined;
  const decoded = decodeModelName(motor?.model || title, hpValue);

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
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

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
  }, [open, motor?.id]);

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [promoReminderOpen, setPromoReminderOpen] = useState(false);
  const [inlineChatOpen, setInlineChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { openChat } = useAIChat();

  const handleCalculatePayment = () => {
    setCalculatorOpen(true);
  };

  const handleAskAI = () => {
    // Use lg breakpoint (1024px) to match when the right column with inline chat is visible
    const isDesktopWithInlineChat = window.innerWidth >= 1024;
    
    if (isDesktopWithInlineChat) {
      // Desktop: open inline chat panel (visible in right column)
      setInlineChatOpen(true);
    } else {
      // Mobile/tablet: open chat drawer - motor context flows through QuoteContext.previewMotor
      openChat();
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
    <div className="fixed inset-0 z-50">
      {/* Backdrop - optimized for performance */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-x-0 top-16 bottom-0 sm:inset-0 bg-black/70" 
        onClick={onClose} 
      />
      
      {/* Modal Container - TWO COLUMN LAYOUT (60/40) */}
      <div className="absolute inset-x-0 top-16 bottom-0 sm:inset-0 flex items-start sm:items-center justify-center sm:p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="relative bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-xl 
          lg:grid lg:grid-cols-[60fr_40fr] lg:max-w-6xl lg:h-[90vh] lg:overflow-hidden
          flex flex-col">
          
          {/* LEFT COLUMN: Tabbed Content (Desktop & Mobile) */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto modal-content lg:h-full [-webkit-overflow-scrolling:touch] overscroll-y-auto">
            <Tabs value={activeTab} className="w-full" onValueChange={(value) => {
              if (value === 'chat') {
                handleAskAI();
                // Don't switch to chat tab - it's an action, not a content tab
              } else {
                setActiveTab(value);
                scrollContainerRef.current?.scrollTo(0, 0);
              }
            }}>
              {/* Mobile/Tablet Header - sticky under modal top */}
              <div className={`lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 transition-shadow duration-200 ${hasScrolled ? 'shadow-md' : 'shadow-none'}`}>
                {/* Mobile Header with Back and X buttons */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <button 
                    onClick={onClose} 
                    className="inline-flex flex-row items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors active:scale-95 touch-action-manipulation min-h-[44px] px-2" 
                    aria-label="Go back"
                  >
                    <ChevronLeft className="w-6 h-6 flex-shrink-0" />
                    <span className="text-base font-medium">Back</span>
                  </button>
                  
                  {/* X close button */}
                  <button 
                    onClick={onClose} 
                    className="p-2 text-gray-400 hover:text-gray-700 transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100" 
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Stock Status and Title */}
                <div className="px-4 py-3 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                  </div>
                {motor?.model_number && (
                    <p className="text-xs font-mono text-gray-400 mb-1">{motor.model_number}</p>
                  )}
                  {motor && <StockStatusIndicator motor={motor} />}
                </div>
                
                {/* 3. Tabs - separate section below name */}
                <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-white p-0 h-auto relative z-50">
                  <TabsTrigger 
                    value="overview" 
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="specs"
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="included"
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Included
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources"
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    Resources
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat"
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-4 py-3"
                  >
                    <MessageCircle className="w-3 h-3 inline mr-1" />
                    Chat
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block sticky top-0 z-50 bg-white shadow-md">
                <div className="p-6 pb-0 border-b border-gray-100 bg-white">
                  <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-3 bg-gray-100/90 text-gray-700 rounded-full shadow-sm z-50
                      transition-all duration-300 ease-out
                      hover:bg-gray-200 hover:text-gray-900 hover:scale-110 hover:shadow-md
                      active:scale-95" 
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  
                  {/* Flexbox Column Layout - crystal clear hierarchy */}
                  <div className="flex flex-col space-y-3 pr-12">
                    {/* Motor Name */}
                    <h2 className="text-2xl font-semibold tracking-wide text-gray-900 leading-tight">
                      {title}
                    </h2>
                    {motor?.model_number && (
                      <p className="text-sm font-mono text-gray-400">{motor.model_number}</p>
                    )}
                    
                    {/* Stock Status Indicator */}
                    {motor && <StockStatusIndicator motor={motor} />}
                  </div>
                </div>
                
                {/* 3. Tabs - new line, clear separation */}
                <TabsList className="w-full justify-start border-b border-gray-100 rounded-none bg-white p-0 h-auto mt-5">
                  <TabsTrigger 
                    value="overview" 
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-6 py-4"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="specs"
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-6 py-4"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="included"
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-6 py-4"
                  >
                    Included
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources"
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-6 py-4"
                  >
                    Resources
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat"
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-medium px-6 py-4"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    Chat
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Scrollable Tab Content */}
              <div className="p-6 pt-4 pb-24 space-y-8">
                <TabsContent value="overview" className="space-y-8 mt-4">
                    {/* Enhanced Image Gallery - Fetched from motor_media table */}
                    <div className="pt-4 pb-6 bg-gradient-to-b from-stone-50 to-white rounded-lg">
                      {imagesLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
                        <h3 className="text-lg font-semibold tracking-wide text-gray-900">
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
                        <h3 className="text-lg font-semibold tracking-wide text-gray-900">
                          Why You'll Love It
                        </h3>
                        <div className="space-y-3">
                          {motor.spec_json.keyTakeaways.map((takeaway: string, idx: number) => (
                            <div key={idx} className="flex flex-row items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-base text-gray-700">{takeaway}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* What's Included */}
                    {includedAccessories.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold tracking-wide text-gray-900">
                          What's Included
                        </h3>
                        <div className="space-y-3">
                          {includedAccessories.map((item, idx) => (
                            <div key={idx} className="flex flex-row items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-base text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Features - Top 4 only */}
                    {features.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold tracking-wide text-gray-900">
                          Key Features
                        </h3>
                        <ul className="space-y-3">
                          {features.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm font-normal text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Customer Review */}
                    {smartReview && (
                      <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4">
                          Customer Review
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-1 text-yellow-500 text-sm">
                            <span>★★★★★</span>
                          </div>
                          <blockquote className="text-sm font-normal italic text-gray-700 pl-4 border-l-2 border-gray-200">
                            "{smartReview.comment}"
                          </blockquote>
                          <footer className="text-xs text-gray-500">
                            — {smartReview.reviewer}, {smartReview.location}
                          </footer>
                        </div>
                      </div>
                    )}
                    
                    {/* Controls Notice */}
                    {motor && (
                      requiresMercuryControls(motor) ? (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900 text-sm">Mercury Controls Required</h4>
                              <p className="text-sm text-blue-800 font-normal mt-1">
                                Installation requires throttle & shift controls ($800-1,500)
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-green-900 text-sm">No Additional Controls Required</h4>
                              <p className="text-sm text-green-800 font-normal mt-1">
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
                          <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4 flex items-center gap-2">
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
                          <p className="text-xs text-gray-400 mt-2 italic">
                            Understanding the model code helps you identify exactly what features this motor includes.
                          </p>
                        </div>
                      )}

                      {/* Engine Specifications */}
                    <div>
                      <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4 flex items-center gap-2">
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
                      <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4 flex items-center gap-2">
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
                      <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4 flex items-center gap-2">
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
                        <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-primary" />
                          Requirements
                        </h3>
                        <div className="bg-slate-50 rounded-lg divide-y divide-gray-200">
                          <SpecRow label="Battery" value={getBatteryRequirement(motor)} />
                          <SpecRow label="Recommended Fuel" value={getFuelRequirement(motor)} />
                          <SpecRow label="Oil Type" value={getOilRequirement(motor)} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* INCLUDED TAB */}
                  <TabsContent value="included" className="space-y-6 mt-0 pt-6">
                    <div>
                      <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4">
                        What's Included
                      </h3>
                      <div className="space-y-3">
                        {includedAccessories.map((item, idx) => (
                          <div key={idx} className="flex flex-row items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-base text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Warranty Info */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4">
                        Warranty Coverage
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-left">
                          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-normal text-gray-700 flex-1">
                            3-Year Mercury Factory Warranty
                          </span>
                        </div>
                        {activePromotions.some(p => p.warranty_extra_years) && (
                          <div className="flex items-center gap-3 text-left">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-normal text-gray-700 flex-1">
                              +2 Year Extended Coverage (Promotional)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* RESOURCES TAB */}
                  <TabsContent value="resources" className="space-y-5 mt-0">
                    <div className="p-6 pt-8 pb-12 space-y-8">
                      {/* Documents Section */}
                      {motor?.id && (
                        <div>
                          <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4">
                            Downloads & Documentation
                          </h3>
                          <MotorDocumentsSection motorId={motor.id} />
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="border-t border-gray-100 pt-6">
                        <PDFDownloadLink
                          document={
                            <CleanSpecSheetPDF 
                              motorData={{
                                motor: motor,
                                promotions: activePromotions,
                                motorModel: motor?.model || title
                              }} 
                            />
                          }
                          fileName={`${(motor?.model || title).replace(/\s+/g, '-')}-Specifications.pdf`}
                          className="w-full border border-gray-300 text-gray-700 py-3 px-4 text-sm font-medium rounded-sm hover:bg-stone-50 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          {({ loading }) => (
                            <>
                              <Download className="w-4 h-4" />
                              {loading ? 'Generating...' : 'Download Spec Sheet'}
                            </>
                          )}
                        </PDFDownloadLink>
                      </div>
                      
                      {/* Videos Section */}
                      {motor?.id && (
                        <div className="border-t border-gray-100 pt-6">
                          <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4">
                            Videos & Demonstrations
                          </h3>
                          <MotorVideosSection 
                            motorId={motor.id} 
                            motorFamily={motor.family || motor.model} 
                          />
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
                    <h3 className="text-lg font-semibold tracking-wide text-gray-900">
                      {title}
                    </h3>
                  </div>
                  
                  {/* Price Display */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 font-light mb-2">
                      from
                    </p>
                    {msrp && typeof msrp === "number" && msrp !== price && (
                      <p className="text-base text-gray-400 font-normal line-through">
                        {money(msrp)}
                      </p>
                    )}
                    <p className="text-3xl font-bold tracking-tight text-gray-900 mt-1">
                      {typeof price === "number" ? money(price) : 'Call for Price'}
                    </p>
                    {/* SAVE + Ask AI inline */}
                    <div className="flex items-center justify-between mt-2">
                      {msrp && price && msrp > price ? (
                        <p className="text-sm text-red-600 font-normal">
                          SAVE {money(msrp - price)}
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
                  
                  {/* ADD TO QUOTE Button */}
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      handleSelectMotor();
                    }}
                    className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-medium rounded-sm 
                      transition-all duration-300 ease-out
                      hover:bg-gray-900 hover:shadow-lg hover:scale-[1.01]
                      active:scale-[0.98]
                      premium-pulse"
                  >
                    Configure This Motor
                  </button>
                  
                  {/* Calculate Payment Link */}
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

          {/* Mobile scroll hint - fades out after scrolling */}
          <AnimatePresence>
            {canScrollMore && !hasScrolled && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 pointer-events-none z-50"
              >
                <span className="text-xs font-normal bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">Swipe up for more</span>
                <ChevronDown className="w-4 h-4 animate-bounce" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <FinanceCalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        motor={{
          id: motor?.id || `${title}-${hp}`,
          model: title,
          year: new Date().getFullYear(),
          price: price || 0,
          hp: hpValue
        }}
      />

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
