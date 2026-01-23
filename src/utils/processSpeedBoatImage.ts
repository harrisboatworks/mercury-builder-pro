// DEV-ONLY: Background-removal utilities require @huggingface/transformers (~21MB WASM).
// Exporting a no-op stub in production to avoid pulling heavy assets into the bundle.

export const processSpeedBoatImage = async (): Promise<string> => {
  if (!import.meta.env.DEV) {
    console.warn('[processSpeedBoatImage] Not available in production builds.');
    return '';
  }

  // Lazy import so Vite can tree-shake in production
  const { removeBackground, loadImageFromUrl } = await import('@/lib/backgroundRemoval');
  const { toast } = await import('sonner');

  try {
    toast.loading('Processing speed boat image...', { id: 'bg-removal' });

    const imageUrl = '/lovable-uploads/09e4fbbd-de35-435d-bdc1-7b7fb4cf400d.png';
    const imageElement = await loadImageFromUrl(imageUrl);
    const processedBlob = await removeBackground(imageElement);
    const processedUrl = URL.createObjectURL(processedBlob);

    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = 'speedboat-no-bg.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Speed boat background removed! Download started.', { id: 'bg-removal' });
    return processedUrl;
  } catch (error) {
    console.error('Error processing speed boat image:', error);
    const { toast: t } = await import('sonner');
    t.error('Failed to remove background. Please try again.', { id: 'bg-removal' });
    throw error;
  }
};
