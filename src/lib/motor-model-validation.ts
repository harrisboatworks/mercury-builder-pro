// Motor Model Validation System
// Ensures motor data accuracy and prevents incorrect model numbers

import { getCorrectModelNumber, isValidModelNumber, getModelDisplayName } from './mercury-model-number-mapping';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Comprehensive validation for motor model data
 */
export function validateMotorModel(motor: {
  model_display?: string;
  model_number?: string;
  horsepower?: number;
  family?: string;
}): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check if model_display has a correct model_number mapping
  if (motor.model_display) {
    const correctModelNumber = getCorrectModelNumber(motor.model_display);
    
    if (correctModelNumber) {
      // We have a mapping for this display name
      if (motor.model_number && motor.model_number !== correctModelNumber) {
        result.errors.push(`Model number "${motor.model_number}" doesn't match the correct Mercury model number "${correctModelNumber}" for "${motor.model_display}"`);
        result.suggestions.push(`Update model_number to "${correctModelNumber}"`);
        result.isValid = false;
      } else if (!motor.model_number) {
        result.warnings.push(`Missing model number for "${motor.model_display}"`);
        result.suggestions.push(`Set model_number to "${correctModelNumber}"`);
      }
    } else {
      // No mapping available - might be a new model or typo
      result.warnings.push(`No Mercury model number mapping found for "${motor.model_display}"`);
      
      if (motor.model_number && !isValidModelNumber(motor.model_number)) {
        result.warnings.push(`Model number "${motor.model_number}" doesn't match Mercury's format`);
      }
    }
  }

  // Validate model number format if present
  if (motor.model_number) {
    if (!isValidModelNumber(motor.model_number)) {
      // Check if it follows Mercury's general format (letters and numbers, 8-10 chars)
      if (!/^[0-9A-Z]{8,10}$/.test(motor.model_number)) {
        result.errors.push(`Model number "${motor.model_number}" doesn't follow Mercury's format (8-10 alphanumeric characters)`);
        result.isValid = false;
      } else {
        result.warnings.push(`Model number "${motor.model_number}" is not in our Mercury reference database`);
      }
    }
  }

  // Cross-check display name with model number
  if (motor.model_number && isValidModelNumber(motor.model_number)) {
    const expectedDisplayName = getModelDisplayName(motor.model_number);
    if (expectedDisplayName && motor.model_display && motor.model_display !== expectedDisplayName) {
      result.warnings.push(`Display name "${motor.model_display}" doesn't match expected "${expectedDisplayName}" for model number "${motor.model_number}"`);
    }
  }

  return result;
}

/**
 * Get suggested corrections for a motor model
 */
export function getSuggestedCorrections(motor: {
  model_display?: string;
  model_number?: string;
}): {
  corrected_model_number?: string;
  corrected_model_display?: string;
} {
  const corrections: any = {};

  if (motor.model_display) {
    const correctModelNumber = getCorrectModelNumber(motor.model_display);
    if (correctModelNumber && correctModelNumber !== motor.model_number) {
      corrections.corrected_model_number = correctModelNumber;
    }
  }

  if (motor.model_number && isValidModelNumber(motor.model_number)) {
    const correctDisplayName = getModelDisplayName(motor.model_number);
    if (correctDisplayName && correctDisplayName !== motor.model_display) {
      corrections.corrected_model_display = correctDisplayName;
    }
  }

  return corrections;
}

/**
 * Batch validate multiple motors and return summary
 */
export function validateMotorBatch(motors: Array<{
  id?: string;
  model_display?: string;
  model_number?: string;
  horsepower?: number;
  family?: string;
}>): {
  totalMotors: number;
  validMotors: number;
  motorsWithErrors: number;
  motorsWithWarnings: number;
  detailedResults: Array<{
    motorId: string;
    validation: ValidationResult;
  }>;
} {
  const results = motors.map(motor => ({
    motorId: motor.id || 'unknown',
    validation: validateMotorModel(motor)
  }));

  return {
    totalMotors: motors.length,
    validMotors: results.filter(r => r.validation.isValid).length,
    motorsWithErrors: results.filter(r => r.validation.errors.length > 0).length,
    motorsWithWarnings: results.filter(r => r.validation.warnings.length > 0).length,
    detailedResults: results
  };
}