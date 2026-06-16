/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsIndicationParser from './parsers/cards-indication.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsSupportParser from './parsers/cards-support.js';
import cardsContactParser from './parsers/cards-contact.js';
import accordionIsiParser from './parsers/accordion-isi.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/ultomirishcp-cleanup.js';
import sectionsTransformer from './transformers/ultomirishcp-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-indication': cardsIndicationParser,
  'columns-media': columnsMediaParser,
  'cards-support': cardsSupportParser,
  'cards-contact': cardsContactParser,
  'accordion-isi': accordionIsiParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Homepage with hero indication grid, mechanism-of-action and resources promo cards, support/contact blocks, and Important Safety Information (ISI).',
  urls: ['https://ultomirishcp.com/'],
  blocks: [
    { name: 'hero-banner', instances: ['#content > awt-container:nth-of-type(1)'] },
    { name: 'cards-indication', instances: ['#content > awt-container:nth-of-type(2)'] },
    { name: 'columns-media', instances: ['#content > awt-container:nth-of-type(4)', '#content > awt-container:nth-of-type(5)'] },
    { name: 'cards-support', instances: ['#content > awt-container:nth-of-type(6)'] },
    { name: 'cards-contact', instances: ['#awt-container-border-white'] },
    { name: 'accordion-isi', instances: ['#content > awt-container-warning'] },
  ],
  sections: [
    { id: 'rc4', name: 'Hero banner', selector: '#content > awt-container:nth-of-type(1)', style: null, blocks: ['hero-banner'], defaultContent: [] },
    { id: 'rc5', name: 'FDA indications', selector: '#content > awt-container:nth-of-type(2)', style: null, blocks: ['cards-indication'], defaultContent: [] },
    { id: 'rc6', name: 'Quote band', selector: '#content > awt-container:nth-of-type(3)', style: 'accent-teal', blocks: [], defaultContent: ['#content > awt-container:nth-of-type(3)'] },
    { id: 'rc7', name: 'Mechanism-of-action promo', selector: '#content > awt-container:nth-of-type(4)', style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 'rc8', name: 'Resources promo', selector: '#content > awt-container:nth-of-type(5)', style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 'rc9', name: 'Support cards', selector: '#content > awt-container:nth-of-type(6)', style: null, blocks: ['cards-support'], defaultContent: [] },
    { id: 'rc10', name: 'Connect contact band', selector: '#awt-container-border-white', style: 'warm-orange', blocks: ['cards-contact'], defaultContent: [] },
    { id: 'rc11', name: 'References', selector: '#content > awt-container:nth-of-type(8)', style: null, blocks: [], defaultContent: ['#content > awt-container:nth-of-type(8)'] },
    { id: 'rc13', name: 'Important Safety Information', selector: '#content > awt-container-warning', style: null, blocks: ['accordion-isi'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then sections (if 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip already-replaced/detached elements)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 3b. Merge adjacent columns-media blocks into a single multi-row block.
    // The source renders mirrored media+text rows as separate containers; in EDS
    // these belong in one columns block where each row is one media+text pair.
    // WebImporter.Blocks.createBlock emits a <table> whose first row is the
    // block name; merge subsequent tables' content rows (skipping their name row)
    // into the first adjacent columns-media table.
    const isColumnsMediaTable = (el) => el
      && el.tagName === 'TABLE'
      && el.rows.length
      && el.rows[0].textContent.trim().replace(/\s+/g, '-').toLowerCase() === 'columns-media';

    main.querySelectorAll('table').forEach((table) => {
      if (!isColumnsMediaTable(table)) return;
      let next = table.nextElementSibling;
      while (isColumnsMediaTable(next)) {
        const tbody = table.tBodies[0] || table;
        // move the content rows (all rows except the block-name row) over
        Array.from(next.rows).slice(1).forEach((row) => tbody.appendChild(row));
        const toRemove = next;
        next = next.nextElementSibling;
        toRemove.remove();
      }
    });

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
