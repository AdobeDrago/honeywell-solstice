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

  // tools/importer/import-about-content-page.js
  var import_about_content_page_exports = {};
  __export(import_about_content_page_exports, {
    default: () => import_about_content_page_default
  });

  // tools/importer/parsers/tabs-left-rail.js
  function parse(element, { document }) {
    const tabLinks = Array.from(
      element.querySelectorAll('ul.left-rail-tabs > li > a[href], ul.nav-tabs > li > a[href], .left-rail-tabs a[href^="#"]')
    );
    const panelContainer = element.querySelector('.tab-content, [class*="tab-content"]');
    const cells = [];
    tabLinks.forEach((link) => {
      const labelText = (link.getAttribute("data-leftrail-item") || link.textContent || "").trim();
      if (!labelText) return;
      const href = link.getAttribute("href") || "";
      const panelId = href.startsWith("#") ? href.slice(1) : href;
      let panel = null;
      if (panelId) {
        const scope = panelContainer || element;
        panel = scope.querySelector(`[id="${panelId}"]`);
      }
      const titleP = document.createElement("p");
      titleP.textContent = labelText;
      const titleCell = [document.createComment(" field:title "), titleP];
      const contentCell = [];
      if (panel) {
        const contentNodes = Array.from(
          panel.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")
        ).filter((node) => {
          const container = node.closest("ul, ol, blockquote");
          return !container || container === node;
        });
        if (contentNodes.length > 0) {
          contentCell.push(document.createComment(" field:content_richtext "));
          contentCell.push(...contentNodes);
        }
      }
      cells.push([titleCell, contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-left-rail", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/solstice-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "script",
        "noscript",
        "style",
        "iframe",
        "link"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".experiencefragment",
        ".access-check-main",
        ".signinvalidationscreens",
        ".pagealert",
        ".globalnotification",
        ".breadcrumb",
        "aside.modals",
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#ot-sdk-btn-floating",
        // Mobile duplicate of the left-rail content (same tabs rendered as an
        // accordion). The desktop container (.left-rail-container-desktop) is the
        // parsed block; removing the accordion prevents duplicate loose content.
        ".left-rail-accordion",
        // Third-party tracking pixels (rlcdn, cookielaw) that render as stray imgs.
        'img[src*="rlcdn.com"]',
        'img[src*="cookielaw.org"]'
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-analytics-v2");
        el.removeAttribute("data-target");
        el.removeAttribute("data-leftrail-item");
        el.removeAttribute("aria-busy");
        el.removeAttribute("onclick");
        el.removeAttribute("data-track");
      });
    }
  }

  // tools/importer/import-about-content-page.js
  var parsers = {
    "tabs-left-rail": parse
  };
  var PAGE_TEMPLATE = {
    name: "about-content-page",
    description: "About Us content page with a left-rail tabbed navigation and body content covering company history and brand transition",
    urls: [
      "https://www.solstice.com/us/en/about-us/solstice-advanced-materials-history-and-brand-transition"
    ],
    blocks: [
      {
        name: "tabs-left-rail",
        instances: [
          ".cmp-leftrail-enhanced .left-rail-container-desktop"
        ]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Body Content",
        selector: "body > main > div.root.responsivegrid > div.aem-Grid.aem-Grid--12.aem-Grid--default--12 > div.responsivegrid.aem-GridColumn.aem-GridColumn--default--12",
        style: null,
        blocks: ["tabs-left-rail"],
        defaultContent: [".left-rail-heading p.label1"]
      }
    ]
  };
  var transformers = [
    transform,
    // Section transformer added only when template has 2+ sections
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_about_content_page_default = {
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
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
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
  return __toCommonJS(import_about_content_page_exports);
})();
