import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ArrowRight, Check, Share2, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ComparisonMotor } from '@/hooks/useMotorComparison';
import { 
  getEstimatedSpeed, 
  getFuelConsumption, 
  getRecommendedBoatSize, 
  getMaxBoatWeight,
  getStartType,
  includesFuelTank,
  includesPropeller
} from '@/lib/motor-helpers';
import {
  generateDisplacement,
  generateCylinders,
  generateWeight,
  generateAlternator,
  generateGearRatio,
  generateRPMRange
} from '@/lib/motor-spec-generators';

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  motors: ComparisonMotor[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onSelectMotor: (motor: ComparisonMotor) => void;
}

type ComparisonField = {
  label: string;
  getValue: (m: ComparisonMotor) => string | number | boolean | undefined;
  compare?: 'lowest' | 'highest';
  format?: (v: any) => string;
  category?: string;
};

// Helper to get "Best For" label based on motor type
const getBestForLabel = (type: string | undefined): string => {
  if (!type) return '—';
  const t = type.toLowerCase();
  if (t.includes('verado')) return 'Premium & Quiet';
  if (t.includes('proxs') || t.includes('pro xs')) return 'Performance';
  if (t.includes('seapro') || t.includes('sea pro')) return 'Commercial';
  if (t.includes('fourstroke') || t.includes('four stroke')) return 'All-Around';
  return type;
};

const COMPARISON_FIELDS: ComparisonField[] = [
  // Pricing
  { 
    label: 'Our Price', 
    getValue: (m) => m.price, 
    compare: 'lowest',
    format: (v) => v ? `$${v.toLocaleString()}` : '—',
    category: 'Pricing'
  },
  { 
    label: 'MSRP', 
    getValue: (m) => m.msrp,
    format: (v) => v ? `$${v.toLocaleString()}` : '—',
    category: 'Pricing'
  },
  { 
    label: 'You Save', 
    getValue: (m) => m.msrp && m.price ? m.msrp - m.price : undefined,
    compare: 'highest',
    format: (v) => v > 0 ? `$${v.toLocaleString()}` : '—',
    category: 'Pricing'
  },
  
  // Performance
  { 
    label: 'Horsepower', 
    getValue: (m) => m.hp, 
    compare: 'highest',
    format: (v) => v ? `${v} HP` : '—',
    category: 'Performance'
  },
  { 
    label: 'Est. Top Speed', 
    getValue: (m) => m.hp,
    format: (v) => v ? getEstimatedSpeed(v) : '—',
    category: 'Performance'
  },
  { 
    label: 'RPM Range', 
    getValue: (m) => m.hp,
    format: (v) => v ? generateRPMRange(v) : '—',
    category: 'Performance'
  },
  { 
    label: 'Fuel Economy', 
    getValue: (m) => m.hp,
    format: (v) => v ? getFuelConsumption(v) : '—',
    category: 'Performance'
  },
  
  // Engine Specs
  { 
    label: 'Displacement', 
    getValue: (m) => m.hp,
    format: (v) => v ? generateDisplacement(v) : '—',
    category: 'Engine'
  },
  { 
    label: 'Cylinders', 
    getValue: (m) => m.hp,
    format: (v) => v ? generateCylinders(v) : '—',
    category: 'Engine'
  },
  { 
    label: 'Weight', 
    getValue: (m) => m.hp,
    compare: 'lowest',
    format: (v) => v ? generateWeight(v) : '—',
    category: 'Engine'
  },
  { 
    label: 'Alternator', 
    getValue: (m) => m.hp,
    compare: 'highest',
    format: (v) => v ? generateAlternator(v) : '—',
    category: 'Engine'
  },
  { 
    label: 'Gear Ratio', 
    getValue: (m) => m.hp,
    format: (v) => v ? generateGearRatio(v) : '—',
    category: 'Engine'
  },
  
  // Compatibility
  { 
    label: 'Best For', 
    getValue: (m) => m.type,
    format: (v) => getBestForLabel(v),
    category: 'Compatibility'
  },
  { 
    label: 'Boat Size', 
    getValue: (m) => m.hp,
    format: (v) => v ? getRecommendedBoatSize(v) : '—',
    category: 'Compatibility'
  },
  { 
    label: 'Max Boat Weight', 
    getValue: (m) => m.hp,
    format: (v) => v ? getMaxBoatWeight(v) : '—',
    category: 'Compatibility'
  },
  { 
    label: 'Shaft', 
    getValue: (m) => m.shaft,
    format: (v) => v || '—',
    category: 'Compatibility'
  },
  { 
    label: 'Start Type', 
    getValue: (m) => m.model,
    format: (v) => v ? getStartType(v) : '—',
    category: 'Compatibility'
  },
  
  // Included
  { 
    label: 'Fuel Tank Incl.', 
    getValue: (m) => includesFuelTank({ hp: m.hp, model: m.model } as any),
    format: (v) => v ? '✓ Yes' : '✗ No',
    category: 'Included'
  },
  { 
    label: 'Prop Incl.', 
    getValue: (m) => includesPropeller({ hp: m.hp, model: m.model } as any),
    format: (v) => v ? '✓ Yes' : '✗ No',
    category: 'Included'
  },
  { 
    label: 'In Stock', 
    getValue: (m) => m.in_stock,
    format: (v) => v ? '✓ Yes' : '✗ No',
    category: 'Availability'
  }
];

