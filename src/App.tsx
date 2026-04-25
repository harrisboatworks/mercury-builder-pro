import { lazy, Suspense, useEffect } from "react";
import { SITE_URL } from "./lib/site";
import { GlobalSEO } from "./components/seo/GlobalSEO";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QuoteProvider } from "@/contexts/QuoteContext";
import { FinancingProvider } from "@/contexts/FinancingContext";
import { MotorComparisonProvider } from "@/contexts/MotorComparisonContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SecureRoute } from "@/components/auth/SecureRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { NotificationToast } from "@/components/notifications/NotificationToast";

import { GlobalStickyQuoteBar } from "@/components/quote/GlobalStickyQuoteBar";
import { PricingRibbon } from "@/components/marketing/PricingRibbon";
import { RouteLoader } from "@/components/ui/RouteLoader";
import { GlobalAIChat } from "@/components/chat/GlobalAIChat";
import { UnifiedMobileBar } from "@/components/quote-builder/UnifiedMobileBar";
import { ComparisonDesktopButton } from "@/components/motors/ComparisonDesktopButton";
import { usePageViewTracker } from "@/hooks/usePageViewTracker";
import { GoogleRatingBadge } from "@/components/business/GoogleRatingBadge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SoundProvider } from "@/contexts/SoundContext";
import { useAuth } from "@/components/auth/AuthProvider";

// Note: Removed framer-motion AnimatePresence (~120KB) to reduce initial bundle
// Page transitions now use CSS instead of JavaScript animations

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Quote builder pages
const MotorSelectionPage = lazy(() => import("@/pages/quote/MotorSelectionPage"));
const OptionsPage = lazy(() => import("@/pages/quote/OptionsPage"));
const PurchasePathPage = lazy(() => import("@/pages/quote/PurchasePathPage"));
const BoatInfoPage = lazy(() => import("@/pages/quote/BoatInfoPage"));
const FuelTankPage = lazy(() => import("@/pages/quote/FuelTankPage"));
const TradeInPage = lazy(() => import("@/pages/quote/TradeInPage"));
const InstallationPage = lazy(() => import("@/pages/quote/InstallationPage"));
const QuoteSummaryPage = lazy(() => import("@/pages/quote/QuoteSummaryPage"));
const SchedulePage = lazy(() => import("@/pages/quote/SchedulePage"));
const SavedQuotePage = lazy(() => import("@/pages/quote/SavedQuotePage"));
const QuoteSuccessPage = lazy(() => import("@/pages/quote/QuoteSuccessPage"));
const PromoSelectionPage = lazy(() => import("@/pages/quote/PromoSelectionPage"));
const PackageSelectionPage = lazy(() => import("@/pages/quote/PackageSelectionPage"));
const MyQuotes = lazy(() => import("@/pages/account/MyQuotesPage"));

