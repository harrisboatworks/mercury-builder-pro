import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuote } from '@/contexts/QuoteContext';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import StickyQuoteBar from './StickyQuoteBar';

export function GlobalStickyQuoteBar() {
  const { state } = useQuote();
  const location = useLocation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { promo } = useActiveFinancingPromo();

  // Pages where bar should NOT show
  const hideOnPages = [
    '/quote/motor-selection',
    '/quote/summary',
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
  ];

  // Hide on mobile (handled by UnifiedMobileBar) or on excluded pages
  const shouldShowBar = !isMobile && state.motor && !hideOnPages.some(path => location.pathname.startsWith(path));

  // Calculate running total dynamically
  const runningTotal = useMemo(() => {
    if (!state.motor?.price) return null;

    let total = state.motor.price;

    // Add controls cost from boat info
    if (state.boatInfo?.controlsOption) {
      if (state.boatInfo.controlsOption === 'none') total += 1200;
      else if (state.boatInfo.controlsOption === 'adapter') total += 125;
      // 'compatible' = $0, no addition needed
    }

    // Add installation labor for remote motors
    const isTiller = state.motor.model?.includes('TLR') || state.motor.model?.includes('MH');
    if (state.purchasePath === 'installed' && !isTiller) {
      total += 450; // Professional installation labor
    }

    // Add installation config costs (mounting hardware for tillers)
    if (state.installConfig?.installationCost) {
      total += state.installConfig.installationCost;
    }

    // Add fuel tank config (for small tillers)
    if (state.fuelTankConfig?.tankCost) {
      total += state.fuelTankConfig.tankCost;
    }

    // Add warranty
    if (state.warrantyConfig?.warrantyPrice) {
      total += state.warrantyConfig.warrantyPrice;
    }

    // Subtract trade-in
    if (state.tradeInInfo?.estimatedValue) {
      total -= state.tradeInInfo.estimatedValue;
    }

    // Apply HST (13%)
    const totalWithTax = total * 1.13;

    return totalWithTax;
  }, [
    state.motor,
    state.boatInfo?.controlsOption,
    state.purchasePath,
    state.installConfig?.installationCost,
    state.fuelTankConfig?.tankCost,
    state.warrantyConfig?.warrantyPrice,
    state.tradeInInfo?.estimatedValue,
  ]);

  // Calculate monthly payment
  const monthlyPayment = useMemo(() => {
    if (!runningTotal) return null;

    // Add Dealerplan fee
    const priceWithFee = runningTotal + DEALERPLAN_FEE;

    // Use active promo rate or default
    const promoRate = promo?.rate || null;
    const { payment } = calculateMonthlyPayment(priceWithFee, promoRate);

    return payment;
  }, [runningTotal, promo]);

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

  // Handle primary action (Continue)
  const handlePrimary = () => {
    const path = location.pathname;
    
    if (path === '/quote/purchase-path') navigate('/quote/boat-info');
    else if (path === '/quote/boat-info') navigate('/quote/trade-in');
    else if (path === '/quote/fuel-tank') navigate('/quote/summary');
    else if (path === '/quote/trade-in') navigate('/quote/installation');
    else if (path === '/quote/installation') navigate('/quote/summary');
    else if (path === '/quote/schedule') navigate('/quote/summary');
    else navigate('/quote/summary');
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
    />
  );
}
