
# Google Analytics, Branded 404 Page & Sitemap Regeneration

## Overview

This plan adds GA4 tracking to enable all existing gtag events, redesigns the 404 page with Harris Boat Works luxury branding, and triggers a sitemap rebuild.

---

## File Changes Summary

| File | Change |
|------|--------|
| `index.html` | Add GA4 tracking script with ID G-0JNMHD89YJ |
| `src/pages/NotFound.tsx` | Complete redesign with Harris branding |
| `public/favicon.ico` | Delete (cleanup - now using favicon.png) |

---

## 1. Add Google Analytics to `index.html`

Insert GA4 initialization script immediately after the opening `<head>` tag (line 3):

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0JNMHD89YJ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-0JNMHD89YJ');
</script>
```

This enables all existing `gtag()` event calls throughout the codebase to start capturing data.

---

## 2. Redesign 404 Page with Harris Boat Works Branding

Replace the current generic 404 page with a luxury-branded version matching the site design.

### Design Elements

- **Background**: Gradient from `muted/50` to `background` with ambient glassmorphism orbs
- **Dual logos**: Harris Boat Works + Mercury Marine with vertical divider
- **Typography**: Large "404" in Playfair Display serif, descriptive text in Inter
- **Helpful links**: Quick navigation to popular pages (Motors, Promotions, Contact)
- **Contact info**: Phone number and email for assistance
- **Trust badges**: CSI Award and Certified Repower Center

### New Component Structure

```text
┌─────────────────────────────────────────────────┐
│          [Harris Logo] │ [Mercury Logo]         │
├─────────────────────────────────────────────────┤
│                                                 │
│                      404                        │
│                                                 │
│            Page Not Found                       │
│                                                 │
│  The page you're looking for doesn't exist      │
│  or has been moved.                             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [🏠 Home] [⚙️ Motors] [📞 Contact]     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Need help? Call (905) 342-2153                 │
│                                                 │
│  [CSI Badge]  [Repower Badge]                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Implementation Details

- Import `COMPANY_INFO` for consistent contact details
- Use existing logo assets (`/assets/harris-logo-black.png`, `/assets/mercury-logo.png`)
- Add lucide icons (Home, Wrench, Phone, Mail)
- Include trust badges from `/lovable-uploads/`
- Apply hover animations consistent with site patterns
- Log 404 error to console for debugging
- Track 404 event with `gtag('event', 'page_not_found', {...})`

---

## 3. Cleanup & Sitemap Regeneration

### Delete Unused File
- Remove `public/favicon.ico` (replaced by `favicon.png`)

### Sitemap
The sitemap generator is already configured in `vite.config.ts` and will run automatically on the next production build. No code changes needed - publishing the changes will trigger the build and regenerate `sitemap.xml` with:
- All 9 static pages with today's date
- All published blog articles with their `dateModified` dates

After publishing, submit the updated sitemap URL to Google Search Console:
`https://quote.harrisboatworks.ca/sitemap.xml`

---

## Technical Details

### GA4 Event Tracking
With the initialization script in place, all existing `gtag()` calls will automatically start working:
- Page views (automatic)
- Quote builder interactions
- Financing calculator events
- Form submissions
- Product views

### 404 Page Features
- Responsive layout (mobile-first)
- Consistent with luxury marine aesthetic
- Actionable navigation options
- Direct contact methods
- Trust signals for credibility
- Analytics tracking for monitoring broken links

### Files Modified

```text
MODIFIED:
├── index.html              (+8 lines for GA4 script)
└── src/pages/NotFound.tsx  (complete redesign)

DELETED:
└── public/favicon.ico      (cleanup)

AUTO-UPDATED ON BUILD:
└── public/sitemap.xml      (regenerated with current dates)
```
