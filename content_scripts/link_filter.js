(async function() {
  'use strict';
  // ─── Styles ───────────────────────────────────────────────────────────────
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      .sbf-hidden { display: none !important; visibility: hidden !important; }
      .sbf-preferred { border-left: 4px solid #22c55e !important; padding-left: 12px !important; background-color: rgba(34, 197, 94, 0.05) !important; }
      .sbf-block-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 24px; height: 24px; margin-left: 8px;
        background: #ef4444; border: none; border-radius: 50%;
        color: white; font-size: 13px; cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        vertical-align: middle; position: relative; z-index: 100; padding: 0;
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
      }
      .sbf-block-btn:hover { background: #dc2626; transform: scale(1.1) rotate(15deg); }
    `;
    document.head.appendChild(style);
  }

  // ─── Config ───────────────────────────────────────────────────────────────
  let searchFilters = [];
  let googleModules = {};
  let infiniteScrollEnabled = true;
  let hiddenTabs = {};
  let preferredDomains = [];
  let keywordFilters = [];

  async function loadConfig() {
    const data = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'preferredDomains', 'blockedKeywords']);
    searchFilters = (data.searchFilters || []).map(f => typeof f === 'string' ? f : (f.domain || ''));
    googleModules = data.googleModules || { sponsored: false, latest: false, products: false, images: false, videos: false, ask: false, search: false };
    infiniteScrollEnabled = data.infiniteScroll !== false;
    hiddenTabs = data.hiddenTabs || {};
    preferredDomains = (data.preferredDomains || []).map(d => typeof d === 'string' ? d : (d.domain || ''));
    keywordFilters = data.blockedKeywords || [];
    console.log('[Search Optimizer] Config loaded:', { infiniteScrollEnabled, googleModules });
  }

  // ─── Hiding Logic ──────────────────────────────────────────────────────────
  function isAllTab() {
    const p = new URLSearchParams(window.location.search);
    return !p.get('tbm') && (!p.get('udm') || p.get('udm') === '1');
  }

  function scanGoogleModules() {
    if (!isAllTab()) return;
    
    // Sponsored
    if (googleModules.sponsored) {
      document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad, [data-text-ad], .MjjYud:has(.uEierd)').forEach(el => el.classList.add('sbf-hidden'));
    }

    // Module blocks by header text
    const killByHeading = (texts, active) => {
      if (!active) return;
      document.querySelectorAll('h1, h2, h3, h4, [role="heading"]').forEach(el => {
        const text = el.innerText.toLowerCase().trim();
        if (texts.some(t => text === t || text.startsWith(t + ' '))) {
          const container = el.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .WwS1pe, .tF2Cxc');
          if (container) container.classList.add('sbf-hidden');
        }
      });
    };

    killByHeading(['images', 'bilder'], googleModules.images);
    killByHeading(['videos', 'short videos', 'kurzvideos', 'reels'], googleModules.videos);
    killByHeading(['people also ask', 'ähnliche fragen', 'nutzer fragen auch'], googleModules.ask);
    killByHeading(['products', 'produkte', 'shop for', 'kaufen'], googleModules.products);
    killByHeading(['latest posts', 'discussions', 'neueste beiträge'], googleModules.latest);
    killByHeading(['related searches', 'verwandte suchanfragen', 'people also search for'], googleModules.search);
  }

  function hideGoogleTabs() {
    const activeKeys = Object.keys(hiddenTabs).filter(k => hiddenTabs[k]);
    if (!activeKeys.length) return;

    const tabTextMap = {
      'images': ['images', 'bilder'], 'videos': ['videos'], 'short-videos': ['short videos', 'kurzvideos'],
      'products': ['products', 'produkte'], 'product-sites': ['product sites'], 'news': ['news', 'nachrichten'],
      'maps': ['maps', 'karten'], 'books': ['books', 'bücher'], 'shopping': ['shopping'], 'more': ['more', 'mehr'], 'tools': ['tools', 'werkzeuge']
    };

    const tabBar = document.querySelector('#hdtb, #top_nav, .crJ18e, .Uo8X3b, #hdtb-msb, .MUFdbf, .K9vS3e, .OIn58');
    if (!tabBar) return;

    tabBar.querySelectorAll('a, div[role="link"], div[role="tab"], .C6AK7c, span').forEach(el => {
      const text = el.innerText.toLowerCase().trim();
      for (const key of activeKeys) {
        if (tabTextMap[key] && tabTextMap[key].some(label => text === label)) {
          let current = el;
          while (current.parentElement && current.parentElement !== tabBar && !current.parentElement.classList.contains('crJ18e')) {
            current = current.parentElement;
          }
          current.classList.add('sbf-hidden');
        }
      }
    });
  }

  function applyFiltersOnLink(link) {
    if (link.dataset.sbfDone) return;
    link.dataset.sbfDone = '1';
    try {
      const url = new URL(link.href);
      const domain = url.hostname.replace(/^www\./, '');
      
      // Block
      if (searchFilters.some(d => domain === d || domain.endsWith('.' + d))) {
        const container = link.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c, [role="listitem"]');
        if (container) container.classList.add('sbf-hidden');
      }
      
      // Highlight
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
      const text = el.innerText.toLowerCase();
      if (keywordFilters.some(kw => text.includes(kw.toLowerCase()))) el.classList.add('sbf-hidden');
    });
  }

  function injectBlockButtons() {
    document.querySelectorAll('.yuRUbf, .v5yQqb, .ca_1, .MjjYud h3, .g h3, .tF2Cxc h3, .csY6hd').forEach(header => {
      if (header.dataset.sbfBlockDone) return;
      const link = header.querySelector('a[href]');
      if (!link) return;
      header.dataset.sbfBlockDone = '1';
      const domain = new URL(link.href).hostname.replace(/^www\./, '');
      const btn = document.createElement('button');
      btn.className = 'sbf-block-btn'; btn.innerHTML = '🚫'; btn.title = `Block ${domain}`;
      btn.onclick = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (confirm(`Block ${domain}?`)) {
          const data = await chrome.storage.local.get('searchFilters');
          const filters = data.searchFilters || [];
          if (!filters.includes(domain)) {
            filters.push(domain);
            await chrome.storage.local.set({ searchFilters: filters });
            chrome.runtime.sendMessage({ action: 'live_update' });
          }
        }
      };
      
      // Attempt to find the menu area (the three dots)
      const menu = header.closest('.g, .MjjYud, .tF2Cxc')?.querySelector('.VqP7ub, .XNo29b, .rwoS6c, .csY6hd');
      if (menu) {
        menu.style.display = 'flex';
        menu.style.alignItems = 'center';
        menu.style.gap = '6px';
        menu.prepend(btn);
      } else {
        header.prepend(btn);
      }
    });
  }

  function incrementalScan() {
    document.querySelectorAll('a[href]:not([data-sbf-done])').forEach(applyFiltersOnLink);
    scanGoogleModules();
    hideGoogleTabs();
    hideByKeywords();
    injectBlockButtons();
  }

  // ─── Infinite Scroll ───────────────────────────────────────────────────────
  let isFetching = false;
  async function onScroll() {
    // CRITICAL: Check both the local variable AND re-fetch if needed
    if (infiniteScrollEnabled === false) return;
    
    if (isFetching) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1200) {
      const nextLink = document.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"], a[data-next]');
      if (nextLink && nextLink.href) {
        isFetching = true;
        console.log('[Search Optimizer] Fetching next page...');
        try {
          const resp = await fetch(nextLink.href);
          const html = await resp.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const newRso = doc.getElementById('rso');
          const rso = document.getElementById('rso');
          if (newRso && rso) {
            // Append only unique results
            Array.from(newRso.children).forEach(child => rso.appendChild(child.cloneNode(true)));
            incrementalScan();
          }
          const newNext = doc.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"]');
          const oldNext = document.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"]');
          if (oldNext && newNext) oldNext.href = newNext.href;
          else if (oldNext) oldNext.remove(); 
        } catch(e) { console.error(e); }
        setTimeout(() => { isFetching = false; }, 1000); // Throttling
      }
    }
  }

  // ─── Main ──────────────────────────────────────────────────────────────────
  await loadConfig();
  incrementalScan();
  window.addEventListener('scroll', onScroll);

  const observer = new MutationObserver(() => {
    incrementalScan();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'live_update') {
      console.log('[Search Optimizer] Live Update Received');
      await loadConfig();
      // Clean up previous states
      document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
      document.querySelectorAll('.sbf-preferred').forEach(el => el.classList.remove('sbf-preferred'));
      document.querySelectorAll('[data-sbf-done]').forEach(el => delete el.dataset.sbfDone);
      document.querySelectorAll('[data-sbf-block-done]').forEach(el => delete el.dataset.sbfBlockDone);
      incrementalScan();
    }
  });
})();
