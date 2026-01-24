import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Save, Loader2, FileText, AlertTriangle, Download, Copy, Check, Gift, Calendar, Link } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import AdminNav from '@/components/admin/AdminNav';
import { generateQuotePDF, downloadPDF } from '@/lib/react-pdf-generator';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { SITE_URL } from '@/lib/site';
import QRCode from 'qrcode';

interface QuoteDetail {
  id: string;
  created_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  base_price: number;
  final_price: number;
  deposit_amount: number;
  loan_amount: number;
  monthly_payment: number;
  term_months: number;
  total_cost: number;
  tradein_value_pre_penalty?: number | null;
  tradein_value_final?: number | null;
  penalty_applied?: boolean;
  penalty_factor?: number | null;
  penalty_reason?: string | null;
  // Admin fields
  admin_discount?: number | null;
  admin_notes?: string | null;
  customer_notes?: string | null;
  is_admin_quote?: boolean;
  quote_data?: any;
  lead_status?: string;
  lead_source?: string;
}

const AdminQuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useQuote();
  const { toast } = useToast();
  
  const [q, setQ] = useState<QuoteDetail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Promo data
  const { promotions } = useActivePromotions();
  
  // Editable fields
  const [adminDiscount, setAdminDiscount] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  useEffect(() => {
    document.title = 'Quote Detail | Admin';
    const fetchOne = async () => {
      const { data, error } = await supabase.from('customer_quotes').select('*').eq('id', id).single();
      if (!error && data) {
        setQ(data as any);
        setAdminDiscount(data.admin_discount || 0);
        setAdminNotes(data.admin_notes || '');
        setCustomerNotes(data.customer_notes || '');
      }
    };
    fetchOne();
  }, [id]);

  const fmt = (n: number | null | undefined) => (n == null ? '-' : `$${Math.round(Number(n)).toLocaleString()}`);

  const handleEditQuote = () => {
    if (!q) return;
    
    // If we have quote_data, restore it to context and navigate to summary
    if (q.quote_data) {
      console.log('🔧 Admin Edit: Restoring quote', {
        quoteId: q.id,
        hasMotor: !!q.quote_data?.motor,
        hasPackage: !!q.quote_data?.selectedPackage,
        hasPromo: !!q.quote_data?.selectedPromoOption
      });
      
      dispatch({ type: 'RESTORE_QUOTE', payload: q.quote_data });
      dispatch({ type: 'SET_ADMIN_MODE', payload: { isAdmin: true, editingQuoteId: q.id } });
      dispatch({ type: 'SET_ADMIN_QUOTE_DATA', payload: { 
        adminDiscount: q.admin_discount || 0,
        adminNotes: q.admin_notes || '',
        customerNotes: q.customer_notes || '',
        customerName: q.customer_name || '',
        customerEmail: q.customer_email || '',
        customerPhone: q.customer_phone || ''
      }});
      
      // Force immediate save with ALL state fields explicitly mapped
      const adminState = {
        // Spread the quote data first (contains motor, options, trade-in, etc.)
        ...q.quote_data,
        
        // Explicitly set critical fields to ensure they're present
        motor: q.quote_data?.motor || null,
        selectedOptions: q.quote_data?.selectedOptions || [],
        selectedPackage: q.quote_data?.selectedPackage || null,
        selectedPromoOption: q.quote_data?.selectedPromoOption || null,
        tradeInInfo: q.quote_data?.tradeInInfo || null,
        purchasePath: q.quote_data?.purchasePath || null,
        boatInfo: q.quote_data?.boatInfo || null,
        installConfig: q.quote_data?.installConfig || null,
        warrantyConfig: q.quote_data?.warrantyConfig || null,
        looseMotorBattery: q.quote_data?.looseMotorBattery || null,
        
        // Admin mode flags
        isAdminQuote: true,
        editingQuoteId: q.id,
        
        // Admin data from database columns
        adminDiscount: q.admin_discount || 0,
        adminNotes: q.admin_notes || '',
        customerNotes: q.customer_notes || '',
        customerName: q.customer_name || '',
        customerEmail: q.customer_email || '',
        customerPhone: q.customer_phone || '',
        
        // Ensure loading is false
        isLoading: false
      };
      
      localStorage.setItem('quoteBuilder', JSON.stringify({
        state: adminState,
        timestamp: Date.now(),
        lastActivity: Date.now()
      }));
      
      navigate('/quote/summary');
    } else {
      // No quote_data, just toggle inline editing mode
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!q) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('customer_quotes')
        .update({
          admin_discount: adminDiscount,
          admin_notes: adminNotes,
          customer_notes: customerNotes,
          last_modified_at: new Date().toISOString()
        })
        .eq('id', q.id);
      
      if (error) throw error;
      
      // Update local state
      setQ(prev => prev ? {
        ...prev,
        admin_discount: adminDiscount,
        admin_notes: adminNotes,
        customer_notes: customerNotes
      } : null);
      
      setIsEditing(false);
      toast({
        title: 'Quote Updated',
        description: 'Changes have been saved successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'downloaded': return <Badge variant="secondary">Downloaded</Badge>;
      case 'scheduled': return <Badge variant="default">Scheduled</Badge>;
      case 'contacted': return <Badge variant="outline">Contacted</Badge>;
      case 'closed': return <Badge variant="destructive">Closed</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPromoLabel = (option: string | null): string => {
    switch (option) {
      case 'no_payments': return '6 Months Deferred Payments';
      case 'special_financing': return 'Special Financing Rate';
      case 'cash_rebate': return 'Factory Rebate';
      default: return 'Standard Warranty';
    }
  };

  const handleCopyLink = async () => {
    if (!q) return;
    const shareUrl = `${SITE_URL}/quote/saved/${q.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast({ title: 'Link copied!', description: 'Share URL copied to clipboard.' });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Please copy the link manually.', variant: 'destructive' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!q || !q.quote_data) {
      toast({ title: 'No data', description: 'This quote has no data to generate PDF.', variant: 'destructive' });
      return;
    }
    
    setIsGeneratingPDF(true);
    try {
      const qd = q.quote_data;
      const motor = qd.motor || {};
      
      // Motor pricing - use motor's built-in savings as dealer discount
      const motorMSRP = motor.msrp || motor.originalPrice || q.base_price || 0;
      const motorSavings = motor.savings || 0;  // Built-in dealer discount
      const adminDiscountValue = q.admin_discount || qd.adminDiscount || 0;  // Admin's special discount
      
      // Promo rebate - parse the selectedPromoValue (e.g., "$250 rebate" -> 250)
      const promoValueStr = qd.selectedPromoValue || '';
      const promoValue = qd.selectedPromoOption === 'cash_rebate' 
        ? (parseInt(promoValueStr.replace(/[^0-9]/g, '')) || 0) 
        : 0;
      
      // Motor subtotal after all discounts
      const motorSubtotal = motorMSRP - motorSavings - adminDiscountValue - promoValue;
      
      // Accessories - handle loose motor path
      let accessoryBreakdown = qd.accessoryBreakdown || qd.selectedOptions || [];
      
      // For loose motor path, add "Clamp-On Installation" if empty
      if (qd.purchasePath === 'loose' && accessoryBreakdown.length === 0) {
        accessoryBreakdown = [{
          name: 'Clamp-On Installation',
          price: 0,
          description: 'DIY-friendly mounting system (no installation labor required)'
        }];
      }
      
      // Calculate totals
      const accessoriesTotal = accessoryBreakdown.reduce((sum: number, a: any) => sum + (a.price || 0), 0);
      const tradeInValue = qd.tradeInInfo?.hasTradeIn 
        ? (q.tradein_value_final || qd.tradeInInfo?.estimatedValue || 0) 
        : 0;
      const subtotalBeforeTax = motorSubtotal + accessoriesTotal - tradeInValue;
      const taxAmount = subtotalBeforeTax * 0.13;
      const totalPrice = subtotalBeforeTax + taxAmount;
      
      // Financing info - extract from qd.financing object
      const financing = qd.financing || {};
      const financingTerm = financing.term || q.term_months || 48;
      const financingRate = financing.rate || 7.99;
      const monthlyPayment = q.monthly_payment || qd.monthlyPayment || Math.round(totalPrice / financingTerm);
      
      // Get selected package info
      const selectedPackage = qd.selectedPackage || null;
      
      // Generate financing QR code using public SITE_URL
      const financingUrl = `${SITE_URL}/financing-application/from-quote?quoteId=${q.id}`;
      let financingQrCode = '';
      try {
        financingQrCode = await QRCode.toDataURL(financingUrl, {
          width: 200,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' }
        });
      } catch (error) {
        console.error('QR code generation failed:', error);
      }
      
      // Build complete PDF data object matching QuoteSummaryPage structure
      const pdfData = {
        quoteNumber: `HBW-${q.id.slice(0, 6).toUpperCase()}`,
        customerName: q.customer_name || 'Valued Customer',
        customerEmail: q.customer_email || '',
        customerPhone: q.customer_phone || '',
        motor: {
          model: motor.model || motor.display_name || 'Motor',
          hp: motor.horsepower || motor.hp || 0,
          msrp: motorMSRP,
          base_price: motorMSRP - motorSavings,
          sale_price: motorSubtotal,
          dealer_price: motorMSRP - motorSavings,
          savings: motorSavings,
          model_year: motor.year || motor.model_year || new Date().getFullYear(),
          category: motor.category || motor.motor_type || 'FourStroke',
          imageUrl: motor.imageUrl || motor.image_url || motor.hero_image_url
        },
        selectedPackage: selectedPackage ? {
          id: selectedPackage.id || 'essential',
          label: selectedPackage.label || 'Essential',
          coverageYears: qd.warrantyConfig?.totalYears || selectedPackage.coverageYears || 7,
          features: selectedPackage.features || []
        } : undefined,
        accessoryBreakdown,
        ...(qd.tradeInInfo?.hasTradeIn && tradeInValue > 0 ? {
          tradeInValue: tradeInValue,
          tradeInInfo: {
            brand: qd.tradeInInfo.brand,
            year: qd.tradeInInfo.year,
            horsepower: qd.tradeInInfo.horsepower,
            model: qd.tradeInInfo.model
          }
        } : {}),
        includesInstallation: qd.purchasePath === 'installed',
        pricing: {
          msrp: motorMSRP,
          discount: motorSavings,  // Dealer discount from motor
          adminDiscount: adminDiscountValue,  // Admin's special discount
          promoValue: promoValue,
          motorSubtotal: motorSubtotal,
          subtotal: subtotalBeforeTax,
          hst: taxAmount,
          totalCashPrice: totalPrice,
          savings: motorSavings + adminDiscountValue + promoValue
        },
        monthlyPayment: monthlyPayment,
        financingTerm: financingTerm,
        financingRate: financingRate,
        financingQrCode,
        selectedPromoOption: qd.selectedPromoOption,
        selectedPromoValue: qd.selectedPromoValue
      };
      
      const pdfUrl = await generateQuotePDF(pdfData);
      downloadPDF(pdfUrl, `Quote-${q.customer_name.replace(/\s+/g, '-')}.pdf`);
      toast({ title: 'PDF Downloaded', description: 'Quote PDF generated successfully.' });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast({ title: 'PDF Error', description: err.message || 'Failed to generate PDF.', variant: 'destructive' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Extract promo info from quote_data
  const getPromoInfo = () => {
    if (!q?.quote_data) return null;
    const selectedOption = q.quote_data.selectedPromoOption;
    const selectedValue = q.quote_data.selectedPromoValue;
    
    // Get active promotion for expiry date (check for promo_options with choose_one type)
    const activePromo = promotions.find(p => p.promo_options?.type === 'choose_one' || p.warranty_extra_years);
    const expiryDate = activePromo?.end_date ? new Date(activePromo.end_date) : null;
    const warrantyYears = activePromo?.warranty_extra_years || 0;
    
    return {
      hasPromo: !!selectedOption,
      option: selectedOption,
      value: selectedValue,
      label: getPromoLabel(selectedOption),
      expiryDate,
      warrantyYears,
      totalWarranty: 3 + warrantyYears
    };
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Quote Details</h1>
          {q?.is_admin_quote && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-300">
              Admin Created
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {q?.quote_data && (
            <Button variant="default" onClick={handleEditQuote}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Full Quote
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/admin/quotes')}>Back</Button>
        </div>
      </div>
      
      {!q ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Customer Info */}
          <Card className="p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              Customer
              {q.lead_status && <span className="ml-auto">{getStatusBadge(q.lead_status)}</span>}
            </h2>
            <div>Name: {q.customer_name}</div>
            <div>Email: {q.customer_email}</div>
            <div>Phone: {q.customer_phone || '-'}</div>
            <div>Date: {q.created_at ? new Date(q.created_at).toLocaleString() : '-'}</div>
            {q.lead_source && <div>Source: <Badge variant="outline">{q.lead_source}</Badge></div>}
          </Card>
          
          {/* Trade-In */}
          <Card className="p-4">
            {(() => {
              // Extract trade-in from quote_data if not in top-level columns
              const tradeIn = q.quote_data?.tradeInInfo || {};
              const hasTradeIn = tradeIn.hasTradeIn || q.tradein_value_pre_penalty;
              const estimatedValue = q.tradein_value_final ?? tradeIn.tradeinValueFinal ?? tradeIn.estimatedValue;
              
              return (
                <>
                  <h2 className="font-semibold mb-2 flex items-center gap-2">
                    Trade-In
                    {q.penalty_applied && (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </h2>
                  {hasTradeIn ? (
                    <div className="space-y-1">
                      {tradeIn.year && <div>Year: {tradeIn.year}</div>}
                      {tradeIn.brand && <div>Brand: {tradeIn.brand}</div>}
                      {tradeIn.horsepower && <div>HP: {tradeIn.horsepower}</div>}
                      {tradeIn.condition && <div>Condition: {tradeIn.condition}</div>}
                      <div className="border-t pt-1 mt-2">
                        <div>Estimated Value: {fmt(estimatedValue)}</div>
                        {q.penalty_applied && (
                          <>
                            <div className="text-yellow-600">Penalty Applied: Yes</div>
                            <div>Penalty Factor: {q.penalty_factor}</div>
                            <div>Reason: {q.penalty_reason}</div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">No trade-in</div>
                  )}
                </>
              );
            })()}
          </Card>
          
          {/* Financial Summary */}
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Financial Summary</h2>
            <div>Base price: {fmt(q.base_price)}</div>
            {(q.admin_discount || 0) > 0 && (
              <div className="text-green-600">Admin discount: -{fmt(q.admin_discount)}</div>
            )}
            <div className="font-medium">Final price: {fmt(q.final_price)}</div>
            <div className="border-t mt-2 pt-2">
              <div>Deposit amount: {fmt(q.deposit_amount)}</div>
              <div>Loan amount: {fmt(q.loan_amount)}</div>
              <div>Monthly payment: {fmt(q.monthly_payment)}</div>
              <div>Term months: {q.term_months}</div>
              <div>Total cost: {fmt(q.total_cost)}</div>
            </div>
          </Card>
          
          {/* Admin Controls Card */}
          <Card className="p-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <FileText className="w-4 h-4" />
              Admin Controls
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </h2>
            
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Special Discount ($)</Label>
                  <Input 
                    type="number"
                    value={adminDiscount}
                    onChange={(e) => setAdminDiscount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Internal Notes</Label>
                  <Textarea 
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Notes for the sales team..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-sm">Customer Notes (on PDF)</Label>
                  <Textarea 
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Notes that appear on PDF..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Special Discount:</span>{' '}
                  {(q.admin_discount || 0) > 0 ? fmt(q.admin_discount) : 'None'}
                </div>
                <div>
                  <span className="text-muted-foreground">Internal Notes:</span>{' '}
                  {q.admin_notes || <span className="text-muted-foreground italic">None</span>}
                </div>
                <div>
                  <span className="text-muted-foreground">Customer Notes:</span>{' '}
                  {q.customer_notes || <span className="text-muted-foreground italic">None</span>}
                </div>
              </div>
            )}
          </Card>

          {/* Applied Promotion Card */}
          {(() => {
            const promo = getPromoInfo();
            if (!promo?.hasPromo) return null;
            
            return (
              <Card className="p-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
                <h2 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Gift className="w-4 h-4" />
                  Applied Promotion
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-emerald-700 dark:text-emerald-300">
                    Mercury GET 7 + Choose One
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{promo.label}</span>
                    {promo.value && <Badge variant="secondary">{promo.value}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{promo.totalWarranty}-Year Factory Warranty</span>
                    <Badge variant="outline" className="text-xs">3 + {promo.warrantyYears} FREE</Badge>
                  </div>
                  {promo.expiryDate && (
                    <div className="flex items-center gap-2 text-muted-foreground pt-1 border-t mt-2">
                      <Calendar className="w-4 h-4" />
                      <span>Offer Expires: {promo.expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })()}

          {/* Share & Download Card */}
          <Card className="p-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Link className="w-4 h-4" />
              Share & Download
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownloadPDF} 
                  disabled={isGeneratingPDF || !q?.quote_data}
                  className="flex-1"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCopyLink}
                  className="flex-1"
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono truncate">
                {SITE_URL}/quote/saved/{q?.id?.slice(0, 8)}...
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
};

export default AdminQuoteDetail;
