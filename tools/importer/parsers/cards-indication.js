/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-indication.
 * Base block: cards (no-images / text-only variant).
 * Source: https://ultomirishcp.com/ , indication-landing pages, and /ahus
 * Generated: 2026-06-16 (extended 2026-06-17 for aHUS resource cards)
 *
 * This parser handles TWO different source structures and branches on which
 * one it finds, producing the same text-only cards block table in both cases.
 *
 * BRANCH A — awt-* Lit cards (homepage + indication-landing pages):
 *   An outer <awt-container> holding an eyebrow line in <awt-article-section>
 *   (default content handled outside this block) and an inner grid
 *   <awt-container> of card containers. Each card is an
 *   <awt-text-description-card> with:
 *     - <span slot="cardTitle">      -> heading
 *     - <div slot="cardDescription"> -> description paragraph (may contain
 *                                       <br><u>Limitation of Use:</u> ...)
 *     - <div slot="cta_buttons"> > <awt-btn href> -> CTA link
 *
 * BRANCH B — aHUS resource cards (/ahus, selector section.end-of-page-ctas):
 *   A <section class="end-of-page-ctas"> accent band wrapping a single <div>
 *   that contains TWO side-by-side text-only card <div>s. Each card:
 *     - <div> > <h2> heading (may contain <br class="large-only">)
 *     - <div> > <p> description paragraph
 *     - <a class="button ..." href> CTA link (sibling of the inner text div)
 *   No images.
 *
 * Target (both branches): cards block, one row per card; each cell =
 * heading + description paragraph + CTA link. Link hrefs preserved.
 */
export default function parse(element, { document }) {
  // Detect which source structure this element uses.
  const awtCards = Array.from(element.querySelectorAll('awt-text-description-card'));

  const cells = awtCards.length
    ? parseAwtCards(awtCards, document)
    : parseSemanticCards(element, document);

  // Empty-block guard: if nothing extracted, unwrap and bail.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-indication', cells });
  element.replaceWith(block);
}

/**
 * BRANCH A: awt-text-description-card Lit cards (homepage / indication-landing).
 */
function parseAwtCards(cards, document) {
  const cells = [];

  cards.forEach((card) => {
    const cellContent = [];

    // Heading: title slot becomes an h4 (matches source titlerank="4").
    const titleEl = card.querySelector('[slot="cardTitle"]');
    if (titleEl) {
      const heading = document.createElement('h4');
      heading.append(...titleEl.childNodes);
      cellContent.push(heading);
    }

    // Description: description slot becomes a paragraph, preserving inline
    // markup such as <br> and <u>Limitation of Use:</u>.
    const descEl = card.querySelector('[slot="cardDescription"]');
    if (descEl) {
      const desc = document.createElement('p');
      desc.append(...descEl.childNodes);
      cellContent.push(desc);
    }

    // CTA link(s): convert each awt-btn into a real anchor preserving href and label.
    const ctaButtons = Array.from(card.querySelectorAll('[slot="cta_buttons"] awt-btn, [slot="cta_buttons"] a'));
    ctaButtons.forEach((btn) => {
      const href = btn.getAttribute('href');
      const label = (btn.textContent || '').trim();
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        const target = btn.getAttribute('target');
        if (target) link.setAttribute('target', target);
        link.textContent = label || href;
        cellContent.push(link);
      }
    });

    // Only add a row if the card produced content.
    if (cellContent.length) {
      cells.push([cellContent]);
    }
  });

  return cells;
}

/**
 * BRANCH B: semantic HTML resource cards (aHUS section.end-of-page-ctas).
 * Each card is a direct child <div> of the inner wrapper containing an
 * <h2>+<p> text block and a sibling <a> CTA link.
 */
function parseSemanticCards(element, document) {
  const cells = [];

  // Card containers: prefer the inner grid wrapper's direct children, but fall
  // back to any descendant div that holds a heading + CTA link if structure varies.
  let cardEls = Array.from(element.querySelectorAll(':scope > div > div'));
  // Keep only blocks that actually contain a heading (real cards), not stray wrappers.
  cardEls = cardEls.filter((el) => el.querySelector('h1, h2, h3, h4'));

  cardEls.forEach((card) => {
    const cellContent = [];

    // Heading: keep the source heading element (h2 in source), preserving any
    // inline markup such as <br>.
    const heading = card.querySelector('h1, h2, h3, h4');
    if (heading) cellContent.push(heading);

    // Description paragraph(s).
    const paragraphs = Array.from(card.querySelectorAll('p'));
    paragraphs.forEach((p) => cellContent.push(p));

    // CTA link(s): keep real anchors, preserving href and label.
    const links = Array.from(card.querySelectorAll('a[href]'));
    links.forEach((a) => cellContent.push(a));

    if (cellContent.length) {
      cells.push([cellContent]);
    }
  });

  return cells;
}
