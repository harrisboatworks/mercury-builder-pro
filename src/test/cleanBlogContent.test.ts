import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { frenchBlogArticles, getFrenchArticleBySlug } from '@/data/frenchBlogArticles';
import { cleanBlogContent } from '@/lib/cleanBlogContent.js';

describe('cleanBlogContent French authoring scaffolding', () => {
  it('removes an inline French FAQ only when structured FAQs own the surface', () => {
    const source = [
      '## Comparaison',
      '',
      'Texte utile.',
      '',
      '## Foire aux questions',
      '',
      '**Question ?**',
      'Réponse.',
      '',
      '## Comment nous joindre',
      '',
      'Téléphone : 905-342-2153',
    ].join('\n');

    const cleaned = cleanBlogContent(source, { hasStructuredFaqs: true });
    expect(cleaned).not.toContain('## Foire aux questions');
    expect(cleaned).not.toContain('Réponse.');
    expect(cleaned).toContain('Texte utile.');
    expect(cleaned).toContain('## Comment nous joindre');

    const preserved = cleanBlogContent(source, { hasStructuredFaqs: false });
    expect(preserved).toContain('## Foire aux questions');
    expect(preserved).toContain('Réponse.');
  });

  it('removes French internal-link scaffolding when generated links own it', () => {
    const source = [
      '## Dépannage',
      '',
      'Étapes.',
      '',
      '## Liens internes',
      '',
      '- [Hivernisation](/blog/fr/hivernisation-moteur-mercury-ontario)',
      '',
      '---',
      '',
      '<div class="hbw-language-note">',
      '  <p>Notre personnel et nos réponses sont en anglais.</p>',
      '</div>',
      '',
      '## Pour nous joindre',
      '',
      'Soumettez une demande de service.',
    ].join('\n');

    const cleaned = cleanBlogContent(source, { stripInternalLinks: true });
    expect(cleaned).not.toContain('## Liens internes');
    expect(cleaned).not.toContain('hivernisation-moteur-mercury-ontario');
    expect(cleaned).toContain('Notre personnel et nos réponses sont en anglais.');
    expect(cleaned).toContain('## Pour nous joindre');

    const preserved = cleanBlogContent(source, { stripInternalLinks: false });
    expect(preserved).toContain('## Liens internes');
  });

  it('removes only French CTA headings and keeps their copy', () => {
    for (const heading of ["## Appel à l'action", '## Appel à l’action']) {
      const source = `${heading}\n\nObtenez votre soumission sur mercuryrepower.ca.`;
      const cleaned = cleanBlogContent(source);
      expect(cleaned).not.toContain('Appel à l');
      expect(cleaned).toContain('Obtenez votre soumission');
    }
  });

  it('keeps the existing English cleaner behavior', () => {
    const source = [
      '## FAQs',
      '',
      '**Q?**',
      'A.',
      '',
      '## Internal Links',
      '',
      '- [x](/blog/x)',
      '',
      '## CTA',
      '',
      'Book now.',
    ].join('\n');

    const cleaned = cleanBlogContent(source, { hasStructuredFaqs: true });
    expect(cleaned).not.toContain('## FAQs');
    expect(cleaned).not.toContain('## Internal Links');
    expect(cleaned).not.toContain('## CTA');
    expect(cleaned).toContain('Book now.');
  });
});

