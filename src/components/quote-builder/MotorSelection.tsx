import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, Anchor } from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Motor } from '../QuoteBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { MotorFilters } from './MotorFilters';

interface MotorSelectionProps {
  onStepComplete: (motor: Motor) => void;
}

export const MotorSelection = ({ onStepComplete }: MotorSelectionProps) => {
  const { toast } = useToast();
  const [motors, setMotors] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    stockStatus: 'all',
    priceRange: [0, 50000] as [number, number],
    hpRange: [2.5, 600] as [number, number]
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Load motors from database
  useEffect(() => {
    loadMotors();
  }, []);

  const loadMotors = async () => {
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('*')
        .order('horsepower');

      if (error) throw error;

      // Transform database data to Motor interface
      const transformedMotors: Motor[] = (data || []).map(motor => ({
        id: motor.id,
        model: motor.model,
        hp: motor.horsepower,
        price: motor.base_price,
        image: motor.image_url || '/placeholder.svg',
        stockStatus: motor.availability === 'In Stock' ? 'In Stock' : 
                    motor.availability === 'On Order' ? 'On Order' : 'Out of Stock',
        category: categorizeMotor(motor.horsepower),
        type: motor.motor_type,
        specs: `${motor.engine_type || ''} ${motor.year} ${motor.make} ${motor.model}`.trim()
      }));

      setMotors(transformedMotors);
    } catch (error) {
      console.error('Error loading motors:', error);
      toast({
        title: "Error",
        description: "Failed to load motors from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const categorizeMotor = (hp: number): 'portable' | 'mid-range' | 'high-performance' | 'v8-racing' => {
    if (hp <= 20) return 'portable';
    if (hp <= 100) return 'mid-range';
    if (hp <= 200) return 'high-performance';
    return 'v8-racing';
  };

  const updateInventory = async () => {
    setUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-inventory');
      
      if (error) throw error;
      
      toast({
        title: "Success", 
        description: `Updated ${data.count} motors from Harris Boat Works`,
      });
      
      // Reload motors after update
      await loadMotors();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const categories = [
    { key: 'all', label: 'All Motors', color: 'primary' },
    { key: 'portable', label: 'Portable (2.5-20hp)', color: 'portable' },
    { key: 'mid-range', label: 'Mid-Range (25-100hp)', color: 'mid-range' },
    { key: 'high-performance', label: 'High Performance (115-200hp)', color: 'high-performance' },
    { key: 'v8-racing', label: 'V8 & Racing (225-600hp)', color: 'v8-racing' }
  ];

  const filteredMotors = motors.filter(motor => {
    if (filters.category !== 'all' && motor.category !== filters.category) return false;
    if (filters.stockStatus !== 'all' && motor.stockStatus !== filters.stockStatus) return false;
    if (motor.price < filters.priceRange[0] || motor.price > filters.priceRange[1]) return false;
    if (motor.hp < filters.hpRange[0] || motor.hp > filters.hpRange[1]) return false;
    return true;
  });

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-500 text-white hover:bg-green-600';
      case 'On Order': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'Out of Stock': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getCategoryColor = (category: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (category) {
      case 'portable': return 'secondary';
      case 'mid-range': return 'outline';
      case 'high-performance': return 'default';
      case 'v8-racing': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p>Loading motor inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Filter Sidebar */}
      <MotorFilters
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        resultsCount={filteredMotors.length}
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <img src={mercuryLogo} alt="Mercury Marine" className="h-12 w-auto" />
            <h2 className="text-3xl font-bold text-foreground">Select Your Mercury Outboard</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our current inventory of Mercury outboard motors. All prices and availability are updated from Harris Boat Works.
          </p>
          <Button 
            onClick={updateInventory} 
            disabled={updating}
            variant="outline"
            size="sm"
          >
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Inventory
              </>
            )}
          </Button>
        </div>

        {/* Motors Grid */}
        {filteredMotors.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No motors found matching your filters.</p>
          </Card>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredMotors.map(motor => (
              <Card 
                key={motor.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedMotor?.id === motor.id ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => setSelectedMotor(motor)}
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Badge variant={getCategoryColor(motor.category)}>
                      {motor.hp}HP
                    </Badge>
                    <Badge className={getStockBadgeColor(motor.stockStatus)}>
                      {motor.stockStatus}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">{motor.model}</h3>
                    <p className="text-muted-foreground text-sm">{motor.specs}</p>
                  </div>

                  {motor.image && motor.image !== '/placeholder.svg' && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={motor.image} 
                        alt={motor.model}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-foreground">
                        ${motor.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">CAD</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Anchor className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">{motor.type}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Continue Button */}
        {selectedMotor && (
          <div className="flex justify-center pt-8">
            <Button 
              onClick={() => onStepComplete(selectedMotor)}
              size="lg"
              className="px-8"
            >
              Continue with {selectedMotor.model}
              <Zap className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};