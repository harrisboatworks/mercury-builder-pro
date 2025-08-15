import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Grid, List, Zap, Fuel, DollarSign, Filter, X, Package } from "lucide-react";

type ViewMode = "grid" | "list";

type FilterState = {
  category: string;
  stockStatus: string;
  priceRange: [number, number];
  hpRange: [number, number];
};

interface MotorFinderWizardProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  resultsCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const MotorFinderWizard: React.FC<MotorFinderWizardProps> = ({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  resultsCount,
  isOpen,
  onToggle,
}) => {
  const [boatLength, setBoatLength] = useState<number>(18);
  const [priority, setPriority] = useState<"speed" | "economy" | "price" | null>(null);

  const recommendedHP = useMemo(() => {
    const len = boatLength;
    if (len <= 12) return 6;
    if (len <= 16) return 40;
    if (len <= 20) return 90;
    if (len <= 24) return 150;
    if (len <= 28) return 200;
    return 225;
  }, [boatLength]);

  const applyBoatSize = (len: number) => {
    const hpRange: [number, number] =
      len <= 12 ? [2.5, 15] :
      len <= 16 ? [15, 60] :
      len <= 20 ? [40, 115] :
      len <= 24 ? [90, 200] :
      [150, 600];

    setFilters({ ...filters, hpRange });
  };

  const filterByPriority = (key: "speed" | "economy" | "price") => {
    setPriority(key);
    if (key === "speed") {
      setFilters({ ...filters, hpRange: [Math.max(recommendedHP, 40), 600] });
    } else if (key === "economy") {
      setFilters({ ...filters, hpRange: [2.5, Math.max(25, recommendedHP)] });
    } else if (key === "price") {
      setFilters({ ...filters, hpRange: [2.5, Math.max(40, recommendedHP)], priceRange: [0, 15000] });
    }
  };

  const resetFilters = () => {
    setPriority(null);
    setBoatLength(18);
    setFilters({ category: "all", stockStatus: "all", priceRange: [0, 50000], hpRange: [2.5, 600] });
  };

  const toggleInStockOnly = (enabled: boolean) => {
    setFilters({ 
      ...filters, 
      stockStatus: enabled ? "In Stock" : "all" 
    });
  };

  return (
    <div className={`${isOpen ? "w-80" : "w-16"} transition-all duration-300 flex-shrink-0`}>
      <Card className="h-fit sticky top-4">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            {isOpen && (
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Motor Finder ({resultsCount})
              </h3>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle} className="ml-auto">
              {isOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </Button>
          </div>

          {isOpen && (
            <>
              {/* View mode (preserve existing behavior) */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* In Stock Only Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="stock-toggle" className="text-sm font-medium cursor-pointer">
                    In Stock Only
                  </Label>
                </div>
                <Switch
                  id="stock-toggle"
                  checked={filters.stockStatus === "In Stock"}
                  onCheckedChange={toggleInStockOnly}
                />
              </div>

              <div className="motor-finder-wizard bg-muted rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4">Let's find your perfect motor:</h3>

                {/* Question 1 */}
                <div className="question-block mb-4">
                  <Label className="text-sm font-medium">How long is your boat?</Label>
                  <div className="mt-3">
                    <Slider
                      value={[boatLength]}
                      onValueChange={(v) => {
                        const len = Math.round(v[0]);
                        setBoatLength(len);
                        applyBoatSize(len);
                      }}
                      min={10}
                      max={30}
                      step={1}
                      className="w-full"
                      aria-label="Boat length in feet"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>10 ft</span>
                      <span className="font-bold text-primary">{boatLength} ft</span>
                      <span>30 ft</span>
                    </div>
                  </div>
                </div>

                {/* Question 2 */}
                <div className="question-block mb-4">
                  <Label className="text-sm font-medium">What's most important?</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      onClick={() => filterByPriority("speed")}
                      variant={priority === "speed" ? "default" : "outline"}
                      className="p-3"
                    >
                      <div className="flex flex-col items-center">
                        <Zap className="w-5 h-5 mb-1" />
                        <span className="text-xs">Speed</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => filterByPriority("economy")}
                      variant={priority === "economy" ? "default" : "outline"}
                      className="p-3"
                    >
                      <div className="flex flex-col items-center">
                        <Fuel className="w-5 h-5 mb-1" />
                        <span className="text-xs">Fuel Economy</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => filterByPriority("price")}
                      variant={priority === "price" ? "default" : "outline"}
                      className="p-3"
                    >
                      <div className="flex flex-col items-center">
                        <DollarSign className="w-5 h-5 mb-1" />
                        <span className="text-xs">Best Price</span>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Smart recommendation */}
                <div className="recommendation-box rounded border border-border bg-accent/20 p-3">
                  <p className="text-sm font-medium text-foreground">
                    ✨ We recommend: {recommendedHP}HP motors
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Perfect for your {boatLength}ft boat
                  </p>
                </div>

                {/* Reset option */}
                <Button onClick={resetFilters} variant="ghost" size="sm" className="text-xs text-muted-foreground mt-2">
                  Show all motors →
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
