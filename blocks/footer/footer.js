import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment (content-first: all copy/links live in the fragment)
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/content/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // classify the rows: logo (left) + legal block (right-aligned: links, safety, copyright)
  const rows = [...footer.children];
  const [logoRow, legalRow, safetyRow, copyrightRow] = rows;
  if (logoRow) logoRow.classList.add('footer-logo');
  if (legalRow) legalRow.classList.add('footer-legal-links');
  if (safetyRow) safetyRow.classList.add('footer-safety');
  if (copyrightRow) copyrightRow.classList.add('footer-copyright');

  // group the three legal rows so they sit right of the logo
  if (legalRow && safetyRow && copyrightRow) {
    const legalBlock = document.createElement('div');
    legalBlock.className = 'footer-legal';
    legalBlock.append(legalRow, safetyRow, copyrightRow);
    footer.append(legalBlock);
  }

  block.append(footer);
}
