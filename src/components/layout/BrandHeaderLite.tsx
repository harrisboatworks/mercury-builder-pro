import React from "react";
import { Link } from "react-router-dom";
import mercuryLogo from "@/assets/mercury-logo.png";
import harrisLogo from "@/assets/harris-logo.png";

interface BrandHeaderLiteProps {
  phone?: string;
  onHamburger?: () => void;
}

export default function BrandHeaderLite({
  phone = "1-905-342-2153",
  onHamburger,
}: BrandHeaderLiteProps) {
  const tel = `tel:${phone.replace(/[^0-9+]/g, "")}`;
  
  return (
    <header className="brand-header-lite sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 sm:px-4">
        {/* Left: Harris logo */}
        <Link to="/" className="flex items-center">
          <img src={harrisLogo} alt="Harris Boat Works" className="h-7 max-h-7 w-auto" />
        </Link>

        {/* Middle: center title (mobile) */}
        <div className="min-w-0 text-center">
          <div className="truncate text-sm font-semibold text-foreground">
            Harris Boat Works • Mercury
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            Premier Dealer • Since 1947
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Filters"
            onClick={onHamburger}
            className="rounded-lg border border-border px-2.5 py-1.5 text-sm text-foreground hover:bg-accent lg:hidden"
          >
            ☰
          </button>
          <a
            href={tel}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <span className="hidden sm:inline">Call </span>{phone}
          </a>
        </div>
      </div>

      {/* Trust badges row */}
      <div className="trust-row trust-badges-row border-t border-border bg-muted/50 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-1.5 sm:px-4">
          <div className="flex items-center gap-2">
            <img src={mercuryLogo} alt="Mercury" className="h-4 max-h-4 w-auto sm:h-5 sm:max-h-5" />
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">✓</div>
              <span className="hidden sm:inline">Award-Winning Service</span>
              <span className="sm:hidden">CSI Award</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">★</div>
              <span className="hidden sm:inline">Certified Repower Centre</span>
              <span className="sm:hidden">Certified</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}