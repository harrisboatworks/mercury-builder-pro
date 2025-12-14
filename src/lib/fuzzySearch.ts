/**
 * Lightweight fuzzy search with Levenshtein distance algorithm
 * Zero dependencies - pure TypeScript implementation
 */

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Uses dynamic programming with O(n×m) complexity
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  // Early exit for empty strings
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Early exit if length difference is too large (optimization)
  if (Math.abs(aLen - bLen) > 5) {
    return Math.max(aLen, bLen);
  }

  // Create distance matrix
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= aLen; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[aLen][bLen];
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1 = identical, 0 = completely different
 */
export function getSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLen);
}

export type MatchType = 'exact' | 'starts-with' | 'contains' | 'fuzzy' | 'none';

export interface FuzzyResult<T> {
  item: T;
  score: number;
  matchType: MatchType;
  matchedField?: string;
}

export interface FuzzySearchOptions {
  threshold?: number;      // Minimum similarity score (0-1), default 0.4
  maxResults?: number;     // Maximum results to return
  boostExact?: number;     // Score boost for exact matches
  boostStartsWith?: number; // Score boost for starts-with matches
  boostContains?: number;  // Score boost for contains matches
}

const DEFAULT_OPTIONS: Required<FuzzySearchOptions> = {
  threshold: 0.4,
  maxResults: 50,
  boostExact: 1.0,
  boostStartsWith: 0.95,
  boostContains: 0.85,
};

/**
 * Score a single field against the query
 */
function scoreField(fieldValue: string, query: string, options: Required<FuzzySearchOptions>): { score: number; matchType: MatchType } {
  if (!fieldValue) return { score: 0, matchType: 'none' };
  
  const field = fieldValue.toLowerCase();
  const q = query.toLowerCase();
  
  // Exact match
  if (field === q) {
    return { score: options.boostExact, matchType: 'exact' };
  }
  
  // Starts with
  if (field.startsWith(q)) {
    return { score: options.boostStartsWith, matchType: 'starts-with' };
  }
  
  // Contains
  if (field.includes(q)) {
    return { score: options.boostContains, matchType: 'contains' };
  }
  
  // Fuzzy match using Levenshtein
  const similarity = getSimilarity(field, q);
  if (similarity >= options.threshold) {
    return { score: similarity, matchType: 'fuzzy' };
  }
  
  // Word-by-word matching for multi-word fields
  const fieldWords = field.split(/\s+/);
  for (const word of fieldWords) {
    if (word.startsWith(q)) {
      return { score: options.boostStartsWith * 0.9, matchType: 'starts-with' };
    }
    if (word.includes(q)) {
      return { score: options.boostContains * 0.9, matchType: 'contains' };
    }
    const wordSimilarity = getSimilarity(word, q);
    if (wordSimilarity >= options.threshold) {
      return { score: wordSimilarity * 0.95, matchType: 'fuzzy' };
    }
  }
  
  return { score: 0, matchType: 'none' };
}

/**
 * Score a query with multiple words against an item
 */
function scoreMultiWordQuery<T>(
  item: T,
  queryWords: string[],
  keys: (keyof T)[],
  options: Required<FuzzySearchOptions>
): { score: number; matchType: MatchType; matchedField?: string } {
  let totalScore = 0;
  let matchedWords = 0;
  let bestMatchType: MatchType = 'none';
  let matchedField: string | undefined;

  for (const word of queryWords) {
    let bestWordScore = 0;
    let wordMatchType: MatchType = 'none';
    
    for (const key of keys) {
      const value = item[key];
      if (typeof value !== 'string') continue;
      
      const { score, matchType } = scoreField(value, word, options);
      if (score > bestWordScore) {
        bestWordScore = score;
        wordMatchType = matchType;
        matchedField = key as string;
      }
    }
    
    if (bestWordScore > 0) {
      matchedWords++;
      totalScore += bestWordScore;
      if (wordMatchType !== 'none' && (bestMatchType === 'none' || 
          ['exact', 'starts-with', 'contains', 'fuzzy'].indexOf(wordMatchType) < 
          ['exact', 'starts-with', 'contains', 'fuzzy'].indexOf(bestMatchType))) {
        bestMatchType = wordMatchType;
      }
    }
  }

  // Average score weighted by match coverage
  const coverage = matchedWords / queryWords.length;
  const avgScore = matchedWords > 0 ? (totalScore / queryWords.length) * coverage : 0;
  
  return { score: avgScore, matchType: bestMatchType, matchedField };
}

/**
 * Perform fuzzy search across multiple fields
 * 
 * @param items - Array of items to search
 * @param query - Search query string
 * @param keys - Object keys to search within
 * @param options - Search options
 * @returns Sorted array of matching results with scores
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: (keyof T)[],
  options?: FuzzySearchOptions
): FuzzyResult<T>[] {
  if (!query || query.length < 2) return [];
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const queryWords = query.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
  
  if (queryWords.length === 0) return [];

  const results: FuzzyResult<T>[] = [];

  for (const item of items) {
    let bestScore = 0;
    let bestMatchType: MatchType = 'none';
    let matchedField: string | undefined;

    // Single word query - check each field
    if (queryWords.length === 1) {
      for (const key of keys) {
        const value = item[key];
        if (typeof value !== 'string') continue;
        
        const { score, matchType } = scoreField(value, queryWords[0], opts);
        if (score > bestScore) {
          bestScore = score;
          bestMatchType = matchType;
          matchedField = key as string;
        }
      }
    } else {
      // Multi-word query
      const result = scoreMultiWordQuery(item, queryWords, keys, opts);
      bestScore = result.score;
      bestMatchType = result.matchType;
      matchedField = result.matchedField;
    }

    if (bestScore >= opts.threshold) {
      results.push({
        item,
        score: bestScore,
        matchType: bestMatchType,
        matchedField,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Limit results
  return opts.maxResults ? results.slice(0, opts.maxResults) : results;
}

/**
 * Check if a query is a typo/fuzzy match (not exact/contains)
 */
export function isFuzzyMatch(matchType: MatchType): boolean {
  return matchType === 'fuzzy';
}
