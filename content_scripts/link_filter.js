(async function() {
  'use strict';
  // ─── Styles ───────────────────────────────────────────────────────────────
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      .sbf-hidden { display: none !important; }
      .sbf-preferred { border-left: 4px solid #22c55e !important; padding-left: 12px !important; background-color: rgba(34, 197, 94, 0.05) !important; }

      #sbf-loader {
        display: none; text-align: center; padding: 28px 0; color: #9aa0a6;
        font-family: Google Sans, Roboto, sans-serif; font-size: 14px;
        gap: 10px; align-items: center; justify-content: center;
      }
      #sbf-loader.active { display: flex; }
      #sbf-loader .sbf-spinner {
        width: 20px; height: 20px; border: 2px solid #444; border-top-color: #8ab4f8;
        border-radius: 50%; animation: sbf-spin 0.7s linear infinite;
      }
      @keyframes sbf-spin { to { transform: rotate(360deg); } }

      #sbf-end-msg {
        display: none; text-align: center; padding: 28px 0; color: #9aa0a6;
        font-family: Google Sans, Roboto, sans-serif; font-size: 13px;
      }

      .sbf-block-btn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 24px; height: 24px; margin-left: 8px;
        background: #ef4444; border: none; border-radius: 50%;
        color: white; font-size: 13px; cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        vertical-align: middle; position: relative; z-index: 100; padding: 0;
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
      }
      .sbf-block-btn:hover { background: #dc2626; transform: scale(1.15) rotate(15deg); box-shadow: 0 4px 8px rgba(220, 38, 38, 0.4); }
      .sbf-block-btn::after {
        content: 'Block Domain'; position: absolute; bottom: 100%; left: 50%;
        transform: translateX(-50%); background: #0f172a; color: white;
        padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap;
        opacity: 0; pointer-events: none; transition: opacity 0.2s;
        margin-bottom: 6px; border: 1px solid #334155;
      }
      .sbf-block-btn:hover::after { opacity: 1; }
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
    googleModules = data.googleModules || {};
    infiniteScrollEnabled = data.infiniteScroll !== false;
    hiddenTabs = data.hiddenTabs || {};
    preferredDomains = data.preferredDomains || [];
    keywordFilters = data.blockedKeywords || [];
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function isAllTab() {
    const params = new URLSearchParams(window.location.search);
    const tbm = params.get('tbm');
    const udm = params.get('udm');
    if (tbm) return false;
    if (udm && udm !== '1') return false;
    return true;
  }

  function hideDomainLinks(link) {
    if (!searchFilters.length) return;
    try {
      const url = new URL(link.href);
      const domain = url.hostname.replace(/^www\./, '');
      if (searchFilters.some(d => domain === d || domain.endsWith('.' + d))) {
        const container = link.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c, [role="listitem"]');
        if (container) container.classList.add('sbf-hidden');
      }
    } catch(e) {}
  }

  function highlightPreferred(link) {
    if (!preferredDomains.length) return;
    try {
      const url = new URL(link.href);
      const domain = url.hostname.replace(/^www\./, '');
      if (preferredDomains.some(d => domain === d || domain.endsWith('.' + d))) {
        const container = link.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c');
        if (container) container.classList.add('sbf-preferred');
      }
    } catch(e) {}
  }

  function scanGoogleModules() {
    if (!isAllTab()) return;
    
    const killByHeader = (texts) => {
      document.querySelectorAll('h1, h2, h3, h4, [role="heading"]').forEach(el => {
        const text = el.innerText.toLowerCase();
        if (texts.some(t => typeof t === 'string' ? text === t : t.test(text))) {
          const container = el.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c, .v7W49e, .WwS1pe');
          if (container) container.classList.add('sbf-hidden');
        }
      });
    };

    if (googleModules.sponsored) {
      document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad, [data-text-ad]').forEach(el => el.classList.add('sbf-hidden'));
    }
    if (googleModules.images)   killByHeader(['images', 'bilder', 'image results']);
    if (googleModules.videos)   killByHeader(['videos', 'short videos', 'kurzvideos', 'reels', 'top stories']);
    if (googleModules.ask)      killByHeader(['people also ask', 'ähnliche fragen', 'nutzer fragen auch', 'others also ask']);
    if (googleModules.products) killByHeader(['products', 'produkte', 'popular products', 'shop for', 'kaufen', 'shopping results']);
    if (googleModules.latest)   killByHeader(['latest posts', 'discussions', 'neueste beiträge']);
    if (googleModules.search)   killByHeader(['related searches', 'verwandte suchanfragen', 'people also search for']);
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
        if (tabTextMap[key].some(label => text === label)) {
          let current = el;
          while (current.parentElement && current.parentElement !== tabBar && !current.parentElement.classList.contains('crJ18e')) {
            current = current.parentElement;
          }
          current.classList.add('sbf-hidden');
        }
      }
    });
  }

  function hideByKeyword() {
    if (!keywordFilters.length) return;
    document.querySelectorAll('.g, .MjjYud, .tF2Cxc, .hlcw0c').forEach(el => {
      const text = el.innerText.toLowerCase();
      if (keywordFilters.some(kw => text.includes(kw.toLowerCase()))) el.classList.add('sbf-hidden');
    });
  }

  function injectBlockButtons() {
    document.querySelectorAll('.yuRUbf, .v5yQqb, .ca_1, .MjjYud h3, .g h3, .tF2Cxc h3').forEach(header => {
      if (header.dataset.sbfBlockDone) return;
      const link = header.querySelector('a[href]');
      if (!link) return;
      
      header.dataset.sbfBlockDone = '1';
      const domain = new URL(link.href).hostname.replace(/^www\./, '');
      const btn = document.createElement('button');
      btn.className = 'sbf-block-btn';
      btn.innerHTML = '🚫';
      btn.title = `Block ${domain}`;
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
      header.appendChild(btn);
    });
  }

  function incrementalScan() {
    document.querySelectorAll('a[href]:not([data-sbf-done])').forEach(link => {
      hideDomainLinks(link);
      highlightPreferred(link);
      link.dataset.sbfDone = '1';
    });
    scanGoogleModules();
    hideByKeyword();
    hideGoogleTabs();
    injectBlockButtons();
  }

  // ─── Mutation Observer ─────────────────────────────────────────────────────
  let scanTimeout = null;
  const domObserver = new MutationObserver(() => {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(incrementalScan, 150);
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  // ─── Infinite Scroll ───────────────────────────────────────────────────────
  async function setupInfiniteScroll() {
    if (!infiniteScrollEnabled) return;
    const rso = document.getElementById('rso');
    if (!rso) return;

    window.addEventListener('scroll', async () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
        const nextLink = document.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"]');
        if (nextLink && !window.sbfFetching) {
          window.sbfFetching = true;
          const resp = await fetch(nextLink.href);
          const html = await resp.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const newRso = doc.getElementById('rso');
          if (newRso) {
            Array.from(newRso.children).forEach(child => rso.appendChild(child.cloneNode(true)));
          }
          const newNext = doc.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"]');
          const oldNext = document.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"]');
          if (oldNext) oldNext.href = newNext ? newNext.href : '';
          window.sbfFetching = false;
        }
      }
    });
  }

  // ─── Main ──────────────────────────────────────────────────────────────────
  await loadConfig();
  incrementalScan();
  setupInfiniteScroll();

  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'live_update') {
      await loadConfig();
      document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
      document.querySelectorAll('.sbf-preferred').forEach(el => el.classList.remove('sbf-preferred'));
      document.querySelectorAll('[data-sbf-done]').forEach(el => delete el.dataset.sbfDone);
      document.querySelectorAll('[data-sbf-block-done]').forEach(el => delete el.dataset.sbfBlockDone);
      incrementalScan();
    }
  });
})();
