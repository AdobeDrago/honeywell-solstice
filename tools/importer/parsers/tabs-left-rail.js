/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: tabs-left-rail
 * Base block: tabs-left-rail (container block; each child item = one tab row)
 * Source: https://www.solstice.com/us/en/about-us/solstice-advanced-materials-history-and-brand-transition
 * Generated: 2026-08-20
 *
 * Library convention: 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one tab: Column 1 = Tab Label, Column 2 = Tab Content
 * (headings, links, images, richtext).
 *
 * xwalk model (tabs-left-rail-item):
 *   - Column 1 -> field:title (tab label)
 *   - Column 2 -> field:content_richtext (panel rich text: headings + paragraphs)
 *
 * Source DOM:
 *   - Tab labels: ul.left-rail-tabs > li > a[href="#panelId"]
 *   - Panels: .tab-content > .tab-pane, matched to the anchor href by panel id.
 */
export default function parse(element, { document }) {
  // Tab labels — anchors inside the left-rail tab list (validated against source.html).
  const tabLinks = Array.from(
    element.querySelectorAll('ul.left-rail-tabs > li > a[href], ul.nav-tabs > li > a[href], .left-rail-tabs a[href^="#"]'),
  );

  // Panel container holding the .tab-pane elements.
  const panelContainer = element.querySelector('.tab-content, [class*="tab-content"]');

  const cells = [];

  tabLinks.forEach((link) => {
    // Tab label text (prefer the explicit data attribute, fall back to link text).
    const labelText = (link.getAttribute('data-leftrail-item') || link.textContent || '').trim();
    if (!labelText) return;

    // Resolve the matching panel via the anchor href (#panelId).
    const href = link.getAttribute('href') || '';
    const panelId = href.startsWith('#') ? href.slice(1) : href;
    let panel = null;
    if (panelId) {
      const scope = panelContainer || element;
      panel = scope.querySelector(`[id="${panelId}"]`);
    }

    // Column 1: tab label — wrapped in a <p> so it is a real element in the cell.
    const titleP = document.createElement('p');
    titleP.textContent = labelText;
    const titleCell = [document.createComment(' field:title '), titleP];

    // Column 2: panel content — preserve headings and paragraphs as rich text.
    const contentCell = [];
    if (panel) {
      const contentNodes = Array.from(
        panel.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote'),
      ).filter((node) => {
        // Drop paragraphs/headings already nested inside a captured list/blockquote
        // to avoid duplication.
        const container = node.closest('ul, ol, blockquote');
        return !container || container === node;
      });
      if (contentNodes.length > 0) {
        contentCell.push(document.createComment(' field:content_richtext '));
        contentCell.push(...contentNodes);
      }
    }

    cells.push([titleCell, contentCell]);
  });

  // Empty-block guard: no tabs found — unwrap rather than emit a broken block.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-left-rail', cells });
  element.replaceWith(block);
}
