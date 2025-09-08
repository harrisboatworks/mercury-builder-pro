import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusIndicator } from '@/components/StatusIndicator';
import { MobileQuoteForm } from '@/components/ui/mobile-quote-form';
import { MobileStickyCTA } from '@/components/ui/mobile-sticky-cta';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, RotateCcw, ArrowRight } from 'lucide-react';

const Index = () => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const navigate = useNavigate();
  const hasChecked = useRef(false);
  const { state, isQuoteComplete, getQuoteCompletionStatus, clearQuote } = useQuote();

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    console.log('🔄 Index: Checking quote status...');
    
    // Wait for context to load
    if (state.isLoading) {
      return;
    }
    
    const completionStatus = getQuoteCompletionStatus();
    const hasExistingQuote = completionStatus.hasMotor;
    
    if (hasExistingQuote) {
      console.log('📋 Found existing quote, showing landing options');
      setShowLanding(true);
    } else {
      console.log('🆕 No existing quote, redirecting to motor selection');
      navigate('/quote/motor-selection');
    }
  }, [navigate, state.isLoading, getQuoteCompletionStatus]);

  const handleContinueQuote = () => {
    const completionStatus = getQuoteCompletionStatus();
    
    if (completionStatus.isComplete) {
      navigate('/quote/summary');
    } else if (completionStatus.hasPath) {
      // Navigate to appropriate next step
      if (state.purchasePath === 'installed' && !completionStatus.hasRequiredInfo) {
        navigate('/quote/boat-info');
      } else if (!state.completedSteps.includes(4)) {
        navigate('/quote/trade-in');
      } else {
        navigate('/quote/summary');
      }
    } else {
      navigate('/quote/purchase-path');
    }
  };

  const handleStartFresh = () => {
    clearQuote();
    navigate('/quote/motor-selection');
  };

  const getQuoteSummary = () => {
    if (!state.motor) return null;
    
    return {
      motorInfo: `${state.motor.year} Mercury ${state.motor.hp}HP ${state.motor.model}`,
      pathBadge: state.purchasePath === 'installed' ? 'Installed' : 'Loose Motor',
      boatInfo: state.boatInfo ? `${state.boatInfo.make} ${state.boatInfo.model} (${state.boatInfo.length})` : null
    };
  };

  if (state.isLoading) {
    return (
      <>
        <div className="container mx-auto px-4 py-2 flex justify-end">
          <StatusIndicator />
        </div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading Mercury Quote Builder...</p>
          </div>
        </div>
      </>
    );
  }

  if (!showLanding) {
    // Still redirecting
    return (
      <>
        <div className="container mx-auto px-4 py-2 flex justify-end">
          <StatusIndicator />
        </div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading Mercury Quote Builder...</p>
          </div>
        </div>
      </>
    );
  }

  const quoteSummary = getQuoteSummary();
  const completionStatus = getQuoteCompletionStatus();

  return (
    <>
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <StatusIndicator />
      </div>
      
      {/* Quote Landing Page */}
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome Back to Harris Boat Works
              </h1>
              <p className="text-lg text-muted-foreground">
                You have a quote in progress. What would you like to do?
              </p>
            </div>

            {/* Current Quote Card */}
            {quoteSummary && (
              <Card className="mb-8 border-2 border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Current Quote
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{quoteSummary.motorInfo}</p>
                      <p className="text-sm text-muted-foreground">
                        Purchase Type: <span className="font-medium">{quoteSummary.pathBadge}</span>
                      </p>
                      {quoteSummary.boatInfo && (
                        <p className="text-sm text-muted-foreground">
                          Boat: <span className="font-medium">{quoteSummary.boatInfo}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        completionStatus.isComplete 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {completionStatus.isComplete ? 'Complete' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleContinueQuote}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ArrowRight className="w-8 h-8 text-primary" />
                    <span className="text-sm text-muted-foreground">Recommended</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Continue Your Quote</h3>
                  <p className="text-muted-foreground mb-4">
                    {completionStatus.isComplete 
                      ? "Review and finalize your completed quote"
                      : "Pick up where you left off and complete your configuration"
                    }
                  </p>
                  <Button className="w-full">
                    {completionStatus.isComplete ? "View Quote" : "Continue"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartFresh}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <RotateCcw className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Start Fresh</h3>
                  <p className="text-muted-foreground mb-4">
                    Clear your current quote and start over with a new motor selection
                  </p>
                  <Button variant="outline" className="w-full">
                    New Quote
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Additional Options */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Need help? Our service team is here to assist you.
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <a href="tel:+1234567890">Call Us</a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href="mailto:sales@harrisboatworks.com">Email Us</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Mobile Components */}
      <MobileStickyCTA onQuoteClick={() => setShowQuoteForm(true)} />
      <MobileQuoteForm 
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
      />
    </>
  );
};

export default Index;
