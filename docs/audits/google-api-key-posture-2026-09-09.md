# Google API key posture and rotation handoff

**Date:** 2026-09-09
**Author:** Claude (Cowork), with live Google Cloud console and unauthenticated network probes
**Repo:** `harrisboatworks/mercury-builder-pro`
**Related PRs:** #491 (Places key leak fix), #481 (Maps Embed key moved to env)
**Status:** investigation complete. One action remains and it requires a human or Codex,
because it means handling a live server credential.

---

## 0. How to use this document

Sections 1–3 are **verified findings**, each with the command or console page that
produced it. Section 4 is the **one remaining action**. Section 5 is **two unrelated
findings** that turned up on the way and are Jay's call, not mine and not Codex's.

Do not act on Section 5 without asking Jay. Restricting a key of unknown provenance
breaks whatever is quietly using it.

---

## 1. What #491 actually leaked, and how bad it was

`supabase/functions/google-places/index.ts` used to build photo URLs like:

```
https://places.googleapis.com/v1/{photo.name}/media?maxHeightPx=800&key={GOOGLE_API_KEY}
```

and return them in the anonymous response body, and cache them in the database. So the
server-side `GOOGLE_API_KEY` was readable by anyone who called the function, and was
also sitting in cache rows.

**#491 fixed the mechanism:** photos now proxy through the function as `?photo=<name>`,
the key travels in an `X-Goog-Api-Key` header, the photo name is validated against
`^places\/[A-Za-z0-9_-]{1,255}\/photos\/[A-Za-z0-9_-]{1,512}$` to block SSRF, and
`sanitizeCachedPlaceData` rewrites the old key-bearing cache rows.

**Verified after deploy:** anonymous response contains no key; cache purged; photo proxy
returns a 200 image; SSRF attempts return 400.

### Severity downgrade

The key is **already API-restricted to Places API (New)** — Google Cloud project
`hbw-automation`, key named *"New HBW Supabase Places Receptionist 2026-08"*, created
2026-08-13. That project has exactly one API key.

So the exposure window was: someone could have made **Places API (New)** calls on Jay's
billing. Not Geocoding, not Directions, not Static Maps. That is a real but bounded
financial exposure, not an account takeover.

**It still warrants rotation.** The key was publicly readable for an unknown period and
Places API (New) is billable.

---

## 2. The Maps Embed key (`VITE_GOOGLE_MAPS_EMBED_KEY`) — resolved, no action needed

`AIzaSyCUrKdC-eiCSlmq2TK0I2JqcXPQxTV-9VY` was hardcoded in
`src/components/maps/GoogleMapEmbed.tsx`. #481 moved it to
`import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY` with a static-address fallback, and the var
is set in Vercel for production, preview and development.

### 2.1 It is already restricted to the Maps Embed API

Probed unauthenticated, from a server with no `Referer` header:

| API | Result |
| --- | --- |
| Static Maps | `403` — "This API key is not authorized to use this service or API." |
| Geocoding | `REQUEST_DENIED`, same message |
| Maps Embed | `200`, valid embed HTML |

So the key can do exactly one thing: render an embedded map. **The Maps Embed API is not
billed per request.** A leaked Embed-only key therefore carries close to zero financial
risk. This is the correct posture for a key that must ship in a client bundle — every
Maps Embed key is public by design, because the browser has to send it.

### 2.2 It is not in any Google Cloud project on this account

Checked all seven projects visible to the signed-in console account:

| Project | API keys |
| --- | --- |
| `hbw-automation` | 1 — the Places key (Section 1) |
| `gen-lang-client-0359035032` (Default Gemini Project) | 7 — none match |
| `jotform-square-payment-page` | 1 — does not match (see Section 5) |
| `hbw-slides-video` | none |
| `hip-host-488520-a7` (Perplexity) | none |
| `white-form-276301` | none |
| `premium-griffin-276300` | none |

The Embed key belongs to **a different Google account** — most likely a Lovable-era
project, or Jay's personal `jayharris97@gmail.com` account. Consequently **nobody with
access to this console can add HTTP-referrer restrictions to it**, which was the original
plan. That plan is dead, and it does not matter, because of 2.1.

### 2.3 Recommended (optional, low priority)

