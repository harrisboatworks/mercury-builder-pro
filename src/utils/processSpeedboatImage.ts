import { removeBackground, loadImageFromUrl } from '@/lib/backgroundRemoval';

export const processSpeedboatImage = async (): Promise<Blob> => {
  const speedboatImageUrl = '/lovable-uploads/e00f8c7f-fcf6-48a9-b1ee-5c2478f26d84.png';
  
  try {
    console.log('Loading speedboat image...');
    const imageElement = await loadImageFromUrl(speedboatImageUrl);
    
    console.log('Removing background from speedboat image...');
    const processedBlob = await removeBackground(imageElement);
    
    console.log('Background removal completed successfully');
    return processedBlob;
  } catch (error) {
    console.error('Error processing speedboat image:', error);
    throw error;
  }
};

export const downloadProcessedImage = (blob: Blob, filename: string = 'speedboat-no-bg.png') => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};