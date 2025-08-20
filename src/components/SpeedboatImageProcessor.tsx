import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { processSpeedboatImage, downloadProcessedImage } from '@/utils/processSpeedboatImage';
import { toast } from 'sonner';

export function SpeedboatImageProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessImage = async () => {
    setIsProcessing(true);
    try {
      toast.info('Processing speedboat image...', {
        description: 'This may take a few moments'
      });
      
      const processedBlob = await processSpeedboatImage();
      downloadProcessedImage(processedBlob);
      
      toast.success('Background removed successfully!', {
        description: 'The processed image has been downloaded'
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image', {
        description: 'Please try again or check the console for details'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <div className="font-medium">Speedboat Image</div>
          <div className="text-muted-foreground text-xs">Remove white background</div>
        </div>
        <Button 
          onClick={handleProcessImage}
          disabled={isProcessing}
          size="sm"
          variant="default"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isProcessing ? 'Processing...' : 'Process'}
        </Button>
      </div>
    </div>
  );
}