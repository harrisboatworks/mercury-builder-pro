import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export interface FinancingCTAData {
  price: number;
  monthly: number;
  term: number;
  rate: number;
  motorModel?: string;
  motorId?: string;
}

interface FinancingCTACardProps {
  data: FinancingCTAData;
}

export function FinancingCTACard({ data }: FinancingCTACardProps) {
  const { price, monthly, term, rate, motorModel, motorId } = data;
  
  // Calculate total cost for display
  const totalWithTax = Math.round(price * 1.13);
  const dealerplanFee = 299;
  const totalFinanced = totalWithTax + dealerplanFee;
  
  // Build financing application URL with motor context
  const financingParams = new URLSearchParams();
  if (motorModel) financingParams.set('motor', motorModel);
  if (price) financingParams.set('price', price.toString());
  const financingUrl = `/financing-application${financingParams.toString() ? `?${financingParams.toString()}` : ''}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50/30"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">
            {motorModel ? `Financing for ${motorModel}` : 'Financing Estimate'}
          </span>
        </div>
      </div>
      
      {/* Payment Details */}
      <div className="px-4 py-4">
        <div className="text-center mb-3">
          <div className="text-3xl font-semibold text-gray-900">
            ~${monthly.toLocaleString()}<span className="text-lg font-normal text-gray-500">/mo</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {term} months at {rate}% APR
          </div>
        </div>
        
        <div className="text-xs text-gray-400 text-center border-t border-gray-100 pt-3 mb-4">
          Based on ${price.toLocaleString()} + 13% HST + $299 fee
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to="/financing"
            className="flex-1 py-2.5 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Calculator
          </Link>
          <Link
            to={financingUrl}
            className="flex-1 py-2.5 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
          >
            Apply Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Helper to parse financing CTA from message text
export function parseFinancingCTA(text: string): { displayText: string; ctaData: FinancingCTAData | null } {
  // Match [FINANCING_CTA: {...}] with flexible JSON parsing
  // This regex captures everything between the outermost braces
  const ctaRegex = /\[FINANCING_CTA:\s*(\{[^[\]]*\})\]/;
  const match = text.match(ctaRegex);
  
  if (!match) {
    return { displayText: text, ctaData: null };
  }
  
  try {
    // Clean up the JSON string (handle potential issues with quotes)
    const jsonStr = match[1].trim();
    const ctaData = JSON.parse(jsonStr) as FinancingCTAData;
    const displayText = text.replace(ctaRegex, '').trim();
    return { displayText, ctaData };
  } catch (error) {
    console.error('Failed to parse financing CTA:', error, 'Raw:', match[1]);
    // Still remove the marker even if parsing fails
    const displayText = text.replace(/\[FINANCING_CTA:[^\]]*\]/, '').trim();
    return { displayText, ctaData: null };
  }
}
