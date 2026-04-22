import { Helmet as _Helmet, HelmetProvider as _HelmetProvider } from '@/lib/helmet';
import type { ComponentType, PropsWithChildren } from 'react';

export const Helmet = _Helmet as unknown as ComponentType<PropsWithChildren<Record<string, any>>>;
export const HelmetProvider = _HelmetProvider as unknown as ComponentType<
  PropsWithChildren<{ context?: Record<string, any> }>
>;
