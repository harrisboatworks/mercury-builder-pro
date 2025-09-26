// Utility for formatting motor display names with proper spacing
// Ensures consistent display format like "8 MH FourStroke" instead of "8MH FourStroke"

export function formatMotorDisplayName(modelName: string): string {
  if (!modelName) return '';
  
  let formatted = modelName.trim();
  
  // Add space after HP numbers followed by rigging codes and ensure codes are uppercase
  // Matches patterns like: 8MH, 9.9ELH, 25ELHPT, 40EXLPT, etc.
  formatted = formatted.replace(
    /(\d+(?:\.\d+)?)(MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO)\b/gi, 
    (match, hp, code) => `${hp} ${code.toUpperCase()}`
  );
  
  // Ensure rigging codes are always uppercase even if they appear elsewhere
  formatted = formatted.replace(
    /\b(MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO)\b/gi,
    (match) => match.toUpperCase()
  );
  
  // Clean up any double spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
}

// Test function to verify formatting works correctly
export function testFormatMotorDisplayName() {
  const testCases = [
    { input: '8MH FourStroke', expected: '8 MH FourStroke' },
    { input: '9.9ELH FourStroke', expected: '9.9 ELH FourStroke' },
    { input: '25ELHPT FourStroke', expected: '25 ELHPT FourStroke' },
    { input: '40EXLPT SeaPro', expected: '40 EXLPT SeaPro' },
    { input: '115MLH Verado', expected: '115 MLH Verado' },
    { input: '200XL Verado', expected: '200 XL Verado' },
    { input: '15M FourStroke', expected: '15 M FourStroke' },
    { input: '2.5mh fourstroke', expected: '2.5 MH FourStroke' }, // Test lowercase to uppercase
    { input: '9.9elh fourstroke', expected: '9.9 ELH FourStroke' }, // Test lowercase to uppercase
    { input: 'FourStroke 25HP', expected: 'FourStroke 25HP' }, // No rigging code to fix
    { input: '', expected: '' },
  ];

  console.log('Testing formatMotorDisplayName:');
  let allPassed = true;
  
  for (const { input, expected } of testCases) {
    const result = formatMotorDisplayName(input);
    const passed = result === expected;
    if (!passed) allPassed = false;
    
    console.log(`  Input: "${input}" → Output: "${result}" | Expected: "${expected}" | ${passed ? '✅' : '❌'}`);
  }
  
  console.log(`\nAll tests ${allPassed ? 'PASSED' : 'FAILED'}`);
  return allPassed;
}