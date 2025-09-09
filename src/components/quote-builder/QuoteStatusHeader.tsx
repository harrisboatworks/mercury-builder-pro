import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ShoppingCart, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { useNavigate } from 'react-router-dom';

export const QuoteStatusHeader = () => {
  const { state, clearQuote, getQuoteData } = useQuote();
  const navigate = useNavigate();
  const quoteData = getQuoteData();

  // Don't show if no motor selected yet
  if (!state.motor) return null;

  const getQuoteSummary = () => {
    const motor = state.motor;
    const path = state.purchasePath;
    
    if (!motor) return null;
    
    return {
      motorInfo: `${motor.year} Mercury ${motor.hp}HP ${motor.model}`,
      pathBadge: path === 'installed' ? 'Installed' : 'Loose Motor',
      pathColor: path === 'installed' ? 'bg-blue-500' : 'bg-green-500'
    };
  };

  const summary = getQuoteSummary();
  if (!summary) return null;

  const handleClearQuote = () => {
    clearQuote();
    navigate('/quote/motor-selection');
  };

  const handleNewQuote = () => {
    // For now, just clear and start fresh - in future could save current quote
    clearQuote();
    navigate('/quote/motor-selection');
  };

  const handleBackToMotorSelection = () => {
    navigate('/quote/motor-selection');
  };

  return (
    <div className="bg-muted/20 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Current Quote:</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-foreground">
                {summary.motorInfo}
              </span>
              <Badge variant="secondary" className={`${summary.pathColor} text-white text-xs`}>
                {summary.pathBadge}
              </Badge>
            </div>

            {state.boatInfo && (
              <span className="text-xs text-muted-foreground">
                • {state.boatInfo.make} {state.boatInfo.model} ({state.boatInfo.length})
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBackToMotorSelection}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Change Motor
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNewQuote}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              New Quote
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Current Quote?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your current quote configuration. You'll need to start over from motor selection.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearQuote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear Quote
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};