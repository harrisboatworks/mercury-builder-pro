import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign, Menu } from 'lucide-react';
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
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Hamburger Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Link to="/" className="flex items-center space-x-4">
                <img src={harrisLogo} alt="Harris Boat Works" className="h-6 w-auto sm:h-8 md:h-10 lg:h-12" />
                <div className="h-4 sm:h-6 md:h-8 lg:h-10 w-px bg-border"></div>
                <img src={mercuryLogo} alt="Mercury Marine" className="h-4 w-auto sm:h-6 md:h-8 lg:h-10" />
              </Link>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-bold text-foreground">
                  {title || 'Mercury Outboard Quote Builder'}
                </h1>
                <p className="text-muted-foreground">Mercury Marine Premier Dealer</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              <CartHeader />
              <div className="flex-shrink-0">
                <ChatWidget />
              </div>
              {user ? <>
                  <div className="hidden md:flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <Button variant="secondary" size="sm" className="hidden md:inline-flex" asChild>
                      <Link to="/admin/promotions">Promotions</Link>
                    </Button>
                    <Button variant="secondary" size="sm" className="hidden md:inline-flex" asChild>
                      <Link to="/admin/financing">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Financing
                      </Link>
                    </Button>
                    <Button variant="secondary" size="sm" className="hidden md:inline-flex" asChild>
                      <Link to="/admin/quotes">Quotes</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Sign Out</span>
                    </Button>
                  </div>
                </> : <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">
                    <User className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Sign In</span>
                  </Link>
                </Button>}
            </div>
          </div>
        </div>
      </header>


      {/* Trust Bar */}
      <div className="bg-muted/40 border-b border-border mt-[88px]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-4 md:gap-6">
          <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-8 w-auto" />
          <span className="text-sm font-medium text-foreground/80">Award-Winning Service Team</span>
          <span className="text-muted-foreground">|</span>
          <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-8 w-auto" />
          <span className="text-sm font-medium text-foreground/80">Certified Repower Center</span>
        </div>
      </div>


      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pt-16">
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