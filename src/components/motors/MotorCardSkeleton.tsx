import { motion } from "framer-motion";

export function MotorCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden"
    >
      {/* Image skeleton with shimmer */}
      <div className="relative h-48 md:h-72 bg-gradient-to-b from-stone-100 to-stone-50 animate-shimmer" />
      
      {/* Content skeleton */}
      <div className="border-t border-gray-200" />
      <div className="p-8 space-y-4">
        <div className="h-6 w-3/4 bg-stone-100 rounded animate-shimmer" />
        <div className="h-4 w-1/2 bg-stone-100 rounded animate-shimmer" />
        <div className="h-4 w-full bg-stone-100 rounded animate-shimmer" />
        <div className="mt-6">
          <div className="h-3 w-12 bg-stone-100 rounded animate-shimmer" />
          <div className="h-8 w-1/3 bg-stone-100 rounded animate-shimmer mt-2" />
        </div>
        <div className="h-4 w-2/3 bg-stone-100 rounded animate-shimmer" />
        <div className="h-12 w-full bg-stone-100 rounded-sm animate-shimmer mt-6" />
      </div>
    </motion.div>
  );
}
