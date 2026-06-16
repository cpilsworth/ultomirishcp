/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-support
 * Base block: cards (with images)
 * Source URL: https://ultomirishcp.com/
 * Source selector: #content > awt-container:nth-of-type(6)
 * Generated: 2026-06-16
 *
 * Source structure (Lit custom elements):
 *   <awt-container> (block element)
 *     <awt-container columns-size="50,50,0,0">   (2-up grid)
 *       <awt-container>                          (one per card)
 *         <awt-image src="...icon.svg">          icon
 *         <awt-article standfirst="<encoded heading>" standfirst-tag="h3">
 *           <awt-article-section><div slot="paragraph">description</div></awt-article-section>
 *           <awt-btn href="...">CTA label</awt-btn>
 *         </awt-article>
 *   Target (cards with images): one row per card,
 *   cell = [icon image, heading, description, CTA link]
 */
export default function parse(element, { document }) {
  const ABSOLUTE_BASE = 'https://ultomirishcp.com';

  const toAbsolute = (url) => {
    if (!url) return url;
    try {
      return new URL(url, ABSOLUTE_BASE).href;
    } catch (e) {
      return url;
    }
  };

  // The card columns live inside the inner grid container. Fall back to scanning
  // direct child containers if the grid wrapper is not present.
  const grid = element.querySelector(':scope > awt-container')
    || element;
  let cards = Array.from(grid.querySelectorAll(':scope > awt-container'));
  // Fallback: some pages may nest cards directly under the block element.
  if (cards.length === 0) {
    cards = Array.from(element.querySelectorAll(':scope > awt-container > awt-container'));
  }
  if (cards.length === 0) {
    cards = Array.from(element.querySelectorAll('awt-container > awt-image, awt-image'))
      .map((img) => img.closest('awt-container'))
      .filter((c, i, arr) => c && arr.indexOf(c) === i);
  }

  const cells = [];

  cards.forEach((card) => {
    const cardContent = [];

    // 1. Icon image
    const awtImage = card.querySelector('awt-image, img');
    if (awtImage) {
      const src = awtImage.getAttribute('src') || awtImage.getAttribute('altimage');
      if (src) {
        const img = document.createElement('img');
        img.src = toAbsolute(src);
        const alt = awtImage.getAttribute('alt') || awtImage.getAttribute('altimage') || '';
        if (alt) img.alt = alt;
        cardContent.push(img);
      }
    }

    // 2. Heading - decode the HTML-encoded standfirst attribute
    const article = card.querySelector('awt-article');
    if (article) {
      const standfirst = article.getAttribute('standfirst');
      if (standfirst) {
        const tag = (article.getAttribute('standfirst-tag') || 'h3').toLowerCase();
        const heading = document.createElement(/^h[1-6]$/.test(tag) ? tag : 'h3');
        // standfirst is HTML-encoded markup; decode it into the heading.
        heading.innerHTML = standfirst;
        // Use the plain text so EDS heading carries no inline styling artifacts.
        const text = heading.textContent.trim();
        heading.textContent = text;
        if (text) cardContent.push(heading);
      }
    }

    // 3. Description paragraph. The source may include a <sup>™</sup> superscript
    // which the markdown converter splits onto separate lines. Inline the
    // superscript text directly so the description reads as continuous prose.
    const paragraphSlot = card.querySelector('[slot="paragraph"]');
    if (paragraphSlot) {
      const text = paragraphSlot.textContent.replace(/\s+/g, ' ').trim();
      if (text) {
        const p = document.createElement('p');
        p.textContent = text;
        cardContent.push(p);
      }
    }

    // 4. CTA link(s)
    const ctas = Array.from(card.querySelectorAll('awt-btn, a'));
    ctas.forEach((cta) => {
      const href = cta.getAttribute('href');
      const label = cta.textContent.trim();
      if (href && label) {
        const a = document.createElement('a');
        a.href = toAbsolute(href);
        a.textContent = label;
        const target = cta.getAttribute('target');
        if (target) a.setAttribute('target', target);
        cardContent.push(a);
      }
    });

    if (cardContent.length > 0) {
      cells.push([cardContent]);
    }
  });

  // Empty-block guard: if no card content was extracted, unwrap and bail.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-support', cells });
  element.replaceWith(block);
}
