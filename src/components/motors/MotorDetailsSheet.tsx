"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Ship, Gauge, Fuel, MapPin, Wrench, AlertTriangle, CheckCircle, FileText, ExternalLink, Download, Loader2, Calendar, Shield, BarChart3, X } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useIsMobile } from "../../hooks/use-mobile";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { money } from "../../lib/money";
import { MotorImageGallery } from './MotorImageGallery';
import { MonthlyPaymentDisplay } from '../quote-builder/MonthlyPaymentDisplay';
import { decodeModelName, getRecommendedBoatSize, getEstimatedSpeed, getFuelConsumption, getRange, getTransomRequirement, getBatteryRequirement, getFuelRequirement, getOilRequirement, getIdealUses, getIncludedAccessories, getAdditionalRequirements, cleanSpecSheetUrl, requiresMercuryControls, isTillerMotor, type Motor } from "../../lib/motor-helpers";
import { findMotorSpecs, getMotorSpecs, type MercuryMotor } from "../../lib/data/mercury-motors";
import { getReviewsForMotor, getReviewCount } from "../../lib/data/mercury-reviews";
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
  const handleCalculatePayment = () => {
    onClose();
    navigate('/finance-calculator', {
      state: {
        motorPrice: price || 0,
        motorModel: title,
        motorId: motor?.id || `${title}-${hp}`,
        motorHp: typeof hp === 'string' ? parseInt(hp) : hp,
        fromModal: true
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
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-motor-spec-sheet', {
        body: {
          motorId: motor.id
        }
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
      const imgHeight = canvas.height * imgWidth / canvas.width;
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

  // Find matching Mercury specs - Full specs available for AI assistant
  const motorSpecs = motor ? findMotorSpecs(typeof hp === 'string' ? parseInt(hp) : hp || 0, title) : undefined;
  if (!open) return null;
  const displayFeatures = Array.isArray(features) ? features : [];
  const cleanedDescription = String(description || '').replace(/Can't find what you're looking for\?[\s\S]*/i, '').replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '').trim();
  return <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - responsive sizing */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4">
        <div className="relative bg-white dark:bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl md:max-w-3xl lg:max-w-4xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
          
          {/* Modal Header */}
          <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm sm:rounded-t-xl">
            {/* Header Bar */}
            <div className="flex items-start justify-between p-4 sm:p-6 gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
                  {title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>{shaft}</span>
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
              <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg dark:shadow-slate-900/50 rounded-full transition-all border border-slate-200 dark:border-slate-700" aria-label="Close">
                <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          </div>


          {/* Scrollable Content Area */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain pt-20">
            <div className="p-4 space-y-8">
              
              {/* Motor Image */}
              <div className="flex justify-center py-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {motor?.images && motor.images.length > 0 ? <MotorImageGallery images={motor.images} motorTitle={title} /> : img ? <img src={img} alt={title} className="h-40 sm:h-48 object-contain" /> : <div className="h-40 sm:h-48 w-full bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-slate-500 dark:text-slate-400">No image available</span>
                  </div>}
              </div>
              
              {/* Specifications Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Specifications
                </h2>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">About This Motor</h3>
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
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    {/* Technical specifications moved from "What's Included" */}
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
                    </>}
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
                    {motorSpecs && <>
                        <li className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-slate-700 dark:text-slate-300">
                            <span className="font-medium">Available Transom Heights</span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">({motorSpecs.transom_heights.join(', ')})</span>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-slate-700 dark:text-slate-300">
                            <span className="font-medium">Weight</span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">({motorSpecs.weight_kg} kg dry weight)</span>
                          </div>
                        </li>
                      </>}
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
                          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">All remote control motors require Mercury throttle & shift controls and wiring harness for proper operation.  What is required for your individual boat will need to be determined by HBW techs.</p>
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

              {/* Resources Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Resources
                </h2>
                <div className="grid gap-2">
                  <Button onClick={handleGenerateSpecSheet} disabled={specSheetLoading} variant="outline" size="sm" className="justify-start">
                    {specSheetLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Download Spec Sheet
                  </Button>
                  
                  <Button onClick={() => navigate('/quote/schedule')} variant="outline" size="sm" className="justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Demo
                  </Button>
                </div>
              </div>

              {/* Customer Reviews Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  What Customers Say
                </h2>
                
                {(() => {
                  const hpValue = typeof hp === 'string' ? parseInt(hp) : hp || 0;
                  const reviews = getReviewsForMotor(hpValue, title);
                  const review = reviews[0]; // Get first review
                  const reviewCount = getReviewCount(hpValue, title);

                  return review ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <span>★★★★★</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                        </span>
                      </div>
                      
                      <blockquote className="border-l-2 border-primary/20 pl-4">
                        <p className="text-sm italic text-foreground/90">
                          "{review.comment}"
                        </p>
                        <footer className="text-xs text-muted-foreground mt-2">
                          — {review.reviewer}, {review.location}
                        </footer>
                      </blockquote>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      New model - contact us for customer experiences
                    </p>
                  );
                })()}
                
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
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {typeof price === "number" ? money(price) : 'Call for Price'}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">+2Y Warranty</p>
                  </div>
                  <div className="text-right">
                    {typeof price === "number" && <MonthlyPaymentDisplay motorPrice={price} />}
                  </div>
                </div>
              </div>
              
              {/* Buttons Side-by-Side */}
              <div className="flex gap-2 mt-2">
                <button onClick={handleCalculatePayment} className="flex-1 py-2 px-3 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium">
                  Calculate
                </button>
                <Button onClick={handleSelectMotor} className="flex-1 py-2 px-3 text-sm font-medium">
                  Add to Quote
                </Button>
              </div>
            </div>
            
            {/* Desktop: Side by side */}
            <div className="hidden sm:flex gap-3">
              <Button onClick={handleCalculatePayment} variant="outline" size="lg" className="flex-1">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Payment
              </Button>
              <Button onClick={handleSelectMotor} size="lg" className="flex-1">
                Add to Quote →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>;
}