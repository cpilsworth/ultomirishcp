/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base block: columns.
 * Source: https://ultomirishcp.com/ (Lit custom elements: awt-container/awt-image/awt-article/awt-btn)
 * Generated: 2026-06-16
 *
 * Each block element is one <awt-container> instance holding an inner
 * <awt-container columns-size="..."> whose two direct children are the columns,
 * in source order (an <awt-image> and an <awt-container> wrapping <awt-article>).
 * Instance order alternates (text/image vs image/text) — source cell order is
 * preserved so the mirrored layout is retained.
 *
 * Target: columns block, one row, two cells (image cell + text cell with
 * heading / paragraph / CTA). Cell order matches the source column order.
 */
export default function parse(element, { document }) {
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
