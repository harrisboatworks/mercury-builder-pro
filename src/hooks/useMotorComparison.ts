import { useState, useEffect, useCallback } from 'react';
import type { Motor } from '@/lib/motor-helpers';

const STORAGE_KEY = 'motor-comparison-list';
const MAX_MOTORS = 3;

export interface ComparisonMotor {
  id: string;
  model: string;
  hp: number;
  price: number;
  image?: string;
  msrp?: number;
  in_stock?: boolean;
  features?: string[];
  shaft?: string;
  type?: string;
}

export function useMotorComparison() {
  const [comparisonList, setComparisonList] = useState<ComparisonMotor[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setComparisonList(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load comparison list:', e);
    }
  }, []);

  // Save to localStorage when list changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList));
    } catch (e) {
      console.warn('Failed to save comparison list:', e);
    }
  }, [comparisonList]);

  const addToComparison = useCallback((motor: Motor | ComparisonMotor) => {
    setComparisonList(prev => {
      if (prev.length >= MAX_MOTORS) return prev;
      if (prev.some(m => m.id === motor.id)) return prev;
      
      const comparisonMotor: ComparisonMotor = {
        id: motor.id,
        model: motor.model,
        hp: motor.hp,
        price: motor.price,
        image: motor.image,
        msrp: motor.msrp,
        in_stock: motor.in_stock,
        features: motor.features,
        shaft: motor.shaft,
        type: motor.type
      };
      
      return [...prev, comparisonMotor];
    });
  }, []);

  const removeFromComparison = useCallback((motorId: string) => {
    setComparisonList(prev => prev.filter(m => m.id !== motorId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, []);

  const isInComparison = useCallback((motorId: string) => {
    return comparisonList.some(m => m.id === motorId);
  }, [comparisonList]);

  const toggleComparison = useCallback((motor: Motor | ComparisonMotor) => {
    if (isInComparison(motor.id)) {
      removeFromComparison(motor.id);
    } else {
      addToComparison(motor);
    }
  }, [isInComparison, removeFromComparison, addToComparison]);

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    toggleComparison,
    count: comparisonList.length,
    isFull: comparisonList.length >= MAX_MOTORS,
    maxMotors: MAX_MOTORS
  };
}
