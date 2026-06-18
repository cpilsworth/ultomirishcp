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

  // tools/importer/import-ahus-home.js
  var import_ahus_home_exports = {};
  __export(import_ahus_home_exports, {
    default: () => import_ahus_home_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const isSemanticHero = !!(element.querySelector(":scope h1") || element.matches && element.matches("section.hero"));
    const hasAwtArticle = !!element.querySelector("awt-article, [standfirst]");
    if (hasAwtArticle && !isSemanticHero) {
      parseAwtHero(element, document);
    } else if (isSemanticHero) {
      parseSemanticHero(element, document);
    } else {
      parseAwtHero(element, document);
    }
  }
  function parseAwtHero(element, document) {
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
  function parseSemanticHero(element, document) {
    const allImages = Array.from(element.querySelectorAll("img"));
    const bgImage = allImages.find((img) => !img.classList.contains("mobile-hero")) || allImages[0] || null;
    const heading = element.querySelector("h1, h2");
    const subhead = element.querySelector('p.subhead, p[class*="subhead"]');
    const bodyParagraph = Array.from(element.querySelectorAll("p")).find((p) => !p.classList.contains("subhead") && !p.classList.contains("footnote") && !p.classList.contains("button-container") && !p.classList.contains("mobile-only") && !p.closest(".footnotes") && !p.closest(".disclaimer") && p.textContent.trim());
    const ctaLink = element.querySelector('p.button-container a, a.button, a[class*="button"]');
    const footnotes = Array.from(element.querySelectorAll(".footnotes p.footnote, p.footnote"));
    const actorCaption = element.querySelector(".disclaimer p");
    if (!bgImage && !heading && !subhead && !bodyParagraph) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    const contentCell = document.createElement("div");
    if (heading) contentCell.appendChild(heading);
    if (subhead) contentCell.appendChild(subhead);
    if (bodyParagraph) contentCell.appendChild(bodyParagraph);
    if (ctaLink) {
      contentCell.appendChild(ctaLink.closest("p.button-container") || ctaLink);
    }
    footnotes.forEach((fn) => contentCell.appendChild(fn));
    if (actorCaption) {
      const caption = document.createElement("p");
      caption.textContent = actorCaption.textContent.trim();
      contentCell.appendChild(caption);
    }
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse2(element, { document }) {
    const isSemantic = !element.querySelector("awt-article, awt-container[columns-size]") && (element.matches("section.two-col") || element.querySelector(':scope > div > .copy, :scope > div > .image, :scope > div > [class^="col-1-"], :scope > div > [class^="col-2-"]'));
    if (isSemantic) {
      parseSemantic(element, { document });
      return;
    }
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
  function parseSemantic(element, { document }) {
    const buildImageCell = (imageWrap2) => {
      if (!imageWrap2) return null;
      const cell = [];
      const img = imageWrap2.matches("img") ? imageWrap2 : imageWrap2.querySelector("img");
      if (img) cell.push(img);
      const disclaimer = imageWrap2.matches("img") ? null : imageWrap2.querySelector(".disclaimer");
      if (disclaimer) {
        const caption = document.createElement("p");
        const small = document.createElement("small");
        small.textContent = disclaimer.textContent.trim();
        if (small.textContent) {
          caption.append(small);
          cell.push(caption);
        }
      }
      return cell.length ? cell : null;
    };
    const buildTextCell = (nodes) => {
      const sources = Array.isArray(nodes) ? nodes : [nodes];
      const cell = [];
      sources.forEach((source) => {
        if (!source) return;
        source.querySelectorAll(":scope > h2, :scope h2").forEach((h) => {
          if (!cell.includes(h)) cell.push(h);
        });
        source.querySelectorAll(":scope p, :scope a.button, :scope a").forEach((node) => {
          if (node.matches("p.button-container")) return;
          if (cell.includes(node)) return;
          if (node.matches("a")) {
            if (node.querySelector("img") && !node.textContent.trim()) return;
            cell.push(node);
            return;
          }
          if (node.matches("p.footnote")) {
            const small = document.createElement("small");
            small.innerHTML = node.innerHTML.trim();
            const wrap = document.createElement("p");
            wrap.append(small);
            if (wrap.textContent.trim()) cell.push(wrap);
            return;
          }
          if (node.textContent.trim()) cell.push(node);
        });
      });
      return cell.length ? cell : null;
    };
    const inner = element.querySelector(":scope > div") || element;
    const col1 = Array.from(inner.querySelectorAll(':scope > [class^="col-1-"]'));
    const col2 = Array.from(inner.querySelectorAll(':scope > [class^="col-2-"]'));
    if (col1.length || col2.length) {
      const cells2 = [];
      const cell1 = buildTextCell(col1);
      const cell2 = buildTextCell(col2);
      if (cell1) cells2.push(cell1);
      if (cell2) cells2.push(cell2);
      if (!cells2.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, {
        name: "columns-media",
        cells: [cells2]
      });
      element.replaceWith(block2);
      return;
    }
    const imageWrap = inner.querySelector(":scope > .image");
    const copy = inner.querySelector(":scope > .copy");
    let mobileImg = null;
    if (copy) {
      mobileImg = copy.querySelector("img.mobile-hero, img");
    }
    let imageCell = buildImageCell(imageWrap);
    if ((!imageCell || !imageCell.some((n) => n.matches && n.matches("img"))) && mobileImg) {
      imageCell = (imageCell || []).concat(mobileImg);
    }
    if (mobileImg) mobileImg.remove();
    const textCell = buildTextCell(copy);
    const cells = [];
    if (imageCell) cells.push(imageCell);
    if (textCell) cells.push(textCell);
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
  function parse3(element, { document }) {
    const ABSOLUTE_BASE = "https://ultomirishcp.com";
    const toAbsolute = (url) => {
      if (!url) return url;
      try {
        return new URL(url, ABSOLUTE_BASE).href;
      } catch (e) {
        return url;
      }
    };
    const isSemantic = element.matches("section.alexion-resources") || !element.querySelector("awt-article") && element.querySelector(".cta, h2");
    if (isSemantic) {
      const cells2 = [];
      let cards2 = Array.from(element.querySelectorAll(":scope > div > .cta, :scope .cta"));
      if (cards2.length === 0) {
        cards2 = Array.from(element.querySelectorAll(":scope > div > div"));
      }
      cards2 = cards2.filter((c, i, arr) => arr.indexOf(c) === i);
      cards2.forEach((card) => {
        const cardContent = [];
        const img = card.querySelector(".img img, img");
        if (img) {
          const newImg = document.createElement("img");
          newImg.src = toAbsolute(img.getAttribute("src"));
          const alt = img.getAttribute("alt") || "";
          if (alt) newImg.alt = alt;
          cardContent.push(newImg);
        }
        const heading = card.querySelector("h1, h2, h3, h4, h5, h6");
        if (heading && heading.textContent.trim()) {
          cardContent.push(heading);
        }
        const paras = Array.from(card.querySelectorAll(":scope > p")).filter((p) => !p.classList.contains("button-container") && !p.querySelector("a.button"));
        paras.forEach((p) => {
          const text = p.textContent.replace(/\s+/g, " ").trim();
          if (text) {
            const np = document.createElement("p");
            np.textContent = text;
            cardContent.push(np);
          }
        });
        const ctas = Array.from(card.querySelectorAll("p.button-container a, a.button")).filter((c, i, arr) => arr.indexOf(c) === i);
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
          cells2.push([cardContent]);
        }
      });
      if (cells2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "cards-support", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
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

  // tools/importer/parsers/cards-indication.js
  function parse4(element, { document }) {
    const awtCards = Array.from(element.querySelectorAll("awt-text-description-card"));
    const cells = awtCards.length ? parseAwtCards(awtCards, document) : parseSemanticCards(element, document);
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-indication", cells });
    element.replaceWith(block);
  }
  function parseAwtCards(cards, document) {
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
    return cells;
  }
  function parseSemanticCards(element, document) {
    const cells = [];
    let cardEls = Array.from(element.querySelectorAll(":scope > div > div"));
    cardEls = cardEls.filter((el) => el.querySelector("h1, h2, h3, h4"));
    cardEls.forEach((card) => {
      const cellContent = [];
      const heading = card.querySelector("h1, h2, h3, h4");
      if (heading) cellContent.push(heading);
      const paragraphs = Array.from(card.querySelectorAll("p"));
      paragraphs.forEach((p) => cellContent.push(p));
      const links = Array.from(card.querySelectorAll("a[href]"));
      links.forEach((a) => cellContent.push(a));
      if (cellContent.length) {
        cells.push([cellContent]);
      }
    });
    return cells;
  }

  // tools/importer/parsers/accordion-isi.js
  function parse5(element, { document }) {
    const ABSOLUTE_BASE = "https://ultomirishcp.com";
    const toAbsolute = (url) => {
      if (!url) return url;
      if (/^(tel:|mailto:|https?:\/\/|\/\/)/i.test(url) || url.startsWith("#")) {
        try {
          return new URL(url, ABSOLUTE_BASE).href;
        } catch (e) {
          return url;
        }
      }
      try {
        return new URL(url, ABSOLUTE_BASE).href;
      } catch (e) {
        return url;
      }
    };
    const absolutizeLinks = (root) => {
      root.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && !/^(tel:|mailto:)/i.test(href)) {
          a.setAttribute("href", toAbsolute(href));
        }
      });
    };
    const isAwtWarning = element.matches && element.matches("awt-container-warning");
    const isPsp = !isAwtWarning && element.querySelector && (element.matches("div.psp") || element.querySelector(".psp-bar-header, .isi"));
    if (isPsp) {
      const headerEl = element.querySelector(".psp-bar-header");
      const titleText2 = (headerEl ? headerEl.textContent : "Important Safety Information").trim();
      const titleEl2 = document.createElement("p");
      titleEl2.textContent = titleText2 || "Important Safety Information";
      const isiBody = element.querySelector(".isi--ahus") || element.querySelector(".isi--global") || element.querySelector(".isi");
      const contentCell2 = [];
      if (isiBody) {
        const collect = (node) => {
          Array.from(node.children).forEach((child) => {
            const tag = child.tagName;
            if (child.classList && (child.classList.contains("psp-bar") || child.classList.contains("psp-bar-controls") || child.classList.contains("isi-fold") || child.classList.contains("isi-fold-mobile"))) {
              return;
            }
            if (tag === "DIV") {
              collect(child);
              return;
            }
            if (!child.textContent.trim() && !child.querySelector("img, a")) {
              return;
            }
            absolutizeLinks(child);
            contentCell2.push(child);
          });
        };
        collect(isiBody);
      }
      if (contentCell2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const cells2 = [
        [titleEl2, contentCell2]
      ];
      const block2 = WebImporter.Blocks.createBlock(document, { name: "accordion-isi", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
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
      WebImporter.DOMUtils.remove(element, [
        "#hcp-accept-modal",
        // HCP interstitial overlay (id form)
        ".hcp-accept-modal",
        // defensive: same overlay by class
        "dialog.indication-gate-modal"
        // indication gate modals
      ]);
      element.querySelectorAll('.modal, [class*="overlay"], [class*="interstitial"]').forEach((el) => {
        if (el && /this information is intended for us healthcare professionals/i.test(el.textContent || "")) {
          el.remove();
        }
      });
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
        "header",
        // aHUS header (utility + main nav); EDS auto-populates header
        'nav[aria-label="Utility"]',
        // utility nav (defensive aria-label form)
        'nav[aria-label="Main"]',
        // main nav (defensive aria-label form)
        '[role="banner"]',
        // defensive: banner-role header
        "nav#header-links",
        // aHUS utility/indication-selector nav (verified)
        "nav#header-navigation",
        // aHUS main nav (verified)
        "footer",
        // aHUS footer (also matches footer.awt-footer); EDS auto-populates footer
        '[role="contentinfo"]',
        // defensive: contentinfo-role footer
        "aside#get-support-container",
        // "GET SUPPORT" floating widget (verified)
        '[role="complementary"]',
        // defensive: complementary-role widget
        "div.sticky-isi-container",
        // sticky-top DUPLICATE ISI (keep main#main > div.psp)
        "div#back-to-top"
        // back-to-top floating control
      ]);
      element.querySelectorAll('aside, [role="complementary"], .get-support, [class*="get-support"]').forEach((el) => {
        if (el && el.isConnected && /get support/i.test(el.textContent || "")) {
          el.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [
        "#CookieReportsPanel",
        "#CookieReportsOverlay",
        "awt-modal-hcp",
        "#hcp-accept-modal",
        "dialog.indication-gate-modal"
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

  // tools/importer/import-ahus-home.js
  var parsers = {
    "hero-banner": parse,
    "columns-media": parse2,
    "cards-support": parse3,
    "cards-indication": parse4,
    "accordion-isi": parse5
  };
  var PAGE_TEMPLATE = {
    name: "ahus-home",
    description: "Atypical-HUS indication microsite home page: hero, media+text promos, support cards, resource cards, references, ISI.",
    urls: ["https://ultomirishcp.com/ahus"],
    blocks: [
      { name: "hero-banner", instances: ["main#main > section.hero"] },
      {
        name: "columns-media",
        instances: [
          "main#main > section#videos-and-podcasts",
          "main#main > section#efficacy-and-safety",
          "main#main > section#dosing-and-admin",
          "main#main > section#about-ahus",
          "main#main > section#about-ultomiris"
        ]
      },
      { name: "cards-support", instances: ["main#main > section.alexion-resources"] },
      { name: "cards-indication", instances: ["main#main > section.end-of-page-ctas"] },
      { name: "accordion-isi", instances: ["main#main > div.psp"] }
    ],
    sections: [
      { id: "n1", name: "Hero", selector: "main#main > section.hero", style: null, blocks: ["hero-banner"], defaultContent: [] },
      { id: "n2", name: "Promo: transitioning patients", selector: "main#main > section#videos-and-podcasts", style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: "n3", name: "Promo: sustained inhibition", selector: "main#main > section#efficacy-and-safety", style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: "n4", name: "Promo pair: half-life + TMA recurrence", selector: "main#main > section#dosing-and-admin", style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: "n5", name: "Promo: understanding aHUS", selector: "main#main > section#about-ahus", style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: "n6", name: "Promo: ULTOMIRIS difference", selector: "main#main > section#about-ultomiris", style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: "n7", name: "Support cards", selector: "main#main > section.alexion-resources", style: null, blocks: ["cards-support"], defaultContent: [] },
      { id: "n8", name: "Resource cards", selector: "main#main > section.end-of-page-ctas", style: "warm-magenta", blocks: ["cards-indication"], defaultContent: [] },
      { id: "n9", name: "References", selector: "main#main > section.references", style: null, blocks: [], defaultContent: ["main#main > section.references"] },
      { id: "n10", name: "Important Safety Information", selector: "main#main > div.psp", style: null, blocks: ["accordion-isi"], defaultContent: [] }
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
  var import_ahus_home_default = {
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
  return __toCommonJS(import_ahus_home_exports);
})();
