/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards-contact
 * Base block: cards
 * Source URL: https://ultomirishcp.com/ (#awt-container-border-white)
 * Generated: 2026-06-16
 *
 * Source CMS: Lit custom elements (awt-*). The contact band <awt-container> holds a
 * 2-column grid (inner <awt-container columns-size="50,50,0,0">) of <awt-article>
 * contact cards. Each card has:
 *   - a heading carried in the `standfirst` attribute (HTML-encoded), e.g. "For NMOSD and gMG"
 *   - an <awt-article-section> paragraph with "Phone: <number>" and "Email: <mailto link>"
 *   - two <awt-btn> CTAs ("Call" -> tel:, "Email" -> mailto:)
 *
 * Target EDS "cards" structure: single-column table; row 1 = block name; one row per
 * contact card. Each card cell = heading + phone/email paragraph + Call/Email CTA links.
 */
export default function parse(element, { document }) {
  // Each contact card is an <awt-article>. Fallback to direct article descendants
  // if the inner grid container markup varies across pages.
  const articles = Array.from(element.querySelectorAll('awt-article'));

  const cells = [];

  articles.forEach((article) => {
    const cardContent = [];

    // Heading: carried in the `standfirst` attribute as HTML-encoded markup.
    const standfirst = article.getAttribute('standfirst');
    if (standfirst) {
      const headingTag = (article.getAttribute('standfirst-tag') || 'h3').toLowerCase();
      const heading = document.createElement(headingTag);
      // standfirst contains encoded HTML (e.g. a <span> wrapper) — decode to text.
      const decoder = document.createElement('div');
      decoder.innerHTML = standfirst;
      const headingText = (decoder.textContent || '').trim();
      if (headingText) {
        heading.textContent = headingText;
        cardContent.push(heading);
      }
    }

    // Phone / Email paragraph from the article-section paragraph slot.
    const paragraphSource = article.querySelector('[slot="paragraph"], awt-article-section [slot="paragraph"]');
    if (paragraphSource) {
      const para = document.createElement('p');
      // Preserve the phone text + mailto link (drop inline color styling).
      Array.from(paragraphSource.childNodes).forEach((node) => {
        if (node.nodeType === 3) {
          // text node
          if (node.textContent.trim()) para.appendChild(document.createTextNode(node.textContent));
        } else if (node.nodeName === 'BR') {
          para.appendChild(document.createElement('br'));
        } else if (node.nodeName === 'A') {
          const a = document.createElement('a');
          a.href = node.getAttribute('href') || '';
          a.textContent = (node.textContent || '').trim();
          para.appendChild(a);
        } else {
          // span/other wrappers — flatten to their text + any inner anchors
          Array.from(node.childNodes).forEach((inner) => {
            if (inner.nodeName === 'A') {
              const a = document.createElement('a');
              a.href = inner.getAttribute('href') || '';
              a.textContent = (inner.textContent || '').trim();
              para.appendChild(a);
            } else if (inner.textContent && inner.textContent.trim()) {
              para.appendChild(document.createTextNode(inner.textContent));
            }
          });
        }
      });
      if (para.childNodes.length) cardContent.push(para);
    }

    // CTA buttons: <awt-btn> are custom elements, not anchors — rebuild as links.
    const buttons = Array.from(article.querySelectorAll('awt-btn'));
    buttons.forEach((btn) => {
      const href = btn.getAttribute('href');
      const label = (btn.textContent || '').trim();
      if (href && label) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        cardContent.push(link);
      }
    });

    if (cardContent.length) cells.push([cardContent]);
  });

  // Empty-block guard: if no cards were extracted, leave content in place.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-contact', cells });
  element.replaceWith(block);
}
