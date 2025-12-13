import { useMemo } from 'react';

interface Motor {
  model: string;
  hp?: number;
  horsepower?: number;
  motor_type?: string;
}

interface BoatInfo {
  type?: string;
  length?: string;
  year?: string;
  make?: string;
  model?: string;
  maxHp?: string;
}

export interface CompatibilityResult {
  status: 'excellent' | 'good' | 'caution' | 'warning' | 'unknown';
  label: string;
  icon: 'CheckCircle' | 'ThumbsUp' | 'AlertCircle' | 'AlertTriangle' | 'HelpCircle';
  color: 'green' | 'blue' | 'amber' | 'red' | 'gray';
  reasons: string[];
  boatLabel?: string;
}

// Boat type HP ranges (min-max recommended)
const boatTypeRanges: Record<string, { min: number; max: number; label: string }> = {
  'pontoon': { min: 40, max: 150, label: 'Pontoon' },
  'v-hull-fishing': { min: 75, max: 300, label: 'V-Hull Fishing Boat' },
  'center-console': { min: 90, max: 400, label: 'Center Console' },
  'utility': { min: 9.9, max: 30, label: 'Utility Boat' },
  'inflatable': { min: 2.5, max: 20, label: 'Inflatable/Dinghy' },
  'jon-boat': { min: 9.9, max: 40, label: 'Jon Boat' },
  'bowrider': { min: 135, max: 300, label: 'Bowrider' },
  'deck-boat': { min: 115, max: 300, label: 'Deck Boat' },
  'bass-boat': { min: 115, max: 250, label: 'Bass Boat' },
  'aluminum-fishing': { min: 25, max: 115, label: 'Aluminum Fishing Boat' }
};

export function useMotorCompatibility(
  motor: Motor | null,
  boatInfo: BoatInfo | null
): CompatibilityResult {
  return useMemo(() => {
    // No motor selected
    if (!motor) {
      return {
        status: 'unknown',
        label: 'Select a motor',
        icon: 'HelpCircle',
        color: 'gray',
        reasons: []
      };
    }

    // No boat info saved
    if (!boatInfo || !boatInfo.type) {
      return {
        status: 'unknown',
        label: 'Add boat info to check compatibility',
        icon: 'HelpCircle',
        color: 'gray',
        reasons: ['Tell us about your boat for personalized recommendations']
      };
    }

    const hp = motor.hp || motor.horsepower || 0;
    const modelLower = motor.model?.toLowerCase() || '';
    const boatType = boatInfo.type;
    const boatLength = boatInfo.length ? parseInt(boatInfo.length) : null;
    const maxHp = boatInfo.maxHp ? parseInt(boatInfo.maxHp) : null;

    const range = boatTypeRanges[boatType];
    const boatLabel = range?.label || boatInfo.type;

    const positiveReasons: string[] = [];
    const negativeReasons: string[] = [];
    const warningReasons: string[] = [];

    // ProKicker special handling
    const isProKicker = modelLower.includes('prokicker');
    if (isProKicker) {
      if (boatType === 'v-hull-fishing' || boatType === 'center-console' || boatType === 'bass-boat') {
        positiveReasons.push('Excellent as trolling/kicker motor');
        positiveReasons.push('Perfect for fishing applications');
      } else if (boatType === 'pontoon') {
        positiveReasons.push('Good auxiliary motor option');
      } else {
        warningReasons.push('ProKicker typically used on larger fishing boats');
      }
    }

    // HP range check
    if (range) {
      if (hp >= range.min && hp <= range.max) {
        positiveReasons.push(`HP in optimal range (${range.min}-${range.max}HP)`);
      } else if (hp < range.min) {
        warningReasons.push(`May be underpowered (recommended: ${range.min}+ HP)`);
      } else if (hp > range.max) {
        negativeReasons.push(`Exceeds recommended HP (max: ${range.max}HP)`);
      }
    }

    // Max HP plate check
    if (maxHp && hp > maxHp) {
      negativeReasons.push(`Exceeds your boat's max HP rating (${maxHp}HP)`);
    } else if (maxHp && hp <= maxHp) {
      positiveReasons.push('Within boat\'s HP capacity');
    }

    // Tiller on large boat check
    const isTiller = modelLower.includes('tiller');
    if (isTiller && boatLength && boatLength > 16) {
      warningReasons.push('Tiller steering may be awkward for 16ft+ boats');
    } else if (isTiller && boatLength && boatLength <= 14) {
      positiveReasons.push('Tiller ideal for smaller boats');
    }

    // Small motor on large boat
    if (boatLength && boatLength >= 18 && hp < 40) {
      warningReasons.push('Motor may struggle with larger boat');
    }

    // Large motor on small boat  
    if (boatLength && boatLength <= 14 && hp > 60) {
      warningReasons.push('Consider if transom can handle this power');
    }

    // Determine overall status
    if (negativeReasons.length > 0) {
      return {
        status: 'warning',
        label: 'Not Recommended',
        icon: 'AlertTriangle',
        color: 'red',
        reasons: [...negativeReasons, ...warningReasons],
        boatLabel
      };
    }

    if (warningReasons.length > 0) {
      return {
        status: 'caution',
        label: 'Consider Carefully',
        icon: 'AlertCircle',
        color: 'amber',
        reasons: [...warningReasons, ...positiveReasons],
        boatLabel
      };
    }

    if (positiveReasons.length >= 2) {
      return {
        status: 'excellent',
        label: 'Great Match',
        icon: 'CheckCircle',
        color: 'green',
        reasons: positiveReasons,
        boatLabel
      };
    }

    if (positiveReasons.length > 0) {
      return {
        status: 'good',
        label: 'Good Fit',
        icon: 'ThumbsUp',
        color: 'blue',
        reasons: positiveReasons,
        boatLabel
      };
    }

    return {
      status: 'good',
      label: 'Should work well',
      icon: 'ThumbsUp',
      color: 'blue',
      reasons: ['Compatible with your boat type'],
      boatLabel
    };
  }, [motor, boatInfo]);
}

export default useMotorCompatibility;
