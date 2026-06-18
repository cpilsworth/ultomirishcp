/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base block: columns.
 * Sources:
 *   - https://ultomirishcp.com/ (homepage) — Lit custom elements
 *     (awt-container/awt-image/awt-article/awt-btn)
 *   - https://ultomirishcp.com/ahus — semantic HTML promo sections
 *     (section.two-col with div.image + div.copy, plus the special
 *     #dosing-and-admin section holding two col-N-* promos)
 * Generated: 2026-06-16 (extended 2026-06-17 for aHUS semantic markup)
 *
 * Two distinct source structures are handled by branching on the markup:
 *
 * 1. awt-* (homepage): the block element is an <awt-container> holding an inner
 *    <awt-container columns-size="..."> whose two direct children are the
 *    columns (an <awt-image> and an <awt-container> wrapping <awt-article>).
 *
 * 2. Semantic HTML (aHUS): the block element is a <section> (typically
 *    .two-col) wrapping a <div> with a .image cell and a .copy cell. The
 *    #dosing-and-admin section is special: a single <div> holds two stacked
 *    promos (col-1-header/body/cta and col-2-header/body/cta) which are mapped
 *    to the two cells of one columns row.
 *
 * Target (both branches): columns block, one row, two cells. Cell order matches
 * the source DOM order so mirrored (.two-col--reverse) layouts are preserved.
 */
export default function parse(element, { document }) {
  // --- Branch detection -----------------------------------------------------
  // awt-* markup uses the Lit custom elements; semantic markup uses standard
  // HTML (div.copy / div.image / col-N-header). Detect the semantic branch
  // first and delegate; otherwise fall through to the awt-* handling.
  const isSemantic = !element.querySelector('awt-article, awt-container[columns-size]')
    && (element.matches('section.two-col')
      || element.querySelector(':scope > div > .copy, :scope > div > .image, :scope > div > [class^="col-1-"], :scope > div > [class^="col-2-"]'));

  if (isSemantic) {
    parseSemantic(element, { document });
    return;
  }

  // The inner grid container holds the two columns as its direct children.
  const grid = element.querySelector('awt-container[columns-size]') || element;

  // Collect the column nodes in their source order so the mirrored layout
  // (image-left vs image-right) is preserved.
  const columnNodes = Array.from(grid.children).filter(
    (child) =>
      child.matches('awt-image, img')
      || child.querySelector('awt-article, awt-image, img'),
  );

  // Fallback: if direct-child filtering found nothing usable, scope to the
  // primary media/article nodes anywhere inside the block.
  const orderedNodes = columnNodes.length
    ? columnNodes
    : Array.from(grid.querySelectorAll('awt-image, img, awt-article'));

  /**
   * Builds the cell content for a single source column node.
   * - Image column → the image element (or its <img> if present).
   * - Article column → heading (from standfirst attr) + paragraph + CTA link.
   */
  const buildCell = (node) => {
    // Image column.
    const image = node.matches('awt-image, img')
      ? node
      : node.querySelector('awt-image, img');
    const article = node.querySelector('awt-article') || (node.matches('awt-article') ? node : null);

    if (image && !article) {
      const img = image.matches('img') ? image : image.querySelector('img');
      const src = image.getAttribute('src');
      const alt = image.getAttribute('altimage') || image.getAttribute('alt') || '';
      if (img) {
        if (!img.getAttribute('alt') && alt) img.setAttribute('alt', alt);
        return [img];
      }
      if (src) {
        const created = document.createElement('img');
        created.setAttribute('src', src);
        if (alt) created.setAttribute('alt', alt);
        return [created];
      }
      return [image];
    }

    // Text column (article): heading + paragraph + CTA.
    const cellContent = [];

    if (article) {
      // Heading lives in the HTML-encoded `standfirst` attribute; the level is
      // given by `standfirst-tag` (default h3).
      const standfirst = article.getAttribute('standfirst');
      if (standfirst) {
        const tag = (article.getAttribute('standfirst-tag') || 'h3').toLowerCase();
        const heading = document.createElement(/^h[1-6]$/.test(tag) ? tag : 'h3');
        // Decode the encoded markup, then keep only its text to avoid inline
        // style markup leaking into the output.
        const decoder = document.createElement('div');
        decoder.innerHTML = standfirst;
        heading.textContent = decoder.textContent.trim();
        if (heading.textContent) cellContent.push(heading);
      }

      // Body paragraph(s).
      const paragraphs = Array.from(
        article.querySelectorAll('awt-article-section [slot="paragraph"], [slot="paragraph"]'),
      );
      paragraphs.forEach((para) => {
        const p = document.createElement('p');
        p.innerHTML = para.innerHTML.trim();
        if (p.textContent.trim()) cellContent.push(p);
      });

      // CTA button(s) → anchors.
      const buttons = Array.from(article.querySelectorAll('awt-btn[href], a[href]'));
      buttons.forEach((btn) => {
        if (btn.matches('a')) {
          cellContent.push(btn);
          return;
        }
        const href = btn.getAttribute('href');
        const label = btn.textContent.trim();
        if (href && label) {
          const link = document.createElement('a');
          link.setAttribute('href', href);
          link.textContent = label;
          cellContent.push(link);
        }
      });
    }

    return cellContent;
  };

  const cells = orderedNodes.map(buildCell).filter((cell) => cell && cell.length);

  // Empty-block guard: bail gracefully if no usable column content was found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single content row; first row (block name) is added by createBlock.
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-media',
    cells: [cells],
  });
  element.replaceWith(block);
}

