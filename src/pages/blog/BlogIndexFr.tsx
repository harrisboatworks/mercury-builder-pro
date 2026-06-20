import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedFrenchArticles } from '@/data/frenchBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

// Maps every distinct French `category` value present in frenchBlogArticles
// to one of BlogHub's four intent keys. Keep this exhaustive so no posts
// vanish from the intent tiles / category sections.
const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  "Guide d'achat": 'choose',
  'Comparaison': 'choose',
  'Avis produit': 'choose',
  'Entretien': 'trouble',
  'Dépannage': 'trouble',
  'Destination': 'local',
  'Réglementation': 'local',
  'Assurance': 'repower',
  'Garantie': 'repower',
};

const strings: BlogHubStrings = {
  heroTitleLine1: 'Guides de moteurs marins',
  heroTitleLine2: 'et réponses franches.',
  heroSubhead:
    "Des conseils concrets d'un concessionnaire Mercury familial sur le lac Rice. Remotorisation, dépannage et choix du bon hors-bord, par les gens qui les installent.",
  searchLabel: 'Rechercher des guides',
  searchPlaceholder: 'Rechercher un guide, un modèle, un sujet…',
  trustItems: [],
  intentHeading: 'Que cherchez-vous à comprendre ?',
  intents: {
    repower: 'Remotorisation et coût',
    choose: 'Choisir un moteur',
    trouble: 'Dépannage',
    local: 'Lac Rice et région',
  },
  featuredEyebrow: 'À la une',
  featuredReadCta: 'Lire le guide',
  latestHeading: 'Derniers guides',
  latestSubhead: "Frais de l'atelier et du quai.",
  newBadge: 'Nouveau',
  updatedBadge: 'Mis à jour',
  categorySections: [
    { id: 'choose', heading: "Guides d'achat" },
    { id: 'trouble', heading: 'Dépannage et entretien' },
    { id: 'local', heading: 'Lac Rice et région' },
  ],
  allHeading: 'Tous les guides',
  showAll: 'Voir tous les guides',
  hideAll: 'Masquer la liste complète',
  noResults:
    'Aucun guide ne correspond à votre recherche. Essayez un autre mot ou réinitialisez le filtre.',
  clearFilters: 'Réinitialiser les filtres',
  activeFilterLabel: 'Résultats filtrés',
  ctaHeading: 'Prêt à chiffrer votre remotorisation ?',
  ctaSubhead:
    'Obtenez une soumission réelle en quelques minutes. Ramassage seulement, sans pression.',
  ctaButton: 'Créer ma soumission',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Appeler Harris Boat Works',
};

export default function BlogIndexFr() {
  const articles = getPublishedFrenchArticles();
  const url = `${SITE_URL}/blog/fr`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'fr-CA',
    name: 'Guides Mercury en français — Harris Boat Works',
    description:
      "Guides Mercury, remotorisation, entretien et sécurité nautique en français pour les plaisanciers de l'Ontario.",
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/fr/${a.slug}`,
      inLanguage: 'fr-CA',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="fr">
      <Helmet>
        <title>Guides Mercury en français | Harris Boat Works</title>
        <meta
          name="description"
          content="Guides Mercury et conseils nautiques en français pour l'Ontario : moteurs, remotorisation, entretien, sécurité et pêche sur le lac Rice."
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="fr-CA" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Guides Mercury en français — Harris Boat Works" />
        <meta
          property="og:description"
          content="Guides Mercury et conseils nautiques en français pour l'Ontario."
        />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="fr_CA" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/fr"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
