/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-indication.
 * Base block: cards (no-images / text-only variant).
 * Source: https://ultomirishcp.com/ (and indication-landing pages)
 * Generated: 2026-06-16
 *
 * Source structure: an outer <awt-container> holding an eyebrow line
 * ("FDA APPROVED FOR 4 INDICATIONS:") in <awt-article-section> (default
 * content handled outside this block) and an inner grid <awt-container>
 * of card containers. Each card is an <awt-text-description-card> with:
 *   - <span slot="cardTitle">      -> heading
 *   - <div slot="cardDescription"> -> description paragraph (may contain
 *                                     <br><u>Limitation of Use:</u> ...)
 *   - <div slot="cta_buttons"> > <awt-btn href> -> CTA link
 *
 * Target: cards block, one row per card; each cell = heading + description + CTA link.
 */
export default function parse(element, { document }) {
  // Each indication card. Validated against source.html (awt-text-description-card).
  const cards = Array.from(element.querySelectorAll('awt-text-description-card'));

  // Empty-block guard: if no cards found, unwrap and bail.
  if (!cards.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

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

  // Empty-block guard after extraction.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-indication', cells });
  element.replaceWith(block);
}
