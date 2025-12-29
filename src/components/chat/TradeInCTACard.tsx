import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface TradeInCTAData {
  action: 'quote' | 'call';
  currentMotor?: string;
}

interface TradeInCTACardProps {
  data: TradeInCTAData;
}

export function TradeInCTACard({ data }: TradeInCTACardProps) {
  const { currentMotor } = data;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-emerald-50/50 to-gray-50"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">
            Get Your Trade-In Value
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-4">
        <p className="text-sm text-gray-600 mb-1">
          We'll appraise your motor as part of your quote
        </p>
        {currentMotor && (
          <p className="text-xs text-gray-500 mb-3">
            Trading up from a {currentMotor}?
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <a
            href="tel:+17059327100"
            className="flex-1 py-2.5 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            Quick Estimate
          </a>
          <Link
            to="/quote/trade-in"
            className="flex-1 py-2.5 px-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
          >
            Start Quote
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Helper to parse trade-in CTA from message text
export function parseTradeInCTA(text: string): { displayText: string; ctaData: TradeInCTAData | null } {
  const ctaRegex = /\[TRADEIN_CTA:\s*(\{[^}]+\})\]/;
  const match = text.match(ctaRegex);
  
  if (!match) {
    return { displayText: text, ctaData: null };
  }
  
  try {
    const ctaData = JSON.parse(match[1]) as TradeInCTAData;
    const displayText = text.replace(ctaRegex, '').trim();
    return { displayText, ctaData };
  } catch (error) {
    console.error('Failed to parse trade-in CTA:', error);
    return { displayText: text, ctaData: null };
  }
}
