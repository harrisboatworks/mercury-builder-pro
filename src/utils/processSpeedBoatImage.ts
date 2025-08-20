import { removeBackground, loadImageFromUrl } from '@/lib/backgroundRemoval';
import { toast } from 'sonner';

export const processSpeedBoatImage = async (): Promise<string> => {
  try {
    toast.loading('Processing speed boat image...', { id: 'bg-removal' });
    
    // Load the user's uploaded speed boat image
    const imageUrl = '/lovable-uploads/09e4fbbd-de35-435d-bdc1-7b7fb4cf400d.png';
    const imageElement = await loadImageFromUrl(imageUrl);
    
    // Remove the background
    const processedBlob = await removeBackground(imageElement);
    
    // Create a URL for the processed image
    const processedUrl = URL.createObjectURL(processedBlob);
    
    // Create a download link for the processed image
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = 'speedboat-no-bg.png';
    
    // Save the processed image
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Speed boat background removed! Download started.', { id: 'bg-removal' });
    
    return processedUrl;
  } catch (error) {
    console.error('Error processing speed boat image:', error);
    toast.error('Failed to remove background. Please try again.', { id: 'bg-removal' });
    throw error;
  }
};