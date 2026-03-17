// src/components/OptionGallery.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { useSound } from '@/contexts/SoundContext';

export type Choice = {
  id: string;
  label: string;
  image: string;
  value: string;
  helper?: string;
  xpReward?: number;
  badge?: string;
  price?: number;
  priceLabel?: string;
  recommendedPackage?: string;
};

interface OptionGalleryProps {
  title: string;
  choices: Choice[];
  value?: string;
  onChange: (val: string) => void;
  recommended?: string;
}

export default function OptionGallery({
  title, choices, value, onChange, recommended
}: OptionGalleryProps) {
  const [hover, setHover] = useState<string | null>(null);
  const { playTick } = useSound();

  const handleSelect = (choice: Choice) => {
    playTick();
    onChange(choice.value);
  };

  return (
    <section className="my-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold tracking-wide text-foreground">{title}</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {choices.map((choice) => {
            const selected = choice.value === value;
            const isRecommended = !selected && choice.value === recommended;
            
            return (
              <button
                key={choice.id}
                onMouseEnter={() => setHover(choice.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => handleSelect(choice)}
                className={`
                  relative text-left rounded-xl overflow-hidden transition-all duration-200 active:scale-[0.98] bg-white
                  ${selected 
                    ? 'ring-2 ring-foreground ring-offset-2 shadow-lg' 
                    : isRecommended
                      ? 'border-2 border-primary/50 shadow-md'
                      : 'border border-border'
                  }
                `}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-white">
                  <img 
                    src={choice.image} 
                    alt={choice.label}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badge */}
                  {choice.badge && (
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-foreground text-background px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3 hidden sm:block" />
                      {choice.badge}
                    </div>
                  )}
                  
                  {/* Price Badge */}
                  {choice.priceLabel && (
                    <div className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium shadow-lg ${
                      choice.price === 0 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-gray-900 border border-gray-300'
                    }`}>
                      {choice.priceLabel}
                    </div>
                  )}
                  
                  {/* Selected Checkmark */}
                  {selected && (
                    <div className="absolute bottom-2 right-2 bg-foreground text-background rounded-full p-1.5 sm:p-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-2.5 sm:p-4 bg-white">
                  <div className="font-medium tracking-wide text-foreground text-sm sm:text-base">{choice.label}</div>
                  {choice.helper && (
                    <div className="text-xs sm:text-sm text-gray-700 font-normal mt-0.5 sm:mt-1">{choice.helper}</div>
                  )}
                </div>
              </button>
            );
          })}
      </div>
    </section>
  );
}
