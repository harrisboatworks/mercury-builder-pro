// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaceData } from '@/hooks/useGooglePlaceData';
import { GoogleReviewsTestimonials } from './GoogleReviewsTestimonials';

const place = vi.hoisted(() => ({
  current: {
    data: null as PlaceData | null,
    isLoading: false,
    error: null,
  },
}));

vi.mock('@/hooks/useGooglePlaceData', () => ({
  useGooglePlaceData: () => place.current,
}));

vi.mock('embla-carousel-react', () => ({
  default: () => [
    vi.fn(),
    {
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      scrollTo: vi.fn(),
      selectedScrollSnap: () => 0,
      on: vi.fn(),
      off: vi.fn(),
    },
  ],
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }),
});

afterEach(() => {
  cleanup();
  place.current = { data: null, isLoading: false, error: null };
});

const livePlace: PlaceData = {
  name: 'Harris Boat Works',
  rating: 4.7,
  totalReviews: 333,
  reviews: [
    {
      authorName: 'Erik Ferguson',
      rating: 5,
      text: 'Great service. Great price on a new outboard. Called them from out of town and organized purchase and pick up, very easy.',
      time: 1710000000,
      relativeTime: '4 months ago',
    },
    {
      authorName: 'Gisele Thorpe',
      rating: 5,
      text: 'I would like to give this marina a 5 star review. My husband called and they said they had the part he thought he needed.',
      time: 1711000000,
      relativeTime: '3 months ago',
    },
  ],
};

describe('GoogleReviewsTestimonials', () => {
  it('hides the section when Places has no usable reviews', () => {
    const { container } = render(
      <GoogleReviewsTestimonials variant="light-carousel" heading="What Our Customers Say" />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('What Our Customers Say')).not.toBeInTheDocument();
    expect(screen.queryByText('Tony Russo')).not.toBeInTheDocument();
  });

  it('renders live Google review text and an accurate Google label', () => {
    place.current = { data: livePlace, isLoading: false, error: null };

    render(<GoogleReviewsTestimonials variant="light-carousel" heading="What Our Customers Say" />);

    expect(screen.getByText('What Our Customers Say')).toBeInTheDocument();
    expect(
      screen.getByText('Rated 4.7 stars across 333 Google reviews from Ontario boaters'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Great service. Great price on a new outboard/)).toBeInTheDocument();
    expect(screen.getByText('Erik F.')).toBeInTheDocument();
    expect(screen.getAllByText('Verified Google review').length).toBeGreaterThan(0);
    expect(screen.queryByText('Tony Russo')).not.toBeInTheDocument();
    expect(screen.queryByText('Mercury Owner')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Verified$/)).not.toBeInTheDocument();
  });

  it('does not invent fallback quotes when Places fails', () => {
    place.current = { data: null, isLoading: false, error: new Error('Places unavailable') };

    const { container } = render(
      <GoogleReviewsTestimonials variant="dark-grid" heading="What customers say." />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Jim Crawford')).not.toBeInTheDocument();
    expect(screen.queryByText(/I drive past three dealers/)).not.toBeInTheDocument();
  });
});
