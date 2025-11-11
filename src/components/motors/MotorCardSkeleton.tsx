import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function MotorCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white shadow-sm rounded-lg overflow-hidden"
    >
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-3/4" /> {/* Title */}
        <Skeleton className="h-4 w-1/2" /> {/* Model number */}
        <Skeleton className="h-4 w-full" /> {/* Specs */}
        <Skeleton className="h-8 w-1/3" /> {/* Price */}
        <Skeleton className="h-10 w-full" /> {/* Button */}
      </div>
    </motion.div>
  );
}
