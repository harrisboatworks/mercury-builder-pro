const SERVICE_TOPIC = String.raw`(?:service|repairs?|maintenance|oil[ -]change|winteri[sz](?:ation|e|ing))`;
const BOOK_SERVICE = new RegExp(String.raw`\b(?:book|schedule|arrange)\b[^.!?\n]{0,100}\b${SERVICE_TOPIC}\b`, 'i');
const SERVICE_REQUEST = new RegExp(String.raw`\b${SERVICE_TOPIC}\b[^.!?\n]{0,60}\b(?:booking|appointment|request|book|schedule|arrange)\b`, 'i');

/** Route explicit scheduling questions without claiming a confirmed appointment. */
export function buildServiceBookingAnswer(question: string): string | null {
  if (/\b(?:rentals?|repower(?:ing)?|installation)\b/i.test(question)) return null;
  // A maintenance schedule or procedure needs the exact motor's manual.
  if (/\b(?:how often|intervals?|procedures?|instructions|steps|maintenance schedule|service schedule|schedule (?:look|for|of)|oil grade|oil type|what oil|which oil|rpm)\b/i.test(question)) {
    return null;
  }
  if (/\b(?:when should|when do|should i|do i need|how many hours)\b/i.test(question)
    && /\b(?:first service|first oil change|break[ -]?in|\d+[ -]?hours?)\b/i.test(question)) {
    return null;
  }
  if (/\b(?:status|cancel|reschedule|already booked|existing appointment)\b/i.test(question)) {
    return null;
  }
  if (!BOOK_SERVICE.test(question) && !SERVICE_REQUEST.test(question)) return null;
  return 'Start a service request here: [Harris Boat Works service](https://hbwservice.ca). Tell us what work you need and include your motor model and serial number if available. A Harris team member will confirm the work and appointment; submitting a request does not confirm a booking.';
}
