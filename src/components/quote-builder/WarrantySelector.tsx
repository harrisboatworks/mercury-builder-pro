import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, Clock, Star } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { supabase } from '@/integrations/supabase/client';

interface WarrantyPricing {
  hp_min: number;
  hp_max: number;
  year_1_price: number;
  year_2_price: number;
  year_3_price: number;
  year_4_price: number;
  year_5_price: number;
}

interface WarrantyOption {
  years: number;
  price: number;
  label: string;
  description: string;
}

export function WarrantySelector() {
  const { state, dispatch } = useQuote();
  const { promo } = useActiveFinancingPromo();
  const [warrantyPricing, setWarrantyPricing] = useState<WarrantyPricing | null>(null);
  const [loading, setLoading] = useState(true);

  const motor = state.motor;
  if (!motor) return null;

  const motorHP = typeof motor.hp === 'string' ? parseFloat(motor.hp) : motor.hp;

  // Calculate current warranty coverage
  const standardYears = 3;
  // Check if current promo includes warranty extension (Mercury Get 5 Promo adds 2 years)
  const promoYears = promo && promo.name.toLowerCase().includes('mercury get 5') ? 2 : 0;
  const currentTotalYears = standardYears + promoYears;
  const maxTotalYears = 8;
  const availableYears = maxTotalYears - currentTotalYears;

  useEffect(() => {
    async function fetchWarrantyPricing() {
      try {
        const { data, error } = await supabase
          .from('warranty_pricing')
          .select('*')
          .lte('hp_min', motorHP)
          .gte('hp_max', motorHP)
          .single();

        if (error) {
          console.error('Error fetching warranty pricing:', error);
          return;
        }

        setWarrantyPricing(data);
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWarrantyPricing();
  }, [motorHP]);

  if (loading || !warrantyPricing) {
    return (
      <Card className="border-accent">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Loading warranty options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No additional warranty available if already at maximum
  if (availableYears <= 0) {
    return (
      <Card className="border-accent">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Mercury Warranty Coverage</h3>
              <p className="text-sm text-muted-foreground">Maximum coverage already included</p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="font-medium">{maxTotalYears} years total coverage</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {standardYears} years standard + {promoYears} years promotional coverage
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build warranty options based on available years
  const warrantyOptions: WarrantyOption[] = [];
  for (let i = 1; i <= Math.min(availableYears, 5); i++) {
    const priceKey = `year_${i}_price` as keyof WarrantyPricing;
    const price = warrantyPricing[priceKey] as number;
    
    warrantyOptions.push({
      years: i,
      price,
      label: `+${i} year${i > 1 ? 's' : ''}`,
      description: `${currentTotalYears + i} years total coverage`
    });
  }

  const handleWarrantySelect = (option: WarrantyOption | null) => {
    if (option) {
      dispatch({
        type: 'SET_WARRANTY_CONFIG',
        payload: {
          extendedYears: option.years,
          warrantyPrice: option.price,
          totalYears: currentTotalYears + option.years
        }
      });
    } else {
      dispatch({
        type: 'SET_WARRANTY_CONFIG',
        payload: {
          extendedYears: 0,
          warrantyPrice: 0,
          totalYears: currentTotalYears
        }
      });
    }
  };

  return (
    <Card className="border-accent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Mercury Platinum Extended Warranty</CardTitle>
            <p className="text-sm text-muted-foreground">
              Factory-backed parts & labour at authorized Mercury dealers
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Coverage Display */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Current Coverage Included
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Standard Warranty:</span>
              <div className="font-medium">{standardYears} years</div>
            </div>
            {promoYears > 0 && (
              <div>
                <span className="text-muted-foreground">Promotional Bonus:</span>
                <div className="font-medium flex items-center gap-1">
                  +{promoYears} years <Badge variant="secondary" className="text-xs">FREE</Badge>
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Current Coverage:</span>
              <span className="text-lg font-bold text-primary">{currentTotalYears} years</span>
            </div>
          </div>
        </div>

        {/* Extended Warranty Options */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Add Extended Coverage (Optional)
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            {/* No Extended Warranty Option */}
            <Button
              variant={!state.warrantyConfig || state.warrantyConfig.extendedYears === 0 ? "default" : "outline"}
              className="h-auto p-4 text-left justify-start"
              onClick={() => handleWarrantySelect(null)}
            >
              <div>
                <div className="font-medium">No Additional Coverage</div>
                <div className="text-sm opacity-75">{currentTotalYears} years total (current coverage only)</div>
              </div>
            </Button>

            {/* Extended Warranty Options */}
            {warrantyOptions.map((option) => (
              <Button
                key={option.years}
                variant={state.warrantyConfig?.extendedYears === option.years ? "default" : "outline"}
                className="h-auto p-4 text-left justify-between"
                onClick={() => handleWarrantySelect(option)}
              >
                <div>
                  <div className="font-medium">{option.label} Extended Coverage</div>
                  <div className="text-sm opacity-75">{option.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${option.price.toLocaleString()}</div>
                  <div className="text-xs opacity-75">+ HST</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Warranty Benefits */}
        <div className="bg-primary/5 rounded-lg p-4">
          <h5 className="font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Platinum Coverage Benefits
          </h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Factory-backed parts & labour</li>
            <li>• Highest coverage tier available</li>
            <li>• Transferable to next owner (adds resale value)</li>
            <li>• No surprise labour rates - Mercury book time</li>
            <li>• Coverage at all authorized Mercury dealers</li>
          </ul>
        </div>

        {state.warrantyConfig && state.warrantyConfig.extendedYears > 0 && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <h5 className="font-medium text-accent-foreground mb-2">Selected Coverage Summary</h5>
            <div className="flex items-center justify-between">
              <span>Total Warranty Coverage:</span>
              <span className="font-bold text-lg text-accent-foreground">
                {state.warrantyConfig.totalYears} years
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Extended Coverage Cost:</span>
              <span className="font-medium">
                ${state.warrantyConfig.warrantyPrice.toLocaleString()} + HST
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}