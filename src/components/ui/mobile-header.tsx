import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import harrisLogo from '@/assets/harris-logo.png';
import mercuryLogo from '@/assets/mercury-logo.png';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title?: string;
}

export const MobileHeader = ({ title }: MobileHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [trustMenuOpen, setTrustMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Main Header */}
      <header className={cn(
        'sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm transition-all duration-300',
        scrolled ? 'border-border shadow-sm' : 'border-transparent'
      )}>
        <div className="container mx-auto px-4">
          <div className={cn(
            'flex items-center justify-between transition-all duration-300',
            scrolled ? 'py-2' : 'py-4'
          )}>
            {/* Left: Harris Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src={harrisLogo} 
                  alt="Harris Boat Works" 
                  className={cn(
                    'w-auto transition-all duration-300',
                    scrolled ? 'h-7' : 'h-9'
                  )}
                />
              </Link>
              {title && (
                <div className="ml-4 hidden sm:block">
                  <h1 className={cn(
                    'font-bold text-foreground transition-all duration-300',
                    scrolled ? 'text-lg' : 'text-xl'
                  )}>
                    {title}
                  </h1>
                </div>
              )}
            </div>

            {/* Center: Mobile Title */}
            {title && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:hidden">
                <h1 className={cn(
                  'font-bold text-foreground transition-all duration-300',
                  scrolled ? 'text-sm' : 'text-base'
                )}>
                  Select Motor
                </h1>
              </div>
            )}

            {/* Right: Mercury Logo + Trust Menu */}
            <div className="flex items-center gap-3">
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className={cn(
                  'w-auto transition-all duration-300',
                  scrolled ? 'h-7' : 'h-9'
                )}
              />
              
              {/* Trust Menu Button */}
              <Sheet open={trustMenuOpen} onOpenChange={setTrustMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Our Credentials</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <img 
                        src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" 
                        alt="Mercury CSI Award Winner badge" 
                        className="h-12 w-auto"
                      />
                      <div>
                        <h3 className="font-medium">Award-Winning Service</h3>
                        <p className="text-sm text-muted-foreground">
                          Mercury CSI Award Winner for outstanding customer service
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <img 
                        src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" 
                        alt="Mercury Certified Repower Center badge" 
                        className="h-12 w-auto"
                      />
                      <div>
                        <h3 className="font-medium">Certified Repower Center</h3>
                        <p className="text-sm text-muted-foreground">
                          Official Mercury Marine authorized repower specialist
                        </p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};