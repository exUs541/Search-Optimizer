(async function() {
  'use strict';
  
  // ─── Styles ───────────────────────────────────────────────────────────────
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      .sbf-hidden { display: none !important; }
      .sbf-preferred { border-left: 4px solid #22c55e !important; padding-left: 12px !important; background-color: rgba(34, 197, 94, 0.05) !important; }
      
      /* Aggressive CSS hiding */
      .sbf-hide-ai [data-component-type="22"], .sbf-hide-ai .SGE_container, .sbf-hide-ai #super_results, .sbf-hide-ai [data-sge-container] { display: none !important; }
      .sbf-hide-more .znY98, .sbf-hide-more .G9vS3e, .sbf-hide-more [aria-label*="More"], .sbf-hide-more [aria-label*="Mehr"] { display: none !important; }
      
      .sbf-hide-favicons .XNo29b, .sbf-hide-favicons .H6McF, .sbf-hide-favicons .CA96S, .sbf-hide-favicons .kvH3mc img,
      .sbf-hide-favicons .D8YfIc, .sbf-hide-favicons .V0690b, .sbf-hide-favicons .r99E7 { 
        visibility: hidden !important; width: 0 !important; margin: 0 !important;
      }

      .sbf-hide-products .wOPJ9c, .sbf-hide-products div:has(> .wOPJ9c), .sbf-hide-products .RyIFgf.rAdPSe:has(.wOPJ9c),
      .sbf-hide-products .commercial-unit-desktop-top, .sbf-hide-products .commercial-unit-desktop-rhs,
      .sbf-hide-products .pla-unit, .sbf-hide-products [data-asoch-dom-id], .sbf-hide-products #tvcap,
      .sbf-hide-products .MjjYud:has(.wOPJ9c) { display: none !important; }
      
      .sbf-hide-images [data-attrid="images universal"], .sbf-hide-images .MjjYud:has(.O8S99), .sbf-hide-images .MjjYud:has(.isv-r),
      .sbf-hide-images .MjjYud:has(.IWdOjd), .sbf-hide-images .MjjYud:has([href*="tbm=isch"]),
      .sbf-hide-images .MjjYud:has(.mqc2O), .sbf-hide-images .MjjYud:has(.mloK6), .sbf-hide-images .MjjYud:has(.cv2VAd) { display: none !important; }

      .sbf-hide-videos .MjjYud:has(.RzdJxc), .sbf-hide-videos .MjjYud:has(.dXiKIc), .sbf-hide-videos .MjjYud:has(.sI5x9c),
      .sbf-hide-videos .MjjYud:has(.EIaa9b), .sbf-hide-videos .MjjYud:has([data-attrid="VideoResult"]),
      .sbf-hide-videos .MjjYud:has(video), .sbf-hide-videos .MjjYud:has(.mnr-c), .sbf-hide-videos .MjjYud:has(.VibNM) { display: none !important; }

      .sbf-hide-ask [data-attrid="wa_paa"], .sbf-hide-ask .WwS1pe, .sbf-hide-ask .y8958c, .sbf-hide-ask .ez8I9c,
      .sbf-hide-ask .v7W49e:has([data-attrid="wa_paa"]), .sbf-hide-ask .MjjYud:has([data-attrid="wa_paa"]),
      .sbf-hide-ask .MjjYud:has(.WwS1pe), .sbf-hide-ask .g:has([data-attrid="wa_paa"]), .sbf-hide-ask .O8VmIc { display: none !important; }

      .sbf-hide-pasf [data-attrid="people_also_search_for"], .sbf-hide-pasf [data-pasf="true"], .sbf-hide-pasf .nV_results,
      .sbf-hide-pasf .V99SZd, .sbf-hide-pasf .MjjYud:has([data-attrid="people_also_search_for"]),
      .sbf-hide-pasf .MjjYud:has(.nV_results), .sbf-hide-pasf .MjjYud:has(.V99SZd) { display: none !important; }

      .sbf-hide-forums [data-attrid="discussions_and_forums"], .sbf-hide-forums .MjjYud:has([data-attrid="discussions_and_forums"]),
      .sbf-hide-forums .g:has([data-attrid="discussions_and_forums"]), .sbf-hide-forums .MjjYud:has(.f4S95b) { display: none !important; }

      #sbf-loader { display: none; text-align: center; padding: 20px; color: #9aa0a6; font-family: sans-serif; gap: 10px; align-items: center; justify-content: center; }
      #sbf-loader.active { display: flex; }
      .sbf-spinner { width: 18px; height: 18px; border: 2px solid #444; border-top-color: #8ab4f8; border-radius: 50%; animation: sbf-spin 0.6s linear infinite; }
      @keyframes sbf-spin { to { transform: rotate(360deg); } }
      .sbf-unpacked { margin-right: 16px !important; display: inline-block !important; }
      
      #sbf-nav-btns { position: fixed; bottom: 24px; left: 24px; z-index: 2147483640; display: none; flex-direction: column; gap: 8px; }
      .sbf-show-nav-btns #sbf-nav-btns.visible { display: flex; }
      .sbf-nav-btn { width: 44px; height: 44px; border-radius: 50%; background: #1e293b; border: 1px solid #334155; color: #38bdf8; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s; user-select: none; }
      .sbf-nav-btn:hover { background: #334155; transform: scale(1.05); color: #7dd3fc; }
      .sbf-nav-btn.disabled { opacity: 0.2; pointer-events: none; filter: grayscale(1); }
      .sbf-nav-btn svg { width: 20px; height: 20px; pointer-events: none; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ─── Config State ─────────────────────────────────────────────────────────
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
  let navBtnsEnabled = true;

  // ─── Core Logic ────────────────────────────────────────────────────────────
  function waitForBody(callback) {
    if (document.body) return callback();
    const observer = new MutationObserver((_, obs) => {
      if (document.body) {
        obs.disconnect();
        callback();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  async function loadConfig() {
    try {
      const data = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'preferredDomains', 'blockedKeywords', 'highlightEnabled', 'highlightColor', 'navBtnsEnabled']);
      searchFilters = (data.searchFilters || []).map(f => typeof f === 'string' ? f : (f.domain || ''));
      googleModules = data.googleModules || { ai: false, sponsored: false, latest: false, products: false, images: false, videos: false, ask: false, search: false, favicons: false, pasf: false, songs: false, knowledge: false, topstories: false, recipes: false, events: false, flights: false, hotels: false, twitter: false, forums: false };
      infiniteScrollEnabled = data.infiniteScroll === true;
      hiddenTabs = data.hiddenTabs || {};
      preferredDomains = (data.preferredDomains || []).map(d => typeof d === 'string' ? d : (d.domain || ''));
      keywordFilters = data.blockedKeywords || [];
      highlightEnabled = data.highlightEnabled === true;
      highlightColor = data.highlightColor || '#38bdf8';
      navBtnsEnabled = data.navBtnsEnabled !== false;
      
      waitForBody(() => {
        const b = document.body;
        b.classList.toggle('sbf-no-infinite', !infiniteScrollEnabled);
        b.classList.toggle('sbf-hide-ai', !!googleModules.ai);
        b.classList.toggle('sbf-hide-products', !!googleModules.products);
        b.classList.toggle('sbf-hide-images', !!googleModules.images);
        b.classList.toggle('sbf-hide-videos', !!googleModules.videos);
        b.classList.toggle('sbf-hide-ask', !!googleModules.ask);
        b.classList.toggle('sbf-hide-pasf', !!googleModules.pasf);
        b.classList.toggle('sbf-hide-forums', !!googleModules.forums);
        b.classList.toggle('sbf-hide-more', !!(hiddenTabs['more'] || hiddenTabs['unpack-more']));
        b.classList.toggle('sbf-hide-favicons', !!googleModules.favicons);
        b.classList.toggle('sbf-show-nav-btns', navBtnsEnabled);
        updateNavBtns();
      });

      updateHighlighting();
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
        (document.head || document.documentElement).appendChild(style);
      }
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) {
        style.textContent = `.g em, .g b, .MjjYud em, .MjjYud b { background-color: ${highlightColor}33 !important; color: ${highlightColor} !important; padding: 0 2px; border-radius: 2px; }`;
      }
    } else if (style) {
      style.remove();
    }
  }

  function scanGoogleModules() {
    const p = new URLSearchParams(window.location.search);
    const isAll = !p.get('tbm') && (!p.get('udm') || p.get('udm') === '1');
    if (!isAll) return;

    const bruteForceKill = (texts, active) => {
      if (!active) return;
      // Search in all relevant block elements
      document.querySelectorAll('h1, h2, h3, h4, [role="heading"], div, span').forEach(el => {
        if (el.dataset.sbfChecked) return;
        const text = (el.innerText || '').toLowerCase().trim();
        if (texts.some(t => text === t || text.startsWith(t))) {
          // If we found a match, check if it's a real heading or a labels
          const isHeading = ['H1','H2','H3','H4'].includes(el.tagName) || el.getAttribute('role') === 'heading' || el.classList.contains('G779ef') || el.classList.contains('p64Y7b');
          if (isHeading || (el.tagName === 'DIV' && text.length < 50)) {
            el.dataset.sbfChecked = '1';
            const container = el.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .WwS1pe, .tF2Cxc, .ULSxyf, .O8VmIc, .ez8I9c');
            if (container) {
              container.classList.add('sbf-hidden');
              // Recursive upward check
              if (container.parentElement && container.parentElement.children.length === 1) {
                container.parentElement.classList.add('sbf-hidden');
              }
            }
          }
        }
      });
    };

    bruteForceKill(['ai overview', 'ki-übersicht', 'ai search'], googleModules.ai);
    bruteForceKill(['images', 'bilder', 'show more images', 'weitere bilder', 'bilderergebnisse'], googleModules.images);
    bruteForceKill(['videos', 'short videos', 'kurzvideos', 'reels', 'video'], googleModules.videos);
    bruteForceKill(['people also ask', 'ähnliche fragen', 'nutzer fragen auch', 'people also asked', 'fragen zu', 'andere suchten auch nach', 'nutzer suchen auch'], googleModules.ask);
    bruteForceKill(['discussions and forums', 'diskussionen und foren', 'forums', 'foren', 'discussions & forums'], googleModules.forums);
    bruteForceKill(['products', 'produkte', 'shop for', 'kaufen'], googleModules.products);
    bruteForceKill(['latest posts', 'discussions', 'neueste beiträge', 'forums', 'diskussionen'], googleModules.latest);
    bruteForceKill(['related searches', 'verwandte suchanfragen', 'ähnliche suchanfragen'], googleModules.search);
    bruteForceKill(['people also search for', 'nutzer suchten auch nach', 'similar searches', 'nutzer suchten auch'], googleModules.pasf);
    bruteForceKill(['songs', 'titel', 'lieder'], googleModules.songs);
    bruteForceKill(['top stories', 'schlagzeilen', 'top-meldungen'], googleModules.topstories);
    bruteForceKill(['recipes', 'rezepte'], googleModules.recipes);
    bruteForceKill(['events', 'veranstaltungen', 'termine'], googleModules.events);
    bruteForceKill(['flights', 'flüge'], googleModules.flights);
    bruteForceKill(['hotels', 'unterkünfte'], googleModules.hotels);
    bruteForceKill(['twitter', 'x posts', 'posts on x'], googleModules.twitter);

    // Aggressive PAA/PASF/Forums via data attributes
    if (googleModules.ask) {
      document.querySelectorAll('[data-attrid="wa_paa"], .WwS1pe, .y8958c, .ez8I9c').forEach(el => {
        let container = el.closest('.MjjYud, .g, .ULSxyf, .v7W49e, .WwS1pe, .O8VmIc') || el;
        container.classList.add('sbf-hidden');
      });
    }
    if (googleModules.forums) {
      document.querySelectorAll('[data-attrid="discussions_and_forums"], .f4S95b').forEach(el => {
        const container = el.closest('.MjjYud, .g, .ULSxyf') || el;
        container.classList.add('sbf-hidden');
      });
    }
    if (googleModules.pasf) {
      document.querySelectorAll('[data-attrid="people_also_search_for"], [data-pasf="true"], .nV_results, .V99SZd').forEach(el => {
        const container = el.closest('.MjjYud, .g, .ULSxyf') || el;
        container.classList.add('sbf-hidden');
      });
    }
    if (googleModules.sponsored) {
      document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad, [data-text-ad], .commercial-unit-desktop-top, .commercial-unit-desktop-rhs').forEach(el => el.classList.add('sbf-hidden'));
    }
    if (googleModules.knowledge) {
      document.querySelectorAll('.kp-wholepage, .liYKde, .kp-blk, .I6TXqe, .osrp-blk').forEach(el => el.classList.add('sbf-hidden'));
    }

    // Aggressive Video Heuristics
    if (googleModules.videos) {
      document.querySelectorAll('.MjjYud, .g, .ULSxyf').forEach(block => {
        if (block.classList.contains('sbf-hidden')) return;
        const hasVideoThumb = block.querySelector('.RzdJxc, .dXiKIc, .sI5x9c, .mnr-c, video, [data-attrid="VideoResult"]');
        const hasYtLink = block.querySelector('a[href*="youtube.com/watch"], a[href*="youtu.be/"]');
        if (hasVideoThumb || (hasYtLink && block.querySelectorAll('a[href*="youtube.com/watch"], a[href*="youtu.be/"]').length >= 2)) {
          block.classList.add('sbf-hidden');
        }
      });
    }

    // Aggressive Product Heuristics
    if (googleModules.products) {
      document.querySelectorAll('.wOPJ9c, .pla-unit, [data-asoch-dom-id], .CU7eYc').forEach(el => {
        const wrapper = el.closest('.MjjYud, .g, .ULSxyf, .v7W49e') || el.parentElement?.parentElement;
        if (wrapper) wrapper.classList.add('sbf-hidden');
      });
      document.querySelectorAll('.MjjYud, .g').forEach(block => {
        if (!block.classList.contains('sbf-hidden')) {
          const prices = block.querySelectorAll('[aria-label*="€"], [aria-label*="$"], .HRLxBb');
          const stars = block.querySelectorAll('.GpEInteractiveStar, .Fam1ne, [aria-label*="stars"]');
          if (prices.length >= 2 && stars.length >= 1) block.classList.add('sbf-hidden');
        }
      });
    }
  }

  function hideGoogleTabs() {
    const activeKeys = Object.keys(hiddenTabs).filter(k => hiddenTabs[k]);
    document.querySelectorAll('#hdtb-msb a, .MUFdbf a, .K9vS3e a, .OIn58 a, .crJ18e a, .Uo8X3b a, .C6AK7c, [role="tab"], .hdtb-mitem a').forEach(el => {
      const text = (el.innerText || '').toLowerCase().trim();
      const attrid = (el.getAttribute('data-attrid') || '').toLowerCase();
      el.classList.remove('sbf-hidden');
      if (el.parentElement.classList.contains('hdtb-mitem')) el.parentElement.classList.remove('sbf-hidden');
      
      const tabLabels = {
        'images': ['images', 'bilder'], 'videos': ['videos'], 'news': ['news', 'nachrichten'],
        'finance': ['finance', 'finanzen'], 'maps': ['maps', 'karten'], 'books': ['books', 'bücher'],
        'shopping': ['shopping'], 'more': ['more', 'mehr']
      };
      for (const key of activeKeys) {
        if ((tabLabels[key] && tabLabels[key].includes(text)) || attrid === key) {
          let target = el.parentElement.classList.contains('hdtb-mitem') ? el.parentElement : el;
          target.classList.add('sbf-hidden');
        }
      }
    });
  }

  function incrementalScan() {
    scanGoogleModules();
    hideGoogleTabs();
    document.querySelectorAll('a[href]').forEach(link => {
      if (link.dataset.sbfDone) return;
      link.dataset.sbfDone = '1';
      try {
        const domain = new URL(link.href).hostname.replace(/^www\./, '');
        if (searchFilters.some(d => domain === d || domain.endsWith('.' + d))) {
          const container = link.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c, [role="listitem"]');
          if (container) container.classList.add('sbf-hidden');
        }
        if (preferredDomains.some(d => domain === d || domain.endsWith('.' + d))) {
          const container = link.closest('.g, .MjjYud, .tF2Cxc, .hlcw0c');
          if (container) container.classList.add('sbf-preferred');
        }
      } catch(e) {}
    });
    if (keywordFilters.length) {
      document.querySelectorAll('.g, .MjjYud, .tF2Cxc, .hlcw0c').forEach(el => {
        if (!el.classList.contains('sbf-hidden') && keywordFilters.some(kw => el.innerText.toLowerCase().includes(kw.toLowerCase()))) {
          el.classList.add('sbf-hidden');
        }
      });
    }
    ensureLoader();
  }

  function updateNavBtns() {
    ensureNavBtns();
    const container = document.getElementById('sbf-nav-btns');
    if (container) {
      container.classList.add('visible');
      const topBtn = document.getElementById('sbf-scroll-top');
      const bottomBtn = document.getElementById('sbf-scroll-bottom');
      const isAtTop = window.scrollY < 50;
      const isAtBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50);
      if (topBtn) topBtn.classList.toggle('disabled', isAtTop);
      if (bottomBtn) bottomBtn.classList.toggle('disabled', isAtBottom);
    }
  }

  function ensureNavBtns() {
    if (!document.body || document.getElementById('sbf-nav-btns')) return;
    const container = document.createElement('div');
    container.id = 'sbf-nav-btns';
    container.innerHTML = `
      <div class="sbf-nav-btn" id="sbf-scroll-top" title="Scroll to Top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></div>
      <div class="sbf-nav-btn" id="sbf-scroll-bottom" title="Scroll to Bottom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div>
    `;
    document.body.appendChild(container);
    container.querySelector('#sbf-scroll-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    container.querySelector('#sbf-scroll-bottom').addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  }

  function ensureLoader() {
    if (loader || !document.body) return;
    loader = document.createElement('div');
    loader.id = 'sbf-loader';
    loader.innerHTML = `<div class="sbf-spinner"></div><span>Loading more results…</span>`;
    const rso = document.getElementById('rso') || document.querySelector('.v7W49e');
    if (rso) rso.after(loader); else document.body.appendChild(loader);
  }

  async function onScroll() {
    updateNavBtns();
    if (!infiniteScrollEnabled || isFetching) return;
    if ((document.body.offsetHeight - window.innerHeight - window.scrollY) < 1200) {
      const nextLink = document.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="Weiter"]');
      if (nextLink?.href) {
        isFetching = true; if (loader) loader.classList.add('active');
        try {
          const resp = await fetch(nextLink.href);
          const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
          const targetRso = document.getElementById('rso') || document.querySelector('.v7W49e');
          const newRso = doc.querySelector('#rso');
          if (newRso && targetRso) {
            Array.from(newRso.children).forEach(child => targetRso.appendChild(child.cloneNode(true)));
            const newNext = doc.querySelector('#pnnext, a[aria-label*="Next"], a[aria-label*="Weiter"]');
            if (nextLink && newNext) nextLink.href = newNext.href; else nextLink?.remove();
            document.querySelectorAll('[data-sbf-checked]').forEach(el => delete el.dataset.sbfChecked);
            incrementalScan();
          }
        } catch (e) {} finally { if (loader) loader.classList.remove('active'); setTimeout(() => { isFetching = false; }, 1000); }
      }
    }
  }

  // ─── Listeners ─────────────────────────────────────────────────────────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      loadConfig().then(() => {
        document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
        document.querySelectorAll('[data-sbf-checked], [data-sbf-done]').forEach(el => { delete el.dataset.sbfChecked; delete el.dataset.sbfDone; });
        incrementalScan();
      });
    }
  });

  // ─── Init ──────────────────────────────────────────────────────────────────
  await loadConfig();
  waitForBody(() => {
    incrementalScan();
    const obs = new MutationObserver(() => incrementalScan());
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onScroll, { passive: true });
  });
})();
