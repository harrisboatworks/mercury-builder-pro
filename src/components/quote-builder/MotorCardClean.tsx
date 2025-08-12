import { motion } from "framer-motion";
import { Check, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Motor } from "../QuoteBuilder";
import { getPriceDisplayState } from "@/lib/pricing";
import { formatMotorTitle, formatVariantSubtitle } from "@/lib/card-title";

interface MotorCardCleanProps {
  motor: Motor;
  onSelect: (motor: Motor) => void;
  onQuickView: (motor: Motor) => void;
}

export function MotorCardClean({ motor, onSelect, onQuickView }: MotorCardCleanProps) {
  const msrp = motor.basePrice && motor.basePrice > 0 ? motor.basePrice : null;
  const sale = motor.salePrice && motor.salePrice > 0 ? motor.salePrice : null;
  const state = getPriceDisplayState(msrp, sale);

  const title = formatMotorTitle(motor.year as number, motor.model);
  const raw = `${motor.model ?? ''} ${motor.description ?? motor.specs ?? ''}`.trim();
  const subtitle = formatVariantSubtitle(raw, title);

  // Promo indicator (subtle)
  const promoBlob = `${(motor.appliedPromotions || []).join(' ')} ${(motor.bonusOffers || []).map(b => `${b.title ?? ''} ${b.shortBadge ?? ''}`).join(' ')}`;
  const hasRepower = /(repower(\s*rebate)?)/i.test(promoBlob);

  const inStock = motor.stockStatus === 'In Stock';
  const status = motor.stockStatus || 'Out of Stock';
  const statusCls = status === 'In Stock' ? 'bg-in-stock/15 text-in-stock' : status === 'On Order' ? 'bg-accent/30 text-accent-foreground' : 'bg-destructive/15 text-destructive';

  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Card className="bg-card text-card-foreground rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-visible border border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground truncate" title={title}>{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1 truncate" title={subtitle}>{subtitle}</p>
              )}
            </div>

            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusCls}`}>
              {status === 'In Stock' && <Check className="w-3 h-3" />}
              {status}
            </span>
          </div>

          {/* Image */}
          {motor.image && motor.image !== '/placeholder.svg' && (
            <div className="relative h-48 -mx-6 mb-4 bg-gradient-to-b from-muted to-background flex items-center justify-center">
              <img src={motor.image} alt={motor.model} className="w-full h-full object-contain p-4" loading="lazy" />
              <button
                type="button"
                className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-background/95 text-foreground border border-border shadow-md flex items-center justify-center opacity-95 hover:opacity-100"
                aria-label="Quick view details"
                onClick={(e) => { e.stopPropagation(); onQuickView(motor); }}
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            {!state.callForPrice && state.hasSale && msrp != null && sale != null ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground line-through">MSRP ${msrp.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-foreground">${sale.toLocaleString()}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                    SAVE ${state.savingsRounded.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-foreground">
                {state.callForPrice ? 'Call for Price' : `$${(msrp ?? motor.price).toLocaleString()}`}
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="p-6 space-y-3">
          {Array.isArray(motor.features) && motor.features.slice(0, 4).map((feature: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-foreground/90">{feature}</span>
            </div>
          ))}

          {hasRepower && (
            <div className="mt-4 p-3 rounded-lg border border-border bg-accent/40">
              <div className="flex items-center gap-2 text-sm">
                <span aria-hidden>💰</span>
                <span className="font-medium text-foreground">Repower Rebate Available</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-accent/40 border-t border-border space-y-3 mt-auto">
          <Button onClick={() => onSelect(motor)} className="w-full py-3">
            Select This Motor
          </Button>
          <Button onClick={() => onQuickView(motor)} variant="ghost" className="w-full py-2">
            <Info className="w-4 h-4 mr-2" /> Quick View Details
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
