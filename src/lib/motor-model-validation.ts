// Motor Model Validation System
// Ensures accurate Mercury model numbers and prevents mismatches

import { getCorrectModelNumber, isValidModelNumber } from './mercury-model-number-mapping';

export interface ModelValidationResult {
  isValid: boolean;
  correctedModelNumber?: string;
  issues: string[];
  suggestions: string[];
}

/**
 * Validate and suggest corrections for motor model data
 * @param modelDisplay - The display name (e.g., "9.9 ELH FourStroke")
 * @param currentModelNumber - The current model number in the database
 * @returns Validation result with corrections and suggestions
 */
export function validateMotorModel(
  modelDisplay: string, 
  currentModelNumber?: string | null
): ModelValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Get the correct model number for this display name
  const correctModelNumber = getCorrectModelNumber(modelDisplay);
  
  if (!correctModelNumber) {
    issues.push(`No official Mercury model number found for "${modelDisplay}"`);
    suggestions.push('Verify the model display name matches Mercury official nomenclature');
    return {
      isValid: false,
      issues,
      suggestions
    };
  }
  
  // Check if current model number is correct
  if (currentModelNumber) {
    if (currentModelNumber !== correctModelNumber) {
      issues.push(`Model number "${currentModelNumber}" doesn't match expected "${correctModelNumber}" for "${modelDisplay}"`);
      suggestions.push(`Update model number to "${correctModelNumber}"`);
      return {
        isValid: false,
        correctedModelNumber: correctModelNumber,
        issues,
        suggestions
      };
    }
    
    // Validate format of current model number
    if (!isValidModelNumber(currentModelNumber)) {
      issues.push(`Model number "${currentModelNumber}" is not in official Mercury format`);
      suggestions.push('Use official Mercury model numbers from the reference catalog');
      return {
        isValid: false,
        correctedModelNumber: correctModelNumber,
        issues,
        suggestions
      };
    }
  } else {
    // No model number provided
    suggestions.push(`Add model number "${correctModelNumber}" for "${modelDisplay}"`);
    return {
      isValid: false,
      correctedModelNumber: correctModelNumber,
      issues: ['Model number is missing'],
      suggestions
    };
  }
  
  // All checks passed
  return {
    isValid: true,
    issues: [],
    suggestions: []
  };
}