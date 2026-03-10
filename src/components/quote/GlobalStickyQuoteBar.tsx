import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateMonthlyPayment, DEALERPLAN_FEE, FINANCING_MINIMUM } from '@/lib/finance';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useQuoteRunningTotal } from '@/hooks/useQuoteRunningTotal';
import StickyQuoteBar from './StickyQuoteBar';

export function GlobalStickyQuoteBar() {
  const { state } = useQuote();
  const location = useLocation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { promo } = useActiveFinancingPromo();
  const { getRebateForHP, getSpecialFinancingRates } = useActivePromotions();

  // Pages where bar should NOT show
  const hideOnPages = [
    '/quote/motor-selection',
    '/quote/options',
    '/quote/purchase-path',
    '/quote/summary',
    '/quote/trade-in',
    '/quote/boat-info',
    '/quote/promo-selection',
    '/quote/package-selection',
    '/financing',
    '/login',
    '/auth',
    '/dashboard',
    '/settings',
    '/admin',
    '/test',
    '/staging',
    '/my-quotes',
    '/deposits',
    '/accessories',
    '/contact',
    '/calculator',
    '/promotions',
    '/quote/schedule',
  ];

  // Hide on mobile (handled by UnifiedMobileBar) or on excluded pages
  const shouldShowBar = !isMobile && state.motor && !location.pathname.startsWith('/quote/') && !hideOnPages.some(path => location.pathname.startsWith(path));

  // Centralized running total (single source of truth)
  const { total: runningTotalRaw } = useQuoteRunningTotal();
  const runningTotal = runningTotalRaw > 0 ? runningTotalRaw : null;

  // Calculate monthly payment - only for amounts >= $5,000
  const monthlyPayment = useMemo(() => {
    if (!runningTotal || runningTotal < FINANCING_MINIMUM) return null;

    // Add Dealerplan fee
    const priceWithFee = runningTotal + DEALERPLAN_FEE;

    // Use active promo rate or default
    const promoRate = promo?.rate || null;
    const { payment } = calculateMonthlyPayment(priceWithFee, promoRate);

    return payment;
  }, [runningTotal, promo]);

  // Financing unavailable when total is valid but below threshold
  const financingUnavailable = useMemo(() => {
    return runningTotal !== null && runningTotal > 0 && runningTotal < FINANCING_MINIMUM;
  }, [runningTotal]);

  // Get step label based on current path
  const stepLabel = useMemo(() => {
    const path = location.pathname;
    
    if (path === '/quote/purchase-path') return 'Step 2 of 7';
    if (path === '/quote/boat-info') return 'Step 3 of 7';
    if (path === '/quote/fuel-tank') return 'Step 3 of 5';
    if (path === '/quote/trade-in') return 'Step 4 of 7';
    if (path === '/quote/installation') return 'Step 5 of 7';
    if (path === '/quote/schedule') return 'Step 6 of 7';
    
    return null;
  }, [location.pathname]);

  // Get promo display for selected option (future-proof: uses active promo data)
  const selectedPromoDisplay = useMemo(() => {
    if (!state.selectedPromoOption) return null;
    
    const hp = state.motor?.hp || 0;
    
    switch (state.selectedPromoOption) {
      case 'no_payments':
        return '6 Mo. No Payments';
      case 'special_financing': {
        const rates = getSpecialFinancingRates?.();
        const lowestRate = rates?.[0]?.rate ?? 2.99;
        return `${lowestRate}% APR`;
      }
      case 'cash_rebate': {
        const rebate = getRebateForHP?.(hp);
        return rebate ? `$${rebate} Rebate` : 'Cash Rebate';
      }
      default:
        return null;
    }
  }, [state.selectedPromoOption, state.motor?.hp, getRebateForHP, getSpecialFinancingRates]);

  // Handle primary action (Continue)
  const handlePrimary = () => {
    const path = location.pathname;
    
    if (path === '/quote/purchase-path') navigate('/quote/boat-info');
    else if (path === '/quote/boat-info') navigate('/quote/trade-in');
    else if (path === '/quote/fuel-tank') navigate('/quote/promo-selection');
    else if (path === '/quote/trade-in') {
      if (state.purchasePath === 'installed') {
        navigate('/quote/installation');
      } else {
        navigate('/quote/promo-selection');
      }
    }
    else if (path === '/quote/installation') navigate('/quote/promo-selection');
    else if (path === '/quote/promo-selection') navigate('/quote/package-selection');
    else if (path === '/quote/package-selection') navigate('/quote/summary');
    else if (path === '/quote/schedule') navigate('/quote/summary');
    // no-op: unknown page, do nothing
  };

  // Handle secondary action (View Summary)
  const handleSecondary = () => {
    navigate('/quote/summary');
  };

  if (!shouldShowBar) return null;

  return (
    <StickyQuoteBar
      model={state.motor?.model}
      total={runningTotal}
      monthly={monthlyPayment}
      coverageYears={state.warrantyConfig?.totalYears}
      stepLabel={stepLabel}
      primaryLabel="Continue"
      onPrimary={handlePrimary}
      secondaryLabel="View Summary"
      onSecondary={handleSecondary}
      selectedPromoOption={state.selectedPromoOption}
      selectedPromoDisplay={selectedPromoDisplay}
      financingUnavailable={financingUnavailable}
    />
  );
}
