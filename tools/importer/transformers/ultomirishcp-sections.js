/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ultomirishcp.com section breaks + section metadata.
 *
 * Site-specific but template-agnostic. Reads the section boundaries from
 * payload.template.sections (defined in tools/importer/page-templates.json).
 * Every section.selector was verified against the captured DOM:
 *   - homepage   (migration-work/homepage-analysis/cleaned.html)
 *   - indication-landing (migration-work/cleaned.html)
 * Real content lives under <section id="content" class="awt-content"> whose
 * direct awt-container children map 1:1 to the template sections (incl. the
 * named containers #awt-container-border-white and awt-container-warning).
 *
 * For each section (processed in reverse so DOM insertions don't shift the
 * selectors of earlier sections):
 *   - if section.style is set, append a "Section Metadata" block after the
 *     section's first element (accent-teal quote band, warm-orange connect band)
 *   - if the section is not the first, insert an <hr> before it as a break
 *
 * Runs in afterTransform only (block parsing must complete first).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : null;
  if (!sections || sections.length < 2) return;

  const doc = element.ownerDocument;

  // Resolve each section's anchor element from its selector (from captured DOM).
  const resolved = sections.map((section) => {
    let el = null;
    if (section.selector) {
      try {
        el = element.querySelector(section.selector);
      } catch (e) {
        el = null;
      }
    }
    return { section, el };
  });

  // Process in reverse so earlier sections' selectors/positions stay valid.
  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    const { section, el } = resolved[i];
    if (!el) continue;

    // Section metadata block for styled sections (accent-teal, warm-orange).
    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      if (el.parentNode) {
        el.parentNode.insertBefore(metaBlock, el.nextSibling);
      }
    }

    // Section break before every section except the first.
    if (i > 0 && el.parentNode) {
      const hr = doc.createElement('hr');
      el.parentNode.insertBefore(hr, el);
    }
  }
}
