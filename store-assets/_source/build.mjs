// Builds all store images (screenshots + promo tiles) with headless Edge.
//   node store-assets/_source/build.mjs            -> everything
//   node store-assets/_source/build.mjs 3 promo    -> only screenshot 3 and the promo tiles
//
// What you see in the images is REAL:
//   - the popup is the real popup.html / popup.css / popup.js, run with a small chrome.* stub and made-up example data
//   - the results page is a simplified, made-up page (example sites on the reserved .example domain) on which the
//     REAL content scripts (link_filter.js, operators_panel.js, image_tools.js) run, so the block / star buttons,
//     the highlight, the hidden modules, the scroll buttons and the "Advanced Tools" panel are drawn by the extension itself.
// Only the page around them (headline, background, fake results) is drawn here. Rebuild after UI or script changes.
import { render } from './render.mjs';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');            // extension root
const out = path.join(here, '..');                   // store-assets/
const tmp = mkdtempSync(path.join(os.tmpdir(), 'so-shots-'));
const url = (p) => 'file:///' + p.replace(/\\/g, '/');

const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const popupCss = readFileSync(path.join(root, 'popup.css'), 'utf8');
const logoUri = 'data:image/svg+xml;base64,' + readFileSync(path.join(out, 'brand', 'logo.svg')).toString('base64');

// ── Theme: take the light/dark colour variables straight from popup.css ─────────────
const rootBlocks = [...popupCss.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1]);
const themeCss = {
  light: `:root{${rootBlocks[0]};color-scheme:light}`,
  dark: `:root{${rootBlocks[0]};${rootBlocks[1]};color-scheme:dark}`,
};

// ── Example data (made up on purpose: reserved .example domains, no real sites) ─────
const exampleStore = () => ({
  infiniteScroll: true, advancedSearch: true, navBtnsEnabled: true, highlightEnabled: true,
  googleModules: { ai: true, ask: true, sponsored: true, pasf: true, knowledge: false, videos: true },
  hiddenTabs: { more: true, finance: true, flights: true, books: true },
  searchFilters: ['topten-lists.example', 'clickfeed.example', 'listicle-hub.example', 'coupon-spam.example'],
  blockedKeywords: [],
  highlightFilters: ['runnersguide.example'],
  highlightKeywords: ['tested', 'official'],
  themeColors: { p: '#4fd1e6', b: '#0f172a', s: '#1e293b' },
  highlightColor: '#4fd1e6', navBtnColor: '#4fd1e6', navBtnBgColor: '#1e293b',
});

/** The real popup as a standalone page. tab: general|google|filters|design|fun. expand: ids of section headers to open. */
function popupPage(name, { tab = 'general', theme = 'dark', expand = [] } = {}) {
  let html = readFileSync(path.join(root, 'popup.html'), 'utf8');
  const stub = `<script>
    const __store = ${JSON.stringify(exampleStore())};
    const clone = (o) => JSON.parse(JSON.stringify(o));
    window.chrome = {
      runtime: { getManifest: () => ({ version: ${JSON.stringify(manifest.version)} }) },
      storage: {
        local: { get: async () => clone(__store), set: async (d) => { Object.assign(__store, d); }, clear: async () => {} },
        onChanged: { addListener: () => {} } },
      tabs: { query: async () => [], sendMessage: () => Promise.resolve(), create: () => {} } };
  </script>`;
  const after = `<script>window.addEventListener('load', () => setTimeout(() => {
      document.querySelector('.tab-btn[data-tab="tab-${tab}"]').click();
      ${JSON.stringify(expand)}.forEach((id) => document.getElementById(id).click());
    }, 80));</script>`;
  html = html
    .replace('href="popup.css"', `href="${url(path.join(root, 'popup.css'))}"`)
    // no transitions (otherwise a tab switch can be captured half-way); hide the version so images don't date
    .replace('</head>', `<style>${themeCss[theme]}*,*::before,*::after{transition:none!important;animation:none!important}.badge{visibility:hidden}</style></head>`)
    .replace('<script src="popup.js"></script>', `${stub}<script src="${url(path.join(root, 'popup.js'))}"></script>${after}`);
  const file = path.join(tmp, `popup-${name}.html`);
  writeFileSync(file, html);
  return url(file);
}

