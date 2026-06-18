/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-support
 * Base block: cards (with images)
 * Generated: 2026-06-16  (extended 2026-06-17 for aHUS semantic-HTML support cards)
 *
 * Handles TWO source structures, auto-detected per element:
 *
 * A) Homepage (Lit custom elements) — selector #content > awt-container:nth-of-type(6)
 *   <awt-container> (block element)
 *     <awt-container columns-size="50,50,0,0">   (2-up grid)
 *       <awt-container>                          (one per card)
 *         <awt-image src="...icon.svg">          icon
 *         <awt-article standfirst="<encoded heading>" standfirst-tag="h3">
 *           <awt-article-section><div slot="paragraph">description</div></awt-article-section>
 *           <awt-btn href="...">CTA label</awt-btn>
 *
 * B) aHUS (semantic HTML) — selector main#main > section.alexion-resources
 *   <section class="alexion-resources">
 *     <div>
 *       <div class="cta cta--onesource">         (one per card)
 *         <div class="img"><a href><img src alt></a></div>   linked logo
 *         <h2>heading</h2>
 *         <p>description</p>
 *         <hr>                                   decorative divider (dropped)
 *         <p class="button-container"><a class="button" href>CTA</a></p>
 *
 *   Target (cards with images): one row per card,
 *   cell = [logo/icon image, heading, description, CTA link]
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

  // ---------------------------------------------------------------------------
  // Branch detection: aHUS support cards use standard semantic HTML and have no
  // awt-article descendants. The homepage variant uses awt-* custom elements.
  // ---------------------------------------------------------------------------
  const isSemantic = element.matches('section.alexion-resources')
    || (!element.querySelector('awt-article')
      && element.querySelector('.cta, h2'));

  if (isSemantic) {
    const cells = [];
    // Each support card is a `.cta` block; fall back to direct grandchildren divs.
    let cards = Array.from(element.querySelectorAll(':scope > div > .cta, :scope .cta'));
    if (cards.length === 0) {
      cards = Array.from(element.querySelectorAll(':scope > div > div'));
    }
    // De-duplicate in case nested selectors overlap.
    cards = cards.filter((c, i, arr) => arr.indexOf(c) === i);

    cards.forEach((card) => {
      const cardContent = [];

      // 1. Logo image (linked). Keep the original <img>; drop the wrapping anchor
      // so the cell carries the image plus a dedicated CTA link below.
      const img = card.querySelector('.img img, img');
      if (img) {
        const newImg = document.createElement('img');
        newImg.src = toAbsolute(img.getAttribute('src'));
        const alt = img.getAttribute('alt') || '';
        if (alt) newImg.alt = alt;
        cardContent.push(newImg);
      }

      // 2. Heading
      const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && heading.textContent.trim()) {
        cardContent.push(heading);
      }

      // 3. Description paragraph(s) — exclude the CTA button-container paragraph.
      const paras = Array.from(card.querySelectorAll(':scope > p'))
        .filter((p) => !p.classList.contains('button-container') && !p.querySelector('a.button'));
      paras.forEach((p) => {
        const text = p.textContent.replace(/\s+/g, ' ').trim();
        if (text) {
          const np = document.createElement('p');
          np.textContent = text;
          cardContent.push(np);
        }
      });

      // (the <hr> divider is decorative and intentionally dropped)

      // 4. CTA link(s)
      const ctas = Array.from(card.querySelectorAll('p.button-container a, a.button'))
        .filter((c, i, arr) => arr.indexOf(c) === i);
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

    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-support', cells });
    element.replaceWith(block);
    return;
  }

  // ---------------------------------------------------------------------------
  // Homepage (awt-* Lit custom elements) branch — original behaviour, unchanged.
  // ---------------------------------------------------------------------------
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
