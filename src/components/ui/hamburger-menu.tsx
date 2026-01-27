import { X, Sparkles, User, Phone, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  totalXP?: number;
  user?: any;
  loading?: boolean;
  signOut?: () => Promise<any>;
}

export const HamburgerMenu = ({ isOpen, onClose, totalXP, user, loading, signOut }: HamburgerMenuProps) => {
  if (!isOpen) return null;

  return (
    <div id="mobile-menu" className="fixed inset-0 bg-background z-[70]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <img src="/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png" alt="Harris Boat Works" className="h-8" />
          <button 
            id="close-menu"
            onClick={onClose}
            className="p-2 text-foreground hover:bg-muted rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto pb-24">
          {/* XP Display */}
          {totalXP && totalXP > 0 && (
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-accent px-4 py-3 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold text-primary">{totalXP} XP Total</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <a 
              href="tel:+19053422153" 
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Call (905) 342-2153
            </a>
            <Link 
              to="/contact" 
              onClick={onClose}
              className="flex items-center justify-center gap-2 border border-border py-3 rounded-lg font-medium hover:bg-muted transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Request a Quote
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-4">
            <h3 className="font-semibold text-foreground">Navigation</h3>
            <div className="space-y-2">
              <Link to="/" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Engines</Link>
              <Link to="/promotions" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Promotions</Link>
              <Link to="/repower" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Repower</Link>
              <Link to="/compare" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Compare Engines</Link>
              <Link to="/finance-calculator" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Financing</Link>
              <Link to="/blog" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Blog</Link>
              <Link to="/about" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">About Us</Link>
              <Link to="/contact" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Contact Us</Link>
            </div>
          </nav>

          {/* Dealer Credentials */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-semibold text-foreground text-center text-sm">Dealer Credentials</h3>
            <div className="flex items-center justify-center gap-4 py-3 bg-muted/50 rounded-lg">
              <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="CSI Award" className="h-10 object-contain" />
              <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Certified Repower" className="h-10 object-contain" />
            </div>
          </div>

          {/* User Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Account
            </h3>
            {!loading && (
              user ? (
                <div className="space-y-2">
                  <Link to="/my-quotes" onClick={onClose}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      My Quotes
                    </Button>
                  </Link>
                  <Link to="/admin/quotes" onClick={onClose}>
                    <Button variant="secondary" className="w-full">Admin Dashboard</Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={async () => { 
                    if (signOut) await signOut(); 
                    onClose();
                  }}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link to="/auth" onClick={onClose}>
                  <Button className="w-full">Sign In</Button>
                </Link>
              )
            )}
          </div>

          {/* Location Footer */}
          <div className="pt-4 border-t border-border text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Harris Boat Works</p>
            <p>5369 Harris Boat Works Rd, Gores Landing, ON</p>
            <p className="text-xs mt-1 text-primary">Mercury Premier Dealer</p>
          </div>
        </div>
      </div>
    </div>
  );
};
