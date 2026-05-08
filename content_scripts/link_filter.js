(async function() {
  'use strict';
  // ─── Styles ───────────────────────────────────────────────────────────────
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      .sbf-hidden { display: none !important; }
      .sbf-preferred { border-left: 4px solid #22c55e !important; padding-left: 12px !important; background-color: rgba(34, 197, 94, 0.05) !important; }
      /* Aggressive CSS hiding for AI Overviews */
      .sbf-hide-ai [data-component-type="22"], .sbf-hide-ai .SGE_container, .sbf-hide-ai #super_results, .sbf-hide-ai [data-sge-container] { display: none !important; }
      /* More button hiding */
      .sbf-hide-more .znY98, .sbf-hide-more .G9vS3e, .sbf-hide-more [aria-label*="More"], .sbf-hide-more [aria-label*="Mehr"] { display: none !important; }
      /* Favicon hiding */
      .sbf-hide-favicons .XNo29b, .sbf-hide-favicons .H6McF, .sbf-hide-favicons .CA96S, .sbf-hide-favicons .kvH3mc img { display: none !important; }
      /* Products CSS-level hiding — selectors verified against live Google DOM */
      /* wOPJ9c = product card, RyIFgf = carousel container */
      .sbf-hide-products .wOPJ9c,
      .sbf-hide-products div:has(> .wOPJ9c),
      .sbf-hide-products .RyIFgf.rAdPSe:has(.wOPJ9c),
      .sbf-hide-products .commercial-unit-desktop-top,
      .sbf-hide-products .commercial-unit-desktop-rhs,
      .sbf-hide-products .pla-unit,
      .sbf-hide-products [data-asoch-dom-id],
      .sbf-hide-products #tvcap { display: none !important; }
      /* Also hide the entire MjjYud block that contains a product grid */
      .sbf-hide-products .MjjYud:has(.wOPJ9c) { display: none !important; }
      /* Images CSS-level hiding */
      .sbf-hide-images [data-attrid="images universal"],
      .sbf-hide-images .MjjYud:has(.O8S99),
      .sbf-hide-images .MjjYud:has(.isv-r),
      .sbf-hide-images .MjjYud:has(.IWdOjd) { display: none !important; }

      #sbf-loader {
        display: none; text-align: center; padding: 20px; color: #9aa0a6;
        font-family: Google Sans, Roboto, sans-serif; font-size: 14px;
        gap: 10px; align-items: center; justify-content: center;
      }
      #sbf-loader.active { display: flex; }
      .sbf-spinner {
        width: 18px; height: 18px; border: 2px solid #444; border-top-color: #8ab4f8;
        border-radius: 50%; animation: sbf-spin 0.6s linear infinite;
      }
      @keyframes sbf-spin { to { transform: rotate(360deg); } }
      .sbf-unpacked { margin-right: 16px !important; display: inline-block !important; }
      
      /* Navigation Buttons */
      #sbf-nav-btns {
        position: fixed; bottom: 24px; left: 24px; z-index: 2147483640;
        display: none; flex-direction: column; gap: 8px;
      }
      #sbf-nav-btns.visible { display: flex; }
      .sbf-nav-btn {
        width: 44px; height: 44px; border-radius: 50%; background: #1e293b;
        border: 1px solid #334155; color: #38bdf8; display: flex; align-items: center;
        justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.2s; user-select: none;
      }
      .sbf-nav-btn:hover { background: #334155; transform: scale(1.05); color: #7dd3fc; }
      .sbf-nav-btn svg { width: 20px; height: 20px; pointer-events: none; }
    `;
    document.head.appendChild(style);
  }

  // ─── Config ───────────────────────────────────────────────────────────────
  let searchFilters = [];
  let googleModules = {};
  let infiniteScrollEnabled = false;
  let hiddenTabs = {};
  let preferredDomains = [];
  let keywordFilters = [];
  let highlightEnabled = false;
  let highlightColor = '#38bdf8';
  let isFetching = false;
  let loader = null;

  async function loadConfig() {
    try {
      const data = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'preferredDomains', 'blockedKeywords', 'highlightEnabled', 'highlightColor']);
      searchFilters = (data.searchFilters || []).map(f => typeof f === 'string' ? f : (f.domain || ''));
      googleModules = data.googleModules || { ai: false, sponsored: false, latest: false, products: false, images: false, videos: false, ask: false, search: false, favicons: false };
      infiniteScrollEnabled = data.infiniteScroll === true;
      hiddenTabs = data.hiddenTabs || {};
      preferredDomains = (data.preferredDomains || []).map(d => typeof d === 'string' ? d : (d.domain || ''));
      keywordFilters = data.blockedKeywords || [];
      highlightEnabled = data.highlightEnabled === true;
      highlightColor = data.highlightColor || '#38bdf8';
      
      // Apply body classes immediately
      document.body.classList.toggle('sbf-no-infinite', !infiniteScrollEnabled);
      document.body.classList.toggle('sbf-hide-ai', !!googleModules.ai);
      document.body.classList.toggle('sbf-hide-products', !!googleModules.products);
      document.body.classList.toggle('sbf-hide-images', !!googleModules.images);
      document.body.classList.toggle('sbf-hide-more', !!(hiddenTabs['more'] || hiddenTabs['unpack-more']));
      document.body.classList.toggle('sbf-hide-favicons', !!googleModules.favicons);

      updateHighlighting();
      console.log('[Search Optimizer] Config loaded. Infinite Scroll:', infiniteScrollEnabled, '| Modules:', JSON.stringify(googleModules));
      updateNavBtns();
    } catch (e) {
      console.error('[Search Optimizer] Error loading config:', e);
    }
  }

  function updateHighlighting() {
    let style = document.getElementById('sbf-highlight-style');
    if (highlightEnabled) {
      if (!style) {
        style = document.createElement('style');
        style.id = 'sbf-highlight-style';
        document.head.appendChild(style);
      }
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) {
        style.textContent = `
          .g em, .g b, .MjjYud em, .MjjYud b { 
            background-color: ${highlightColor}33 !important; 
            color: ${highlightColor} !important;
            padding: 0 2px; border-radius: 2px;
          }
        `;
      }
    } else if (style) {
      style.remove();
    }
  }

  // ─── Tab Detection ──────────────────────────────────────────────────────────
  function isAllTab() {
    const p = new URLSearchParams(window.location.search);
    return !p.get('tbm') && (!p.get('udm') || p.get('udm') === '1');
  }

  function isImagesTab() {
    const p = new URLSearchParams(window.location.search);
    return p.get('tbm') === 'isch' || p.get('udm') === '2';
  }

  // ─── Module Hiding ─────────────────────────────────────────────────────────
  function scanGoogleModules() {
    if (!isAllTab()) return;

    // AI Overviews (SGE)
    if (googleModules.ai) {
      const sgeSelectors = [
        '[data-component-type="22"]', '.Z97S6d', '.V99yG', '.SGE_container',
        '.XQ4SFe', '.zbA0S', '#super_results',
        '.MjjYud:has(div[aria-label^="AI Overview"])',
        '.MjjYud:has(div[aria-label^="KI-Übersicht"])',
        '.MjjYud:has(div[data-component-type="22"])',
        '[data-sge-container]'
      ];
      document.querySelectorAll(sgeSelectors.join(',')).forEach(el => {
        el.classList.add('sbf-hidden');
        const wrapper = el.closest('.MjjYud, .g');
        if (wrapper) wrapper.classList.add('sbf-hidden');
      });
    }

    if (googleModules.sponsored) {
      document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad, [data-text-ad], .commercial-unit-desktop-top, .commercial-unit-desktop-rhs').forEach(el => el.classList.add('sbf-hidden'));
    }

    // Products — multi-layered approach using live-verified selectors
    if (googleModules.products) {
      // Layer 1: known class names from live DOM inspection
      const productSelectors = [
        '.wOPJ9c',           // individual product card (verified live)
        '.pla-unit',         // legacy PLA unit
        '[data-asoch-dom-id]',
        '.CU7eYc',
        '.commercial-unit-desktop-top',
        '.commercial-unit-desktop-rhs',
        '#tvcap'
      ];
      document.querySelectorAll(productSelectors.join(',')).forEach(el => {
        // Walk up to find the MjjYud/g wrapper and hide the whole block
        const wrapper = el.closest('.MjjYud, .g, .ULSxyf, .v7W49e') || el.parentElement?.parentElement;
        if (wrapper) wrapper.classList.add('sbf-hidden');
        else el.classList.add('sbf-hidden');
      });

      // Layer 2: find any block that contains price elements (€/$ signs + ratings)
      document.querySelectorAll('.MjjYud, .g').forEach(block => {
        if (block.classList.contains('sbf-hidden')) return;
        // Detect: has multiple price spans AND star ratings → it's a product grid
        const prices = block.querySelectorAll('[aria-label*="€"], [aria-label*="$"], .HRLxBb, .qIEPib');
        const stars = block.querySelectorAll('.GpEInteractiveStar, .Fam1ne, [aria-label*="stars"], [aria-label*="Sterne"]');
        if (prices.length >= 2 && stars.length >= 1) {
          block.classList.add('sbf-hidden');
        }
      });
    }

    // killByHeading: hides the entire MjjYud/g block that contains a matching heading
    const killByHeading = (texts, active) => {
      if (!active) return;
      document.querySelectorAll('h1, h2, h3, h4, [role="heading"]').forEach(el => {
        if (el.dataset.sbfChecked) return;
        el.dataset.sbfChecked = '1';
        const text = (el.innerText || '').toLowerCase().trim();
        if (texts.some(t => text === t || text.startsWith(t))) {
          const container = el.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .WwS1pe, .tF2Cxc, .ULSxyf, .O8VmIc');
          if (container) container.classList.add('sbf-hidden');
        }
      });
    };

    killByHeading(['ai overview', 'ki-übersicht', 'ai search'], googleModules.ai);
    killByHeading(['images', 'bilder'], googleModules.images);
    killByHeading(['videos', 'short videos', 'kurzvideos', 'reels'], googleModules.videos);
    killByHeading(['people also ask', 'ähnliche fragen', 'nutzer fragen auch'], googleModules.ask);
    killByHeading(['products', 'produkte', 'shop for', 'kaufen', 'sponsored'], googleModules.products);
    killByHeading(['latest posts', 'discussions', 'neueste beiträge', 'forums'], googleModules.latest);
    killByHeading(['related searches', 'verwandte suchanfragen', 'people also search for', 'ähnliche suchanfragen'], googleModules.search);
  }

  // ─── Tab Bar Hiding ────────────────────────────────────────────────────────
  function hideGoogleTabs() {
    const activeKeys = Object.keys(hiddenTabs).filter(k => hiddenTabs[k]);
    
    const moreBtn = Array.from(document.querySelectorAll('a, div[role="button"], .C6AK7c, .z1asCe, .hdtb-mitem, .znY98, .G9vS3e')).find(el => {
      const t = (el.innerText || '').toLowerCase().trim();
      return t === 'more' || t === 'mehr' || el.getAttribute('aria-label')?.toLowerCase().includes('more') || el.getAttribute('aria-label')?.toLowerCase().includes('mehr');
    });

    if (hiddenTabs['unpack-more']) {
      if (moreBtn && !moreBtn.dataset.sbfUnpackedDone) {
        const tabBar = moreBtn.closest('#hdtb-msb, .MUFdbf, .K9vS3e, .OIn58, .crJ18e, .hdtb-mitem, .G9vS3e');
        if (tabBar) {
          const q = new URLSearchParams(window.location.search).get('q');
          const createTab = (label, tbm, key) => {
            if (hiddenTabs[key]) return null;
            const a = document.createElement('a');
            a.className = 'sbf-unpacked';
            a.innerText = label;
            a.href = `/search?q=${encodeURIComponent(q)}${tbm ? '&tbm=' + tbm : ''}`;
            a.style.cssText = 'margin-right:16px; display:inline-block; color:#9aa0a6; text-decoration:none; font-size:14px; padding:0 4px;';
            return a;
          };
          const items = [
            { l: 'Web', t: '', k: 'web' },
            { l: 'Finance', t: 'fin', k: 'finance' },
            { l: 'Books', t: 'bks', k: 'books' }
          ];
          items.forEach(item => {
            const tab = createTab(item.l, item.t, item.k);
            if (tab) {
              const insertTarget = moreBtn.parentElement.classList.contains('hdtb-mitem') ? moreBtn.parentElement : moreBtn;
              insertTarget.before(tab);
            }
          });
          moreBtn.dataset.sbfUnpackedDone = '1';
          const targetToHide = moreBtn.parentElement.classList.contains('hdtb-mitem') ? moreBtn.parentElement : moreBtn;
          targetToHide.classList.add('sbf-hidden');
        }
      }
    } else if (moreBtn) {
      delete moreBtn.dataset.sbfUnpackedDone;
      const targetToShow = moreBtn.parentElement.classList.contains('hdtb-mitem') ? moreBtn.parentElement : moreBtn;
      targetToShow.classList.remove('sbf-hidden');
    }

    const tabTextMap = {
      'images': ['images', 'bilder'],
      'videos': ['videos'],
      'short-videos': ['short videos', 'kurzvideos'],
      'products': ['products', 'produkte'],
      'product-sites': ['product sites'],
      'news': ['news', 'nachrichten'],
      'web': ['web'],
      'finance': ['finance', 'finanzen'],
      'forums': ['forums', 'foren'],
      'maps': ['maps', 'karten'],
      'books': ['books', 'bücher'],
      'shopping': ['shopping'],
      'more': ['more', 'mehr']
    };

    // Modern Google uses data-attrid for tabs
    const tabAttrMap = {
      'images': 'images',
      'videos': 'videos',
      'news': 'news',
      'maps': 'maps',
      'books': 'books',
      'shopping': 'shopping',
      'finance': 'finance'
    };

    document.querySelectorAll('#hdtb-msb a, .MUFdbf a, .K9vS3e a, .OIn58 a, .crJ18e a, .Uo8X3b a, .C6AK7c, [role="tab"], .hdtb-mitem a').forEach(el => {
      const text = (el.innerText || '').toLowerCase().trim();
      const attrid = (el.getAttribute('data-attrid') || '').toLowerCase();
      
      el.classList.remove('sbf-hidden');
      if (el.parentElement.classList.contains('hdtb-mitem')) el.parentElement.classList.remove('sbf-hidden');

      for (const key of activeKeys) {
        const matchesText = tabTextMap[key] && tabTextMap[key].some(label => text === label);
        const matchesAttr = tabAttrMap[key] && attrid === tabAttrMap[key];
        
        if (matchesText || matchesAttr) {
          let target = el;
          if (el.parentElement.classList.contains('hdtb-mitem') || (el.parentElement.tagName === 'DIV' && el.parentElement.children.length === 1)) {
            target = el.parentElement;
          }
          target.classList.add('sbf-hidden');
        }
      }
    });

    const toolsBtn = Array.from(document.querySelectorAll('a, div[role="button"], #hdtb-tls, .Uo8X3b, .t7898b')).find(el => {
      const t = (el.innerText || '').toLowerCase().trim();
      return t === 'tools' || t === 'werkzeuge' || el.id === 'hdtb-tls';
    });
    if (toolsBtn) {
      const target = toolsBtn.parentElement.classList.contains('hdtb-mitem') ? toolsBtn.parentElement : toolsBtn;
      if (hiddenTabs['tools']) target.classList.add('sbf-hidden');
      else target.classList.remove('sbf-hidden');
    }
  }

  // ─── Link Filters ──────────────────────────────────────────────────────────
  function applyFiltersOnLink(link) {
    if (link.dataset.sbfDone) return;
    link.dataset.sbfDone = '1';
    try {
      const url = new URL(link.href);
      const domain = url.hostname.replace(/^www\./, '');
      if (searchFilters.some(d => domain === d || domain.endsWith('.' + d))) {
        const container = link.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c, [role="listitem"]');
        if (container) container.classList.add('sbf-hidden');
      }
      if (preferredDomains.some(d => domain === d || domain.endsWith('.' + d))) {
        const container = link.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c');
        if (container) container.classList.add('sbf-preferred');
      }
    } catch(e) {}
  }

  function hideByKeywords() {
    if (!keywordFilters.length) return;
    document.querySelectorAll('.g, .MjjYud, .tF2Cxc, .hlcw0c').forEach(el => {
      if (el.classList.contains('sbf-hidden')) return;
      const text = (el.innerText || '').toLowerCase();
      if (keywordFilters.some(kw => text.includes(kw.toLowerCase()))) el.classList.add('sbf-hidden');
    });
  }

  // ─── Main Scan ─────────────────────────────────────────────────────────────
  function incrementalScan() {
    scanGoogleModules();
    hideGoogleTabs();
    document.querySelectorAll('a[href]').forEach(link => applyFiltersOnLink(link));
    hideByKeywords();
    ensureLoader();
  }

  // ─── Nav Buttons ──────────────────────────────────────────────────────────
  function updateNavBtns() {
    ensureNavBtns();
    const container = document.getElementById('sbf-nav-btns');
    if (container) {
      if (window.scrollY > 200) container.classList.add('visible');
      else container.classList.remove('visible');
    }
  }

  function ensureNavBtns() {
    if (document.getElementById('sbf-nav-btns')) return;
    const container = document.createElement('div');
    container.id = 'sbf-nav-btns';
    container.innerHTML = `
      <div class="sbf-nav-btn" id="sbf-scroll-top" title="Scroll to Top">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
      </div>
      <div class="sbf-nav-btn" id="sbf-scroll-bottom" title="Scroll to Bottom">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    `;
    document.body.appendChild(container);

    const topBtn = container.querySelector('#sbf-scroll-top');
    const bottomBtn = container.querySelector('#sbf-scroll-bottom');

    // FIX: Both buttons now use onclick (left-click)
    topBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    bottomBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    // Middle-click anywhere on nav to go back
    container.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  }

  // ─── Loader ────────────────────────────────────────────────────────────────
  function ensureLoader() {
    if (loader) return;
    loader = document.createElement('div');
    loader.id = 'sbf-loader';
    loader.innerHTML = `<div class="sbf-spinner"></div><span>Loading more results…</span>`;
    const rso = getResultContainer();
    if (rso) rso.after(loader);
    else document.body.appendChild(loader);
  }

  // ─── Infinite Scroll ───────────────────────────────────────────────────────
  function getResultContainer() {
    if (isImagesTab()) return document.querySelector('#islmp, #islrg, .islrc');
    return document.getElementById('rso') || document.querySelector('.v7W49e');
  }

  function getNextLink() {
    return document.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="Weiter"]');
  }

  async function onScroll() {
    updateNavBtns();

    if (!infiniteScrollEnabled) {
      if (loader) loader.classList.remove('active');
      return;
    }

    if (isFetching) return;

    const threshold = isImagesTab() ? 800 : 1200;
    const distFromBottom = document.body.offsetHeight - window.innerHeight - window.scrollY;

    if (distFromBottom < threshold) {
      const nextLink = getNextLink();
      if (nextLink && nextLink.href) {
        isFetching = true;
        ensureLoader();
        loader.classList.add('active');

        try {
          const resp = await fetch(nextLink.href);
          const html = await resp.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          
          const targetRso = getResultContainer();
          const newRso = doc.querySelector(isImagesTab() ? '#islmp, #islrg, .islrc' : '#rso');

          if (newRso && targetRso) {
            const fragment = document.createDocumentFragment();
            Array.from(newRso.children).forEach(child => {
              fragment.appendChild(child.cloneNode(true));
            });
            targetRso.appendChild(fragment);

            const newNext = doc.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="Weiter"]');
            const oldNext = getNextLink();
            if (oldNext && newNext) oldNext.href = newNext.href;
            else if (oldNext) oldNext.remove();

            // Reset heading scan cache so new content gets processed
            document.querySelectorAll('[data-sbf-checked]').forEach(el => delete el.dataset.sbfChecked);
            incrementalScan();
          }
        } catch (e) {
          console.error('[Search Optimizer] Fetch failed:', e);
        } finally {
          loader.classList.remove('active');
          setTimeout(() => { isFetching = false; }, 1000);
        }
      } else {
        // No next page — hide loader
        if (loader) loader.classList.remove('active');
      }
    }
  }

  // ─── Main ──────────────────────────────────────────────────────────────────
  await loadConfig();
  incrementalScan();
  window.addEventListener('scroll', onScroll, { passive: true });

  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'live_update') {
      console.log('[Search Optimizer] Live Update triggered');
      await loadConfig();
      // Clear all previous state
      document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
      document.querySelectorAll('.sbf-preferred').forEach(el => el.classList.remove('sbf-preferred'));
      document.querySelectorAll('.sbf-unpacked').forEach(el => el.remove());
      document.querySelectorAll('[data-sbf-done]').forEach(el => delete el.dataset.sbfDone);
      document.querySelectorAll('[data-sbf-checked]').forEach(el => delete el.dataset.sbfChecked);
      incrementalScan();
    }
  });

  const observer = new MutationObserver(() => { incrementalScan(); });
  observer.observe(document.body, { childList: true, subtree: true });
})();
