import { useState } from 'react';
import { Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotorComparison } from '@/contexts/MotorComparisonContext';
import { useIsMobileOrTablet } from '@/hooks/use-mobile';
import { ComparisonDrawer } from './ComparisonDrawer';
import { useLocation } from 'react-router-dom';

// Pages where the comparison button should NOT appear
const HIDDEN_ROUTES = ['/login', '/admin', '/dashboard', '/settings', '/financing-application'];

export function ComparisonDesktopButton() {
  const isMobileOrTablet = useIsMobileOrTablet();
  const { comparisonList, removeFromComparison, clearComparison } = useMotorComparison();
  const [showDrawer, setShowDrawer] = useState(false);
  const location = useLocation();
  
  const count = comparisonList.length;
  
  // Hide on mobile/tablet (UnifiedMobileBar handles that), when no motors, or on excluded routes
  const isHiddenRoute = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));
  
  if (isMobileOrTablet || count === 0 || isHiddenRoute) return null;
  
  return (
    <>
      <AnimatePresence>
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => setShowDrawer(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-5 py-3 
                     bg-primary text-primary-foreground rounded-full shadow-xl 
                     hover:bg-primary/90 transition-colors"
        >
          <Scale size={18} />
          <span className="font-medium">Compare ({count})</span>
        </motion.button>
      </AnimatePresence>
      
      <ComparisonDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        motors={comparisonList}
        onRemove={removeFromComparison}
        onClear={clearComparison}
        onSelectMotor={() => {}}
      />
    </>
  );
}
