import { type Motor } from '@/lib/motor-helpers';

interface StockStatusIndicatorProps {
  motor?: Motor;
}

export function StockStatusIndicator({ motor }: StockStatusIndicatorProps) {
  const isInStock = motor?.in_stock || 
                    motor?.stock_quantity > 0 || 
                    motor?.availability?.toLowerCase().includes('in stock');
  
  const availability = motor?.availability || '';

  // Harris physical stock - Green
  if (isInStock) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-light text-gray-600 mt-2.5">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
        <span>In Stock - Available Today</span>
      </div>
    );
  }

  // Mercury Warehouse stock - Amber
  if (availability.includes('Mercury Warehouse')) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-light text-gray-600 mt-2.5">
        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full" />
        <span>In Stock at Mercury</span>
      </div>
    );
  }

  // Estimated availability date - Gray
  if (availability.startsWith('Est.')) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-light text-gray-600 mt-2.5">
        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" />
        <span>{availability}</span>
      </div>
    );
  }

  // Brochure / factory order
  return (
    <div className="inline-flex items-center gap-2 text-sm font-light text-gray-600 mt-2.5">
      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" />
      <span>Available to Order</span>
    </div>
  );
}
