import { Button } from "@/components/ui/button";

interface MobileStickyCTAProps {
  onAction: () => void;
  label: string;
  price?: string;
  className?: string;
}

export const MobileStickyCTA = ({ onAction, label, price, className = "" }: MobileStickyCTAProps) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 p-4 bg-black/95 backdrop-blur-sm border-t border-zinc-700 md:hidden ${className}`}>
      <div className="max-w-screen-sm mx-auto">
        {price && (
          <div className="text-center text-gray-300 text-sm mb-2">
            {price}
          </div>
        )}
        <Button 
          onClick={onAction}
          className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-xl text-white font-semibold text-lg min-h-[44px]"
        >
          {label}
        </Button>
      </div>
    </div>
  );
};