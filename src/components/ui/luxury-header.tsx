import { useState, useEffect } from 'react';
import { User, LogOut, Menu, Bell, Settings, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { HamburgerMenu } from './hamburger-menu';
import { COMPANY_INFO } from '@/lib/companyInfo';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LuxuryHeaderProps {
  onSearchFocus?: () => void;
  showUtilityBar?: boolean;
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}

export function LuxuryHeader({ 
  onSearchFocus, 
  showUtilityBar = true,
  onSearchClick,
  showSearchIcon = false
}: LuxuryHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Utility Bar */}
      {showUtilityBar && (
        <div className="hidden md:block h-8 bg-white border-b border-luxury-hairline">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
            <p className="text-xs text-luxury-gray uppercase tracking-wide font-medium">
              Mercury Premier Dealer • Award-Winning Service Team
            </p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header 
        className={`sticky top-0 z-50 h-14 sm:h-16 md:h-[72px] transition-all duration-300 bg-white border-b border-luxury-hairline ${
          isScrolled 
            ? 'shadow-sm backdrop-blur-md opacity-100' 
            : 'opacity-95'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-full">
          <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center h-full gap-2 md:gap-6 min-w-0">
            
            {/* Left: Mobile Menu Button */}
            <button
              className="md:hidden p-1.5 text-luxury-ink hover:text-luxury-gray transition-colors justify-self-start"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Left: Logos (Desktop Only) */}
            <Link to="/" className="hidden md:flex items-center gap-2 lg:gap-4 justify-self-start keep-flex">
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className="h-7 md:h-8 lg:h-9 transition-all duration-300"
              />
              <div className="w-px h-5 md:h-8 bg-luxury-hairline" />
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className="h-7 md:h-8 lg:h-9 transition-all duration-300"
              />
            </Link>

            {/* Center: Logos (Mobile Only) */}
            <Link to="/" className="flex md:hidden items-center justify-center gap-1.5">
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className="h-6 sm:h-7 transition-all duration-300"
              />
              <div className="w-px h-4 sm:h-5 bg-luxury-hairline" />
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className="h-6 sm:h-7 transition-all duration-300"
              />
            </Link>

            {/* Center: Trust Badges - Desktop Only */}
            <div className="hidden lg:flex items-center justify-center space-x-6 text-base text-luxury-gray max-w-full overflow-hidden keep-flex">
              <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer transition-all duration-300 hover:scale-105">
                <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-6 md:h-8 lg:h-10 w-auto transition-all duration-300 group-hover:drop-shadow-lg" />
                <span className="hidden lg:inline font-medium transition-colors duration-300 group-hover:text-luxury-ink">Award-Winning Service</span>
              </div>
              <div className="hidden lg:block text-luxury-hairline">•</div>
              <div className="flex items-center gap-2 lg:gap-3 group cursor-pointer transition-all duration-300 hover:scale-105">
                <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-6 md:h-8 lg:h-10 w-auto transition-all duration-300 group-hover:drop-shadow-lg" />
                <span className="hidden lg:inline font-medium transition-colors duration-300 group-hover:text-luxury-ink">Certified Repower Center</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end gap-1 md:gap-2 min-w-[40px] keep-flex">
              {/* Mobile User Icon with Dropdown */}
              <div className="md:hidden">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative p-1.5 text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage transition-colors"
                      >
                        <User className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200">
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="ml-auto text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="p-1.5 text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage transition-colors"
                    title="Sign In"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* User Menu (Desktop) */}
              <div className="hidden md:flex items-center gap-2 keep-flex">
                {user ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="p-2 text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
                      title="View Dashboard"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => signOut()}
                      className="p-2 text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
                      title="Sign out"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="px-3 py-2 text-sm text-luxury-ink hover:text-luxury-gray hover:bg-luxury-stage"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation Bar - Now Sticky */}
      <nav className="hidden md:block sticky top-[72px] z-40 bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-12">
            {/* Spacer for balance */}
            <div className="w-10" />
            
            {/* Navigation Links - Centered */}
            <div className="flex items-center justify-center gap-8">
              <Link 
                to="/" 
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname === '/' || location.pathname === '/quote/motors' 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Engines
              </Link>
              <Link 
                to="/accessories" 
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname === '/accessories' 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Accessories
              </Link>
              <Link 
                to="/promotions" 
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname === '/promotions' 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Promotions
              </Link>
              <Link 
                to="/repower" 
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname === '/repower' 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Repower
              </Link>
              <Link 
                to="/finance-calculator" 
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname === '/finance-calculator' 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Financing
              </Link>
              <Link 
                to="/about" 
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname === '/about' 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                About
              </Link>
              <Link 
                to="/blog" 
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname.startsWith('/blog') 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Blog
              </Link>
              <Link 
                to="/contact"
                className={`relative text-sm font-medium transition-all duration-300 hover:scale-105 after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ${
                  location.pathname === '/contact' 
                    ? 'text-foreground after:scale-x-100' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Contact
              </Link>
            </div>
            
            {/* Search Icon - Only show when prop is true */}
            {showSearchIcon && onSearchClick ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSearchClick}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Search motors (Press /)"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            ) : (
              <div className="w-10" />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <HamburgerMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        user={user}
        signOut={signOut}
      />
    </>
  );
}
