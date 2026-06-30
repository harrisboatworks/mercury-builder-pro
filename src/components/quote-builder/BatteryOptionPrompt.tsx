import React from 'react';
import { motion } from 'framer-motion';
import { Battery, X, Clock } from 'lucide-react';
import { QuoteRadioTile } from '@/components/quote-builder/redesign/QuoteRadioTile';

interface BatteryOptionPromptProps {
  onSelect: (wantsBattery: boolean | null) => void;
  selectedOption?: boolean | null;
  batteryCost?: number;
}

const BATTERY_COST = 179.99;

export function BatteryOptionPrompt({
  onSelect,
  selectedOption,
  batteryCost = BATTERY_COST,
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
          <Battery className="w-5 h-5 text-repower-navy-900/70" />
          <h3 className="font-display text-lg font-bold text-repower-navy-900">Starting Battery</h3>
        </div>
        <p className="font-sans text-[14px] text-repower-navy-900/65 leading-relaxed">
          Your motor has electric start and needs a 12V marine starting battery.
          You can add one now or decide later. Skipping this won't hold up your quote.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuoteRadioTile
          selected={selectedOption === true}
          onClick={() => onSelect(true)}
          icon={<Battery className="w-5 h-5" />}
          label="Yes, add battery"
          description={`Marine starting battery, $${batteryCost.toFixed(2)}`}
        />
        <QuoteRadioTile
          selected={selectedOption === false}
          onClick={() => onSelect(false)}
          icon={<X className="w-5 h-5" />}
          label="No, I have my own"
          description="I'll supply my own battery"
        />
        <QuoteRadioTile
          selected={selectedOption === null}
          onClick={() => onSelect(null)}
          icon={<Clock className="w-5 h-5" />}
          label="Decide later"
          description="Skip for now, sort it out with our team"
        />
      </div>
    </motion.div>
  );
}

export { BATTERY_COST };

