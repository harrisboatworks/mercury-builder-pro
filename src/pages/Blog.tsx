import { BlogIndexSEO } from '@/components/seo/BlogIndexSEO';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';
import { getPublishedArticles } from '@/data/blogArticles';

const EN_STRINGS: BlogHubStrings = {
  heroTitleLine1: 'Boat motor guides',
  heroTitleLine2: '& straight answers.',
  heroSubhead:
    'Real-world advice from a family Mercury dealer on Rice Lake. Repowers, troubleshooting, and choosing the right outboard — written by the people who rig them.',
  searchLabel: 'Search guides',
  searchPlaceholder: 'Search guides, models, topics…',
  trustItems: [
    'Family marina since 1947',
    'Mercury dealer since 1965',
    'Mercury Premier Dealer',
    'Water-tested on Rice Lake',
  ],
  intentHeading: 'What do you need?',
  intents: {
    repower: 'Repower & cost',
    choose: 'Choose a motor',
    trouble: 'Troubleshooting',
    local: 'Rice Lake & local',
  },
  featuredEyebrow: 'Cover story',
  featuredReadCta: 'Read the guide',
  latestHeading: 'Latest guides',
  latestSubhead: 'Fresh from the shop and the dock.',
  newBadge: 'New',
  updatedBadge: 'Updated',
  categorySections: [
    { id: 'choose', heading: 'Buying guides' },
    { id: 'trouble', heading: 'Troubleshooting & maintenance' },
    { id: 'local', heading: 'Rice Lake & local' },
  ],
  allHeading: 'All guides',
  showAll: 'View all guides',
  hideAll: 'Hide full list',
  noResults: 'No guides match your search yet. Try a different word or clear the filter.',
  clearFilters: 'Clear filters',
  activeFilterLabel: 'Filtered results',
  ctaHeading: 'Ready to price your repower?',
  ctaSubhead: 'Build a real quote in minutes — pickup only, no pressure.',
  ctaButton: 'Build My Quote',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Call Harris Boat Works',
};

export default function Blog() {
  const articles = getPublishedArticles();
  return (
    <>
      <BlogIndexSEO />
      <BlogHub strings={EN_STRINGS} articles={articles} basePath="/blog" />
    </>
  );
}
