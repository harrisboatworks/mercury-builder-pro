import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldSkeleton } from "./FormFieldSkeleton";

export function FinancingApplicationSkeleton() {
  return (
    <div className="min-h-screen bg-repower-paper">
      <div className="h-[72px] bg-repower-navy-900" />
      <div className="mx-auto max-w-[1180px] px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-4">
          <Skeleton className="h-3 w-44 rounded-none" />
          <Skeleton className="h-12 w-full max-w-lg rounded-none" />
          <Skeleton className="h-5 w-full max-w-2xl rounded-none" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[285px_minmax(0,1fr)] lg:gap-8">
          <div className="hidden h-[560px] rounded-sm bg-repower-navy-900 lg:block" />
          <div>
            <Skeleton className="mb-4 h-20 w-full rounded-sm" />
            <Card className="rounded-sm border-repower-navy-900/10 bg-white p-4 sm:p-7 md:p-9">
              <div className="animate-pulse space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64 rounded-none" />
                  <Skeleton className="h-4 w-full max-w-md rounded-none" />
                </div>
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                </div>
                <FormFieldSkeleton />
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-12 w-24 rounded-none" />
                  <Skeleton className="h-12 flex-1 rounded-none" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
