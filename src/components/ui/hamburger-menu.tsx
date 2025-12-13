import { X, Sparkles, User, Star, MessageCircle } from "lucide-react";
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
    <div id="mobile-menu" className="fixed inset-0 bg-background z-50">
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
        <div className="flex-1 p-4 space-y-6">
          {/* XP Display */}
          {totalXP && totalXP > 0 && (
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-accent px-4 py-3 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-bold text-primary">{totalXP} XP Total</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-4">
            <h3 className="font-semibold text-foreground">Navigation</h3>
            <div className="space-y-2">
              <Link to="/" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Engines</Link>
              <Link to="/accessories" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Accessories</Link>
              <Link to="/promotions" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Promotions</Link>
              <Link to="/finance-calculator" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Financing</Link>
              <Link to="/contact" onClick={onClose} className="block py-2 text-muted-foreground hover:text-foreground">Contact Us</Link>
            </div>
          </nav>

          {/* Reviews & Testimonials */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground">Reviews & Social Proof</h3>
            <div className="space-y-2">
              <button className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground w-full text-left">
                <Star className="w-4 h-4 text-yellow-500" />
                Customer Reviews (4.6/5 ⭐)
              </button>
              <button className="flex items-center gap-2 py-2 text-muted-foreground hover:text-foreground w-full text-left">
                <MessageCircle className="w-4 h-4" />
                Customer Testimonials
              </button>
            </div>
          </div>

          {/* User Section */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Account
            </h3>
            {!loading && (
              user ? (
                <div className="space-y-2">
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
                  <Button className="w-full">Admin Sign In</Button>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};