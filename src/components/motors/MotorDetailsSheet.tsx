import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Ship, Gauge, Fuel, MapPin, Wrench, AlertTriangle, CheckCircle, FileText, ExternalLink, Download, Loader2, Calendar, Shield, BarChart3, X, Settings, Video, Gift } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useIsMobile } from "../../hooks/use-mobile";
import { useScrollCoordination } from "../../hooks/useScrollCoordination";
import { money } from "../../lib/money";
import { MotorImageGallery } from './MotorImageGallery';
import { MonthlyPaymentDisplay } from '../quote-builder/MonthlyPaymentDisplay';
import { decodeModelName, getRecommendedBoatSize, getEstimatedSpeed, getFuelConsumption, getRange, getTransomRequirement, getBatteryRequirement, getFuelRequirement, getOilRequirement, getIdealUses, getIncludedAccessories, getAdditionalRequirements, cleanSpecSheetUrl, requiresMercuryControls, isTillerMotor, getMotorImageGallery, type Motor } from "../../lib/motor-helpers";
import { MotorDetailsImageSection } from './MotorDetailsImageSection';
import { findMotorSpecs, getMotorSpecs, type MercuryMotor } from "../../lib/data/mercury-motors";
import { pdf } from '@react-pdf/renderer';
import CleanSpecSheetPDF, { type CleanSpecSheetData } from './CleanSpecSheetPDF';
import { getReviewCount } from "../../lib/data/mercury-reviews";
import { useSmartReviewRotation } from "../../lib/smart-review-rotation";
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { enhanceImageUrls } from "@/lib/image-utils";
import MotorDocumentsSection from './MotorDocumentsSection';
import MotorVideosSection from './MotorVideosSection';
import { FinanceCalculatorDrawer } from './FinanceCalculatorDrawer';
import { StockStatusIndicator } from './StockStatusIndicator';
import { TrustSignals } from './TrustSignals';

