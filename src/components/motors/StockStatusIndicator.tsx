import { type Motor } from '@/lib/motor-helpers';

interface StockStatusIndicatorProps {
  motor?: Motor;
}

export function StockStatusIndicator({ motor }: StockStatusIndicatorProps) {
  // Only show if motor is in stock
  const isInStock = motor?.in_stock || 
                    motor?.stock_quantity > 0 || 
                    motor?.availability?.toLowerCase().includes('in stock');
  
  if (!isInStock) return null;
  
  return (
    <div className="inline-flex items-center gap-2 text-sm font-light text-gray-600 mt-2.5">
      <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
      <span>In Stock - Available Today</span>
    </div>
  );
}
