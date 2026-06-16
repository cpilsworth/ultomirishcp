/**
 * cards-contact block
 * Authored structure (per row / li):
 *   div > h3, p(phone/email), p(> a tel:Call), p(> a mailto:Email)
 * Decorated structure:
 *   ul > li > div.cards-contact-card-body
 *     h3, p.cards-contact-info, p.cards-contact-actions > (a.button.call, a.button.email)
 */

const ICONS = {
  call:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.4 11.4 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02l-2.2 2.2Z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7Z"/></svg>',
};

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const body = document.createElement('div');
    body.className = 'cards-contact-card-body';

    const cell = row.firstElementChild || row;
    const actionLinks = [];

    [...cell.children].forEach((node) => {
      // A standalone <p> whose only child is a tel:/mailto: link is an action button
      const link = node.tagName === 'P' && node.children.length === 1
        ? node.querySelector(':scope > a[href^="tel:"], :scope > a[href^="mailto:"]')
        : null;
      const isActionButton = link && node.textContent.trim() === link.textContent.trim();

      if (isActionButton) {
        actionLinks.push(link);
        return;
      }
      // info paragraph(s) and heading move across unchanged
      if (node.tagName === 'P') node.className = 'cards-contact-info';
      body.append(node);
    });

    if (actionLinks.length) {
      const actions = document.createElement('p');
      actions.className = 'cards-contact-actions';
      actionLinks.forEach((link) => {
        link.classList.add('button');
        const isCall = (link.getAttribute('href') || '').startsWith('tel:');
        link.classList.add(isCall ? 'call' : 'email');
        const label = link.textContent.trim();
        link.innerHTML = `<span>${label}</span>${isCall ? ICONS.call : ICONS.email}`;
        actions.append(link);
      });
      body.append(actions);
    }

    li.append(body);
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
