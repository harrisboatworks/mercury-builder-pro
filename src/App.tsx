import Dev from "./pages/Dev";
import { useEffect } from "react";
import { SITE_URL } from "./lib/site";
import { Toaster } from "@/components/ui/toaster";
import NewQuote from "./pages/NewQuote";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SecureRoute } from "@/components/auth/SecureRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PreviewRedesign from "./pages/PreviewRedesign";
import AdminPromotions from "./pages/AdminPromotions";
import AdminQuotes from "./pages/AdminQuotes";
import AdminQuoteDetail from "./pages/AdminQuoteDetail";
import FinanceCalculator from "./pages/FinanceCalculator";
import StagingPricingTweaks from "./pages/StagingPricingTweaks";
import StagingImageSizing from "./pages/StagingImageSizing";
import StagingImageSizingV2 from "./pages/StagingImageSizingV2";
import StagingImageSizingFinal from "./pages/StagingImageSizingFinal";
import FinancingAdmin from "./components/admin/FinancingAdmin";

const queryClient = new QueryClient();
function Canonical() {
  useEffect(() => {
    const href = `${SITE_URL}${window.location.pathname}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route
                path="/admin/promotions"
                element={
                  <SecureRoute requireAdmin={true}>
                    <AdminPromotions />
                  </SecureRoute>
                }
              />
              <Route
                path="/admin/quotes"
                element={
                  <SecureRoute requireAdmin={true}>
                    <AdminQuotes />
                  </SecureRoute>
                }
              />
              <Route
                path="/admin/quotes/:id"
                element={
                  <SecureRoute requireAdmin={true}>
                    <AdminQuoteDetail />
                  </SecureRoute>
                }
              />
              <Route path="/finance-calculator" element={<FinanceCalculator />} />
              <Route
                path="/admin/financing"
                element={
                  <SecureRoute requireAdmin={true}>
                    <FinancingAdmin />
                  </SecureRoute>
                }
              />
              <Route path="/dev" element={<Dev />} />
              <Route path="/staging/pricing-spacing" element={<StagingPricingTweaks />} />
              <Route path="/quotes/new" element={<NewQuote />} />
              <Route path="/staging/image-sizing" element={<StagingImageSizing />} />
              <Route path="/staging/image-sizing-v2" element={<StagingImageSizingV2 />} />
              <Route path="/staging/image-sizing-final" element={<StagingImageSizingFinal />} />
              <Route path="/preview-redesign" element={<PreviewRedesign />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Canonical />

            <footer className="mt-12 border-t border-border bg-muted/30">
              <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-center gap-8">
                <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-16 md:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-16 md:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity" />
              </div>
            </footer>
          </>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
