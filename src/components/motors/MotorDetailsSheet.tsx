"use client";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Ship, Gauge, Fuel, MapPin, Wrench, AlertTriangle, CheckCircle, FileText, ExternalLink, Download, Loader2, Calendar, Shield, BarChart3 } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { Button } from "../ui/button";
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
  const [activeSection, setActiveSection] = useState<string>('specs');
  
  // Section refs for navigation
  const specsRef = useRef<HTMLDivElement>(null);
  const includedRef = useRef<HTMLDivElement>(null);
  const requirementsRef = useRef<HTMLDivElement>(null);
  const investmentRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  // Handle escape key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    // Prevent scroll on body when sheet is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

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
        // Generate PDF on client side
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
      'specs': specsRef.current,
      'included': includedRef.current,
      'requirements': requirementsRef.current,
      'investment': investmentRef.current,
      'performance': performanceRef.current,
      'resources': resourcesRef.current
    };
    
    const element = sectionMap[sectionId as keyof typeof sectionMap];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  const generateClientSidePDF = async (htmlContent: string, motorModel: string) => {
    try {
      // Create a temporary container for the HTML content with mobile-optimized settings
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '794px'; // A4 width in pixels at 96 DPI
      container.style.height = 'auto';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '9pt';
      container.style.lineHeight = '1.1';
      document.body.appendChild(container);

      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate canvas from HTML with mobile-optimized settings
      const devicePixelRatio = window.devicePixelRatio || 1;
      const canvas = await html2canvas(container, {
        scale: Math.min(devicePixelRatio * 1.5, 3), // Adaptive scale for mobile
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        width: 794,
        height: container.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure mobile-compatible styles
          const clonedContainer = clonedDoc.querySelector('div');
          if (clonedContainer) {
            clonedContainer.style.width = '794px';
            clonedContainer.style.fontFamily = 'Arial, sans-serif';
            clonedContainer.style.fontSize = '9pt';
            // Force single page if motor is under 100HP
            if (typeof hp === 'number' && hp < 100) {
              clonedContainer.style.maxHeight = '1123px'; // A4 height at 96 DPI
              clonedContainer.style.overflow = 'hidden';
            }
          }
        }
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Create PDF with optimized settings
      const imgData = canvas.toDataURL('image/png', 0.95); // High quality PNG
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Set PDF metadata
      pdf.setProperties({
        title: `${motorModel} - Technical Specifications`,
        subject: 'Mercury Marine Motor Specifications',
        author: 'Harris Boat Works - Authorized Mercury Marine Dealer',
        creator: 'Harris Boat Works Quote System'
      });

      // Download the PDF with professional naming
      const fileName = `Mercury-${motorModel.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-technical-specifications.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Show user-friendly error message
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="absolute inset-4 sm:inset-8 lg:inset-12 bg-white dark:bg-slate-900 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-full">
        
        {/* Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Motor Details</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Motor Info Header */}
        <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div>
              {motor?.images && motor.images.length > 0 ? (
                <MotorImageGallery images={motor.images} motorTitle={title} />
              ) : img ? (
                <img src={img} alt="" className="h-36 w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-800" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-bold text-slate-900 dark:text-white">{title}</div>
              {subtitle && <div className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</div>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {typeof msrp === "number" && <span className="text-slate-500 line-through">{money(msrp)}</span>}
                {typeof price === "number" && <span className="text-xl font-bold text-slate-900 dark:text-white">{money(price)}</span>}
                {promoText && <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">{promoText}</span>}
              </div>
            </div>
          </div>

          {/* Quick Specs */}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 text-sm">
            {hp && <div><span className="text-slate-500">Power</span><div className="font-medium">{hp} HP</div></div>}
            {shaft && <div><span className="text-slate-500">Shaft</span><div className="font-medium">{shaft}</div></div>}
            {weightLbs && <div><span className="text-slate-500">Weight</span><div className="font-medium">{weightLbs} lb</div></div>}
          </div>
        </div>

        {/* Mobile Navigation - Pill Style */}
        <div className="sm:hidden bg-gray-100 dark:bg-slate-800 p-1 rounded-lg mx-4 mt-2">
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: 'specs', label: 'Specs' },
              { id: 'included', label: 'What\'s' },
              { id: 'requirements', label: 'Install' },
              { id: 'investment', label: 'Cost' },
              { id: 'performance', label: 'Perf' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`py-2 px-1 text-xs font-medium rounded-md transition-colors ${
                  activeSection === tab.id 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-40 gap-1 py-2 px-4">
          {[
            { id: 'specs', label: 'Specs', icon: Gauge },
            { id: 'included', label: "What's Included", icon: CheckCircle },
            { id: 'requirements', label: 'Requirements', icon: Wrench },
            { id: 'investment', label: 'Total Cost', icon: Calculator },
            { id: 'performance', label: 'Performance', icon: Ship },
            { id: 'resources', label: 'Resources', icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`px-4 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">{/* Content wrapper */}

        <div className="px-4 md:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 pb-32 sm:pb-4">{/* Key Features */}
          {displayFeatures.length > 0 && (
            <div ref={specsRef} className="py-6 border-b border-border bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-foreground">Key Features:</h4>
              <ul className="text-sm space-y-2">
                {displayFeatures.slice(0, 8).map((feature, i) => (
                  <li key={`${feature}-${i}`} className="flex items-start">
                    <span className="text-emerald-500 mr-2 flex-shrink-0">✓</span>
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Understanding This Model */}
          {hp && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Understanding This Model</h4>
              <div className="space-y-3">
                {decodeModelName(title).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold flex-shrink-0">
                      {item.code}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium text-slate-900 dark:text-white">{item.meaning}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-sm ml-2">- {item.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Helpful tips */}
              {(() => {
                const numHp = typeof hp === 'string' ? parseInt(hp) : hp;
                if (numHp >= 40) {
                  return (
                    <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                      <strong>Remote Control Only:</strong> This motor requires console steering with remote throttle and shift controls. Too powerful for tiller operation.
                    </div>
                  );
                }
                if (numHp <= 30 && /(MH|MLH|EH|ELH)/i.test(title)) {
                  return (
                    <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                      <strong>Tiller Handle:</strong> Perfect if you sit at the back of the boat. Great for fishing where precise control matters.
                    </div>
                  );
                }
                if (!title.includes('E') && title.includes('M')) {
                  return (
                    <div className="mt-3 p-3 bg-secondary text-secondary-foreground rounded text-sm">
                      <strong>Manual Start:</strong> No battery needed — ideal for occasional use or as a backup motor. Very reliable.
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* What's Included */}
          {motor && (
            <div ref={includedRef} className="py-6 border-b border-border bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                What's Included
              </h3>
              <div className="space-y-2">
                {includedAccessories.map((accessory, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{accessory}</span>
                  </div>
                ))}
              </div>
              
              {additionalRequirements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2 text-sm">Additional Requirements:</h4>
                  <div className="space-y-2">
                    {additionalRequirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{req.item}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{req.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Two-column grid for remaining info blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Installation Requirements */}
            {motor && (
              <div ref={requirementsRef} className="py-6 border-b border-border bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <Wrench size={16} className="mr-2" /> Installation Requirements
                </h4>
                {(() => {
                  const numHp = typeof hp === 'string' ? parseInt(hp) : hp;
                  if (numHp >= 40) {
                    return (
                      <div className="text-destructive font-semibold flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} />
                        <span>Note: Remote controls required (additional ~$1,200)</span>
                      </div>
                    );
                  }
                  return null;
                })()}
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✓</span>
                    <span>Transom Height: {getTransomRequirement(motor)}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✓</span>
                    <span>Battery Required: {getBatteryRequirement(motor)}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✓</span>
                    <span>Control Type: {(() => {
                      const numHp = typeof hp === 'string' ? parseInt(hp) : hp;
                      if (numHp < 40) return 'Tiller or Remote';
                      return 'Remote required (Existing Mercury controls? Save $1,075 with adapter!)';
                    })()}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✓</span>
                    <span>Fuel Type: {getFuelRequirement(motor)}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2">✓</span>
                    <span>Oil Requirements: {getOilRequirement(motor)}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Perfect For */}
            {hp && (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">🎯 Perfect For</h4>
                <ul className="text-sm space-y-2">
                  {getIdealUses(hp).map((use, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-emerald-500 mr-2">•</span>
                      <span className="text-slate-700 dark:text-slate-300">{use}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Total Investment Estimate */}
            {hp && price && (
              <div ref={investmentRef} className="py-6 border-b border-border bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                  <Calculator size={16} className="mr-2" /> Total Investment Estimate
                </h4>
                <div className="text-sm space-y-2">
                  {(() => {
                    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
                    const numHp = typeof hp === 'string' ? parseInt(hp) : hp;
                    const needsControls = numHp >= 40;
                    const needsBattery = /\bE\b|EL|ELPT|EH|EFI/.test(title.toUpperCase()) && !/\bM\b/.test(title.toUpperCase());
                    const propCost = numHp >= 25 ? numHp >= 150 ? 950 : 350 : 0;
                    const total = numPrice + (needsControls ? 1200 : 0) + (needsBattery ? 179.99 : 0) + propCost + 500;
                    
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Motor:</span>
                          <span>{money(numPrice)}</span>
                        </div>
                        {needsControls && (
                          <div className="flex justify-between">
                            <span>Controls:</span>
                            <span>~$1,200</span>
                          </div>
                        )}
                        {needsBattery && (
                          <div className="flex justify-between">
                            <span>Battery:</span>
                            <span>~$179.99</span>
                          </div>
                        )}
                        {propCost > 0 && (
                          <div className="flex justify-between">
                            <span>Propeller:</span>
                            <span>~${propCost}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Installation:</span>
                          <span>~$500</span>
                        </div>
                        <div className="font-bold pt-2 border-t border-slate-300 dark:border-slate-600 flex justify-between">
                          <span>Total:</span>
                          <span>{money(total)} + HST</span>
                        </div>
                        <div className="text-xs mt-2 text-slate-600 dark:text-slate-400">
                          <p>* Includes all required accessories</p>
                          <p className="mt-1">*Approximate amounts only. Confirm with Harris Boat Works.</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Performance Estimates */}
            {hp && (
              <div ref={performanceRef} className="py-6 border-b border-border bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 text-foreground">⚡ Performance Estimates</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Ship size={14} /> <span>Boat Size</span>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{getRecommendedBoatSize(hp)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Gauge size={14} /> <span>Top Speed</span>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{getEstimatedSpeed(hp)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Fuel size={14} /> <span>Fuel Use</span>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{getFuelConsumption(hp)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                      <MapPin size={14} /> <span>Range</span>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{getRange(hp)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div ref={resourcesRef} className="py-6 border-b border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Resources</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleGenerateSpecSheet}
                disabled={specSheetLoading || !motor?.id}
                className="py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {specSheetLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Spec Sheet</span>
              </button>
              
              <button className="py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Shield className="w-4 h-4" />
                <span>Warranty Info</span>
              </button>
              
              <button className="py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Calendar className="w-4 h-4" />
                <span>Schedule Demo</span>
              </button>
              
              <button className="py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <BarChart3 className="w-4 h-4" />
                <span>Compare</span>
              </button>
            </div>

            {/* Enhanced Calculate Payment Button */}
            <button 
              onClick={handleCalculatePayment}
              className="w-full mt-6 py-4 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-base">
                💳 Calculate My Payment
              </div>
              <p className="text-xs font-normal text-muted-foreground mt-1">
                See monthly options from ${price ? Math.round((price * 1.13) / 84) : 'XXX'}/mo*
              </p>
            </button>
          </div>

          {/* Description */}
          {cleanedDescription && (
            <div className="py-6 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p>{cleanedDescription}</p>
            </div>
          )}
        </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{price ? money(price) : 'N/A'}</p>
              <p className="text-sm text-emerald-600">+2Y Warranty • {hp} HP • {shaft}</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{typeof hp === 'number' && hp} HP • {shaft}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCalculatePayment}
              className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              💳 Calculate Payment
            </button>
            <button 
              onClick={handleSelectMotor}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add to Quote →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}