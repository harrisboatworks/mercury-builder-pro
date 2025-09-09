
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Gift } from 'lucide-react';
import type { Motor } from '../QuoteBuilder';

interface BonusOffersProps {
  motor: Motor | null;
}

export const BonusOffers = ({ motor }: BonusOffersProps) => {
  if (!motor || !motor.bonusOffers || motor.bonusOffers.length === 0) return null;

  const offers = [...motor.bonusOffers].sort((a, b) => (b.highlight === a.highlight ? (b.priority - a.priority) : (b.highlight ? 1 : -1)));

  return null;
};
