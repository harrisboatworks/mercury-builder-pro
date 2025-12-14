/**
 * Motor Description Generator
 * Creates appropriate fallback descriptions based on HP and motor family
 * Also detects suspicious/incorrect descriptions
 */

interface MotorContext {
  hp: number;
  family?: string;
  model?: string;
  modelDisplay?: string;
  controlType?: string;
}

/**
 * Detect if a description appears incorrect or generic
 */
export function isDescriptionSuspicious(
  description: string | null | undefined,
  motor: { hp?: number; horsepower?: number; family?: string; model?: string; modelDisplay?: string; model_display?: string }
): boolean {
  if (!description) return true;
  if (description.length < 100) return true;
  
  const desc = description.toLowerCase();
  const hp = motor.hp || motor.horsepower || 0;
  const family = motor.family?.toLowerCase() || '';
  const model = (motor.modelDisplay || motor.model_display || motor.model || '').toLowerCase();
  
  // Generic cottage description that was duplicated across many motors
  if (desc.includes('cottage owners') && desc.includes('exploring hidden coves')) {
    return true;
  }
  
  // Pro XS motor with Verado or generic FourStroke description
  if ((family.includes('pro') || model.includes('pro xs') || model.includes('proxs')) && 
      (desc.includes('verado') || desc.includes('v6 fourstroke') || desc.includes('supercharged'))) {
    return true;
  }
  
  // Verado motor without Verado-specific content
  if (family.includes('verado') && !desc.includes('verado') && hp >= 200) {
    return true;
  }
  
  // SmartCraft description used for portable motors
  if (hp <= 15 && desc.includes('smartcraft digital gauges')) {
    return true;
  }
  
  // Wrong HP mentioned in description (check for obvious mismatches)
  const hpMatches = desc.match(/(\d+)\s*hp/g);
  if (hpMatches) {
    for (const match of hpMatches) {
      const mentionedHp = parseInt(match);
      if (mentionedHp > 0 && Math.abs(mentionedHp - hp) > 50) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Generate an appropriate description based on motor characteristics
 */
export function generateMotorDescription(context: MotorContext): string {
  const { hp, family = '', model = '', modelDisplay = '' } = context;
  const familyLower = family.toLowerCase();
  const modelLower = (modelDisplay || model).toLowerCase();
  
  // Pro XS family - performance-focused
  if (familyLower.includes('pro') || modelLower.includes('pro xs') || modelLower.includes('proxs')) {
    return generateProXSDescription(hp);
  }
  
  // Verado family - premium luxury
  if (familyLower.includes('verado') || modelLower.includes('verado')) {
    return generateVeradoDescription(hp);
  }
  
  // FourStroke by HP range
  if (hp <= 6) return generatePortableDescription(hp);
  if (hp <= 15) return generateSmallFourStrokeDescription(hp);
  if (hp <= 30) return generateMidRangeFourStrokeDescription(hp);
  if (hp <= 75) return generateMediumFourStrokeDescription(hp);
  if (hp <= 150) return generateLargeFourStrokeDescription(hp);
  return generateHighPowerFourStrokeDescription(hp);
}

function generateProXSDescription(hp: number): string {
  if (hp <= 150) {
    return `The Mercury ${hp}hp Pro XS is purpose-built for tournament anglers and performance enthusiasts who demand the edge. Lighter weight, faster acceleration, and higher top-end speed than standard FourStrokes - this motor is engineered to win. Advanced fuel injection, performance-tuned gearcase, and race-proven reliability make it the choice of serious competitors. When getting to the fishing spot first matters, the Pro XS delivers.`;
  }
  if (hp <= 200) {
    return `The Mercury ${hp}hp Pro XS delivers tournament-winning performance in a package that's lighter and faster than the competition. Purpose-built for bass boats and high-performance fishing rigs, it features advanced SmartCraft technology, a performance-tuned gearcase, and the explosive acceleration serious anglers demand. When every second counts on tournament day, the Pro XS puts you ahead of the pack.`;
  }
  return `The Mercury ${hp}hp Pro XS represents the pinnacle of tournament outboard performance. Engineered for competitive anglers who accept no compromise, it delivers class-leading acceleration, top-end speed, and all-day reliability. Advanced SmartCraft integration, precision-tuned performance, and legendary Mercury durability make this the weapon of choice for serious tournament fishermen.`;
}

function generateVeradoDescription(hp: number): string {
  if (hp <= 300) {
    return `The Mercury ${hp}hp Verado sets the standard for premium outboard performance. Legendary smoothness, whisper-quiet operation, and effortless power define the Verado experience. Advanced Quiet Ride technology, integrated power steering, and premium construction create a boating experience unlike any other. For those who demand the finest, the Verado delivers excellence in every detail.`;
  }
  if (hp <= 400) {
    return `The Mercury ${hp}hp Verado V8 represents the pinnacle of outboard engineering. Supercharged power delivers extraordinary thrust with signature Verado refinement. Advanced Quiet Ride technology, integrated hydraulic steering, and premium construction create an unmatched boating experience. Whether you're running offshore or cruising the coast, the Verado V8 delivers performance and luxury in perfect harmony.`;
  }
  return `The Mercury ${hp}hp Verado is the ultimate expression of outboard excellence. Supercharged V8 power, unmatched refinement, and legendary reliability combine in Mercury's flagship outboard. Advanced Quiet Ride technology virtually eliminates vibration, while integrated power steering and premium construction deliver an experience that's second to none. For boaters who demand the absolute best, the Verado delivers.`;
}

function generatePortableDescription(hp: number): string {
  const hpDisplay = hp === 3.5 ? '3.5' : hp.toString();
  return `The Mercury ${hpDisplay}hp FourStroke is the ultimate portable outboard - lightweight, reliable, and built for years of dependable service. Perfect for dinghies, inflatables, canoes, and small jon boats, it delivers smooth, quiet power without the weight. Easy starting, fuel-efficient operation, and legendary Mercury quality make it the go-to choice for cottagers, sailors, and anyone who values hassle-free boating.`;
}

function generateSmallFourStrokeDescription(hp: number): string {
  return `The Mercury ${hp}hp FourStroke delivers impressive performance in a portable package. Ideal for aluminum fishing boats, inflatables, and tenders, it offers the perfect balance of power and convenience. Electronic fuel injection ensures reliable starts in any weather, while excellent fuel economy keeps you on the water longer. Smooth, quiet operation and legendary Mercury reliability make every trip enjoyable.`;
}

function generateMidRangeFourStrokeDescription(hp: number): string {
  return `The Mercury ${hp}hp FourStroke hits the sweet spot for versatility and value. Powerful enough for serious fishing yet efficient enough for all-day cruising, it's the workhorse motor for aluminum boats, pontoons, and mid-sized inflatables. Advanced fuel injection, smooth acceleration, and remarkably quiet operation deliver a premium experience at an accessible price point.`;
}

function generateMediumFourStrokeDescription(hp: number): string {
  return `The Mercury ${hp}hp FourStroke delivers the power and performance serious boaters demand. Engineered for pontoons, fishing boats, and center consoles, it combines responsive acceleration with excellent fuel economy. Advanced electronics, smooth four-stroke power, and Mercury's legendary reliability mean you can focus on enjoying your time on the water.`;
}

function generateLargeFourStrokeDescription(hp: number): string {
  return `The Mercury ${hp}hp FourStroke is built for boaters who demand serious performance. Whether you're chasing fish offshore or cruising with family, this motor delivers responsive power, impressive fuel efficiency, and the refinement you expect from Mercury. Advanced SmartCraft technology, smooth acceleration, and proven reliability make it the choice of experienced boaters.`;
}

function generateHighPowerFourStrokeDescription(hp: number): string {
  return `The Mercury ${hp}hp FourStroke delivers exhilarating performance for serious offshore capability. Powerful V6 or V8 architecture provides explosive acceleration and impressive top-end speed, while advanced fuel injection ensures exceptional efficiency. Premium features, SmartCraft integration, and Mercury's legendary build quality create an outboard that performs as good as it looks.`;
}