export function ComparisonDrawer({ 
  isOpen, 
  onClose, 
  motors, 
  onRemove, 
  onClear,
  onSelectMotor 
}: ComparisonDrawerProps) {
  const navigate = useNavigate();
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Show swipe hint when drawer opens with 2+ motors
  useEffect(() => {
    if (isOpen && motors.length >= 2) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowSwipeHint(false);
    }
  }, [isOpen, motors.length]);

  // Hide hint on scroll
  const handleScroll = () => {
    if (showSwipeHint) setShowSwipeHint(false);
  };

  // Find winner for each comparable field
  const getWinner = (field: ComparisonField): string | null => {
    if (!field.compare || motors.length < 2) return null;
    
    const values = motors.map(m => ({ id: m.id, value: field.getValue(m) }))
      .filter(v => v.value !== undefined && v.value !== null);
    
    if (values.length < 2) return null;
    
    if (field.compare === 'lowest') {
      const min = Math.min(...values.map(v => Number(v.value)));
      return values.find(v => Number(v.value) === min)?.id || null;
    } else {
      const max = Math.max(...values.map(v => Number(v.value)));
      return values.find(v => Number(v.value) === max)?.id || null;
    }
  };

  const handleShare = async () => {
    if (motors.length === 0) {
      toast.error('Add motors to compare first');
      return;
    }
    
    const ids = motors.map(m => m.id).join(',');
    const url = `${window.location.origin}/compare?motors=${ids}`;
    
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Comparison link copied!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenFullComparison = () => {
    if (motors.length === 0) return;
    const ids = motors.map(m => m.id).join(',');
    navigate(`/compare?motors=${ids}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[90]"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden"
          >
            {/* Header - 2 rows on mobile */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3">
              {/* Row 1: Title + Close */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Compare Motors ({motors.length}/3)</h3>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Row 2: Action buttons */}
              {motors.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShare}
                    className="gap-1.5 px-2 sm:px-3"
                  >
                    <Share2 size={14} />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenFullComparison}
                    className="gap-1.5 px-2 sm:px-3"
                  >
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">Full View</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClear}
                    className="text-gray-500 hover:text-red-500 ml-auto px-2 sm:px-3"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline ml-1">Clear All</span>
                  </Button>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="relative overflow-x-auto overflow-y-auto max-h-[calc(85vh-60px)]"
            >
              {/* Swipe hint overlay */}
              <AnimatePresence>
                {showSwipeHint && motors.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-3 top-20 flex items-center gap-1.5 bg-gray-900/80 text-white text-sm px-3 py-2 rounded-full pointer-events-none z-10"
                  >
                    <span>Swipe</span>
                    <ChevronRight size={16} className="animate-pulse" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Right edge gradient hint */}
              {motors.length >= 2 && (
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5]" />
              )}
              
              {motors.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No motors added to comparison yet.</p>
                  <p className="text-sm mt-2">Click the scale icon on motor cards to compare.</p>
                </div>
              ) : (
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="p-4 text-left text-sm font-medium text-gray-500 w-32">
                        Feature
                      </th>
                      {motors.map((motor) => (
                        <th key={motor.id} className="p-4 text-center">
                          <div className="relative">
                            <button
                              onClick={() => onRemove(motor.id)}
                              className="absolute -top-1 -right-1 p-1 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors hidden md:flex items-center justify-center"
                            >
                              <X size={14} />
                            </button>
                            {motor.image && (
                              <img 
                                src={motor.image} 
                                alt={motor.model}
                                className="w-20 h-20 object-contain mx-auto mb-2"
                              />
                            )}
                            <p className="font-semibold text-sm">{motor.model}</p>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FIELDS.map((field) => {
                      const winnerId = getWinner(field);
                      return (
                        <tr key={field.label} className="border-b border-gray-50">
                          <td className="p-4 text-sm font-medium text-gray-600">
                            {field.label}
                          </td>
                          {motors.map((motor) => {
                            const value = field.getValue(motor);
                            const isWinner = winnerId === motor.id;
                            return (
                              <td 
                                key={motor.id} 
                                className={cn(
                                  'p-4 text-center text-sm',
                                  isWinner && 'bg-green-50'
                                )}
                              >
                                <span className={cn(
                                  isWinner && 'text-green-700 font-semibold'
                                )}>
                                  {field.format ? field.format(value) : String(value || '—')}
                                </span>
                                {isWinner && (
                                  <Check size={14} className="inline-block ml-1 text-green-600" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    
                    {/* Action Row */}
                    <tr>
                      <td className="p-4"></td>
                      {motors.map((motor) => (
                        <td key={motor.id} className="p-4 text-center">
                          <Button
                            onClick={() => onSelectMotor(motor)}
                            className="w-full"
                            size="sm"
                          >
                            Select
                            <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
