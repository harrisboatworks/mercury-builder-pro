import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MotorOption {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  category: string;
  base_price: number;
  msrp: number | null;
  image_url: string | null;
  part_number: string | null;
  is_taxable: boolean;
  display_order: number;
  specifications: any;
  features: any[];
  assignment_type: 'required' | 'recommended' | 'available';
  price_override: number | null;
  is_included: boolean;
  assignment_id?: string;
}

export interface CategorizedOptions {
  required: MotorOption[];
  recommended: MotorOption[];
  available: MotorOption[];
}

/**
 * Fetch and merge motor options from direct assignments and rules
 */
export function useMotorOptions(motorId: string | null | undefined, motor?: any) {
  return useQuery({
    queryKey: ['motor-options', motorId],
    queryFn: async (): Promise<CategorizedOptions> => {
      if (!motorId) {
        return { required: [], recommended: [], available: [] };
      }

      // Fetch direct assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('motor_option_assignments')
        .select(`
          id,
          assignment_type,
          price_override,
          is_included,
          display_order,
          motor_options (
            id,
            name,
            description,
            short_description,
            category,
            base_price,
            msrp,
            image_url,
            part_number,
            is_taxable,
            display_order,
            specifications,
            features
          )
        `)
        .eq('motor_id', motorId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Fetch rule-based assignments
      const { data: rules, error: rulesError } = await supabase
        .from('motor_option_rules')
        .select(`
          id,
          assignment_type,
          price_override,
          priority,
          conditions,
          motor_options (
            id,
            name,
            description,
            short_description,
            category,
            base_price,
            msrp,
            image_url,
            part_number,
            is_taxable,
            display_order,
            specifications,
            features
          )
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;

      // Filter rules based on motor characteristics
      const applicableRules = rules?.filter((rule: any) => {
        if (!motor || !rule.conditions) return false;
        const conditions = rule.conditions;

        // Check HP range
        if (conditions.hp_min !== undefined && motor.hp < conditions.hp_min) return false;
        if (conditions.hp_max !== undefined && motor.hp > conditions.hp_max) return false;

        // Check motor family
        if (conditions.motor_family && motor.family !== conditions.motor_family) return false;

        // Check motor type
        if (conditions.motor_type && motor.motor_type !== conditions.motor_type) return false;

        // Check tiller
        if (conditions.is_tiller !== undefined) {
          const isTiller = motor.model_display?.toLowerCase().includes('tiller') || 
                           motor.model?.toLowerCase().includes('tiller');
          if (conditions.is_tiller !== isTiller) return false;
        }

        // Check year
        if (conditions.year_min && motor.year < conditions.year_min) return false;

        return true;
      }) || [];

      // Merge options, giving priority to direct assignments
      const optionMap = new Map<string, MotorOption>();

      // Add rule-based options first (lower priority)
      applicableRules.forEach((rule: any) => {
        if (rule.motor_options) {
          const option = rule.motor_options;
          optionMap.set(option.id, {
            ...option,
            assignment_type: rule.assignment_type,
            price_override: rule.price_override,
            is_included: false,
          });
        }
      });

      // Add direct assignments (higher priority - will override rules)
      assignments?.forEach((assignment: any) => {
        if (assignment.motor_options) {
          const option = assignment.motor_options;
          optionMap.set(option.id, {
            ...option,
            assignment_type: assignment.assignment_type,
            price_override: assignment.price_override,
            is_included: assignment.is_included,
            assignment_id: assignment.id,
          });
        }
      });

      // Categorize options
      const options = Array.from(optionMap.values());
      
      return {
        required: options
          .filter(o => o.assignment_type === 'required')
          .sort((a, b) => a.display_order - b.display_order),
        recommended: options
          .filter(o => o.assignment_type === 'recommended')
          .sort((a, b) => a.display_order - b.display_order),
        available: options
          .filter(o => o.assignment_type === 'available')
          .sort((a, b) => a.display_order - b.display_order),
      };
    },
    enabled: !!motorId,
  });
}
