import { removeBackground, loadImageFromUrl } from '@/lib/backgroundRemoval';

export const processAndSaveSpeedboat = async (): Promise<Blob> => {
  try {
    console.log('Processing speedboat image to remove background...');
    
    // Load the user's uploaded speed boat image
    const imageUrl = '/lovable-uploads/09e4fbbd-de35-435d-bdc1-7b7fb4cf400d.png';
    const imageElement = await loadImageFromUrl(imageUrl);
    
    // Remove the background
    const processedBlob = await removeBackground(imageElement);
    
    console.log('Speedboat background removed successfully');
    return processedBlob;
  } catch (error) {
    console.error('Error processing speedboat image:', error);
    throw error;
  }
};