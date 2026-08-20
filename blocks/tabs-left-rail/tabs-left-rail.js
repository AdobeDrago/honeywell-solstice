// Tabs (left-rail variant)
// Desktop: a bordered left rail of tab buttons + a content panel to the right.
// Mobile: an accordion — each button is full width and its panel expands
// directly beneath it (all collapsed by default).

const isDesktop = window.matchMedia('(min-width: 900px)');

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

export default async function decorate(block) {
  tabBlockCnt += 1;
  const rows = [...block.children].filter((row) => row.children.length >= 2);

  const rail = document.createElement('div');
  rail.className = 'tabs-left-rail-list';
  rail.setAttribute('role', 'tablist');
  rail.id = `tablist-${tabBlockCnt}`;

  const buttons = [];
  const panels = [];

  rows.forEach((row, i) => {
    const id = `tlr-${tabBlockCnt}-${i + 1}`;
    const [titleCell, contentCell] = row.children;

    // the content cell becomes the tab panel
    const panel = contentCell;
    panel.className = 'tabs-left-rail-panel';
    panel.id = `panel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panels.push(panel);

    // group any "excerpt" run into a callout box (fallback when the content
    // was not authored as a blockquote)
    if (!panel.querySelector('blockquote')) {
      const paras = [...panel.querySelectorAll(':scope > p')];
      const marker = paras.find((p) => p.textContent.trim().toUpperCase() === 'RELEVANT FORM 10 EXCERPT');
      if (marker) {
        const callout = document.createElement('blockquote');
        marker.before(callout);
        let node = callout.nextElementSibling;
        while (node) {
          const next = node.nextElementSibling;
          callout.append(node);
          node = next;
        }
      }
    }

    // build the tab button from the title cell
    const button = document.createElement('button');
    button.className = 'tabs-left-rail-tab';
    button.id = `tab-${id}`;
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `panel-${id}`);
    button.innerHTML = titleCell.innerHTML;
    buttons.push(button);

    row.remove();
  });

  // panels live directly under the block; the rail/buttons are positioned by layout()
  panels.forEach((panel) => block.append(panel));

  let active = -1;

  function render() {
    buttons.forEach((btn, j) => {
      const on = j === active;
      btn.setAttribute('aria-selected', on);
      btn.setAttribute('aria-expanded', on);
      panels[j].setAttribute('aria-hidden', !on);
    });
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      // desktop = tabs (always one selected); mobile = accordion (toggle)
      active = (!isDesktop.matches && active === i) ? -1 : i;
      render();
    });
  });

  function layout() {
    if (isDesktop.matches) {
      buttons.forEach((btn) => rail.append(btn));
      block.prepend(rail);
      if (active === -1) active = 0; // desktop always shows a panel
    } else {
      rail.remove();
      panels.forEach((panel, i) => panel.before(buttons[i]));
    }
    render();
  }

  // initial state: first tab open on desktop, all collapsed on mobile
  active = isDesktop.matches ? 0 : -1;
  layout();
  isDesktop.addEventListener('change', layout);
}
