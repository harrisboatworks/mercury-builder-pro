import QuoteBuilder from '@/components/quote-builder/QuoteBuilder';
import { StatusIndicator } from '@/components/StatusIndicator';

const Index = () => {
  return (
    <>
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <StatusIndicator />
      </div>
      <QuoteBuilder />
    </>
  );
};

export default Index;
