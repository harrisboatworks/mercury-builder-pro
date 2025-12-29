import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowRight, FileText, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface RepowerCTAData {
  targetHP?: number;
  hasGuide?: boolean;
}

interface RepowerCTACardProps {
  data: RepowerCTAData;
}

export function RepowerCTACard({ data }: RepowerCTACardProps) {
  const { targetHP, hasGuide } = data;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-blue-50/50 to-gray-50"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">
            Repower Your Boat
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
            Save 30-40% on fuel
          </span>
        </div>
        
        {targetHP && (
          <p className="text-sm text-gray-600 mb-3">
            Upgrading to a {targetHP}HP FourStroke?
          </p>
        )}
        
        {!targetHP && (
          <p className="text-sm text-gray-600 mb-3">
            Get 70% of the new boat experience at 30% of the cost
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-3">
          <div className="flex gap-2">
            {hasGuide && (
              <Link
                to="/repower"
                className="flex-1 py-2.5 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Repower Guide
              </Link>
            )}
            <Link
              to="/quote/motor-selection"
              className="flex-1 py-2.5 px-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
            >
              Start Quote
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <a
            href="tel:+17059327100"
            className="w-full py-2 px-3 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            <Phone className="w-3 h-3" />
            Talk to a Repower Specialist
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// Helper to parse repower CTA from message text
export function parseRepowerCTA(text: string): { displayText: string; ctaData: RepowerCTAData | null } {
  const ctaRegex = /\[REPOWER_CTA:\s*(\{[^}]+\})\]/;
  const match = text.match(ctaRegex);
  
  if (!match) {
    return { displayText: text, ctaData: null };
  }
  
  try {
    const ctaData = JSON.parse(match[1]) as RepowerCTAData;
    const displayText = text.replace(ctaRegex, '').trim();
    return { displayText, ctaData };
  } catch (error) {
    console.error('Failed to parse repower CTA:', error);
    return { displayText: text, ctaData: null };
  }
}
