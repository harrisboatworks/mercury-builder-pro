import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';

interface MobileHeaderProps {
  title?: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export default function MobileHeader({ title, onMenuClick, showMenu = false }: MobileHeaderProps) {
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
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-3 ${
      scrolled ? 'shadow-md' : ''
    }`}>
      <div className="container mx-auto px-3">
        <div className="flex items-start justify-between pt-1">
          {/* Left: Menu button or empty space */}
          <div className="flex items-center min-w-[40px]">
            {showMenu ? (
              <button 
                onClick={onMenuClick}
                className="p-1 text-gray-900 hover:text-gray-700 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-[40px]"></div>
            )}
          </div>
          
          {/* Center: Harris Logo */}
          <Link to="/" className="flex items-center -mt-1">
            <img 
              src={harrisLogo} 
              alt="Harris Boat Works" 
              className="w-auto h-6 md:h-8 lg:h-10"
            />
          </Link>
          
          {/* Right: Mercury Logo */}
          <div className="flex items-center min-w-[40px] justify-end -mt-1">
            <img 
              src={mercuryLogo} 
              alt="Mercury Marine" 
              className="w-auto h-4 max-w-[80px] md:h-6 md:max-w-none lg:h-8"
            />
          </div>
        </div>
      </div>
    </header>
  );
}