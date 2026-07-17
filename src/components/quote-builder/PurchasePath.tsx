import { Check, Package, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Motor } from "@/components/QuoteBuilder";

interface PurchasePathProps {
  selectedMotor: Motor;
  selectedPath?: 'loose' | 'installed' | null;
  onSelectPath: (path: 'loose' | 'installed') => void;
}

export default function PurchasePath({ selectedMotor, selectedPath, onSelectPath }: PurchasePathProps) {
  const formattedPrice = typeof selectedMotor?.price === 'number'
    ? `$${selectedMotor.price.toLocaleString('en-CA')} CAD`
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <section
        aria-label="Selected motor"
        className="flex items-center gap-4 rounded-lg border border-repower-navy-900/10 bg-white p-4"
      >
        {selectedMotor?.image && (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-white p-2">
            <img
              src={selectedMotor.image}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-repower-navy-900/55">
            Your configured motor
          </p>
          <h2 className="mt-1 truncate font-display text-lg font-semibold text-repower-navy-900">
            {selectedMotor?.model || 'Mercury outboard'}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-repower-navy-900/65">
            {selectedMotor?.hp && <span>{selectedMotor.hp} HP</span>}
            {formattedPrice && <span className="font-semibold text-repower-navy-900">{formattedPrice}</span>}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* Loose Motor Tile */}
        <button
          type="button"
          onClick={() => onSelectPath('loose')}
          aria-pressed={selectedPath === 'loose'}
          className={cn(
            "group relative flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-xl border-2 bg-white p-5 text-center transition-all duration-200 hover:border-repower-navy-900 hover:shadow-lg active:scale-[0.98] sm:gap-4 sm:p-8",
            selectedPath === 'loose'
              ? 'border-repower-mercury-red ring-2 ring-repower-mercury-red/15'
              : 'border-repower-navy-900/15'
          )}
        >
          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-medium border border-border shadow-sm">
            Quick & Easy
          </Badge>
          <Package className="w-10 h-10 sm:w-14 sm:h-14 text-foreground/70 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          <div>
            <span className="block text-base sm:text-xl font-semibold tracking-tight text-foreground">Loose Motor</span>
            <span className="block text-xs sm:text-sm text-muted-foreground mt-1">Pickup the motor and handle installation yourself.</span>
          </div>
          {selectedPath === 'loose' && (
            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-repower-mercury-red text-white" aria-hidden="true">
              <Check className="h-4 w-4" />
            </span>
          )}
        </button>

        {/* Professional Install Tile */}
        <button
          type="button"
          onClick={() => onSelectPath('installed')}
          aria-pressed={selectedPath === 'installed'}
          className={cn(
            "group relative flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-xl border-2 bg-white p-5 text-center transition-all duration-200 hover:border-repower-navy-900 hover:shadow-lg active:scale-[0.98] sm:gap-4 sm:p-8",
            selectedPath === 'installed'
              ? 'border-repower-mercury-red ring-2 ring-repower-mercury-red/15'
              : 'border-repower-navy-900/15'
          )}
        >
          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-medium border border-border shadow-sm">
            Full Service
          </Badge>
          <Wrench className="w-10 h-10 sm:w-14 sm:h-14 text-foreground/70 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          <div>
            <span className="block text-base sm:text-xl font-semibold tracking-tight text-foreground">Professional Install</span>
            <span className="block text-xs sm:text-sm text-muted-foreground mt-1">HBW rigs, installs, and water-tests your boat.</span>
          </div>
          {selectedPath === 'installed' && (
            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-repower-mercury-red text-white" aria-hidden="true">
              <Check className="h-4 w-4" />
            </span>
          )}
        </button>
      </div>
      <p className="text-center text-xs leading-relaxed text-repower-navy-900/55">
        Not sure? Choose professional install and we’ll confirm fit, rigging, controls, and final scope before work begins.
      </p>
    </div>
  );
}
