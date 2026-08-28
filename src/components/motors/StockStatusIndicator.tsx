import { type Motor } from '@/lib/motor-helpers';

interface StockStatusIndicatorProps {
  motor?: Motor;
}

export function StockStatusIndicator({ motor }: StockStatusIndicatorProps) {
  const isInStock = motor?.in_stock || 
                    motor?.stock_quantity > 0 || 
                    motor?.availability?.toLowerCase().includes('in stock');
  
  const availability = motor?.availability || '';

  // Harris physical stock
  if (isInStock) {
    const qty = motor?.stock_quantity ?? 0;
    const label = qty > 1 ? `In Stock · ${qty} available` : 'In Stock - Available Today';
    return (
      <div className="inline-flex items-center gap-2 text-sm font-light text-[#050E1C]/70 mt-2.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#C9A24A' }} />
        <span>{label}</span>
      </div>
    );
  }

  // Mercury Warehouse stock
  if (availability.includes('Mercury Warehouse')) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-light text-[#050E1C]/70 mt-2.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#C9A24A' }} />
        <span>In Stock at Mercury</span>
      </div>
    );
  }

  // Estimated availability date
  if (availability.startsWith('Est.')) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-light text-[#050E1C]/70 mt-2.5">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(10, 22, 40, 0.35)' }} />
        <span>{availability}</span>
      </div>
    );
  }

  // Brochure / factory order
  return (
    <div className="inline-flex items-center gap-2 text-sm font-light text-[#050E1C]/70 mt-2.5">
      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(10, 22, 40, 0.35)' }} />
      <span>Available to Order</span>
    </div>
  );
}
