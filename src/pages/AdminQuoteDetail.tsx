import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Save, Loader2, FileText, AlertTriangle, Download, Copy, Check, Gift, Calendar, Link, Plus, Mail } from 'lucide-react';
import { useQuote } from '@/contexts/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import AdminNav from '@/components/admin/AdminNav';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { SITE_URL } from '@/lib/site';
import { buildLegacyQuotePdfSnapshot } from '@/lib/quote-pdf-data';
import { QuoteChangeLog } from '@/components/admin/QuoteChangeLog';
import { generateSavedQuoteQrCode } from '@/lib/saved-quote-qr';
import QuoteHistoryTimeline from '@/components/admin/QuoteHistoryTimeline';
import ContactLog from '@/components/admin/ContactLog';
import FollowUpReminder from '@/components/admin/FollowUpReminder';
import SendQuoteEmail from '@/components/admin/SendQuoteEmail';
import {
  formatDepositAddress,
  resolveDealAddress,
  resolveDepositMailContact,
  type DepositAddressSource,
  type DepositPostalAddress,
} from '@/lib/deposit-identity';
import {
  adminDealPacketPath,
  canRetryDepositDeliveries,
  canonicalDocumentLabel,
  dealPacketSavedQuoteId,
  depositDeliveryInProgress,
  deliveryRowDisplayStatus,
  formatPaidDepositFinancialSummary,
  historicalCanonicalPdfNote,
  authoritativeDepositPaymentStatus,
  isAuthoritativeDepositPaid,
  isAdminDepositDealPacket,
  legacyJsonPaymentStatusLabel,
  operationalCustomerQuoteId,
  quoteNotificationDisplayStatus,
  shouldOfferCanonicalDocumentDownload,
  shouldOfferStripeBillingRecovery,
  summarizeDeliveryRetry,
  summarizeDeliveryRetryFromMailer,
  summarizeStripeRecovery,
} from '@/lib/admin-deal-packet';

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
  follow_up_date?: string | null;
  saved_quote_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  payment_status?: string | null;
  payment_paid_at?: string | null;
  legacy_json_payment_status?: string | null;
  customer_address?: DepositPostalAddress | null;
  quote_pdf_path?: string | null;
  quote_pdf_sha256?: string | null;
  email_deliveries?: Array<{
    audience: string;
    status: string;
    attempt_count: number;
    last_attempted_at: string | null;
    sent_at: string | null;
    last_error: string | null;
    claim_expires_at?: string | null;
  }> | null;
  address_source?: DepositAddressSource;
  address_source_label?: string;
  stripe_billing_address?: unknown;
  _source?: 'customer_quotes' | 'saved_quotes';
  _joined_customer_quote_id?: string | null;
}

const AdminQuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useQuote();
  const { toast } = useToast();
  const { user } = useAuth();
  const [changeLogKey, setChangeLogKey] = useState(0);
  
  const [q, setQ] = useState<QuoteDetail | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'notfound' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joinedDepositError, setJoinedDepositError] = useState<string | null>(null);
  const [deliveryLoadError, setDeliveryLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isRecoveringBilling, setIsRecoveringBilling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloadingCanonical, setIsDownloadingCanonical] = useState(false);
  const [isRetryingEmail, setIsRetryingEmail] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Promo data
  const { promotions } = useActivePromotions();
  
  // Editable fields
  const [adminDiscount, setAdminDiscount] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  
  // Trade-in override
  const [tradeInOverride, setTradeInOverride] = useState<string>('');
  const [isEditingTradeIn, setIsEditingTradeIn] = useState(false);
  const [isSavingTradeIn, setIsSavingTradeIn] = useState(false);

  useEffect(() => {
    setQ(null);
    setLoadState('loading');
    setLoadError(null);
    setJoinedDepositError(null);
    setDeliveryLoadError(null);
  }, [id]);

  useEffect(() => {
    document.title = 'Quote Detail | Admin';
    const initTradeInOverride = (ti: any) => {
      if (ti?.overrideValue) {
        setTradeInOverride(String(ti.overrideValue));
      } else if (ti?.estimatedValue) {
        setTradeInOverride(String(ti.estimatedValue));
      }
    };
    const fetchOne = async () => {
      setLoadState((current) => (current === 'loaded' && q ? 'loaded' : 'loading'));
      setLoadError(null);
      setJoinedDepositError(null);
      setDeliveryLoadError(null);
      try {
        const sqResult = await (supabase as any)
          .from('saved_quotes')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (sqResult.error) {
          setLoadError(`Could not load saved quote: ${sqResult.error.message}`);
        }

        let cq: any = null;
        let customerQuoteQueryFailed = false;
        const sq = sqResult.error ? null : sqResult.data;
        if (sq) {
          const byFk = await supabase
            .from('customer_quotes')
            .select('*')
            .eq('saved_quote_id', id)
            .maybeSingle();
          if (byFk.error) {
            setJoinedDepositError(`Could not load the joined deposit record: ${byFk.error.message}`);
          } else if (byFk.data) {
            cq = byFk.data;
          } else {
            const legacy = await supabase
              .from('customer_quotes')
              .select('*')
              .eq('lead_source', 'deposit')
              .contains('quote_data', { saved_quote_id: id })
              .maybeSingle();
            if (legacy.error) {
              setJoinedDepositError(`Could not load the legacy deposit join: ${legacy.error.message}`);
            } else {
              cq = legacy.data;
            }
          }
        } else {
          const cqResult = await supabase.from('customer_quotes').select('*').eq('id', id).maybeSingle();
          if (cqResult.error) {
            customerQuoteQueryFailed = true;
            setLoadError((current) => current || `Could not load customer quote: ${cqResult.error.message}`);
          } else {
            const data = cqResult.data;
            if (data?.saved_quote_id && data.saved_quote_id !== id) {
              navigate(adminDealPacketPath(data.saved_quote_id), { replace: true });
              return;
            }
            cq = data;
          }
        }

        if (!sq && !cq) {
          setLoadState(sqResult.error || customerQuoteQueryFailed ? 'error' : 'notfound');
          return;
        }

        let deliveries: QuoteDetail['email_deliveries'] = sq ? [] : [];
        if (sq) {
          const deliveryResult = await supabase
            .from('deposit_email_deliveries')
            .select('audience, status, attempt_count, last_attempted_at, sent_at, last_error, claim_expires_at')
            .eq('saved_quote_id', sq.id);
          if (deliveryResult.error) {
            setDeliveryLoadError(`Could not load email deliveries: ${deliveryResult.error.message}`);
            deliveries = null;
          } else {
            deliveries = deliveryResult.data || [];
          }
        }

        if (sq) {
          const qs = sq.quote_state || {};
          const motor = qs.motor || {};
          const isAnonymous = sq.email === 'anonymous@soft-lead.local' || sq.email === 'pdf-download@placeholder.com';
          const isSoftLead = sq.is_soft_lead === true;
          const finalPrice = cq?.final_price || qs.finalPrice || qs.frozenPricing?.total || 0;
          const resolvedAddress = resolveDealAddress({ savedQuote: sq, customerQuote: cq });
          const contact = resolveDepositMailContact({ savedQuote: sq, customerQuote: cq });
          const mapped: QuoteDetail = {
            id: sq.id,
            created_at: sq.created_at,
            customer_name: contact?.fullName || (isAnonymous ? 'Anonymous Visitor' : sq.email?.split('@')[0] || 'Unknown'),
            customer_email: contact?.email || '',
            customer_phone: contact?.phone || null,
            customer_address: resolvedAddress.address,
            address_source: resolvedAddress.source,
            address_source_label: resolvedAddress.label,
            stripe_billing_address: cq?.stripe_billing_address || null,
            base_price: cq?.base_price || qs.basePrice || motor.price || 0,
            final_price: finalPrice,
            deposit_amount: cq?.deposit_amount || sq.deposit_amount || 0,
            loan_amount: cq?.loan_amount || 0,
            monthly_payment: cq?.monthly_payment || 0,
            term_months: cq?.term_months || 0,
            total_cost: cq?.total_cost || finalPrice,
            tradein_value_pre_penalty: cq?.tradein_value_pre_penalty || qs.tradeInInfo?.estimatedValue || null,
            tradein_value_final: cq?.tradein_value_final || qs.tradeInInfo?.finalValue || null,
            penalty_applied: cq?.penalty_applied || false,
            customer_notes: qs.customerNotes || cq?.customer_notes || null,
            admin_notes: cq?.admin_notes || null,
            admin_discount: cq?.admin_discount || 0,
            is_admin_quote: qs.isAdminQuote || false,
            quote_data: { ...qs, ...(cq?.quote_data || {}) },
            lead_status: isAuthoritativeDepositPaid({
              customerQuotePaymentStatus: cq?.payment_status,
              savedQuoteDepositStatus: sq.deposit_status,
            }) ? 'deposit_paid' : (isSoftLead || isAnonymous ? 'browsing' : 'saved'),
            lead_source: cq?.lead_source || (sq.email === 'pdf-download@placeholder.com' ? 'pdf_download' : 'website'),
            follow_up_date: cq?.follow_up_date || null,
            saved_quote_id: sq.id,
            stripe_checkout_session_id: cq?.stripe_checkout_session_id || cq?.quote_data?.stripe_session_id || null,
            stripe_payment_intent_id: cq?.stripe_payment_intent_id || cq?.quote_data?.stripe_payment_intent || null,
            payment_status: authoritativeDepositPaymentStatus({
              customerQuotePaymentStatus: cq?.payment_status,
              savedQuoteDepositStatus: sq.deposit_status,
            }),
            legacy_json_payment_status: typeof cq?.quote_data?.payment_status === 'string' ? cq.quote_data.payment_status : null,
            payment_paid_at: cq?.payment_paid_at || sq.deposit_paid_at || null,
            quote_pdf_path: sq.quote_pdf_path,
            quote_pdf_sha256: sq.quote_pdf_sha256,
            email_deliveries: deliveries,
            _source: 'saved_quotes',
            _joined_customer_quote_id: cq?.id || null,
          };
          setQ(mapped);
          setAdminDiscount(mapped.admin_discount || 0);
          setAdminNotes(mapped.admin_notes || '');
          setCustomerNotes(qs.customerNotes || '');
          initTradeInOverride(qs.tradeInInfo || cq?.quote_data?.tradeInInfo);
          setLoadState('loaded');
          return;
        }

        const resolvedAddress = resolveDealAddress({ customerQuote: cq });
        setQ({
          ...(cq as any),
          customer_address: resolvedAddress.address,
          address_source: resolvedAddress.source,
          address_source_label: resolvedAddress.label,
          stripe_billing_address: cq.stripe_billing_address || null,
          stripe_checkout_session_id: cq.stripe_checkout_session_id || cq.quote_data?.stripe_session_id || null,
          stripe_payment_intent_id: cq.stripe_payment_intent_id || cq.quote_data?.stripe_payment_intent || null,
          payment_status: cq.payment_status || null,
          legacy_json_payment_status: typeof cq.quote_data?.payment_status === 'string' ? cq.quote_data.payment_status : null,
          email_deliveries: [],
          _source: 'customer_quotes',
        });
        setAdminDiscount(cq.admin_discount || 0);
        setAdminNotes(cq.admin_notes || '');
        setCustomerNotes(cq.customer_notes || '');
        initTradeInOverride(cq.quote_data?.tradeInInfo);
        setLoadState('loaded');
      } catch (error: any) {
        setLoadError(error?.message || 'Could not load this deal packet');
        setLoadState((current) => (current === 'loaded' ? 'loaded' : 'error'));
      }
    };
    fetchOne();
  }, [id, reloadNonce]);

  const fmt = (n: number | null | undefined) => (n == null ? '-' : `$${Math.round(Number(n)).toLocaleString()}`);
  const depositMoney = q && isAdminDepositDealPacket(q)
    ? formatPaidDepositFinancialSummary({
      basePrice: q.base_price,
      finalPrice: q.final_price,
      depositAmount: q.deposit_amount,
      loanAmount: q.loan_amount,
      monthlyPayment: q.monthly_payment,
      termMonths: q.term_months,
      totalCost: q.total_cost,
    })
    : null;
  const customerQuoteId = q ? operationalCustomerQuoteId(q) : null;
  const savedQuoteDealId = q ? dealPacketSavedQuoteId(q) : null;
  const hasCanonicalDocument = Boolean(q && shouldOfferCanonicalDocumentDownload({
    quotePdfPath: q.quote_pdf_path,
    quotePdfSha256: q.quote_pdf_sha256,
    savedQuoteId: savedQuoteDealId || q.id,
  }));
  const canRetryDeliveries = Boolean(q && canRetryDepositDeliveries({
    rows: q.email_deliveries,
    paymentPaid: q.payment_status === 'paid',
  }));

  const writeCustomerQuote = async (updates: Record<string, unknown>) => {
    if (!customerQuoteId) {
      throw new Error('This saved quote has no customer quote record to update.');
    }
    const { data, error } = await supabase
      .from('customer_quotes')
      .update(updates)
      .eq('id', customerQuoteId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No customer quote row was updated.');
    return data;
  };

  const handleSaveTradeInOverride = async (clearOverride = false) => {
    if (!q || !user?.id) return;
    setIsSavingTradeIn(true);
    try {
      const qd = q.quote_data || {};
      const tradeIn = qd.tradeInInfo || {};
      const formulaEstimate = tradeIn.originalEstimate || tradeIn.estimatedValue || q.tradein_value_final || 0;
      const overrideVal = clearOverride ? null : Number(tradeInOverride);
      const finalTradeValue = clearOverride ? formulaEstimate : overrideVal!;

      // Build updated tradeInInfo
      const updatedTradeIn = {
        ...tradeIn,
        estimatedValue: finalTradeValue,
        ...(clearOverride
          ? { overrideValue: undefined, originalEstimate: undefined }
          : { overrideValue: overrideVal, originalEstimate: formulaEstimate }
        ),
      };
      // Remove undefined keys for clean JSONB
      if (clearOverride) {
        delete updatedTradeIn.overrideValue;
        delete updatedTradeIn.originalEstimate;
      }

      const updatedQuoteData = { ...qd, tradeInInfo: updatedTradeIn };

      // Recalculate final_price: base_price - admin_discount - trade-in
      const newFinalPrice = q.base_price - (q.admin_discount || 0) - finalTradeValue;

      const changes: Record<string, { old: any; new: any }> = {
        tradein_value_final: { old: q.tradein_value_final, new: finalTradeValue },
      };
      if (!clearOverride) {
        changes.trade_in_override = { old: tradeIn.overrideValue || null, new: overrideVal };
      }

      await writeCustomerQuote({
        tradein_value_final: finalTradeValue,
        final_price: newFinalPrice,
        quote_data: updatedQuoteData,
        last_modified_at: new Date().toISOString(),
        last_modified_by: user.id,
      });

      const { error: changeLogError } = await supabase.from('quote_change_log').insert({
        quote_id: customerQuoteId,
        changed_by: user.id,
        change_type: clearOverride ? 'trade_in_clear' : 'trade_in_override',
        changes,
        notes: clearOverride ? 'Cleared trade-in override, reverted to formula estimate' : `Trade-in overridden to $${overrideVal?.toLocaleString()}`,
      });
      if (changeLogError) {
        toast({ title: 'Saved, but change log failed', description: changeLogError.message, variant: 'destructive' });
      }

      // Update local state
      setQ(prev => prev ? {
        ...prev,
        tradein_value_final: finalTradeValue,
        final_price: newFinalPrice,
        quote_data: updatedQuoteData,
      } : null);
      if (clearOverride) setTradeInOverride(String(formulaEstimate));
      setIsEditingTradeIn(false);
      setChangeLogKey(prev => prev + 1);
      toast({ title: clearOverride ? 'Override Cleared' : 'Trade-In Updated', description: clearOverride ? 'Reverted to formula estimate.' : `Trade-in value set to $${overrideVal?.toLocaleString()}.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update trade-in.', variant: 'destructive' });
    } finally {
      setIsSavingTradeIn(false);
    }
  };

  const handleEditQuote = () => {
    if (!q) return;
    if (!customerQuoteId) {
      toast({
        title: 'No customer quote record',
        description: 'This saved quote has no operational customer quote to edit.',
        variant: 'destructive',
      });
      return;
    }
    
    // If we have quote_data, restore it to context and navigate to summary
    if (q.quote_data) {
      console.log('🔧 Admin Edit: Restoring quote', {
        quoteId: customerQuoteId,
        hasMotor: !!q.quote_data?.motor,
        hasPackage: !!q.quote_data?.selectedPackage,
        hasPromo: !!q.quote_data?.selectedPromoOption
      });
      
      dispatch({ type: 'RESTORE_QUOTE', payload: q.quote_data });
      dispatch({ type: 'SET_ADMIN_MODE', payload: { isAdmin: true, editingQuoteId: customerQuoteId } });
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
        editingQuoteId: customerQuoteId,
        
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
    if (!customerQuoteId) {
      toast({
        title: 'No customer quote record',
        description: 'Notes and discounts need an operational customer quote.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Track what changed for the log
      const changes: Record<string, { old: any; new: any }> = {};
      if (adminDiscount !== (q.admin_discount || 0)) {
        changes.admin_discount = { old: q.admin_discount || 0, new: adminDiscount };
      }
      if (adminNotes !== (q.admin_notes || '')) {
        changes.admin_notes = { old: q.admin_notes || '', new: adminNotes };
      }
      if (customerNotes !== (q.customer_notes || '')) {
        changes.customer_notes = { old: q.customer_notes || '', new: customerNotes };
      }

      await writeCustomerQuote({
        admin_discount: adminDiscount,
        admin_notes: adminNotes,
        customer_notes: customerNotes,
        last_modified_at: new Date().toISOString(),
        last_modified_by: user?.id
      });

      // Log the changes if any
      if (Object.keys(changes).length > 0 && user?.id && customerQuoteId) {
        const changeType = changes.admin_discount ? 'discount' : 'notes';
        const { error: changeLogError } = await supabase.from('quote_change_log').insert({
          quote_id: customerQuoteId,
          changed_by: user.id,
          change_type: changeType,
          changes
        });
        if (changeLogError) {
          toast({ title: 'Saved, but change log failed', description: changeLogError.message, variant: 'destructive' });
        }
        // Refresh the change log
        setChangeLogKey(prev => prev + 1);
      }
      
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
      case 'deposit_paid': return <Badge variant="default">Deposit Paid</Badge>;
      case 'browsing': return <Badge variant="secondary">Browsing</Badge>;
      case 'saved': return <Badge variant="outline">Saved</Badge>;
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
    const shareUrl = `${SITE_URL}/quote/saved/${savedQuoteDealId || q.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast({ title: 'Link copied!', description: 'Share URL copied to clipboard.' });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Copy failed', description: 'Please copy the link manually.', variant: 'destructive' });
    }
  };

  const handleDownloadCanonicalPdf = async () => {
    if (!savedQuoteDealId && !q?.id) return;
    setIsDownloadingCanonical(true);
    try {
      const { data, error } = await supabase.functions.invoke('quote-document-api', {
        body: { action: 'download', savedQuoteId: savedQuoteDealId || q.id },
      });
      if (error || typeof data?.signedUrl !== 'string') {
        throw error || new Error('Stored reservation document is unavailable');
      }
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error('Stored reservation document download failed');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `HBW-reservation-${(savedQuoteDealId || q.id).slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: 'PDF Error', description: err.message || 'Could not download the canonical reservation PDF.', variant: 'destructive' });
    } finally {
      setIsDownloadingCanonical(false);
    }
  };

  const handleRetryFailedDeliveries = async () => {
    if (!q) return;
    if (!canRetryDepositDeliveries({
      rows: q.email_deliveries,
      paymentPaid: q.payment_status === 'paid',
    })) {
      toast({
        title: 'Retry unavailable',
        description: depositDeliveryInProgress(q.email_deliveries)
          ? 'A delivery is still in progress. Retry after the lease expires.'
          : 'This deposit is not paid or has nothing retryable.',
        variant: 'destructive',
      });
      return;
    }
    setIsRetryingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-deposit-confirmation-email', {
        body: q.stripe_checkout_session_id
          ? { stripeSessionId: q.stripe_checkout_session_id }
          : { savedQuoteId: savedQuoteDealId || q.id },
      });
      if (error) throw error;
      const { data: deliveries, error: reloadError } = await supabase
        .from('deposit_email_deliveries')
        .select('audience, status, attempt_count, last_attempted_at, sent_at, last_error, claim_expires_at')
        .eq('saved_quote_id', savedQuoteDealId || q.id);
      if (reloadError) {
        toast({
          title: data?.success === false ? 'Retry finished with failures' : 'Retry status reload failed',
          description: reloadError.message + (data?.deliveries ? ` ${summarizeDeliveryRetryFromMailer(data.deliveries)}` : ''),
          variant: 'destructive',
        });
      } else {
        setQ((prev) => prev ? { ...prev, email_deliveries: deliveries || prev.email_deliveries } : prev);
        const summary = summarizeDeliveryRetry(deliveries);
        toast({
          title: data?.success === false ? 'Retry finished with failures' : 'Delivery statuses',
          description: summary,
          variant: data?.success === false ? 'destructive' : 'default',
        });
      }
    } catch (err: any) {
      toast({ title: 'Retry failed', description: err.message || 'Could not retry deposit emails.', variant: 'destructive' });
    } finally {
      setIsRetryingEmail(false);
    }
  };

  const handleRecoverStripeBilling = async () => {
    if (!savedQuoteDealId) return;
    setIsRecoveringBilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { action: 'recover_stripe_billing', savedQuoteId: savedQuoteDealId },
      });
      if (error || data?.error) {
        throw error || new Error(data.error);
      }
      setReloadNonce((value) => value + 1);
      toast({
        title: 'Stripe recovery complete',
        description: `${summarizeStripeRecovery(data?.promoted)} Labelled Stripe checkout billing is not the submitted contact address.`,
      });
    } catch (err: any) {
      toast({
        title: 'Billing recovery failed',
        description: err.message || 'Could not recover the bound Stripe billing address.',
        variant: 'destructive',
      });
    } finally {
      setIsRecoveringBilling(false);
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
      const snapshot = buildLegacyQuotePdfSnapshot(qd, q.created_at || undefined);
      if (!snapshot) {
        throw new Error('This older record has no exact PDF price snapshot. Open it in Edit Quote and refresh the summary before generating a customer PDF.');
      }
      const snapshotAdminDiscount = snapshot.pricing.adminDiscount || 0;
      if (Math.abs(snapshotAdminDiscount - (q.admin_discount || 0)) > 0.01) {
        throw new Error('The admin discount changed after this PDF snapshot. Open Edit Quote and refresh the summary so totals, tax and payment stay exact.');
      }
      
      // Both saved_quotes and customer_quotes IDs are supported by the shared
      // quote loader, so this link can honestly reopen either record type.
      const qrTargetUrl = `${SITE_URL}/quote/saved/${savedQuoteDealId || q.id}`;
      let savedQuoteQrCode: string | undefined;
      try {
        savedQuoteQrCode = await generateSavedQuoteQrCode(qrTargetUrl);
      } catch (error) {
        console.error('QR code generation failed:', error);
      }
      
      // Build complete PDF data object matching QuoteSummaryPage structure
      const pdfData = {
        quoteNumber: `HBW-${q.id.slice(0, 6).toUpperCase()}`,
        customerName: q.customer_name || 'Valued Customer',
        customerEmail: q.customer_email || '',
        customerPhone: q.customer_phone || '',
        snapshot,
        savedQuoteQrCode,
      };
      
      const { generateQuotePDF, downloadPDF } = await import('@/lib/react-pdf-generator');
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
    
    // Get active promotion for expiry date, regardless of whether its benefits
    // are layered or require a customer choice.
    const activePromo = promotions.find(p => (p.promo_options?.options?.length ?? 0) > 0 || p.warranty_extra_years);
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
          {q?._source === 'saved_quotes' && (
            <Badge variant="outline">Saved Quote</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            if (!q) return;
            localStorage.removeItem('quoteBuilder');
            dispatch({ type: 'RESET_TO_ADMIN_MODE', payload: { editingQuoteId: null } });
            setTimeout(() => {
              dispatch({ type: 'SET_ADMIN_QUOTE_DATA', payload: {
                adminDiscount: 0,
                adminNotes: '',
                customerNotes: '',
                customerName: q.customer_name || '',
                customerEmail: q.customer_email || '',
                customerPhone: q.customer_phone || ''
              }});
              navigate('/quote/motor-selection');
            }, 50);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            New Quote for Customer
          </Button>
          {q?.quote_data && (
            <Button variant="default" onClick={handleEditQuote} disabled={!customerQuoteId}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Full Quote
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/admin/quotes')}>Back</Button>
        </div>
      </div>
      
      {loadState === 'loading' ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : loadState === 'error' && !q ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          <p className="font-medium">Could not load this deal packet</p>
          <p className="text-sm text-muted-foreground">{loadError || 'The saved quote, joined deposit, or delivery query failed.'}</p>
          <Button variant="outline" onClick={() => setReloadNonce((value) => value + 1)}>Retry load</Button>
          <Button variant="secondary" onClick={() => navigate('/admin/quotes')}>Back to quotes</Button>
        </div>
      ) : !q ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          <p className="font-medium">Quote not found</p>
          <p className="text-sm text-muted-foreground">This quote does not exist in customer quotes or saved quotes. It may have been deleted.</p>
          <Button variant="secondary" onClick={() => navigate('/admin/quotes')}>Back to quotes</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(loadError || joinedDepositError || deliveryLoadError) && (
            <Card className="p-4 border-destructive md:col-span-2">
              <p className="font-medium">Load error</p>
              <p className="text-sm text-muted-foreground">{loadError || joinedDepositError || deliveryLoadError}</p>
              <Button className="mt-3" variant="outline" size="sm" onClick={() => setReloadNonce((value) => value + 1)}>
                Retry load
              </Button>
            </Card>
          )}
          {/* Customer Info */}
          <Card className="p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              Customer
              {q.lead_status && <span className="ml-auto">{getStatusBadge(q.lead_status)}</span>}
            </h2>
            <div data-section="customer-identity">
              <div>Name: {q.customer_name}</div>
              <div>Email: {q.customer_email}</div>
              <div>Phone: {q.customer_phone || '-'}</div>
              {q.customer_address ? (
                <div className="whitespace-pre-line">Address: {formatDepositAddress(q.customer_address)}</div>
              ) : (
                <div>Address: -</div>
              )}
              <div className="text-sm text-muted-foreground">
                Address source: {q.address_source_label || 'Missing — needs follow-up'}
              </div>
              <div>Date: {q.created_at ? new Date(q.created_at).toLocaleString() : '-'}</div>
            </div>
            {q.lead_source && <div>Source: <Badge variant="outline">{q.lead_source}</Badge></div>}
            {shouldOfferStripeBillingRecovery({
              hasOperationalCustomerQuote: Boolean(customerQuoteId),
              boundSessionId: q.stripe_checkout_session_id,
              addressSource: q.address_source || 'missing',
              hasStripeBilling: Boolean(q.stripe_billing_address),
            }) && (
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                onClick={handleRecoverStripeBilling}
                disabled={isRecoveringBilling}
              >
                {isRecoveringBilling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Recover Stripe billing address
              </Button>
            )}
            <div className="border-t mt-2 pt-2">
              {customerQuoteId ? (
                <FollowUpReminder
                  quoteId={customerQuoteId}
                  currentDate={q.follow_up_date || null}
                  onUpdate={(newDate) => setQ(prev => prev ? { ...prev, follow_up_date: newDate } : null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Follow-up is unavailable because this saved quote has no customer quote record.</p>
              )}
            </div>
          </Card>
          
          {/* Trade-In */}
          <Card className="p-4">
            {(() => {
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
                    {hasTradeIn && !isEditingTradeIn && customerQuoteId && (
                      <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setIsEditingTradeIn(true)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </h2>
                  {hasTradeIn ? (
                    <div className="space-y-1">
                      {tradeIn.year && <div>Year: {tradeIn.year}</div>}
                      {tradeIn.brand && <div>Brand: {tradeIn.brand}</div>}
                      {tradeIn.horsepower && <div>HP: {tradeIn.horsepower}</div>}
                      {tradeIn.condition && <div>Condition: {tradeIn.condition}</div>}
                      <div className="border-t pt-1 mt-2">
                        {tradeIn.overrideValue ? (
                          <>
                            <div className="text-amber-600 font-medium">Override Value: {fmt(tradeIn.overrideValue)}</div>
                            <div className="text-xs text-muted-foreground">Formula estimate: {fmt(tradeIn.originalEstimate)}</div>
                          </>
                        ) : (
                          <div>Estimated Value: {fmt(estimatedValue)}</div>
                        )}
                        {q.penalty_applied && (
                          <>
                            <div className="text-yellow-600">Penalty Applied: Yes</div>
                            <div>Penalty Factor: {q.penalty_factor}</div>
                            <div>Reason: {q.penalty_reason}</div>
                          </>
                        )}
                      </div>
                      
                      {/* Inline override editor */}
                      {isEditingTradeIn && (
                        <div className="border-t pt-3 mt-3 space-y-2">
                          <Label className="text-sm font-medium">Override Trade-In Value ($)</Label>
                          <Input
                            type="number"
                            value={tradeInOverride}
                            onChange={(e) => setTradeInOverride(e.target.value)}
                            placeholder="Enter override value..."
                            min={0}
                          />
                          <div className="text-xs text-muted-foreground">
                            Formula estimate: {fmt(tradeIn.originalEstimate || estimatedValue)}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={() => handleSaveTradeInOverride(false)} disabled={isSavingTradeIn || !tradeInOverride}>
                              {isSavingTradeIn ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                              Save
                            </Button>
                            {tradeIn.overrideValue && (
                              <Button size="sm" variant="outline" onClick={() => handleSaveTradeInOverride(true)} disabled={isSavingTradeIn}>
                                Clear Override
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingTradeIn(false)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">No trade-in</div>
                  )}
                </>
              );
            })()}
          </Card>
          
          <Card className="p-4" data-section="motor-configuration">
            <h2 className="font-semibold mb-2">Motor & configuration</h2>
            <div>Motor: {q.quote_data?.motor?.model || q.quote_data?.motor_info?.model || '-'}</div>
            <div>HP: {q.quote_data?.motor?.hp || q.quote_data?.motor_info?.hp || '-'}</div>
            <div>Package: {q.quote_data?.selectedPackage?.label || q.quote_data?.selectedPackage?.id || '-'}</div>
            <div>Options: {(q.quote_data?.selectedOptions || []).map((option: any) => option.name).filter(Boolean).join(', ') || '-'}</div>
          </Card>

          <Card className="p-4" data-section="payment-status">
            <h2 className="font-semibold mb-2">Payment</h2>
            <div>Saved quote / deal: <span className="font-mono text-xs break-all">{savedQuoteDealId || '-'}</span></div>
            <div>Customer quote record: <span className="font-mono text-xs break-all">{customerQuoteId || 'none'}</span></div>
            <div>Quote / deposit status: {q.lead_status || '-'}</div>
            <div>Payment status: {q.payment_status || '-'}</div>
            {legacyJsonPaymentStatusLabel(q.legacy_json_payment_status) && (
              <div className="text-sm text-muted-foreground">
                {legacyJsonPaymentStatusLabel(q.legacy_json_payment_status)}
              </div>
            )}
            <div>Deposit amount: {fmt(q.deposit_amount)}</div>
            <div>Stripe session: <span className="font-mono text-xs break-all">{q.stripe_checkout_session_id || '-'}</span></div>
            <div>Payment intent: <span className="font-mono text-xs break-all">{q.stripe_payment_intent_id || '-'}</span></div>
            <div>Created: {q.created_at ? new Date(q.created_at).toLocaleString() : '-'}</div>
            <div>Paid: {q.payment_paid_at ? new Date(q.payment_paid_at).toLocaleString() : '-'}</div>
          </Card>

          <Card className="p-4" data-section="boat-trade-financing">
            <h2 className="font-semibold mb-2">Boat, trade-in, financing</h2>
            <div>Boat: {q.quote_data?.boatInfo?.make || q.quote_data?.boatInfo?.model || '-'}</div>
            <div>Trade-in: {q.quote_data?.tradeInInfo?.brand || q.quote_data?.tradeIn?.brand || (q.tradein_value_final ? fmt(q.tradein_value_final) : '-')}</div>
            <div>Financing: {q.quote_data?.selectedPromoOption || q.quote_data?.financing?.paymentMethod || '-'}</div>
            <div>Warranty / promotion: {q.quote_data?.warrantyConfig?.totalYears || q.quote_data?.selectedPromoValue || '-'}</div>
            <div>Notes: {q.customer_notes || '-'}</div>
          </Card>

          {/* Financial Summary */}
          <Card className="p-4" data-section="financial-summary">
            <h2 className="font-semibold mb-2">Financial Summary</h2>
            <div>Base price: {depositMoney ? depositMoney.basePrice : fmt(q.base_price)}</div>
            {(q.admin_discount || 0) > 0 && (
              <div className="text-green-600">Admin discount: -{fmt(q.admin_discount)}</div>
            )}
            <div className="font-medium">Final price: {depositMoney ? depositMoney.finalPrice : fmt(q.final_price)}</div>
            <div className="border-t mt-2 pt-2">
              <div>Deposit amount: {depositMoney ? depositMoney.depositAmount : fmt(q.deposit_amount)}</div>
              <div>Loan amount: {depositMoney ? depositMoney.loanAmount : fmt(q.loan_amount)}</div>
              <div>Monthly payment: {depositMoney ? depositMoney.monthlyPayment : fmt(q.monthly_payment)}</div>
              <div>Term months: {depositMoney ? depositMoney.termMonths : q.term_months}</div>
              <div>Total cost: {depositMoney ? depositMoney.totalCost : fmt(q.total_cost)}</div>
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
                  disabled={!customerQuoteId}
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
                  <Button onClick={handleSaveChanges} disabled={isSaving || !customerQuoteId}>
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
                    {promo.warrantyYears > 0
                      ? `${promo.totalWarranty}-Year Factory-Backed Warranty`
                      : 'Current Mercury Promotion'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{promo.label}</span>
                    {promo.value && <Badge variant="secondary">{promo.value}</Badge>}
                  </div>
                  {promo.warrantyYears > 0 && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{promo.totalWarranty}-Year Factory Warranty</span>
                      <Badge variant="outline" className="text-xs">3 + {promo.warrantyYears} FREE</Badge>
                    </div>
                  )}
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

          <Card className="p-4" data-section="canonical-document">
            <h2 className="font-semibold mb-2">Canonical reservation PDF</h2>
            {hasCanonicalDocument ? (
              <>
                <div>Status: bound</div>
                <div>SHA-256: <span className="font-mono text-xs break-all">{q.quote_pdf_sha256}</span></div>
                {historicalCanonicalPdfNote({
                  hasCanonical: true,
                  addressSource: q.address_source || 'missing',
                }) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {historicalCanonicalPdfNote({
                      hasCanonical: true,
                      addressSource: q.address_source || 'missing',
                    })}
                  </p>
                )}
                <Button className="mt-3" onClick={handleDownloadCanonicalPdf} disabled={isDownloadingCanonical}>
                  {isDownloadingCanonical ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {canonicalDocumentLabel(true).button}
                </Button>
              </>
            ) : (
              <>
                <div>Status: unbound / legacy</div>
                <p className="text-sm text-muted-foreground">{canonicalDocumentLabel(false).fallback}</p>
              </>
            )}
          </Card>

          <Card className="p-4" data-section="email-deliveries">
            <h2 className="font-semibold mb-2">Email deliveries</h2>
            {deliveryLoadError ? (
              <p className="text-sm text-destructive">{deliveryLoadError}</p>
            ) : (
              <>
                <div className="text-sm py-1">
                  <strong>Quote notification</strong>:{' '}
                  {quoteNotificationDisplayStatus({
                    rows: q.email_deliveries,
                    legacyQuoteStatus: typeof q.quote_data?.notification_status === 'string'
                      ? q.quote_data.notification_status
                      : null,
                    smsStatus: typeof q.quote_data?.sms_notification_status === 'string'
                      ? q.quote_data.sms_notification_status
                      : null,
                  })}
                </div>
                {['customer', 'hbw', 'grok_bot'].map((audience) => {
                  const row = (q.email_deliveries || []).find((item) => item.audience === audience);
                  return (
                    <div key={audience} className="text-sm py-1">
                      <strong>{audience}</strong>: {deliveryRowDisplayStatus(row)}
                      {row?.attempt_count != null ? ` · attempts ${row.attempt_count}` : ''}
                      {row?.sent_at ? ` · sent ${new Date(row.sent_at).toLocaleString()}` : ''}
                      {row?.last_attempted_at ? ` · last ${new Date(row.last_attempted_at).toLocaleString()}` : ''}
                    </div>
                  );
                })}
              </>
            )}
            <Button
              className="mt-3"
              variant="outline"
              onClick={handleRetryFailedDeliveries}
              disabled={isRetryingEmail || !canRetryDeliveries}
            >
              {isRetryingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Retry failed/missing deliveries
            </Button>
          </Card>

          {/* Share & Download Card */}
          <Card className="p-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Link className="w-4 h-4" />
              Share & Download
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                {hasCanonicalDocument ? (
                  <Button
                    onClick={handleDownloadCanonicalPdf}
                    disabled={isDownloadingCanonical}
                    className="flex-1"
                  >
                    {isDownloadingCanonical ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {canonicalDocumentLabel(true).button}
                  </Button>
                ) : (
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
                    {canonicalDocumentLabel(false).button}
                  </Button>
                )}
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
              {isAuthoritativeDepositPaid({
                customerQuotePaymentStatus: q.payment_status,
                savedQuoteDepositStatus: q.lead_status === 'deposit_paid' ? 'paid' : null,
              }) ? (
                <p className="text-sm text-muted-foreground">
                  This paid deposit packet uses the tracked three-audience confirmation with the bound PDF. Use Email deliveries to retry missing or failed sends.
                </p>
              ) : customerQuoteId ? (
                <SendQuoteEmail
                  quoteId={customerQuoteId}
                  savedQuoteId={savedQuoteDealId}
                  customerName={q.customer_name}
                  customerEmail={q.customer_email}
                  motorModel={q.quote_data?.motor?.model || 'Mercury Motor'}
                  totalPrice={q.final_price}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Email quote is unavailable because this saved quote has no customer quote record.</p>
              )}
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono truncate">
                {SITE_URL}/quote/saved/{(savedQuoteDealId || q.id).slice(0, 8)}...
              </div>
            </div>
          </Card>

          {/* Change Log */}
          {customerQuoteId ? (
            <QuoteChangeLog key={changeLogKey} quoteId={customerQuoteId} />
          ) : (
            <Card className="p-4 text-sm text-muted-foreground">Change log is unavailable because this saved quote has no customer quote record.</Card>
          )}

          {/* Quote History Timeline */}
          <QuoteHistoryTimeline customerEmail={q.customer_email} currentQuoteId={customerQuoteId || q.id} />

          {/* Contact Log */}
          {customerQuoteId ? (
            <ContactLog quoteId={customerQuoteId} customerEmail={q.customer_email} />
          ) : (
            <Card className="p-4 text-sm text-muted-foreground">Contact log is unavailable because this saved quote has no customer quote record.</Card>
          )}
        </div>
      )}
    </main>
  );
};

export default AdminQuoteDetail;
