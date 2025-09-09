import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
    <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 transition-all duration-300 ${
      scrolled ? 'py-3' : 'py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left: Harris Logo Placeholder */}
          <Link to="/" className="flex items-center">
            <div 
              className={`bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center transition-transform duration-300 ${
                scrolled ? 'h-7 w-20 scale-90' : 'h-9 w-24'
              }`}
              style={{ borderRadius: '4px' }}
            >
              HARRIS
            </div>
          </Link>
          
          {/* Right: Mercury Logo Placeholder */}
          <div 
            className={`bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center transition-transform duration-300 ${
              scrolled ? 'h-7 w-20 scale-90' : 'h-9 w-24'
            }`}
            style={{ borderRadius: '4px' }}
          >
            MERCURY
          </div>
        </div>
      </div>
    </header>
  );
}