// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StickySummary from './StickySummary';

vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: null }) }));

describe('summary review action', () => {
  it.each([true, false])('keeps one working review action with reviewFirst=%s', (reviewFirst) => {
    const onReview = vi.fn();
    const onReserve = vi.fn();
    render(<StickySummary packageLabel="Configured quote" yourPriceBeforeTax={19000}
      totalWithTax={21470} totalSavings={1000} onReserve={onReserve} onReview={onReview}
      reviewFirst={reviewFirst} callHref="tel:9053422153" smsHref="sms:6479522153"
      quoteReference="HBW-SYNTHETIC" onCall={vi.fn()} onText={vi.fn()} reserveDisabled />);

    const review = screen.getByRole('button', { name: 'Have HBW Review My Quote' });
    const call = screen.getByRole('link', { name: /Call/ });
    expect(Boolean(review.compareDocumentPosition(call) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(reviewFirst);
    fireEvent.click(review);
    expect(onReview).toHaveBeenCalledOnce();
    expect(onReserve).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Reserve this motor/ })).toBeDisabled();
    expect(Boolean(screen.queryByText(/No payment required/))).toBe(reviewFirst);
  });
});
