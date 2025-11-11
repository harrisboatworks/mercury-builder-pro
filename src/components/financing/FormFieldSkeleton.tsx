import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

interface FormFieldSkeletonProps {
  label?: string;
  count?: number;
}

export function FormFieldSkeleton({ label, count = 1 }: FormFieldSkeletonProps) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-muted-foreground">{label}</Label>}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function FormSectionSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormGridSkeleton({ columns = 2 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
      {Array.from({ length: columns }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
    </div>
  );
}
