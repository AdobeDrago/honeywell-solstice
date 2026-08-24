import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const codeBase = window.hlx?.codeBasePath || '';

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > a');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
  const crumbs = [];

  const homeUrl = document.querySelector('.nav-brand a[href]').href;

  let menuItem = Array.from(nav.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
    } while (menuItem);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  const placeholders = await fetchPlaceholders();
  const homePlaceholder = placeholders.breadcrumbsHomeLabel || 'Home';

  crumbs.unshift({ title: homePlaceholder, url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1].url = null;
  }
  crumbs[crumbs.length - 1]['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(document.querySelector('.nav-sections'), document.location.href);

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));

  breadcrumbs.append(ol);
  return breadcrumbs;
}

/**
 * Turns author-friendly links that were auto-decorated as buttons back into
 * plain nav links (the header renders text links, not pill buttons).
 * @param {Element} scope The element to clean up
 */
function stripButtons(scope) {
  if (!scope) return;
  scope.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
  scope.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));
}

/**
 * Returns markup for an icon rendered as a same-origin <img> (so it is never
 * broken by the media pipeline and can be forced white on the dark bands).
 * @param {string} name icon file name without extension
 * @returns {string}
 */
function iconMarkup(name) {
  return `<span class="icon icon-${name}"><img src="${codeBase}/icons/${name}.svg" alt="" loading="lazy"></span>`;
}

/**
 * Prepends an icon to a link if it does not already have one.
 * @param {Element} link
 * @param {string} name icon file name without extension
 */
function ensureLeadingIcon(link, name) {
  if (!link || link.querySelector('.icon')) return;
  link.insertAdjacentHTML('afterbegin', iconMarkup(name));
}

/**
 * Builds the shopping-cart control shown in the utility bar.
 * @returns {HTMLElement}
 */
function buildCart() {
  const cart = document.createElement('a');
  cart.className = 'nav-cart';
  cart.href = '/us/en/cart';
  cart.setAttribute('aria-label', 'Cart');
  cart.innerHTML = iconMarkup('cart');
  return cart;
}

/**
 * Places the utility links in the top black bar (desktop) or inside the
 * expandable mobile menu (mobile), keeping a single source of truth.
 * @param {Element} nav The main nav element (#nav)
 * @param {Element} utilityInner The inner wrapper of the black utility band
 * @param {Element} utility The utility links element (.nav-utility)
 */
function placeUtility(nav, utilityInner, utility) {
  if (!utility) return;
  if (isDesktop.matches) {
    // top black bar, ahead of the cart control
    utilityInner.prepend(utility);
  } else {
    // inside the mobile overlay, below the main sections
    const navSections = nav.querySelector('.nav-sections');
    if (navSections) navSections.after(utility);
    else nav.append(utility);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  let navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  // Local `aem up --html-folder content` serves this project's docs under
  // /content/*; the nav fragment lives at /content/nav. Prefer it when present,
  // falling back to /nav for production/default hosting.
  if (!navMeta) {
    try {
      const localNav = await fetch('/content/nav.plain.html', { method: 'HEAD' });
      if (localNav.ok) navPath = '/content/nav';
    } catch (e) { /* fall back to /nav */ }
  }
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  // pull the fragment sections out into a working list before we re-home them
  const sources = [...fragment.children];
  const [alertSrc, brandSrc, sectionsSrc, toolsSrc, utilitySrc] = sources;

  // classify each fragment section
  const classes = ['alert', 'brand', 'sections', 'tools', 'utility'];
  sources.forEach((section, i) => {
    if (section && classes[i]) section.classList.add(`nav-${classes[i]}`);
  });

  // --- brand: swap in the on-brand (same-origin, white) logo ---
  // The brand may be authored as a link, plain text, or a `:solstice-logo:`
  // icon token; normalize any of these to a home link wrapping the logo image
  // so it never depends on an external asset or a matching SVG icon file.
  const navBrand = brandSrc;
  if (navBrand) {
    // undo any button auto-decoration on the brand link
    stripButtons(navBrand);
    const holder = navBrand.querySelector('.default-content-wrapper') || navBrand;
    let brandLink = holder.querySelector('a');
    const label = (brandLink && brandLink.textContent.trim()) || navBrand.textContent.trim() || 'Solstice';
    if (!brandLink) {
      brandLink = document.createElement('a');
      brandLink.href = '/';
      holder.textContent = '';
      holder.append(brandLink);
    }
    brandLink.setAttribute('aria-label', label);
    brandLink.innerHTML = `<img class="nav-logo" src="${codeBase}/icons/solstice-logo.png" alt="${label}">`;
  }

  // --- sections: render as plain text links (no pill buttons) ---
  const navSections = sectionsSrc;
  if (navSections) {
    stripButtons(navSections);
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // --- tools: search control ---
  const navTools = toolsSrc;
  if (navTools) {
    stripButtons(navTools);
    const search = navTools.querySelector('a[href*="search"]') || navTools.querySelector('a');
    if (search) {
      const labelText = search.textContent.trim();
      ensureLeadingIcon(search, 'search');
      // wrap the visible label so it can be hidden on mobile (icon-only)
      const iconSpan = search.querySelector('.icon');
      search.textContent = '';
      search.append(iconSpan);
      if (labelText) {
        const label = document.createElement('span');
        label.className = 'nav-label';
        label.textContent = labelText;
        search.append(label);
      }
      search.setAttribute('aria-label', labelText || 'Search');
    }
  }

  // --- utility: add the language globe + flag the sign-in affordance ---
  const navUtility = utilitySrc;
  if (navUtility) {
    stripButtons(navUtility);
    navUtility.querySelectorAll('a').forEach((a) => {
      const text = a.textContent.trim().toLowerCase();
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#lang') || href.includes('language') || /\(en\)|united states/.test(text)) {
        ensureLeadingIcon(a, 'globe');
        a.classList.add('nav-language');
      }
      if (text === 'sign in') a.classList.add('nav-signin');
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));

  // assemble the main (purple) bar: hamburger, brand, sections, tools
  nav.append(hamburger);
  if (navBrand) nav.append(navBrand);
  if (navSections) nav.append(navSections);
  if (navTools) nav.append(navTools);

  nav.setAttribute('aria-expanded', 'false');

  // build the band wrappers — each band is full-bleed (background) with an
  // inner element constrained to the page width.
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';

  const makeBand = (modifier, inner) => {
    const band = document.createElement('div');
    band.className = `nav-bar nav-bar-${modifier}`;
    const wrap = document.createElement('div');
    wrap.className = 'nav-bar-inner';
    wrap.append(...inner);
    band.append(wrap);
    return band;
  };

  // band 1: alert (black)
  if (alertSrc) navWrapper.append(makeBand('alert', [alertSrc]));

  // band 2: utility (black) — cart lives here; links are placed responsively
  const utilityBar = makeBand('utility', [buildCart()]);
  navWrapper.append(utilityBar);
  const utilityInner = utilityBar.querySelector('.nav-bar-inner');

  // band 3: main (purple)
  navWrapper.append(makeBand('main', [nav]));

  // place utility links for the current breakpoint
  placeUtility(nav, utilityInner, navUtility);

  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => {
    placeUtility(nav, utilityInner, navUtility);
    toggleMenu(nav, navSections, isDesktop.matches);
  });

  block.append(navWrapper);

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
