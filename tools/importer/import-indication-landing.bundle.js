/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-indication-landing.js
  var import_indication_landing_exports = {};
  __export(import_indication_landing_exports, {
    default: () => import_indication_landing_default
  });

  // tools/importer/parsers/cards-indication.js
  function parse(element, { document }) {
    const cards = Array.from(element.querySelectorAll("awt-text-description-card"));
    if (!cards.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const cellContent = [];
      const titleEl = card.querySelector('[slot="cardTitle"]');
      if (titleEl) {
        const heading = document.createElement("h4");
        heading.append(...titleEl.childNodes);
        cellContent.push(heading);
      }
      const descEl = card.querySelector('[slot="cardDescription"]');
      if (descEl) {
        const desc = document.createElement("p");
        desc.append(...descEl.childNodes);
        cellContent.push(desc);
      }
      const ctaButtons = Array.from(card.querySelectorAll('[slot="cta_buttons"] awt-btn, [slot="cta_buttons"] a'));
      ctaButtons.forEach((btn) => {
        const href = btn.getAttribute("href");
        const label = (btn.textContent || "").trim();
        if (href) {
          const link = document.createElement("a");
          link.href = href;
          const target = btn.getAttribute("target");
          if (target) link.setAttribute("target", target);
          link.textContent = label || href;
          cellContent.push(link);
        }
      });
      if (cellContent.length) {
        cells.push([cellContent]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-indication", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-isi.js
  function parse2(element, { document }) {
    const ABSOLUTE_BASE = "https://ultomirishcp.com";
    const toAbsolute = (url) => {
      if (!url) return url;
      try {
        return new URL(url, ABSOLUTE_BASE).href;
      } catch (e) {
        return url;
      }
    };
    const absolutizeLinks = (root) => {
      root.querySelectorAll("a[href]").forEach((a) => {
        a.setAttribute("href", toAbsolute(a.getAttribute("href")));
      });
    };
    const titleText = (element.getAttribute("title-warning") || "Important Safety Information").trim();
    const titleEl = document.createElement("p");
    titleEl.textContent = titleText;
    const contentCell = [];
    const article = element.querySelector("awt-article");
    if (article) {
      const standfirst = article.getAttribute("standfirst");
      if (standfirst) {
        const tag = (article.getAttribute("standfirst-tag") || "h3").toLowerCase();
        const heading = document.createElement(/^h[1-6]$/.test(tag) ? tag : "h3");
        heading.innerHTML = standfirst;
        const text = heading.textContent.trim();
        heading.textContent = text;
        if (text) contentCell.push(heading);
      }
    }
    const paragraphSlots = Array.from(element.querySelectorAll('[slot="paragraph"]'));
    paragraphSlots.forEach((slot) => {
      Array.from(slot.children).forEach((child) => {
        if (child.tagName === "UL") {
          child.querySelectorAll(":scope > strong").forEach((strayStrong) => {
            while (strayStrong.firstChild) {
              child.insertBefore(strayStrong.firstChild, strayStrong);
            }
            strayStrong.remove();
          });
        }
        absolutizeLinks(child);
        contentCell.push(child);
      });
    });
    if (contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [titleEl, contentCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-isi", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/ultomirishcp-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "awt-modal-hcp",
        // HCP "healthcare professionals only" gateway modal
        "#CookieReportsPanel",
        // cookie consent panel (contains overlay + Privacy Preferences dialog)
        "#CookieReportsOverlay"
        // defensive: overlay in case it is rendered as a sibling
      ]);
      WebImporter.DOMUtils.remove(element, ["#isi-container"]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".awt-skip-bar",
        // skip-to-content link bar
        "awt-top-notification",
        // top notification bar
        "awtcustom-header",
        // site header / nav (EDS auto-populates header)
        "footer.awt-footer"
        // site footer (EDS auto-populates footer)
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#CookieReportsPanel",
        "#CookieReportsOverlay",
        "awt-modal-hcp"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        "link"
      ]);
      const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_COMMENT);
      const comments = [];
      let node = walker.nextNode();
      while (node) {
        comments.push(node);
        node = walker.nextNode();
      }
      comments.forEach((c) => c.remove());
    }
  }

  // tools/importer/transformers/ultomirishcp-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : null;
    if (!sections || sections.length < 2) return;
    const doc = element.ownerDocument;
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
    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { section, el } = resolved[i];
      if (!el) continue;
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (el.parentNode) {
          el.parentNode.insertBefore(metaBlock, el.nextSibling);
        }
      }
      if (i > 0 && el.parentNode) {
        const hr = doc.createElement("hr");
        el.parentNode.insertBefore(hr, el);
      }
    }
  }

  // tools/importer/import-indication-landing.js
  var parsers = {
    "cards-indication": parse,
    "accordion-isi": parse2
  };
  var PAGE_TEMPLATE = {
    name: "indication-landing",
    description: "Indication selector landing page with intro heading, 4-card indication grid linking to per-indication subpages, and Important Safety Information (ISI).",
    urls: [
      "https://ultomirishcp.com/about-ultomiris",
      "https://ultomirishcp.com/dosing-and-administration",
      "https://ultomirishcp.com/resources-and-support"
    ],
    blocks: [
      { name: "cards-indication", instances: ["#content > awt-container:nth-of-type(2)"] },
      { name: "accordion-isi", instances: ["#content > awt-container-warning"] }
    ],
    sections: [
      { id: "rc4", name: "Intro heading", selector: "#content > awt-container:nth-of-type(1)", style: null, blocks: [], defaultContent: ["#content > awt-container:nth-of-type(1)"] },
      { id: "rc5", name: "Indication grid", selector: "#content > awt-container:nth-of-type(2)", style: null, blocks: ["cards-indication"], defaultContent: [] },
      { id: "rc7", name: "Important Safety Information", selector: "#content > awt-container-warning", style: null, blocks: ["accordion-isi"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
  var import_indication_landing_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_indication_landing_exports);
})();
