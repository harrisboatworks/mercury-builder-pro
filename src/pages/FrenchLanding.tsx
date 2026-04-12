import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { SITE_URL } from '@/lib/site';
import { Phone, Mail, Globe, MapPin, Wrench, Anchor, Fuel, Ship, Warehouse } from 'lucide-react';

export default function FrenchLanding() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/fr#webpage`,
        "url": `${SITE_URL}/fr`,
        "name": "Bienvenue chez Harris Boat Works — Concessionnaire Mercury Platinum en Ontario",
        "description": "Concessionnaire Mercury Marine Platinum à Gores Landing, Ontario. Prix transparents en ligne, techniciens certifiés, service en anglais avec assistance pour clients francophones.",
        "inLanguage": "fr-CA",
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "about": { "@id": `${SITE_URL}/#organization` },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
            { "@type": "ListItem", "position": 2, "name": "Français", "item": `${SITE_URL}/fr` }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/fr#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Parlez-vous français?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Notre équipe travaille principalement en anglais. Mais on est sincèrement heureux de vous accueillir. Le configurateur de prix à mercuryrepower.ca fonctionne de la même façon quelle que soit votre langue. Pour les échanges plus complexes, le courriel nous donne le temps de bien comprendre votre besoin."
            }
          },
          {
            "@type": "Question",
            "name": "Puis-je obtenir un devis en ligne?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Oui — mercuryrepower.ca vous permet de choisir votre moteur, vos options, et de voir le prix réel en dollars canadiens, en temps réel. Pas de formulaire à remplir, pas d'appel obligatoire."
            }
          },
          {
            "@type": "Question",
            "name": "Offrez-vous la livraison au Québec?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "On peut en discuter. La majorité de nos clients viennent chercher leur moteur en personne, mais si la livraison est une nécessité, appelez-nous au 905-342-2153 ou écrivez-nous via hbw.wiki/service."
            }
          },
          {
            "@type": "Question",
            "name": "Quelles marques de moteurs vendez-vous?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "On est concessionnaire exclusif Mercury Marine. On vend la gamme complète : moteurs hors-bord de 2,5 HP à 600 HP (série Verado), moteurs Mercury MerCruiser, et moteurs électriques Avator."
            }
          },
          {
            "@type": "Question",
            "name": "Comment fonctionne la garantie Mercury si j'achète chez vous et que je retourne au Québec?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "La garantie Mercury est honorée par n'importe quel concessionnaire agréé Mercury en Amérique du Nord. Si vous avez un problème de garantie une fois rentré au Québec, vous pouvez vous adresser à votre concessionnaire Mercury local."
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
        <meta name="description" content="Harris Boat Works — concessionnaire Mercury Marine Platinum à Gores Landing, Ontario. Prix transparents en ligne à mercuryrepower.ca. Service pour plaisanciers francophones." />
        <link rel="canonical" href={`${SITE_URL}/fr`} />
        <link rel="alternate" hrefLang="fr-CA" href={`${SITE_URL}/fr`} />
        <link rel="alternate" hrefLang="en-CA" href={SITE_URL} />
        <link rel="alternate" hrefLang="zh-Hans" href={`${SITE_URL}/zh`} />
        <meta property="og:title" content="Bienvenue chez Harris Boat Works — Concessionnaire Mercury Platinum" />
        <meta property="og:description" content="Prix transparents en ligne pour moteurs Mercury. Concessionnaire Platinum en Ontario." />
        <meta property="og:url" content={`${SITE_URL}/fr`} />
        <meta property="og:locale" content="fr_CA" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <LuxuryHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
        {/* Hero */}
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4">
            Bienvenue chez Harris Boat Works
          </h1>
          <p className="text-lg text-primary font-medium mb-2">
            Concessionnaire Mercury Platinum en Ontario
          </p>
          <p className="text-muted-foreground font-light italic">
            Une chose d'abord : notre équipe travaille principalement en anglais. Mais on est sincèrement heureux de vous accueillir, et on va faire tout ce qu'on peut pour vous aider.
          </p>
        </header>

        {/* Intro */}
        <section className="prose prose-lg max-w-none mb-12 text-foreground">
          <p>
            Si vous êtes un plaisancier du Québec, de l'est de l'Ontario ou d'ailleurs au Canada francophone, vous êtes au bon endroit. Le configurateur de prix en ligne fonctionne dans toutes les langues, les demandes de service se font par formulaire, et on prend le temps qu'il faut pour communiquer clairement — par courriel, par téléphone ou par écrit.
          </p>
        </section>

        {/* Qui sommes-nous */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-4">Qui sommes-nous</h2>
          <div className="prose max-w-none text-foreground">
            <p>
              Harris Boat Works est une marina familiale de troisième génération établie en 1947 à Gores Landing, en Ontario, sur le lac Rice. Depuis presque 80 ans, on sert des plaisanciers de partout en Ontario et au-delà.
            </p>
            <p>
              On est concessionnaire <strong>Mercury Marine Platinum</strong> — le niveau le plus élevé du réseau Mercury. Ça veut dire : accès complet aux pièces, techniciens certifiés, garanties honorées, et une relation directe avec Mercury Marine. Quand Mercury Canada recommande un concessionnaire de confiance dans notre région, ils envoient les clients chez nous.
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">Nos services</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Ship, title: "Vente et remotorisations", desc: "Gamme complète Mercury — de 2,5 HP aux séries Verado et V8 400R." },
              { icon: Wrench, title: "Entretien et réparations", desc: "Atelier de service complet pour moteurs Mercury et Mercruiser." },
              { icon: Warehouse, title: "Entreposage hivernal", desc: "Des centaines d'embarcations passent l'hiver avec nous chaque année." },
              { icon: Anchor, title: "Location d'embarcations", desc: "Neuf embarcations disponibles sur le lac Rice." },
              { icon: Fuel, title: "Carburant sans éthanol", desc: "Essence sans éthanol sur place — idéal pour les moteurs hors-bord." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comment obtenir de l'aide */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">Comment obtenir de l'aide en français</h2>
          <div className="space-y-6">
            <div className="flex gap-3">
              <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">Le configurateur de prix en ligne</h3>
                <p className="text-muted-foreground text-sm">
                  <a href="https://mercuryrepower.ca" className="text-primary hover:underline">mercuryrepower.ca</a> — bâtissez votre soumission Mercury en temps réel, voyez les vrais prix, choisissez votre moteur sans négocier au téléphone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">Par courriel (recommandé)</h3>
                <p className="text-muted-foreground text-sm">
                  Vous pouvez écrire en français. Le courriel nous donne le temps de bien comprendre votre demande et de vous répondre avec précision.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Wrench className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">Demandes de service</h3>
                <p className="text-muted-foreground text-sm">
                  Soumettez votre demande par formulaire à <a href="https://hbw.wiki/service" className="text-primary hover:underline">hbw.wiki/service</a>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">Par téléphone</h3>
                <p className="text-muted-foreground text-sm">
                  905-342-2153 — on répond en anglais, mais on va parler lentement, clairement, et on va prendre le temps qu'il faut.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi choisir HBW */}
        <section className="mb-12 bg-muted/30 rounded-2xl p-8">
          <h2 className="text-2xl font-light text-foreground mb-4">Pourquoi choisir Harris Boat Works</h2>
          <div className="space-y-3 text-foreground">
            <p><strong>Les prix sont transparents.</strong> mercuryrepower.ca montre les vrais prix, en temps réel. Vous pouvez comparer avant même de nous appeler.</p>
            <p><strong>Concessionnaire Mercury Platinum.</strong> Le niveau le plus élevé du réseau Mercury en Amérique du Nord.</p>
            <p><strong>Mercury nous recommande.</strong> Quand des clients contactent Mercury Canada dans notre région, Mercury les dirige souvent vers nous.</p>
            <p><strong>Marina de lac.</strong> Le lac Rice et les Kawarthas — à moins de trois heures de Montréal.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-foreground mb-6">Foire aux questions</h2>
          <div className="space-y-6">
            {[
              { q: "Parlez-vous français?", a: "Notre équipe travaille principalement en anglais. On préfère être honnêtes là-dessus plutôt que de vous créer de fausses attentes. Mais on est sincèrement heureux de vous accueillir. Le configurateur en ligne à mercuryrepower.ca n'a pas de barrière linguistique, et le courriel nous permet de gérer les échanges écrits avec soin." },
              { q: "Puis-je obtenir un devis en ligne?", a: "Oui — c'est exactement pour ça qu'on a construit mercuryrepower.ca. Vous choisissez votre moteur, vos options, et vous voyez le prix réel en dollars canadiens, en temps réel." },
              { q: "Offrez-vous la livraison au Québec?", a: "On peut en discuter. La majorité de nos clients viennent chercher leur moteur en personne, mais si la livraison est une nécessité, appelez-nous au 905-342-2153 ou écrivez-nous via hbw.wiki/service." },
              { q: "Quelles marques de moteurs vendez-vous?", a: "On est concessionnaire exclusif Mercury Marine. Gamme complète : moteurs hors-bord de 2,5 HP à 600 HP, MerCruiser, et moteurs électriques Avator." },
              { q: "Est-ce que vos prix sont en dollars canadiens?", a: "Oui, tous nos prix sont en dollars canadiens (CAD). Pas de surprise à la conversion." },
              { q: "Comment fonctionne la garantie Mercury si j'achète chez vous et que je retourne au Québec?", a: "La garantie Mercury est honorée par n'importe quel concessionnaire agréé Mercury en Amérique du Nord. Votre concessionnaire Mercury local au Québec peut gérer votre garantie." },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground mb-2">{q}</h3>
                <p className="text-muted-foreground text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-primary/5 rounded-2xl p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-light text-foreground mb-3">Commencez ici</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Bâtissez votre soumission Mercury en ligne — prix en temps réel, en dollars canadiens, sans obligation.
          </p>
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
        </section>

        {/* Practical Info */}
        <section className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            <span>5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</span>
          </div>
          <p>Moins de trois heures de Montréal. Sur le lac Rice.</p>
        </section>

        {/* Blog link */}
        <nav className="mt-8 text-center">
          <Link to="/blog/fr/concessionnaire-mercury-platinum-ontario" className="text-primary hover:underline text-sm">
            📖 Lire notre article : Concessionnaire Mercury Platinum en Ontario →
          </Link>
        </nav>
      </main>

      <SiteFooter />
    </div>
  );
}
