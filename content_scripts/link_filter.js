(async function() {
  'use strict';
  
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      .sbf-hidden { display: none !important; }
      
      body.sbf-hide-more-btn .sbf-more-wrapper { display: none !important; }

      /* Block Button UI */
      .sbf-block-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: transparent; border: none; cursor: pointer; color: #94a3b8; margin-left: auto; z-index: 10; transition: all 0.2s; }
      .sbf-block-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      .sbf-block-btn svg { width: 14px; height: 14px; pointer-events: none; stroke-width: 2.5; }

      #sbf-loader { display: none; text-align: center; padding: 20px; color: #9aa0a6; gap: 10px; align-items: center; justify-content: center; }
      #sbf-loader.active { display: flex; }
      .sbf-spinner { width: 18px; height: 18px; border: 2px solid #444; border-top-color: #8ab4f8; border-radius: 50%; animation: sbf-spin 0.6s linear infinite; }
      @keyframes sbf-spin { to { transform: rotate(360deg); } }
      
      #sbf-nav-btns { position: fixed; bottom: 24px; left: 24px; z-index: 2147483640; display: none; flex-direction: column; gap: 8px; }
      .sbf-show-nav-btns #sbf-nav-btns { display: flex !important; }
      .sbf-nav-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--sbf-nav-bg, #1e293b) !important; color: var(--sbf-nav-color, #38bdf8) !important; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s; user-select: none; border: 1px solid rgba(255,255,255,0.1) !important; }
      .sbf-nav-btn.disabled { opacity: 0.15; pointer-events: none; filter: grayscale(1); } 
      .sbf-nav-btn svg { width: 22px; height: 22px; pointer-events: none; stroke: currentColor !important; }

      .sbf-hide-mod-ai [data-component-type="22"], .sbf-hide-mod-ai .SGE_container, .sbf-hide-mod-ai #super_results { display: none !important; }
      .sbf-hide-mod-products .wOPJ9c, .sbf-hide-mod-products .pla-unit, .sbf-hide-mod-products #tvcap { display: none !important; }
      .sbf-hide-mod-images [data-attrid="images universal"] { display: none !important; }
      .sbf-hide-mod-videos .MjjYud:has(.RzdJxc) { display: none !important; }
      .sbf-hide-mod-ask [data-attrid="wa_paa"], .sbf-hide-mod-ask .WwS1pe { display: none !important; }
      .sbf-hide-mod-pasf [data-attrid="people_also_search_for"], .sbf-hide-mod-pasf .nV_results { display: none !important; }
      .sbf-hide-mod-forums [data-attrid="discussions_and_forums"], .sbf-hide-mod-forums .f4S95b { display: none !important; }
      .sbf-hide-mod-sponsored #tads, .sbf-hide-mod-sponsored #tadsb, .sbf-hide-mod-sponsored #tvcap { display: none !important; }
      .sbf-hide-favicons .XNo29b, .sbf-hide-favicons .kvH3mc img { visibility: hidden !important; width: 0 !important; margin: 0 !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  let googleModules = {}, hiddenTabs = {}, searchFilters = [];
  let infiniteScrollEnabled = false, isFetching = false, loader = null;
  let navBtnColor = '#38bdf8', navBtnBgColor = '#1e293b', navBtnsEnabled = true;

  async function loadConfig() {
    const data = await chrome.storage.local.get(null);
    googleModules = data.googleModules || {};
    hiddenTabs = data.hiddenTabs || {};
    searchFilters = data.searchFilters || [];
    infiniteScrollEnabled = data.infiniteScroll === true;
    navBtnColor = data.navBtnColor || '#38bdf8';
    navBtnBgColor = data.navBtnBgColor || '#1e293b';
    navBtnsEnabled = data.navBtnsEnabled !== false;
    
    if (document.body) {
      const b = document.body;
      b.classList.toggle('sbf-hide-more-btn', !!hiddenTabs.more);
      b.classList.toggle('sbf-show-nav-btns', navBtnsEnabled);
      Object.keys(googleModules).forEach(key => b.classList.toggle(`sbf-hide-mod-${key}`, !!googleModules[key]));
      b.classList.toggle('sbf-hide-favicons', !!googleModules.favicons);

      document.documentElement.style.setProperty('--sbf-nav-color', navBtnColor);
      document.documentElement.style.setProperty('--sbf-nav-bg', navBtnBgColor);

      ensureNavBtns();
      updateNavBtns();
      incrementalScan(); 
    }
  }

  function scanGoogleModules() {
    const tagMoreButton = () => {
      document.querySelectorAll('div[role="navigation"] span, div[role="navigation"] div, #hdtb span, #hdtb div').forEach(el => {
        if (el.children.length > 1) return;
        const text = (el.textContent || '').toLowerCase().trim();
        if (text === 'more' || text === 'mehr') {
          const wrapper = el.closest('.crJ18e') || el.closest('div[role="button"]') || el;
          if (!wrapper.closest('g-popup') && !wrapper.closest('[role="menu"]')) {
            wrapper.classList.add('sbf-more-wrapper');
          }
        }
      });
      const ariaMore = document.querySelector('div[role="navigation"] [aria-haspopup="true"]:not([role="menuitem"]), #hdtb [aria-haspopup="true"]:not([role="menuitem"])');
      if (ariaMore && !ariaMore.closest('g-popup') && !ariaMore.closest('[role="menu"]')) {
          const wrapper = ariaMore.closest('.crJ18e') || ariaMore;
          wrapper.classList.add('sbf-more-wrapper');
      }
    };
    tagMoreButton();

    const killTabs = (texts, active, exactOnly = false) => {
      const allNativeTabs = document.querySelectorAll('div[role="navigation"] a, #hdtb a, #hdtb-tls, .t2051c, g-menu-item, div[role="button"]');
      allNativeTabs.forEach(el => {
        const text = (el.innerText || '').toLowerCase().trim();
        if (!text || text === 'more' || text === 'mehr' || el.classList.contains('sbf-more-wrapper')) return; 
        
        const isMatch = texts.some(t => exactOnly ? text === t : (text === t || text.includes(t)));
        if (isMatch) {
          let target = el.closest('g-menu-item') || el;
          if (target === el && el.parentElement && el.parentElement.children.length === 1 && !el.parentElement.classList.contains('MUFPAc')) {
            target = el.parentElement;
          }
          if (active) target.style.setProperty('display', 'none', 'important');
          else target.style.removeProperty('display');
        }
      });
    };
    
    killTabs(['tools', 'suchfilter'], hiddenTabs.tools, false);
    killTabs(['videos', 'video'], hiddenTabs.videos, true);
    killTabs(['short videos', 'kurzvideos'], hiddenTabs.shortvideos, false);
    killTabs(['news', 'nachrichten'], hiddenTabs.news, false);
    killTabs(['finance', 'finanzen'], hiddenTabs.finance, false);
    killTabs(['web'], hiddenTabs.web, true); 
    killTabs(['forums', 'foren'], hiddenTabs.forums, false);
    killTabs(['images', 'bilder'], hiddenTabs.images, false);
    killTabs(['shopping'], hiddenTabs.shopping, false);
    killTabs(['books', 'bücher'], hiddenTabs.books, false);
    killTabs(['maps', 'karten'], hiddenTabs.maps, false);

    const bruteForceKill = (texts, active) => {
      document.querySelectorAll('h1, h2, h3, h4, [role="heading"]').forEach(el => {
        const text = (el.innerText || '').toLowerCase().trim();
        if (texts.some(t => text === t || text.startsWith(t))) {
          const container = el.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .ez8I9c, .ULSxyf');
          if (container) {
            if (active) container.classList.add('sbf-hidden');
            else container.classList.remove('sbf-hidden');
          }
        }
      });
    };
    bruteForceKill(['ai overview', 'ki-übersicht', 'ai search'], googleModules.ai);
    bruteForceKill(['images', 'bilder'], googleModules.images);
    bruteForceKill(['videos', 'video'], googleModules.videos);
    bruteForceKill(['people also ask', 'ähnliche fragen', 'nutzer fragen auch'], googleModules.ask);
    bruteForceKill(['discussions and forums'], googleModules.forums);
    bruteForceKill(['products', 'produkte'], googleModules.products);
  }

  function ensureNavBtns() {
    if (!document.body || document.getElementById('sbf-nav-btns')) return;
    const c = document.createElement('div'); c.id = 'sbf-nav-btns';
    c.innerHTML = `<div class="sbf-nav-btn" id="sbf-scroll-top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="18 15 12 9 6 15"></polyline></svg></div><div class="sbf-nav-btn" id="sbf-scroll-bottom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg></div>`;
    document.body.appendChild(c);
    c.querySelector('#sbf-scroll-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    c.querySelector('#sbf-scroll-bottom').onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  function updateNavBtns() {
    const c = document.getElementById('sbf-nav-btns');
    if (c) {
      document.getElementById('sbf-scroll-top')?.classList.toggle('disabled', window.scrollY < 50);
      document.getElementById('sbf-scroll-bottom')?.classList.toggle('disabled', (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50));
    }
  }

  function incrementalScan() {
    scanGoogleModules();
    
    document.querySelectorAll('.g, .tF2Cxc').forEach(container => {
      const link = container.querySelector('a[href]');
      if (!link) return;

      try {
        const urlObj = new URL(link.href);
        if (urlObj.hostname.includes('google.')) return; 
        
        const domain = urlObj.hostname.replace(/^www\./, '');

        if (searchFilters.includes(domain)) {
          container.classList.add('sbf-hidden');
          return;
        }

        if (container.dataset.sbfBlockInjected) return;
        container.dataset.sbfBlockInjected = '1';

        const headerArea = container.querySelector('.yuRUbf > div') || container.querySelector('.yuRUbf');
        if (headerArea) {
          headerArea.style.display = 'flex';
          headerArea.style.alignItems = 'center';
          
          const btn = document.createElement('button');
          btn.className = 'sbf-block-btn';
          btn.title = `Block ${domain}`;
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
          
          btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!searchFilters.includes(domain)) {
              searchFilters.push(domain);
              await chrome.storage.local.set({ searchFilters });
              container.classList.add('sbf-hidden');
            }
          };
          
          headerArea.appendChild(btn);
        }
      } catch(e) {}
    });

    if (!loader && document.body) {
      loader = document.createElement('div'); loader.id = 'sbf-loader';
      loader.innerHTML = `<div class="sbf-spinner"></div><span>Loading results…</span>`;
      const rso = document.getElementById('rso'); if (rso) rso.after(loader);
    }
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
  
  loadConfig();
  const obs = new MutationObserver(() => incrementalScan());
  obs.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('scroll', onScroll, { passive: true });
})();