import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminPromotions from "./pages/AdminPromotions";
import AdminQuotes from "./pages/AdminQuotes";
import AdminQuoteDetail from "./pages/AdminQuoteDetail";
import FinanceCalculator from "./pages/FinanceCalculator";
import StagingPricingTweaks from "./pages/StagingPricingTweaks";
import StagingImageSizing from "./pages/StagingImageSizing";
import StagingImageSizingV2 from "./pages/StagingImageSizingV2";
import StagingImageSizingFinal from "./pages/StagingImageSizingFinal";

const queryClient = new QueryClient();

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
                  <ProtectedRoute>
                    <AdminPromotions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quotes"
                element={
                  <ProtectedRoute>
                    <AdminQuotes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quotes/:id"
                element={
                  <ProtectedRoute>
                    <AdminQuoteDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="/finance-calculator" element={<FinanceCalculator />} />
              <Route path="/staging/pricing-spacing" element={<StagingPricingTweaks />} />
              <Route path="/staging/image-sizing" element={<StagingImageSizing />} />
              <Route path="/staging/image-sizing-v2" element={<StagingImageSizingV2 />} />
              <Route path="/staging/image-sizing-final" element={<StagingImageSizingFinal />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Global footer badges */}
            <footer className="mt-12 border-t border-border bg-muted/30">
              <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-center gap-6">
                <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-10 w-auto" />
                <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-10 w-auto" />
              </div>
            </footer>
          </>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
