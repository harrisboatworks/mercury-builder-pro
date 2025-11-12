// Motor specification generator functions
// Used for generating detailed specs when database data is unavailable

export function generateDisplacement(hp: number): string {
  if (hp <= 6) return `${Math.round(hp * 24)}cc`;
  if (hp <= 25) return `${Math.round(hp * 20)}cc / ${(hp * 1.22).toFixed(1)} cu in`;
  if (hp <= 60) return `${Math.round(hp * 25)}cc / ${(hp * 1.53).toFixed(1)} cu in`;
  if (hp <= 150) return `${Math.round(hp * 17)}cc / ${(hp * 1.04).toFixed(1)} cu in`;
  return `${Math.round(hp * 14)}cc / ${(hp * 0.85).toFixed(1)} cu in`;
}

export function generateCylinders(hp: number): string {
  if (hp <= 6) return '1 Cylinder';
  if (hp <= 15) return '2 Cylinder Inline';
  if (hp <= 60) return '3 Cylinder Inline';
  if (hp <= 115) return '4 Cylinder Inline';
  if (hp <= 225) return 'V6';
  return 'V8';
}

export function generateBoreStroke(hp: number): string {
  if (hp <= 6) return '2.36" x 2.13"';
  if (hp <= 15) return '2.36" x 2.36"';
  if (hp <= 60) return '3.05" x 3.05"';
  if (hp <= 115) return '3.5" x 3.05"';
  return '3.5" x 3.4"';
}

export function generateRPMRange(hp: number): string {
  if (hp <= 6) return '4500-5500';
  if (hp <= 15) return '5000-6000';
  if (hp <= 60) return '5500-6500';
  return '5800-6400';
}

export function generateFuelSystem(hp: number): string {
  if (hp <= 15) return 'Carburetor';
  if (hp <= 60) return 'Electronic Fuel Injection (EFI)';
  return 'Direct Fuel Injection (DFI)';
}

export function generateWeight(hp: number): string {
  const weight = Math.round(hp * 4.2 + 85);
  return `${weight} lbs`;
}

export function generateGearRatio(hp: number): string {
  if (hp <= 6) return '2.15:1';
  if (hp <= 25) return '2.08:1';
  if (hp <= 60) return '1.83:1';
  if (hp <= 150) return '1.75:1';
  return '1.75:1';
}

export function generateAlternator(hp: number): string {
  if (hp <= 15) return '6 amp';
  if (hp <= 60) return '12 amp';
  if (hp <= 150) return '20 amp';
  return '60 amp';
}
