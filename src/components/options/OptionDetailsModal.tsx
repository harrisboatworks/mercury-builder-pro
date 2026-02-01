import { Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import type { MotorOption } from '@/hooks/useMotorOptions';

interface OptionDetailsModalProps {
  option: MotorOption | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function OptionDetailsModal({
  option,
  isOpen,
  onClose,
  isSelected,
  onToggle,
  disabled = false,
}: OptionDetailsModalProps) {
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();

  if (!option) return null;

  const effectivePrice = option.is_included ? 0 : (option.price_override ?? option.base_price);
  const features = option.features || [];

  const handleToggle = () => {
    if (disabled) return;
    triggerHaptic('addedToQuote');
    onToggle();
    onClose();
  };

  const content = (
    <div className="space-y-4">
      {/* Product Image */}
      {option.image_url && (
        <div className="rounded-lg overflow-hidden bg-muted -mx-4 md:mx-0">
          <AspectRatio ratio={16 / 9}>
            <img 
              src={option.image_url} 
              alt={option.name}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
        </div>
      )}

      {/* Product Info */}
      <div className="space-y-3">
        {/* Part Number */}
        {option.part_number && (
          <p className="text-sm text-muted-foreground">
            Part #: {option.part_number}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {option.is_included ? (
            <Badge variant="secondary" className="text-base">Included</Badge>
          ) : (
            <>
              <span className="text-2xl font-bold">${effectivePrice.toFixed(2)}</span>
              {option.msrp && option.msrp > effectivePrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${option.msrp.toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Description */}
        {option.short_description && (
          <p className="text-muted-foreground">
            {option.short_description}
          </p>
        )}

        {/* Features List */}
        {features.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Features</h4>
            <ul className="space-y-1.5">
              {features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Category Badge */}
        <div className="pt-2">
          <Badge variant="outline" className="capitalize">
            {option.category}
          </Badge>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Button 
          onClick={handleToggle}
          disabled={disabled}
          className="w-full"
          variant={isSelected ? 'outline' : 'default'}
          size="lg"
        >
          {disabled ? (
            'Required Item'
          ) : isSelected ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Remove from Quote
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Add to Quote
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Mobile: Render as Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">{option.name}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Render as Dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{option.name}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
