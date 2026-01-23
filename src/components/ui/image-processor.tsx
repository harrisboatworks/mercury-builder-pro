// DEV-ONLY component – shows a UI for background removal (uses heavy @huggingface/transformers).
import { useState } from 'react';
import { Button } from './button';
import { Loader2, Download } from 'lucide-react';

export const ImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const handleProcessImage = async () => {
    if (!import.meta.env.DEV) {
      console.warn('[ImageProcessor] Not available in production builds.');
      return;
    }

    setIsProcessing(true);
    try {
      const { processSpeedBoatImage } = await import('@/utils/processSpeedBoatImage');
      const processedUrl = await processSpeedBoatImage();
      setProcessedImageUrl(processedUrl);
    } catch (error) {
      console.error('Failed to process image:', error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Speed Boat Image Processor</h3>
      <div className="flex gap-2">
        <Button
          onClick={handleProcessImage}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Remove Background
            </>
          )}
        </Button>
      </div>

      {processedImageUrl && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Processed image preview:
          </p>
          <img
            src={processedImageUrl}
            alt="Processed speedboat without background"
            className="max-w-full h-auto border rounded"
          />
        </div>
      )}
    </div>
  );
};
