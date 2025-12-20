import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

export interface SavedComparison {
  id: string;
  name: string | null;
  motor_ids: string[];
  created_at: string;
}

export function useMotorComparison() {
  const [comparisonList, setComparisonList] = useState<ComparisonMotor[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

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

  // Generate shareable URL
  const getShareableUrl = useCallback(() => {
    const ids = comparisonList.map(m => m.id).join(',');
    return `${window.location.origin}/compare?motors=${ids}`;
  }, [comparisonList]);

  // Copy shareable link to clipboard
  const shareComparison = useCallback(async () => {
    if (comparisonList.length === 0) {
      toast.error('Add motors to compare first');
      return;
    }
    
    const url = getShareableUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Comparison link copied!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  }, [getShareableUrl, comparisonList.length]);

  // Save comparison to database
  const saveComparison = useCallback(async (name?: string) => {
    if (comparisonList.length === 0) {
      toast.error('Add motors to compare first');
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to save comparisons');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('saved_comparisons')
        .insert({
          user_id: user.id,
          name: name || `Comparison ${new Date().toLocaleDateString()}`,
          motor_ids: comparisonList.map(m => m.id)
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Comparison saved!');
      await loadSavedComparisons();
      return data;
    } catch (err) {
      console.error('Error saving comparison:', err);
      toast.error('Failed to save comparison');
      return null;
    }
  }, [comparisonList]);

  // Load saved comparisons for current user
  const loadSavedComparisons = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSavedComparisons([]);
      return;
    }

    setLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from('saved_comparisons')
        .select('id, name, motor_ids, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedComparisons(data || []);
    } catch (err) {
      console.error('Error loading saved comparisons:', err);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  // Delete a saved comparison
  const deleteSavedComparison = useCallback(async (comparisonId: string) => {
    try {
      const { error } = await supabase
        .from('saved_comparisons')
        .delete()
        .eq('id', comparisonId);

      if (error) throw error;
      
      toast.success('Comparison deleted');
      await loadSavedComparisons();
    } catch (err) {
      console.error('Error deleting comparison:', err);
      toast.error('Failed to delete comparison');
    }
  }, [loadSavedComparisons]);

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    toggleComparison,
    count: comparisonList.length,
    isFull: comparisonList.length >= MAX_MOTORS,
    maxMotors: MAX_MOTORS,
    // New sharing/saving functions
    getShareableUrl,
    shareComparison,
    saveComparison,
    savedComparisons,
    loadSavedComparisons,
    deleteSavedComparison,
    loadingSaved
  };
}
