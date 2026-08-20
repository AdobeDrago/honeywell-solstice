import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const codeBase = window.hlx?.codeBasePath || '';

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

  // contact column: same-origin white logo on top + address anchored to bottom
  const contact = footer.querySelector('.footer-contact');
  if (contact) {
    // drop any broken/external logo authored in content
    contact.querySelectorAll('picture, img').forEach((el) => (el.closest('p') || el).remove());

    const logo = document.createElement('a');
    logo.className = 'footer-logo';
    logo.href = '/';
    logo.setAttribute('aria-label', 'Solstice home');
    logo.innerHTML = `<img src="${codeBase}/icons/solstice-logo.png" alt="Solstice" loading="lazy">`;
    contact.prepend(logo);

    // group the address lines (everything after the CONTACT US button) so they
    // can be pinned to the bottom of the column
    const dcw = contact.querySelector('.default-content-wrapper');
    const button = dcw?.querySelector('.button-container');
    if (button) {
      const address = document.createElement('div');
      address.className = 'footer-address';
      let node = button.nextElementSibling;
      while (node) {
        const next = node.nextElementSibling;
        address.append(node);
        node = next;
      }
      if (address.children.length) dcw.append(address);
    }
  }

  // turn the LinkedIn text link into the purple social icon
  const social = footer.querySelector('.footer-menu a[href*="linkedin"]');
  if (social) {
    social.classList.remove('button');
    social.closest('.button-container')?.classList.replace('button-container', 'footer-social');
    social.setAttribute('aria-label', social.textContent.trim() || 'LinkedIn');
    social.innerHTML = `<img src="${codeBase}/icons/linkedin.svg" alt="" loading="lazy">`;
  }

  block.append(footer);
}
