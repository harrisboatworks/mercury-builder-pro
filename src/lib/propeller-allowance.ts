/**
 * HP-based propeller allowance for quotes.
 * Under 25 HP: included with motor ($0).
 * 25–115 HP: $350 Aluminum.
 * 150 HP+: $1,200 Stainless Steel.
 */
export function getPropellerAllowance(hp: number): {
  price: number;
  name: string;
  description: string;
} | null {
  if (hp < 25) return null; // prop included with motor
  if (hp <= 115) {
    return {
      price: 350,
      name: 'Propeller Allowance (Aluminum)',
      description: 'Standard aluminum propeller — final selection after water test',
    };
  }
  // 150 HP+
  return {
    price: 1200,
    name: 'Propeller Allowance (Stainless Steel)',
    description: 'Stainless steel propeller — final selection after water test',
  };
}
