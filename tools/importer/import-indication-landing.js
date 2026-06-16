/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsIndicationParser from './parsers/cards-indication.js';
import accordionIsiParser from './parsers/accordion-isi.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/ultomirishcp-cleanup.js';
import sectionsTransformer from './transformers/ultomirishcp-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-indication': cardsIndicationParser,
  'accordion-isi': accordionIsiParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'indication-landing',
  description: 'Indication selector landing page with intro heading, 4-card indication grid linking to per-indication subpages, and Important Safety Information (ISI).',
  urls: [
    'https://ultomirishcp.com/about-ultomiris',
    'https://ultomirishcp.com/dosing-and-administration',
    'https://ultomirishcp.com/resources-and-support',
  ],
  blocks: [
    { name: 'cards-indication', instances: ['#content > awt-container:nth-of-type(2)'] },
    { name: 'accordion-isi', instances: ['#content > awt-container-warning'] },
  ],
  sections: [
    { id: 'rc4', name: 'Intro heading', selector: '#content > awt-container:nth-of-type(1)', style: null, blocks: [], defaultContent: ['#content > awt-container:nth-of-type(1)'] },
    { id: 'rc5', name: 'Indication grid', selector: '#content > awt-container:nth-of-type(2)', style: null, blocks: ['cards-indication'], defaultContent: [] },
    { id: 'rc7', name: 'Important Safety Information', selector: '#content > awt-container-warning', style: null, blocks: ['accordion-isi'], defaultContent: [] },
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
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
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
