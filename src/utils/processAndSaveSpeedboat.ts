// DEV-ONLY: Background-removal utilities require @huggingface/transformers (~21MB WASM).

export const processAndSaveSpeedboat = async (): Promise<Blob> => {
  if (!import.meta.env.DEV) {
    console.warn('[processAndSaveSpeedboat] Not available in production builds.');
    return new Blob();
  }

  const { removeBackground, loadImageFromUrl } = await import('@/lib/backgroundRemoval');

  console.log('Processing speedboat image to remove background...');
  const imageUrl = '/lovable-uploads/7c0dc81a-0fa8-4274-9b88-cf69604130dc.png';
  const imageElement = await loadImageFromUrl(imageUrl);
  const processedBlob = await removeBackground(imageElement);
  console.log('Speedboat background removed successfully');
  return processedBlob;
};
