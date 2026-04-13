import { cn } from '@/lib/utils';
import { getPriceDisplayState, getDisplayPrices } from '@/lib/pricing';
import { getPriceThemeConfig, type PriceStyle } from '@/config/pricingThemes';

interface LuxuryPriceDisplayProps {
  msrp?: number | null;
  salePrice?: number | null;
  priceStyle?: PriceStyle;
  showSavings?: boolean;
  className?: string;
  inflateEqualPrices?: boolean;
}

export function LuxuryPriceDisplay({ 
  msrp, 
  salePrice, 
  priceStyle = "luxuryMinimal",
  showSavings = true,
  className,
  inflateEqualPrices = false
}: LuxuryPriceDisplayProps) {
  const priceState = getPriceDisplayState(msrp, salePrice, inflateEqualPrices);
  const themeConfig = getPriceThemeConfig(priceStyle);
  
  if (priceState.callForPrice) {
    return (
      <div className={cn("space-y-1", className)}>
        <p 
          className="font-light"
          style={{
            color: themeConfig.priceAmount.color,
            fontSize: themeConfig.priceAmount.fontSize.mobile,
            fontWeight: themeConfig.priceAmount.fontWeight,
          }}
        >
          Call for Price
        </p>
      </div>
    );
  }
  // Use shared display helper for consistent MSRP/price resolution
  const dp = getDisplayPrices(msrp, salePrice);
  const displayPrice = dp.displayPrice;
  const showMSRP = dp.showMsrp;

  return (
    <div className={cn("space-y-1", className)}>
      {/* MSRP (if showing sale price) */}
      {showMSRP && dp.displayMsrp && (
        <p 
          style={{
            color: themeConfig.msrp.color,
            fontSize: themeConfig.msrp.fontSize,
            textDecoration: themeConfig.msrp.textDecoration,
          }}
        >
          MSRP ${dp.displayMsrp.toLocaleString()}
        </p>
      )}
      
      {/* OUR PRICE Label */}
      {displayPrice && (
        <p 
          style={{
            color: themeConfig.ourPriceLabel.color,
            fontSize: themeConfig.ourPriceLabel.fontSize,
            letterSpacing: themeConfig.ourPriceLabel.letterSpacing,
            textTransform: themeConfig.ourPriceLabel.textTransform as any,
          }}
        >
          Our Price
        </p>
      )}
      
      {/* Main Price */}
      {displayPrice && (
        <p 
          className="md:text-[1.5rem] text-[1.125rem]"
          style={{
            color: themeConfig.priceAmount.color,
            fontWeight: themeConfig.priceAmount.fontWeight,
          }}
        >
          ${displayPrice.toLocaleString()}
        </p>
      )}
      
      {/* Savings Line */}
      {showSavings && dp.showSavings && dp.savingsRounded > 0 && (
        <p 
          style={{
            color: themeConfig.savings.color,
            fontSize: themeConfig.savings.fontSize,
            fontWeight: themeConfig.savings.fontWeight,
          }}
        >
          {themeConfig.savings.format(dp.savingsRounded)}
        </p>
      )}
    </div>
  );
}