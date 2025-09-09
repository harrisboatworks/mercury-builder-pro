import Dev from "./pages/Dev";
import { useEffect } from "react";
import { SITE_URL } from "./lib/site";
import { Toaster } from "@/components/ui/toaster";
import NewQuote from "./pages/NewQuote";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuoteProvider } from "@/contexts/QuoteContext";

// Quote builder pages
import MotorSelectionPage from "@/pages/quote/MotorSelectionPage";
import PurchasePathPage from "@/pages/quote/PurchasePathPage";
import BoatInfoPage from "@/pages/quote/BoatInfoPage";
import FuelTankPage from "@/pages/quote/FuelTankPage";
import TradeInPage from "@/pages/quote/TradeInPage";
import InstallationPage from "@/pages/quote/InstallationPage";
import QuoteSummaryPage from "@/pages/quote/QuoteSummaryPage";
import SchedulePage from "@/pages/quote/SchedulePage";
import MyQuotes from "@/pages/MyQuotes";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SecureRoute } from "@/components/auth/SecureRoute";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ChatWidget } from "@/components/chat/ChatWidget";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AdminPromotions from "./pages/AdminPromotions";
import AdminQuotes from "./pages/AdminQuotes";
import AdminQuoteDetail from "./pages/AdminQuoteDetail";
import FinanceCalculator from "./pages/FinanceCalculator";
import StagingPricingTweaks from "./pages/StagingPricingTweaks";
import StagingImageSizing from "./pages/StagingImageSizing";
import StagingImageSizingV2 from "./pages/StagingImageSizingV2";
import StagingImageSizingFinal from "./pages/StagingImageSizingFinal";
import FinancingAdmin from "./components/admin/FinancingAdmin";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Settings from "./pages/Settings";

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
  <AuthProvider>
    <QuoteProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <>
              <ScrollToTop />
              <Routes>
                <Route path="/auth" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <SecureRoute>
                      <Dashboard />
                    </SecureRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/" element={<Index />} />
                
                {/* Quote Builder Routes */}
                <Route path="/quote" element={<MotorSelectionPage />} />
                <Route path="/quote/motor-selection" element={<MotorSelectionPage />} />
                <Route path="/quote/purchase-path" element={<PurchasePathPage />} />
                <Route path="/quote/boat-info" element={<BoatInfoPage />} />
                <Route path="/quote/fuel-tank" element={<FuelTankPage />} />
                <Route path="/quote/trade-in" element={<TradeInPage />} />
                <Route path="/quote/installation" element={<InstallationPage />} />
                <Route path="/quote/summary" element={<QuoteSummaryPage />} />
                <Route path="/quote/schedule" element={<SchedulePage />} />
                
                {/* User Account Routes */}
                <Route path="/my-quotes" element={<MyQuotes />} />
                
                {/* Admin Routes */}
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
                <Route
                  path="/admin/financing"
                  element={
                    <SecureRoute requireAdmin={true}>
                      <FinancingAdmin />
                    </SecureRoute>
                  }
                />
                
                {/* Payment Routes */}
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-canceled" element={<PaymentCanceled />} />
                
                {/* Other Routes */}
                <Route path="/finance-calculator" element={<FinanceCalculator />} />
                <Route path="/dev" element={<Dev />} />
                <Route path="/staging/pricing-spacing" element={<StagingPricingTweaks />} />
                <Route path="/quotes/new" element={<NewQuote />} />
                <Route path="/staging/image-sizing" element={<StagingImageSizing />} />
                <Route path="/staging/image-sizing-v2" element={<StagingImageSizingV2 />} />
                <Route path="/staging/image-sizing-final" element={<StagingImageSizingFinal />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Canonical />
              <ChatWidget />

              <footer className="mt-12 border-t border-border bg-muted/30">
                <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-center gap-8">
                  <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-16 md:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                  <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-16 md:h-20 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                </div>
              </footer>
            </>
        </BrowserRouter>
      </TooltipProvider>
    </QuoteProvider>
  </AuthProvider>
);

export default App;
