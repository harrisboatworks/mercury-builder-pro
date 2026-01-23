// DEV-ONLY: Background-removal utilities require @huggingface/transformers (~21MB WASM).

export const processHarrisLogoBackground = async (): Promise<string> => {
  if (!import.meta.env.DEV) {
    console.warn('[processHarrisLogoBackground] Not available in production builds.');
    return '/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png';
  }

  try {
    const { removeBackground, loadImageFromUrl } = await import('@/lib/backgroundRemoval');
    const img = await loadImageFromUrl('/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png');
    const processedBlob = await removeBackground(img);
    const processedUrl = URL.createObjectURL(processedBlob);
    console.log('Harris logo background removed successfully');
    return processedUrl;
  } catch (error) {
    console.error('Failed to process Harris logo:', error);
    return '/lovable-uploads/bdce50a1-2d19-4696-a2ec-6b67379cbe23.png';
  }
};
