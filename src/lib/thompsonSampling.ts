/**
 * Thompson Sampling implementation for Multi-Armed Bandit A/B testing
 * Automatically shifts traffic toward better-performing variants
 */

export interface VariantStats {
  variantId: string;
  message: string;
  impressions: number;
  accepts: number;
  isWinner?: boolean;
}

export interface BanditResult {
  selectedVariant: VariantStats;
  explorationMode: 'exploring' | 'exploiting' | 'graduated';
  confidence?: number;
}

/**
 * Sample from a Gamma distribution using Marsaglia and Tsang's method
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1/3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number, v: number;
    do {
      x = gaussianRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

/**
 * Box-Muller transform for Gaussian random numbers
 */
function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Sample from a Beta distribution using Gamma distribution relationship
 * Beta(alpha, beta) = Gamma(alpha) / (Gamma(alpha) + Gamma(beta))
 */
export function sampleBeta(alpha: number, beta: number): number {
  const gammaAlpha = sampleGamma(alpha);
  const gammaBeta = sampleGamma(beta);
  return gammaAlpha / (gammaAlpha + gammaBeta);
}

/**
 * Select a variant using Thompson Sampling
 * Returns the variant with the highest sampled value from its posterior
 */
export function selectVariant(variants: VariantStats[]): BanditResult {
  if (variants.length === 0) {
    throw new Error('No variants provided');
  }

  // Check if any variant has already graduated as winner
  const graduated = variants.find(v => v.isWinner);
  if (graduated) {
    return {
      selectedVariant: graduated,
      explorationMode: 'graduated',
      confidence: 0.95
    };
  }

  // Sample from each variant's Beta posterior distribution
  // Beta(successes + 1, failures + 1) is the posterior with uniform prior
  const samples = variants.map(v => {
    const alpha = v.accepts + 1;  // successes + prior
    const beta = (v.impressions - v.accepts) + 1;  // failures + prior
    return {
      variant: v,
      sample: sampleBeta(alpha, beta)
    };
  });

  // Select the variant with highest sampled value
  samples.sort((a, b) => b.sample - a.sample);
  const selected = samples[0];

  // Determine if we're exploring or exploiting
  // If the selected variant has significantly more impressions, we're exploiting
  const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0);
  const selectedShare = selected.variant.impressions / Math.max(totalImpressions, 1);
  
  return {
    selectedVariant: selected.variant,
    explorationMode: selectedShare > 0.5 ? 'exploiting' : 'exploring'
  };
}

/**
 * Calculate win probability for each variant using Monte Carlo simulation
 */
export function calculateWinProbabilities(
  variants: VariantStats[], 
  simulations: number = 10000
): Array<{ variant: VariantStats; probability: number }> {
  const wins = new Map<string, number>();
  variants.forEach(v => wins.set(v.variantId, 0));

  for (let i = 0; i < simulations; i++) {
    const samples = variants.map(v => ({
      id: v.variantId,
      sample: sampleBeta(v.accepts + 1, (v.impressions - v.accepts) + 1)
    }));
    
    // Find winner of this simulation
    const winner = samples.reduce((best, curr) => 
      curr.sample > best.sample ? curr : best
    );
    wins.set(winner.id, (wins.get(winner.id) || 0) + 1);
  }

  return variants.map(v => ({
    variant: v,
    probability: (wins.get(v.variantId) || 0) / simulations
  }));
}

/**
 * Check if any variant has achieved statistical significance as winner
 * Requires minimum samples and 95%+ probability of being best
 */
export function checkForWinner(
  variants: VariantStats[],
  minSamplesPerVariant: number = 50
): VariantStats | null {
  // Ensure all variants have minimum samples
  if (variants.some(v => v.impressions < minSamplesPerVariant)) {
    return null;
  }

  // Run Monte Carlo simulation
  const probabilities = calculateWinProbabilities(variants, 10000);
  
  // If any variant has 95%+ probability of being best, it's the winner
  const winner = probabilities.find(p => p.probability >= 0.95);
  return winner?.variant || null;
}

/**
 * Get device type from user agent
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    return 'mobile';
  }
  if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Generate or retrieve a consistent session ID for experiment tracking
 */
export function getExperimentSessionId(): string {
  const storageKey = 'nudge_experiment_session';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}
