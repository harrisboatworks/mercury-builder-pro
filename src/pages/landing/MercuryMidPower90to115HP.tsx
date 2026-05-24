import MercuryLineupLanding from './MercuryLineupLanding';
import { MID_POWER_90_115HP } from '@/data/landing/mercuryLineupLandings';

export default function MercuryMidPower90to115HP() {
  return <MercuryLineupLanding config={MID_POWER_90_115HP} />;
}
