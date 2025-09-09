import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

interface MobileHeaderProps {
  title?: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
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
          
          {/* Right: Mercury Logo */}
          <div className="flex items-center">
            <img 
              src={mercuryLogo} 
              alt="Mercury Marine" 
              className={`w-auto transition-transform duration-300 ${
                scrolled ? 'h-7 scale-90' : 'h-9'
              }`}
            />
          </div>
        </div>
      </div>
    </header>
  );
}