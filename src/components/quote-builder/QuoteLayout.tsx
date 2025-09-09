import { useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { MercuryQuoteHeader } from './MercuryQuoteHeader';

interface QuoteLayoutProps {
  children: React.ReactNode;
  showProgress?: boolean;
  title?: string;
}

const steps = [{
  id: 1,
  title: "Select Motor",
  path: "/quote/motor-selection"
}, {
  id: 2,
  title: "Purchase Path",
  path: "/quote/purchase-path"
}, {
  id: 3,
  title: "Boat Info",
  path: "/quote/boat-info"
}, {
  id: 4,
  title: "Trade-In",
  path: "/quote/trade-in"
}, {
  id: 5,
  title: "Installation",
  path: "/quote/installation"
}, {
  id: 6,
  title: "Quote",
  path: "/quote/summary"
}, {
  id: 7,
  title: "Schedule",
  path: "/quote/schedule"
}];

export const QuoteLayout = ({
  children,
  showProgress = true,
  title
}: QuoteLayoutProps) => {
  const {
    state,
    isStepAccessible
  } = useQuote();
  const location = useLocation();

  // Determine current step based on path
  const getCurrentStep = () => {
    const currentPath = location.pathname;
    const step = steps.find(s => s.path === currentPath);
    return step?.id || 1;
  };
  const currentStep = getCurrentStep();

  // Filter steps based on purchase path
  const getVisibleSteps = () => {
    if (!state.purchasePath) return steps.slice(0, 2);
    if (state.purchasePath === 'loose') {
      // For tiller motors, skip boat info and installation
      const isSmallTillerMotor = state.motor && state.motor.hp <= 9.9 && state.motor.type?.toLowerCase().includes('tiller');
      if (isSmallTillerMotor) {
        return [steps[0],
        // Motor selection
        steps[1],
        // Purchase path
        {
          ...steps[2],
          title: "Fuel Tank",
          path: "/quote/fuel-tank"
        },
        // Replace boat info with fuel tank
        steps[3],
        // Trade-in
        steps[5] // Quote (skip installation)
        ];
      } else {
        return [steps[0],
        // Motor selection
        steps[1],
        // Purchase path
        steps[3],
        // Trade-in
        steps[5] // Quote
        ];
      }
    } else {
      return steps; // Show all steps for installed path
    }
  };
  const visibleSteps = getVisibleSteps();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/50">
      <MercuryQuoteHeader title={title} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};