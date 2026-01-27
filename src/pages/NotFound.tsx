import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Wrench, Phone, Mail, Anchor } from "lucide-react";
import { COMPANY_INFO } from "@/lib/companyInfo";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Track 404 event in GA4
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_not_found', {
        page_path: location.pathname,
        page_location: window.location.href,
      });
    }
  }, [location.pathname]);

  const quickLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/quote/motor-selection", label: "Browse Motors", icon: Wrench },
    { to: "/contact", label: "Contact Us", icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient glassmorphism orbs - Desktop only */}
      <div className="hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Dual logos */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <img 
            src="/assets/harris-logo-black.png" 
            alt="Harris Boat Works" 
            className="h-10 md:h-12 object-contain"
          />
          <div className="h-8 w-px bg-border" />
          <img 
            src="/assets/mercury-logo.png" 
            alt="Mercury Marine" 
            className="h-8 md:h-10 object-contain"
          />
        </div>

        {/* 404 Typography */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Anchor className="w-8 h-8 text-muted-foreground/50" />
            <h1 className="font-playfair text-8xl md:text-9xl font-semibold text-foreground/90 tracking-tight">
              404
            </h1>
            <Anchor className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved to a new location.
          </p>
        </div>

        {/* Quick navigation links */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {quickLinks.map((link) => (
            <Button
              key={link.to}
              asChild
              variant="outline"
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Link to={link.to}>
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Contact info */}
        <div className="pt-6 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Need assistance?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={`tel:${COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '')}`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" />
              {COMPANY_INFO.contact.phone}
            </a>
            <a 
              href={`mailto:${COMPANY_INFO.contact.email}`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Mail className="w-4 h-4" />
              {COMPANY_INFO.contact.email}
            </a>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 pt-8 opacity-70">
          <img 
            src="/lovable-uploads/b2bfcaff-1f2c-4979-980b-ce89cb0f7b69.png" 
            alt="Mercury CSI Award" 
            className="h-12 object-contain hover:opacity-100 transition-opacity"
          />
          <img 
            src="/lovable-uploads/2ddd91dd-dd66-4d8f-ae87-31c0e5eb414b.png" 
            alt="Mercury Certified Repower Center" 
            className="h-12 object-contain hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Family-owned tagline */}
        <p className="text-xs text-muted-foreground pt-4">
          Family-owned since 1947 • Mercury dealer since 1965
        </p>
      </div>
    </div>
  );
};

export default NotFound;
