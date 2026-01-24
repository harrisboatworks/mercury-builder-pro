import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Save, Loader2, Copy, Check, Link } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEALERPLAN_FEE } from '@/lib/finance';

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
  const [customerName, setCustomerName] = useState(state.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(state.customerEmail || '');
  const [customerPhone, setCustomerPhone] = useState(state.customerPhone || '');
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(state.editingQuoteId || null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Sync customer info from context when editing existing quote
  useEffect(() => {
    if (state.customerName) setCustomerName(state.customerName);
    if (state.customerEmail) setCustomerEmail(state.customerEmail);
    if (state.customerPhone) setCustomerPhone(state.customerPhone);
  }, [state.customerName, state.customerEmail, state.customerPhone]);

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
      
      // Calculate comprehensive pricing (same logic as ScheduleConsultation)
      const motorMSRP = motor?.msrp || motor?.basePrice || 0;
      const motorSalePrice = motor?.salePrice || motor?.price || motorMSRP;
      const motorDiscount = motorMSRP - motorSalePrice;
      
      // Accessories total
      const accessoryTotal = state.selectedOptions?.reduce((sum, opt) => sum + (opt.price || 0), 0) || 0;
      
      // Trade-in value
      const tradeInValue = state.tradeInInfo?.hasTradeIn ? (state.tradeInInfo?.estimatedValue || 0) : 0;
      
      // Calculate subtotal before tax
      const subtotal = motorSalePrice + accessoryTotal - tradeInValue;
      const hst = subtotal * 0.13;
      const totalBeforeDiscount = subtotal + hst + DEALERPLAN_FEE;
      const finalPrice = Math.max(0, totalBeforeDiscount - adminDiscount);
      
      // Enhanced quote data with admin fields
      const enhancedQuoteData = {
        ...quoteData,
        adminDiscount,
        adminNotes,
        customerNotes,
        isAdminQuote: true,
        selectedPromoOption: state.selectedPromoOption,
        selectedPromoRate: state.selectedPromoRate,
        selectedPromoTerm: state.selectedPromoTerm,
        selectedPromoValue: state.selectedPromoValue,
        looseMotorBattery: state.looseMotorBattery
      };
      
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        base_price: motorSalePrice,
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
        quote_data: enhancedQuoteData,
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
        
        setSavedQuoteId(state.editingQuoteId);
        toast({
          title: 'Quote Updated',
          description: 'The quote has been saved successfully.'
        });
      } else {
        // Create new quote and get the ID
        const { data, error } = await supabase
          .from('customer_quotes')
          .insert(payload)
          .select('id')
          .single();
        
        if (error) throw error;
        
        if (data) {
          setSavedQuoteId(data.id);
          // Update context with the new quote ID
          dispatch({ type: 'SET_ADMIN_MODE', payload: { isAdmin: true, editingQuoteId: data.id } });
        }
        
        toast({
          title: 'Quote Saved',
          description: 'The quote has been created. You can now share the link with the customer.'
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

  const handleCopyLink = async () => {
    if (!savedQuoteId) return;
    
    const shareUrl = `${window.location.origin}/quote/saved/${savedQuoteId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast({
        title: 'Link Copied',
        description: 'The shareable quote link has been copied to your clipboard.'
      });
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Copy Failed',
        description: 'Please copy the link manually.',
        variant: 'destructive'
      });
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
        
        {/* Share Link Section - shown after save */}
        {savedQuoteId && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-green-700 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Quote saved! Share with customer:
              </p>
            </div>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={`${window.location.origin}/quote/saved/${savedQuoteId}`}
                className="text-xs bg-white dark:bg-gray-900"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-green-700 dark:text-green-400 mt-2">
              Customer can view, download PDF, and complete financing from this link.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