describe('French FAQ migration', () => {
  it('keeps the French prerender heading aligned with the hydrated page', () => {
    const generatorSource = readFileSync('scripts/generate-markdown-twins.mjs', 'utf8');
    const prerenderSource = readFileSync('scripts/static-prerender.mjs', 'utf8');
    const pageSource = readFileSync('src/pages/blog/FrenchBlogArticlePage.tsx', 'utf8');
    expect(generatorSource).toContain("faqs: 'Questions fréquentes'");
    expect(generatorSource).toContain("twin.hasStructuredFaqs && !twinText.includes('## Questions fréquentes')");
    expect(prerenderSource).toContain("langCode === 'fr' ? 'Questions fréquentes' : 'FAQ'");
    expect(pageSource).toContain('>Questions fréquentes</h2>');
  });

  it('cleans every structured French article down to one generated FAQ owner', () => {
    for (const article of frenchBlogArticles.filter(article => article.faqs?.length)) {
      const cleaned = cleanBlogContent(article.content, { hasStructuredFaqs: true });
      expect(cleaned, article.slug).not.toMatch(/^## (?:Foire aux questions|Questions fréquentes)\s*$/m);
    }
  });

  it('preserves the overheating language notice after internal-link cleanup', () => {
    const article = getFrenchArticleBySlug('surchauffe-moteur-mercury-guide-urgence');
    const cleaned = cleanBlogContent(article?.content ?? '', {
      hasStructuredFaqs: true,
      stripInternalLinks: true,
    });
    expect(cleaned).not.toContain('## Liens internes');
    expect(cleaned).not.toContain('/blog/mercury-maintenance-intervals-20-100-300-rule');
    expect(cleaned).toContain('Une note sur la langue');
    expect(cleaned).toContain('notre personnel parle anglais');
    expect(cleaned).toContain('nous vous répondrons en anglais');
  });

  it('preserves the protected 115-vs-150 load and throttle ranges', () => {
    const article = getFrenchArticleBySlug('mercury-115-vs-150-hp-comparaison');
    expect(article?.content).toContain('60–70 %');
    expect(article?.faqs?.some(faq => faq.answer.includes('3–4 personnes'))).toBe(true);
    expect(article?.faqs?.some(faq => faq.answer.includes('65–70 %'))).toBe(true);
    const frenchQuoteFaq = article?.faqs?.find(faq => faq.question === 'Puis-je obtenir un devis en français ?');
    expect(frenchQuoteFaq?.answer).toContain('notre personnel et nos réponses sont en anglais');
    expect(frenchQuoteFaq?.answer).not.toContain('sans barrière linguistique');
  });

  it('keeps unique no-start guidance before removing the inline copy', () => {
    const article = getFrenchArticleBySlug('mercury-hors-bord-ne-demarre-pas-depannage');
    const faqText = JSON.stringify(article?.faqs);
    expect(faqText).toContain('turbine de la pompe à eau');
    expect(faqText).toContain('quelques secondes');
    expect(faqText).toContain('Le temps varie selon le moteur');
    expect(faqText).not.toContain('30 à 90 minutes');
    expect(faqText).toContain('nettoyants doux');
    expect(faqText).toContain('non-démarrage intermittent');
  });

  it('retains all nine GTA FAQ answers through the structured surface', () => {
    const article = getFrenchArticleBySlug('remotorisation-mercury-gta-toronto');
    expect(article?.faqs).toHaveLength(9);
    expect(article?.faqs?.some(faq => faq.answer.includes('5 500 $ à 7 500 $'))).toBe(true);
    expect(article?.faqs?.some(faq => faq.answer.includes('300 $ à 600 $'))).toBe(true);
    const cleaned = cleanBlogContent(article?.content ?? '', { hasStructuredFaqs: true });
    expect(cleaned).toContain('## Coordonnées');
    expect(cleaned).toContain('**Configurateur :**');
    expect(cleaned).toContain('**Demandes de service :**');
  });

  it('retains unique boating-licence guidance through the structured surface', () => {
    const article = getFrenchArticleBySlug('permis-bateau-ontario-carte-conducteur-embarcation');
    const faqText = JSON.stringify(article?.faqs);
    expect(article?.faqs).toHaveLength(8);
    expect(faqText).toContain('est valide à vie');
    expect(faqText).toContain('prestataires de cours agréés');
    expect(faqText).toContain('Guide de sécurité nautique');
    expect(article?.content).not.toContain('fonctionnent très bien en français');
  });
});
