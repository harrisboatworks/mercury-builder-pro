// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { MandarinFaqAnswer } from '@/components/blog/MandarinFaqAnswer';
import { getMandarinArticleBySlug } from '@/data/mandarinBlogArticles';
import { buildMandarinFaqSchema } from '@/lib/mandarinFaqSchema';

afterEach(cleanup);

const winterStorageArticle = getMandarinArticleBySlug(
  'gta-chinese-rice-lake-winter-storage-complete-guide',
);
const rateCardFaq = winterStorageArticle?.faqs?.find(
  faq => faq.question === '冬储价格是多少？',
);

describe('MandarinBlogArticlePage FAQ handling', () => {
  it('renders the winter-storage rate card as a safe external link', () => {
    expect(rateCardFaq).toBeDefined();

    const { container } = render(
      <MemoryRouter>
        <MandarinFaqAnswer answer={rateCardFaq!.answer} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'HBW 当前 2026–27 冬储价格表' }),
    ).toHaveAttribute('href', 'https://www.harrisboatworks.ca/winter-storage');
    expect(
      screen.getByRole('link', { name: 'HBW 当前 2026–27 冬储价格表' }),
    ).toHaveAttribute('target', '_blank');
    expect(
      screen.getByRole('link', { name: 'HBW 当前 2026–27 冬储价格表' }),
    ).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container).not.toHaveTextContent(
      '[HBW 当前 2026–27 冬储价格表](https://www.harrisboatworks.ca/winter-storage)',
    );
  });

  it('strips Markdown syntax from the FAQPage accepted answer', () => {
    expect(rateCardFaq).toBeDefined();

    const [schemaQuestion] = buildMandarinFaqSchema([rateCardFaq!]);

    expect(schemaQuestion.acceptedAnswer.text).toBe(
      '请查看 HBW 当前 2026 - 27 冬储价格表。船只专属书面报价取决于船长、船型、发动机、拖车、船上系统，以及批准的冬化、收缩膜、存储和维修范围。',
    );
    expect(schemaQuestion.acceptedAnswer.text).not.toMatch(/\[[^\]]+\]\([^)]+\)/);
  });

  it('does not make unsafe Markdown URLs clickable', () => {
    render(
      <MemoryRouter>
        <MandarinFaqAnswer answer="[不安全链接](javascript:alert('xss'))" />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: '不安全链接' })).toBeNull();
    expect(screen.getByText('不安全链接')).toBeInTheDocument();
  });
});
