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
}
export const QuoteLayout = ({
  children,
  showProgress = true
}: QuoteLayoutProps) => {
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return <div className="min-h-screen bg-white">
      {/* Luxury Header System */}
      <LuxuryHeader />

      {/* Quote Progress Stepper */}
      {showProgress && <QuoteProgressStepper />}


      {/* Main Content */}
      <main className="bg-stone-50 min-h-screen">
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