import { NavLink, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Quotes", to: "/admin/quotes" },
  { label: "Promotions", to: "/admin/promotions" },
  { label: "Financing", to: "/admin/financing" },
  
  { label: "Inventory", to: "/admin/inventory" },
  { label: "Stock Sync", to: "/admin/stock-sync" },
  { label: "Cron Jobs", to: "/admin/cron-monitor" },
  { label: "Pricing Import", to: "/admin/pricing-import" },
  { label: "Sources", to: "/admin/sources" },
  { label: "Connectors", to: "/admin/connectors" },
  { label: "Security", to: "/admin/security" },
  { label: "Zapier Integration", to: "/admin/zapier" },
  { label: "Email Management", to: "/admin/email" },
  { label: "Payments", to: "/admin/payments" },
  { label: "SMS Alerts", to: "/admin/sms" },
];

export default function AdminNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">Back to site</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
