import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HelmetProvider } from '@/lib/helmet';
import Contact from './Contact';

const places = vi.hoisted(() => ({
  result: {
    data: null as null | {
      openingHours: { isOpen: boolean; weekdayText: string[] };
    },
    isLoading: false,
    error: null as Error | null,
  },
}));

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/components/repower/RepowerHeader', () => ({
  RepowerHeader: () => <header>RepowerHeader</header>,
}));

vi.mock('@/components/ui/site-footer', () => ({
  SiteFooter: () => <footer>SiteFooter</footer>,
}));

vi.mock('@/hooks/useGooglePlaceData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useGooglePlaceData')>();
  return {
    ...actual,
    useGooglePlaceData: () => places.result,
  };
});

function renderContact() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('Contact page Places hours', () => {
  beforeEach(() => {
    places.result = {
      data: null,
      isLoading: false,
      error: null,
    };
  });

  it('renders live weekday hours from the shared Places hook', () => {
    places.result = {
      data: {
        openingHours: {
          isOpen: false,
          weekdayText: [
            'Monday: Closed',
            'Tuesday: 8:00 AM – 5:00 PM',
            'Wednesday: 8:00 AM – 5:00 PM',
            'Thursday: 8:00 AM – 5:00 PM',
            'Friday: 8:00 AM – 5:00 PM',
            'Saturday: 8:00 AM – 5:00 PM',
            'Sunday: Closed',
          ],
        },
      },
      isLoading: false,
      error: null,
    };

    renderContact();

    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Monday: Closed')).toBeInTheDocument();
    expect(screen.getByText('Tuesday: 8:00 AM – 5:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Sunday: Closed')).toBeInTheDocument();
    expect(screen.queryByText(/Mon–Sat 8 AM – 5 PM/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in-season/i)).not.toBeInTheDocument();
  });

  it('shows a loading state while Places hours are fetching', () => {
    places.result = {
      data: null,
      isLoading: true,
      error: null,
    };

    const { container } = renderContact();

    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
    expect(screen.queryByText('Monday: Closed')).not.toBeInTheDocument();
    expect(screen.queryByText(/Contact us for current hours/)).not.toBeInTheDocument();
  });

  it('falls back without inventing hours when Places is unavailable', () => {
    places.result = {
      data: null,
      isLoading: false,
      error: new Error('places unavailable'),
    };

    renderContact();

    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Contact us for current hours')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '(905) 342-2153' })).toHaveAttribute(
      'href',
      'tel:+19053422153',
    );
    expect(screen.queryByText(/Mon–Sat 8 AM – 5 PM/)).not.toBeInTheDocument();
  });
});
