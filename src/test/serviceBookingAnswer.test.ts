import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildServiceBookingAnswer } from '../../supabase/functions/_shared/service-booking-answer';

describe('service booking answers', () => {
  it.each([
    'Where do I book winterization service with Harris Boat Works? Please include the booking website.',
    'Can I schedule an oil change for my Mercury?',
    'How do I arrange a repair appointment?',
    'Please send me the service booking link.',
    'Where can I start a service request online?',
    'How do I book winterisation?',
  ])('returns the canonical request link for %s', (question) => {
    const answer = buildServiceBookingAnswer(question);
    expect(answer).toContain('https://hbwservice.ca');
    expect(answer).toContain('does not confirm a booking');
    expect(answer).not.toContain('harrisboatworks.ca/winterization');
  });

  it.each([
    'What is the Mercury maintenance schedule?',
    'How often should I schedule maintenance?',
    'What are the winterization steps?',
    'How do I winterize a Mercury outboard?',
    'Where can I book a boat rental?',
    'Can I reserve this outboard motor?',
    'Can I schedule a repower installation?',
    'What are your service department hours?',
    'What is the status of my service request?',
    'What is my service request status?',
    'Can you check my service request status?',
    'I already booked a service appointment.',
    'How can I reschedule a service appointment?',
    'Book a rental. What are Mercury service intervals?',
    'Can I book a rental boat while mine is in for service?',
    'Should I book a service visit to discuss repower options?',
    'What does the schedule look like for a 100-hour service?',
    'What does the schedule look like for Mercury service?',
    'When should I book first service at 20 hours or 100 hours?',
    'Do I need to book an oil change, and what oil grade does my F150 take?',
  ])('keeps the existing answer path for %s', (question) => {
    expect(buildServiceBookingAnswer(question)).toBeNull();
  });

  it.each(['ai-chatbot', 'ai-chatbot-stream'])('routes %s before the technical guard', (slug) => {
    const source = readFileSync(`supabase/functions/${slug}/index.ts`, 'utf8');
    expect(source).toContain('buildServiceBookingAnswer(message)');
    const technicalCall = source.indexOf('const verifiedTechnicalReply = buildVerifiedMercuryTechnicalAnswer(');
    expect(technicalCall).toBeGreaterThan(-1);
    expect(source.indexOf('buildServiceBookingAnswer(message)')).toBeLessThan(technicalCall);
  });
});
