/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ultomirishcp.com site-wide cleanup.
 *
 * This site spans TWO distinct design systems and this single transformer runs
 * on every template, so the removals are additive and self-guarding:
 *
 *   1. The main awt-* Lit custom-element CMS (homepage, indication-landing).
 *      Selectors verified against migration-work/homepage-analysis/cleaned.html
 *      and migration-work/cleaned.html (prior captures). Real content lives in
 *      <section id="content" class="awt-content">.
 *
 *   2. The /ahus microsite (ahus-home), a COMPLETELY DIFFERENT, standard
 *      semantic-HTML design system (NOT awt-* Lit elements). Selectors verified
 *      against migration-work/cleaned.html and migration-work/ahus-main.html.
 *      Real content lives in <main id="main">.
 *
 * Nothing here is guessed. WebImporter.DOMUtils.remove no-ops when a selector
 * matches nothing, so the awt-* removals are harmless on the aHUS DOM and vice
 * versa. EDS auto-populates the real header and footer on every template, so all
 * source header/footer/nav and cookie/consent UI must be stripped from the import.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Modals / overlays / consent UI that would otherwise pollute parsing.
    // Found in captured DOM:
    //   <awt-modal-hcp> ... "I am a US healthcare professional" gateway interstitial
    //     (sits INSIDE #content right before </section>, so it must go before parsing)
    //   <div id="CookieReportsPanel"> wrapping <div id="CookieReportsOverlay">
    //     and the "Privacy Preferences" dialog (#CookieReportsBannerAZ)
    WebImporter.DOMUtils.remove(element, [
      'awt-modal-hcp',          // HCP "healthcare professionals only" gateway modal
      '#CookieReportsPanel',    // cookie consent panel (contains overlay + Privacy Preferences dialog)
      '#CookieReportsOverlay',  // defensive: overlay in case it is rendered as a sibling
    ]);

    // Empty in-page anchor stub found in captured DOM: <awt-container id="isi-container"></awt-container>
    WebImporter.DOMUtils.remove(element, ['#isi-container']);

    // --- /ahus microsite chrome (standard semantic HTML) ---------------------
    // Overlays / modals removed before parsing so they don't pollute block
    // matching. All found in migration-work/cleaned.html:
    //   <div class="modal hcp-accept-modal" id="hcp-accept-modal"> ...
    //     "This information is intended for US healthcare professionals" with
    //     "OK" / "Visit patient site" buttons (the HCP interstitial overlay)
    //   <dialog class="modal indication-gate-modal" id="..."> ... indication
    //     gate dialogs (also duplicated inside <nav id="header-navigation">)
    WebImporter.DOMUtils.remove(element, [
      '#hcp-accept-modal',         // HCP interstitial overlay (id form)
      '.hcp-accept-modal',         // defensive: same overlay by class
      'dialog.indication-gate-modal', // indication gate modals
    ]);

    // Fallback: detect the HCP interstitial overlay by its text in case neither
    // the id nor the class is present in a future capture. Guarded so it no-ops
    // when the overlay is absent (e.g. on the awt-* templates).
    element.querySelectorAll('.modal, [class*="overlay"], [class*="interstitial"]').forEach((el) => {
      if (el && /this information is intended for us healthcare professionals/i.test(el.textContent || '')) {
        el.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome. All selectors found in captured DOM:
    //   <div class="awt-skip-bar"> ... <a href="#content">Skip to Content</a>
    //   <awt-top-notification> ... top notification bar
    //   <awtcustom-header class="header-dropdown ..."> ... site header / megamenu
    //   <footer class="awt-footer"> ... site footer
    WebImporter.DOMUtils.remove(element, [
      '.awt-skip-bar',        // skip-to-content link bar
      'awt-top-notification', // top notification bar
      'awtcustom-header',     // site header / nav (EDS auto-populates header)
      'footer.awt-footer',    // site footer (EDS auto-populates footer)
    ]);

    // --- /ahus microsite chrome (standard semantic HTML) ---------------------
    // Non-authorable chrome verified in migration-work/cleaned.html. These are
    // siblings of <main id="main"> (or live outside it) and EDS auto-populates
    // the header/footer, so they must not appear in the import:
    //   <header class="fixed"> ... utility nav + main nav (auto-populated header)
    //   <nav id="header-links"> / <nav id="header-navigation"> ... site nav
    //   <footer> ... plain semantic footer (auto-populated footer)
    //   <aside id="get-support-container"> ... floating "GET SUPPORT" widget
    //   <div class="sticky-isi-container"> ... sticky-TOP DUPLICATE of the ISI
    //     (the canonical in-flow ISI is main#main > div.psp and is kept)
    //   <div id="back-to-top"> ... back-to-top floating control
    //   <img src="https://beacon..."> ... tracking beacon after </main>
    WebImporter.DOMUtils.remove(element, [
      'header',                   // aHUS header (utility + main nav); EDS auto-populates header
      'nav[aria-label="Utility"]',// utility nav (defensive aria-label form)
      'nav[aria-label="Main"]',   // main nav (defensive aria-label form)
      '[role="banner"]',          // defensive: banner-role header
      'nav#header-links',         // aHUS utility/indication-selector nav (verified)
      'nav#header-navigation',    // aHUS main nav (verified)
      'footer',                   // aHUS footer (also matches footer.awt-footer); EDS auto-populates footer
      '[role="contentinfo"]',     // defensive: contentinfo-role footer
      'aside#get-support-container', // "GET SUPPORT" floating widget (verified)
      '[role="complementary"]',   // defensive: complementary-role widget
      'div.sticky-isi-container', // sticky-top DUPLICATE ISI (keep main#main > div.psp)
      'div#back-to-top',          // back-to-top floating control
    ]);

    // Fallback: remove any remaining "GET SUPPORT" complementary widget by text
    // if neither the id nor the role matched. Guarded to no-op when absent.
    element.querySelectorAll('aside, [role="complementary"], .get-support, [class*="get-support"]').forEach((el) => {
      if (el && el.isConnected && /get support/i.test(el.textContent || '')) {
        el.remove();
      }
    });

    // Belt-and-suspenders for the consent/modal UI in case it is injected late.
    WebImporter.DOMUtils.remove(element, [
      '#CookieReportsPanel',
      '#CookieReportsOverlay',
      'awt-modal-hcp',
      '#hcp-accept-modal',
      'dialog.indication-gate-modal',
    ]);

    // Safe leftover element removal (present-or-not handled by DOMUtils.remove).
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
    ]);

    // Strip Lit dev-mode comment nodes and other HTML comments (e.g.
    // "<!-- Modal HCP type (appears when window loaded) -->" and the
    // "Google Tag Manager (noscript)" markers found in captured DOM).
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
