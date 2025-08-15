import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, User, Settings, HelpCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

interface MobileNavProps {
  currentStep?: number;
  totalSteps?: number;
  stepLabel?: string;
}

export const MobileNav = ({ currentStep, totalSteps, stepLabel }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const closeNav = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-9 w-9 p-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-lg font-semibold">Mercury Quote Builder</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeNav}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Info */}
          {currentStep && totalSteps && (
            <div className="py-4 border-b">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{currentStep} of {totalSteps}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
                {stepLabel && (
                  <p className="text-sm text-muted-foreground">{stepLabel}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 py-4">
            <div className="space-y-2">
              <Link to="/" onClick={closeNav}>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Quote Builder
                </Button>
              </Link>
              
              {user ? (
                <>
                  <Link to="/admin/quotes" onClick={closeNav}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={async () => {
                      await signOut();
                      closeNav();
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={closeNav}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    Admin Sign In
                  </Button>
                </Link>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={closeNav}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={closeNav}>
                <Phone className="mr-2 h-4 w-4" />
                Call (250) 542-2628
              </Button>
            </div>
            <div className="mt-4 text-xs text-center text-muted-foreground">
              Harris Boatworks<br />
              Mercury Marine Dealer
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};