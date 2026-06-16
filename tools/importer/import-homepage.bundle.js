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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const bgImage = element.querySelector('img[slot="background"], img[slot=background], img[class*="background"], img');
    const article = element.querySelector("awt-article[standfirst], awt-article");
    let heading = null;
    if (article) {
      const standfirst = article.getAttribute("standfirst");
      if (standfirst && standfirst.trim()) {
        const decoder = document.createElement("div");
        decoder.innerHTML = standfirst;
        const tagAttr = (article.getAttribute("standfirst-tag") || "h3").trim().toLowerCase();
        const headingTag = /^h[1-6]$/.test(tagAttr) ? tagAttr : "h3";
        heading = document.createElement(headingTag);
        const onlyChild = decoder.children.length === 1 ? decoder.children[0] : null;
        const source = onlyChild && onlyChild.tagName === "SPAN" ? onlyChild : decoder;
        while (source.childNodes.length) {
          heading.appendChild(source.childNodes[0]);
        }
        if (!heading.textContent || !heading.textContent.trim()) {
          heading = null;
        }
      }
    }
    if (!bgImage && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    if (heading) cells.push([heading]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-indication.js
  function parse2(element, { document }) {
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

  // tools/importer/parsers/columns-media.js
  function parse3(element, { document }) {
    const grid = element.querySelector("awt-container[columns-size]") || element;
    const columnNodes = Array.from(grid.children).filter(
      (child) => child.matches("awt-image, img") || child.querySelector("awt-article, awt-image, img")
    );
    const orderedNodes = columnNodes.length ? columnNodes : Array.from(grid.querySelectorAll("awt-image, img, awt-article"));
    const buildCell = (node) => {
      const image = node.matches("awt-image, img") ? node : node.querySelector("awt-image, img");
      const article = node.querySelector("awt-article") || (node.matches("awt-article") ? node : null);
      if (image && !article) {
        const img = image.matches("img") ? image : image.querySelector("img");
        const src = image.getAttribute("src");
        const alt = image.getAttribute("altimage") || image.getAttribute("alt") || "";
        if (img) {
          if (!img.getAttribute("alt") && alt) img.setAttribute("alt", alt);
          return [img];
        }
        if (src) {
          const created = document.createElement("img");
          created.setAttribute("src", src);
          if (alt) created.setAttribute("alt", alt);
          return [created];
        }
        return [image];
      }
      const cellContent = [];
      if (article) {
        const standfirst = article.getAttribute("standfirst");
        if (standfirst) {
          const tag = (article.getAttribute("standfirst-tag") || "h3").toLowerCase();
          const heading = document.createElement(/^h[1-6]$/.test(tag) ? tag : "h3");
          const decoder = document.createElement("div");
          decoder.innerHTML = standfirst;
          heading.textContent = decoder.textContent.trim();
          if (heading.textContent) cellContent.push(heading);
        }
        const paragraphs = Array.from(
          article.querySelectorAll('awt-article-section [slot="paragraph"], [slot="paragraph"]')
        );
        paragraphs.forEach((para) => {
          const p = document.createElement("p");
          p.innerHTML = para.innerHTML.trim();
          if (p.textContent.trim()) cellContent.push(p);
        });
        const buttons = Array.from(article.querySelectorAll("awt-btn[href], a[href]"));
        buttons.forEach((btn) => {
          if (btn.matches("a")) {
            cellContent.push(btn);
            return;
          }
          const href = btn.getAttribute("href");
          const label = btn.textContent.trim();
          if (href && label) {
            const link = document.createElement("a");
            link.setAttribute("href", href);
            link.textContent = label;
            cellContent.push(link);
          }
        });
      }
      return cellContent;
    };
    const cells = orderedNodes.map(buildCell).filter((cell) => cell && cell.length);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns-media",
      cells: [cells]
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-support.js
  function parse4(element, { document }) {
    const ABSOLUTE_BASE = "https://ultomirishcp.com";
    const toAbsolute = (url) => {
      if (!url) return url;
      try {
        return new URL(url, ABSOLUTE_BASE).href;
      } catch (e) {
        return url;
      }
    };
    const grid = element.querySelector(":scope > awt-container") || element;
    let cards = Array.from(grid.querySelectorAll(":scope > awt-container"));
    if (cards.length === 0) {
      cards = Array.from(element.querySelectorAll(":scope > awt-container > awt-container"));
    }
    if (cards.length === 0) {
      cards = Array.from(element.querySelectorAll("awt-container > awt-image, awt-image")).map((img) => img.closest("awt-container")).filter((c, i, arr) => c && arr.indexOf(c) === i);
    }
    const cells = [];
    cards.forEach((card) => {
      const cardContent = [];
      const awtImage = card.querySelector("awt-image, img");
      if (awtImage) {
        const src = awtImage.getAttribute("src") || awtImage.getAttribute("altimage");
        if (src) {
          const img = document.createElement("img");
          img.src = toAbsolute(src);
          const alt = awtImage.getAttribute("alt") || awtImage.getAttribute("altimage") || "";
          if (alt) img.alt = alt;
          cardContent.push(img);
        }
      }
      const article = card.querySelector("awt-article");
      if (article) {
        const standfirst = article.getAttribute("standfirst");
        if (standfirst) {
          const tag = (article.getAttribute("standfirst-tag") || "h3").toLowerCase();
          const heading = document.createElement(/^h[1-6]$/.test(tag) ? tag : "h3");
          heading.innerHTML = standfirst;
          const text = heading.textContent.trim();
          heading.textContent = text;
          if (text) cardContent.push(heading);
        }
      }
      const paragraphSlot = card.querySelector('[slot="paragraph"]');
      if (paragraphSlot) {
        const text = paragraphSlot.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          const p = document.createElement("p");
          p.textContent = text;
          cardContent.push(p);
        }
      }
      const ctas = Array.from(card.querySelectorAll("awt-btn, a"));
      ctas.forEach((cta) => {
        const href = cta.getAttribute("href");
        const label = cta.textContent.trim();
        if (href && label) {
          const a = document.createElement("a");
          a.href = toAbsolute(href);
          a.textContent = label;
          const target = cta.getAttribute("target");
          if (target) a.setAttribute("target", target);
          cardContent.push(a);
        }
      });
      if (cardContent.length > 0) {
        cells.push([cardContent]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-support", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-contact.js
  function parse5(element, { document }) {
    const articles = Array.from(element.querySelectorAll("awt-article"));
    const cells = [];
    articles.forEach((article) => {
      const cardContent = [];
      const standfirst = article.getAttribute("standfirst");
      if (standfirst) {
        const headingTag = (article.getAttribute("standfirst-tag") || "h3").toLowerCase();
        const heading = document.createElement(headingTag);
        const decoder = document.createElement("div");
        decoder.innerHTML = standfirst;
        const headingText = (decoder.textContent || "").trim();
        if (headingText) {
          heading.textContent = headingText;
          cardContent.push(heading);
        }
      }
      const paragraphSource = article.querySelector('[slot="paragraph"], awt-article-section [slot="paragraph"]');
      if (paragraphSource) {
        const para = document.createElement("p");
        Array.from(paragraphSource.childNodes).forEach((node) => {
          if (node.nodeType === 3) {
            if (node.textContent.trim()) para.appendChild(document.createTextNode(node.textContent));
          } else if (node.nodeName === "BR") {
            para.appendChild(document.createElement("br"));
          } else if (node.nodeName === "A") {
            const a = document.createElement("a");
            a.href = node.getAttribute("href") || "";
            a.textContent = (node.textContent || "").trim();
            para.appendChild(a);
          } else {
            Array.from(node.childNodes).forEach((inner) => {
              if (inner.nodeName === "A") {
                const a = document.createElement("a");
                a.href = inner.getAttribute("href") || "";
                a.textContent = (inner.textContent || "").trim();
                para.appendChild(a);
              } else if (inner.textContent && inner.textContent.trim()) {
                para.appendChild(document.createTextNode(inner.textContent));
              }
            });
          }
        });
        if (para.childNodes.length) cardContent.push(para);
      }
      const buttons = Array.from(article.querySelectorAll("awt-btn"));
      buttons.forEach((btn) => {
        const href = btn.getAttribute("href");
        const label = (btn.textContent || "").trim();
        if (href && label) {
          const link = document.createElement("a");
          link.href = href;
          link.textContent = label;
          cardContent.push(link);
        }
      });
      if (cardContent.length) cells.push([cardContent]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-contact", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-isi.js
  function parse6(element, { document }) {
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

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-banner": parse,
    "cards-indication": parse2,
    "columns-media": parse3,
    "cards-support": parse4,
    "cards-contact": parse5,
    "accordion-isi": parse6
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Homepage with hero indication grid, mechanism-of-action and resources promo cards, support/contact blocks, and Important Safety Information (ISI).",
    urls: ["https://ultomirishcp.com/"],
    blocks: [
      { name: "hero-banner", instances: ["#content > awt-container:nth-of-type(1)"] },
      { name: "cards-indication", instances: ["#content > awt-container:nth-of-type(2)"] },
      { name: "columns-media", instances: ["#content > awt-container:nth-of-type(4)", "#content > awt-container:nth-of-type(5)"] },
      { name: "cards-support", instances: ["#content > awt-container:nth-of-type(6)"] },
      { name: "cards-contact", instances: ["#awt-container-border-white"] },
      { name: "accordion-isi", instances: ["#content > awt-container-warning"] }
    ],
    sections: [
      { id: "rc4", name: "Hero banner", selector: "#content > awt-container:nth-of-type(1)", style: null, blocks: ["hero-banner"], defaultContent: [] },
      { id: "rc5", name: "FDA indications", selector: "#content > awt-container:nth-of-type(2)", style: null, blocks: ["cards-indication"], defaultContent: [] },
      { id: "rc6", name: "Quote band", selector: "#content > awt-container:nth-of-type(3)", style: "accent-teal", blocks: [], defaultContent: ["#content > awt-container:nth-of-type(3)"] },
      { id: "rc7", name: "Mechanism-of-action promo", selector: "#content > awt-container:nth-of-type(4)", style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: "rc8", name: "Resources promo", selector: "#content > awt-container:nth-of-type(5)", style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: "rc9", name: "Support cards", selector: "#content > awt-container:nth-of-type(6)", style: null, blocks: ["cards-support"], defaultContent: [] },
      { id: "rc10", name: "Connect contact band", selector: "#awt-container-border-white", style: "warm-orange", blocks: ["cards-contact"], defaultContent: [] },
      { id: "rc11", name: "References", selector: "#content > awt-container:nth-of-type(8)", style: null, blocks: [], defaultContent: ["#content > awt-container:nth-of-type(8)"] },
      { id: "rc13", name: "Important Safety Information", selector: "#content > awt-container-warning", style: null, blocks: ["accordion-isi"], defaultContent: [] }
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
  var import_homepage_default = {
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
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
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
  return __toCommonJS(import_homepage_exports);
})();
