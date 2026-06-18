/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero-banner
 * Base block: hero
 * Source URLs:
 *   - https://ultomirishcp.com/      (homepage — awt-* Lit hero)
 *   - https://ultomirishcp.com/ahus  (aHUS — standard semantic HTML hero)
 * Generated: 2026-06-16
 * Extended: 2026-06-17 (added aHUS semantic-HTML branch)
 *
 * Two source structures are handled:
 *
 * 1. Homepage (Lit custom elements):
 *      <awt-container>
 *        <img slot="background" src="..."> banner background image
 *        <awt-article standfirst="<HTML-encoded headline>" standfirst-tag="h3"> overlaid headline
 *    The overlaid headline lives in the (HTML-encoded) `standfirst` attribute of
 *    <awt-article>, NOT in the rendered DOM. We decode it, parse it into real DOM,
 *    and wrap it in the heading tag indicated by `standfirst-tag` (default h3).
 *
 * 2. aHUS page (standard semantic HTML):
 *      <section class="hero">
 *        <img src="..."> background/hero image
 *        <div><div>
 *          <h1>Widen their world</h1>
 *          <p class="subhead">...<sup>1,a</sup></p>
 *          <img class="mobile-hero"> (mobile-only — excluded)
 *          <p class="mobile-only">Actor portrayal</p> (mobile-only caption — excluded)
 *          <p>...descriptive body...<sup>1,b</sup></p>
 *          <p class="button-container"><a class="button">CTA</a></p>
 *          <div class="footnotes"><p class="footnote">a...</p><p class="footnote">b...</p></div>
 *        </div></div>
 *        <div><div class="disclaimer desktop-only"><p>Actor portrayal</p></div></div>
 *      </section>
 *
 * Target EDS hero (hero-banner): Row 1 = background image, Row 2 = heading + supporting text + CTA.
 */
export default function parse(element, { document }) {
  // --- Detect which source structure is present and branch accordingly. ---
  const isSemanticHero = !!(
    element.querySelector(':scope h1')
    || (element.matches && element.matches('section.hero'))
  );
  const hasAwtArticle = !!element.querySelector('awt-article, [standfirst]');

  if (hasAwtArticle && !isSemanticHero) {
    parseAwtHero(element, document);
  } else if (isSemanticHero) {
    parseSemanticHero(element, document);
  } else {
    // Unknown structure — fall back to the awt parser (original behaviour).
    parseAwtHero(element, document);
  }
}

/**
 * Homepage awt-* Lit hero: background image + headline decoded from the
 * `standfirst` attribute of <awt-article>.
 */
function parseAwtHero(element, document) {
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

/**
 * aHUS semantic-HTML hero: full-bleed <section class="hero"> with a background
 * image, an <h1> headline, subhead, descriptive body, CTA link, footnotes, and
 * an "Actor portrayal" caption.
 */
function parseSemanticHero(element, document) {
  // --- Background/hero image: the first non-mobile <img> in the section. ---
  // Exclude the mobile-only duplicate image (img.mobile-hero).
  const allImages = Array.from(element.querySelectorAll('img'));
  const bgImage = allImages.find((img) => !img.classList.contains('mobile-hero'))
    || allImages[0]
    || null;

  // --- Headline (validated: <h1>Widen their world</h1>). ---
  const heading = element.querySelector('h1, h2');

  // --- Subhead (validated: <p class="subhead">). ---
  const subhead = element.querySelector('p.subhead, p[class*="subhead"]');

  // --- Descriptive body paragraph: a plain <p> that is not the subhead,
  //     not a footnote, not the button container, and not a mobile-only caption. ---
  const bodyParagraph = Array.from(element.querySelectorAll('p')).find((p) => (
    !p.classList.contains('subhead')
    && !p.classList.contains('footnote')
    && !p.classList.contains('button-container')
    && !p.classList.contains('mobile-only')
    && !p.closest('.footnotes')
    && !p.closest('.disclaimer')
    && p.textContent.trim()
  ));

  // --- CTA link (validated: <a class="button"> inside p.button-container). ---
  const ctaLink = element.querySelector('p.button-container a, a.button, a[class*="button"]');

  // --- Footnotes group (validated: div.footnotes > p.footnote). ---
  const footnotes = Array.from(element.querySelectorAll('.footnotes p.footnote, p.footnote'));

  // --- "Actor portrayal" caption (desktop disclaimer, validated: div.disclaimer > p). ---
  const actorCaption = element.querySelector('.disclaimer p');

  // --- Empty-block guard: bail gracefully if no usable content found. ---
  if (!bgImage && !heading && !subhead && !bodyParagraph) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 1: background/hero image.
  if (bgImage) cells.push([bgImage]);

  // Row 2: heading + supporting text + CTA (+ footnotes/caption as small print).
  // Wrap all row-2 content in a single container so it renders as ONE cell
  // (stacked vertically) rather than one column per element.
  const contentCell = document.createElement('div');
  if (heading) contentCell.appendChild(heading);
  if (subhead) contentCell.appendChild(subhead);
  if (bodyParagraph) contentCell.appendChild(bodyParagraph);
  if (ctaLink) {
    // Preserve the CTA's wrapping paragraph if present (button-container), else the link itself.
    contentCell.appendChild(ctaLink.closest('p.button-container') || ctaLink);
  }

  // Footnotes and "Actor portrayal" caption as small print at the end of the cell.
  footnotes.forEach((fn) => contentCell.appendChild(fn));
  if (actorCaption) {
    const caption = document.createElement('p');
    caption.textContent = actorCaption.textContent.trim();
    contentCell.appendChild(caption);
  }

  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