export default function MotorDetailsSheet({
  open,
  onClose,
  onSelect,
  title,
  subtitle,
  img,
  gallery = [],
  msrp,
  price,
  promoText,
  description,
  hp,
  shaft,
  weightLbs,
  altOutput,
  steering,
  features = [],
  specSheetUrl,
  motor
}: {
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
  title: string;
  subtitle?: string;
  img?: string | null;
  gallery?: string[];
  msrp?: number | null;
  price?: number | null;
  promoText?: string | null;
  description?: string | null;
  hp?: number | string;
  shaft?: string;
  weightLbs?: number | string;
  altOutput?: string;
  steering?: string;
  features?: string[];
  specSheetUrl?: string | null;
  motor?: Motor;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [specSheetLoading, setSpecSheetLoading] = useState(false);
  const [generatedSpecUrl, setGeneratedSpecUrl] = useState<string | null>(null);
  const [warrantyPricing, setWarrantyPricing] = useState<any>(null);
  const [showFullPricing, setShowFullPricing] = useState(false); // Mobile pricing expansion
  const isMobile = useIsMobile();
  const { promo: activePromo } = useActiveFinancingPromo();
  const { promotions: activePromotions } = useActivePromotions();
  const { setScrollLock } = useScrollCoordination();

  // Get smart review for this motor with rotation logic
  const hpValue = typeof hp === 'string' ? parseInt(hp) : hp || 0;
  const smartReview = useSmartReviewRotation(hpValue, title);
  const reviewCount = getReviewCount(hpValue, title);
  
  // Debug logging to help troubleshoot review display
  console.log('Motor review debug:', { 
    hpValue, 
    title, 
    smartReview: smartReview ? { reviewer: smartReview.reviewer, hp: smartReview.motorHP } : null,
    reviewCount
  });

  // Section refs for navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const includedRef = useRef<HTMLDivElement>(null);
  const installationRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);

  // Enhanced body scroll lock effect with robust scroll restoration
  useEffect(() => {
    let scrollPosition = 0;
    let restoreInProgress = false;
    
    if (open) {
      // Step 1: Lock scroll coordination to prevent interference
      setScrollLock(true, 'modal-opening');
      
      // Step 2: Store scroll position immediately and in multiple ways
      scrollPosition = window.scrollY;
      console.log('🔒 Modal opening - storing scroll position:', scrollPosition);
      
      // Store in multiple locations for redundancy
      document.body.setAttribute('data-scroll-y', scrollPosition.toString());
      sessionStorage.setItem('modal-scroll-y', scrollPosition.toString());
      
      // Apply body lock
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
    } else if (!restoreInProgress) {
      // Step 2: Enhanced scroll restoration with proper timing
      restoreInProgress = true;
      console.log('🔓 Modal closing - initiating scroll restoration');
      
      // Get stored scroll position from multiple sources
      const storedScrollY = document.body.getAttribute('data-scroll-y') || 
                           sessionStorage.getItem('modal-scroll-y') || 
                           '0';
      const targetScrollY = parseInt(storedScrollY, 10);
      
      console.log('📍 Restoring to scroll position:', targetScrollY);
      
      // Step 3: Reset body styles immediately
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      // Step 4: Aggressive scroll restoration with coordination lock
      requestAnimationFrame(() => {
        // Keep scroll lock during restoration process
        setTimeout(() => {
          console.log('⚡ Executing scroll restoration to:', targetScrollY);
          
          // Multiple restoration attempts with increasing delays
          window.scrollTo(0, targetScrollY);
          
          setTimeout(() => {
            window.scrollTo({ top: targetScrollY, behavior: 'instant' });
            
            setTimeout(() => {
              const actualScrollY = window.scrollY;
              console.log('✅ Scroll restoration result - Expected:', targetScrollY, 'Actual:', actualScrollY);
              
              if (Math.abs(actualScrollY - targetScrollY) > 20) {
                console.warn('⚠️ Final backup restoration attempt');
                window.scrollTo(0, targetScrollY);
              }
              
              // Release scroll lock after restoration is complete
              // Extended delay to prevent ScrollToTop interference
              setTimeout(() => {
                setScrollLock(false, 'modal-closed');
                restoreInProgress = false;
              }, 200);
              
            }, 50);
          }, 25);
        }, 25);
      });
      
      // Cleanup stored values
      document.body.removeAttribute('data-scroll-y');
      sessionStorage.removeItem('modal-scroll-y');
    }
    
    return () => {
      // Enhanced cleanup function
      if (open) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.removeAttribute('data-scroll-y');
        sessionStorage.removeItem('modal-scroll-y');
        setScrollLock(false, 'cleanup');
      }
    };
  }, [open]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const handleCalculatePayment = () => {
    setCalculatorOpen(true);
  };

  const handleSelectMotor = () => {
    if (onSelect) {
      onSelect();
    }
    onClose();

    // Show success feedback
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'motor_added_to_quote', {
        motor_model: title,
        motor_price: price
      });
    }
  };

  const handleGenerateSpecSheet = async () => {
    if (!motor?.id) return;
    setSpecSheetLoading(true);
    
    try {
      // Transform motor data for the clean spec sheet
      const specData: CleanSpecSheetData = {
        motorModel: title || motor.model || 'Mercury Motor',
        horsepower: `${hp || motor.hp || ''}HP`,
        category: motor.category || 'FourStroke',
        modelYear: motor.year || new Date().getFullYear(),
        sku: motor.sku,
        msrp: typeof price === "number" ? price.toLocaleString('en-CA', { minimumFractionDigits: 0 }) : motor.msrp?.toLocaleString('en-CA', { minimumFractionDigits: 0 }),
        modelNumber: motor.model_number,
        motorPrice: typeof price === "number" ? price : motor.msrp, // Add motor price for financing
        image_url: motor?.image_url || img || motor?.images?.[0] || gallery?.[0] || undefined,
        specifications: {
          ...motor.specifications,
          'Weight': motorSpecs ? `${Math.round(motorSpecs.weight_kg * 2.20462)} lbs (${motorSpecs.weight_kg} kg)` : (weightLbs ? `${weightLbs} lbs` : undefined),
          'Displacement': motorSpecs?.displacement || motor.displacement,
          'Gear Ratio': motorSpecs?.gear_ratio || motor.gear_ratio,
          'Fuel System': motorSpecs?.fuel_type || motor.fuel_induction || 'Carburetor',
          'Oil Type': 'Mercury 25W-40 4-Stroke Marine Oil',
          // REMOVED hardcoded Noise Level - only show if motor actually has this data
          'Control Type': isTillerMotor(title || '') ? 'Tiller Handle' : (motor.steering_type || 'Remote Control'),
          'Max RPM': motorSpecs?.max_rpm || motor.full_throttle_rpm,
          'Starting': motor.starting_type || 'Electric',
          'Cylinders': motor.cylinders,
          'Alternator': motor.alternator,
        },
        features: features.length > 0 ? features : [
          'Advanced corrosion protection',
          'Integrated fuel system',
          'Multi-function operation',
          'Fresh water flush capability',
          'Maintenance-free design'
        ],
        includedAccessories: getIncludedAccessories(motor),
        idealUses: getIdealUses(hp || motor.hp || 0),
        performanceData: {
          // Only use REAL motor data if available, don't generate generic values
          recommendedBoatSize: motor.recommendedBoatSize || motor.boat_size_range || undefined,
          estimatedTopSpeed: motor.topSpeed || motor.max_speed || motor.estimated_top_speed || undefined,
          fuelConsumption: motor.fuelConsumption || motor.fuel_consumption || motor.gallons_per_hour || undefined,
          operatingRange: motor.operatingRange || motor.range || undefined,
        },
        stockStatus: motor.availability || undefined,
        currentPromotion: activePromo ? {
          name: activePromo.name,
          description: activePromo.promo_text || 'Extended warranty included',
          endDate: activePromo.promo_end_date ? new Date(activePromo.promo_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          rate: activePromo.rate // Include promo rate for financing calculations
        } : undefined
      };

      // Remove undefined values from specifications
      if (specData.specifications) {
        Object.keys(specData.specifications).forEach(key => {
          if (specData.specifications![key] === undefined || specData.specifications![key] === null) {
            delete specData.specifications![key];
          }
        });
      }

      // Generate PDF using React PDF
      const blob = await pdf(<CleanSpecSheetPDF specData={specData} warrantyPricing={warrantyPricing} activePromotions={activePromotions} />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const modelName = title || motor.model || 'Mercury-Motor';
      const fileName = `${modelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-specifications.pdf`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ Clean Spec Sheet PDF Generated Successfully');
      
    } catch (error) {
      console.error('❌ Error generating clean spec sheet:', error);
      alert('Unable to generate spec sheet at this time. Please try again or contact support.');
    } finally {
      setSpecSheetLoading(false);
    }
  };

  const cleanedSpecUrl = cleanSpecSheetUrl(specSheetUrl);
  const includedAccessories = motor ? getIncludedAccessories(motor) : [];
  const additionalRequirements = motor ? getAdditionalRequirements(motor) : [];

  // Find matching Mercury specs - Full specs available for AI assistant
  const motorSpecs = motor ? findMotorSpecs(typeof hp === 'string' ? parseInt(hp) : hp || 0, title) : undefined;

  // Fetch warranty pricing for PDF generation
  useEffect(() => {
    const fetchWarrantyPricing = async () => {
      const hpValue = typeof hp === 'string' ? parseInt(hp) : hp || 0;
      try {
        const { data } = await supabase
          .from('warranty_pricing')
          .select('*')
          .lte('hp_min', hpValue)
          .gte('hp_max', hpValue)
          .single();
        
        setWarrantyPricing(data);
      } catch (error) {
        console.error('Error fetching warranty pricing:', error);
        // Set fallback pricing if database fails
        setWarrantyPricing({
          year_4_price: Math.round(hpValue <= 15 ? 247 : hpValue <= 50 ? 576 : 1149),
          year_5_price: Math.round(hpValue <= 15 ? 293 : hpValue <= 50 ? 684 : 1365),
        });
      }
    };
    
    if (motor?.id) {
      fetchWarrantyPricing();
    }
  }, [hp, motor?.id]);

  if (!open) return null;

  const displayFeatures = Array.isArray(features) ? features : [];
  const cleanedDescription = String(description || '').replace(/Can't find what you're looking for\?[\s\S]*/i, '').replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '').trim();

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - TWO COLUMN LAYOUT (60/40 split on desktop) */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4">
        <div className="relative bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-xl 
          lg:grid lg:grid-cols-[60fr_40fr] lg:max-w-6xl 
          flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
          
          {/* LEFT COLUMN: Scrollable Content with Tabs (Hidden on LG+ where it's in main content) */}
          <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm sm:rounded-t-xl relative">
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full" 
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mobile/Tablet Header */}
            <div className="p-4 sm:p-6 pr-16">
              {/* Quote Building Indicator */}
              <div className="mb-3 text-xs uppercase tracking-widest text-gray-500 font-light">
                Building Your Quote • Step 1 of 3: Select Motor
              </div>
              
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h2>
              {motor && <StockStatusIndicator motor={motor} />}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 space-y-8">
              
              {/* Motor Image */}
              <div className="flex justify-center py-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <MotorDetailsImageSection motor={motor} gallery={gallery} img={img} title={title} />
              </div>
              
              
              {/* Specifications Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Specifications
                </h2>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">About This Motor</h3>
                {motor?.model_number && (
                  <p className="text-sm text-gray-500 mb-3">
                    Model Number: {motor.model_number}
                  </p>
                )}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  {hp && (() => {
                  const decoded = decodeModelName(title);
                  if (decoded.length === 0) return null;

                  // Create compact horizontal info bar
                  const infoText = decoded.map(item => item.meaning).join(' • ');
                  return <div className="space-y-3">
                        {/* Compact horizontal info bar */}
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {infoText}
                        </div>
                        
                        {/* Clean specs grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {decoded.map((item, idx) => <div key={idx} className="space-y-1">
                              <div className="font-medium text-slate-700 dark:text-slate-300">
                                {item.code === 'M' ? 'Starting' : item.code === 'H' ? 'Control' : item.code === 'S' ? 'Shaft' : item.meaning}:
                              </div>
                              <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                                {item.benefit}
                              </div>
                            </div>)}
                        </div>
                      </div>;
                })()}
                </div>
              </div>

              {/* Technical Specifications Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Technical Specifications</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="grid gap-2">
                    {/* Add parsed model code specs first */}
                    {hp && (() => {
                      const decoded = decodeModelName(title);
                      const shaftInfo = decoded.find(item => item.code === 'XL' || item.code === 'L' || item.code === 'S' || item.code === 'XX');
                      const startInfo = decoded.find(item => item.code === 'M' || item.code === 'E');
                      
                      return (
                        <>
                          {shaftInfo && (
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Shaft Length</span>
                              <span className="text-sm text-slate-900 dark:text-white font-medium">
                                {shaftInfo.meaning}
                              </span>
                            </div>
                          )}
                         {startInfo && (
                             <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                               <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Starting</span>
                               <span className="text-sm text-slate-900 dark:text-white font-medium">
                                 {startInfo.code === 'M' ? 'Manual' : 'Electric'}
                               </span>
                             </div>
                           )}
                           
                           {/* Enhanced Power Trim Display for 40+ HP motors */}
                           {(() => {
                             const motorHP = typeof hp === 'string' ? parseInt(hp) : hp || 0;
                             return motorHP >= 40 ? (
                               <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                                 <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Power Trim & Tilt</span>
                                 <span className="text-sm text-slate-900 dark:text-white font-medium">
                                   Standard
                                 </span>
                               </div>
                             ) : null;
                           })()}
                           
                           {/* Enhanced Shaft Length Display for High HP Motors */}
                           {(() => {
                             const motorHP = typeof hp === 'string' ? parseInt(hp) : hp || 0;
                             const titleUpper = (title || '').toUpperCase();
                             let shaftDisplay = '';
                             
                             if (motorHP >= 115) {
                               // Check for shaft codes in high HP motor names  
                               if (titleUpper.includes('XXL')) {
                                 shaftDisplay = 'Extra Extra Long (30")';
                               } else if (titleUpper.includes('XL')) {
                                 shaftDisplay = 'Extra Long (25")';
                               } else if (titleUpper.includes('L') || titleUpper.match(/\d+L\b/)) {
                                 shaftDisplay = 'Long (20")';
                               }
                             } else if (shaftInfo) {
                               shaftDisplay = shaftInfo.meaning;
                             }
                             
                             return shaftDisplay ? (
                               <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                                 <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Shaft Length</span>
                                 <span className="text-sm text-slate-900 dark:text-white font-medium">
                                   {shaftDisplay}
                                 </span>
                               </div>
                             ) : null;
                           })()}
                        </>
                      );
                    })()}
                    
                    {motorSpecs && <>
                        <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Engine Type</span>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">
                            {motorSpecs.cylinders} {motorSpecs.displacement}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Max RPM</span>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">{motorSpecs.max_rpm}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Gear Ratio</span>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">{motorSpecs.gear_ratio}</span>
                        </div>
                        {motorSpecs.gearcase && <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Gearcase</span>
                            <span className="text-sm text-slate-900 dark:text-white font-medium">{motorSpecs.gearcase}</span>
                          </div>}
                        <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Weight</span>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">
                            {Math.round(motorSpecs.weight_kg * 2.20462)} lbs ({motorSpecs.weight_kg} kg)
                          </span>
                        </div>
                      </>}
                    {motor?.specifications && Object.keys(motor.specifications).length > 0 && Object.entries(motor.specifications).map(([key, value]) => <div key={key} className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                            {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">
                            {String(value)}
                          </span>
                        </div>)}
                  </div>
                </div>
              </div>

              {/* Key Features Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Key Features
                </h2>
                
                {/* Custom Features */}
                {motor?.features && Array.isArray(motor.features) && motor.features.length > 0 && (
                  <div className="space-y-4">
                    {['Performance', 'Technology', 'Design', 'Convenience', 'Durability', 'Fuel Economy'].map(category => {
                      const categoryFeatures = motor.features.filter((f: any) => f.category === category);
                      if (categoryFeatures.length === 0) return null;
                      
                      return (
                        <div key={category} className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-750 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                            {category}
                          </h3>
                          <div className="space-y-3">
                            {categoryFeatures.map((feature: any, index: number) => {
                              const getFeatureIcon = (icon?: string) => {
                                switch (icon) {
                                  case 'zap': return '⚡';
                                  case 'cog': return '⚙️';
                                  case 'star': return '⭐';
                                  case 'sparkles':
                                  default: return '✨';
                                }
                              };
                              
                              return (
                                <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-600">
                                  <div className="flex items-start gap-3">
                                    <span className="text-lg flex-shrink-0">{getFeatureIcon(feature.icon)}</span>
                                    <div>
                                      <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                                        {feature.title}
                                      </h4>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {feature.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Technical Specifications */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                    Technical Specifications
                  </h3>
                  <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                     {/* Technical specifications with enhanced high HP motor logic */}
                     {motorSpecs && <>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                         <span className="text-slate-700 dark:text-slate-300">Fuel System: {motorSpecs.fuel_system}</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                         <span className="text-slate-700 dark:text-slate-300">Alternator: {motorSpecs.alternator}</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                         <span className="text-slate-700 dark:text-slate-300">Starting: {motorSpecs.starting}</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                         <span className="text-slate-700 dark:text-slate-300">Steering: {motorSpecs.steering}</span>
                       </li>
                       {/* Enhanced shaft length display for high HP motors */}
                       {(() => {
                         const motorHP = typeof hp === 'string' ? parseInt(hp) : hp || 0;
                         const titleUpper = (title || '').toUpperCase();
                         let shaftInfo = '';
                         
                         if (motorHP >= 115) {
                           // Check for shaft codes in high HP motor names
                           if (titleUpper.includes('XXL')) {
                             shaftInfo = 'Extra Extra Long Shaft 30"';
                           } else if (titleUpper.includes('XL')) {
                             shaftInfo = 'Extra Long Shaft 25"';
                           } else if (titleUpper.includes('L') || titleUpper.match(/\d+L\b/)) {
                             shaftInfo = 'Long Shaft 20"';
                           }
                         } else if (shaft) {
                           shaftInfo = shaft;
                         }
                         
                         return shaftInfo ? (
                           <li className="flex items-start">
                             <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                             <span className="text-slate-700 dark:text-slate-300">Shaft Length: {shaftInfo}</span>
                           </li>
                         ) : null;
                       })()}
                     </>}
                     
                     {/* Automatic Power Trim for motors 40 HP and above */}
                     {(() => {
                       const motorHP = typeof hp === 'string' ? parseInt(hp) : hp || 0;
                       return motorHP >= 40 ? (
                         <li className="flex items-start">
                           <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                           <span className="text-slate-700 dark:text-slate-300">Power Trim & Tilt: Standard on all Mercury motors 40 HP+</span>
                         </li>
                       ) : null;
                     })()}
                    {/* Original features */}
                    {displayFeatures.slice(0, 8).map((feature, i) => <li key={`${feature}-${i}`} className="flex items-start">
                        <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                        <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                      </li>)}
                  </ul>
                </div>
              </div>

              {/* What's Included Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  What's Included
                </h2>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Physical items included with your motor purchase:</p>
                  <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                    {includedAccessories.length > 0 ? includedAccessories.map((accessory, i) => <li key={`acc-${i}`} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{accessory}</span>
                      </li>) : <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">Owner's manual & warranty documentation</span>
                      </li>}
                  </ul>
                </div>
              </div>

              {/* Installation Requirements Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Installation Requirements
                </h2>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                  <ul className="text-sm space-y-1">
                    {/* Use parsed model code for required transom height */}
                    {hp && (() => {
                      const decoded = decodeModelName(title);
                      const shaftInfo = decoded.find(item => item.code === 'XL' || item.code === 'L' || item.code === 'S' || item.code === 'XX');
                      
                      if (shaftInfo) {
                        return (
                          <li className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 text-slate-700 dark:text-slate-300">
                              <span className="font-medium">Required Transom Height</span>
                              <span className="text-slate-500 dark:text-slate-400 ml-2">({shaftInfo.meaning})</span>
                            </div>
                          </li>
                        );
                      }
                      return null;
                    })()}
                    
                    {motorSpecs && (
                        <li className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-slate-700 dark:text-slate-300">
                            <span className="font-medium">Weight</span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">({motorSpecs.weight_kg} kg dry weight)</span>
                          </div>
                        </li>
                    )}
                    {additionalRequirements.map((requirement, i) => <li key={`req-${i}`} className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-slate-700 dark:text-slate-300">
                          <span className="font-medium">{requirement.item}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-2">({requirement.cost})</span>
                        </div>
                      </li>)}
                    {!motorSpecs && additionalRequirements.length === 0 && <li className="text-slate-600 dark:text-slate-400">Standard installation requirements apply. Our certified technicians will handle all setup.</li>}
                  </ul>
                </div>
              </div>

              {/* Controls & Installation Notice */}
              {motor && <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                    Controls & Installation
                  </h2>
                  {requiresMercuryControls(motor) ? <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Mercury Controls & Cables Required
                          </h3>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">All remote control motors require Mercury throttle & shift controls and wiring harness for proper operation.  What is required for your individual boat will need to be determined by HBW techs.</p>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Installation Requires:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Throttle & shift controls</li>
                              <li>Steering cables and hardware</li>
                              <li>Complete wiring harness</li>
                              <li>Professional installation & setup</li>
                            </ul>
                          </div>
                          <div className="mt-3 text-sm font-medium text-blue-900 dark:text-blue-100">
                            Cost: {(() => {
                        const hpValue = typeof hp === 'string' ? parseInt(hp) : hp || 0;
                        if (hpValue <= 30) return '$800-1,000';
                        if (hpValue <= 115) return '$1,000-1,300';
                        return '$1,200-1,500';
                      })()} (depending on motor size and boat configuration)
                          </div>
                        </div>
                      </div>
                    </div> : <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                            No Additional Controls Required
                          </h3>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            This tiller motor includes integrated steering and throttle controls. No additional controls or cables needed - just mount and go!
                          </p>
                          <div className="mt-2 text-sm font-medium text-green-900 dark:text-green-100">
                            Savings: $800-1,500 compared to remote control models
                          </div>
                        </div>
                      </div>
                    </div>}
                </div>}

              {/* Performance Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Performance Estimates
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {motorSpecs && <>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="text-slate-500 dark:text-slate-400">Horsepower</div>
                        <div className="font-medium text-slate-900 dark:text-white">{motorSpecs.hp} HP</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="text-slate-500 dark:text-slate-400">Displacement</div>
                        <div className="font-medium text-slate-900 dark:text-white">{motorSpecs.displacement}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="text-slate-500 dark:text-slate-400">Max RPM Range</div>
                        <div className="font-medium text-slate-900 dark:text-white">{motorSpecs.max_rpm}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="text-slate-500 dark:text-slate-400">Fuel Requirements</div>
                        <div className="font-medium text-slate-900 dark:text-white">{motorSpecs.fuel_type}</div>
                      </div>
                    </>}
                  {!motorSpecs && hp && <>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="text-slate-500 dark:text-slate-400">Boat Size</div>
                        <div className="font-medium text-slate-900 dark:text-white">{getRecommendedBoatSize(typeof hp === 'string' ? parseInt(hp) : hp)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <div className="text-slate-500 dark:text-slate-400">Est. Speed</div>
                        <div className="font-medium text-slate-900 dark:text-white">{getEstimatedSpeed(typeof hp === 'string' ? parseInt(hp) : hp)}</div>
                      </div>
                    </>}
                </div>
              </div>

              {/* Documents & Resources Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Documents & Resources
                </h3>

                <div className="grid gap-6">
                  {/* Motor-specific Documents */}
                  {motor?.id && (
                    <div>
                      <h4 className="text-md font-medium text-slate-900 dark:text-white mb-4">
                        Motor Documentation
                      </h4>
                      <MotorDocumentsSection 
                        motorId={motor.id} 
                        motorFamily={motor.family || motor.model} 
                      />
                    </div>
                  )}

                  {/* Default Resources */}
                  <div>
                    <h4 className="text-md font-medium text-slate-900 dark:text-white mb-4">
                      Quick Actions
                    </h4>
                    <div className="grid gap-4">
                      {/* Official Mercury Spec Sheet */}
                      {cleanedSpecUrl && (
                        <a
                          href={cleanedSpecUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/30 hover:shadow-md transition-all bg-white dark:bg-slate-800/50 flex items-center gap-3"
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <ExternalLink className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              Official Mercury Spec Sheet
                            </h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Detailed specifications from Mercury Marine
                            </p>
                          </div>
                        </a>
                      )}

                      {/* Generated Clean Spec Sheet */}
                      <div className="group p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/30 hover:shadow-md transition-all bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              Download Spec Sheet PDF
                            </h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Clean, professional specification sheet
                            </p>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateSpecSheet}
                            disabled={specSheetLoading}
                          >
                            {specSheetLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Schedule Consultation */}
                      <div className="group p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/30 hover:shadow-md transition-all bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              Schedule a Consultation
                            </h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Get expert advice on motor selection
                            </p>
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onClose();
                              navigate('/schedule');
                            }}
                          >
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Videos Section */}
              {motor?.id && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    Videos & Demonstrations
                  </h3>
                  <MotorVideosSection 
                    motorId={motor.id} 
                    motorFamily={motor.family || motor.model} 
                  />
                </div>
              )}

              {/* Customer Reviews Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Customer Review
                </h2>
                
                {smartReview ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-yellow-500 text-sm">
                      <span>★★★★★</span>
                      <span className="text-muted-foreground ml-2">
                        Verified Purchase
                      </span>
                    </div>
                    
                    <blockquote className="text-sm italic border-l-2 border-muted pl-3">
                      <p className="text-foreground/90">
                        "{smartReview.comment}"
                      </p>
                      <footer className="text-xs text-muted-foreground mt-2">
                        — {smartReview.reviewer}, {smartReview.location}
                      </footer>
                    </blockquote>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    New model - contact us for customer experiences
                  </p>
                )}
                
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Available at Harris Boat Works • (905) 342-2153
                </div>
              </div>
            </div>
          </div>

          {/* Compact Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 sm:rounded-b-xl">
            {/* Mobile: Space-Optimized Layout */}
            <div className="sm:hidden">
              {/* Price & Payment Info */}
              <div className="mb-2">
                <div className="flex justify-between items-center">
                  <div>
                    {msrp && typeof msrp === "number" && msrp !== price && (
                      <p className="text-gray-500 line-through text-xs">MSRP {money(msrp)}</p>
                    )}
                    <p className="text-base font-light text-black">
                      {typeof price === "number" ? money(price) : 'Call for Price'}
                    </p>
                    {promoText && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">{promoText}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {typeof price === "number" && <MonthlyPaymentDisplay motorPrice={price} />}
                    {activePromo && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {activePromo.rate}% APR
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
            {/* Key Spec Badges - All Features - Mobile */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {/* HP Badge - Always shown first */}
              <span className="px-2.5 py-1 bg-stone-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-light rounded-full">
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
                    .replace('Digital Throttle & Shift', 'Digital')
                    .replace('Gas Assist Tilt', 'Gas Assist')
                    .replace('High Thrust', 'High Thrust')
                    .replace('4-Stroke', 'FourStroke');
                };
                
                return decoded.map((feature, idx) => (
                  <span 
                    key={`${feature.code}-${idx}`}
                    className="px-2.5 py-1 bg-stone-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-light rounded-full"
                  >
                    {shortenMeaning(feature.meaning)}
                  </span>
                ));
              })()}
            </div>
              
            {/* Trust Signals - Hidden on very small screens */}
            <div className="hidden min-[400px]:block">
              <TrustSignals />
            </div>

            {/* Buttons Row */}
            <div className="flex gap-2 mt-2">
              <button onClick={handleCalculatePayment} className="text-sm text-blue-600 hover:text-blue-700 underline whitespace-nowrap">
                Calculate
              </button>
              <Button onClick={handleSelectMotor} className="flex-1 bg-black text-white py-4 text-sm uppercase tracking-wider font-light hover:bg-gray-900 transition-colors duration-200">
                Add to Quote
              </Button>
            </div>
            </div>
            
            {/* Desktop: Side by side */}
            <div className="hidden sm:flex gap-3 items-center">
              <button onClick={handleCalculatePayment} className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Calculate Payment
              </button>
              <Button onClick={handleSelectMotor} className="flex-1 bg-black text-white py-4 text-sm uppercase tracking-wider font-light hover:bg-gray-900 transition-colors duration-200">
                Add to Quote →
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FinanceCalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
        motor={{
          id: motor?.id || `${title}-${hp}`,
          model: title,
          year: new Date().getFullYear(),
          price: price || 0,
          hp: typeof hp === 'string' ? parseInt(hp) : hp
        }}
      />
    </div>
  );
}
