import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useMotorOptions, type MotorOption } from '@/hooks/useMotorOptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, PackagePlus, CheckCircle2 } from 'lucide-react';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { toast } from 'sonner';

export default function OptionsPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useQuote();
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());
  
  const { data: categorizedOptions, isLoading } = useMotorOptions(
    state.motor?.id,
    state.motor
  );

  // Initialize with required options and previously selected options
  useEffect(() => {
    if (categorizedOptions) {
      const initialIds = new Set<string>();
      
      // Always include required options
      categorizedOptions.required.forEach(opt => initialIds.add(opt.id));
      
      // Include previously selected options
      state.selectedOptions?.forEach(opt => initialIds.add(opt.optionId));
      
      // Include recommended options by default
      categorizedOptions.recommended.forEach(opt => initialIds.add(opt.id));
      
      setLocalSelectedIds(initialIds);
    }
  }, [categorizedOptions, state.selectedOptions]);

  const toggleOption = (option: MotorOption) => {
    // Cannot deselect required options
    if (option.assignment_type === 'required' && localSelectedIds.has(option.id)) {
      toast.error('This option is required and cannot be removed');
      return;
    }

    setLocalSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(option.id)) {
        newSet.delete(option.id);
      } else {
        newSet.add(option.id);
      }
      return newSet;
    });
  };

  const handleContinue = () => {
    if (!categorizedOptions) return;

    // Build selected options from all categories
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];

    const selectedOptions = allOptions
      .filter(opt => localSelectedIds.has(opt.id))
      .map(opt => ({
        optionId: opt.id,
        name: opt.name,
        price: opt.is_included ? 0 : (opt.price_override ?? opt.base_price),
        category: opt.category,
        assignmentType: opt.assignment_type,
        isIncluded: opt.is_included,
      }));

    dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
    dispatch({ type: 'COMPLETE_STEP', payload: 2 });
    
    // Navigate to purchase path
    navigate('/quote/purchase-path');
  };

  const handleBack = () => {
    navigate('/quote/motor-selection');
  };

  const calculateTotal = () => {
    if (!categorizedOptions) return 0;
    
    const allOptions = [
      ...categorizedOptions.required,
      ...categorizedOptions.recommended,
      ...categorizedOptions.available,
    ];

    return allOptions
      .filter(opt => localSelectedIds.has(opt.id))
      .reduce((sum, opt) => {
        const price = opt.is_included ? 0 : (opt.price_override ?? opt.base_price);
        return sum + price;
      }, 0);
  };

  if (!state.motor) {
    navigate('/quote/motor-selection');
    return null;
  }

  if (isLoading) {
    return (
      <>
        <LuxuryHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Loading motor options...</div>
        </div>
      </>
    );
  }

  const hasOptions = categorizedOptions && (
    categorizedOptions.required.length > 0 ||
    categorizedOptions.recommended.length > 0 ||
    categorizedOptions.available.length > 0
  );

  // If no options available, skip to purchase path
  if (!hasOptions) {
    dispatch({ type: 'SET_SELECTED_OPTIONS', payload: [] });
    navigate('/quote/purchase-path');
    return null;
  }

  const optionsTotal = calculateTotal();

  return (
    <>
      <LuxuryHeader />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customize Your Motor Package</h1>
          <p className="text-muted-foreground">
            Select additional options and accessories for your {state.motor.model}
          </p>
        </div>

        {/* Required Options */}
        {categorizedOptions?.required.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Required Items</h2>
              <Badge variant="destructive">Must Include</Badge>
            </div>
            <div className="space-y-3">
              {categorizedOptions.required.map(option => (
                <OptionCard
                  key={option.id}
                  option={option}
                  isSelected={true}
                  onToggle={() => {}}
                  disabled={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Options */}
        {categorizedOptions?.recommended.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Recommended Add-Ons</h2>
              <Badge>Pre-selected</Badge>
            </div>
            <div className="space-y-3">
              {categorizedOptions.recommended.map(option => (
                <OptionCard
                  key={option.id}
                  option={option}
                  isSelected={localSelectedIds.has(option.id)}
                  onToggle={() => toggleOption(option)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Options */}
        {categorizedOptions?.available.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Available Options</h2>
            <div className="space-y-3">
              {categorizedOptions.available.map(option => (
                <OptionCard
                  key={option.id}
                  option={option}
                  isSelected={localSelectedIds.has(option.id)}
                  onToggle={() => toggleOption(option)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-4 mt-8">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Options Total</p>
              <p className="text-2xl font-bold">
                {optionsTotal === 0 ? 'Included' : `+$${optionsTotal.toFixed(2)}`}
              </p>
            </div>

            <Button onClick={handleContinue}>
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Option Card Component
interface OptionCardProps {
  option: MotorOption;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function OptionCard({ option, isSelected, onToggle, disabled }: OptionCardProps) {
  const effectivePrice = option.is_included ? 0 : (option.price_override ?? option.base_price);

  return (
    <Card className={`cursor-pointer transition-all ${
      isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    onClick={disabled ? undefined : onToggle}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {!disabled && (
            <div className="pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggle}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {disabled && (
            <div className="pt-1">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{option.name}</h3>
                {option.short_description && (
                  <p className="text-sm text-muted-foreground mt-1">{option.short_description}</p>
                )}
                {option.part_number && (
                  <p className="text-xs text-muted-foreground mt-1">Part: {option.part_number}</p>
                )}
              </div>
              
              <div className="text-right">
                {option.is_included ? (
                  <Badge variant="secondary">Included</Badge>
                ) : (
                  <p className="text-lg font-bold">
                    ${effectivePrice.toFixed(2)}
                  </p>
                )}
                {option.msrp && !option.is_included && option.msrp > effectivePrice && (
                  <p className="text-xs text-muted-foreground line-through">
                    ${option.msrp.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {option.features && option.features.length > 0 && (
              <ul className="mt-2 space-y-1">
                {option.features.slice(0, 3).map((feature: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-primary">•</span> {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
