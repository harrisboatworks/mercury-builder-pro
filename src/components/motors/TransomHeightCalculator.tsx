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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            📐 Transom Height Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Visual Diagram */}
          <div className="bg-gray-50 rounded-lg p-6">
            <svg viewBox="0 0 200 150" className="w-full h-40">
              {/* Boat outline */}
              <path 
                d="M 20 60 L 60 40 L 180 40 L 180 80 L 20 80 Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="text-gray-400"
              />
              
              {/* Transom */}
              <line x1="180" y1="40" x2="180" y2="120" stroke="currentColor" strokeWidth="3" className="text-gray-700" />
              
              {/* Water line */}
              <line x1="0" y1="120" x2="200" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-blue-400" />
              <text x="10" y="130" className="text-xs fill-blue-500">Water line</text>
              
              {/* Measurement arrow */}
              <line x1="160" y1="80" x2="160" y2="120" stroke="currentColor" strokeWidth="2" className="text-green-600" />
              <line x1="155" y1="85" x2="160" y2="80" stroke="currentColor" strokeWidth="2" className="text-green-600" />
              <line x1="165" y1="85" x2="160" y2="80" stroke="currentColor" strokeWidth="2" className="text-green-600" />
              <line x1="155" y1="115" x2="160" y2="120" stroke="currentColor" strokeWidth="2" className="text-green-600" />
              <line x1="165" y1="115" x2="160" y2="120" stroke="currentColor" strokeWidth="2" className="text-green-600" />
              
              {/* Labels */}
              <text x="100" y="35" className="text-xs fill-gray-500 text-center">BOAT</text>
              <text x="185" y="60" className="text-xs fill-gray-700">Transom</text>
              <text x="130" y="100" className="text-xs fill-green-600">Measure here</text>
            </svg>
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
              Cancel
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
