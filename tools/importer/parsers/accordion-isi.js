/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: accordion-isi
 * Base block: accordion
 * Source URLs:
 *   - https://ultomirishcp.com/ (+ /about-ultomiris, /dosing-and-administration,
 *     /resources-and-support) — main HCP site, awt-* Lit custom elements
 *   - https://ultomirishcp.com/ahus — standalone aHUS microsite, semantic HTML
 * Source selectors:
 *   - #content > awt-container-warning   (awt-* branch)
 *   - main#main > div.psp                (aHUS semantic branch)
 * Generated: 2026-06-16  Extended: 2026-06-17 (aHUS semantic-HTML branch)
 *
 * This parser handles TWO distinct source structures and branches on the
 * structure of the incoming element:
 *
 * A) awt-* Lit custom-element ISI (homepage + indication-landing pages):
 *   <awt-container-warning title-warning="IMPORTANT SAFETY INFORMATION INCLUDING BOXED WARNING">
 *     <awt-article standfirst="<encoded boxed-warning sub-heading>" standfirst-tag="h3">
 *       <awt-article-section><div slot="paragraph"> ... boxed-warning body (bold + bullets) ... </div></awt-article-section>
 *     </awt-article>
 *     <awt-article-section><div slot="paragraph"> ... full multi-section regulatory rich text ... </div></awt-article-section>
 *
 * B) aHUS microsite ISI (standard semantic HTML, selector main#main > div.psp):
 *   <div class="psp">
 *     <div class="psp-bar"> ... .psp-bar-header (title) + .psp-bar-controls (Show more/less) ... </div>
 *     <div class="isi isi--global"> ... all-indication ISI ... </div>
 *     <div class="isi isi--pnh"> ... PNH-only ISI ... </div>
 *     <div class="isi isi--ahus"> ... aHUS-only ISI (the one this aHUS page displays) ... </div>
 *   </div>
 *   The aHUS page shows the .isi--ahus copy (single aHUS INDICATION, aHUS adverse
 *   reactions / TMA recurrence). We extract that body, drop the .psp-bar controls,
 *   and ignore the sibling .isi--global / .isi--pnh duplicates.
 *
 * Target (accordion): 2-column table. First row = block name. One accordion item row:
 *   - Title cell:   the "IMPORTANT SAFETY INFORMATION..." label
 *   - Content cell: the full ISI body (boxed-warning sub-heading + warning body + full
 *                   regulatory rich text), preserving paragraphs, lists, bold/italic/
 *                   underline emphasis, and links. Regulatory boilerplate — never truncate.
 */
export default function parse(element, { document }) {
  const ABSOLUTE_BASE = 'https://ultomirishcp.com';

  const toAbsolute = (url) => {
    if (!url) return url;
    // Leave non-http schemes (tel:, mailto:) and already-absolute URLs alone.
    if (/^(tel:|mailto:|https?:\/\/|\/\/)/i.test(url) || url.startsWith('#')) {
      try {
        return new URL(url, ABSOLUTE_BASE).href;
      } catch (e) {
        return url;
      }
    }
    try {
      return new URL(url, ABSOLUTE_BASE).href;
    } catch (e) {
      return url;
    }
  };

  // Normalize any relative hrefs in extracted rich text to absolute URLs so
  // links remain valid after import. tel:/mailto: links are preserved as-is.
  const absolutizeLinks = (root) => {
    root.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !/^(tel:|mailto:)/i.test(href)) {
        a.setAttribute('href', toAbsolute(href));
      }
    });
  };

  // =======================================================================
  // Branch B: aHUS semantic-HTML ISI (div.psp). Detect by absence of the
  // awt-container-warning host and presence of the .psp / .isi structure.
  // =======================================================================
  const isAwtWarning = element.matches && element.matches('awt-container-warning');
  const isPsp = !isAwtWarning
    && element.querySelector
    && (element.matches('div.psp') || element.querySelector('.psp-bar-header, .isi'));

  if (isPsp) {
    // --- Title cell (from the .psp-bar heading) --------------------------
    const headerEl = element.querySelector('.psp-bar-header');
    const titleText = (headerEl ? headerEl.textContent : 'Important Safety Information').trim();
    const titleEl = document.createElement('p');
    titleEl.textContent = titleText || 'Important Safety Information';

    // --- Content cell ----------------------------------------------------
    // The .psp holds three per-indication ISI copies (.isi--global / --pnh /
    // --ahus); only one is displayed. This is the aHUS microsite, so prefer
    // the aHUS-specific copy, falling back to global, then the first .isi.
    const isiBody = element.querySelector('.isi--ahus')
      || element.querySelector('.isi--global')
      || element.querySelector('.isi');

    const contentCell = [];
    if (isiBody) {
      // Move the rich-text children (boxed warning + all regulatory
      // subsections) into the cell, preserving paragraphs, lists, emphasis
      // (strong/em/u) and links. Many subsections are wrapped in their own
      // <div> (e.g. .black-box-warning, #contraindications); pull the inner
      // flow content up so the markdown stays flat and complete.
      const collect = (node) => {
        Array.from(node.children).forEach((child) => {
          const tag = child.tagName;
          // Drop interactive controls / fold spacers that carry no copy.
          if (
            child.classList
            && (child.classList.contains('psp-bar')
              || child.classList.contains('psp-bar-controls')
              || child.classList.contains('isi-fold')
              || child.classList.contains('isi-fold-mobile'))
          ) {
            return;
          }
          if (tag === 'DIV') {
            // Unwrap structural wrappers (.black-box-warning, #contraindications,
            // #warning-precautions, #indications, #prescription-information, and
            // the anonymous .isi > div wrapper) and recurse into their children.
            collect(child);
            return;
          }
          // Skip empty paragraphs / spacers.
          if (!child.textContent.trim() && !child.querySelector('img, a')) {
            return;
          }
          absolutizeLinks(child);
          contentCell.push(child);
        });
      };
      collect(isiBody);
    }

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
    return;
  }

  // =======================================================================
  // Branch A: awt-* Lit custom-element ISI (default / existing behaviour).
  // =======================================================================

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
