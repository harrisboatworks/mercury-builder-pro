import { Badge } from '@/components/ui/badge';
import { Check, X, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockBadgeProps {
  motor: {
    in_stock?: boolean;
    stock_quantity?: number;
    availability?: string;
  };
  variant?: 'default' | 'compact';
  className?: string;
}

export function StockBadge({ motor, variant = 'default', className }: StockBadgeProps) {
  const isInStock = motor.in_stock === true;
  const quantity = motor.stock_quantity || 0;
  const isCompact = variant === 'compact';

  if (!isInStock) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "bg-muted text-muted-foreground border-border",
          isCompact ? "text-xs px-2 py-0" : "",
          className
        )}
      >
        <X className={cn("mr-1", isCompact ? "w-2 h-2" : "w-3 h-3")} />
        {isCompact ? "Out" : "Out of Stock"}
      </Badge>
    );
  }

  if (quantity > 1) {
    return (
      <Badge 
        className={cn(
          "bg-primary text-primary-foreground",
          isCompact ? "text-xs px-2 py-0" : "",
          className
        )}
      >
        <Package className={cn("mr-1", isCompact ? "w-2 h-2" : "w-3 h-3")} />
        {isCompact ? `${quantity}` : `${quantity} In Stock`}
      </Badge>
    );
  }

  return (
    <Badge 
      className={cn(
        "bg-primary text-primary-foreground",
        isCompact ? "text-xs px-2 py-0" : "",
        className
      )}
    >
      <Check className={cn("mr-1", isCompact ? "w-2 h-2" : "w-3 h-3")} />
      {isCompact ? "Stock" : "In Stock"}
    </Badge>
  );
}