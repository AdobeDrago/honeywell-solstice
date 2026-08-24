import { getMetadata } from '../../scripts/aem.js';

const codeBase = window.hlx?.codeBasePath || '';

// leading path segments treated as locale (country / language), e.g. /us/en/
const LOCALE_RE = /^[a-z]{2}$/;

// short words that stay lowercase when title-casing a slug
const SMALL_WORDS = new Set(['and', 'or', 'the', 'of', 'to', 'a', 'an', 'for', 'in', 'on', 'with']);

/**
 * Turns a URL slug into a human label, e.g. "about-us" -> "About Us".
 * @param {string} slug
 * @returns {string}
 */
function titleCase(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word)
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

/**
 * Builds a breadcrumb trail from the current URL path. The trail skips locale
 * segments, links every ancestor, and shows the current page (from its title)
 * as plain text.
 * @param {Element} block The breadcrumbs block element
 */
export default function decorate(block) {
  const segments = window.location.pathname.split('/').filter(Boolean);

  // peel off leading locale segments (kept in the links, not shown as crumbs)
  const rest = [...segments];
  const locale = [];
  while (rest.length > 1 && LOCALE_RE.test(rest[0])) locale.push(rest.shift());
  const localePath = locale.length ? `/${locale.join('/')}` : '';

  const crumbs = [{ home: true, url: `${localePath}/` }];

  let acc = localePath;
  rest.forEach((segment, i) => {
    acc += `/${segment}`;
    const isLast = i === rest.length - 1;
    crumbs.push({
      label: isLast ? (getMetadata('og:title') || titleCase(segment)) : titleCase(segment),
      url: isLast ? null : acc,
    });
  });

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    if (i === crumbs.length - 1) li.setAttribute('aria-current', 'page');

    if (crumb.home) {
      const a = document.createElement('a');
      a.href = crumb.url;
      a.className = 'breadcrumb-home';
      a.setAttribute('aria-label', 'Home');
      a.innerHTML = `<img src="${codeBase}/icons/breadcrumb-home.svg" alt="Home" width="26" height="26">`;
      li.append(a);
    } else if (crumb.url) {
      const a = document.createElement('a');
      a.href = crumb.url;
      a.textContent = crumb.label;
      li.append(a);
    } else {
      li.append(document.createTextNode(crumb.label));
    }
    ol.append(li);
  });

  nav.append(ol);
  block.textContent = '';
  block.append(nav);
}
