import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useFinancing } from '@/contexts/FinancingContext';

export default function FinancingSuccess() {
  const navigate = useNavigate();
  const { state } = useFinancing();

  useEffect(() => {
    // Clear localStorage after successful submission
    localStorage.removeItem('financingApplication');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Application Submitted!
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Thank you for submitting your financing application. Your application reference number is:
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-8 inline-block">
            <code className="text-lg font-mono text-foreground">
              {state.applicationId?.slice(0, 8).toUpperCase() || 'PENDING'}
            </code>
          </div>

          <div className="space-y-6 text-left mb-8">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">What Happens Next?</h2>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="font-bold text-foreground mr-2">1.</span>
                  <span>Our financing team will review your application within 24-48 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-foreground mr-2">2.</span>
                  <span>We may contact you for additional information if needed</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-foreground mr-2">3.</span>
                  <span>You'll receive an email with the financing decision and next steps</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold text-foreground mr-2">4.</span>
                  <span>Once approved, we'll help you finalize your motor purchase</span>
                </li>
              </ol>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-2">Questions?</h3>
              <p className="text-muted-foreground text-sm">
                Contact our financing team at{' '}
                <a href="tel:1-800-555-0123" className="text-primary hover:underline">
                  1-800-555-0123
                </a>
                {' '}or{' '}
                <a href="mailto:financing@harrisboatworks.com" className="text-primary hover:underline">
                  financing@harrisboatworks.com
                </a>
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Return Home
            </button>
            <button
              onClick={() => navigate('/quote/new')}
              className="px-6 py-2 border border-border rounded-md hover:bg-muted"
            >
              Get Another Quote
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
