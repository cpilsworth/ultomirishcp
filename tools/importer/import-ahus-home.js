/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsSupportParser from './parsers/cards-support.js';
import cardsIndicationParser from './parsers/cards-indication.js';
import accordionIsiParser from './parsers/accordion-isi.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/ultomirishcp-cleanup.js';
import sectionsTransformer from './transformers/ultomirishcp-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'columns-media': columnsMediaParser,
  'cards-support': cardsSupportParser,
  'cards-indication': cardsIndicationParser,
  'accordion-isi': accordionIsiParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'ahus-home',
  description: 'Atypical-HUS indication microsite home page: hero, media+text promos, support cards, resource cards, references, ISI.',
  urls: ['https://ultomirishcp.com/ahus'],
  blocks: [
    { name: 'hero-banner', instances: ['main#main > section.hero'] },
    {
      name: 'columns-media',
      instances: [
        'main#main > section#videos-and-podcasts',
        'main#main > section#efficacy-and-safety',
        'main#main > section#dosing-and-admin',
        'main#main > section#about-ahus',
        'main#main > section#about-ultomiris',
      ],
    },
    { name: 'cards-support', instances: ['main#main > section.alexion-resources'] },
    { name: 'cards-indication', instances: ['main#main > section.end-of-page-ctas'] },
    { name: 'accordion-isi', instances: ['main#main > div.psp'] },
  ],
  sections: [
    { id: 'n1', name: 'Hero', selector: 'main#main > section.hero', style: null, blocks: ['hero-banner'], defaultContent: [] },
    { id: 'n2', name: 'Promo: transitioning patients', selector: 'main#main > section#videos-and-podcasts', style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 'n3', name: 'Promo: sustained inhibition', selector: 'main#main > section#efficacy-and-safety', style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 'n4', name: 'Promo pair: half-life + TMA recurrence', selector: 'main#main > section#dosing-and-admin', style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 'n5', name: 'Promo: understanding aHUS', selector: 'main#main > section#about-ahus', style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 'n6', name: 'Promo: ULTOMIRIS difference', selector: 'main#main > section#about-ultomiris', style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 'n7', name: 'Support cards', selector: 'main#main > section.alexion-resources', style: null, blocks: ['cards-support'], defaultContent: [] },
    { id: 'n8', name: 'Resource cards', selector: 'main#main > section.end-of-page-ctas', style: 'warm-magenta', blocks: ['cards-indication'], defaultContent: [] },
    { id: 'n9', name: 'References', selector: 'main#main > section.references', style: null, blocks: [], defaultContent: ['main#main > section.references'] },
    { id: 'n10', name: 'Important Safety Information', selector: 'main#main > div.psp', style: null, blocks: ['accordion-isi'], defaultContent: [] },
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

    // Emit the page-template marker. decorateTemplateAndTheme() reads the
    // resulting <meta name="template"> and adds it as a <body> class
    // (body.ahus-home), which scopes the aHUS designs for the remaining blocks
    // (columns-media, cards-support, cards-indication, accordion-isi).
    // createMetadata() appends a metadata <table> (header cell "Metadata") to
    // main; add a "template" row to it so the marker survives re-imports.
    const metaTable = Array.from(main.querySelectorAll('table')).find((t) => {
      const firstCell = t.querySelector('th, td');
      return firstCell && firstCell.textContent.trim().toLowerCase() === 'metadata';
    });
    if (metaTable) {
      const tbody = metaTable.querySelector('tbody') || metaTable;
      const row = document.createElement('tr');
      const key = document.createElement('td');
      key.textContent = 'template';
      const value = document.createElement('td');
      value.textContent = PAGE_TEMPLATE.name;
      row.appendChild(key);
      row.appendChild(value);
      tbody.appendChild(row);
    }

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
