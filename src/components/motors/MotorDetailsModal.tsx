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
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-hidden z-[9999]"
        data-testid="motor-details-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {title}
              </h2>
              {subtitle && (
                <p className="text-red-100 text-sm mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={closeModal}
              className="rounded-full p-2 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-200px)]">
          <div className="p-6">
            {/* Motor Image and Pricing */}
            <div className="text-center mb-6">
              {img && (
                <img 
                  src={img} 
                  alt={title || 'Motor'} 
                  className="w-full h-48 object-contain bg-slate-50 dark:bg-slate-800 rounded-lg mb-4" 
                />
              )}
              
              <div className="space-y-2">
                {typeof msrp === "number" && msrp > 0 && (
                  <div className="text-sm text-slate-500 line-through">
                    MSRP: {fmt(msrp)}
                  </div>
                )}
                {typeof price === "number" && price > 0 && (
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
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

            {/* Quick Specs */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {hp && (
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-xl font-bold text-red-600">{hp}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">HP</div>
                  </div>
                )}
                {shaft && (
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold">{shaft}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Shaft</div>
                  </div>
                )}
                {weightLbs && (
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold">{weightLbs} lbs</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Weight</div>
                  </div>
                )}
                {steering && (
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-sm font-semibold">{steering}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Steering</div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Features */}
            {displayFeatures.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                  Key Features
                </h3>
                <div className="space-y-2">
                  {displayFeatures.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                  {displayFeatures.length > 4 && (
                    <div className="text-xs text-slate-500">
                      +{displayFeatures.length - 4} more features
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Spec Sheet Download */}
            <div className="mb-4">
              <button
                onClick={handleGenerateSpecSheet}
                disabled={specSheetLoading}
                className="w-full inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{specSheetLoading ? 'Generating...' : 'Download Full Spec Sheet'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex space-x-3">
            {typeof price === "number" && price > 0 && (
              <button
                onClick={handleCalculatePayment}
                disabled={isLoading}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Calculator className="h-4 w-4" />
                <span>Finance</span>
              </button>
            )}
            {onSelect && (
              <button
                onClick={handleSelectMotor}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                Select Motor
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}