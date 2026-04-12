import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { ArrowLeft, Phone, MapPin } from 'lucide-react';

export default function FrenchBlogArticle() {
  const url = `${SITE_URL}/blog/fr/concessionnaire-mercury-platinum-ontario`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        "headline": "Concessionnaire Mercury Platinum en Ontario : Pourquoi les plaisanciers choisissent Harris Boat Works",
        "description": "Harris Boat Works est concessionnaire Mercury Marine Platinum à Gores Landing, Ontario. Prix transparents, techniciens certifiés, service pour plaisanciers francophones du Québec et de l'Ontario.",
        "author": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "publisher": { "@type": "Organization", "name": "Harris Boat Works", "@id": `${SITE_URL}/#organization` },
        "datePublished": "2026-04-12",
        "dateModified": "2026-04-12",
        "mainEntityOfPage": url,
        "inLanguage": "fr-CA",
        "isAccessibleForFree": true
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "inLanguage": "fr-CA",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "Français", "item": `${SITE_URL}/fr` },
            { "@type": "ListItem", "position": 3, "name": "Concessionnaire Mercury Platinum", "item": url }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Parlez-vous français chez Harris Boat Works?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Non, notre équipe travaille principalement en anglais. Mais le configurateur en ligne à mercuryrepower.ca n'a pas de barrière linguistique, et le courriel nous permet de gérer les échanges écrits avec soin."
            }
          },
          {
            "@type": "Question",
            "name": "Est-ce que Mercury Canada vous recommande?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui. Harris Boat Works est sur le réseau officiel des concessionnaires Mercury. Quand des clients contactent Mercury Canada dans notre secteur, ils nous sont souvent dirigés directement."
            }
          },
          {
            "@type": "Question",
            "name": "Puis-je faire entretenir mon moteur Mercury chez vous si je viens du Québec?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui. Notre atelier prend en charge les moteurs Mercury et Mercruiser. Soumettez votre demande à l'avance via hbw.wiki/service."
            }
          },
          {
            "@type": "Question",
            "name": "Vos prix sont-ils compétitifs par rapport aux concessionnaires québécois?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Nos prix sont transparents et sans frais cachés. Le configurateur à mercuryrepower.ca vous donne nos prix réels en CAD — comparez par vous-même."
            }
          },
          {
            "@type": "Question",
            "name": "Comment fonctionne la garantie Mercury si j'achète chez vous et que je retourne au Québec?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "La garantie Mercury est honorée par n'importe quel concessionnaire agréé Mercury en Amérique du Nord. Votre concessionnaire Mercury local au Québec peut gérer votre garantie."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background" lang="fr">
      <Helmet>
        <title>Concessionnaire Mercury Platinum Ontario | Harris Boat Works</title>
        <meta name="description" content="Harris Boat Works — concessionnaire Mercury Platinum à Gores Landing, Ontario. Prix transparents en ligne, remotorisation Mercury, service pour plaisanciers francophones." />
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="fr-CA" href={url} />
        <link rel="alternate" hrefLang="en-CA" href={`${SITE_URL}/blog`} />
        <meta property="og:title" content="Concessionnaire Mercury Platinum en Ontario" />
        <meta property="og:description" content="Pourquoi les plaisanciers francophones choisissent Harris Boat Works pour leurs moteurs Mercury." />
        <meta property="og:url" content={url} />
        <meta property="og:locale" content="fr_CA" />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content="2026-04-12" />
        <meta property="article:author" content="Harris Boat Works" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        {/* Back nav */}
        <nav className="mb-8">
          <Link to="/fr" className="text-primary hover:underline text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            ← Retour à la page d'accueil en français
          </Link>
        </nav>

        <article className="prose prose-lg max-w-none text-foreground">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-2">
            Concessionnaire Mercury Platinum en Ontario : Pourquoi les plaisanciers choisissent Harris Boat Works
          </h1>
          <p className="text-muted-foreground text-sm mb-8">Publié par Harris Boat Works | Gores Landing, Ontario</p>

          {/* Quick answer */}
          <div className="bg-primary/5 rounded-xl p-6 mb-8 not-prose">
            <h2 className="text-lg font-medium text-foreground mb-2">Réponse rapide</h2>
            <p className="text-foreground text-sm">
              Harris Boat Works est concessionnaire <strong>Mercury Marine Platinum</strong> à Gores Landing, en Ontario — le niveau le plus élevé du réseau Mercury. On sert les plaisanciers de l'Ontario et du Québec depuis 1947, avec des prix transparents en ligne et une approche franche. Bâtissez votre soumission en temps réel à <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a>.
            </p>
          </div>

          <h2>Ce que veut dire « concessionnaire Mercury Platinum »</h2>
          <p>Le réseau de concessionnaires Mercury Marine est divisé en niveaux. Le statut <strong>Platinum</strong> est le plus élevé.</p>
          <p><strong>Accès prioritaire aux pièces.</strong> Un concessionnaire Platinum a un accès privilégié à l'inventaire Mercury. Moins d'attente, moins de délais sur l'eau.</p>
          <p><strong>Techniciens certifiés Mercury.</strong> Notre atelier est staffé de mécaniciens qui ont suivi la formation Mercury officielle.</p>
          <p><strong>Garanties honorées sans friction.</strong> Votre moteur Mercury est sous garantie? Un concessionnaire Platinum traite les réclamations directement avec Mercury.</p>
          <p><strong>Recommandation directe de Mercury Canada.</strong> Quand un plaisancier contacte Mercury Canada pour trouver un concessionnaire de confiance, Mercury les envoie chez nous.</p>

          <h2>La transparence des prix : fini le « appelez pour un prix »</h2>
          <p>
            Si vous avez déjà magasiné un moteur hors-bord au Québec ou en Ontario, vous connaissez la routine : vous demandez le prix, on vous dit d'appeler, un vendeur vous donne un prix vague et commence à « négocier ».
          </p>
          <p>Nous, on a choisi de faire autrement.</p>
          <p>
            <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a> est un configurateur de soumission en temps réel. Vous choisissez votre moteur, vos options — et vous voyez le prix réel, en dollars canadiens, immédiatement. Le prix que vous voyez, c'est le prix. Tout le monde voit le même chiffre.
          </p>

          <h2>Qu'est-ce qu'une remotorisation (repower)?</h2>
          <p>
            On garde votre coque et on remplace le moteur. Si votre embarcation est en bon état mais que le moteur commence à coûter cher en réparations, une remotorisation est presque toujours plus intelligente qu'acheter une nouvelle embarcation.
          </p>
          <ul>
            <li><strong>Votre coque a de la valeur.</strong> Une coque bien entretenue dure des décennies.</li>
            <li><strong>Le coût est nettement inférieur.</strong> Un moteur Mercury neuf installé coûte une fraction du prix d'une nouvelle embarcation.</li>
            <li><strong>La technologie a beaucoup évolué.</strong> Plus économe, plus fiable, plus silencieux.</li>
          </ul>

          <h2>Une marina de famille depuis 1947</h2>
          <p>
            Harris Boat Works est une entreprise familiale de troisième génération, fondée en 1947 à Gores Landing, sur le lac Rice. Ça fait 78 ans qu'on sert les mêmes familles — et leurs enfants et petits-enfants.
          </p>
          <p>
            Le lac Rice et les Kawarthas sont à moins de trois heures de Montréal. Pour un plaisancier du Québec ou de l'est de l'Ontario, on est bien situés.
          </p>

          <h2>Comment travailler avec nous en français</h2>
          <ol>
            <li><strong>Bâtissez votre soumission en ligne</strong> — <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a>, aucun échange verbal requis.</li>
            <li><strong>Envoyez une demande par formulaire</strong> — <a href="https://hbw.wiki/service" className="text-primary hover:underline">hbw.wiki/service</a>, vous pouvez écrire en français.</li>
            <li><strong>Appelez si vous préférez</strong> — 905-342-2153, on va prendre le temps qu'il faut.</li>
            <li><strong>Venez nous voir</strong> — une conversation en personne règle bien des choses.</li>
          </ol>
        </article>

        {/* FAQ Section */}
        <section className="mt-12 mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">Questions fréquentes des plaisanciers francophones</h2>
          <div className="space-y-6">
            {[
              { q: "Parlez-vous français chez Harris Boat Works?", a: "Non — on préfère être honnêtes. Mais le configurateur en ligne n'a pas de barrière linguistique, et le courriel nous permet de gérer les échanges écrits avec soin." },
              { q: "Est-ce que Mercury Canada vous recommande?", a: "Oui. Quand des clients contactent Mercury Canada dans notre secteur, ils nous sont souvent dirigés directement." },
              { q: "Puis-je faire entretenir mon moteur Mercury chez vous si je viens du Québec?", a: "Oui. Notre atelier prend en charge les moteurs Mercury et Mercruiser. Soumettez votre demande via hbw.wiki/service." },
              { q: "Vos prix sont-ils compétitifs?", a: "Nos prix sont transparents et sans frais cachés. Le configurateur à mercuryrepower.ca vous donne nos prix réels en CAD — comparez par vous-même." },
              { q: "Comment fonctionne la garantie si je retourne au Québec?", a: "La garantie Mercury est honorée par n'importe quel concessionnaire agréé Mercury en Amérique du Nord." },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground mb-2">{q}</h3>
                <p className="text-muted-foreground text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-primary/5 rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-light text-foreground mb-3">Commencez ici</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/quote/motor-selection"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Bâtir ma soumission
            </Link>
            <a
              href="tel:905-342-2153"
              className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              905-342-2153
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
