import { Helmet } from '@/lib/helmet';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { ArrowLeft, MapPin } from 'lucide-react';

const ARTICLE_PATH = '/blog/fr/concessionnaire-mercury-premier-ontario';
const MERCURY_DEALER_URL = 'https://www.mercurymarine.com/ca/en/find-a-dealer';
const MERCURY_WARRANTY_URL = 'https://www.mercurymarine.com/ca/en/service-and-support/warranty-coverage-and-product-protection/mercury-limited-warranty';

const faqs = [
  {
    question: 'Parlez-vous français chez Harris Boat Works?',
    answer: "Notre équipe travaille principalement en anglais. Nous publions des guides en français pour rendre l'information plus accessible, mais les échanges de vente et de service se font en anglais. Vous pouvez soumettre un formulaire en français; notre réponse sera en anglais.",
  },
  {
    question: 'Harris Boat Works est-il un concessionnaire Mercury autorisé?',
    answer: 'Oui. Harris Boat Works est un concessionnaire Mercury Marine Premier à Gores Landing. Mercury recommande de passer par un concessionnaire autorisé pour les moteurs, les pièces, le soutien et le service.',
  },
  {
    question: 'Puis-je faire entretenir mon Mercury chez vous si je ne l\'ai pas acheté chez HBW?',
    answer: "Soumettez une demande de service avec le modèle, le numéro de série et les symptômes. L'équipe confirmera si le travail entre dans notre champ de service et la marche à suivre.",
  },
  {
    question: 'Comment planifier une hivernisation ou un entreposage?',
    answer: "HBW prend les travaux selon le principe du premier arrivé, premier servi. Il n'est pas nécessaire de réserver une place des mois à l'avance. Remplissez la demande de service une ou deux semaines avant le dépôt prévu. L'entreprise ferme le 1er décembre; la dernière période pratique est donc la mi-novembre.",
  },
  {
    question: 'Expédiez-vous ou livrez-vous les moteurs?',
    answer: "Non. Les achats et les projets de remotorisation sont ramassés à l'emplacement de Gores Landing. HBW n'expédie pas et ne livre pas les moteurs.",
  },
];

