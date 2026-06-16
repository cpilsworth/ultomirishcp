/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero-banner
 * Base block: hero
 * Source URL: https://ultomirishcp.com/
 * Generated: 2026-06-16
 *
 * Source structure (Lit custom elements):
 *   <awt-container>
 *     <img slot="background" src="..."> banner background image
 *     <awt-article standfirst="<HTML-encoded headline>" standfirst-tag="h3"> overlaid headline
 *
 * The overlaid headline lives in the (HTML-encoded) `standfirst` attribute of
 * <awt-article>, NOT in the rendered DOM. We decode it, parse it into real DOM,
 * and wrap it in the heading tag indicated by `standfirst-tag` (default h3),
 * preserving inline markup such as the <sup> reference marker.
 *
 * Target EDS hero (hero-banner): Row 1 = background image, Row 2 = heading.
 */
export default function parse(element, { document }) {
  // --- Background image (validated: <img slot="background"> in source.html) ---
  const bgImage = element.querySelector('img[slot="background"], img[slot=background], img[class*="background"], img');

  // --- Headline from the standfirst attribute on <awt-article> ---
  const article = element.querySelector('awt-article[standfirst], awt-article');

  let heading = null;
  if (article) {
    const standfirst = article.getAttribute('standfirst');
    if (standfirst && standfirst.trim()) {
      // Decode HTML entities in the attribute value into real markup.
      const decoder = document.createElement('div');
      decoder.innerHTML = standfirst;

      // Determine heading tag from standfirst-tag (e.g. "h3"), default to h3.
      const tagAttr = (article.getAttribute('standfirst-tag') || 'h3').trim().toLowerCase();
      const headingTag = /^h[1-6]$/.test(tagAttr) ? tagAttr : 'h3';

      heading = document.createElement(headingTag);
      // Preserve inline markup (span/sup superscript reference marker, etc.).
      // Unwrap a single wrapping <span> so the heading text is not double-wrapped,
      // but keep its inner nodes (including <sup>).
      const onlyChild = decoder.children.length === 1 ? decoder.children[0] : null;
      const source = (onlyChild && onlyChild.tagName === 'SPAN') ? onlyChild : decoder;
      while (source.childNodes.length) {
        heading.appendChild(source.childNodes[0]);
      }

      // Guard against an empty heading after decoding/unwrapping.
      if (!heading.textContent || !heading.textContent.trim()) {
        heading = null;
      }
    }
  }

  // --- Empty-block guard: bail gracefully if no usable content found. ---
  if (!bgImage && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // --- Build cells matching the hero structure (bg image row, heading row). ---
  const cells = [];
  if (bgImage) cells.push([bgImage]);
  if (heading) cells.push([heading]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