// ── Simplified results page with the real content scripts ───────────────────────────
const DOTS = 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z';
const RESULTS = [
  ['runnersguide.example', 'Runner’s Guide', 'Best Running Shoes of 2026, Tested and Ranked', 'We ran 400 miles in 30 pairs to find the best running shoes for road, trail and everyday training.'],
  ['topten-lists.example', 'TopTen Lists', 'Top 10 Running Shoes You Won’t Believe', 'Number 7 will surprise you. Click through 10 pages to see the full list of shoes.'],
  ['answerfarm.example', 'Answer Farm', 'Best running shoes? 14 answers', 'Asked 3 years ago · Answers vary a lot, most of them are copied from other sites.'],
  ['gearlab.example', 'Gear Lab', 'Running Shoe Reviews and Buying Guide', 'Independent lab tests for cushioning, weight and durability, with a size and fit guide.'],
  ['trailnotes.example', 'Trail Notes', 'How to Choose Running Shoes: A Beginner’s Guide', 'Pronation, drop, stack height and why the right fit matters more than the brand.'],
  ['marathonhub.example', 'Marathon Hub', 'Running Shoes for Marathon Training', 'What our coaches wear for long runs, tempo days and race day.'],
];
const result = ([domain, name, title, snippet]) => `
  <div class="MjjYud"><div class="g">
    <div class="top"><span class="fav" style="background:${favColor(domain)}"></span>
      <div class="site"><div class="nm">${name}</div><div class="u">https://${domain} › running-shoes</div></div>
      <div role="button" aria-haspopup="true" class="dots"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="${DOTS}"/></svg></div>
    </div>
    <a href="https://${domain}/running-shoes"><h3>${title}</h3></a>
    <div class="snip">${snippet}</div>
  </div></div>`;
const favColor = (d) => ['#ff8a5c', '#7c8cff', '#43c59e', '#e879c9', '#f5b73d', '#5aa9ff'][d.length % 6];

