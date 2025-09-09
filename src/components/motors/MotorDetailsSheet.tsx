"use client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Ship, Gauge, Fuel, MapPin, Wrench, AlertTriangle, CheckCircle, FileText, ExternalLink, Download, Loader2 } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { Button } from "../ui/button";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { money } from "../../lib/money";
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

  const generateClientSidePDF = async (htmlContent: string, motorModel: string) => {
    try {
      // Create a temporary container for the HTML content
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '794px'; // A4 width in pixels at 96 DPI
      container.style.height = 'auto';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(container);

      // Wait a moment for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate canvas from HTML with optimized settings for professional output
      const canvas = await html2canvas(container, {
        scale: 2, // High resolution for crisp text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure all styles are properly applied
          const clonedContainer = clonedDoc.querySelector('div');
          if (clonedContainer) {
            clonedContainer.style.width = '794px';
            clonedContainer.style.fontFamily = 'Arial, sans-serif';
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[99999]" style={{ isolation: 'isolate' }}>
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 absolute inset-x-0 bottom-0 mx-auto w-full max-w-4xl rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[90vh] overflow-y-auto"
           style={{ isolation: 'isolate' }}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
          
          {/* Header Section */}
          <div className="mt-3 grid gap-4 sm:grid-cols-[160px_1fr]">
            {img && <img src={img} alt="" className="h-36 w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-800" />}
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

        <div className="p-4 space-y-6">
          {/* Key Features */}
          {displayFeatures.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Key Features:</h4>
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
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Installation Requirements */}
            {motor && (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center text-slate-900 dark:text-white">
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
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center text-slate-900 dark:text-white">
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
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">⚡ Performance Estimates</h4>
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

          {/* Description */}
          {cleanedDescription && (
            <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Description</h4>
              <p>{cleanedDescription}</p>
            </div>
          )}

          {/* Spec Sheet Generator */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Technical Specifications
            </h3>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerateSpecSheet}
                disabled={specSheetLoading || !motor?.id}
                className="inline-flex items-center gap-2"
                variant="outline"
              >
                {specSheetLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {specSheetLoading ? 'Generating...' : 'Download Spec Sheet'}
              </Button>
              {generatedSpecUrl && (
                <a
                  href={generatedSpecUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Generated Sheet
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handleCalculatePayment} className="flex-1">
              Calculate Payment
            </Button>
            {onSelect && (
              <Button onClick={handleSelectMotor} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                Select This Motor →
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} className="px-3">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}