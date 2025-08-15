import { X, Sparkles, User } from "lucide-react";
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
    <div id="mobile-menu" className="fixed inset-0 bg-white z-50 lg:hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <img src="/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png" alt="Harris Boat Works" className="h-8" />
          <button 
            id="close-menu"
            onClick={onClose}
            className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-6">
          {/* XP Display */}
          {totalXP && totalXP > 0 && (
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-3 rounded-lg">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-orange-800">{totalXP} XP Total</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="space-y-4">
            <h3 className="font-semibold text-gray-900">Navigation</h3>
            <div className="space-y-2">
              <a href="#engines" className="block py-2 text-gray-700 hover:text-gray-900">Engines</a>
              <a href="#accessories" className="block py-2 text-gray-700 hover:text-gray-900">Accessories</a>
              <a href="#financing" className="block py-2 text-gray-700 hover:text-gray-900">Financing</a>
              <a href="#contact" className="block py-2 text-gray-700 hover:text-gray-900">Contact</a>
            </div>
          </nav>

          {/* User Section */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
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