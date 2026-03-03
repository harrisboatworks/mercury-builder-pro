import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { LuxuryHeader } from "@/components/ui/luxury-header";
import { SiteFooter } from "@/components/ui/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, ArrowRight, Plus, Download, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SavedQuote {
  id: string;
  email: string;
  quote_state: any;
  created_at: string;
  expires_at: string;
  is_completed: boolean;
  quote_pdf_path?: string | null;
  deposit_pdf_path?: string | null;
  deposit_status?: string | null;
  deposit_amount?: number | null;
  deposit_paid_at?: string | null;
}

export default function MyQuotesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "My Saved Quotes | Harris Boat Works";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: "/my-quotes" } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadQuotes();
    }
  }, [user]);

  const loadQuotes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_quotes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading quotes:", error);
      } else {
        setQuotes((data as any[]) || []);
      }
    } catch (err) {
      console.error("Error loading quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getMotorName = (quoteState: any) => {
    return quoteState?.motor?.model || 
           quoteState?.selectedMotor?.model || 
           quoteState?.selectedMotor?.display_name || 
           "Mercury Motor";
  };

  const getQuoteTotal = (quoteState: any) => {
    // Use pricing data if available (most accurate)
    if (quoteState?.pricing?.totalCashPrice) return quoteState.pricing.totalCashPrice;
    
    const motorPrice = quoteState?.motor?.msrp || quoteState?.selectedMotor?.msrp || 0;
    const optionsTotal = quoteState?.selectedOptions?.reduce(
      (sum: number, opt: any) => sum + (opt.price || 0), 0
    ) || 0;
    return motorPrice + optionsTotal;
  };

  const handleDownloadPDF = async (quote: SavedQuote) => {
    // Use deposit PDF if deposit is paid, otherwise clean quote PDF
    const pdfPath = (quote.deposit_status === 'paid' && quote.deposit_pdf_path) 
      ? quote.deposit_pdf_path 
      : quote.quote_pdf_path;
    
    if (!pdfPath) {
      // No stored PDF — regenerate on-the-fly
      try {
        setDownloadingId(quote.id);
        const { generateQuotePDF, downloadPDF } = await import('@/lib/react-pdf-generator');
        
        const qs = quote.quote_state;
        const motor = qs?.motor || qs?.selectedMotor || {};
        const pricing = qs?.pricing || {};
        
        const pdfData = {
          quoteNumber: `HBW-${quote.id.slice(0, 6).toUpperCase()}`,
          customerName: qs?.customerName || quote.email,
          customerEmail: quote.email,
          customerPhone: qs?.customerPhone || '',
          motor: {
            model: motor.model || 'Mercury Motor',
            hp: motor.hp || motor.horsepower || 0,
            msrp: motor.msrp || 0,
            base_price: motor.base_price || motor.msrp || 0,
            sale_price: motor.sale_price || motor.msrp || 0,
            dealer_price: motor.dealer_price || motor.msrp || 0,
            model_year: motor.year || motor.model_year || 2026,
            category: motor.category || 'FourStroke',
          },
          selectedPackage: qs?.selectedPackage,
          accessoryBreakdown: qs?.accessoryBreakdown || [],
          pricing,
          includesInstallation: qs?.purchasePath === 'installed',
          selectedPromoOption: qs?.selectedPromoOption,
          selectedPromoValue: qs?.selectedPromoValue,
          ...(quote.deposit_status === 'paid' && quote.deposit_amount ? {
            depositInfo: {
              amount: quote.deposit_amount,
              referenceNumber: `HBW-DEP-${quote.id.slice(0, 6).toUpperCase()}`,
              paymentDate: quote.deposit_paid_at 
                ? new Date(quote.deposit_paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              status: 'Confirmed',
            },
          } : {}),
        };

        const pdfUrl = await generateQuotePDF(pdfData);
        downloadPDF(pdfUrl, `Mercury-Quote-${pdfData.quoteNumber}.pdf`);
      } catch (err) {
        console.error('Error generating PDF:', err);
        toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
      } finally {
        setDownloadingId(null);
      }
      return;
    }

    // Download from storage
    try {
      setDownloadingId(quote.id);
      const { data, error } = await supabase.storage.from('quotes').download(pdfPath);
      if (error || !data) throw error || new Error('No data');
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Mercury-Quote-${quote.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast({ title: "Error", description: "Failed to download PDF.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LuxuryHeader />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LuxuryHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Quotes</h1>
            <p className="text-muted-foreground mt-1">
              Your saved motor configurations and deposits
            </p>
          </div>
          <Button asChild>
            <Link to="/quote/motor-selection">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : quotes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Saved Quotes</h2>
            <p className="text-muted-foreground mb-6">
              You haven't saved any quotes yet. Start configuring your perfect Mercury motor!
            </p>
            <Button asChild>
              <Link to="/quote/motor-selection">
                Browse Motors
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => {
              const expired = isExpired(quote.expires_at);
              const motorName = getMotorName(quote.quote_state);
              const total = getQuoteTotal(quote.quote_state);
              const isDepositPaid = quote.deposit_status === 'paid';
              const isDepositPending = quote.deposit_status === 'pending';
              const balanceDue = isDepositPaid && quote.deposit_amount && total > 0
                ? total - quote.deposit_amount
                : null;
              
              return (
                <Card 
                  key={quote.id} 
                  className={`p-6 transition-all hover:shadow-md ${expired && !isDepositPaid ? 'opacity-60' : ''} ${isDepositPaid ? 'border-green-500/30 bg-green-50/5' : ''}`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Top row: Motor name + badges */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-foreground">
                            {motorName}
                          </h3>
                          {isDepositPaid ? (
                            <Badge className="bg-emerald-600 text-primary-foreground gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Deposit Paid — ${quote.deposit_amount?.toLocaleString()}
                            </Badge>
                          ) : isDepositPending ? (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Deposit Pending
                            </Badge>
                          ) : expired ? (
                            <Badge variant="secondary">Expired</Badge>
                          ) : (
                            <Badge variant="outline">Quote</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDistanceToNow(new Date(quote.created_at || ''), { addSuffix: true })}
                            </span>
                          </div>
                          {total > 0 && (
                            <span className="font-medium text-foreground">
                              ${total.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                          {isDepositPaid && quote.deposit_paid_at && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Paid {formatDistanceToNow(new Date(quote.deposit_paid_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>

                        {/* Balance due */}
                        {balanceDue !== null && balanceDue > 0 && (
                          <p className="text-sm font-medium text-foreground">
                            Balance Due: <span className="text-primary">${balanceDue.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </p>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote)}
                          disabled={downloadingId === quote.id}
                        >
                          <Download className="h-4 w-4 mr-1.5" />
                          {downloadingId === quote.id ? 'Generating...' : 'PDF'}
                        </Button>
                        
                        {!expired && (
                          <Button
                            size="sm"
                            asChild
                          >
                            <Link to={`/quote/saved/${quote.id}`}>
                              View Quote
                              <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}
