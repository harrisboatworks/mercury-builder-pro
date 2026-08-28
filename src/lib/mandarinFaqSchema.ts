import { sanitizeForSchema } from '@/lib/strip-markdown';

interface MandarinFaqItem {
  question: string;
  answer: string;
}

export const buildMandarinFaqSchema = (faqs: MandarinFaqItem[]) =>
  faqs.map(faq => ({
    "@type": "Question" as const,
    "name": sanitizeForSchema(faq.question),
    "acceptedAnswer": {
      "@type": "Answer" as const,
      "text": sanitizeForSchema(faq.answer),
    },
  }));
