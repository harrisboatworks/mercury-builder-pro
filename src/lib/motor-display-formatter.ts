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