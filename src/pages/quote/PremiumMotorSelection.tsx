import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { Motor } from '@/components/QuoteBuilder';
import PremiumShell from '@/components/layout/PremiumShell';
import StepHeader from '@/components/ui/StepHeader';
import PremiumMotorCard from '@/components/ui/PremiumMotorCard';
import HPRangeChips, { hpRanges } from '@/components/ui/HPRangeChips';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function PremiumMotorSelection({ onStepComplete }: { onStepComplete: (motor: Motor) => void }) {
  const navigate = useNavigate();
  const { dispatch } = useQuote();
  const [motors, setMotors] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [selectedHPRange, setSelectedHPRange] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Select Mercury Outboard Motor | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Choose from our selection of Mercury outboard motors with live pricing and current promotions.';
  }, []);

  useEffect(() => {
    const fetchMotors = async () => {
      try {
        const { data, error } = await supabase
          .from('motors')
          .select('*')
          .order('hp', { ascending: true });
        
        if (error) throw error;
        if (data) setMotors(data as Motor[]);
      } catch (error) {
        console.error('Error fetching motors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMotors();
  }, []);

  const filteredMotors = motors.filter(motor => {
    // HP Range filter
    if (selectedHPRange !== 'all') {
      const range = hpRanges.find(r => r.id === selectedHPRange);
      if (range && (motor.hp < range.min || motor.hp > range.max)) {
        return false;
      }
    }

    // Stock filter
    if (inStockOnly && motor.stockStatus !== 'In Stock') {
      return false;
    }

    return true;
  });

  const handleMotorSelect = (motor: Motor) => {
    setSelectedMotor(motor);
  };

  const handleContinue = () => {
    if (selectedMotor) {
      onStepComplete(selectedMotor);
    }
  };

  if (loading) {
    return (
      <PremiumShell 
        title="Select Your Mercury Motor"
        subtitle="Choose the perfect outboard for your boat."
      >
        <div className="text-center py-12">
          <div className="text-sm p-quiet">Loading motors...</div>
        </div>
      </PremiumShell>
    );
  }

  return (
    <PremiumShell 
      title="Select Your Mercury Motor"
      subtitle="Choose the perfect outboard for your boat."
    >
      <StepHeader 
        label="Available Motors" 
        help="All motors include current promotions and live pricing."
      />

      {/* Filters */}
      <div className="p-card bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium p-quiet mb-2 block">Power Range</Label>
            <HPRangeChips 
              selectedRange={selectedHPRange}
              onRangeChange={setSelectedHPRange}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="in-stock-only"
              checked={inStockOnly}
              onCheckedChange={setInStockOnly}
            />
            <Label htmlFor="in-stock-only" className="text-sm">
              In Stock Only
            </Label>
          </div>
        </div>
      </div>

      {/* Motor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMotors.map((motor) => (
          <PremiumMotorCard
            key={motor.id}
            motor={motor}
            selected={selectedMotor?.id === motor.id}
            onSelect={() => handleMotorSelect(motor)}
          />
        ))}
      </div>

      {filteredMotors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-sm p-quiet">No motors match your current filters.</div>
        </div>
      )}

      {/* Sticky Continue Button */}
      <div className="sticky bottom-4 z-10">
        <Button 
          onClick={handleContinue}
          disabled={!selectedMotor}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
        >
          Continue with {selectedMotor ? selectedMotor.model.replace(/ - \d+(\.\d+)?HP$/i, '') : 'Selected Motor'}
        </Button>
      </div>
    </PremiumShell>
  );
}