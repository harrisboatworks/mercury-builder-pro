
# Self-Host Social Image & Semantic HTML Landmarks

## Overview

This plan moves the social sharing image from Google Cloud Storage to a self-hosted location for long-term reliability, and adds semantic HTML landmarks to improve content parsing for AI agents and assistive technologies.

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/assets/social-share.jpg` | Create | Self-hosted social sharing image |
| `index.html` | Update | Reference local social image |
| `src/pages/Blog.tsx` | Update | Add semantic landmarks |
| `src/pages/BlogArticle.tsx` | Update | Enhance article semantics |
| `src/pages/About.tsx` | Update | Add semantic landmarks |

---

## 1. Self-Host Social Sharing Image

### Current State
The og:image and twitter:image currently reference an external URL:
```
https://storage.googleapis.com/gpt-engineer-file-uploads/zNApRsScJDMvkCR69EaDsjJ13Lt2/social-images/social-1757724220133-Harris Boat Works Standard Black Logo.jpg
```

### Solution
1. Download/create the social image as `src/assets/social-share.jpg`
2. Import it in a component or reference it via the build system
3. Update `index.html` to use the bundled asset path

### index.html Changes
```html
<!-- Before -->
<meta property="og:image" content="https://storage.googleapis.com/...">
<meta name="twitter:image" content="https://storage.googleapis.com/...">

<!-- After -->
<meta property="og:image" content="https://quote.harrisboatworks.ca/social-share.jpg">
<meta name="twitter:image" content="https://quote.harrisboatworks.ca/social-share.jpg">
```

Note: Since the image needs to be at a fixed URL for social crawlers, we'll place it in `public/` rather than `src/assets/` so it's copied directly to the build output.

---

## 2. Semantic HTML for Blog Index

### Current Structure
```jsx
<div className="min-h-screen">
  <main>
    <div>...</div>  <!-- Header -->
    <div>...</div>  <!-- Featured -->
    <div>...</div>  <!-- Grid -->
    <div>...</div>  <!-- Subscribe -->
    <div>...</div>  <!-- CTA -->
  </main>
</div>
```

### Enhanced Structure
```jsx
<div className="min-h-screen">
  <main>
    <header>...</header>           <!-- Page header -->
    <section aria-label="Featured Article">
      <article>...</article>       <!-- Featured post -->
    </section>
    <section aria-label="All Articles">
      <article>...</article>       <!-- Each blog card -->
    </section>
    <aside aria-label="Newsletter">
      ...                          <!-- Subscribe form -->
    </aside>
    <section aria-label="Call to Action">
      ...                          <!-- CTA section -->
    </section>
  </main>
</div>
```

---

## 3. Semantic HTML for Blog Article

### Current Structure
The BlogArticle.tsx already uses `<article>` and `<header>` correctly. Minor enhancements:

```jsx
<!-- Add aria-labelledby to main article -->
<article aria-labelledby="article-title">
  <header>
    <h1 id="article-title">...</h1>
  </header>
  ...
</article>

<!-- Mark FAQ as a distinct section -->
<section aria-labelledby="faq-heading">
  <h2 id="faq-heading">Frequently Asked Questions</h2>
  ...
</section>

<!-- Mark related articles as navigation -->
<nav aria-label="Related Articles">
  ...
</nav>
```

---

## 4. Semantic HTML for About Page

### Current Structure
Uses generic `<section>` tags throughout but lacks ARIA labels.

### Enhanced Structure
```jsx
<main>
  <section aria-labelledby="about-hero">
    <h1 id="about-hero">Family-Owned Since 1947</h1>
  </section>
  
  <section aria-labelledby="our-story">
    <h2 id="our-story">Our Story</h2>
    <ol><!-- Timeline as ordered list for semantics --></ol>
  </section>
  
  <section aria-labelledby="gallery">
    <h2 id="gallery">Our Location</h2>
  </section>
  
  <section aria-labelledby="services">
    <h2 id="services">What We Offer</h2>
  </section>
  
  <section aria-labelledby="reviews">
    <h2 id="reviews">What Our Customers Say</h2>
  </section>
  
  <section aria-labelledby="visit-us">
    <h2 id="visit-us">Visit Us</h2>
    <address><!-- Contact info in address element --></address>
  </section>
  
  <section aria-labelledby="faq">
    <h2 id="faq">Frequently Asked Questions</h2>
  </section>
  
  <section aria-labelledby="cta">
    <h2 id="cta">Ready to Get Started?</h2>
  </section>
</main>
```

---

## Technical Details

### Social Image Requirements
- Recommended size: 1200x630px (Facebook/LinkedIn standard)
- Format: JPEG for smaller file size
- Must include Harris Boat Works branding
- File location: `public/social-share.jpg` (copied directly to build output)

### Semantic Elements Used

| Element | Purpose |
|---------|---------|
| `<article>` | Self-contained content (blog posts) |
| `<section>` | Thematic groupings with headings |
| `<aside>` | Tangentially related content (newsletter) |
| `<nav>` | Navigation sections (related articles) |
| `<header>` | Introductory content |
| `<address>` | Contact information |
| `<ol>` | Timeline (ordered chronological events) |
| `aria-labelledby` | Associates sections with headings |
| `aria-label` | Labels sections without visible headings |

### Benefits for AI Agents
- Clear content boundaries for parsing
- Explicit relationships between sections and headings
- Better extraction of structured information
- Improved voice assistant compatibility (Speakable already configured)

---

## Implementation Order

1. Create social image in `public/social-share.jpg`
2. Update `index.html` meta tags
3. Enhance `Blog.tsx` semantics
4. Enhance `BlogArticle.tsx` semantics
5. Enhance `About.tsx` semantics

---

## Post-Implementation

- Test social sharing with Facebook Sharing Debugger
- Test with Twitter Card Validator
- Validate HTML with W3C validator
- Test with screen reader for accessibility
