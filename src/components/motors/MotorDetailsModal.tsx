"use client";
import React, { useEffect, useState } from "react";
import { X, Calculator, Download, FileText, Star, Wrench, Zap, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMotorModal } from "@/contexts/MotorModalContext";
import { decodeModelName, getRecommendedBoatSize, getEstimatedSpeed, getFuelConsumption, getTransomRequirement, getBatteryRequirement, getIncludedAccessories } from "@/lib/motor-helpers";

export default function MotorDetailsModal() {
  const { isOpen, selectedMotor, motorProps, closeModal } = useMotorModal();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [specSheetLoading, setSpecSheetLoading] = useState(false);
  const [generatedSpecUrl, setGeneratedSpecUrl] = useState<string | null>(null);

  const {
    title,
    subtitle,
    img,
    msrp,
    price,
    promoText,
    description,
    hp,
    shaft,
    weightLbs,
    altOutput,
    steering,
    features,
    specSheetUrl,
    onSelect
  } = motorProps;

  // Handle escape key and body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeModal]);

  const handleCalculatePayment = () => {
    if (typeof price === 'number' && price > 0) {
      navigate(`/finance-calculator?price=${price}&motor=${encodeURIComponent(title || '')}`);
      closeModal();
    }
  };

  const handleSelectMotor = () => {
    if (onSelect) {
      onSelect();
    }
    closeModal();
  };

  const handleGenerateSpecSheet = async () => {
    if (!selectedMotor) return;
    
    setSpecSheetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-motor-spec-sheet', {
        body: {
          motorId: selectedMotor.id,
          title: title || selectedMotor.title,
          hp: hp || selectedMotor.hp,
          model: selectedMotor.model
        }
      });

      if (error) throw error;

        if (data?.specSheetUrl) {
          setGeneratedSpecUrl(data.specSheetUrl);
          toast.success("Spec sheet generated successfully!");
          // Open the spec sheet URL in a new window
          window.open(data.specSheetUrl, '_blank');
        }
    } catch (error) {
      console.error('Error generating spec sheet:', error);
      toast.error("Failed to generate spec sheet");
    } finally {
      setSpecSheetLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const fmt = (n?: number | null) => (typeof n === "number" ? `$${n.toLocaleString()}` : undefined);
  const displayFeatures = Array.isArray(features) ? features : [];
  const cleanedDescription = String(description || '').replace(/Can't find what you're looking for\?[\s\S]*/i, '').replace(/Videos you watch may be added to the TV's watch history[\s\S]*?computer\./i, '').trim();

  // Calculated metrics using available functions
  const motorHp = hp || selectedMotor?.hp || 0;
  const recommendedBoatSize = getRecommendedBoatSize(motorHp);
  const estimatedSpeed = getEstimatedSpeed(motorHp);
  const fuelConsumption = getFuelConsumption(motorHp);
  const transomRequirement = selectedMotor ? getTransomRequirement(selectedMotor) : null;
  const batteryRequirement = selectedMotor ? getBatteryRequirement(selectedMotor) : null;
  const includedAccessories = selectedMotor ? getIncludedAccessories(selectedMotor) : [];

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={closeModal} 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        data-testid="modal-backdrop"
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-4xl rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 max-h-[90vh] overflow-y-auto z-[9999]"
        data-testid="motor-details-modal"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 z-10">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={closeModal}
              className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 pb-24">
          {/* Motor Image and Pricing */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              {img && (
                <img 
                  src={img} 
                  alt={title || 'Motor'} 
                  className="w-full h-64 object-contain bg-slate-50 dark:bg-slate-800 rounded-lg" 
                />
              )}
            </div>
            <div>
              <div className="space-y-3">
                {typeof msrp === "number" && msrp > 0 && (
                  <div className="text-sm text-slate-500 line-through">
                    MSRP: {fmt(msrp)}
                  </div>
                )}
                {typeof price === "number" && price > 0 && (
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {fmt(price)}
                  </div>
                )}
                {promoText && (
                  <div className="inline-block">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                      {promoText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Specs */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-blue-600" />
              Quick Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hp && (
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{hp}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Horsepower</div>
                </div>
              )}
              {shaft && (
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-lg font-semibold">{shaft}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Shaft Length</div>
                </div>
              )}
              {weightLbs && (
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-lg font-semibold">{weightLbs} lbs</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Weight</div>
                </div>
              )}
              {steering && (
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-lg font-semibold">{steering}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Steering</div>
                </div>
              )}
            </div>
          </div>

          {/* Key Features */}
          {displayFeatures.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Key Features
              </h3>
              <div className="grid md:grid-cols-2 gap-2">
                {displayFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installation Requirements */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-orange-600" />
              Installation Requirements
            </h3>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="space-y-2">
                {transomRequirement && (
                  <div><strong>Transom Height:</strong> {transomRequirement}</div>
                )}
                {batteryRequirement && (
                  <div><strong>Battery:</strong> {batteryRequirement}</div>
                )}
                {includedAccessories.length > 0 && (
                  <div>
                    <strong>Included:</strong> {includedAccessories.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Estimates */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-600" />
              Performance Estimates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{recommendedBoatSize}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Recommended Boat Size</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-xl font-bold text-green-600">{estimatedSpeed}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Est. Top Speed</div>
                <div className="text-xs text-slate-500 mt-1">Conditions vary</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{fuelConsumption}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Est. Fuel Consumption</div>
                <div className="text-xs text-slate-500 mt-1">At cruise</div>
              </div>
            </div>
          </div>

          {/* Technical Specification Sheet */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-slate-600" />
              Technical Specifications
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Download a comprehensive technical specification sheet with detailed motor information.
              </p>
              <button
                onClick={handleGenerateSpecSheet}
                disabled={specSheetLoading}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{specSheetLoading ? 'Generating...' : 'Download Spec Sheet'}</span>
              </button>
            </div>
          </div>

          {/* Description */}
          {cleanedDescription && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {cleanedDescription}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex space-x-3">
            {typeof price === "number" && price > 0 && (
              <button
                onClick={handleCalculatePayment}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                <Calculator className="h-4 w-4" />
                <span>Calculate Payment</span>
              </button>
            )}
            {onSelect && (
              <button
                onClick={handleSelectMotor}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Select This Motor
              </button>
            )}
            <button
              onClick={closeModal}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}