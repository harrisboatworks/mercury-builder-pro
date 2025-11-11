import { NavLink, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

const navItems = [
  { label: "Quotes", to: "/admin/quotes" },
  { label: "Promotions", to: "/admin/promotions" },
  { label: "Financing", to: "/admin/financing" },
  { label: "Financing Apps", to: "/admin/financing-applications" },
  
  { label: "Inventory", to: "/admin/inventory" },
  { label: "Stock Sync", to: "/admin/stock-sync" },
  { label: "Cron Jobs", to: "/admin/cron-monitor" },
  { label: "Pricing Import", to: "/admin/pricing-import" },
  { label: "Sources", to: "/admin/sources" },
  { label: "Connectors", to: "/admin/connectors" },
  { label: "Security", to: "/admin/security" },
  { label: "SIN Encryption", to: "/admin/sin-encryption-test" },
  { label: "Zapier Integration", to: "/admin/zapier" },
  { label: "Email Management", to: "/admin/email" },
  { label: "Payments", to: "/admin/payments" },
  { label: "SMS Alerts", to: "/admin/sms" },
];

export default function AdminNav() {
  // Query for pending financing applications count
  const { data: pendingCount = 0, refetch } = useQuery({
    queryKey: ['pending-financing-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('financing_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription for financing applications
  useEffect(() => {
    const channel = supabase
      .channel('financing-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financing_applications',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

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
              <span className="flex items-center gap-1.5">
                {item.label}
                {item.label === "Financing Apps" && pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </span>
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
