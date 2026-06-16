/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: accordion-isi
 * Base block: accordion
 * Source URL: https://ultomirishcp.com/
 * Source selector: #content > awt-container-warning
 * Generated: 2026-06-16
 *
 * Source structure (Lit custom elements):
 *   <awt-container-warning title-warning="IMPORTANT SAFETY INFORMATION INCLUDING BOXED WARNING">
 *     <awt-article standfirst="<encoded boxed-warning sub-heading>" standfirst-tag="h3">
 *       <awt-article-section><div slot="paragraph"> ... boxed-warning body (bold + bullets) ... </div></awt-article-section>
 *     </awt-article>
 *     <awt-article-section><div slot="paragraph"> ... full multi-section regulatory rich text ... </div></awt-article-section>
 *
 * Target (accordion): 2-column table. First row = block name. One accordion item row:
 *   - Title cell:   the "IMPORTANT SAFETY INFORMATION..." label (from title-warning attribute)
 *   - Content cell: the full ISI body (boxed-warning sub-heading + warning body + full
 *                   regulatory rich text), preserving paragraphs, lists, bold/italic/
 *                   underline emphasis, and links. Regulatory boilerplate — never truncate.
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

  // Normalize any relative hrefs in extracted rich text to absolute URLs so
  // links remain valid after import.
  const absolutizeLinks = (root) => {
    root.querySelectorAll('a[href]').forEach((a) => {
      a.setAttribute('href', toAbsolute(a.getAttribute('href')));
    });
  };

  // --- Title cell ---------------------------------------------------------
  // The accordion title comes from the title-warning attribute on the host.
  const titleText = (element.getAttribute('title-warning') || 'Important Safety Information').trim();
  const titleEl = document.createElement('p');
  titleEl.textContent = titleText;

  // --- Content cell -------------------------------------------------------
  // Collect every rich-text node in document order. We pull from each
  // <div slot="paragraph"> (the boxed-warning body and the full regulatory
  // body) plus the boxed-warning sub-heading carried in the standfirst attr.
  const contentCell = [];

  // 1. Boxed-warning sub-heading from the article's standfirst attribute.
  const article = element.querySelector('awt-article');
  if (article) {
    const standfirst = article.getAttribute('standfirst');
    if (standfirst) {
      const tag = (article.getAttribute('standfirst-tag') || 'h3').toLowerCase();
      const heading = document.createElement(/^h[1-6]$/.test(tag) ? tag : 'h3');
      // standfirst is HTML-encoded markup; decode then use plain text.
      heading.innerHTML = standfirst;
      const text = heading.textContent.trim();
      heading.textContent = text;
      if (text) contentCell.push(heading);
    }
  }

  // 2. All rich-text bodies, in document order. Each lives inside a
  //    <div slot="paragraph">. The first belongs to the boxed warning,
  //    the second carries the full multi-section regulatory text.
  const paragraphSlots = Array.from(element.querySelectorAll('[slot="paragraph"]'));
  paragraphSlots.forEach((slot) => {
    // Move the actual rich-text children (p, ul, etc.) into the cell so all
    // emphasis (strong/em/u), lists, line breaks and links are preserved.
    Array.from(slot.children).forEach((child) => {
      // Some source markup nests <strong> directly inside <ul> wrapping the
      // <li> items (malformed). Unwrap a stray <strong> that only contains
      // list items so the list renders correctly while keeping bold intent.
      if (child.tagName === 'UL') {
        child.querySelectorAll(':scope > strong').forEach((strayStrong) => {
          // Lift any <li> out of the stray <strong> back onto the <ul>.
          while (strayStrong.firstChild) {
            child.insertBefore(strayStrong.firstChild, strayStrong);
          }
          strayStrong.remove();
        });
      }
      absolutizeLinks(child);
      contentCell.push(child);
    });
  });

  // Empty-block guard: if no ISI body content was extracted, unwrap and bail.
  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [titleEl, contentCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-isi', cells });
  element.replaceWith(block);
}
