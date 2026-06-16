/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: ultomirishcp.com site-wide cleanup.
 *
 * This is a Lit-based custom-element CMS. The selectors below were all verified
 * against the captured DOM in migration-work/cleaned.html (indication-landing)
 * and migration-work/homepage-analysis/cleaned.html (homepage), which share the
 * same site chrome. Nothing here is guessed.
 *
 * Removes site chrome / non-authorable noise so only the page content inside
 * <section id="content" class="awt-content"> survives for block parsing. EDS
 * auto-populates the real header and footer, so the source header/footer/nav and
 * cookie/consent UI must not appear in the import.
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

    // Belt-and-suspenders for the consent/modal UI in case it is injected late.
    WebImporter.DOMUtils.remove(element, [
      '#CookieReportsPanel',
      '#CookieReportsOverlay',
      'awt-modal-hcp',
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
