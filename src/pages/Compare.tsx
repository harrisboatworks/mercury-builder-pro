import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Save, Check, X, ExternalLink, Scale, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMotorComparison, type ComparisonMotor } from '@/hooks/useMotorComparison';
import { 
  decodeModelName, 
  getRecommendedBoatSize, 
  getFuelConsumption, 
  getMaxBoatWeight,
  getEstimatedSpeed 
} from '@/lib/motor-helpers';
import { ShareComparisonModal } from '@/components/motors/ShareComparisonModal';
import { SaveComparisonModal } from '@/components/motors/SaveComparisonModal';
import { ComparisonEmptyState } from '@/components/motors/ComparisonEmptyState';

interface MotorWithDetails extends ComparisonMotor {
  specifications?: any;
  description?: string;
}

type ComparisonField = {
  label: string;
  getValue: (m: MotorWithDetails) => string | number | boolean | undefined;
  compare?: 'lowest' | 'highest';
  format?: (v: any, motor?: MotorWithDetails) => string;
  category: 'pricing' | 'specs' | 'features' | 'compatibility';
};

const DETAILED_COMPARISON_FIELDS: ComparisonField[] = [
  // Pricing
  { 
    label: 'Our Price', 
    getValue: (m) => m.price, 
    compare: 'lowest',
    format: (v) => v ? `$${v.toLocaleString()}` : '—',
    category: 'pricing'
  },
  { 
    label: 'MSRP', 
    getValue: (m) => m.msrp,
    format: (v) => v ? `$${v.toLocaleString()}` : '—',
    category: 'pricing'
  },
  { 
    label: 'You Save', 
    getValue: (m) => m.msrp && m.price ? m.msrp - m.price : undefined,
    compare: 'highest',
    format: (v) => v ? `$${v.toLocaleString()}` : '—',
    category: 'pricing'
  },
  
  // Specs
  { 
    label: 'Horsepower', 
    getValue: (m) => m.hp, 
    compare: 'highest',
    format: (v) => `${v} HP`,
    category: 'specs'
  },
  { 
    label: 'Engine Type', 
    getValue: (m) => m.type,
    format: (v) => v || 'FourStroke',
    category: 'specs'
  },
  { 
    label: 'Shaft Length', 
    getValue: (m) => m.shaft,
    format: (v) => v || '—',
    category: 'specs'
  },
  { 
    label: 'Est. Fuel Consumption', 
    getValue: (m) => m.hp,
    format: (v, motor) => motor ? getFuelConsumption(motor.hp) : '—',
    category: 'specs'
  },
  { 
    label: 'Est. Top Speed', 
    getValue: (m) => m.hp,
    format: (v, motor) => motor ? getEstimatedSpeed(motor.hp) : '—',
    category: 'specs'
  },
  
  // Compatibility
  { 
    label: 'Recommended Boat Size', 
    getValue: (m) => m.hp,
    format: (v, motor) => motor ? getRecommendedBoatSize(motor.hp) : '—',
    category: 'compatibility'
  },
  { 
    label: 'Max Boat Weight', 
    getValue: (m) => m.hp,
    format: (v, motor) => motor ? getMaxBoatWeight(motor.hp) : '—',
    category: 'compatibility'
  },
  { 
    label: 'Availability', 
    getValue: (m) => m.in_stock,
    format: (v) => v ? 'In Stock' : 'Special Order',
    category: 'compatibility'
  }
];

