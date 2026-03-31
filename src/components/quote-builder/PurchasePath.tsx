import { Package, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PurchasePathProps {
  selectedMotor: any;
  onSelectPath: (path: 'loose' | 'installed') => void;
}

export default function PurchasePath({ selectedMotor, onSelectPath }: PurchasePathProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* Loose Motor Tile */}
        <button
          onClick={() => onSelectPath('loose')}
          className="group relative flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border-2 border-border bg-background p-6 sm:p-10 text-center transition-all duration-200 hover:border-foreground hover:shadow-xl active:scale-[0.97] active:bg-foreground active:text-background cursor-pointer"
        >
          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-medium border border-border shadow-sm">
            Quick & Easy
          </Badge>
          <Package className="w-10 h-10 sm:w-14 sm:h-14 text-foreground/70 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          <div>
            <span className="block text-base sm:text-xl font-semibold tracking-tight text-foreground">Loose Motor</span>
            <span className="block text-xs sm:text-sm text-muted-foreground mt-1">Schedule Pickup</span>
          </div>
        </button>

        {/* Professional Install Tile */}
        <button
          onClick={() => onSelectPath('installed')}
          className="group relative flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border-2 border-border bg-background p-6 sm:p-10 text-center transition-all duration-200 hover:border-foreground hover:shadow-xl active:scale-[0.97] active:bg-foreground active:text-background cursor-pointer"
        >
          <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-medium border border-border shadow-sm">
            Full Service
          </Badge>
          <Wrench className="w-10 h-10 sm:w-14 sm:h-14 text-foreground/70 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          <div>
            <span className="block text-base sm:text-xl font-semibold tracking-tight text-foreground">Professional Install</span>
            <span className="block text-xs sm:text-sm text-muted-foreground mt-1">We handle everything</span>
          </div>
        </button>
      </div>
    </div>
  );
}
