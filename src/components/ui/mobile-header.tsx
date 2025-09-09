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
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Main Header */}
      <header className={`sticky top-0 z-50 bg-background border-b border-border transition-all duration-300 ${
        scrolled ? 'py-2 shadow-sm' : 'py-4'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left: Harris Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className={`w-auto transition-all duration-300 ${
                  scrolled ? 'h-7' : 'h-9'
                }`}
              />
            </Link>
            
            {/* Center: Title (hidden on scroll) */}
            {title && !scrolled && (
              <div className="hidden sm:block text-center">
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              </div>
            )}
            
            {/* Right: Mercury Logo & Menu */}
            <div className="flex items-center gap-3">
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className={`w-auto transition-all duration-300 ${
                  scrolled ? 'h-7' : 'h-9'
                }`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm sm:hidden">
          <div className="container mx-auto px-4 pt-20">
            <div className="space-y-4">
              <div className="text-center space-y-2 pb-6 border-b border-border">
                <img 
                  src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" 
                  alt="Mercury CSI Award Winner" 
                  className="h-12 w-auto mx-auto"
                />
                <p className="text-sm font-medium text-muted-foreground">Award-Winning Service Team</p>
                <img 
                  src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
                  alt="Mercury Certified Repower Center" 
                  className="h-12 w-auto mx-auto"
                />
                <p className="text-sm font-medium text-muted-foreground">Certified Repower Center</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
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