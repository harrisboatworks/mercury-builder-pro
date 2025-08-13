import { useState } from "react";
import { Activity, Award, ShieldCheck, Sparkles, Target, Filter } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ActivityTicker } from "@/components/quote-builder/ActivityTicker";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import mercuryLogo from "@/assets/mercury-logo.png";

interface AppSidebarProps {
  harrisLogoUrl?: string;
}

export function AppSidebar({ harrisLogoUrl }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const trustBadges = [
    {
      icon: ShieldCheck,
      title: "Platinum Mercury Dealer",
      subtitle: "Authorized Sales & Service",
      description: "Top-tier Mercury certification with factory-trained technicians"
    },
    {
      icon: Award,
      title: "CSI Excellence Award",
      subtitle: "Customer Satisfaction Leader",
      description: "Recognized for outstanding customer service and support"
    },
    {
      icon: Sparkles,
      title: "Family Owned Since 1947",
      subtitle: "75+ Years Experience",
      description: "Three generations of marine expertise serving Rice Lake area"
    }
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-80"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent className="space-y-0">
        {/* Live Activity Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {!collapsed && "Live Activity"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {!collapsed && (
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <ActivityTicker />
              </Card>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Trust & Certifications Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {!collapsed && "Certifications"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-3">
            {/* Mercury Logo */}
            <div className="flex items-center justify-center py-2">
              <img 
                src={mercuryLogo} 
                alt="Mercury Marine" 
                className={`${collapsed ? 'h-8' : 'h-12'} w-auto transition-all duration-200`}
              />
            </div>

            {/* Harris Logo */}
            {harrisLogoUrl && (
              <div className="flex items-center justify-center py-2">
                <img 
                  src={harrisLogoUrl} 
                  alt="Harris Boat Works" 
                  className={`${collapsed ? 'h-8' : 'h-12'} w-auto transition-all duration-200`}
                />
              </div>
            )}

            {!collapsed && (
              <div className="space-y-3">
                {trustBadges.map((badge, index) => (
                  <Card key={index} className="p-3 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start gap-3">
                      <badge.icon className="h-5 w-5 text-primary mt-1 shrink-0" />
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{badge.title}</div>
                        <div className="text-xs text-muted-foreground">{badge.subtitle}</div>
                        <div className="text-xs text-muted-foreground leading-tight">{badge.description}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Quick Stats Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {!collapsed && "Quick Stats"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {!collapsed && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Motors Available:</span>
                  <Badge variant="secondary">200+</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">In Stock:</span>
                  <Badge variant="default">150+</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Price Range:</span>
                  <span className="text-xs font-medium">$1K - $45K</span>
                </div>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}