import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, CheckCircle, Download, Loader2, Calendar, Shield, BarChart3, X, Wrench } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { useIsMobile } from "../../hooks/use-mobile";
import { useScrollCoordination } from "../../hooks/useScrollCoordination";
import { money } from "../../lib/money";
import { MotorImageGallery } from './MotorImageGallery';
import { MonthlyPaymentDisplay } from '../quote-builder/MonthlyPaymentDisplay';
import { requiresMercuryControls, getIncludedAccessories, getAdditionalRequirements, type Motor } from "../../lib/motor-helpers";
import { findMotorSpecs } from "../../lib/data/mercury-motors";
import { pdf } from '@react-pdf/renderer';
import CleanSpecSheetPDF, { type CleanSpecSheetData } from './CleanSpecSheetPDF';
import { useSmartReviewRotation } from "../../lib/smart-review-rotation";
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import MotorDocumentsSection from './MotorDocumentsSection';
import MotorVideosSection from './MotorVideosSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

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
  const [specSheetLoading, setSpecSheetLoading] = useState(false);
  const [warrantyPricing, setWarrantyPricing] = useState<any>(null);
  const [showFullPricing, setShowFullPricing] = useState(false);
  const isMobile = useIsMobile();
  const { promo: activePromo } = useActiveFinancingPromo();
  const { promotions: activePromotions } = useActivePromotions();
  const { setScrollLock } = useScrollCoordination();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hpValue = typeof hp === 'string' ? parseInt(hp) : hp || 0;
  const smartReview = useSmartReviewRotation(hpValue, title);
  const motorSpecs = motor ? findMotorSpecs(hpValue, title) : undefined;

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

  // Fetch warranty pricing
  useEffect(() => {
    const fetchWarrantyPricing = async () => {
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
    };
    
    if (motor?.id) fetchWarrantyPricing();
  }, [hpValue, motor?.id]);

  const handleCalculatePayment = () => {
    onClose();
    navigate('/finance-calculator', {
      state: {
        motorPrice: price || 0,
        motorModel: title,
        motorId: motor?.id || `${title}-${hp}`,
        motorHp: hpValue,
        fromModal: true
      }
    });
  };

  const handleSelectMotor = () => {
    if (onSelect) onSelect();
    onClose();
  };

  const handleGenerateSpecSheet = async () => {
    if (!motor?.id) return;
    setSpecSheetLoading(true);
    
    try {
      const specData: CleanSpecSheetData = {
        motorModel: title || motor.model || 'Mercury Motor',
        horsepower: `${hp || motor.hp || ''}HP`,
        category: motor.category || 'FourStroke',
        modelYear: motor.year || new Date().getFullYear(),
        sku: motor.sku,
        msrp: typeof price === "number" ? price.toLocaleString('en-CA', { minimumFractionDigits: 0 }) : motor.msrp?.toLocaleString('en-CA', { minimumFractionDigits: 0 }),
        modelNumber: motor.model_number,
        motorPrice: typeof price === "number" ? price : motor.msrp,
        image_url: motor?.image_url || img || motor?.images?.[0] || gallery?.[0] || undefined,
        specifications: motor.specifications || {},
        features: features.length > 0 ? features : ['Advanced corrosion protection', 'Integrated fuel system'],
        includedAccessories: getIncludedAccessories(motor),
        idealUses: [],
        performanceData: {},
        stockStatus: motor.availability || undefined,
        currentPromotion: activePromo ? {
          name: activePromo.name,
          description: activePromo.promo_text || 'Extended warranty included',
          endDate: activePromo.promo_end_date ? new Date(activePromo.promo_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          rate: activePromo.rate
        } : undefined
      };

      const blob = await pdf(<CleanSpecSheetPDF specData={specData} warrantyPricing={warrantyPricing} activePromotions={activePromotions} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-specifications.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating spec sheet:', error);
    } finally {
      setSpecSheetLoading(false);
    }
  };

  const includedAccessories = motor ? getIncludedAccessories(motor) : [];
  const additionalRequirements = motor ? getAdditionalRequirements(motor) : [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container - TWO COLUMN LAYOUT (60/40) */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4">
        <div className="relative bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-xl 
          lg:grid lg:grid-cols-[60fr_40fr] lg:max-w-6xl 
          flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-500">
          
          {/* LEFT COLUMN: Tabbed Content (Desktop & Mobile) */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
              {/* Mobile/Tablet Header */}
              <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-white dark:bg-slate-900">
                  <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full" 
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {/* Flexbox Column Layout - prevents overlap */}
                  <div className="flex flex-col space-y-4 pr-12">
                    {/* 1. Step Indicator */}
                    <div className="text-xs uppercase tracking-widest text-gray-500 font-light">
                      Building Your Quote • Step 1 of 3: Select Motor
                    </div>
                    
                    {/* 2. Motor Name - full line with proper spacing */}
                    <h2 className="text-lg font-light tracking-wide text-gray-900 dark:text-gray-100 leading-tight">
                      {title}
                    </h2>
                  </div>
                </div>
                
                {/* 3. Tabs - separate section below name */}
                <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-white dark:bg-slate-900 p-0 h-auto">
                  <TabsTrigger 
                    value="overview" 
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-4 py-3"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="specs"
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-4 py-3"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="included"
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-4 py-3"
                  >
                    Included
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources"
                    className="text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-4 py-3"
                  >
                    Resources
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-sm">
                <div className="p-6 pb-0 border-b border-gray-100 bg-white dark:bg-slate-900">
                  <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full z-50" 
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  {/* Flexbox Column Layout - crystal clear hierarchy */}
                  <div className="flex flex-col space-y-5 pr-12">
                    {/* 1. Step Indicator - 16px margin below (space-y-5 = 20px) */}
                    <div className="text-xs uppercase tracking-widest text-gray-500 font-light">
                      Building Your Quote • Step 1 of 3: Select Motor
                    </div>
                    
                    {/* 2. Motor Name - 20px margin below (space-y-5) */}
                    <h2 className="text-2xl font-light tracking-wide text-gray-900 dark:text-gray-100 leading-tight">
                      {title}
                    </h2>
                  </div>
                </div>
                
                {/* 3. Tabs - new line, clear separation */}
                <TabsList className="w-full justify-start border-b border-gray-100 rounded-none bg-white dark:bg-slate-900 p-0 h-auto mt-5">
                  <TabsTrigger 
                    value="overview" 
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-6 py-4"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="specs"
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-6 py-4"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="included"
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-6 py-4"
                  >
                    Included
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resources"
                    className="text-sm uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-black rounded-none font-light px-6 py-4"
                  >
                    Resources
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Scrollable Tab Content */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                <div className="p-6 pt-8 space-y-8">
                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="space-y-8 mt-4">
                    {/* Enhanced Image Gallery - 40% larger */}
                    <div className="pt-10 pb-6 bg-gradient-to-b from-stone-50 to-white rounded-lg">
                      <MotorImageGallery 
                        images={gallery.length > 0 ? gallery : (img ? [img] : [])} 
                        motorTitle={title}
                        enhanced={true}
                      />
                    </div>
                    
                    {/* What's Included - Simple Checklist */}
                    {includedAccessories.length > 0 && (
                      <ul className="space-y-2.5">
                        {includedAccessories.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-base text-gray-700">
                            <span className="text-green-600 text-lg leading-none">✓</span>
                            <span className="font-light">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Key Features - Top 4 only */}
                    {features.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-light tracking-wide text-gray-900">
                          Key Features
                        </h3>
                        <ul className="space-y-3">
                          {features.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm font-light text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Customer Review */}
                    {smartReview && (
                      <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-light tracking-wide text-gray-900 mb-4">
                          Customer Review
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-1 text-yellow-500 text-sm">
                            <span>★★★★★</span>
                          </div>
                          <blockquote className="text-sm font-light italic text-gray-700 pl-4 border-l-2 border-gray-200">
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
                              <p className="text-sm text-blue-800 font-light mt-1">
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
                              <p className="text-sm text-green-800 font-light mt-1">
                                Tiller motor includes integrated controls - mount and go!
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </TabsContent>
                  
                  {/* SPECS TAB */}
                  <TabsContent value="specs" className="space-y-6 m-0">
                    <div>
                      <h3 className="text-lg font-light tracking-wide text-gray-900 mb-4">
                        Technical Specifications
                      </h3>
                      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                        {motorSpecs && (
                          <>
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-sm font-light text-gray-600">Engine Type</span>
                              <span className="text-sm text-gray-900 font-medium">
                                {motorSpecs.cylinders} {motorSpecs.displacement}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-sm font-light text-gray-600">Max RPM</span>
                              <span className="text-sm text-gray-900 font-medium">{motorSpecs.max_rpm}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-sm font-light text-gray-600">Gear Ratio</span>
                              <span className="text-sm text-gray-900 font-medium">{motorSpecs.gear_ratio}</span>
                            </div>
                            {motorSpecs.weight_kg && (
                              <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-sm font-light text-gray-600">Weight</span>
                                <span className="text-sm text-gray-900 font-medium">
                                  {Math.round(motorSpecs.weight_kg * 2.20462)} lbs
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {shaft && (
                          <div className="flex justify-between py-2">
                            <span className="text-sm font-light text-gray-600">Shaft Length</span>
                            <span className="text-sm text-gray-900 font-medium">{shaft}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* INCLUDED TAB */}
                  <TabsContent value="included" className="space-y-6 m-0">
                    <div>
                      <h3 className="text-lg font-light tracking-wide text-gray-900 mb-4">
                        What's Included
                      </h3>
                      <ul className="space-y-2">
                        {includedAccessories.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-light text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Warranty Info */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="text-lg font-light tracking-wide text-gray-900 mb-4">
                        Warranty Coverage
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-light text-gray-700">
                            3-Year Mercury Factory Warranty
                          </span>
                        </div>
                        {activePromotions.some(p => p.warranty_extra_years) && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-light text-gray-700">
                              +2 Year Extended Coverage (Promotional)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* RESOURCES TAB */}
                  <TabsContent value="resources" className="space-y-6 m-0">
                    {/* Documents Section */}
                    {motor?.id && (
                      <div>
                        <h3 className="text-lg font-light tracking-wide text-gray-900 mb-4">
                          Downloads & Documentation
                        </h3>
                        <MotorDocumentsSection motorId={motor.id} />
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="space-y-3 border-t border-gray-100 pt-6">
                      <button
                        onClick={handleGenerateSpecSheet}
                        disabled={specSheetLoading}
                        className="w-full border border-gray-300 text-gray-700 py-3 px-4 text-sm font-light rounded-sm hover:bg-stone-50 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {specSheetLoading ? 'Generating...' : 'Download Spec Sheet'}
                      </button>
                      
                      <button
                        onClick={() => { onClose(); navigate('/schedule'); }}
                        className="w-full border border-gray-300 text-gray-700 py-3 px-4 text-sm font-light rounded-sm hover:bg-stone-50 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Consultation
                      </button>
                    </div>
                    
                    {/* Videos Section */}
                    {motor?.id && (
                      <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-light tracking-wide text-gray-900 mb-4">
                          Videos & Demonstrations
                        </h3>
                        <MotorVideosSection 
                          motorId={motor.id} 
                          motorFamily={motor.family || motor.model} 
                        />
                      </div>
                    )}
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>

          {/* RIGHT COLUMN: Sticky Pricing Card (Desktop Only) */}
          <div className="hidden lg:block border-l border-gray-200">
            <div className="sticky top-0 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Motor Name & Thumbnail */}
              <div>
                <h3 className="text-lg font-light tracking-wide text-gray-900">
                  {title}
                </h3>
                <img 
                  src={img || gallery?.[0]} 
                  alt={title}
                  className="w-full h-32 object-contain mt-4 rounded-lg bg-stone-50"
                />
              </div>
              
              {/* Price Display */}
              <div className="border-t border-gray-100 pt-6">
                <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 font-light mb-2">
                  from
                </p>
                {msrp && typeof msrp === "number" && msrp !== price && (
                  <p className="text-base text-gray-400 font-light line-through">
                    {money(msrp)}
                  </p>
                )}
                <p className="text-5xl font-light tracking-tight text-gray-900 mt-1">
                  {typeof price === "number" ? money(price) : 'Call for Price'}
                </p>
                {msrp && price && msrp > price && (
                  <p className="text-sm text-red-600 mt-2 font-light">
                    SAVE {money(msrp - price)}
                  </p>
                )}
              </div>
              
              {/* Key Spec Badges */}
              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-6">
                <span className="px-3 py-1 bg-stone-100 text-gray-700 text-xs font-light rounded-full">
                  {hp} HP
                </span>
                {shaft && (
                  <span className="px-3 py-1 bg-stone-100 text-gray-700 text-xs font-light rounded-full">
                    {shaft}
                  </span>
                )}
                <span className="px-3 py-1 bg-stone-100 text-gray-700 text-xs font-light rounded-full">
                  {motorSpecs?.starting || 'Electric Start'}
                </span>
              </div>
              
              {/* ADD TO QUOTE Button */}
              <button
                onClick={handleSelectMotor}
                className="w-full bg-black text-white py-4 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-gray-900 transition-all duration-500"
              >
                Add to Quote
              </button>
              
              {/* Calculate Payment Link */}
              <button
                onClick={handleCalculatePayment}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-black font-light transition-colors"
              >
                <Calculator className="w-4 h-4" />
                Calculate Payment
              </button>
              
              {/* Promo Badges */}
              <div className="space-y-2 border-t border-gray-100 pt-6">
                {activePromotions.some(p => p.warranty_extra_years) && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-light">
                    <Shield className="w-4 h-4" />
                    <span>+2Y Warranty Included</span>
                  </div>
                )}
                {activePromo && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 font-light">
                    <BarChart3 className="w-4 h-4" />
                    <span>{activePromo.rate}% APR Available</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile: Fixed Bottom Pricing Bar */}
          <div className="lg:hidden sticky bottom-0 border-t border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Compact Price Display */}
              <div>
                <p className="text-lg font-light text-gray-900">
                  {typeof price === "number" ? money(price) : 'Call'}
                </p>
                {typeof price === "number" && (
                  <p className="text-xs text-gray-500 font-light">
                    <MonthlyPaymentDisplay motorPrice={price} />
                  </p>
                )}
              </div>
              
              {/* ADD TO QUOTE Button */}
              <button
                onClick={handleSelectMotor}
                className="flex-1 bg-black text-white py-3 text-xs tracking-widest uppercase font-light rounded-sm"
              >
                Add to Quote
              </button>
            </div>
            
            {/* Tap to expand full details */}
            <button 
              onClick={() => setShowFullPricing(!showFullPricing)}
              className="w-full text-center text-xs text-gray-500 mt-2 font-light"
            >
              {showFullPricing ? '▼ Show Less' : '▲ View Full Details'}
            </button>
            
            {/* Expandable Pricing Details */}
            {showFullPricing && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-stone-100 text-gray-700 text-xs font-light rounded-full">
                    {hp} HP
                  </span>
                  {shaft && (
                    <span className="px-3 py-1 bg-stone-100 text-gray-700 text-xs font-light rounded-full">
                      {shaft}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleCalculatePayment}
                  className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-black font-light"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
