import { removeBackground, loadImageFromUrl } from '@/lib/backgroundRemoval';

export const processAndSaveSpeedboat = async (): Promise<Blob> => {
  try {
    console.log('Processing speedboat image to remove background...');
    
    // Load the user's uploaded STV speed boat image
    const imageUrl = '/lovable-uploads/7c0dc81a-0fa8-4274-9b88-cf69604130dc.png';
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