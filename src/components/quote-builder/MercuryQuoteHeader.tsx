import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, DollarSign, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MercuryQuoteHeaderProps {
  title?: string;
}

export const MercuryQuoteHeader = ({ title }: MercuryQuoteHeaderProps) => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const phoneNumber = "(705) 877-2628";

  return (
    <>
      {/* Main Header */}
      <header className={cn(
        "bg-background border-b border-border/30 transition-all duration-300 animate-fade-in",
        isScrolled ? "shadow-sm" : "",
        isMobile && isScrolled ? "py-3" : "py-5"
      )}>
        <div className="container mx-auto px-4">
          {/* Desktop Layout */}
          {!isMobile ? (
            <div className="flex items-center justify-between">
              {/* Left: Harris Logo with Heritage Badge */}
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <img 
                      src={harrisLogo} 
                      alt="Harris Boat Works" 
                      className="h-10 w-auto transition-opacity group-hover:opacity-90" 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-foreground text-background text-xs px-1.5 py-0.5 rounded-sm font-medium">
                      EST. 1947
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border/40"></div>
                  <img 
                    src={mercuryLogo} 
                    alt="Mercury Marine" 
                    className="h-8 w-auto transition-opacity group-hover:opacity-90" 
                  />
                </Link>
              </div>

              {/* Center: Mercury Quote Centre Branding */}
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-semibold tracking-wide text-foreground">
                  MERCURY QUOTE CENTRE
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Your Trusted Dealer Since 1965
                </p>
              </div>

              {/* Right: Phone Number */}
              <div className="flex items-center space-x-4">
                <a 
                  href={`tel:${phoneNumber}`}
                  className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors group"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium group-hover:underline">
                    Call {phoneNumber}
                  </span>
                </a>
              </div>
            </div>
          ) : (
            /* Mobile Layout */
            <div className="space-y-4">
              {/* Logo Row */}
              <div className="flex items-center justify-center space-x-6">
                <Link to="/" className="flex items-center space-x-4">
                  <div className="relative">
                    <img 
                      src={harrisLogo} 
                      alt="Harris Boat Works" 
                      className="h-8 w-auto" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-foreground text-background text-xs px-1 py-0.5 rounded-sm font-medium text-[10px]">
                      EST. 1947
                    </div>
                  </div>
                  <div className="h-6 w-px bg-border/40"></div>
                  <img 
                    src={mercuryLogo} 
                    alt="Mercury Marine" 
                    className="h-6 w-auto" 
                  />
                </Link>
              </div>

              {/* Brand Title */}
              <div className="text-center space-y-1">
                <h1 className="text-lg font-semibold tracking-wide text-foreground">
                  MERCURY QUOTE CENTRE
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Your Trusted Dealer Since 1965
                </p>
              </div>

              {/* Call to Action Button */}
              <a 
                href={`tel:${phoneNumber}`}
                className="block w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg px-4 py-3 text-center transition-colors"
                style={{ minHeight: '44px' }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Call for Expert Advice: {phoneNumber}
                  </span>
                </div>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Trust Bar - Integrated Mercury Certifications */}
      <div className="bg-muted/20 border-b border-border/20">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-3 md:gap-6 text-xs md:text-sm">
            <img 
              src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" 
              alt="Mercury CSI Award Winner" 
              loading="lazy" 
              className="h-6 md:h-8 w-auto" 
            />
            <span className="font-medium text-foreground/70">Award-Winning Service</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <img 
              src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
              alt="Mercury Certified Repower Center" 
              loading="lazy" 
              className="h-6 md:h-8 w-auto" 
            />
            <span className="font-medium text-foreground/70">Certified Repower Center</span>
          </div>
        </div>
      </div>

      {/* Admin Panel - Collapsible */}
      {user && (
        <div className="bg-secondary/30 border-b border-border/20">
          <div className="container mx-auto px-4">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="flex items-center space-x-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="w-3 h-3" />
              <span>Admin Panel ({user.email})</span>
              {showAdminPanel ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            
            {showAdminPanel && (
              <div className="pb-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
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
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};