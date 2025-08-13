import { removeBackground, loadImageFromUrl } from '@/lib/backgroundRemoval';

export const processHarrisLogoBackground = async (): Promise<string> => {
  try {
    // Load the original Harris logo
    const img = await loadImageFromUrl('/lovable-uploads/f90cad3b-0db1-4a32-8b72-94f9e07a064d.png');
    
    // Remove the background
    const processedBlob = await removeBackground(img);
    
    // Create a blob URL for the processed image
    const processedUrl = URL.createObjectURL(processedBlob);
    
    console.log('Harris logo background removed successfully');
    return processedUrl;
    
  } catch (error) {
    console.error('Failed to process Harris logo:', error);
    // Fallback to original image if processing fails
    return '/lovable-uploads/f90cad3b-0db1-4a32-8b72-94f9e07a064d.png';
  }
};