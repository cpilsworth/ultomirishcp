import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

const DROPDOWN_LABELS = [
  'Select an Indication',
  'Full Prescribing and Patient Information',
  'Visit the Patient Sites',
];

/**
 * Build a click-toggle dropdown from a label <p> and its following <ul>.
 * @param {Element} labelEl the <p> label element
 * @param {Element} listEl the <ul> of options
 * @returns {Element} the dropdown element
 */
function buildDropdown(labelEl, listEl) {
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-dropdown';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-dropdown-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.textContent = labelEl.textContent.trim();

  const panel = document.createElement('div');
  panel.className = 'nav-dropdown-panel';
  panel.append(listEl);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = trigger.getAttribute('aria-expanded') === 'true';
    dropdown.closest('.nav-utility')?.querySelectorAll('.nav-dropdown-trigger[aria-expanded="true"]')
      .forEach((t) => t.setAttribute('aria-expanded', 'false'));
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  dropdown.append(trigger, panel);
  return dropdown;
}

/**
 * Toggle the mobile menu open/closed.
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // 4 source sections: 0 notification, 1 utility, 2 brand, 3 primary nav
  const sections = [...nav.children];
  const [notifSection, utilitySection, brandSection, primarySection] = sections;
  if (notifSection) notifSection.className = 'nav-notification';
  if (utilitySection) utilitySection.className = 'nav-utility';
  if (brandSection) brandSection.className = 'nav-brand';
  if (primarySection) primarySection.className = 'nav-primary';

  // Build dropdowns in the utility section: each label <p> followed by a <ul>.
  // EDS wraps section content in a .default-content-wrapper, so operate on that.
  if (utilitySection) {
    const container = utilitySection.querySelector('.default-content-wrapper') || utilitySection;
    const children = [...container.children];
    const rebuilt = [];
    for (let i = 0; i < children.length; i += 1) {
      const el = children[i];
      const text = el.tagName === 'P' ? el.textContent.trim() : '';
      const next = children[i + 1];
      if (DROPDOWN_LABELS.includes(text) && next && next.tagName === 'UL') {
        rebuilt.push(buildDropdown(el, next));
        i += 1;
      } else if (el.tagName === 'P') {
        el.classList.add('nav-utility-link');
        rebuilt.push(el);
      } else {
        rebuilt.push(el);
      }
    }
    container.textContent = '';
    rebuilt.forEach((el) => container.append(el));
  }

  // close dropdowns when clicking outside
  document.addEventListener('click', () => {
    nav.querySelectorAll('.nav-dropdown-trigger[aria-expanded="true"]')
      .forEach((t) => t.setAttribute('aria-expanded', 'false'));
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  if (brandSection) brandSection.append(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // reset menu state on viewport change
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, isDesktop.matches);
    nav.querySelectorAll('.nav-dropdown-trigger[aria-expanded="true"]')
      .forEach((t) => t.setAttribute('aria-expanded', 'false'));
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
