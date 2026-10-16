import { Button } from '@/components/ui/button';

export function QuoteReviewAction({ onReview }: { onReview: () => void }) {
  return (
    <div className="space-y-2">
      <Button onClick={onReview} className="h-auto min-h-12 w-full whitespace-normal px-4 py-3 text-center">
        Have HBW Review My Quote
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No payment required. Choose how you'd like us to reply.
      </p>
    </div>
  );
}
