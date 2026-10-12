/**
 * Visible citation identity for public blog guides.
 *
 * Use the source-declared author; never infer authorship from a default UI byline.
 * Article pages, structured data, indexes and Markdown share this policy.
 * Publisher stays Harris Boat Works. This does not rewrite article prose.
 */

export const BLOG_PUBLISHER_NAME = "Harris Boat Works";
export const DECLARED_PERSON_AUTHOR = "Jay Harris";

export function visibleBlogAuthorName(author, options = {}) {
  const declared = String(author || "").trim();
  if (/^jay harris$/i.test(declared)) return DECLARED_PERSON_AUTHOR;
  return declared || BLOG_PUBLISHER_NAME;
}

export function blogPostingAuthor(author, siteUrl, options = {}) {
  const name = visibleBlogAuthorName(author, options);
  if (name === DECLARED_PERSON_AUTHOR) {
    return {
      "@type": "Person",
      name,
      jobTitle: "Owner, Harris Boat Works",
      url: `${siteUrl}/about/jay-harris`,
      worksFor: {
        "@type": "Organization",
        name: BLOG_PUBLISHER_NAME,
        url: "https://harrisboatworks.ca",
      },
    };
  }
  return {
    "@type": "Organization",
    name,
    "@id": `${siteUrl}/#organization`,
  };
}

export function blogPostingPublisher(siteUrl) {
  return {
    "@type": "Organization",
    name: BLOG_PUBLISHER_NAME,
    "@id": `${siteUrl}/#organization`,
  };
}
