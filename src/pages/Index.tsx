import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusIndicator } from '@/components/StatusIndicator';
import { MobileQuoteForm } from '@/components/ui/mobile-quote-form';
import { MobileStickyCTA } from '@/components/ui/mobile-sticky-cta';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, RotateCcw, ArrowRight, User, FileText, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import harrisLogo from '@/assets/harris-logo.png';

const Index = () => {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Mercury Quote Builder...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  const navigate = useNavigate();
  const hasChecked = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { state, isQuoteComplete, getQuoteCompletionStatus, clearQuote } = useQuote();
  const { user, signOut } = useAuth();

  // Memoize the completion status function to prevent unnecessary re-renders
  const getCompletionStatus = useCallback(() => {
    return getQuoteCompletionStatus();
  }, [state.motor, state.purchasePath, state.boatInfo, state.hasTradein, state.tradeInInfo]);

  // Loading timeout and progress effects
  useEffect(() => {
    if (state.isLoading) {
      console.log('🔄 Index: Starting loading timeout and progress tracking...');
      
      // Progressive loading messages
      const messages = [
        'Loading Mercury Quote Builder...',
        'Checking for existing quotes...',
        'Preparing your quote experience...',
        'Almost ready...'
      ];
      
      let messageIndex = 0;
      setLoadingMessage(messages[0]);
      setLoadingProgress(10);
      
      // Update loading message and progress
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
        setLoadingProgress(prev => Math.min(prev + 20, 90));
      }, 1000);
      
      progressIntervalRef.current = messageInterval;
      
      // Emergency timeout - if loading takes more than 8 seconds, force emergency mode
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Index: Emergency timeout reached - forcing emergency mode');
        setEmergencyMode(true);
        setLoadingMessage('Loading is taking longer than expected...');
        setLoadingProgress(100);
      }, 8000);
      
      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    } else {
      // Clear loading states when no longer loading
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setLoadingProgress(100);
    }
  }, [state.isLoading]);

  // Main navigation effect - separated from loading logic
  useEffect(() => {
    console.log('🔄 Index: Checking quote status...', { 
      isLoading: state.isLoading, 
      hasChecked: hasChecked.current 
    });
    
    // Wait for context to load
    if (state.isLoading && !emergencyMode) {
      return;
    }
    
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    const completionStatus = getCompletionStatus();
    const hasExistingQuote = completionStatus.hasMotor;
    
    console.log('📊 Quote status:', completionStatus);
    
    if (hasExistingQuote) {
      console.log('📋 Found existing quote, showing landing options');
      setShowLanding(true);
    } else {
      console.log('🆕 No existing quote, redirecting to motor selection');
      navigate('/quote/motor-selection');
    }
  }, [navigate, state.isLoading, emergencyMode, getCompletionStatus]);

  const handleContinueQuote = () => {
    const completionStatus = getCompletionStatus();
    
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

  const handleEmergencyClear = () => {
    console.log('🚨 Index: Emergency clear localStorage');
    try {
      localStorage.removeItem('quoteBuilder');
      console.log('✅ Index: localStorage cleared successfully');
      
      // Force reload the page to restart cleanly
      window.location.reload();
    } catch (error) {
      console.error('❌ Index: Failed to clear localStorage:', error);
    }
  };

  const handleForceStart = () => {
    console.log('🚀 Index: Force start new quote');
    clearQuote();
    navigate('/quote/motor-selection');
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

  if (state.isLoading && !emergencyMode) {
    return (
      <>
        <div className="container mx-auto px-4 py-2 flex justify-end">
          <StatusIndicator />
        </div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <img 
              src={harrisLogo} 
              alt="Harris Boat Works" 
              className="h-16 w-auto mx-auto mb-4"
            />
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-3">
              <p className="text-lg font-medium text-foreground">{loadingMessage}</p>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {loadingProgress < 90 ? 'Please wait...' : 'Just a few more seconds...'}
              </p>
            </div>
            {/* Debug toggle - only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs"
              >
                Debug Info
              </Button>
            )}
            {showDebug && (
              <div className="text-left text-xs text-muted-foreground bg-secondary/50 p-3 rounded">
                <p>Loading: {state.isLoading ? 'true' : 'false'}</p>
                <p>Has Motor: {state.motor ? 'true' : 'false'}</p>
                <p>Has Checked: {hasChecked.current ? 'true' : 'false'}</p>
                <p>Progress: {loadingProgress}%</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Emergency mode - show manual options if loading is stuck
  if (emergencyMode) {
    return (
      <>
        <div className="container mx-auto px-4 py-2 flex justify-end">
          <StatusIndicator />
        </div>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-destructive/10">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <img 
              src={harrisLogo} 
              alt="Harris Boat Works" 
              className="h-16 w-auto mx-auto mb-2"
            />
            <div className="text-destructive">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Loading Issue Detected</h2>
              <p className="text-muted-foreground">
                We're having trouble loading your quote data. You can try one of these options:
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={handleForceStart} 
                className="w-full"
                variant="default"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Start New Quote
              </Button>
              <Button 
                onClick={handleEmergencyClear} 
                variant="destructive" 
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data & Restart
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact our support team.
            </p>
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
            <img 
              src={harrisLogo} 
              alt="Harris Boat Works" 
              className="h-12 w-auto mx-auto mb-4"
            />
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading Mercury Quote Builder...</p>
          </div>
        </div>
      </>
    );
  }

  const quoteSummary = getQuoteSummary();
  const completionStatus = getCompletionStatus();

  return (
    <>
      {/* Header with Auth */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <img 
              src={harrisLogo} 
              alt="Harris Boat Works" 
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-4">
              <StatusIndicator />
              {user ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/my-quotes')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    My Quotes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Quote Landing Page */}
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <img 
                src={harrisLogo} 
                alt="Harris Boat Works" 
                className="h-20 w-auto mx-auto mb-6"
              />
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome Back
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