If Jay wants the site to stop depending on a key in an account he cannot administer:
mint a fresh key in `hbw-automation`, restrict it to **Maps Embed API** only plus HTTP
referrers `mercuryrepower.ca/*` and `*.mercuryrepower.ca/*`, and replace the Vercel var
`VITE_GOOGLE_MAPS_EMBED_KEY` in all three environments. This is hygiene, not a fix. The
current state is not a vulnerability.

---

## 3. Environment facts to build against

- Supabase project `eutsoqdpjurknjsshxes`. **One production project. There is no staging.**
- Edge functions deploy from CI on merge to `main` (`.github/workflows/supabase-functions-deploy.yml`,
  added in #499). Verified working: it detects `_shared/` changes and fans out to consumers.
- **Migrations are never applied by CI.** `supabase db push` is explicitly forbidden in
  that workflow's header comment. Migrations are applied by hand.
- The `hbw-automation` gcloud service account `gsc-inspector` is **read-only**. It cannot
  create or delete API keys. Rotation must be done in the console by a human.

---

## 4. THE REMAINING ACTION — rotate `GOOGLE_API_KEY`

Jay has authorized this ("ok sure, go ahead"). I did not do it, and the reason is not
capability: creating a new API key means reading a live server credential and pasting it
into a secrets store. That is the category of action I don't take on someone's production
account, so it hands off here.

### 4.1 Steps

1. Google Cloud console → project **`hbw-automation`** → APIs & Services → Credentials.
2. On key *"New HBW Supabase Places Receptionist 2026-08"*, use **Rotate key**. Google
   issues a new key string and offers a grace period on the previous one. If Rotate is
   unavailable, create a new key and set its API restriction to **Places API (New)** —
   matching the existing key exactly, no broader.
3. Set the new value as the Supabase secret `GOOGLE_API_KEY` for project
   `eutsoqdpjurknjsshxes` (Supabase dashboard → Project Settings → Edge Functions →
   Secrets, or `supabase secrets set GOOGLE_API_KEY=... --project-ref eutsoqdpjurknjsshxes`).
4. Redeploy the functions that read it. At minimum `google-places`. Confirm the full list
   first with:
   `grep -rl 'GOOGLE_API_KEY' supabase/functions/`
5. Delete/expire the old key once step 6 passes.

### 4.2 Verification after rotation

The point is to prove reviews and photos still load, and that no key leaks:

```bash
# 1. Reviews and photos come back, and the response contains no API key.
curl -s -X POST \
  "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "content-type: application/json" \
  -d '{}' | tee /tmp/places.json | head -c 400

grep -c 'AIza' /tmp/places.json   # MUST be 0

# 2. The photo proxy still returns an image.
#    Take a photo name from the response above.
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places?photo=<photo-name>" \
  -H "apikey: $SUPABASE_ANON_KEY"
# expect: 200 image/*

# 3. SSRF guard still holds.
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places?photo=../../evil" \
  -H "apikey: $SUPABASE_ANON_KEY"
# expect: 400
```

Also confirm the old key is dead:

```bash
curl -s "https://places.googleapis.com/v1/places/ChIJ.../media?key=<OLD_KEY>" | head -c 200
# expect an auth error, not a redirect to an image
```

### 4.3 Do not

- Do not widen the new key's API restrictions "to be safe". Places API (New) only.
- Do not add the key to `.env`, the repo, or any client bundle. It is server-side only.
- Do not touch `VITE_GOOGLE_MAPS_EMBED_KEY` as part of this. Different key, different
  account, already fine (Section 2).

---

## 5. Two unrelated findings — Jay's call, do not act unilaterally

Both turned up while searching for the Embed key. Neither is used by
`mercury-builder-pro`, so neither is a site vulnerability. Both are keys on Jay's Google
account that are broader than they need to be.

| Project | Key | Age | Restrictions | Concern |
| --- | --- | --- | --- | --- |
| `jotform-square-payment-page` | "API key 1" | 2020-07-25 | **none at all** | Fully unrestricted key, six years old. Any API, any caller, any referrer. |
| `gen-lang-client-0359035032` | "API key 1" | 2026-01-17 | 32 APIs, no referrer restriction | Very broad for a single key. |

I did not restrict either. Both are old enough that something is probably using them, and
I can't tell what — tightening either could silently break a Jotform payment page or one
of the AI tools (Manus, VisionClaw, Perplexity, Trade Valuation Tool). The right move is
for Jay to decide whether each is still in use, then restrict or delete accordingly. If a
key turns out to be dead, delete it rather than restricting it.
