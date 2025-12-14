import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SHAFT_LENGTHS, getRecommendedShaft } from '@/lib/motor-codes';
import { Check, Info } from 'lucide-react';

interface TransomHeightCalculatorProps {
  open: boolean;
  onClose: () => void;
  onApply: (shaftInches: number) => void;
}

export function TransomHeightCalculator({ open, onClose, onApply }: TransomHeightCalculatorProps) {
  const [measurement, setMeasurement] = useState<string>('');
  
  const numericMeasurement = parseFloat(measurement) || 0;
  const recommendation = numericMeasurement > 0 ? getRecommendedShaft(numericMeasurement) : null;
  
  const handleApply = () => {
    if (recommendation) {
      onApply(recommendation.inches);
      onClose();
      setMeasurement('');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            📐 Transom Height Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {/* Visual Diagram - Real image */}
          <div className="bg-gray-50 rounded-lg p-4">
            <img 
              src="/lovable-uploads/cb45570a-2b96-4b08-af3d-412c7607a66e.png" 
              alt="Transom height measurement guide showing how to measure from transom top to waterline"
              className="w-full max-w-md mx-auto rounded-lg"
            />
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>How to measure:</strong> Measure from the top center of the transom 
              (where the motor clamps) straight down to the bottom of the hull.
            </div>
          </div>
          
          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Enter your transom height:
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 20"
                value={measurement}
                onChange={(e) => setMeasurement(e.target.value)}
                className="flex-1"
                min={10}
                max={35}
              />
              <span className="flex items-center text-gray-500">inches</span>
            </div>
          </div>
          
          {/* Recommendation */}
          {recommendation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 font-medium">
                <Check className="w-5 h-5" />
                Recommended: {recommendation.name} Shaft ({recommendation.inches}")
              </div>
              <p className="text-sm text-green-700 mt-1">
                {recommendation.suitableFor}
              </p>
            </div>
          )}
          
          {numericMeasurement > 31 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Your transom is taller than standard. Please contact us for custom solutions.
              </p>
            </div>
          )}
          
          {/* Reference Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Shaft</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Transom</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Best For</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {SHAFT_LENGTHS.map(shaft => (
                  <tr 
                    key={shaft.code}
                    className={recommendation?.code === shaft.code ? 'bg-green-50' : ''}
                  >
                    <td className="px-4 py-2 font-medium">
                      {shaft.name} ({shaft.inches}")
                      {recommendation?.code === shaft.code && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{shaft.transomRange}</td>
                    <td className="px-4 py-2 text-gray-500">{shaft.suitableFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Tip */}
          <p className="text-xs text-gray-500">
            💡 <strong>Tip:</strong> When in doubt, go LONGER. A motor mounted too high 
            causes cavitation; too low just adds a little drag.
          </p>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              ← Back
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!recommendation}
              className="flex-1"
            >
              Apply {recommendation?.inches}" Shaft
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
