import { Helmet } from '@/lib/helmet';
import { SITE_URL } from '@/lib/site';
import { getPublishedSpanishArticles } from '@/data/spanishBlogArticles';
import { BlogHub, type BlogHubStrings } from '@/components/blog/BlogHub';

const categoryToIntent: Record<string, 'repower' | 'choose' | 'trouble' | 'local'> = {
  'Comparación de motores': 'choose',
  'Guía de compra': 'choose',
  'Mantenimiento': 'trouble',
  'Pesca': 'local',
  'Regulaciones': 'local',
  'Remotorización': 'repower',
};

const strings: BlogHubStrings = {
  heroTitleLine1: 'Guías de motores fueraborda',
  heroTitleLine2: 'y respuestas claras.',
  heroSubhead:
    'Consejos prácticos de un concesionario Mercury familiar en Rice Lake. Remotorización, diagnóstico y cómo elegir el fueraborda adecuado, escrito por quienes los instalan.',
  searchLabel: 'Buscar guías',
  searchPlaceholder: 'Buscar guías, modelos, temas…',
  trustItems: [],
  intentHeading: '¿Qué necesitas?',
  intents: {
    repower: 'Remotorización y costo',
    choose: 'Elegir un motor',
    trouble: 'Diagnóstico y averías',
    local: 'Rice Lake y la zona',
  },
  featuredEyebrow: 'Destacado',
  featuredReadCta: 'Leer la guía',
  latestHeading: 'Últimas guías',
  latestSubhead: 'Recién salidas del taller y del muelle.',
  newBadge: 'Nuevo',
  updatedBadge: 'Actualizado',
  categorySections: [
    { id: 'choose', heading: 'Guías de compra' },
    { id: 'trouble', heading: 'Diagnóstico y mantenimiento' },
    { id: 'local', heading: 'Rice Lake y la zona' },
  ],
  allHeading: 'Todas las guías',
  showAll: 'Ver todas las guías',
  hideAll: 'Ocultar la lista completa',
  noResults:
    'Ninguna guía coincide con tu búsqueda. Prueba con otra palabra o quita el filtro.',
  clearFilters: 'Quitar filtros',
  activeFilterLabel: 'Resultados filtrados',
  ctaHeading: '¿Listo para cotizar tu remotorización?',
  ctaSubhead: 'Arma una cotización real en minutos. Solo recogida, sin presión.',
  ctaButton: 'Crear mi cotización',
  ctaPhone: '(905) 342-2153',
  phoneLabel: 'Llamar a Harris Boat Works',
};

export default function BlogIndexEs() {
  const articles = getPublishedSpanishArticles();
  const url = `${SITE_URL}/blog/es`;

  const sortedForSchema = [...articles].sort(
    (a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime(),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    inLanguage: 'es',
    name: 'Guías Mercury en español — Harris Boat Works',
    description:
      'Guías Mercury, remotorización, mantenimiento y seguridad náutica en español para los navegantes de Ontario.',
    hasPart: sortedForSchema.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/es/${a.slug}`,
      inLanguage: 'es',
      datePublished: a.datePublished,
    })),
  };

  return (
    <div lang="es">
      <Helmet>
        <title>Guías Mercury en español | Harris Boat Works</title>
        <meta
          name="description"
          content="Guías Mercury y consejos náuticos en español para Ontario: motores, remotorización, mantenimiento, seguridad y pesca en Rice Lake."
        />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="es" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Guías Mercury en español — Harris Boat Works" />
        <meta property="og:description" content="Guías Mercury y consejos náuticos en español para Ontario." />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="es" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <BlogHub
        strings={strings}
        articles={articles}
        basePath="/blog/es"
        heroImage="/lovable-uploads/pontoon-family-rice-lake-hero.png"
        categoryToIntent={categoryToIntent}
      />
    </div>
  );
}
