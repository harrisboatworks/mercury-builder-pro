import { Button } from "@/components/ui/button";

interface MobileStickyCTAProps {
  onAction: () => void;
  label: string;
  price?: string;
  className?: string;
}

export const MobileStickyCTA = ({ onAction, label, price, className = "" }: MobileStickyCTAProps) => {
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 p-4 bg-black/95 backdrop-blur md:hidden ${className}`}>
      <div className="flex gap-2 items-center">
        {price && (
          <div className="text-white">
            <div className="text-xs text-gray-300">Your Build</div>
            <div className="text-xl font-bold">{price}</div>
          </div>
        )}
        <Button 
          onClick={onAction}
          className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-white min-h-[44px]"
        >
          {label}
        </Button>
      </div>
    </div>
  );
};