import { removeBackground, loadImageFromUrl } from '@/lib/backgroundRemoval';

export const processHarrisLogoBackground = async (): Promise<string> => {
  try {
    // Load the original Harris logo
    const img = await loadImageFromUrl('/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png');
    
    // Remove the background
    const processedBlob = await removeBackground(img);
    
    // Create a blob URL for the processed image
    const processedUrl = URL.createObjectURL(processedBlob);
    
    console.log('Harris logo background removed successfully');
    return processedUrl;
    
  } catch (error) {
    console.error('Failed to process Harris logo:', error);
    // Fallback to original image if processing fails
    return '/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png';
  }
};