// Admin pages
const AdminPromotions = lazy(() => import("./pages/AdminPromotions"));
const AdminQuotes = lazy(() => import("./pages/AdminQuotes"));
const AdminQuoteDetail = lazy(() => import("./pages/AdminQuoteDetail"));
const AdminQuoteBuilder = lazy(() => import("./pages/admin/AdminQuoteBuilder"));
const FinancingAdmin = lazy(() => import("./components/admin/FinancingAdmin"));
const AdminFinancingApplications = lazy(() => import("./pages/AdminFinancingApplications"));
const AdminSecurity = lazy(() => import("./pages/AdminSecurity"));
const AdminSINEncryptionTest = lazy(() => import("./pages/AdminSINEncryptionTest"));
const AdminZapier = lazy(() => import("./pages/AdminZapier"));
const AdminEmail = lazy(() => import("./pages/AdminEmail"));
const AdminEmailAnalytics = lazy(() => import("./pages/AdminEmailAnalytics"));
const AdminAbandonedQuoteAnalytics = lazy(() => import("./pages/AdminAbandonedQuoteAnalytics"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminSMS = lazy(() => import("./pages/AdminSMS"));
const AdminInventory = lazy(() => import("./pages/AdminInventory"));
const AdminAgentFunnel = lazy(() => import("./pages/admin/AgentFunnel"));
const AdminStockSync = lazy(() => import("./pages/AdminStockSync"));
const AdminConnectors = lazy(() => import("./pages/AdminConnectors"));
const AdminSources = lazy(() => import("./pages/AdminSources"));
const AdminPricingImport = lazy(() => import("./pages/AdminPricingImport"));
const MotorOptionsCatalog = lazy(() => import("./components/admin/options/MotorOptionsCatalog"));
const MotorOptionsManager = lazy(() => import("./components/admin/options/MotorOptionsManager"));
const MotorOptionRules = lazy(() => import("./components/admin/options/MotorOptionRules"));
const AdminQuoteActivity = lazy(() => import("./pages/AdminQuoteActivity"));
const UpdateMotorImages = lazy(() => import("./components/motors/UpdateMotorImages"));

// Payment pages
const Deposits = lazy(() => import("./pages/Deposits"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));

// Financing pages
const FinancingApplication = lazy(() => import("./pages/FinancingApplication"));
const FinancingFromQuote = lazy(() => import("./pages/financing/FinancingFromQuote"));
const FinancingResume = lazy(() => import("./pages/FinancingResume"));
const FinancingSuccess = lazy(() => import("./pages/FinancingSuccess"));

// Other pages
const FinanceCalculator = lazy(() => import("./pages/FinanceCalculator"));
const Contact = lazy(() => import("./pages/Contact"));
const Accessories = lazy(() => import("./pages/Accessories"));
const NewQuote = lazy(() => import("./pages/NewQuote"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Repower = lazy(() => import("./pages/Repower"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const RssFeed = lazy(() => import("./pages/RssFeed"));
const BlogUnsubscribe = lazy(() => import("./pages/BlogUnsubscribe"));
const Compare = lazy(() => import("./pages/Compare"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TikTokCallback = lazy(() => import("./pages/TikTokCallback"));
const MotorRedirect = lazy(() => import("./pages/MotorRedirect"));
const MotorPage = lazy(() => import("./pages/MotorPage"));
const TradeInValuePage = lazy(() => import("./pages/TradeInValuePage"));
const FrenchLanding = lazy(() => import("./pages/FrenchLanding"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const CaseStudyDetail = lazy(() => import("./pages/CaseStudyDetail"));
const Locations = lazy(() => import("./pages/Locations"));
const LocationDetail = lazy(() => import("./pages/LocationDetail"));

// Pilot SEO landing pages (Batch 1 — FAQ / Trust / HowTo)
const MercuryRepowerFAQ = lazy(() => import("./pages/landing/MercuryRepowerFAQ"));
const HowToRepower = lazy(() => import("./pages/landing/HowToRepower"));
const MercuryDealerCanadaFAQ = lazy(() => import("./pages/landing/MercuryDealerCanadaFAQ"));
// Pilot SEO landing pages (Batch 2 — Geo)
const MercuryDealerPeterborough = lazy(() => import("./pages/landing/MercuryDealerPeterborough"));
const MercuryDealerCobourg = lazy(() => import("./pages/landing/MercuryDealerCobourg"));
const MercuryDealerGTA = lazy(() => import("./pages/landing/MercuryDealerGTA"));
// Pilot SEO landing pages (Batch 3 — Product hub + lineup)
const MercuryProXS = lazy(() => import("./pages/landing/MercuryProXS"));
const MercuryOutboardsOntario = lazy(() => import("./pages/landing/MercuryOutboardsOntario"));
// Pilot SEO landing pages (Batch 4 — Pontoon)
const MercuryPontoonOutboards = lazy(() => import("./pages/landing/MercuryPontoonOutboards"));
const MandarinLanding = lazy(() => import("./pages/MandarinLanding"));
const FrenchBlogArticle = lazy(() => import("./pages/blog/FrenchBlogArticle"));
const FrenchBlogArticlePage = lazy(() => import("./pages/blog/FrenchBlogArticlePage"));
const MandarinBlogArticle = lazy(() => import("./pages/blog/MandarinBlogArticle"));
const MandarinBlogArticlePage = lazy(() => import("./pages/blog/MandarinBlogArticlePage"));
const KoreanBlogArticlePage = lazy(() => import("./pages/blog/KoreanBlogArticlePage"));
const SpanishBlogArticlePage = lazy(() => import("./pages/blog/SpanishBlogArticlePage"));

// Test/Dev pages (low priority)
// IMPORTANT: Keep dev-only tooling (e.g., Transformers/ONNX background removal) out of production bundles.
// Vite replaces `import.meta.env.DEV` at build time, so the Dev import is tree-shaken from production.
const Dev = lazy(() => import("./pages/Dev"));
const TestEmail = lazy(() => import("./pages/TestEmail"));
const TestFinancingEmails = lazy(() => import("./pages/TestFinancingEmails"));
const StagingImageSizing = lazy(() => import("./pages/StagingImageSizing"));
const StagingImageSizingV2 = lazy(() => import("./pages/StagingImageSizingV2"));
const StagingImageSizingFinal = lazy(() => import("./pages/StagingImageSizingFinal"));
const VoiceTest = lazy(() => import("./pages/VoiceTest"));
const AgentsHub = lazy(() => import("./pages/AgentsHub"));

function Canonical() {
  useEffect(() => {
    // Only set a canonical if the prerendered HTML did NOT already provide one,
    // and only if no per-page SEO component (with data-rh="true") owns it.
    // This prevents the runtime override from clobbering page-specific canonicals
    // (e.g. /mercury-pro-xs) with the generic origin+pathname value.
    const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (existing) {
      // Respect prerendered or Helmet-managed canonicals.
      return;
    }
    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = `${SITE_URL}${window.location.pathname}`;
    document.head.appendChild(link);
  }, []);
  return null;
}

function RootRedirect() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const hasAuthParams = params.has('code') || hash.includes('access_token') || params.has('error');

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAuthParams && !loading) {
      navigate(user ? '/dashboard' : '/quote/motor-selection', { replace: true });
    }
  }, [loading, user, hasAuthParams, navigate]);

  if (hasAuthParams) {
    return <RouteLoader />;
  }

  return <Index />;
}

function AnimatedRoutes() {
  const location = useLocation();
  usePageViewTracker();
  
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes location={location} key={location.pathname}>
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
        <Route path="/" element={<RootRedirect />} />
        <Route path="/motors/:slug" element={<MotorPage />} />
        <Route path="/index" element={<Index />} />
                
        {/* Quote Builder Routes */}
        <Route path="/quote" element={<MotorSelectionPage />} />
        <Route path="/quote/motor-selection" element={<MotorSelectionPage />} />
        <Route path="/quote/options" element={<OptionsPage />} />
        <Route path="/quote/purchase-path" element={<PurchasePathPage />} />
        <Route path="/quote/boat-info" element={<BoatInfoPage />} />
        <Route path="/quote/fuel-tank" element={<FuelTankPage />} />
        <Route path="/quote/trade-in" element={<TradeInPage />} />
        <Route path="/quote/installation" element={<InstallationPage />} />
        <Route path="/quote/promo-selection" element={<PromoSelectionPage />} />
        <Route path="/quote/package-selection" element={<PackageSelectionPage />} />
        <Route path="/quote/summary" element={<QuoteSummaryPage />} />
        <Route path="/quote/schedule" element={<SchedulePage />} />
        <Route path="/quote/success" element={<QuoteSuccessPage />} />
        <Route path="/quote/saved/:quoteId" element={<SavedQuotePage />} />
        
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
          path="/admin"
          element={
            <SecureRoute requireAdmin={true}>
              <Navigate to="/admin/quotes" replace />
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
          path="/admin/quote/new"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminQuoteBuilder />
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
        <Route
          path="/admin/financing-applications"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminFinancingApplications />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/security"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminSecurity />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/sin-encryption-test"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminSINEncryptionTest />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/zapier"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminZapier />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/email"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminEmail />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/email-analytics"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminEmailAnalytics />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/abandoned-quotes"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminAbandonedQuoteAnalytics />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminPayments />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminInventory />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/agent-funnel"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminAgentFunnel />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/stock-sync"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminStockSync />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/connectors"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminConnectors />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/sms"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminSMS />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/sources"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminSources />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/options-catalog"
          element={
            <SecureRoute requireAdmin={true}>
              <MotorOptionsCatalog />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/options-manager"
          element={
            <SecureRoute requireAdmin={true}>
              <MotorOptionsManager />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/option-rules"
          element={
            <SecureRoute requireAdmin={true}>
              <MotorOptionRules />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/quote-activity"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminQuoteActivity />
            </SecureRoute>
          }
        />
        
        {/* Payment Routes */}
        <Route path="/deposits" element={<Deposits />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-canceled" element={<PaymentCanceled />} />
        
        {/* Other Routes */}
        <Route path="/financing" element={<Navigate to="/finance-calculator" replace />} />
        <Route path="/finance-calculator" element={<FinanceCalculator />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/agents" element={<AgentsHub />} />
        <Route path="/dev" element={<Dev />} />
        <Route path="/voice-test" element={<VoiceTest />} />
        {/* Removed obsolete test routes */}
        <Route path="/quotes/new" element={<NewQuote />} />
        <Route path="/staging/image-sizing" element={<StagingImageSizing />} />
        <Route path="/staging/image-sizing-v2" element={<StagingImageSizingV2 />} />
        <Route path="/staging/image-sizing-final" element={<StagingImageSizingFinal />} />
        <Route path="/test-email" element={<TestEmail />} />
        <Route path="/test-financing-emails" element={<TestFinancingEmails />} />
        {/* Removed obsolete test pricing routes */}
        
        {/* Admin Import Routes */}
        <Route
          path="/admin/pricing-import"
          element={
            <SecureRoute requireAdmin={true}>
              <AdminPricingImport />
            </SecureRoute>
          }
        />
        <Route
          path="/admin/update-images"
          element={
            <SecureRoute requireAdmin={true}>
              <UpdateMotorImages />
            </SecureRoute>
          }
        />
        
        {/* Financing Application Routes */}
        <Route path="/financing-application" element={<FinancingApplication />} />
        <Route path="/financing-application/from-quote" element={<FinancingFromQuote />} />
        <Route path="/financing/apply" element={<FinancingApplication />} />
        <Route path="/financing/resume" element={<FinancingResume />} />
        <Route path="/financing/success" element={<FinancingSuccess />} />
        
        {/* Accessories Page */}
        <Route path="/accessories" element={<Accessories />} />
        
        {/* Promotions Page */}
        <Route path="/promotions" element={<Promotions />} />
        
        {/* Repower Page */}
        <Route path="/repower" element={<Repower />} />
        
        {/* Compare Page */}
        <Route path="/compare" element={<Compare />} />
        
        {/* Trade-In Value Estimator */}
        <Route path="/trade-in-value" element={<TradeInValuePage />} />
        
        {/* About Page */}
        <Route path="/about" element={<About />} />
        
        {/* FAQ Page */}
        <Route path="/faq" element={<FAQ />} />
        
        {/* Terms & Conditions / Privacy (direct URL only, not in nav) */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        {/* TikTok OAuth Callback */}
        <Route path="/auth/tiktok/callback" element={<TikTokCallback />} />
        
        {/* Multilingual Landing Pages */}
        <Route path="/fr" element={<FrenchLanding />} />
        <Route path="/zh" element={<MandarinLanding />} />
        
        {/* Blog Routes */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/fr/concessionnaire-mercury-platinum-ontario" element={<FrenchBlogArticle />} />
        <Route path="/blog/fr/:slug" element={<FrenchBlogArticlePage />} />
        <Route path="/blog/zh/mercury-repower-guide-gta" element={<MandarinBlogArticle />} />
        <Route path="/blog/zh/:slug" element={<MandarinBlogArticlePage />} />
        <Route path="/blog/ko/:slug" element={<KoreanBlogArticlePage />} />
        <Route path="/blog/es/:slug" element={<SpanishBlogArticlePage />} />
        <Route path="/blog/:slug" element={<BlogArticle />} />
        <Route path="/blog/unsubscribe" element={<BlogUnsubscribe />} />
        <Route path="/rss.xml" element={<RssFeed />} />
        <Route path="/admin/blog" element={<SecureRoute><AdminBlog /></SecureRoute>} />

        {/* Case Studies */}
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/locations/:slug" element={<LocationDetail />} />
        
        {/* Unsubscribe Route */}
        <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
        
        {/* Pilot SEO Landing Pages — Batch 1 */}
        <Route path="/mercury-repower-faq" element={<MercuryRepowerFAQ />} />
        <Route path="/how-to-repower-a-boat" element={<HowToRepower />} />
        <Route path="/mercury-dealer-canada-faq" element={<MercuryDealerCanadaFAQ />} />
        {/* Pilot SEO Landing Pages — Batch 2 (Geo) */}
        <Route path="/mercury-dealer-peterborough" element={<MercuryDealerPeterborough />} />
        <Route path="/mercury-dealer-cobourg" element={<MercuryDealerCobourg />} />
        <Route path="/mercury-dealer-gta" element={<MercuryDealerGTA />} />
        {/* Pilot SEO Landing Pages — Batch 3 (Product hub + lineup) */}
        <Route path="/mercury-pro-xs" element={<MercuryProXS />} />
        <Route path="/mercury-outboards-ontario" element={<MercuryOutboardsOntario />} />
        {/* Pilot SEO Landing Pages — Batch 4 (Pontoon) */}
        <Route path="/mercury-pontoon-outboards" element={<MercuryPontoonOutboards />} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => {
  // Warm up the shared-quote edge function to eliminate cold starts for customers
  useEffect(() => {
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ ping: true }),
    }).catch(() => {});
  }, []);

  return (
  <ErrorBoundary>
    <AuthProvider>
      <SoundProvider>
        <FinancingProvider>
          <QuoteProvider>
            <MotorComparisonProvider>
              <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GlobalAIChat>
                <div data-vaul-drawer-wrapper className="min-h-screen bg-background">
                  <ScrollToTop />
                  <PricingRibbon />
                  <GlobalSEO />
                  <NotificationToast />
                  
                  <AnimatedRoutes />
                  <GlobalStickyQuoteBar />
                  <UnifiedMobileBar />
                  <ComparisonDesktopButton />
                  <Canonical />

                  <footer className="mt-12 border-t border-border bg-muted/30">
                    <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                      <div className="flex items-center gap-4 md:gap-8">
                        <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-12 md:h-16 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                        <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-12 md:h-16 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                      </div>
                      <GoogleRatingBadge variant="compact" />
                    </div>
                  </footer>
                </div>
              </GlobalAIChat>
            </BrowserRouter>
            </TooltipProvider>
            </MotorComparisonProvider>
          </QuoteProvider>
        </FinancingProvider>
      </SoundProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
};

export default App;
