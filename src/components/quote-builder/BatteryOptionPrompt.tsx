import React from 'react';
import { motion } from 'framer-motion';
import { Battery, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BatteryOptionPromptProps {
  onSelect: (wantsBattery: boolean) => void;
  selectedOption?: boolean | null;
  batteryCost?: number;
}

const BATTERY_COST = 179.99;

export function BatteryOptionPrompt({ 
  onSelect, 
  selectedOption,
  batteryCost = BATTERY_COST 
}: BatteryOptionPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Battery className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-medium">Starting Battery Required</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your motor has electric start. A marine starting battery is required to operate it. 
          Would you like to add one?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Yes, add battery */}
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-200 border-2",
            selectedOption === true 
              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onSelect(true)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              selectedOption === true ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {selectedOption === true ? (
                <Check className="w-5 h-5" />
              ) : (
                <Battery className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">Yes, add battery</p>
              <p className="text-sm text-muted-foreground">
                Marine starting battery — ${batteryCost.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* No, I have my own */}
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-200 border-2",
            selectedOption === false 
              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onSelect(false)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              selectedOption === false ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {selectedOption === false ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">No, I have my own</p>
              <p className="text-sm text-muted-foreground">
                I'll supply my own battery
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: A 12V marine starting battery is required for electric start motors.
      </p>
    </motion.div>
  );
}

export { BATTERY_COST };
