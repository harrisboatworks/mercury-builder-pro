import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Motor } from '@/components/QuoteBuilder';
import type { MotorGroup } from '@/hooks/useGroupedMotors';
import { MotorConfiguratorModal } from './MotorConfiguratorModal';
import MotorDetailsPremiumModal from './MotorDetailsPremiumModal';

type PendingGallery = {
  motorId: string;
  resolve: (images: string[]) => void;
  reject: (reason?: unknown) => void;
};

const requests = vi.hoisted(() => ({
  current: [] as PendingGallery[],
}));

const quoteDispatch = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/QuoteContext', () => ({
  useQuote: () => ({ state: {}, dispatch: quoteDispatch }),
}));

vi.mock('../../integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  for (const method of ['select', 'eq', 'in', 'or', 'order', 'gte', 'lte', 'limit', 'is', 'neq', 'filter']) {
    chain[method] = self;
  }
  chain.single = () => Promise.resolve({ data: null, error: null });
  chain.maybeSingle = () => Promise.resolve({ data: null, error: null });
  chain.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: [], error: null }).then(resolve);
  return { supabase: { from: () => chain } };
});

vi.mock('../../lib/motor-helpers', async () => {
  const actual = await vi.importActual<typeof import('../../lib/motor-helpers')>('../../lib/motor-helpers');
  return {
    ...actual,
    getMotorImageGallery: (motor: { id?: string }) => new Promise<string[]>((resolve, reject) => {
      requests.current.push({
        motorId: motor?.id ?? '',
        resolve,
        reject,
      });
    }),
  };
});

const ALPHA = 'https://example.invalid/gallery/alpha.svg';
const BRAVO = 'https://example.invalid/gallery/bravo.svg';

function motor(id: string, model: string): Motor {
  return {
    id,
    model,
    year: 2026,
    hp: 25,
    price: 1000,
    image: `https://example.invalid/${id}-card.svg`,
    stockStatus: 'In Stock',
    category: 'mid-range',
    type: 'outboard',
    specs: 'synthetic',
  };
}

function groupOf(motors: Motor[]): MotorGroup {
  return {
    hp: 25,
    variants: motors,
    priceRange: { min: 1000, max: 1000 },
    features: {
      hasElectricStart: false,
      hasManualStart: false,
      hasTiller: false,
      hasRemote: false,
      hasPowerTrim: false,
      hasCommandThrust: false,
      shaftLengths: [],
    },
    families: ['FourStroke'],
    inStockCount: motors.length,
    heroImage: 'https://example.invalid/group.svg',
    isRepresentativeImage: false,
  };
}

function galleryImage(): HTMLImageElement | null {
  return document.querySelector('img[alt$="- Image 1"]');
}

function settle(index: number, images: string[]) {
  requests.current[index].resolve(images);
}

function fail(index: number) {
  requests.current[index].reject(new Error('synthetic gallery failure'));
}

afterEach(() => {
  cleanup();
  requests.current = [];
});

function renderConfigurator(initialMotorId: string) {
  const motors = [motor('motor-a', 'Alpha'), motor('motor-b', 'Bravo')];
  return render(
    <MemoryRouter>
      <MotorConfiguratorModal
        open
        onClose={() => undefined}
        onSelectMotor={() => undefined}
        group={groupOf(motors)}
        initialMotorId={initialMotorId}
      />
    </MemoryRouter>,
  );
}

describe('MotorDetailsPremiumModal stale gallery results', () => {
  it('keeps the newer configurator motor loading when the older gallery resolves first', async () => {
    const view = renderConfigurator('motor-a');
    await waitFor(() => expect(requests.current.map((query) => query.motorId)).toEqual(['motor-a']));
    expect(galleryImage()).toBeNull();

    view.rerender(
      <MemoryRouter>
        <MotorConfiguratorModal
          open
          onClose={() => undefined}
          onSelectMotor={() => undefined}
          group={groupOf([motor('motor-a', 'Alpha'), motor('motor-b', 'Bravo')])}
          initialMotorId="motor-b"
        />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current.map((query) => query.motorId)).toEqual(['motor-a', 'motor-b']));
    expect(galleryImage()).toBeNull();

    await act(async () => {
      settle(0, [ALPHA]);
    });

    expect(galleryImage()).toBeNull();
    expect(document.body.innerHTML).not.toContain(ALPHA);

    await act(async () => {
      settle(1, [BRAVO]);
    });

    const shown = galleryImage();
    expect(shown?.getAttribute('src')).toBe(BRAVO);
    expect(shown?.getAttribute('alt')).toContain('Bravo');
    expect(document.body.innerHTML).not.toContain(ALPHA);
  });

  it('keeps the newer gallery when the older result arrives later', async () => {
    const view = render(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Alpha" hp={25} price={1000} motor={motor('motor-a', 'Alpha')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current).toHaveLength(1));

    view.rerender(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Bravo" hp={25} price={1000} motor={motor('motor-b', 'Bravo')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current).toHaveLength(2));

    await act(async () => {
      settle(1, [BRAVO]);
    });
    expect(galleryImage()?.getAttribute('src')).toBe(BRAVO);

    await act(async () => {
      settle(0, [ALPHA]);
    });

    expect(galleryImage()?.getAttribute('src')).toBe(BRAVO);
    expect(document.body.innerHTML).not.toContain(ALPHA);
  });

  it('ignores an obsolete rejection while a newer gallery request is pending', async () => {
    const view = render(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Alpha" hp={25} price={1000} motor={motor('motor-a', 'Alpha')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current).toHaveLength(1));

    view.rerender(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Bravo" hp={25} price={1000} motor={motor('motor-b', 'Bravo')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current).toHaveLength(2));

    await act(async () => {
      fail(0);
    });

    expect(galleryImage()).toBeNull();

    await act(async () => {
      settle(1, [BRAVO]);
    });
    expect(galleryImage()?.getAttribute('src')).toBe(BRAVO);
  });

  it('does not let a closed modal gallery result replace the next motor', async () => {
    const view = render(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Alpha" hp={25} price={1000} motor={motor('motor-a', 'Alpha')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current).toHaveLength(1));

    view.rerender(
      <MemoryRouter>
        <MotorDetailsPremiumModal open={false} onClose={() => undefined} title="Alpha" hp={25} price={1000} motor={motor('motor-a', 'Alpha')} />
      </MemoryRouter>,
    );
    expect(galleryImage()).toBeNull();

    view.rerender(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Bravo" hp={25} price={1000} motor={motor('motor-b', 'Bravo')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current).toHaveLength(2));

    await act(async () => {
      settle(0, [ALPHA]);
    });

    expect(galleryImage()).toBeNull();
    expect(document.body.innerHTML).not.toContain(ALPHA);
  });

  it('does not let an unmounted gallery result appear on the next mount', async () => {
    const view = render(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Alpha" hp={25} price={1000} motor={motor('motor-a', 'Alpha')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current).toHaveLength(1));
    view.unmount();

    await act(async () => {
      settle(0, [ALPHA]);
    });
    await act(async () => {
      requests.current[0].reject(new Error('synthetic gallery failure'));
    });

    render(
      <MemoryRouter>
        <MotorDetailsPremiumModal open onClose={() => undefined} title="Bravo" hp={25} price={1000} motor={motor('motor-b', 'Bravo')} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(requests.current.map((query) => query.motorId)).toContain('motor-b'));
    expect(galleryImage()).toBeNull();
    expect(document.body.innerHTML).not.toContain(ALPHA);
  });
});
