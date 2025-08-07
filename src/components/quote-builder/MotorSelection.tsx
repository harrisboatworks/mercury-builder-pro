import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Filter, Grid, List, Zap, Anchor, RefreshCw } from 'lucide-react';
import mercuryLogo from '@/assets/mercury-logo.png';
import { Motor } from '../QuoteBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
    priceRange: [0, 50000]
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    return true;
  });

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'default';
      case 'On Order': return 'secondary'; 
      case 'Out of Stock': return 'destructive';
      default: return 'secondary';
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
    <div className="space-y-8">
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

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Motors ({filteredMotors.length} found)
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Motor Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category.key}
                  variant={filters.category === category.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, category: category.key }))}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Stock Status Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Stock Status</label>
            <div className="flex gap-2">
              {['all', 'In Stock', 'On Order', 'Out of Stock'].map(status => (
                <Button
                  key={status}
                  variant={filters.stockStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, stockStatus: status }))}
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Price Range: ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
            </label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
              max={50000}
              min={0}
              step={500}
              className="w-full"
            />
          </div>
        </div>
      </Card>

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
                  <Badge variant={getStockBadgeColor(motor.stockStatus)}>
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
  );
};