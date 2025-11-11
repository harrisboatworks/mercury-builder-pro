import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldSkeleton } from "./FormFieldSkeleton";

export function FinancingApplicationSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-4 md:py-8 px-4">
      <div className="max-w-2xl mx-auto pb-24 md:pb-8">
        {/* Progress Header Skeleton */}
        <div className="mb-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-2 flex-1" />
            ))}
          </div>
        </div>

        {/* Form Skeleton */}
        <Card className="p-4 sm:p-6 md:p-8">
          <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            
            <FormFieldSkeleton />
            
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
