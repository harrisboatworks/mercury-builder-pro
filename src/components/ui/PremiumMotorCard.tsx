"use client";
import { money } from "@/lib/money";
import { Badge } from "./badge";
import { useMotorMonthlyPayment } from "@/hooks/useMotorMonthlyPayment";

interface Motor {
  id: string;
  model: string;
  hp: number;
  image: string;
  msrpPrice?: number;
  salePrice?: number;
  basePrice?: number;
  price: number;
  stockStatus: string;
  promoLabels?: string[];
}

interface PremiumMotorCardProps {
  motor: Motor;
  selected?: boolean;
  onSelect: () => void;
}

export default function PremiumMotorCard({ motor, selected, onSelect }: PremiumMotorCardProps) {
  const monthlyPayment = useMotorMonthlyPayment({ 
    motorPrice: motor.salePrice || motor.basePrice || motor.price,
    minimumThreshold: 5000 
  });

  const ourPrice = motor.salePrice || motor.basePrice || motor.price;
  const msrp = motor.msrpPrice || ourPrice;
  const hasDiscount = msrp > ourPrice;

  return (
    <button 
      onClick={onSelect}
      className={`p-fade text-left w-full rounded-2xl border p-4 transition-all ${
        selected 
          ? "border-blue-600 ring-2 ring-blue-600/15 bg-blue-50/50 dark:bg-blue-950/20" 
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
        <img 
          src={motor.image} 
          alt={motor.model}
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white leading-tight">
            {motor.model.replace(/ - \d+(\.\d+)?HP$/i, '')}
          </h3>
          <Badge 
            variant={motor.stockStatus === 'In Stock' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {motor.stockStatus}
          </Badge>
        </div>
        
        <div className="text-sm p-quiet">
          {motor.hp} HP
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-sm p-muted line-through">
                {money(msrp)}
              </span>
            )}
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {money(ourPrice)}
            </span>
          </div>
          
          {monthlyPayment && (
            <div className="text-sm p-quiet">
              Approx {money(monthlyPayment.amount)}/mo OAC
            </div>
          )}
        </div>
        
        {motor.promoLabels && motor.promoLabels.length > 0 && (
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {motor.promoLabels[0]}
          </div>
        )}
      </div>
    </button>
  );
}