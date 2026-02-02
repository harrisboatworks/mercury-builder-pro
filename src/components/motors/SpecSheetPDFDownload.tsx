import React, { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import { CleanSpecSheetPDF } from './CleanSpecSheetPDF';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpecSheetPDFDownloadProps {
  motor: any;
  promotions: any[];
  motorModel: string;
  className?: string;
}

export function SpecSheetPDFDownload({ 
  motor, 
  promotions, 
  motorModel,
  className = "w-full border border-gray-300 text-gray-700 py-3 px-4 text-sm font-medium rounded-sm hover:bg-stone-50 transition-all duration-300 flex items-center justify-center gap-2"
}: SpecSheetPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Fetch insights from Perplexity via edge function
      let insights: string[] = [];
      
      try {
        const { data: insightsData, error: insightsError } = await supabase.functions.invoke(
          'generate-spec-sheet-insights',
          {
            body: {
              motor: {
                hp: motor?.horsepower || motor?.hp,
                model: motor?.model || motorModel,
                family: motor?.family || 'FourStroke'
              }
            }
          }
        );
        
        if (!insightsError && insightsData?.insights) {
          insights = insightsData.insights;
          console.log('Fetched spec sheet insights:', insightsData.source);
        }
      } catch (insightError) {
        console.error('Failed to fetch insights:', insightError);
        // Continue without insights - they're optional
      }

      // Generate PDF with insights
      const motorData = {
        motor,
        promotions,
        motorModel,
        insights
      };

      const blob = await pdf(<CleanSpecSheetPDF motorData={motorData} />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(motor?.model || motorModel).replace(/\s+/g, '-')}-Specifications.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Spec sheet downloaded!');
    } catch (error) {
      console.error('Failed to generate spec sheet:', error);
      toast.error('Failed to generate spec sheet');
    } finally {
      setIsGenerating(false);
    }
  }, [motor, promotions, motorModel]);

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download Spec Sheet
        </>
      )}
    </button>
  );
}
