import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

interface PricingData {
  modelNumber: string;
  description: string;
  price: number;
}

export const OfficialPricingImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [stats, setStats] = useState<{ matched: number; total: number } | null>(null);
  const { toast } = useToast();

  const parsePricingData = async (): Promise<PricingData[]> => {
    // Parse the official pricing data
    const csvData = `Model Number,Description,Price  
1F02201KK,2.5MH FourStroke,1270  
1F03201KK,3.5MH FourStroke,1524  
1F03211KK,3.5MLH FourStroke,1557  
1F04201KK,4MH FourStroke,1815  
1F04211KK,4MLH FourStroke,1854  
1FX5201KK,5MH FourStroke,2019  
1F05221KK,5MXLH FourStroke,2090  
1F05216KK,5MLHA Sail Power FourStroke,2057  
1FX6201KK,6MH FourStroke,2084  
1FX6211KK,6MLH FourStroke,2118  
1A08201LK,8MH FourStroke,3036  
1A08211LK,8MLH FourStroke,3075  
1A08301LK,8EH FourStroke,3344  
1A08311LK,8ELH FourStroke,3383  
1A10204LV,9.9MRC FourStroke,3548  
1A10201LK,9.9MH FourStroke,3553  
1A10211LK,9.9MLH FourStroke,3597  
1A10301LK,9.9EH FourStroke,3878  
1A10312LK,9.9EL FourStroke,3966  
1A10311LK,9.9ELH FourStroke,4065  
1A10402LK,9.9EPT FourStroke,4494  
1A10251LK,9.9MLH Command Thrust FourStroke,3894  
1A10261LK,9.9MXLH Command Thrust FourStroke,4010  
1A10351LK,9.9ELH Command Thrust FourStroke,4389  
1A10361LK,9.9EXLH Command Thrust FourStroke,4466  
1A10452LK,9.9ELPT Command Thrust ProKicker EFI FourStroke,4900  
1A10462LK,9.9EXLPT Command Thrust ProKicker EFI FourStroke,4983  
1A10451LK,9.9ELHPT Command Thrust ProKicker EFI FourStroke,5000  
1A10461LK,9.9EXLHPT Command Thrust ProKicker EFI FourStroke,5093  
1A15204LK,15MRC FourStroke,3834  
1A15201LK,15MH FourStroke,3872  
1A15211LK,15MLH FourStroke,3922  
1A15302LK,15E FourStroke,4191  
1A15312LK,15EL FourStroke,4218  
1A15301LK,15EH FourStroke,4218  
1A15311LK,15ELH FourStroke,4274  
1A15402LK,15EPT FourStroke,4758  
1A15401LK,15EHPT FourStroke,4785  
1A15412LK,15ELPT FourStroke,4686  
1A15452BK,15ELPT ProKicker FourStroke,5368  
1A15462BK,15EXLPT ProKicker FourStroke,5456  
1A15451BK,15ELHPT ProKicker FourStroke,5462  
1A15461BK,15EXLHPT ProKicker FourStroke,5572  
1A20204LK,20MRC FourStroke,4186  
1A20201LK,20MH FourStroke,4230  
1A20211LK,20MLH FourStroke,4268  
1A20301LK,20EH FourStroke,4686  
1A20302LK,20E FourStroke,4675  
1A20311LK,20ELH FourStroke,4752  
1A20312LK,20EL FourStroke,4664  
1A20402LK,20EPT FourStroke,5264  
1A20411LK,20ELHPT FourStroke,5390  
1A20412LK,20ELPT FourStroke,5264  
1A25203BK,25MH FourStroke,4878  
1A25213BK,25MLH FourStroke,4966  
1A25301BK,25EH FourStroke,5252  
1A25311BK,25ELH FourStroke,5440  
1A25312BK,25EL FourStroke,5203  
1A25403BK,25EPT FourStroke,5913  
1A25411BK,25ELHPT FourStroke,6111  
1A25413BK,25ELPT FourStroke,5995  
1A25452BK,25ELPT ProKicker FourStroke,6287  
1A25462BK,25EXLPT ProKicker FourStroke,6441  
1A3G203BK,30MHGA FourStroke,6787  
1A3G213BK,30MLHGA FourStroke,6842  
1A3G313BK,30ELGA FourStroke,7359  
1A3G311BK,30ELHGA FourStroke,7480  
1A30403BK,30EPT FourStroke,7524  
1A30413BK,30ELPT FourStroke,7805  
1A30411BK,30ELHPT FourStroke,7926  
1F40403GZ,40EPT FourStroke,9460  
1F40413GZ,40ELPT FourStroke,9532  
1F4041TJZ,40ELHPT FourStroke Tiller,10054  
1F41453GZ,40ELPT Command Thrust (Four-Cylinder) FourStroke,9900  
1F51413GZ,50ELPT FourStroke,10703  
1F5141TJZ,50ELHPT FourStroke Tiller,11358  
1F51453GZ,50ELPT Command Thrust FourStroke,11126  
1F5145TJZ,50ELHPT Command Thrust FourStroke Tiller,11600  
1F60413GZ,60ELPT FourStroke,12161  
1F6041TJZ,60ELHPT FourStroke Tiller,12826  
1F60453GZ,60ELPT Command Thrust FourStroke,12469  
1F60463GZ,60EXLPT Command Thrust FourStroke,12815  
1F6045TJZ,60ELHPT Command Thrust FourStroke Tiller,13189  
1F754132D,75ELPT FourStroke,14190  
1F904132D,90ELPT FourStroke,14812  
1F904232D,90EXLPT FourStroke,15191  
1F904532D,90ELPT Command Thrust FourStroke,15274  
1F904632D,90EXLPT Command Thrust FourStroke,15323  
1115F132D,115ELPT FourStroke,16912  
1115F232D,115EXLPT FourStroke,17270  
1115F532D,115ELPT Command Thrust FourStroke,17364  
1115F632D,115EXLPT Command Thrust FourStroke,17716  
1115F642D,115ECXLPT Command Thrust FourStroke,17716  
1150F13ED,150L FourStroke,22022  
1150F23ED,150XL FourStroke,22143  
1150F24ED,150CXL FourStroke,22919  
11750005A,175L FourStroke DTS,27269  
11750006A,175XL FourStroke DTS,27401  
11750007A,175CXL FourStroke DTS,28111  
12000001A,200L FourStroke,26912  
12000009A,200XL FourStroke,27044  
12000029A,200CXL FourStroke,27731  
12000005A,200L FourStroke DTS,28760  
12000013A,200XL FourStroke DTS,28892  
12000017A,200CXL FourStroke DTS,29601  
12250001A,225L FourStroke,32307  
12250009A,225XL FourStroke,32423  
12250047A,225CXL FourStroke,33126  
12250021A,225XXL FourStroke,33094  
12250005A,225L FourStroke DTS,34194  
12250013A,225XL FourStroke DTS,34314  
12250017A,225CXL FourStroke DTS,35040  
12250025A,225XXL FourStroke DTS,35002  
12250029A,225CXXL FourStroke DTS,35728  
12500001A,250L FourStroke,34111  
12500009A,250XL FourStroke,34226  
12500083A,250CXL FourStroke,34903  
12500021A,250XXL FourStroke,35040  
12500087A,250CXXL FourStroke,35722  
12500005A,250L FourStroke DTS,36130  
12500013A,250XL FourStroke DTS,36256  
12500017A,250CXL FourStroke DTS,36954  
12500025A,250XXL FourStroke DTS,37098  
12500029A,250CXXL FourStroke DTS,37802  
13000002A,300L FourStroke,36058  
13000010A,300XL FourStroke,36168  
13000111A,300CXL FourStroke,36839  
13000006A,300L FourStroke DTS,38032  
13000014A,300XL FourStroke DTS,38159  
13000018A,300CXL FourStroke DTS,38852  
1117F131D,115ELPT Pro XS,17320  
1117F231D,115EXLPT Pro XS,17666  
1117F531D,115ELPT Pro XS Command Thrust,17765  
1117F631D,115EXLPT Pro XS Command Thrust,18117  
1152F131D,150L Pro XS,24107  
1152F231D,150XL Pro XS,24233  
11750001A,175L Pro XS,27616  
11750002A,175XL Pro XS,28006  
12000027A,200L Pro XS TorqueMaster,28122  
12000039A,200L Pro XS,28122  
12000041A,200XL Pro XS,28479  
12000035A,200L Pro XS DTS TorqueMaster,29992  
12000040A,200XL Pro XS DTS,30399  
12250033A,225L Pro XS TorqueMaster,33038  
12250034A,225XL Pro XS,33429  
12250053A,225L Pro XS DTS TorqueMaster,34612  
12250055A,225XL Pro XS DTS,35244  
12500033A,250L Pro XS TorqueMaster,34502  
12500034A,250XL Pro XS,35294  
12500094A,250L Pro XS DTS TorqueMaster,36542  
12500096A,250XL Pro XS DTS,37367  
13000022A,300L Pro XS TorqueMaster,36179  
13000023A,300XL Pro XS,36988  
13000177A,300L Pro XS DTS TorqueMaster,38170  
13000179A,300XL Pro XS DTS,39012  
13000181A,300CXL Pro XS DTS,39716`;

    const lines = csvData.trim().split('\n').slice(1); // Skip header
    return lines.map(line => {
      const [modelNumber, description, price] = line.split(',');
      return {
        modelNumber: modelNumber.trim(),
        description: description.trim(),
        price: parseInt(price.trim())
      };
    });
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
            dealer_price: exactMatch.price,
            msrp: Math.round(exactMatch.price * 1.4), // Estimate MSRP at 40% markup
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
              dealer_price: candidate.price,
              msrp: Math.round(candidate.price * 1.4),
              price_source: 'official_mercury_catalog',
              model_display: candidate.description
            });
            matchedCount++;
            console.log('🔄 Fuzzy match:', motor.model_display, '→', candidate.description);
            break; // Take first match
          }
        }
      }

      // Apply all updates
      console.log('📝 Applying', updates.length, 'updates...');
      
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

      setStats({ matched: matchedCount, total: existingMotors?.length || 0 });
      setImportComplete(true);

      toast({
        title: "Import Complete!",
        description: `Successfully updated ${matchedCount} motors with official Mercury pricing and model numbers.`,
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
            <li>• Update dealer prices with official Mercury pricing (CAD)</li>
            <li>• Calculate MSRP with standard 40% markup</li>
            <li>• Update model descriptions to match official Mercury naming</li>
            <li>• Use fuzzy matching for motors with similar descriptions</li>
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