"use client";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Ship, Gauge, Fuel, MapPin, Wrench, AlertTriangle, CheckCircle, FileText, ExternalLink, Download, Loader2, Calendar, Shield, BarChart3, X, Menu } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useIsMobile } from "../../hooks/use-mobile";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { money } from "../../lib/money";
import { MotorImageGallery } from './MotorImageGallery';
import { 
  decodeModelName, 
  getRecommendedBoatSize, 
  getEstimatedSpeed, 
  getFuelConsumption, 
  getRange, 
  getTransomRequirement, 
  getBatteryRequirement, 
  getFuelRequirement, 
  getOilRequirement, 
  getIdealUses,
  getIncludedAccessories,
  getAdditionalRequirements,
  cleanSpecSheetUrl,
  type Motor 
} from "../../lib/motor-helpers";

export default function MotorDetailsSheet({
  open, onClose, onSelect,
  title, subtitle, img, gallery=[],
  msrp, price, promoText, description,
  hp, shaft, weightLbs, altOutput, steering, features=[],
  specSheetUrl, motor
}:{
  open:boolean; onClose:()=>void; onSelect?: () => void;
  title:string; subtitle?:string; img?:string|null; gallery?:string[];
  msrp?:number|null; price?:number|null; promoText?:string|null; description?:string|null;
  hp?:number|string; shaft?:string; weightLbs?:number|string; altOutput?:string; steering?:string; features?:string[];
  specSheetUrl?:string|null; motor?: Motor;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [specSheetLoading, setSpecSheetLoading] = useState(false);
  const [generatedSpecUrl, setGeneratedSpecUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Section refs for navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const includedRef = useRef<HTMLDivElement>(null);
  const installationRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);

  // Body scroll lock effect
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
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

  // Intersection observer for active section detection
  useEffect(() => {
    if (!open || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section');
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '-100px 0px -50% 0px',
        threshold: 0.1
      }
    );

    const sections = [
      { ref: overviewRef, id: 'overview' },
      { ref: featuresRef, id: 'features' },
      { ref: includedRef, id: 'included' },
      { ref: installationRef, id: 'installation' },
      { ref: performanceRef, id: 'performance' }
    ];

    sections.forEach(({ ref, id }) => {
      if (ref.current) {
        ref.current.setAttribute('data-section', id);
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [open]);

  const handleCalculatePayment = () => {
    onClose();
    navigate('/finance-calculator', { 
      state: { 
        motorPrice: price || 0, 
        motorModel: title 
      } 
    });
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
      const { data, error } = await supabase.functions.invoke('generate-motor-spec-sheet', {
        body: { motorId: motor.id }
      });

      if (error) {
        console.error('Error generating spec sheet:', error);
        return;
      }

      if (data?.htmlContent) {
        await generateClientSidePDF(data.htmlContent, data.motorModel || title);
      }
    } catch (error) {
      console.error('Error generating spec sheet:', error);
    } finally {
      setSpecSheetLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const sectionMap = {
      'overview': overviewRef.current,
      'features': featuresRef.current,
      'included': includedRef.current,
      'installation': installationRef.current,
      'performance': performanceRef.current
    };
    
    const element = sectionMap[sectionId as keyof typeof sectionMap];
    if (element && scrollContainerRef.current) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      setActiveSection(sectionId);
      // Close mobile nav after selection
      if (isMobile) {
        setMobileNavOpen(false);
      }
    }
  };

  const generateClientSidePDF = async (htmlContent: string, motorModel: string) => {
    try {
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '794px';
      container.style.height = 'auto';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '9pt';
      container.style.lineHeight = '1.1';
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 800));

      const devicePixelRatio = window.devicePixelRatio || 1;
      const canvas = await html2canvas(container, {
        scale: Math.min(devicePixelRatio * 1.5, 3),
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        width: 794,
        height: container.scrollHeight
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.setProperties({
        title: `${motorModel} - Technical Specifications`,
        subject: 'Mercury Marine Motor Specifications',
        author: 'Harris Boat Works - Authorized Mercury Marine Dealer',
        creator: 'Harris Boat Works Quote System'
      });

      const fileName = `Mercury-${motorModel.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-technical-specifications.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Unable to generate PDF at this time. Please try again or contact support.');
    }
  };

  const cleanedSpecUrl = cleanSpecSheetUrl(specSheetUrl);
  const includedAccessories = motor ? getIncludedAccessories(motor) : [];
  const additionalRequirements = motor ? getAdditionalRequirements(motor) : [];
  
  if(!open) return null;

  const displayFeatures = Array.isArray(features) ? features : [];
  const cleanedDescription = String(description || '').replace(/Can't find what you're looking for\?[\s\S]*/i, '').replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '').trim();
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - responsive sizing */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4">
        <div className="relative bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl md:max-w-3xl lg:max-w-4xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
          
          {/* Modal Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sm:rounded-t-xl">
            {/* Header Bar */}
            <div className="flex items-start justify-between p-4 gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span>{hp} HP</span>
                  <span>•</span>
                  <span className="truncate">{shaft}</span>
                </div>
              </div>
              
              {/* Price Badge - visible on larger screens */}
              <div className="hidden sm:block text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {typeof price === "number" ? money(price) : 'Call for Price'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">+2Y Warranty</p>
              </div>
              
              {/* Close Button - More Visible */}
              <button 
                onClick={onClose}
                className="p-2 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg dark:shadow-slate-900/50 rounded-full transition-all border border-slate-200 dark:border-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
            
            {/* Navigation - Responsive */}
            <div className="px-4 pb-2">
              {/* Mobile Navigation - Header with hamburger menu */}
              <div className="lg:hidden flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Sections</h3>
                <button 
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation - Horizontal Scrollable Tabs */}
              <div className="lg:hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button 
                    onClick={() => scrollToSection('overview')}
                    className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeSection === 'overview'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    Specs
                  </button>
                  <button 
                    onClick={() => scrollToSection('included')}
                    className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeSection === 'included'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    What's Included
                  </button>
                  <button 
                    onClick={() => scrollToSection('installation')}
                    className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeSection === 'installation'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    Requirements
                  </button>
                  <button 
                    onClick={() => scrollToSection('performance')}
                    className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeSection === 'performance'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    Performance
                  </button>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeSection === 'features'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    Features
                  </button>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'overview', label: 'Specs' },
                  { id: 'included', label: "What's Included" },
                  { id: 'installation', label: 'Requirements' },
                  { id: 'performance', label: 'Performance' },
                  { id: 'features', label: 'Features' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id)}
                    className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeSection === tab.id 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain modal-content">
            <div className="p-4 space-y-6">
              
              {/* Motor Image */}
              <div className="flex justify-center py-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {motor?.images && motor.images.length > 0 ? (
                  <MotorImageGallery images={motor.images} motorTitle={title} />
                ) : img ? (
                  <img src={img} alt={title} className="h-40 sm:h-48 object-contain" />
                ) : (
                  <div className="h-40 sm:h-48 w-full bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-slate-500 dark:text-slate-400">No image available</span>
                  </div>
                )}
              </div>
              
              {/* Understanding This Model Section */}
              <div ref={overviewRef} data-section="overview" className="space-y-3">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Understanding This Model</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  {hp && decodeModelName(title).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                      <span className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg flex items-center justify-center text-xs font-bold">
                        {item.code}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-white">{item.meaning}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.benefit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Section */}
              {motor?.specifications && Object.keys(motor.specifications).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">Technical Specifications</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="grid gap-2">
                      {Object.entries(motor.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                            {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm text-slate-900 dark:text-white font-medium">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Features Section */}
              {displayFeatures.length > 0 && (
                <div ref={featuresRef} data-section="features">
                  <h3 className="font-semibold text-base mb-3 text-slate-900 dark:text-white">Key Features</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <ul className="text-sm space-y-2">
                      {displayFeatures.slice(0, 8).map((feature, i) => (
                        <li key={`${feature}-${i}`} className="flex items-start">
                          <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                          <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* What's Included Section */}
              <div ref={includedRef} data-section="included">
                <h3 className="font-semibold text-base mb-3 text-slate-900 dark:text-white">What's Included</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  {includedAccessories.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {includedAccessories.map((accessory, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{accessory}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">Standard motor components included. Contact us for detailed specifications.</p>
                  )}
                </div>
              </div>

              {/* Installation Requirements Section */}
              <div ref={installationRef} data-section="installation">
                <h3 className="font-semibold text-base mb-3 text-slate-900 dark:text-white">Installation Requirements</h3>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                  {additionalRequirements.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {additionalRequirements.map((requirement, i) => (
                        <li key={i} className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{requirement.item}</span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">({requirement.cost})</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">Standard installation requirements apply. Our certified technicians will handle all setup.</p>
                  )}
                </div>
              </div>

              {/* Performance Section */}
              <div ref={performanceRef} data-section="performance">
                <h3 className="font-semibold text-base mb-3 text-slate-900 dark:text-white">Performance Estimates</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {hp && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-slate-500 dark:text-slate-400">Boat Size</div>
                      <div className="font-medium text-slate-900 dark:text-white">{getRecommendedBoatSize(typeof hp === 'string' ? parseInt(hp) : hp)}</div>
                    </div>
                  )}
                  {hp && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                      <div className="text-slate-500 dark:text-slate-400">Est. Speed</div>
                      <div className="font-medium text-slate-900 dark:text-white">{getEstimatedSpeed(typeof hp === 'string' ? parseInt(hp) : hp)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resources Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">Resources</h3>
                <div className="grid gap-2">
                  <Button
                    onClick={handleGenerateSpecSheet}
                    disabled={specSheetLoading}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    {specSheetLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Spec Sheet
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/quote/schedule')}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Demo
                  </Button>
                </div>
              </div>

              {/* Description */}
              {cleanedDescription && (
                <div>
                  <h3 className="font-semibold text-base mb-3 text-slate-900 dark:text-white">Description</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{cleanedDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 sm:rounded-b-xl">
            {/* Mobile: Compact Layout */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex-shrink-0">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {typeof price === "number" ? money(price) : 'Call for Price'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">+2Y Warranty</p>
                </div>
                <div className="flex gap-2 flex-1 max-w-xs">
                  <button 
                    onClick={handleCalculatePayment}
                    className="flex-1 py-2 px-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Calculate
                  </button>
                  <Button
                    onClick={handleSelectMotor}
                    size="sm"
                    className="flex-1 py-2 px-3 text-xs font-medium"
                  >
                    Add to Quote
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Desktop: Side by side */}
            <div className="hidden sm:flex gap-3">
              <Button
                onClick={handleCalculatePayment}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Payment
              </Button>
              <Button
                onClick={handleSelectMotor}
                size="lg"
                className="flex-1"
              >
                Add to Quote →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}