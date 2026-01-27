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
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { QuoteProgressStepper } from './QuoteProgressStepper';

interface QuoteLayoutProps {
  children: React.ReactNode;
  showProgress?: boolean;
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}
export const QuoteLayout = ({
  children,
  showProgress = true,
  onSearchClick,
  showSearchIcon = false
}: QuoteLayoutProps) => {
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative">
      {/* Ambient gradient orbs for glassmorphism effect - Desktop only */}
      <div className="hidden md:block fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-100/20 rounded-full blur-3xl" />
      </div>

      {/* Luxury Header System */}
      <LuxuryHeader 
        onSearchClick={onSearchClick}
        showSearchIcon={showSearchIcon}
      />

      {/* Quote Progress Stepper */}
      {showProgress && <QuoteProgressStepper />}

      {/* Main Content */}
      <main className="min-h-screen relative">
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