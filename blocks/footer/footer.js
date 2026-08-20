import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  let footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  // Local `aem up --html-folder content` serves this project's docs under
  // /content/*; the footer fragment lives at /content/footer. Prefer it when
  // present, falling back to /footer for production/default hosting.
  if (!footerMeta) {
    try {
      const localFooter = await fetch('/content/footer.plain.html', { method: 'HEAD' });
      if (localFooter.ok) footerPath = '/content/footer';
    } catch (e) { /* fall back to /footer */ }
  }
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // label the top-level sections so CSS can lay out the columns + legal bar
  const columns = footer.querySelectorAll(':scope > div');
  const columnClasses = ['footer-contact', 'footer-menu', 'footer-quicklinks', 'footer-legal'];
  columns.forEach((col, i) => {
    if (columnClasses[i]) col.classList.add(columnClasses[i]);
  });

  block.append(footer);
}
