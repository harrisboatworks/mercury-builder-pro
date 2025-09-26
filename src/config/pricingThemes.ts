export type PriceStyle = "luxuryMinimal" | "luxuryRedAccent" | "luxuryDelta";

export interface PriceThemeConfig {
  ourPriceLabel: {
    color: string;
    fontSize: string;
    letterSpacing: string;
    textTransform: string;
  };
  priceAmount: {
    color: string;
    fontSize: {
      desktop: string;
      mobile: string;
    };
    fontWeight: string;
  };
  msrp: {
    color: string;
    fontSize: string;
    textDecoration: string;
  };
  savings: {
    color: string;
    fontSize: string;
    fontWeight: string;
    format: (savings: number) => string;
  };
}

export const PRICE_THEMES: Record<PriceStyle, PriceThemeConfig> = {
  luxuryMinimal: {
    ourPriceLabel: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "0.75rem", // 12px
      letterSpacing: "0.02em", // +2%
      textTransform: "uppercase",
    },
    priceAmount: {
      color: "hsl(0 0% 7%)", // #111111
      fontSize: {
        desktop: "1.875rem", // 30px
        mobile: "1.5rem", // 24px (increased from 18px)
      },
      fontWeight: "600",
    },
    msrp: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "1rem", // 16px (increased from 13px)
      textDecoration: "line-through",
    },
    savings: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "1rem", // 16px (increased from 14px)
      fontWeight: "400",
      format: (savings: number) => `You Save $${savings.toLocaleString()}`,
    },
  },
  luxuryRedAccent: {
    ourPriceLabel: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "0.75rem", // 12px
      letterSpacing: "0.02em", // +2%
      textTransform: "uppercase",
    },
    priceAmount: {
      color: "hsl(0 75% 30%)", // #B71C1C
      fontSize: {
        desktop: "1.875rem", // 30px
        mobile: "1.5rem", // 24px (increased from 18px)
      },
      fontWeight: "600",
    },
    msrp: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "1rem", // 16px (increased from 13px)
      textDecoration: "line-through",
    },
    savings: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "1rem", // 16px (increased from 14px)
      fontWeight: "400",
      format: (savings: number) => `You Save $${savings.toLocaleString()}`,
    },
  },
  luxuryDelta: {
    ourPriceLabel: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "0.75rem", // 12px
      letterSpacing: "0.02em", // +2%
      textTransform: "uppercase",
    },
    priceAmount: {
      color: "hsl(0 0% 7%)", // #111111
      fontSize: {
        desktop: "1.875rem", // 30px
        mobile: "1.5rem", // 24px (increased from 18px)
      },
      fontWeight: "600",
    },
    msrp: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "1rem", // 16px (increased from 13px)
      textDecoration: "line-through",
    },
    savings: {
      color: "hsl(218 11% 42%)", // #6C757D
      fontSize: "1rem", // 16px (increased from 14px)
      fontWeight: "400",
      format: (savings: number) => `–$${savings.toLocaleString()} vs MSRP`,
    },
  },
};

export function getPriceThemeConfig(priceStyle: PriceStyle): PriceThemeConfig {
  return PRICE_THEMES[priceStyle];
}

export function getPriceThemeClasses(priceStyle: PriceStyle) {
  const config = getPriceThemeConfig(priceStyle);
  
  return {
    ourPriceLabel: `text-[${config.ourPriceLabel.color}] text-[${config.ourPriceLabel.fontSize}] tracking-[${config.ourPriceLabel.letterSpacing}] uppercase`,
    priceAmount: `text-[${config.priceAmount.color}] text-[${config.priceAmount.fontSize.mobile}] md:text-[${config.priceAmount.fontSize.desktop}] font-[${config.priceAmount.fontWeight}]`,
    msrp: `text-[${config.msrp.color}] text-[${config.msrp.fontSize}] line-through`,
    savings: `text-[${config.savings.color}] text-[${config.savings.fontSize}] font-[${config.savings.fontWeight}]`,
  };
}