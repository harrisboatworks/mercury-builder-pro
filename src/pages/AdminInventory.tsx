import React, { useState, useEffect } from 'react';
import { UnifiedInventoryDashboard } from '@/components/admin/UnifiedInventoryDashboard';
import { RawHTMLViewer } from '@/components/admin/RawHTMLViewer';
import { XMLDebugAnalyzer } from '@/components/admin/XMLDebugAnalyzer';
import AdminNav from '@/components/admin/AdminNav';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import MotorCardPremium from '@/components/motors/MotorCardPremium';
import MotorCardPreview from '@/components/motors/MotorCardPreview';
import { supabase } from '@/integrations/supabase/client';

export default function AdminInventory() {
  // Load preview mode from localStorage
  const [previewMode, setPreviewMode] = useState(() => {
    const saved = localStorage.getItem('admin-motor-card-preview-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [sampleMotors, setSampleMotors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Save preview mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-motor-card-preview-mode', JSON.stringify(previewMode));
  }, [previewMode]);

  // Fetch sample motors for A/B testing preview
  useEffect(() => {
    const fetchSampleMotors = async () => {
      try {
        const { data: motors, error } = await supabase
          .from('motor_models')
          .select('*')
          .not('msrp', 'is', null)
          .not('dealer_price', 'is', null)
          .limit(3)
          .order('horsepower', { ascending: true });

        if (error) throw error;
        
        // Convert to format expected by motor cards
        const formattedMotors = motors?.map(motor => ({
          ...motor,
          inStock: motor.in_stock || false,
          title: motor.model_display || motor.model || `${motor.horsepower}HP Mercury`,
          img: motor.hero_image_url || motor.image_url,
          price: motor.dealer_price || motor.msrp,
          msrp: motor.msrp,
          hp: motor.horsepower,
          promoText: motor.promo_text
        })) || [];
        
        setSampleMotors(formattedMotors);
      } catch (error) {
        console.error('Error fetching sample motors:', error);
        // Provide fallback data if query fails
        setSampleMotors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSampleMotors();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Monitor motor inventory, sync status, and diagnostics
            </p>
          </div>
          
          {/* Motor Card Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Motor Card Design Preview</CardTitle>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={previewMode}
                  onCheckedChange={setPreviewMode}
                />
                <Label>Preview New Motor Card Design</Label>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading sample motors...</div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {previewMode ? 'Preview Design' : 'Current Design'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sampleMotors.map((motor, index) => {
                        const MotorCard = previewMode ? MotorCardPreview : MotorCardPremium;
                        return (
                          <MotorCard
                            key={`${previewMode ? 'preview' : 'current'}-${motor.id || index}`}
                            img={motor.img}
                            title={motor.title}
                            hp={motor.hp}
                            msrp={motor.msrp}
                            price={motor.price}
                            promoText={motor.promoText}
                            onSelect={() => console.log('Motor selected:', motor.title)}
                            shaft={motor.shaft}
                            weightLbs={motor.weight_lbs}
                            altOutput={motor.alt_output}
                            steering={motor.steering}
                            features={motor.features}
                            description={motor.description}
                            specSheetUrl={motor.spec_sheet_url}
                            motor={motor}
                            inStock={motor.inStock}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Side by side comparison when toggled */}
                  {sampleMotors.length > 0 && (
                    <div className="border-t pt-8">
                      <h3 className="text-lg font-semibold mb-4">Side-by-Side Comparison</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-md font-medium mb-3 text-center">Current Design</h4>
                          <MotorCardPremium
                            img={sampleMotors[0].img}
                            title={sampleMotors[0].title}
                            hp={sampleMotors[0].hp}
                            msrp={sampleMotors[0].msrp}
                            price={sampleMotors[0].price}
                            promoText={sampleMotors[0].promoText}
                            onSelect={() => console.log('Current card selected')}
                            shaft={sampleMotors[0].shaft}
                            weightLbs={sampleMotors[0].weight_lbs}
                            altOutput={sampleMotors[0].alt_output}
                            steering={sampleMotors[0].steering}
                            features={sampleMotors[0].features}
                            description={sampleMotors[0].description}
                            specSheetUrl={sampleMotors[0].spec_sheet_url}
                            motor={sampleMotors[0]}
                            inStock={sampleMotors[0].inStock}
                          />
                        </div>
                        <div>
                          <h4 className="text-md font-medium mb-3 text-center">Preview Design</h4>
                          <MotorCardPreview
                            img={sampleMotors[0].img}
                            title={sampleMotors[0].title}
                            hp={sampleMotors[0].hp}
                            msrp={sampleMotors[0].msrp}
                            price={sampleMotors[0].price}
                            promoText={sampleMotors[0].promoText}
                            onSelect={() => console.log('Preview card selected')}
                            shaft={sampleMotors[0].shaft}
                            weightLbs={sampleMotors[0].weight_lbs}
                            altOutput={sampleMotors[0].alt_output}
                            steering={sampleMotors[0].steering}
                            features={sampleMotors[0].features}
                            description={sampleMotors[0].description}
                            specSheetUrl={sampleMotors[0].spec_sheet_url}
                            motor={sampleMotors[0]}
                            inStock={sampleMotors[0].inStock}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <XMLDebugAnalyzer />
          <RawHTMLViewer />
          <UnifiedInventoryDashboard />
        </div>
      </main>
    </div>
  );
}