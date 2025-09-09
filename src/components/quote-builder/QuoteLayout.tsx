import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import harrisLogo from '@/assets/harris-logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { cn } from '@/lib/utils';
import { QuoteStatusHeader } from './QuoteStatusHeader';
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
  return <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/50">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center">
                <img src={harrisLogo} alt="Harris Boat Works" className="h-12 w-auto" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {title || 'Mercury Outboard Quote Builder'}
                </h1>
                <p className="text-muted-foreground">Mercury Marine Premier Dealer</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? <>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/admin/promotions">Promotions</Link>
                  </Button>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/admin/financing">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Financing
                    </Link>
                  </Button>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/admin/quotes">Quotes</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </> : <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </Button>}
            </div>
          </div>
        </div>
      </header>

      {/* Quote Status Header - hide when sticky bar is active */}
      {!state.uiFlags?.useStickyQuoteBar && <QuoteStatusHeader />}

      {/* Trust Bar */}
      <div className="bg-muted/40 border-b border-border">
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-4 md:gap-6">
          <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-8 w-auto" />
          <span className="text-sm font-medium text-foreground/80">Award-Winning Service Team</span>
          <span className="text-muted-foreground">|</span>
          <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-8 w-auto" />
          <span className="text-sm font-medium text-foreground/80">Certified Repower Center</span>
        </div>
      </div>

      {/* Progress Indicator */}
      {showProgress && <div className="bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center space-x-8">
              {visibleSteps.map((step, index) => {
            const isCompleted = state.completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isAccessible = isStepAccessible(step.id);
            const handleStepClick = (e: React.MouseEvent) => {
              if (!isAccessible) {
                e.preventDefault();
                return;
              }
              navigate(step.path);
            };
            return <div key={step.id} className="flex items-center">
                    <button onClick={handleStepClick} disabled={!isAccessible} className={cn("flex items-center space-x-3 transition-all hover:scale-105", isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50", isAccessible && "hover:opacity-80")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all", isCompleted ? "bg-primary text-primary-foreground shadow-md" : isCurrent ? "bg-primary/20 text-primary border-2 border-primary shadow-sm" : isAccessible ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-muted text-muted-foreground")}>
                        {isCompleted ? '✓' : step.id}
                      </div>
                      <div className="hidden md:block">
                        <div className={cn("text-sm font-medium transition-colors", isCurrent ? "text-primary" : isAccessible ? "text-foreground hover:text-primary" : "text-muted-foreground")}>
                          {step.title}
                        </div>
                        {isCompleted && <div className="text-xs text-muted-foreground">
                            Completed
                          </div>}
                      </div>
                    </button>
                    {index < visibleSteps.length - 1 && <div className={cn("hidden md:block w-12 h-px mx-4 transition-colors", isCompleted ? "bg-primary/30" : "bg-border")} />}
                  </div>;
          })}
            </div>
          </div>
        </div>}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>;
};