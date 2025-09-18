import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

interface PricingData {
  modelNumber: string;
  description: string;
  msrp: number;
  dealerPrice: number;
}

export const OfficialPricingImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [stats, setStats] = useState<{ matched: number; total: number } | null>(null);
  const { toast } = useToast();

  const parsePricingData = async (): Promise<PricingData[]> => {
    try {
      // Load the comprehensive pricing CSV file
      const response = await fetch('/mercury-dealer-prices.csv');
      const csvText = await response.text();
      
      const lines = csvText.trim().split('\n').slice(1); // Skip header
      return lines.map(line => {
        const [modelNumber, description, msrp, dealerPrice] = line.split(',');
        return {
          modelNumber: modelNumber.trim(),
          description: description.trim(),
          msrp: parseInt(msrp.trim()),
          dealerPrice: parseInt(dealerPrice.trim())
        };
      });
    } catch (error) {
      console.error('Failed to load pricing CSV:', error);
      throw new Error('Failed to load comprehensive pricing data');
    }
  };

  const normalizeDescription = (desc: string): string => {
    return desc
      .replace(/FourStroke/g, '')
      .replace(/Pro XS/g, '')
      .replace(/DTS/g, '')
      .replace(/TorqueMaster/g, '')
      .replace(/Tiller/g, '')
      .replace(/Sail Power/g, '')
      .replace(/EFI/g, '')
      .replace(/\(Four-Cylinder\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const importOfficialPricing = async () => {
    setIsImporting(true);
    
    try {
      const pricingData = await parsePricingData();
      console.log('📊 Parsed pricing data:', pricingData.length, 'records');
      
      // Get all current motors
      const { data: existingMotors, error: fetchError } = await supabase
        .from('motor_models')
        .select('id, model_number, model_display, horsepower')
        .order('horsepower');

      if (fetchError) {
        throw new Error(`Failed to fetch motors: ${fetchError.message}`);
      }

      console.log('🚤 Current motors:', existingMotors?.length);

      let matchedCount = 0;
      const updates = [];

      // Try to match by model_number first (exact match)
      for (const motor of existingMotors || []) {
        const exactMatch = pricingData.find(p => p.modelNumber === motor.model_number);
        if (exactMatch) {
          updates.push({
            id: motor.id,
            model_number: exactMatch.modelNumber,
            dealer_price: exactMatch.dealerPrice,
            msrp: exactMatch.msrp,
            price_source: 'official_mercury_catalog',
            model_display: exactMatch.description
          });
          matchedCount++;
          console.log('✅ Exact match:', motor.model_number, '→', exactMatch.description);
        }
      }

      // For unmatched motors, try fuzzy matching by description/horsepower
      const unmatched = existingMotors?.filter(m => 
        !updates.find(u => u.id === m.id)
      ) || [];

      for (const motor of unmatched) {
        if (!motor.model_display) continue;

        const normalizedMotorDesc = normalizeDescription(motor.model_display);
        
        // Find potential matches by horsepower and description similarity
        const candidates = pricingData.filter(p => {
          const pricingHP = parseFloat(p.description);
          const motorHP = motor.horsepower || 0;
          return Math.abs(pricingHP - motorHP) < 0.1; // Same horsepower
        });

        for (const candidate of candidates) {
          const normalizedCandidateDesc = normalizeDescription(candidate.description);
          
          // Check if key parts of the description match
          const motorParts = normalizedMotorDesc.toLowerCase().split(/\s+/);
          const candidateParts = normalizedCandidateDesc.toLowerCase().split(/\s+/);
          
          const matchingParts = motorParts.filter(part => 
            candidateParts.some(cPart => 
              part.includes(cPart) || cPart.includes(part)
            )
          );

          // If at least 50% of parts match, consider it a match
          if (matchingParts.length >= Math.ceil(motorParts.length * 0.5)) {
            updates.push({
              id: motor.id,
              model_number: candidate.modelNumber,
              dealer_price: candidate.dealerPrice,
              msrp: candidate.msrp,
              price_source: 'official_mercury_catalog',
              model_display: candidate.description
            });
            matchedCount++;
            console.log('🔄 Fuzzy match:', motor.model_display, '→', candidate.description);
            break; // Take first match
          }
        }
      }

      // Apply all updates to existing motors
      console.log('📝 Applying', updates.length, 'updates to existing motors...');
      
      for (const update of updates) {
        const { error } = await supabase
          .from('motor_models')
          .update({
            model_number: update.model_number,
            dealer_price: update.dealer_price,
            msrp: update.msrp,
            price_source: update.price_source,
            model_display: update.model_display,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (error) {
          console.error('❌ Update failed for motor', update.id, ':', error.message);
        }
      }

      // Insert new motors that don't exist in the database
      const existingModelNumbers = new Set(existingMotors?.map(m => m.model_number) || []);
      const newMotors = pricingData.filter(p => !existingModelNumbers.has(p.modelNumber));
      
      console.log('🆕 Inserting', newMotors.length, 'new motors...');
      
      for (const newMotor of newMotors) {
        // Extract HP from description
        const hpMatch = newMotor.description.match(/^(\d+(?:\.\d+)?)/);
        const hp = hpMatch ? parseFloat(hpMatch[1]) : 0;
        
        const { error } = await supabase
          .from('motor_models')
          .insert({
            model_number: newMotor.modelNumber,
            model_display: newMotor.description,
            dealer_price: newMotor.dealerPrice,
            msrp: newMotor.msrp,
            horsepower: hp,
            make: 'Mercury',
            model: 'Outboard',
            motor_type: 'Outboard',
            year: 2025,
            is_brochure: true,
            price_source: 'official_mercury_catalog'
          });

        if (error) {
          console.error('❌ Insert failed for new motor', newMotor.modelNumber, ':', error.message);
        } else {
          matchedCount++;
        }
      }

      setStats({ matched: matchedCount, total: pricingData.length });
      setImportComplete(true);

      toast({
        title: "Import Complete!",
        description: `Successfully processed ${matchedCount} motors with comprehensive Mercury pricing and model data.`,
      });

    } catch (error) {
      console.error('❌ Import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {importComplete ? <CheckCircle className="h-5 w-5 text-green-600" /> : null}
          Official Mercury Pricing Import
        </CardTitle>
        <CardDescription>
          Import official Mercury model numbers and pricing data to fix missing prices and incorrect model numbers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>Import Results:</strong> Successfully matched and updated {stats.matched} out of {stats.total} motors
              with official Mercury pricing and model numbers.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">What this import will do:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Match existing motors with official Mercury model numbers</li>
            <li>• Update dealer prices with comprehensive Mercury pricing (CAD)</li>
            <li>• Set accurate MSRP from official Mercury data</li>
            <li>• Fix motor display names to match official Mercury descriptions</li>
            <li>• Use fuzzy matching for motors with similar descriptions</li>
            <li>• Process 256 comprehensive motor pricing records</li>
          </ul>
        </div>

        <Button 
          onClick={importOfficialPricing} 
          disabled={isImporting || importComplete}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing Official Pricing Data...
            </>
          ) : importComplete ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Import Complete
            </>
          ) : (
            'Import Official Mercury Pricing'
          )}
        </Button>

        {importComplete && (
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Refresh Page to See Results
          </Button>
        )}
      </CardContent>
    </Card>
  );
};