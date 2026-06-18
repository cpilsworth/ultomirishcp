/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-isi-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-isi-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-isi-item';
    // On the aHUS template the ISI renders fully expanded (in-flow ISI),
    // matching ultomirishcp.com/ahus. Other templates keep it collapsible.
    if (document.body.classList.contains('ahus-home')) {
      details.open = true;
      // Wrap the leading boxed-WARNING content (everything up to the first
      // CONTRAINDICATIONS heading) in a bordered box, matching the source.
      const bodyKids = [...body.children];
      const contraIdx = bodyKids.findIndex(
        (el) => el.tagName === 'P' && /^CONTRAINDICATIONS/i.test(el.textContent.trim()),
      );
      if (contraIdx > 0) {
        const boxedWarning = document.createElement('div');
        boxedWarning.className = 'black-box-warning';
        boxedWarning.append(...bodyKids.slice(0, contraIdx));
        body.prepend(boxedWarning);
      }
    }
    details.append(summary, body);
    row.replaceWith(details);
  });
}
