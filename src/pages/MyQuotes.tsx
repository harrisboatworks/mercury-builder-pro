import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, DollarSign, Settings, Trash2 } from 'lucide-react';
import { listQuotes } from '@/lib/quotesApi';
import { toast } from '@/hooks/use-toast';
import { generateQuotePDF } from '@/lib/pdf-generator';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedQuote {
  id: string;
  customer_name?: string;
  motor_model?: string;
  final_price?: number;
  created_at: string;
  quote_data?: any;
}

export default function MyQuotes() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Saved Quotes | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'View and manage your saved Mercury motor quotes, download PDFs, and compare pricing options.';
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadQuotes();
    }
  }, [user, authLoading, navigate]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await listQuotes(50);
      if (response.ok) {
        setQuotes(response.quotes || []);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast({
        title: 'Error loading quotes',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (quote: SavedQuote) => {
    try {
      if (!quote.quote_data) {
        toast({
          title: 'Quote data unavailable',
          description: 'Unable to generate PDF for this quote.',
          variant: 'destructive',
        });
        return;
      }

      const pdfUrl = await generateQuotePDF({
        quoteNumber: quote.id.slice(0, 8).toUpperCase(),
        customerName: quote.customer_name || 'Valued Customer',
        customerEmail: '',
        customerPhone: '',
        motor: {
          model: quote.quote_data?.motor?.model || 'Mercury Motor',
          hp: quote.quote_data?.motor?.hp || 0,
          year: quote.quote_data?.motor?.year,
          sku: (quote.quote_data?.motor as any)?.sku
        },
        pricing: {
          msrp: quote.final_price * 1.2, // Estimate MSRP
          discount: quote.final_price * 0.1, // Estimate discount
          promoValue: 0,
          subtotal: quote.final_price,
          tradeInValue: undefined,
          subtotalAfterTrade: quote.final_price,
          hst: quote.final_price * 0.13,
          totalCashPrice: quote.final_price * 1.13,
          savings: quote.final_price * 0.1
        },
        specs: [
          { label: "HP", value: `${quote.quote_data?.motor?.hp || 0}` },
          { label: "Year", value: `${quote.quote_data?.motor?.year || 2025}` }
        ].filter(spec => spec.value && spec.value !== '0')
      });

      // Download the PDF
      const { downloadPDF } = await import('@/lib/pdf-generator');
      downloadPDF(pdfUrl, `mercury-quote-${quote.id.slice(0, 8)}.pdf`);
      
      toast({
        title: 'PDF Downloaded',
        description: 'Your quote has been saved to your downloads.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Download failed',
        description: 'Unable to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (createdAt: string) => {
    const created = new Date(createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (created < thirtyDaysAgo) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Saved Quotes</h1>
              <p className="text-muted-foreground mt-2">
                Manage your Mercury motor quotes and download PDFs
              </p>
            </div>
            <Button onClick={() => navigate('/quote/motor-selection')}>
              Create New Quote
            </Button>
          </div>

          {quotes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No saved quotes</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any quotes yet. Create your first quote to get started.
                </p>
                <Button onClick={() => navigate('/quote/motor-selection')}>
                  Build Your First Quote
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {quotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {quote.motor_model || 'Mercury Motor Quote'}
                      </CardTitle>
                      {getStatusBadge(quote.created_at)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created {format(new Date(quote.created_at), 'MMM d, yyyy')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">{quote.customer_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Motor Model</p>
                        <p className="font-medium">{quote.motor_model || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Price</p>
                        <p className="font-semibold text-lg flex items-center">
                          <DollarSign className="w-4 h-4" />
                          {quote.final_price?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(quote)}
                        disabled={!quote.quote_data}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(`${window.location.origin}/quote/${quote.id}`);
                          toast({
                            title: 'Link copied',
                            description: 'Quote link copied to clipboard.',
                          });
                        }}
                      >
                        Share Quote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}