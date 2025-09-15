// Test cases for buildModelKey utility
import { buildModelKey, extractHpAndCode } from '@/lib/motor-helpers';

// Test cases to validate the buildModelKey utility
export const modelKeyTestCases = [
  // Basic cases
  { input: '2025 FourStroke 25HP EFI ELHPT', expected: 'FOURSTROKE-25HP-EFI-ELHPT' },
  { input: '2024 Four Stroke 15HP MH', expected: 'FOURSTROKE-15HP-MH' },
  { input: 'ProXS 115HP DTS', expected: 'PROXS-115HP-DTS' },
  { input: 'Verado 250HP EFI XL', expected: 'VERADO-250HP-EFI-XL' },
  
  // Edge cases
  { input: 'SeaPro 9.9HP ELH', expected: 'SEAPRO-9.9HP-ELH' },
  { input: '2025 FourStroke 6HP MH Tiller', expected: 'FOURSTROKE-6HP-MH' },
  { input: 'Mercury 40HP EFI CT', expected: 'FOURSTROKE-40HP-EFI-CT' },
  
  // Complex cases
  { input: '2024 Mercury FourStroke 60HP EFI CT ELPT', expected: 'FOURSTROKE-60HP-EFI-CT' },
  { input: 'Pro XS 150HP DTS XXL', expected: 'PROXS-150HP-DTS' },
];

// Test function
export const testModelKeyBuilder = () => {
  const results: Array<{ input: string; expected: string; actual: string; passed: boolean }> = [];
  
  modelKeyTestCases.forEach(testCase => {
    const actual = buildModelKey(testCase.input);
    const passed = actual === testCase.expected;
    
    results.push({
      input: testCase.input,
      expected: testCase.expected,
      actual,
      passed
    });
    
    if (!passed) {
      console.warn(`❌ Test failed for "${testCase.input}"`);
      console.warn(`   Expected: "${testCase.expected}"`);
      console.warn(`   Actual:   "${actual}"`);
    } else {
      console.log(`✅ Test passed for "${testCase.input}" → "${actual}"`);
    }
  });
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  console.log(`\nModel Key Tests: ${passedCount}/${totalCount} passed`);
  
  return results;
};

// Test extractHpAndCode function
export const testExtractHpAndCode = () => {
  const testCases = [
    { 
      input: 'FourStroke 25HP EFI ELHPT', 
      expected: { hp: 25, code: 'ELHPT', fuel: 'EFI', family: 'FOURSTROKE' }
    },
    { 
      input: 'ProXS 115HP DTS', 
      expected: { hp: 115, code: 'DTS', fuel: null, family: 'PROXS' }
    },
    { 
      input: 'Verado 9.9HP EH', 
      expected: { hp: 9.9, code: 'EH', fuel: null, family: 'VERADO' }
    }
  ];
  
  testCases.forEach(testCase => {
    const actual = extractHpAndCode(testCase.input);
    const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);
    
    if (!passed) {
      console.warn(`❌ Extract test failed for "${testCase.input}"`);
      console.warn(`   Expected:`, testCase.expected);
      console.warn(`   Actual:  `, actual);
    } else {
      console.log(`✅ Extract test passed for "${testCase.input}"`);
    }
  });
};

// Run tests if in development
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  // Auto-run tests in console when imported
  setTimeout(() => {
    console.log('🔧 Running model key utility tests...');
    testModelKeyBuilder();
    testExtractHpAndCode();
  }, 1000);
}