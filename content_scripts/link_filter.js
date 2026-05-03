(async function() {
  'use strict';
  // ─── Styles ───────────────────────────────────────────────────────────────
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      .sbf-hidden { display: none !important; visibility: hidden !important; }
      .sbf-preferred { border-left: 4px solid #22c55e !important; padding-left: 12px !important; background-color: rgba(34, 197, 94, 0.05) !important; }
      /* Aggressive CSS hiding for AI Overviews */
      .sbf-hide-ai [data-component-type="22"], .sbf-hide-ai .SGE_container, .sbf-hide-ai #super_results, .sbf-hide-ai [data-sge-container] { display: none !important; }
      /* More button hiding */
      .sbf-hide-more .znY98, .sbf-hide-more .G9vS3e, .sbf-hide-more [aria-label*="More"], .sbf-hide-more [aria-label*="Mehr"] { display: none !important; }
      /* Suppress Google's native continuous scroll containers */
      .sbf-no-infinite .SJ974, .sbf-no-infinite .GNJ78, .sbf-no-infinite #botstuff .GNJ78 { display: none !important; }
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

  async function loadConfig() {
    try {
      const data = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'preferredDomains', 'blockedKeywords']);
      searchFilters = (data.searchFilters || []).map(f => typeof f === 'string' ? f : (f.domain || ''));
      googleModules = data.googleModules || { ai: false, sponsored: false, latest: false, products: false, images: false, videos: false, ask: false, search: false };
      infiniteScrollEnabled = data.infiniteScroll === true;
      hiddenTabs = data.hiddenTabs || {};
      preferredDomains = (data.preferredDomains || []).map(d => typeof d === 'string' ? d : (d.domain || ''));
      keywordFilters = data.blockedKeywords || [];
      
      if (infiniteScrollEnabled) {
        document.body.classList.remove('sbf-no-infinite');
      } else {
        document.body.classList.add('sbf-no-infinite');
      }
      
      if (googleModules.ai) {
        document.body.classList.add('sbf-hide-ai');
      } else {
        document.body.classList.remove('sbf-hide-ai');
      }

      if (hiddenTabs['more'] || hiddenTabs['unpack-more']) {
        document.body.classList.add('sbf-hide-more');
      } else {
        document.body.classList.remove('sbf-hide-more');
      }
      
      console.log('[Search Optimizer] Config updated. Infinite Scroll:', infiniteScrollEnabled);
    } catch (e) {
      console.error('[Search Optimizer] Error loading config:', e);
    }
  }

  // ─── Hiding Logic ──────────────────────────────────────────────────────────
  function isAllTab() {
    const p = new URLSearchParams(window.location.search);
    return !p.get('tbm') && (!p.get('udm') || p.get('udm') === '1');
  }

  function scanGoogleModules() {
    if (!isAllTab()) return;
    
    // AI Overviews (SGE) - Aggressive selectors
    if (googleModules.ai) {
      const sgeSelectors = [
        '[data-component-type="22"]', 
        '.Z97S6d', '.V99yG', '.SGE_container', 
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
      
      // Text-based fallback scanning
      document.querySelectorAll('div, section, [role="region"], h1, h2, h3').forEach(el => {
        if (el.classList.contains('sbf-hidden')) return;
        const label = el.getAttribute('aria-label') || '';
        const text = el.innerText || '';
        if (label.startsWith('AI Overview') || label.startsWith('KI-Übersicht') || text.startsWith('AI Overview') || text.startsWith('KI-Übersicht')) {
          el.classList.add('sbf-hidden');
          const wrapper = el.closest('.MjjYud, .g');
          if (wrapper) wrapper.classList.add('sbf-hidden');
        }
      });
    }

    if (googleModules.sponsored) {
      document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad, [data-text-ad], .MjjYud:has(.uEierd)').forEach(el => el.classList.add('sbf-hidden'));
    }

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

    killByHeading(['ai overview', 'ki-übersicht', 'ai search'], googleModules.ai);
    killByHeading(['images', 'bilder'], googleModules.images);
    killByHeading(['videos', 'short videos', 'kurzvideos', 'reels'], googleModules.videos);
    killByHeading(['people also ask', 'ähnliche fragen', 'nutzer fragen auch'], googleModules.ask);
    killByHeading(['products', 'produkte', 'shop for', 'kaufen'], googleModules.products);
    killByHeading(['latest posts', 'discussions', 'neueste beiträge'], googleModules.latest);
    killByHeading(['related searches', 'verwandte suchanfragen', 'people also search for'], googleModules.search);
  }

  function hideGoogleTabs() {
    const activeKeys = Object.keys(hiddenTabs).filter(k => hiddenTabs[k]);
    
    // 1. Unpack "More" Menu logic - Stable Static Injection
    const moreBtn = Array.from(document.querySelectorAll('a, div[role="button"], .C6AK7c, .z1asCe, .hdtb-mitem, .znY98, .G9vS3e')).find(el => {
      const t = el.innerText.toLowerCase().trim();
      return (t === 'more' || t === 'mehr' || el.getAttribute('aria-label')?.toLowerCase().includes('more') || el.getAttribute('aria-label')?.toLowerCase().includes('mehr'));
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

    // 2. Hide specific tabs
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

    document.querySelectorAll('#hdtb-msb a, .MUFdbf a, .K9vS3e a, .OIn58 a, .crJ18e a, .Uo8X3b a, .C6AK7c').forEach(el => {
      const text = el.innerText.toLowerCase().trim();
      el.classList.remove('sbf-hidden');
      for (const key of activeKeys) {
        if (tabTextMap[key] && tabTextMap[key].some(label => text === label)) {
          let target = el;
          if (el.parentElement.tagName === 'DIV' && el.parentElement.children.length === 1) {
            target = el.parentElement;
          }
          target.classList.add('sbf-hidden');
        }
      }
    });

    // 3. Hide "Tools" button
    const toolsBtn = Array.from(document.querySelectorAll('a, div[role="button"], #hdtb-tls, .Uo8X3b')).find(el => {
      const t = el.innerText.toLowerCase().trim();
      return t === 'tools' || t === 'werkzeuge';
    });
    if (toolsBtn) {
      if (hiddenTabs['tools']) toolsBtn.classList.add('sbf-hidden');
      else toolsBtn.classList.remove('sbf-hidden');
    }
  }

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
      const text = el.innerText.toLowerCase();
      if (keywordFilters.some(kw => text.includes(kw.toLowerCase()))) el.classList.add('sbf-hidden');
    });
  }

  function incrementalScan() {
    document.querySelectorAll('a[href]:not([data-sbf-done])').forEach(applyFiltersOnLink);
    scanGoogleModules();
    hideGoogleTabs();
    hideByKeywords();
  }

  // ─── Infinite Scroll ───────────────────────────────────────────────────────
  let isFetching = false;
  let loader = null;

  function ensureLoader() {
    if (loader) return;
    loader = document.createElement('div');
    loader.id = 'sbf-loader';
    loader.innerHTML = '<div class="sbf-spinner"></div><span>Loading more results...</span>';
    const rso = document.getElementById('rso');
    if (rso) rso.after(loader);
  }

  async function onScroll() {
    if (infiniteScrollEnabled === false) {
      if (loader) loader.classList.remove('active');
      return;
    }
    if (isFetching) return;
    const scrollThreshold = document.body.offsetHeight - window.innerHeight - 1500;
    if (window.scrollY >= scrollThreshold) {
      const nextLink = document.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="Weiter"]');
      if (nextLink && nextLink.href) {
        isFetching = true;
        ensureLoader();
        loader.classList.add('active');
        try {
          const resp = await fetch(nextLink.href);
          const html = await resp.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const newRso = doc.getElementById('rso');
          const currentRso = document.getElementById('rso');
          if (newRso && currentRso) {
            const fragment = document.createDocumentFragment();
            Array.from(newRso.children).forEach(child => { fragment.appendChild(child.cloneNode(true)); });
            currentRso.appendChild(fragment);
            const newNext = doc.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="Weiter"]');
            const oldNext = document.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="Weiter"]');
            if (oldNext && newNext) oldNext.href = newNext.href;
            else if (oldNext) oldNext.remove();
            incrementalScan();
          }
        } catch (e) { console.error('[Search Optimizer] Fetch failed:', e); }
        finally { loader.classList.remove('active'); setTimeout(() => { isFetching = false; }, 800); }
      }
    }
  }

  // ─── Main ──────────────────────────────────────────────────────────────────
  await loadConfig();
  incrementalScan();
  window.addEventListener('scroll', onScroll, { passive: true });

  const observer = new MutationObserver(() => { incrementalScan(); });
  observer.observe(document.body, { childList: true, subtree: true });

  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'live_update') {
      console.log('[Search Optimizer] Live Update');
      await loadConfig();
      document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
      document.querySelectorAll('.sbf-preferred').forEach(el => el.classList.remove('sbf-preferred'));
      document.querySelectorAll('.sbf-unpacked').forEach(el => el.remove());
      document.querySelectorAll('[data-sbf-done]').forEach(el => delete el.dataset.sbfDone);
      incrementalScan();
    }
  });
})();
