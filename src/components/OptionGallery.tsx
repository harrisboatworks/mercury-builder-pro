// src/components/OptionGallery.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type Choice = {
  id: string;
  label: string;
  image: string;
  value: string;
  helper?: string;
  xpReward?: number;
  badge?: string;
};

interface OptionGalleryProps {
  title: string;
  choices: Choice[];
  value?: string;
  onChange: (val: string, xp: number) => void;
  currentXP?: number;
}

export default function OptionGallery({
  title, choices, value, onChange, currentXP = 0
}: OptionGalleryProps) {
  const [hover, setHover] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelect = (choice: Choice) => {
    onChange(choice.value, choice.xpReward || 0);
    
    // XP toast animation
    if (choice.xpReward) {
      toast({
        title: `+${choice.xpReward} XP`,
        description: choice.badge ? `🏅 ${choice.badge} unlocked!` : "Nice choice!",
        duration: 2000,
      });
    }
  };

  return (
    <section className="my-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#2A4D69]">{title}</h3>
        {currentXP > 0 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-bold text-yellow-800">{currentXP} XP</span>
          </motion.div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {choices.map((choice) => {
            const selected = choice.value === value;
            const isHover = hover === choice.id;
            
            return (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setHover(choice.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => handleSelect(choice)}
                className={`
                  relative text-left rounded-2xl overflow-hidden transition-all duration-300
                  ${selected 
                    ? 'ring-4 ring-green-500 ring-offset-2 shadow-xl' 
                    : 'border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg'
                  }
                `}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={choice.image} 
                    alt={choice.label}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay on hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHover ? 1 : 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
                  />
                  
                  {/* XP Badge */}
                  {choice.xpReward && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: selected ? 1.2 : 1 }}
                      className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold"
                    >
                      +{choice.xpReward} XP
                    </motion.div>
                  )}
                  
                  {/* Badge */}
                  {choice.badge && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {choice.badge}
                    </div>
                  )}
                  
                  {/* Selected Checkmark */}
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4 bg-white">
                  <div className="font-bold text-gray-900">{choice.label}</div>
                  {choice.helper && (
                    <div className="text-sm text-gray-600 mt-1">{choice.helper}</div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
