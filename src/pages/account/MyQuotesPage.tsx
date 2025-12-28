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
import { FileText, Calendar, DollarSign, ArrowRight, Plus } from "lucide-react";

import { formatDistanceToNow } from "date-fns";

interface SavedQuote {
  id: string;
  email: string;
  quote_state: any;
  created_at: string;
  expires_at: string;
  is_completed: boolean;
}

export default function MyQuotesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);

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
        setQuotes(data || []);
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
    return quoteState?.selectedMotor?.model || 
           quoteState?.selectedMotor?.display_name || 
           "Mercury Motor";
  };

  const getQuoteTotal = (quoteState: any) => {
    // Try to calculate from the quote state
    const motorPrice = quoteState?.selectedMotor?.msrp || 0;
    const optionsTotal = quoteState?.configuratorOptions?.selectedOptions?.reduce(
      (sum: number, opt: any) => sum + (opt.price || 0), 0
    ) || 0;
    const warrantyPrice = quoteState?.warrantyConfig?.totalPrice || 0;
    return motorPrice + optionsTotal + warrantyPrice;
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
            <h1 className="text-3xl font-bold text-foreground">My Saved Quotes</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your saved motor configurations
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
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
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
              
              return (
                <Card 
                  key={quote.id} 
                  className={`p-6 transition-all hover:shadow-md ${expired ? 'opacity-60' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {motorName}
                        </h3>
                        {expired ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600">Active</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Saved {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {total > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span>${total.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant={expired ? "outline" : "default"}
                        disabled={expired}
                        asChild={!expired}
                      >
                        {expired ? (
                          <span>Quote Expired</span>
                        ) : (
                          <Link to={`/quote/saved/${quote.id}`}>
                            View Quote
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        )}
                      </Button>
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