import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Phone, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ServiceCTAData {
  issue?: string;
  urgency?: 'normal' | 'urgent';
}

interface ServiceCTACardProps {
  data: ServiceCTAData;
}

export function ServiceCTACard({ data }: ServiceCTACardProps) {
  const { urgency } = data;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-orange-50/50 to-gray-50"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
            <Wrench className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <span className="text-sm font-medium text-gray-800">
            Book a Service Appointment
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-4">
        <p className="text-sm text-gray-600 mb-1">
          Our certified Mercury techs can diagnose and fix it
        </p>
        {urgency === 'urgent' ? (
          <p className="text-xs text-orange-600 font-medium mb-3">
            Priority appointments available
          </p>
        ) : (
          <p className="text-xs text-gray-500 mb-3">
            Same-week appointments often available
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <a
            href="tel:+17059327100"
            className="flex-1 py-2.5 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            Call Service
          </a>
          <Link
            to="/contact"
            className="flex-1 py-2.5 px-3 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Online
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Helper to parse service CTA from message text
export function parseServiceCTA(text: string): { displayText: string; ctaData: ServiceCTAData | null } {
  const ctaRegex = /\[SERVICE_CTA:\s*(\{[^}]+\})\]/;
  const match = text.match(ctaRegex);
  
  if (!match) {
    return { displayText: text, ctaData: null };
  }
  
  try {
    const ctaData = JSON.parse(match[1]) as ServiceCTAData;
    const displayText = text.replace(ctaRegex, '').trim();
    return { displayText, ctaData };
  } catch (error) {
    console.error('Failed to parse service CTA:', error);
    return { displayText: text, ctaData: null };
  }
}
