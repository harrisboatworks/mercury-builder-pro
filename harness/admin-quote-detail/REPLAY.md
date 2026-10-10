# Offline AdminQuoteDetail browser harness

Test-only page. It mounts the real `AdminQuoteDetail` component with synthetic rows. The Supabase module is replaced before the page loads. Clipboard, anchor downloads, and email invokes stay in the page. Fetch, XHR, WebSocket, EventSource, and sendBeacon to any other origin are blocked.

## Command

From the repository root, on this branch:

```bash
npx vite --config harness/admin-quote-detail/vite.config.ts --host 127.0.0.1 --port 4177
```

Open:

- http://127.0.0.1:4177/ to inspect each screen, then press **Replay both screens**
- http://127.0.0.1:4177/?autorun=1 to run both screens on load

The console API is `window.__HBW_QUOTE_HARNESS__.show('submitted' | 'deposit')` and `window.__HBW_QUOTE_HARNESS__.runReplay()`.

## Screens

Submitted quote `11111111-1111-4111-8111-111111111111`:

- Heading `Submitted quote HBW-150193`
- Hint `Copy Link creates a private link to the original PDF, valid for 30 days.`
- Buttons `Download PDF`, `Copy Link`, and `Email Quote`
- No `Edit Full Quote`, no `Canonical reservation PDF`, no `/quote/saved/` link

Paid deposit `22222222-2222-4222-8222-222222222222`:

- Heading `Canonical reservation PDF` and text `Status: bound`
- Share line starts `https://www.mercuryrepower.ca/quote/saved/22222222`
- Text `tracked three-audience confirmation`
- No submitted receipt and no `Email Quote` button

## Recorded actions

Submitted, in order: Copy Link, Download PDF, Email Quote.

- clipboard: `https://documents.example.test/consultation/synthetic-share`
- invoke `admin-consultation-document` `{ action: 'admin-share', quoteId: '11111111-1111-4111-8111-111111111111' }`
- invoke `admin-consultation-document` `{ action: 'admin-download', quoteId: '11111111-1111-4111-8111-111111111111' }`
- download click href `https://documents.example.test/consultation/synthetic-download`
- invoke `admin-consultation-document` `{ action: 'admin-email', quoteId: '11111111-1111-4111-8111-111111111111', emailIntent: 'send' }`
- no `send-quote-email` and no `quote-document-api`

Paid deposit, in order: Copy Link, Download canonical reservation PDF.

- clipboard: `https://www.mercuryrepower.ca/quote/saved/22222222-2222-4222-8222-222222222222`
- no `admin-consultation-document`
- invoke `quote-document-api` `{ action: 'download', savedQuoteId: '22222222-2222-4222-8222-222222222222' }`
- local fetch of `https://documents.example.test/reservation/synthetic.pdf` answered with a blob in the page
- download filename `HBW-reservation-22222222.pdf`

Pass condition: the sticky panel `data-harness-status` is `pass`, every result row is `data-pass="yes"`, and the log contains no `blocked` events.