export default function Compare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { comparisonList, clearComparison } = useMotorComparison();
  
  const [motors, setMotors] = useState<MotorWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Get motor IDs from URL or comparison list
  const motorIdsFromUrl = searchParams.get('motors')?.split(',').filter(Boolean) || [];
  const savedComparisonId = searchParams.get('saved');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Fetch motors based on URL params or comparison list
  useEffect(() => {
    const fetchMotors = async () => {
      setLoading(true);
      try {
        let idsToFetch: string[] = [];

        if (savedComparisonId) {
          // Load saved comparison
          const { data: savedComparison } = await supabase
            .from('saved_comparisons')
            .select('motor_ids')
            .eq('id', savedComparisonId)
            .single();
          
          if (savedComparison?.motor_ids) {
            idsToFetch = savedComparison.motor_ids;
          }
        } else if (motorIdsFromUrl.length > 0) {
          idsToFetch = motorIdsFromUrl;
        } else if (comparisonList.length > 0) {
          idsToFetch = comparisonList.map(m => m.id);
        }

        if (idsToFetch.length === 0) {
          setMotors([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('motor_models')
          .select('*')
          .in('id', idsToFetch);

        if (error) throw error;

        // Transform to ComparisonMotor format
        const transformedMotors: MotorWithDetails[] = (data || []).map(m => ({
          id: m.id,
          model: m.model_display || m.model,
          hp: m.horsepower || 0,
          price: m.dealer_price || m.base_price || 0,
          msrp: m.msrp || undefined,
          image: m.hero_image_url || m.image_url,
          in_stock: m.in_stock,
          type: m.motor_type,
          shaft: m.shaft,
          features: Array.isArray(m.features) ? m.features : [],
          specifications: m.specifications,
          description: m.description
        }));

        setMotors(transformedMotors);
      } catch (err) {
        console.error('Error fetching motors:', err);
        toast.error('Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };

    fetchMotors();
  }, [motorIdsFromUrl.join(','), savedComparisonId, comparisonList]);

  // Get winner for comparable fields
  const getWinner = (field: ComparisonField): string | null => {
    if (!field.compare || motors.length < 2) return null;
    
    const values = motors.map(m => ({ id: m.id, value: field.getValue(m) }))
      .filter(v => v.value !== undefined && v.value !== null && typeof v.value === 'number');
    
    if (values.length < 2) return null;
    
    if (field.compare === 'lowest') {
      const min = Math.min(...values.map(v => Number(v.value)));
      return values.find(v => Number(v.value) === min)?.id || null;
    } else {
      const max = Math.max(...values.map(v => Number(v.value)));
      return values.find(v => Number(v.value) === max)?.id || null;
    }
  };

  // Generate shareable URL
  const shareableUrl = useMemo(() => {
    const ids = motors.map(m => m.id).join(',');
    return `${window.location.origin}/compare?motors=${ids}`;
  }, [motors]);

  const handleSelectMotor = (motor: MotorWithDetails) => {
    navigate('/quote/motor-selection', { 
      state: { selectedMotorId: motor.id }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const groupedFields = useMemo(() => {
    const groups: Record<string, ComparisonField[]> = {
      pricing: [],
      specs: [],
      compatibility: []
    };
    
    DETAILED_COMPARISON_FIELDS.forEach(field => {
      if (groups[field.category]) {
        groups[field.category].push(field);
      }
    });
    
    return groups;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading comparison...</div>
      </div>
    );
  }

  if (motors.length === 0) {
    return <ComparisonEmptyState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Scale className="text-primary" size={20} />
                  Motor Comparison
                </h1>
                <p className="text-sm text-muted-foreground">
                  Comparing {motors.length} motor{motors.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2 hidden sm:flex"
              >
                <Printer size={16} />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="gap-2"
              >
                <Share2 size={16} />
                Share
              </Button>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveModal(true)}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden"
        >
          {/* Motor Headers */}
          <div className="grid border-b border-border" style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}>
            <div className="p-6 bg-muted/30">
              <span className="text-sm font-medium text-muted-foreground">Compare</span>
            </div>
            {motors.map((motor, idx) => (
              <div key={motor.id} className="p-6 text-center border-l border-border">
                {motor.image && (
                  <img 
                    src={motor.image} 
                    alt={motor.model}
                    className="w-32 h-32 object-contain mx-auto mb-4"
                  />
                )}
                <h3 className="font-bold text-foreground text-lg mb-1">{motor.model}</h3>
                <p className="text-2xl font-bold text-primary">
                  ${motor.price?.toLocaleString()}
                </p>
                {motor.in_stock ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                    <Check size={12} /> In Stock
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground mt-2">Special Order</span>
                )}
              </div>
            ))}
          </div>

          {/* Pricing Section */}
          <div className="border-b border-border">
            <div className="grid bg-primary/5" style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}>
              <div className="p-4 font-semibold text-primary">Pricing</div>
              {motors.map(m => <div key={m.id} className="border-l border-border" />)}
            </div>
            {groupedFields.pricing.map((field) => {
              const winnerId = getWinner(field);
              return (
                <div 
                  key={field.label}
                  className="grid border-t border-border/50"
                  style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}
                >
                  <div className="p-4 text-sm font-medium text-muted-foreground bg-muted/20">
                    {field.label}
                  </div>
                  {motors.map((motor) => {
                    const value = field.getValue(motor);
                    const isWinner = winnerId === motor.id;
                    return (
                      <div 
                        key={motor.id} 
                        className={cn(
                          'p-4 text-center text-sm border-l border-border/50',
                          isWinner && 'bg-green-50'
                        )}
                      >
                        <span className={cn(
                          'font-medium',
                          isWinner && 'text-green-700'
                        )}>
                          {field.format ? field.format(value, motor) : String(value || '—')}
                        </span>
                        {isWinner && (
                          <Check size={14} className="inline-block ml-1 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Specs Section */}
          <div className="border-b border-border">
            <div className="grid bg-primary/5" style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}>
              <div className="p-4 font-semibold text-primary">Specifications</div>
              {motors.map(m => <div key={m.id} className="border-l border-border" />)}
            </div>
            {groupedFields.specs.map((field) => {
              const winnerId = getWinner(field);
              return (
                <div 
                  key={field.label}
                  className="grid border-t border-border/50"
                  style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}
                >
                  <div className="p-4 text-sm font-medium text-muted-foreground bg-muted/20">
                    {field.label}
                  </div>
                  {motors.map((motor) => {
                    const value = field.getValue(motor);
                    const isWinner = winnerId === motor.id;
                    return (
                      <div 
                        key={motor.id} 
                        className={cn(
                          'p-4 text-center text-sm border-l border-border/50',
                          isWinner && 'bg-green-50'
                        )}
                      >
                        <span className={cn(
                          'font-medium',
                          isWinner && 'text-green-700'
                        )}>
                          {field.format ? field.format(value, motor) : String(value || '—')}
                        </span>
                        {isWinner && (
                          <Check size={14} className="inline-block ml-1 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Compatibility Section */}
          <div className="border-b border-border">
            <div className="grid bg-primary/5" style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}>
              <div className="p-4 font-semibold text-primary">Compatibility</div>
              {motors.map(m => <div key={m.id} className="border-l border-border" />)}
            </div>
            {groupedFields.compatibility.map((field) => {
              const winnerId = getWinner(field);
              return (
                <div 
                  key={field.label}
                  className="grid border-t border-border/50"
                  style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}
                >
                  <div className="p-4 text-sm font-medium text-muted-foreground bg-muted/20">
                    {field.label}
                  </div>
                  {motors.map((motor) => {
                    const value = field.getValue(motor);
                    const isWinner = winnerId === motor.id;
                    return (
                      <div 
                        key={motor.id} 
                        className={cn(
                          'p-4 text-center text-sm border-l border-border/50',
                          isWinner && 'bg-green-50'
                        )}
                      >
                        <span className={cn(
                          'font-medium',
                          isWinner && 'text-green-700'
                        )}>
                          {field.format ? field.format(value, motor) : String(value || '—')}
                        </span>
                        {isWinner && (
                          <Check size={14} className="inline-block ml-1 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="border-b border-border">
            <div className="grid bg-primary/5" style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}>
              <div className="p-4 font-semibold text-primary">Key Features</div>
              {motors.map(m => <div key={m.id} className="border-l border-border" />)}
            </div>
            <div 
              className="grid border-t border-border/50"
              style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}
            >
              <div className="p-4 text-sm font-medium text-muted-foreground bg-muted/20">
                Decoded Features
              </div>
              {motors.map((motor) => {
                const decoded = decodeModelName(motor.model, motor.hp);
                return (
                  <div key={motor.id} className="p-4 border-l border-border/50">
                    <ul className="space-y-2">
                      {decoded.slice(0, 6).map((item, idx) => (
                        <li key={idx} className="text-xs">
                          <span className="font-semibold text-primary">{item.code}</span>
                          <span className="text-muted-foreground"> — {item.meaning}</span>
                        </li>
                      ))}
                      {decoded.length === 0 && (
                        <li className="text-xs text-muted-foreground">Standard configuration</li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div 
            className="grid"
            style={{ gridTemplateColumns: `200px repeat(${motors.length}, 1fr)` }}
          >
            <div className="p-6 bg-muted/20" />
            {motors.map((motor) => (
              <div key={motor.id} className="p-6 text-center border-l border-border">
                <Button
                  onClick={() => handleSelectMotor(motor)}
                  className="w-full max-w-xs mx-auto"
                  size="lg"
                >
                  Select This Motor
                  <ExternalLink size={16} className="ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Clear Comparison */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => {
              clearComparison();
              navigate('/quote/motor-selection');
            }}
            className="text-muted-foreground"
          >
            <X size={16} className="mr-2" />
            Clear Comparison & Start Over
          </Button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareComparisonModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareableUrl}
        motorCount={motors.length}
      />

      {/* Save Modal */}
      <SaveComparisonModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        motorIds={motors.map(m => m.id)}
        onSaved={() => {
          setShowSaveModal(false);
          toast.success('Comparison saved!');
        }}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          .sticky { position: relative !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}