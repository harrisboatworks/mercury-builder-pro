import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[4px] border border-repower-navy-900/10 bg-white px-4 py-[14px] font-sans text-[15px] font-normal text-repower-navy-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-repower-navy-900/40 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-repower-gold focus-visible:shadow-[0_0_0_3px_rgba(201,162,74,0.15)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
