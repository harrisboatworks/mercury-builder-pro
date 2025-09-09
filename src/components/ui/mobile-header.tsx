import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

interface MobileHeaderProps {
  title?: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Main Header */}
      <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ${
        scrolled ? 'py-3 shadow-md' : 'py-4'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left: Harris Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className={`w-auto transition-transform duration-300 ${
                  scrolled ? 'h-7 scale-90' : 'h-9'
                }`}
              />
            </Link>
            
            {/* Center: Spacer */}
            <div className="flex-1"></div>
            
            {/* Right: Mercury Logo & Menu */}
            <div className="flex items-center gap-3">
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className={`w-auto transition-transform duration-300 ${
                  scrolled ? 'h-7 scale-90' : 'h-9'
                }`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Open menu"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 pt-20">
            <div className="space-y-6">
              <div className="text-center space-y-4 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-center gap-4">
                  <img 
                    src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" 
                    alt="Mercury CSI Award Winner" 
                    className="h-10 w-auto"
                  />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Award-Winning</p>
                    <p className="text-xs text-gray-600">Service Team</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <img 
                    src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
                    alt="Mercury Certified Repower Center" 
                    className="h-10 w-auto"
                  />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Certified</p>
                    <p className="text-xs text-gray-600">Repower Center</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => setMenuOpen(false)}
              >
                Close Menu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}