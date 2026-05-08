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
      
      #sbf-nav-btns { position: fixed; bottom: 24px; left: 24px; z-index: 2147483640; display: none; flex-direction: column; gap: 8px; }
      .sbf-show-nav-btns #sbf-nav-btns.visible { display: flex; }
      .sbf-nav-btn { 
        width: 44px; height: 44px; border-radius: 50%; 
        background: var(--sbf-nav-bg, #1e293b) !important; 
        border: 1px solid rgba(255,255,255,0.1); 
        color: var(--sbf-nav-color, #38bdf8) !important; 
        display: flex; align-items: center; justify-content: center; cursor: pointer; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s; user-select: none; 
      }
      .sbf-nav-btn:hover { transform: scale(1.05); filter: brightness(1.2); }
      .sbf-nav-btn.disabled { opacity: 0.2; pointer-events: none; filter: grayscale(1); }
      .sbf-nav-btn svg { width: 20px; height: 20px; pointer-events: none; stroke: currentColor !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ─── Config State ─────────────────────────────────────────────────────────
  let searchFilters = [];
  let googleModules = {};
  let infiniteScrollEnabled = false;
  let hiddenTabs = {};
  let highlightEnabled = false;
  let highlightColor = '#38bdf8';
  let navBtnColor = '#38bdf8';
  let navBtnBgColor = '#1e293b';
  let isFetching = false;
  let loader = null;
  let navBtnsEnabled = true;

  // ─── Core Logic ────────────────────────────────────────────────────────────
  function waitForBody(callback) {
    if (document.body) return callback();
    const observer = new MutationObserver((_, obs) => {
      if (document.body) { obs.disconnect(); callback(); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  async function loadConfig() {
    try {
      const data = await chrome.storage.local.get(null);
      searchFilters = data.searchFilters || [];
      googleModules = data.googleModules || {};
      infiniteScrollEnabled = data.infiniteScroll === true;
      hiddenTabs = data.hiddenTabs || {};
      highlightEnabled = data.highlightEnabled === true;
      highlightColor = data.highlightColor || '#38bdf8';
      navBtnColor = data.navBtnColor || '#38bdf8';
      navBtnBgColor = data.navBtnBgColor || '#1e293b';
      navBtnsEnabled = data.navBtnsEnabled !== false;
      
      waitForBody(() => {
        const b = document.body;
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
        
        document.documentElement.style.setProperty('--sbf-nav-color', navBtnColor);
        document.documentElement.style.setProperty('--sbf-nav-bg', navBtnBgColor);
        updateNavBtns();
        updateHighlighting();
      });
    } catch (e) { console.error('[Search Optimizer] Error loading config:', e); }
  }

  function updateHighlighting() {
    let style = document.getElementById('sbf-highlight-style');
    if (highlightEnabled) {
      if (!style) {
        style = document.createElement('style'); style.id = 'sbf-highlight-style';
        (document.head || document.documentElement).appendChild(style);
      }
      style.textContent = `.g em, .g b, .MjjYud em, .MjjYud b { background-color: ${highlightColor}33 !important; color: ${highlightColor} !important; padding: 0 2px; border-radius: 2px; }`;
    } else if (style) style.remove();
  }

  function scanGoogleModules() {
    const bruteForceKill = (texts, active) => {
      if (!active) return;
      document.querySelectorAll('h1, h2, h3, h4, [role="heading"], div, span').forEach(el => {
        if (el.dataset.sbfChecked) return;
        const text = (el.innerText || '').toLowerCase().trim();
        if (texts.some(t => text === t || text.startsWith(t))) {
          const isHeading = ['H1','H2','H3','H4'].includes(el.tagName) || el.getAttribute('role') === 'heading';
          if (isHeading || (el.tagName === 'DIV' && text.length < 50)) {
            el.dataset.sbfChecked = '1';
            const container = el.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .WwS1pe, .tF2Cxc, .ULSxyf, .O8VmIc, .ez8I9c');
            if (container) container.classList.add('sbf-hidden');
          }
        }
      });
    };
    bruteForceKill(['ai overview', 'ki-übersicht', 'ai search'], googleModules.ai);
    bruteForceKill(['images', 'bilder'], googleModules.images);
    bruteForceKill(['videos', 'video'], googleModules.videos);
    bruteForceKill(['people also ask', 'ähnliche fragen', 'nutzer fragen auch'], googleModules.ask);
    bruteForceKill(['discussions and forums', 'diskussionen und foren', 'forums', 'foren'], googleModules.forums);
    bruteForceKill(['products', 'produkte', 'shop for'], googleModules.products);
    if (googleModules.sponsored) document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad').forEach(el => el.classList.add('sbf-hidden'));
  }

  function hideGoogleTabs() {
    document.querySelectorAll('#hdtb-msb a, .MUFdbf a, [role="tab"]').forEach(el => {
      const text = (el.innerText || '').toLowerCase().trim();
      const tabLabels = { 'images': ['images', 'bilder'], 'videos': ['videos'], 'news': ['news', 'nachrichten'], 'shopping': ['shopping'], 'more': ['more', 'mehr'] };
      for (const key in hiddenTabs) {
        if (hiddenTabs[key] && tabLabels[key] && tabLabels[key].includes(text)) {
          const target = el.closest('.hdtb-mitem') || el;
          target.classList.add('sbf-hidden');
        }
      }
    });
  }

  function incrementalScan() {
    scanGoogleModules(); hideGoogleTabs();
    document.querySelectorAll('a[href]').forEach(link => {
      if (link.dataset.sbfDone) return; link.dataset.sbfDone = '1';
      try {
        const domain = new URL(link.href).hostname.replace(/^www\./, '');
        if (searchFilters.includes(domain)) { const container = link.closest('.g, .MjjYud, .tF2Cxc'); if (container) container.classList.add('sbf-hidden'); }
      } catch(e) {}
    });
    ensureLoader();
  }

  function updateNavBtns() {
    ensureNavBtns();
    const container = document.getElementById('sbf-nav-btns');
    if (container) {
      container.classList.add('visible');
      const isAtTop = window.scrollY < 50;
      const isAtBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50);
      document.getElementById('sbf-scroll-top')?.classList.toggle('disabled', isAtTop);
      document.getElementById('sbf-scroll-bottom')?.classList.toggle('disabled', isAtBottom);
    }
  }

  function ensureNavBtns() {
    if (!document.body || document.getElementById('sbf-nav-btns')) return;
    const container = document.createElement('div'); container.id = 'sbf-nav-btns';
    container.innerHTML = `
      <div class="sbf-nav-btn" id="sbf-scroll-top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></div>
      <div class="sbf-nav-btn" id="sbf-scroll-bottom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></div>
    `;
    document.body.appendChild(container);
    container.querySelector('#sbf-scroll-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    container.querySelector('#sbf-scroll-bottom').onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function ensureLoader() {
    if (loader || !document.body) return;
    loader = document.createElement('div'); loader.id = 'sbf-loader';
    loader.innerHTML = `<div class="sbf-spinner"></div><span>Loading more results…</span>`;
    const rso = document.getElementById('rso'); if (rso) rso.after(loader);
  }

  async function onScroll() {
    updateNavBtns();
    if (!infiniteScrollEnabled || isFetching) return;
    if ((document.body.offsetHeight - window.innerHeight - window.scrollY) < 1200) {
      const nextLink = document.querySelector('#pnnext');
      if (nextLink?.href) {
        isFetching = true; loader?.classList.add('active');
        try {
          const resp = await fetch(nextLink.href);
          const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
          const targetRso = document.getElementById('rso'); const newRso = doc.querySelector('#rso');
          if (newRso && targetRso) {
            Array.from(newRso.children).forEach(child => targetRso.appendChild(child.cloneNode(true)));
            const newNext = doc.querySelector('#pnnext'); if (newNext) nextLink.href = newNext.href; else nextLink.remove();
            incrementalScan();
          }
        } catch (e) {} finally { loader?.classList.remove('active'); setTimeout(() => { isFetching = false; }, 1000); }
      }
    }
  }

  chrome.runtime.onMessage.addListener((m) => { if (m.action === "live_update") loadConfig(); });
  chrome.storage.onChanged.addListener(() => loadConfig());

  await loadConfig();
  waitForBody(() => {
    incrementalScan();
    const obs = new MutationObserver(() => incrementalScan());
    obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onScroll, { passive: true });
  });
})();
