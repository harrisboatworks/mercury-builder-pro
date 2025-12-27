import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocallyInventoryData {
  inStock: boolean;
  quantity?: number;
  price?: number;
  storeName?: string;
  lastChecked: Date;
}

interface UseLocallyInventoryOptions {
  partNumber?: string;
  upc?: string;
  enabled: boolean;
}

interface UseLocallyInventoryReturn {
  liveStock: LocallyInventoryData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLocallyInventory({
  partNumber,
  upc,
  enabled,
}: UseLocallyInventoryOptions): UseLocallyInventoryReturn {
  const [liveStock, setLiveStock] = useState<LocallyInventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!partNumber && !upc) {
      setError('No part number or UPC provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useLocallyInventory] Fetching inventory for:', { partNumber, upc });

      const { data, error: fnError } = await supabase.functions.invoke('locally-inventory', {
        body: {
          action: 'search',
          part_number: partNumber,
          upc: upc,
        },
      });

      if (fnError) {
        console.error('[useLocallyInventory] Function error:', fnError);
        throw new Error(fnError.message || 'Failed to fetch inventory');
      }

      console.log('[useLocallyInventory] Response:', data);

      if (!data?.success) {
        // Not found is not necessarily an error - just means not in Locally
        if (data?.error_code === 'not_found' || data?.error?.includes('not found')) {
          setLiveStock({
            inStock: false,
            lastChecked: new Date(),
          });
          return;
        }
        throw new Error(data?.error || 'Failed to fetch inventory');
      }

      // Extract inventory data from response
      const inventory = data.inventory;
      const products = inventory?.products || [];
      
      if (products.length > 0) {
        const product = products[0];
        setLiveStock({
          inStock: product.in_stock ?? true,
          quantity: product.quantity,
          price: product.price,
          storeName: product.store_name || 'Harris Boat Works',
          lastChecked: new Date(),
        });
      } else {
        // No products found - check stores array
        const stores = inventory?.stores || [];
        if (stores.length > 0) {
          setLiveStock({
            inStock: true,
            storeName: stores[0].name || 'Harris Boat Works',
            lastChecked: new Date(),
          });
        } else {
          setLiveStock({
            inStock: false,
            lastChecked: new Date(),
          });
        }
      }
    } catch (err) {
      console.error('[useLocallyInventory] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check inventory');
      setLiveStock(null);
    } finally {
      setIsLoading(false);
    }
  }, [partNumber, upc]);

  useEffect(() => {
    if (enabled && (partNumber || upc)) {
      fetchInventory();
    } else if (!enabled) {
      // Reset state when disabled
      setLiveStock(null);
      setError(null);
    }
  }, [enabled, partNumber, upc, fetchInventory]);

  return {
    liveStock,
    isLoading,
    error,
    refetch: fetchInventory,
  };
}
