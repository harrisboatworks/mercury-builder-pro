import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign, Menu, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { cn } from '@/lib/utils';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { useState } from 'react';
import { CartHeader } from '@/components/ui/cart-header';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { CurrentStepIndicator } from './CurrentStepIndicator';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { LuxurySubheader } from '@/components/ui/luxury-subheader';
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
    user,
    signOut
  } = useAuth();
  const {
    state,
    isStepAccessible
  } = useQuote();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  return <div className="min-h-screen bg-white">
      {/* Luxury Header System */}
      <LuxuryHeader />
      
      {/* Luxury Subheader with Progress */}
      {showProgress && (
        <LuxurySubheader 
          title={title || "Quote Builder"}
          showFilters={false}
        />
      )}

      {/* Progress Indicator for Mobile */}
      {showProgress && (
        <div className="md:hidden bg-white border-b border-luxury-hairline py-4">
          <div className="max-w-7xl mx-auto px-6">
            <CurrentStepIndicator
              currentStep={visibleSteps.findIndex(step => step.path === location.pathname) + 1 || 1}
              totalSteps={visibleSteps.length}
              stepTitle={visibleSteps.find(step => step.path === location.pathname)?.title}
            />
          </div>
        </div>
      )}

      {/* Trust Bar */}
      <div className="bg-luxury-stage border-b border-luxury-hairline">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-luxury-gray">
            <div className="flex items-center gap-3">
              <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-6 w-auto" />
              <span className="font-medium">Award-Winning Service Team</span>
            </div>
            <div className="hidden sm:block text-luxury-hairline">•</div>
            <div className="flex items-center gap-3">
              <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-6 w-auto" />
              <span className="font-medium">Certified Repower Center</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        signOut={signOut}
      />
    </div>;
};