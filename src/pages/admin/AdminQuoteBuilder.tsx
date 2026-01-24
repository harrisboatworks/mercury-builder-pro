import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import AdminNav from '@/components/admin/AdminNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

/**
 * Admin entry point for creating new quotes.
 * Sets admin mode in context and redirects to the quote builder.
 */
const AdminQuoteBuilder = () => {
  const navigate = useNavigate();
  const { dispatch, clearQuote } = useQuote();
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    document.title = 'Create Quote | Admin';
  }, []);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin/quotes');
    }
  }, [isAdmin, authLoading, navigate]);

  const handleStartNewQuote = () => {
    // Clear any existing quote data
    clearQuote();
    
    // Set admin mode in context
    dispatch({ type: 'SET_ADMIN_MODE', payload: { isAdmin: true, editingQuoteId: null } });
    
    // Navigate to motor selection
    navigate('/quote/motor-selection');
  };

  if (authLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <AdminNav />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Quote</h1>
        <Button variant="secondary" onClick={() => navigate('/admin/quotes')}>
          Back to Quotes
        </Button>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <FileText className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Create a Customer Quote</h2>
            <p className="text-muted-foreground">
              Build a quote using the same flow customers use, with additional admin controls 
              for special discounts and notes at the end.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button size="lg" onClick={handleStartNewQuote} className="w-full max-w-xs">
              <Plus className="w-5 h-5 mr-2" />
              Start New Quote
            </Button>
            
            <p className="text-sm text-muted-foreground">
              After completing the quote, you'll see admin controls to add special discounts and notes.
            </p>
          </div>
        </Card>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">What you can do:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Select motor, package, and all options like a customer</li>
            <li>• Add a special discount amount (visible on PDF)</li>
            <li>• Add internal notes (admin only)</li>
            <li>• Add customer notes (appears on PDF)</li>
            <li>• Save and edit quotes later</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default AdminQuoteBuilder;
