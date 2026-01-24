import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Save, Loader2 } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminQuoteControlsProps {
  onSave?: () => void;
  className?: string;
}

export function AdminQuoteControls({ onSave, className = '' }: AdminQuoteControlsProps) {
  const { state, dispatch, getQuoteData } = useQuote();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [adminDiscount, setAdminDiscount] = useState(state.adminDiscount || 0);
  const [adminNotes, setAdminNotes] = useState(state.adminNotes || '');
  const [customerNotes, setCustomerNotes] = useState(state.customerNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Sync local state with context when context changes
  useEffect(() => {
    setAdminDiscount(state.adminDiscount || 0);
    setAdminNotes(state.adminNotes || '');
    setCustomerNotes(state.customerNotes || '');
  }, [state.adminDiscount, state.adminNotes, state.customerNotes]);

  // Update context when local values change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch({ 
        type: 'SET_ADMIN_QUOTE_DATA', 
        payload: { adminDiscount, adminNotes, customerNotes } 
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [adminDiscount, adminNotes, customerNotes, dispatch]);

  const handleSaveQuote = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter customer name and email.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const quoteData = getQuoteData();
      const motor = state.motor;
      
      // Calculate pricing
      const motorMSRP = motor?.msrp || motor?.basePrice || 0;
      const motorSalePrice = motor?.salePrice || motor?.price || motorMSRP;
      const basePrice = motorSalePrice;
      const finalPrice = basePrice - adminDiscount;
      
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        base_price: basePrice,
        final_price: finalPrice,
        deposit_amount: 0,
        loan_amount: finalPrice,
        monthly_payment: 0,
        term_months: 0,
        total_cost: finalPrice,
        user_id: user?.id || 'admin',
        motor_model_id: motor?.id || null,
        admin_discount: adminDiscount,
        admin_notes: adminNotes,
        customer_notes: customerNotes,
        is_admin_quote: true,
        created_by_admin: user?.id,
        last_modified_by: user?.id,
        last_modified_at: new Date().toISOString(),
        quote_data: quoteData,
        lead_status: 'scheduled',
        lead_source: 'admin'
      };

      // If editing existing quote, update it
      if (state.editingQuoteId) {
        const { error } = await supabase
          .from('customer_quotes')
          .update(payload)
          .eq('id', state.editingQuoteId);
        
        if (error) throw error;
        
        toast({
          title: 'Quote Updated',
          description: 'The quote has been saved successfully.'
        });
      } else {
        // Create new quote
        const { error } = await supabase
          .from('customer_quotes')
          .insert(payload);
        
        if (error) throw error;
        
        toast({
          title: 'Quote Saved',
          description: 'The quote has been created successfully.'
        });
      }
      
      onSave?.();
    } catch (error: any) {
      console.error('Failed to save quote:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save quote. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className={`p-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 ${className}`}>
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
        <ShieldCheck className="w-5 h-5" />
        Admin Controls
      </h3>
      
      <div className="space-y-4">
        {/* Customer Info */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="customerName" className="text-sm">Customer Name *</Label>
            <Input 
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div>
            <Label htmlFor="customerEmail" className="text-sm">Customer Email *</Label>
            <Input 
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="customerPhone" className="text-sm">Customer Phone</Label>
          <Input 
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        
        {/* Special Discount */}
        <div>
          <Label htmlFor="adminDiscount" className="text-sm">Special Discount ($)</Label>
          <Input 
            id="adminDiscount"
            type="number"
            min={0}
            value={adminDiscount}
            onChange={(e) => setAdminDiscount(Number(e.target.value))}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This discount will be applied to the final price and shown on the PDF.
          </p>
        </div>
        
        {/* Admin Notes (Internal) */}
        <div>
          <Label htmlFor="adminNotes" className="text-sm">Internal Notes</Label>
          <Textarea 
            id="adminNotes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Notes for the sales team (not shown on PDF)..."
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1">
            These notes are visible only to admins.
          </p>
        </div>
        
        {/* Customer Notes (On PDF) */}
        <div>
          <Label htmlFor="customerNotes" className="text-sm">Customer Notes</Label>
          <Textarea 
            id="customerNotes"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Notes that appear on the customer's PDF..."
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1">
            These notes will be printed on the customer PDF.
          </p>
        </div>
        
        {/* Save Button */}
        <Button 
          onClick={handleSaveQuote} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {state.editingQuoteId ? 'Update Quote' : 'Save Quote'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