export default function FrenchBlogArticle() {
  const url = `${SITE_URL}${ARTICLE_PATH}`;
  const title = 'Concessionnaire Mercury Premier en Ontario';
  const description = 'Harris Boat Works est un concessionnaire Mercury Marine Premier à Gores Landing, sur le lac Rice. Prix Mercury en CAD, remotorisation et service pour les plaisanciers de l’Ontario.';

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: title,
        description,
        author: { '@type': 'Organization', name: 'Harris Boat Works', '@id': `${SITE_URL}/#organization` },
        publisher: { '@type': 'Organization', name: 'Harris Boat Works', '@id': `${SITE_URL}/#organization` },
        datePublished: '2026-04-12',
        dateModified: '2026-08-02',
        mainEntityOfPage: url,
        inLanguage: 'fr-CA',
        isAccessibleForFree: true,
        image: `${SITE_URL}/lovable-uploads/hero-best-mercury-dealer-ontario.png`,
        citation: [
          { '@type': 'CreativeWork', name: 'Mercury Marine Canada : Trouver un concessionnaire', url: MERCURY_DEALER_URL },
          { '@type': 'CreativeWork', name: 'Mercury Marine Canada : Garantie limitée', url: MERCURY_WARRANTY_URL },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blogue en français', item: `${SITE_URL}/blog/fr` },
          { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background" lang="fr-CA">
      <Helmet>
        <html lang="fr-CA" />
        <title>{title} | Harris Boat Works</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="fr-CA" href={url} />
        <link rel="alternate" hrefLang="x-default" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:locale" content="fr_CA" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`${SITE_URL}/lovable-uploads/hero-best-mercury-dealer-ontario.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE_URL}/lovable-uploads/hero-best-mercury-dealer-ontario.png`} />
        <meta property="article:published_time" content="2026-04-12" />
        <meta property="article:modified_time" content="2026-08-02" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <LuxuryHeader />

      <main className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
        <nav className="mb-8" aria-label="Fil d’Ariane">
          <Link to="/blog/fr" className="flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Retour au blogue en français
          </Link>
        </nav>

        <article className="prose prose-lg max-w-none text-foreground">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Gores Landing, Ontario</p>
          <h1 className="mb-3 text-3xl font-light text-foreground md:text-4xl">{title}</h1>
          <p className="mb-8 text-sm text-muted-foreground">Mis à jour le 2 août 2026 · Harris Boat Works</p>

          <img
            src="/lovable-uploads/hero-best-mercury-dealer-ontario.webp"
            alt="Harris Boat Works, concessionnaire Mercury Premier à Gores Landing en Ontario"
            className="mb-8 h-64 w-full rounded-xl object-cover md:h-80"
            loading="eager"
          />

          <section className="not-prose mb-10 rounded-xl bg-primary/5 p-6" aria-labelledby="reponse-rapide">
            <h2 id="reponse-rapide" className="mb-2 text-lg font-semibold text-foreground">Réponse rapide</h2>
            <p className="m-0 leading-relaxed text-foreground">
              Harris Boat Works est un concessionnaire <strong>Mercury Marine Premier</strong> à Gores Landing, sur le lac Rice. L'entreprise familiale sert les plaisanciers depuis 1947 et travaille avec Mercury depuis 1965. Vous pouvez consulter les prix des moteurs inscrits en dollars canadiens, bâtir une soumission et faire vérifier la compatibilité avant le dépôt du bateau.
            </p>
          </section>

          <h2>Pourquoi les plaisanciers de la région choisissent HBW</h2>
          <p>
            Un bon concessionnaire ne se résume pas à un badge. Il doit donner des réponses claires sur la puissance, le poids, l'arbre, les commandes, l'hélice et le coût du projet. La bonne puissance n'est pas celle qui gagne la discussion à la rampe; c'est celle qui convient à la coque et à son usage réel.
          </p>
          <ul>
            <li><strong>Prix en CAD visibles en ligne.</strong> Le configurateur affiche le prix des modèles Mercury inscrits et les options choisies. Les détails de gréage et d'installation sont confirmés selon le bateau.</li>
            <li><strong>Spécialisation Mercury.</strong> HBW vend les hors-bord Mercury et réalise des projets de remotorisation à son atelier de Gores Landing.</li>
            <li><strong>Contexte local.</strong> L'équipe travaille quotidiennement avec les bateaux utilisés sur le lac Rice, dans les Kawarthas, à Peterborough, dans Northumberland, Durham et la GTA.</li>
            <li><strong>Une réponse honnête sur la langue.</strong> Les guides sont offerts en français, mais l'équipe du magasin travaille principalement en anglais.</li>
          </ul>

          <h2>Ce que signifie le statut Mercury pour votre projet</h2>
          <p>
            Mercury décrit ses concessionnaires autorisés comme la ressource locale pour l'achat de moteurs, les pièces, le soutien et le service. Harris Boat Works est actuellement un concessionnaire Mercury Marine Premier. Vous pouvez aussi consulter le <a href={MERCURY_DEALER_URL} target="_blank" rel="noopener noreferrer">localisateur officiel de concessionnaires Mercury Canada</a>.
          </p>
          <p>
            Le statut du concessionnaire ne remplace toutefois pas la vérification du bateau. Avant une remotorisation, il faut confirmer la plaque de capacité, le poids sur le tableau arrière, la longueur d'arbre, la direction, les commandes et l'état de la coque. C'est cette vérification qui transforme un moteur neuf en bon projet.
          </p>

          <h2>Comment obtenir un prix utile</h2>
          <ol>
            <li><strong>Bâtissez une soumission.</strong> Choisissez le moteur et les options dans le configurateur Mercury en ligne.</li>
            <li><strong>Décrivez le bateau.</strong> La marque, le modèle, l'année, la plaque de capacité et des photos aident l'équipe à vérifier la compatibilité.</li>
            <li><strong>Faites confirmer le gréage.</strong> Les commandes, la direction, les jauges, l'hélice et le travail requis peuvent changer le total final.</li>
            <li><strong>Planifiez le dépôt à Gores Landing.</strong> Les moteurs et les projets sont ramassés sur place; HBW n'expédie pas et ne livre pas les moteurs.</li>
          </ol>

          <h2>Service, hivernisation et entreposage</h2>
          <p>
            Les travaux sont pris selon le principe du premier arrivé, premier servi. Pour l'hivernisation ou l'entreposage, il n'est pas nécessaire de réserver une place à la fin de l'été. La pratique recommandée est de remplir la <a href="https://hbw.wiki/service">demande de service</a> une ou deux semaines avant le dépôt prévu. Harris Boat Works ferme le 1er décembre; la dernière période pratique est donc la mi-novembre.
          </p>

          <h2>Garantie Mercury</h2>
          <p>
            Les modalités dépendent du produit, de l'usage et de la date d'achat. Consultez la <a href={MERCURY_WARRANTY_URL} target="_blank" rel="noopener noreferrer">garantie limitée Mercury Canada</a> et faites confirmer la couverture applicable à votre moteur. Les programmes promotionnels ou de protection prolongée ne doivent pas être présumés sans vérifier les conditions courantes.
          </p>
        </article>

        <section className="my-12" aria-labelledby="faq-fr">
          <h2 id="faq-fr" className="mb-6 text-2xl font-light text-foreground">Questions fréquentes</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-border pb-5">
                <h3 className="mb-2 font-medium text-foreground">{faq.question}</h3>
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-2xl bg-primary/5 p-8 text-center">
          <h2 className="mb-3 text-xl font-light text-foreground">Commencez avec les faits de votre bateau</h2>
          <p className="mx-auto mb-5 max-w-xl text-sm text-muted-foreground">Bâtissez une soumission en CAD ou envoyez les détails de votre bateau pour une vérification de compatibilité.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/quote/motor-selection" className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">Bâtir une soumission</Link>
            <a href="https://hbw.wiki/service" className="inline-flex items-center justify-center rounded-lg border border-primary px-6 py-3 font-medium text-primary hover:bg-primary/5">Demande de service</a>
          </div>
          <p className="mt-5 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