const serpCss = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#202124;color:#bdc1c6;font-family:Arial,"Segoe UI",sans-serif;font-size:14px}
  body{padding:0 0 0 24px}
  .hdr{position:sticky;top:0;z-index:100;background:#202124;margin-left:-24px;padding-left:24px}
  #searchform{padding:18px 24px 0 0}
  .bar{display:flex;align-items:center;height:46px;border-radius:24px;background:#303134;padding:0 12px 0 18px;gap:10px;max-width:640px}
  .bar input{flex:1;background:transparent;border:0;outline:0;color:#e8eaed;font-size:16px}
  .bar svg{flex:none;color:#9aa0a6}
  .mic{display:flex;align-items:center;justify-content:center;width:36px;height:36px;color:#9aa0a6}
  #hdtb{display:flex;gap:24px;padding:14px 0 0 4px;border-bottom:1px solid #3c4043;max-width:664px;margin-bottom:6px}
  #hdtb a{padding:6px 2px 10px;color:#9aa0a6;text-decoration:none;font-size:14px;border-bottom:3px solid transparent}
  #hdtb a.on{color:#8ab4f8;border-bottom-color:#8ab4f8}
  #center_col{max-width:664px;padding-right:24px}
  .stats{color:#9aa0a6;font-size:13px;margin:10px 0 4px}
  .MjjYud{margin:14px 0 22px}
  .top{display:flex;align-items:center;gap:10px;margin-bottom:5px}
  .fav{width:26px;height:26px;border-radius:50%;flex:none}
  .site{min-width:0}
  .nm{color:#e8eaed;font-size:14px;line-height:1.2}
  .u{color:#9aa0a6;font-size:12px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dots{margin-left:auto;display:flex;align-items:center;justify-content:center;width:30px;height:30px;color:#9aa0a6}
  a{text-decoration:none}
  h3{color:#8ab4f8;font-weight:400;font-size:20px;line-height:1.3}
  .snip{margin-top:4px;line-height:1.58;color:#bdc1c6}
  #tads{margin:12px 0 4px;padding-bottom:6px;border-bottom:1px solid #3c4043}
  #tads .tag{color:#e8eaed;font-weight:700;font-size:13px;margin-bottom:6px}
  #tads .u{color:#bdc1c6}
  .ai{margin:12px 0 18px;padding:16px 18px;border-radius:16px;background:#2a2b35;border:1px solid #3c4043}
  .ai h2{font-size:15px;color:#e8eaed;font-weight:600;margin-bottom:8px}
  .ai p{line-height:1.6;color:#bdc1c6}
  .paa{margin:10px 0 22px;border:1px solid #3c4043;border-radius:12px;overflow:hidden}
  .paa h2{font-size:18px;color:#e8eaed;font-weight:400;padding:14px 16px 8px}
  .paa div.q{padding:12px 16px;border-top:1px solid #3c4043;color:#e8eaed;display:flex;justify-content:space-between}
  .ring{position:absolute;z-index:99;border-radius:50%;border:3px solid #4fd1e6;box-shadow:0 0 0 5px rgba(79,209,230,.22),0 0 26px rgba(79,209,230,.6);pointer-events:none}
  .ringtip{position:absolute;z-index:99;padding:7px 13px;border-radius:999px;background:#4fd1e6;color:#06222a;font-weight:700;font-size:14px;white-space:nowrap;pointer-events:none}
  *,*::before,*::after{transition:none!important;animation:none!important}
`;
const mic = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/></svg>';
const lens = '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';

/**
 * file: standalone page. cfg: the stored settings the content scripts see. scripts=false -> the page as Google would show it.
 * ring: {domain, text} draws a highlight ring around that result's block button. panel: open the "Advanced Tools" panel.
 * show: which noise blocks the page contains.
 */
function serpPage(name, { cfg = {}, scripts = true, ring = null, panel = false, noise = true, tall = false, scroll = 0 } = {}) {
  const body = `
  <div class="hdr">
  <div id="searchform"><form action="/search"><div class="bar">${lens}<input name="q" value="best running shoes">
    <div aria-label="Search by voice" role="button" class="mic">${mic}</div></div></form></div>
  <div role="navigation" id="hdtb"><a class="on">All</a><a href="/search?q=x&tbm=isch">Images</a><a href="/search?q=x&tbm=vid">Videos</a><a href="/search?q=x&tbm=nws">News</a><a href="/search?q=x&udm=28">Shopping</a></div>
  </div>
  <div id="center_col">
    ${noise ? `<div id="tads"><div class="tag">Sponsored</div><div class="top"><span class="fav" style="background:#f5b73d"></span><div class="site"><div class="nm">ShoeDeals</div><div class="u">https://shoedeals.example</div></div></div>
      <a href="https://shoedeals.example/sale"><h3>Running Shoes – Free Delivery, Up to 50% Off</h3></a><div class="snip">Shop 500+ styles from top brands. New customers save an extra 10%.</div></div>` : ''}
    <div id="rso">
      ${noise ? `<div class="MjjYud ai-wrap"><div class="ai" data-component-type="22"><h2>AI Overview</h2>
        <p>The best running shoe depends on your gait, weight and the surface you run on. Look for balanced cushioning, a secure fit and a weight that suits your training, then compare reviewed models in your budget.</p></div></div>` : ''}
      ${RESULTS.slice(0, 3).map(result).join('')}
      ${noise ? `<div class="MjjYud"><div class="paa" data-attrid="wa_paa"><h2>People also ask</h2>
        <div class="q">How often should you replace running shoes? <span>⌄</span></div>
        <div class="q">Are expensive running shoes worth it? <span>⌄</span></div>
        <div class="q">What is the best shoe drop for beginners? <span>⌄</span></div></div></div>` : ''}
      ${RESULTS.slice(3).map(result).join('')}
      ${tall ? '<div style="height:900px"></div>' : ''}
    </div>
  </div>`;
  const stub = `<script>
    const __cfg = ${JSON.stringify(cfg)};
    window.chrome = { storage: { local: { get: async () => JSON.parse(JSON.stringify(__cfg)), set: async () => {} }, onChanged: { addListener: () => {} } },
      runtime: { onMessage: { addListener: () => {} }, sendMessage: () => {} } };
  </script>`;
  const scriptTags = scripts
    ? ['link_filter.js', 'operators_panel.js', 'image_tools.js']
        .map((f) => `<script src="${url(path.join(root, 'content_scripts', f))}"></script>`).join('')
    : '';
  const after = `<script>window.addEventListener('load', () => setTimeout(() => {
      ${scroll ? `window.scrollTo(0, ${scroll});` : ''}
      ${panel ? "document.getElementById('sop-btn-search').click();" : ''}
      const spec = ${JSON.stringify(ring)};
      if (spec) {
        const block = [...document.querySelectorAll('.MjjYud')].find((b) => b.querySelector('a[href*="' + spec.domain + '"]'));
        const btn = block && block.querySelector('.sbf-block-btn');
        if (!btn) { document.title = 'RING TARGET MISSING'; return; }
        const r = btn.getBoundingClientRect();
        const ring = document.createElement('div'); ring.className = 'ring';
        ring.style.cssText = 'left:' + (r.left - 5 + scrollX) + 'px;top:' + (r.top - 5 + scrollY) + 'px;width:' + (r.width + 10) + 'px;height:' + (r.height + 10) + 'px';
        const tip = document.createElement('div'); tip.className = 'ringtip'; tip.textContent = spec.text;
        document.body.append(ring, tip);
        tip.style.left = (r.left + 20 + scrollX) + 'px'; tip.style.top = (r.bottom + 12 + scrollY) + 'px';
      }
    }, 700));</script>`;
  const file = path.join(tmp, `serp-${name}.html`);
  writeFileSync(file, `<!doctype html><html lang="en"><meta charset="utf-8"><title>results</title><style>${serpCss}</style><body>${body}${stub}${scriptTags}${after}</body></html>`);
  return url(file);
}

// ── Frames ──────────────────────────────────────────────────────────────────────────
const popupFrame = (src, scale, style = '', h = 600) =>
  `<div class="popup" style="width:${420 * scale}px;height:${h * scale}px;${style}">` +
  `<iframe src="${src}" style="width:420px;height:${h}px;transform:scale(${scale})"></iframe></div>`;
const serpFrame = (src, w, h, scale, style = '') =>
  `<div class="serp" style="width:${w * scale}px;height:${h * scale}px;${style}">` +
  `<iframe src="${src}" style="width:${w}px;height:${h}px;transform:scale(${scale})"></iframe></div>`;

// ── Shared look ─────────────────────────────────────────────────────────────────────
const CHECK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234fd1e6' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E\")";
const baseCss = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;overflow:hidden}
  body{position:relative;font-family:"Segoe UI Variable Display","Segoe UI",system-ui,sans-serif;color:#fff;background:#0a1116}
  .bg{position:absolute;inset:0;background:
      radial-gradient(900px 520px at 90% 4%,rgba(44,200,220,.26),transparent 62%),
      radial-gradient(700px 500px at 2% 108%,rgba(10,101,133,.30),transparent 60%),
      linear-gradient(180deg,#101a21,#080d11)}
  .brand{position:absolute;display:flex;align-items:center;gap:12px;font-weight:650;font-size:22px;letter-spacing:.2px}
  .brand img{width:40px;height:40px;display:block}
  h1{font-weight:780;letter-spacing:-.022em;line-height:1.05}
  h1 em{font-style:normal;background:linear-gradient(90deg,#8be6f3,#2cc8dc);-webkit-background-clip:text;background-clip:text;color:transparent}
  .sub{color:#b4c0c8;line-height:1.4}
  ul.pts{list-style:none;display:grid;gap:13px;color:#e6eef2}
  ul.pts li{display:flex;gap:13px;align-items:center}
  ul.pts li::before{content:"";flex:none;width:24px;height:24px;border-radius:8px;background:rgba(79,209,230,.16) ${CHECK} center/15px no-repeat}
  .chips{display:flex;flex-wrap:wrap;gap:10px}
  .chip{padding:8px 15px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#e6eef2;font-weight:560}
  .chip.code{font-family:Consolas,"Cascadia Mono",monospace;font-weight:500;color:#8be6f3}
  .popup,.serp{position:absolute;border-radius:16px;overflow:hidden;background:#000;box-shadow:0 40px 90px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.12)}
  .popup iframe,.serp iframe{display:block;border:0;transform-origin:0 0}
  .note{position:absolute;font-size:12.5px;color:#6f7f8a}
  .tag{position:absolute;z-index:5;padding:7px 16px;border-radius:999px;font-weight:700;font-size:16px;letter-spacing:.2px;background:rgba(20,30,36,.92);border:1px solid rgba(255,255,255,.2);color:#d3dde3}
  .tag.good{background:#2cc8dc;border-color:#2cc8dc;color:#04202a}
`;
const page = (name, w, h, body, extraCss = '') => {
  const file = path.join(tmp, `${name}.html`);
  writeFileSync(file, `<!doctype html><meta charset="utf-8"><style>${baseCss}body{width:${w}px;height:${h}px}${extraCss}</style><body><div class="bg"></div>${body}</body>`);
  return file;
};

// ── Screenshots (1280 x 800) ────────────────────────────────────────────────────────
const slideCss = `
  .brand{left:72px;top:56px}
  .copy{position:absolute;left:72px;top:176px;width:500px}
  h1{font-size:56px}
  .sub{margin-top:22px;font-size:22.5px}
  ul.pts{margin-top:30px;font-size:20px}
  .chips{margin-top:30px;font-size:18px}
`;
const slide = (name, { headline, sub, points, chips, visual, extra = '' }) => page(name, 1280, 800, `
  <div class="brand"><img src="${logoUri}" alt=""><span>Search Optimizer</span></div>
  <div class="copy">
    <h1>${headline}</h1>
    <p class="sub">${sub}</p>
    ${points ? `<ul class="pts">${points.map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
    ${chips ? `<div class="chips">${chips.map((c) => `<span class="chip${c.code ? ' code' : ''}">${c.t || c}</span>`).join('')}</div>` : ''}
  </div>
  ${visual}`, slideCss + extra);

const ILLUSTRATION = '<div class="note" style="{pos}">Simplified illustration of a results page with example sites</div>';
const illustration = (pos) => ILLUSTRATION.replace('{pos}', pos);

// results page configs
const cfgBlock = { ...exampleStore(), googleModules: {}, hiddenTabs: {}, searchFilters: ['topten-lists.example'], highlightFilters: ['runnersguide.example'], highlightEnabled: false, navBtnsEnabled: false, advancedSearch: false };
const cfgClean = { ...exampleStore(), searchFilters: ['topten-lists.example', 'answerfarm.example'], highlightFilters: [], highlightEnabled: false, navBtnsEnabled: false, advancedSearch: false };
const cfgScroll = { ...exampleStore(), googleModules: {}, hiddenTabs: {}, searchFilters: ['topten-lists.example'], highlightFilters: [], highlightEnabled: false, advancedSearch: false };
const cfgPanel = { ...exampleStore(), googleModules: {}, hiddenTabs: {}, searchFilters: [], highlightFilters: [], highlightEnabled: false, navBtnsEnabled: false };

const SHOTS = {
  1: () => slide('shot1', {
    headline: 'Block sites you <em>never want to see</em>',
    sub: 'Click the block button next to a result and the whole site disappears from your searches. Star the ones you trust.',
    points: ['One-click block next to every result', 'Block by keyword as well', 'Highlight your favorite sources'],
    visual:
      serpFrame(serpPage('block', { cfg: cfgBlock, noise: false, ring: { domain: 'answerfarm.example', text: '↖ Block this site' } }), 700, 640, 0.9, 'left:600px;top:44px') +
      popupFrame(popupPage('filters', { tab: 'filters', expand: ['block-domains-toggle', 'highlight-domains-toggle'] }), 0.78, 'left:872px;top:352px', 540) +
      illustration('left:600px;top:760px'),
  }),
  2: () => slide('shot2', {
    headline: 'Hide <em>AI Overviews</em> and other clutter',
    sub: 'Switch off the parts of the results page you never use, one eye icon at a time.',
    chips: ['AI Overviews', 'Sponsored results', 'People also ask', 'Knowledge panel', 'Videos & images', 'Search tabs'],
    visual: popupFrame(popupPage('google', { tab: 'google', expand: ['modules-toggle'] }), 1.18, 'right:72px;top:50px', 600),
  }),
  3: () => page('shot3', 1280, 800, `
    <div class="brand" style="left:72px;top:50px"><img src="${logoUri}" alt=""><span>Search Optimizer</span></div>
    <h1 style="position:absolute;left:72px;top:112px;font-size:54px">The same search, <em>a cleaner page</em></h1>
    <p class="sub" style="position:absolute;left:72px;top:184px;font-size:22px;width:1000px">No AI box, no ads, no question list and no sites you blocked. The real results move up.</p>
    <div class="tag" style="left:72px;top:246px">Before</div>
    <div class="tag good" style="left:648px;top:246px">After</div>
    ${serpFrame(serpPage('raw', { scripts: false }), 700, 640, 0.8, 'left:72px;top:296px;height:455px')}
    ${serpFrame(serpPage('clean', { cfg: cfgClean }), 700, 640, 0.8, 'left:648px;top:296px;height:455px')}
    <div class="note" style="left:72px;top:762px">Simplified illustration of a results page with example sites</div>`),
  4: () => slide('shot4', {
    headline: 'Infinite scroll for <em>Google results</em>',
    sub: 'The next page loads as you scroll, so you never click “Next”. Floating buttons take you back to the top or the bottom.',
    points: ['No more page numbers', 'Jump to top or bottom in one click', 'Pick the button colors you like'],
    visual:
      serpFrame(serpPage('scroll', { cfg: cfgScroll, noise: false, tall: true, scroll: 150 }), 700, 640, 0.92, 'left:610px;top:44px') +
      popupFrame(popupPage('general', { tab: 'general' }), 1, 'left:850px;top:300px', 430) +
      illustration('left:610px;top:760px'),
  }),
  5: () => slide('shot5', {
    headline: 'Search operators, <em>one click away</em>',
    sub: 'A gear next to the search bar opens a panel with ready-made operators. Click a chip and it is added to your query.',
    chips: [{ t: 'site:', code: 1 }, { t: 'filetype:pdf', code: 1 }, { t: 'intitle:', code: 1 }, { t: 'before:', code: 1 }, { t: 'after:', code: 1 }, { t: '"exact match"', code: 1 }, { t: '-exclude', code: 1 }],
    visual:
      serpFrame(serpPage('panel', { cfg: cfgPanel, noise: false, panel: true }), 700, 700, 1.0, 'left:580px;top:50px') +
      illustration('left:580px;top:760px'),
  }),
};

// ── Promo tiles ─────────────────────────────────────────────────────────────────────
const promoSmall = () => page('promo-small', 440, 280, `
  <div class="brand" style="left:34px;top:32px;gap:0"><img src="${logoUri}" alt="" style="width:76px;height:76px"></div>
  <div style="position:absolute;left:34px;top:122px;right:30px">
    <div style="font-size:37px;font-weight:780;letter-spacing:-.02em;line-height:1">Search Optimizer</div>
    <div style="margin-top:12px;font-size:21px;line-height:1.3;color:#d3dde3;font-weight:560">Block sites.<br>Hide AI Overviews.<br><span style="color:#6fdcec">Clean results.</span></div>
  </div>`);

const promoMarquee = () => page('promo-marquee', 1400, 560, `
  <div class="brand" style="left:80px;top:62px"><img src="${logoUri}" alt=""><span>Search Optimizer</span></div>
  <div style="position:absolute;left:80px;top:150px;width:640px">
    <h1 style="font-size:62px">Google Search,<br><em>cleaned up.</em></h1>
    <p class="sub" style="margin-top:22px;font-size:25px">Block sites, hide AI Overviews and ads, scroll without pages.</p>
    <div class="chips" style="margin-top:32px;font-size:19px"><span class="chip">Site blocker</span><span class="chip">Clean results</span><span class="chip">Infinite scroll</span></div>
  </div>
  ${serpFrame(serpPage('m-clean', { cfg: cfgClean }), 700, 640, 0.76, 'left:760px;top:46px;height:470px')}
  ${popupFrame(popupPage('m-general', { tab: 'general' }), 0.78, 'left:1030px;top:190px', 430)}`);

// ── Run ─────────────────────────────────────────────────────────────────────────────
const NAMES = { 1: 'screenshot-1-block-sites', 2: 'screenshot-2-hide-ai-overviews-and-clutter', 3: 'screenshot-3-before-and-after',
                4: 'screenshot-4-infinite-scroll', 5: 'screenshot-5-search-operators' };
const want = process.argv.slice(2);
const on = (k) => want.length === 0 || want.includes(String(k));

for (const n of [1, 2, 3, 4, 5]) {
  if (!on(n)) continue;
  render(SHOTS[n](), path.join(out, 'screenshots', NAMES[n] + '.png'), 1280, 800, { wait: 4000 });
  console.log('wrote', NAMES[n] + '.png');
}
if (on('promo')) {
  render(promoSmall(), path.join(out, 'promo-small-440x280.png'), 440, 280, { wait: 2000 });
  console.log('wrote promo-small-440x280.png');
  render(promoMarquee(), path.join(out, 'promo-marquee-1400x560.png'), 1400, 560, { wait: 4000 });
  console.log('wrote promo-marquee-1400x560.png');
}
