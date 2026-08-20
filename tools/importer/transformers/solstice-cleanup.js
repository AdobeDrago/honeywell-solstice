/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Solstice site-wide cleanup.
 *
 * Header/footer/nav are experience-fragment site chrome and are already
 * excluded from the scraped DOM, so this cleanup focuses on:
 *  - removing non-authorable leftover elements (scripts, iframes, links,
 *    noscript, style/source tags) that can appear in AEM-rendered markup
 *  - stripping AEM/analytics runtime attributes that are not authorable
 *
 * All selectors/attributes below were verified against
 * migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove non-authorable runtime/embed elements before block parsing so
    // they cannot interfere with selector matching.
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'style',
      'iframe',
      'link',
    ]);

    // Remove site chrome. The live import re-renders the full page (header,
    // footer, breadcrumb, alerts, sign-in modals, cookie/consent panels), so
    // strip everything that isn't the main body content. Header and footer are
    // experience fragments (.experiencefragment); the main content section is a
    // plain .responsivegrid and is NOT an experience fragment, so removing all
    // experience fragments safely removes header + footer chrome.
    WebImporter.DOMUtils.remove(element, [
      '.experiencefragment',
      '.access-check-main',
      '.signinvalidationscreens',
      '.pagealert',
      '.globalnotification',
      '.breadcrumb',
      'aside.modals',
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#ot-sdk-btn-floating',
      // Mobile duplicate of the left-rail content (same tabs rendered as an
      // accordion). The desktop container (.left-rail-container-desktop) is the
      // parsed block; removing the accordion prevents duplicate loose content.
      '.left-rail-accordion',
      // Third-party tracking pixels (rlcdn, cookielaw) that render as stray imgs.
      'img[src*="rlcdn.com"]',
      'img[src*="cookielaw.org"]',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Strip AEM/analytics runtime attributes present in the captured DOM.
    // These are not authorable and add noise to the imported markdown.
    // Verified in cleaned.html: data-analytics-v2, data-target, data-toggle,
    // data-leftrail-item, aria-busy, role.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-analytics-v2');
      el.removeAttribute('data-target');
      el.removeAttribute('data-leftrail-item');
      el.removeAttribute('aria-busy');
      el.removeAttribute('onclick');
      el.removeAttribute('data-track');
    });
  }
}
