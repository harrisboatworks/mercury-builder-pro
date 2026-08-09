import { describe, expect, it } from 'vitest';
import { frenchBlogArticles, getFrenchArticleBySlug } from '@/data/frenchBlogArticles';
import { cleanBlogContent } from '@/lib/cleanBlogContent.js';

describe('cleanBlogContent French authoring scaffolding', () => {
  it('removes an inline French FAQ section only when structured FAQs exist', () => {
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

  it('removes French internal-link scaffolding when the related-guide renderer owns it', () => {
    const source = [
      '## Dépannage',
      '',
      'Étapes.',
      '',
      '## Liens internes',
      '',
      '- [Hivernisation](/blog/fr/hivernisation-moteur-mercury-ontario)',
      '',
      '## Pour nous joindre',
      '',
      'Réservez un diagnostic.',
    ].join('\n');

    const cleaned = cleanBlogContent(source, { stripInternalLinks: true });
    expect(cleaned).not.toContain('## Liens internes');
    expect(cleaned).not.toContain('hivernisation-moteur-mercury-ontario');
    expect(cleaned).toContain('## Pour nous joindre');

    const preserved = cleanBlogContent(source, { stripInternalLinks: false });
    expect(preserved).toContain('## Liens internes');
  });

  it('removes only the French CTA heading and keeps the CTA copy', () => {
    for (const heading of ["## Appel à l'action", '## Appel à l’action']) {
      const source = `${heading}\n\nObtenez votre soumission sur mercuryrepower.ca.\n\nTéléphone : 905-342-2153`;
      const cleaned = cleanBlogContent(source);
      expect(cleaned).not.toContain('Appel à l');
      expect(cleaned).toContain('Obtenez votre soumission');
      expect(cleaned).toContain('905-342-2153');
    }
  });

  it('keeps English cleaner behavior unchanged', () => {
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
  const inlineFaqArticles = frenchBlogArticles.filter(article =>
    /^## Foire aux questions\s*$/m.test(article.content),
  );

  it('backs every former inline FAQ block with structured FAQs before cleaning', () => {
    expect(inlineFaqArticles.map(article => article.slug).sort()).toEqual([
      'mercury-115-vs-150-hp-comparaison',
      'mercury-hors-bord-ne-demarre-pas-depannage',
      'prix-remotorisation-mercury-ontario',
      'remotorisation-mercury-gta-toronto',
    ]);

    for (const article of inlineFaqArticles) {
      expect(article.faqs?.length).toBeGreaterThan(0);
      const cleaned = cleanBlogContent(article.content, { hasStructuredFaqs: true });
      expect(cleaned).not.toMatch(/^## Foire aux questions\s*$/m);
    }
  });

  it('preserves the protected 115-vs-150 load and throttle ranges', () => {
    const article = getFrenchArticleBySlug('mercury-115-vs-150-hp-comparaison');
    expect(article?.content).toContain('60–70 %');
    expect(article?.faqs?.some(faq => faq.answer.includes('3–4 personnes'))).toBe(true);
  });

  it('migrates the useful unique FAQ answers before the inline copy is stripped', () => {
    const expectedQuestions: Record<string, string[]> = {
      'prix-remotorisation-mercury-ontario': [
        'Comment savoir si ma coque est en bon état ?',
        'Est-ce que vous installez des moteurs d\'autres marques ?',
      ],
      'mercury-115-vs-150-hp-comparaison': [
        'Le 115 HP suffit-il pour un ponton de 20 pieds ?',
        'Quelle est la différence entre le FourStroke standard et le Pro XS ?',
      ],
      'mercury-hors-bord-ne-demarre-pas-depannage': [
        'Combien de temps prend le diagnostic d\'un Mercury qui ne démarre pas ?',
        'Devrais-je utiliser un additif pour nettoyer les injecteurs ?',
      ],
    };

    for (const [slug, questions] of Object.entries(expectedQuestions)) {
      const article = getFrenchArticleBySlug(slug);
      const structuredQuestions = new Set(article?.faqs?.map(faq => faq.question));
      for (const question of questions) expect(structuredQuestions.has(question)).toBe(true);
    }
  });

  it('deduplicates the repower-value FAQ and keeps the fuller cost guidance', () => {
    const article = getFrenchArticleBySlug('prix-remotorisation-mercury-ontario');
    const valueFaqs = article?.faqs?.filter(faq =>
      /moins cher qu'un bateau neuf|vaut vraiment la peine de remplacer/i.test(faq.question),
    );
    expect(valueFaqs).toHaveLength(1);
    expect(valueFaqs?.[0].answer).toContain('20 à 40 %');
  });

  it('keeps the unique dry-running safety detail in structured no-start guidance', () => {
    const article = getFrenchArticleBySlug('mercury-hors-bord-ne-demarre-pas-depannage');
    const repeatedCrankingFaq = article?.faqs?.find(faq =>
      faq.question.startsWith('Est-ce mauvais de lancer le démarreur'),
    );
    expect(repeatedCrankingFaq?.answer).toContain('turbine de la pompe à eau');
    expect(repeatedCrankingFaq?.answer).toContain('quelques secondes');
    expect(article?.faqs?.some(faq => faq.question.includes("démarre puis s'éteint immédiatement"))).toBe(true);
  });

  it('retains all nine GTA FAQ answers and preserves contact paths through generated chrome', () => {
    const article = getFrenchArticleBySlug('remotorisation-mercury-gta-toronto');
    expect(article?.faqs).toHaveLength(9);
    expect(article?.faqs?.some(faq => faq.answer.includes('5 500 $ à 7 500 $'))).toBe(true);
    expect(article?.faqs?.some(faq => faq.answer.includes('300 $ à 600 $'))).toBe(true);
  });
});
