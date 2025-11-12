import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useHapticFeedback } from "@/hooks/useHapticFeedback"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 active:brightness-95",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 active:brightness-95",
        outline:
          "border border-input bg-background hover:opacity-90 active:bg-gray-50 active:border-gray-400",
        secondary:
          "bg-secondary text-secondary-foreground hover:opacity-90 active:brightness-95",
        ghost: "hover:opacity-80 active:bg-gray-100",
        link: "text-primary underline-offset-4 hover:underline active:opacity-70",
        luxury: "bg-slate-900 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.97] active:brightness-90",
        premiumCta: "bg-[hsl(var(--cta-navy))] text-white font-medium rounded-lg shadow-sm transition-all duration-200 touch-manipulation min-h-[44px] hover:opacity-90 active:scale-[0.97] active:bg-[hsl(var(--cta-navy-active))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--cta-navy))] focus-visible:ring-offset-2",
        luxuryConfigure: "bg-[hsl(var(--luxury-black))] text-[hsl(var(--luxury-white))] font-normal rounded-none shadow-sm hover:opacity-90 transition-all duration-300 text-[15px] md:text-sm py-3 md:py-4 px-4 min-h-[48px] tracking-normal active:scale-[0.97] active:brightness-90",
        luxuryModern: "bg-[hsl(var(--luxury-black))] text-[hsl(var(--luxury-white))] font-medium rounded-[10px] shadow-sm hover:opacity-90 active:scale-[0.97] active:bg-[#000814] transition-all duration-200 min-h-[48px] px-4 py-3 text-[15px] md:text-[16px]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const { triggerHaptic } = useHapticFeedback();
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger light haptic on mobile
      triggerHaptic('light');
      onClick?.(e);
    };
    
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