/**
 * Handles the aHUS semantic-HTML promo sections.
 *
 * Layouts:
 *   - Standard two-col: <section.two-col> > <div> > (div.image + div.copy).
 *     `.two-col--reverse` flips the layout via CSS only; DOM order stays
 *     image-then-copy, and the cells are emitted in that same source order.
 *   - #dosing-and-admin: <section> > <div> with two stacked promos made of
 *     col-1-header/body/cta and col-2-header/body/cta groups. Each promo
 *     becomes one cell of the single columns row.
 */
function parseSemantic(element, { document }) {
  /**
   * Builds an image cell from a .image wrapper (or a bare <img>).
   * Preserves src + alt and appends the "Actor portrayal"-style caption from
   * any .disclaimer block as small text.
   */
  const buildImageCell = (imageWrap) => {
    if (!imageWrap) return null;
    const cell = [];
    const img = imageWrap.matches('img') ? imageWrap : imageWrap.querySelector('img');
    if (img) cell.push(img);
    // Caption (e.g. "Actor portrayal").
    const disclaimer = imageWrap.matches('img')
      ? null
      : imageWrap.querySelector('.disclaimer');
    if (disclaimer) {
      const caption = document.createElement('p');
      const small = document.createElement('small');
      small.textContent = disclaimer.textContent.trim();
      if (small.textContent) {
        caption.append(small);
        cell.push(caption);
      }
    }
    return cell.length ? cell : null;
  };

  /**
   * Builds a text cell: heading (h2) + paragraph(s) + CTA link(s). Footnotes
   * (p.footnote) are preserved as small text. Accepts either a single .copy
   * wrapper or an array of source nodes (for the dosing col-N-* groups).
   */
  const buildTextCell = (nodes) => {
    const sources = Array.isArray(nodes) ? nodes : [nodes];
    const cell = [];

    sources.forEach((source) => {
      if (!source) return;

      // Heading(s).
      source.querySelectorAll(':scope > h2, :scope h2').forEach((h) => {
        if (!cell.includes(h)) cell.push(h);
      });

      // Body paragraphs, CTA buttons, and footnotes (in document order).
      source.querySelectorAll(':scope p, :scope a.button, :scope a').forEach((node) => {
        // Button-container <p> wrappers hold the CTA anchors; skip the wrapper
        // itself and let the anchor be picked up directly.
        if (node.matches('p.button-container')) return;
        if (cell.includes(node)) return;

        if (node.matches('a')) {
          // Skip anchors that merely wrap an image (handled in image cell).
          if (node.querySelector('img') && !node.textContent.trim()) return;
          cell.push(node);
          return;
        }

        // Footnotes → small text to de-emphasise.
        if (node.matches('p.footnote')) {
          const small = document.createElement('small');
          small.innerHTML = node.innerHTML.trim();
          const wrap = document.createElement('p');
          wrap.append(small);
          if (wrap.textContent.trim()) cell.push(wrap);
          return;
        }

        // Regular body paragraph.
        if (node.textContent.trim()) cell.push(node);
      });
    });

    return cell.length ? cell : null;
  };

  const inner = element.querySelector(':scope > div') || element;

  // --- Special case: #dosing-and-admin — two promos in one <div> -----------
  const col1 = Array.from(inner.querySelectorAll(':scope > [class^="col-1-"]'));
  const col2 = Array.from(inner.querySelectorAll(':scope > [class^="col-2-"]'));
  if (col1.length || col2.length) {
    const cells = [];
    const cell1 = buildTextCell(col1);
    const cell2 = buildTextCell(col2);
    if (cell1) cells.push(cell1);
    if (cell2) cells.push(cell2);

    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'columns-media',
      cells: [cells],
    });
    element.replaceWith(block);
    return;
  }

  // --- Standard two-col promo: image cell + copy cell ----------------------
  const imageWrap = inner.querySelector(':scope > .image');
  const copy = inner.querySelector(':scope > .copy');

  // Some sections (e.g. #videos-and-podcasts) render the image as a CSS
  // background on an empty .image div and embed a mobile image inside .copy.
  // Remove that in-copy mobile image so it does not pollute the text cell, and
  // fall back to it for the image cell when .image has no <img>.
  let mobileImg = null;
  if (copy) {
    mobileImg = copy.querySelector('img.mobile-hero, img');
  }

  let imageCell = buildImageCell(imageWrap);
  if ((!imageCell || !imageCell.some((n) => n.matches && n.matches('img'))) && mobileImg) {
    imageCell = (imageCell || []).concat(mobileImg);
  }
  if (mobileImg) mobileImg.remove();

  const textCell = buildTextCell(copy);

  // Emit cells in source DOM order (image precedes copy), preserving the
  // mirrored layout intent of .two-col--reverse sections.
  const cells = [];
  if (imageCell) cells.push(imageCell);
  if (textCell) cells.push(textCell);

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-media',
    cells: [cells],
  });
  element.replaceWith(block);
}
