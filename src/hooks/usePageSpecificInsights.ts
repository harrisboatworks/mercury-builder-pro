import { useState, useEffect, useMemo } from 'react';

interface PageInsight {
  insight: string;
  questionForm: string; // The insight converted to a question
}

interface UsePageSpecificInsightsResult {
  insights: PageInsight[];
  isLoading: boolean;
  error: string | null;
}

// Cache for page insights to avoid repeated API calls
const insightsCache = new Map<string, { insights: PageInsight[]; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Page-specific Perplexity query configurations
const PAGE_QUERIES: Record<string, { queries: string[]; questionTemplates: string[] }> = {
  '/quote/package-selection': {
    queries: [
      'Mercury outboard extended warranty common claims 2024',
      'Mercury water pump replacement cost outboard',
    ],
    questionTemplates: [
      'Are water pump failures covered?',
      'What parts fail most often?',
    ],
  },
  '/quote/promo-selection': {
    queries: [
      'Mercury Marine current promotions Canada',
      'Mercury outboard financing rates comparison',
    ],
    questionTemplates: [
      'How do these rates compare to banks?',
      'What\'s the catch with 0% financing?',
    ],
  },
  '/financing': {
    queries: [
      'boat financing approval requirements Canada',
      'marine loan interest rates 2024',
    ],
    questionTemplates: [
      'What credit score do I really need?',
      'Is boat financing harder than car loans?',
    ],
  },
  '/repower': {
    queries: [
      'Mercury repower cost savings fuel efficiency',
      'outboard repower vs repair decision',
    ],
    questionTemplates: [
      'Will I actually save on fuel?',
      'When does repower make more sense than repair?',
    ],
  },
};

// Convert Perplexity insight into a natural question
function insightToQuestion(insight: string, template: string): string {
  // If we have a template, use it
  if (template) return template;
  
  // Otherwise, try to convert the insight into a question
  // This is a fallback - templates are preferred
  const lowered = insight.toLowerCase();
  
  if (lowered.includes('water pump')) {
    return 'Are water pump failures covered?';
  }
  if (lowered.includes('warranty claim') || lowered.includes('common claim')) {
    return 'What do most people claim on warranty?';
  }
  if (lowered.includes('fuel') && lowered.includes('save')) {
    return 'How much will I save on fuel?';
  }
  if (lowered.includes('financing') || lowered.includes('rate')) {
    return 'How do your rates compare?';
  }
  
  return template || 'Tell me more about this';
}

/**
 * Hook to fetch page-specific insights from Perplexity.
 * Returns insights that can be used to generate smarter quick questions.
 */
export function usePageSpecificInsights(currentPage: string): UsePageSpecificInsightsResult {
  const [insights, setInsights] = useState<PageInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the page config - match on partial path
  const pageConfig = useMemo(() => {
    for (const [path, config] of Object.entries(PAGE_QUERIES)) {
      if (currentPage.includes(path)) {
        return { path, config };
      }
    }
    return null;
  }, [currentPage]);

  useEffect(() => {
    if (!pageConfig) {
      setInsights([]);
      return;
    }

    const { path, config } = pageConfig;

    // Check cache first
    const cached = insightsCache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setInsights(cached.insights);
      return;
    }

    // Fetch from Perplexity
    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For now, use the question templates directly without calling Perplexity
        // This provides immediate value while being cost-effective
        // In production, we could enhance with actual Perplexity calls for dynamic insights
        
        const staticInsights: PageInsight[] = config.questionTemplates.map((template, i) => ({
          insight: config.queries[i] || template,
          questionForm: template,
        }));

        // Cache the results
        insightsCache.set(path, {
          insights: staticInsights,
          timestamp: Date.now(),
        });

        setInsights(staticInsights);
      } catch (err) {
        console.error('[usePageSpecificInsights] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch insights');
        // Use templates as fallback
        setInsights(config.questionTemplates.map(q => ({ insight: q, questionForm: q })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [pageConfig]);

  return { insights, isLoading, error };
}

/**
 * Get a Perplexity-enhanced question from page insights.
 * Returns null if no insights are available.
 */
export function getPerplexityQuestion(insights: PageInsight[]): string | null {
  if (!insights || insights.length === 0) return null;
  
  // Return a random insight question
  const randomIndex = Math.floor(Math.random() * insights.length);
  return insights[randomIndex].questionForm;
}
