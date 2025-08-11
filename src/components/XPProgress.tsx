// src/components/XPProgress.tsx
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { achievements } from "@/config/visualChoices";

interface XPProgressProps {
  currentXP: number;
  totalSteps: number;
  currentStep: number;
}

export default function XPProgress({ currentXP, totalSteps, currentStep }: XPProgressProps) {
  const progress = (currentStep / totalSteps) * 100;
  const nextAchievement = achievements.find(a => a.xp > currentXP);
  const xpToNext = nextAchievement ? nextAchievement.xp - currentXP : 0;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <div>
            <div className="text-sm font-bold text-gray-900">Your Progress</div>
            <div className="text-xs text-gray-600">
              {currentXP} XP earned {xpToNext > 0 && `• ${xpToNext} to ${nextAchievement?.title}`}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {[...Array(totalSteps)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${i < currentStep 
                  ? 'bg-green-500 text-white' 
                  : i === currentStep 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-gray-200 text-gray-400'
                }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* XP Bar */}
      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
      
      {/* Achievements */}
      <div className="flex gap-2 mt-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.xp}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs
              ${currentXP >= achievement.xp 
                ? 'bg-yellow-100 text-yellow-800 font-bold' 
                : 'bg-gray-100 text-gray-400'
              }`}
          >
            <span>{achievement.icon}</span>
            <span>{achievement.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
