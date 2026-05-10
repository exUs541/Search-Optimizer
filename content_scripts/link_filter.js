(async function() {
  'use strict';
  
  // ==========================================================================
  // 0. HELPERS
  // ==========================================================================
  
  /**
   * Converts a HEX color string to an RGBA string for transparency support.
   * @param {string} hex - The hex color code (e.g., "#38bdf8").
   * @param {number} alpha - The opacity value between 0 and 1.
   * @returns {string} The formatted RGBA string.
   */
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // ==========================================================================
  // 1. CSS INJECTION
  // ==========================================================================
  // Dynamically injects core structural and aesthetic CSS rules into the document head.
  // Uses !important to forcefully override Google's highly specific dynamic classes.
  
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      /* Core Hiding Classes */
      .sbf-hidden { display: none !important; }
      body.sbf-hide-more-btn .sbf-more-wrapper { display: none !important; }

      /* Block Button UI */
      .sbf-block-btn { 
        display: inline-flex !important; 
        align-items: center; 
        justify-content: center; 
        width: 22px; 
        height: 22px; 
        border-radius: 50%; 
        background: transparent; 
        border: none; 
        cursor: pointer; 
        color: #ef4444; 
        margin: 0 6px !important;
        margin-left: 20px !important;
        padding: 0;
        transition: background 0.2s;
        flex-shrink: 0;
        position: static !important;
        transform: none !important;
      }
      .sbf-block-btn:hover { background: rgba(239, 68, 68, 0.15); }
      .sbf-block-btn svg { width: 14px; height: 14px; pointer-events: none; }

      /* Infinite Scroll Loader UI */
      #sbf-loader { display: none; text-align: center; padding: 20px; color: #9aa0a6; gap: 10px; align-items: center; justify-content: center; }
      #sbf-loader.active { display: flex; }
      .sbf-spinner { width: 18px; height: 18px; border: 2px solid #444; border-top-color: #8ab4f8; border-radius: 50%; animation: sbf-spin 0.6s linear infinite; }
      @keyframes sbf-spin { to { transform: rotate(360deg); } }
      
      /* Navigation Buttons (Scroll to Top/Bottom) */
      #sbf-nav-btns { position: fixed; bottom: 24px; left: 24px; z-index: 2147483640; display: none; flex-direction: column; gap: 8px; }
      .sbf-show-nav-btns #sbf-nav-btns { display: flex !important; }
      .sbf-nav-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--sbf-nav-bg, #1e293b) !important; color: var(--sbf-nav-color, #38bdf8) !important; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s; user-select: none; border: 1px solid rgba(255,255,255,0.1) !important; }
      .sbf-nav-btn.disabled { opacity: 0.15; pointer-events: none; filter: grayscale(1); } 
      .sbf-nav-btn svg { width: 22px; height: 22px; pointer-events: none; stroke: currentColor !important; }

      /* Google Module Selectors (Hardcoded overrides for structural DOM elements) */
      .sbf-hide-mod-ai [data-component-type="22"], .sbf-hide-mod-ai .SGE_container, .sbf-hide-mod-ai #super_results { display: none !important; }
      .sbf-hide-mod-products .wOPJ9c, .sbf-hide-mod-products .pla-unit, .sbf-hide-mod-products #tvcap { display: none !important; }
      .sbf-hide-mod-images [data-attrid="images universal"] { display: none !important; }
      .sbf-hide-mod-videos .MjjYud:has(.RzdJxc) { display: none !important; }
      .sbf-hide-mod-ask [data-attrid="wa_paa"], .sbf-hide-mod-ask .WwS1pe { display: none !important; }
      .sbf-hide-mod-pasf [data-attrid="people_also_search_for"], .sbf-hide-mod-pasf .nV_results, .sbf-hide-mod-pasf .K877S, .sbf-hide-mod-pasf .W67Drf { display: none !important; }
      .sbf-hide-mod-forums [data-attrid="discussions_and_forums"], .sbf-hide-mod-forums .f4S95b { display: none !important; }
      .sbf-hide-mod-sponsored #tads, .sbf-hide-mod-sponsored #tadsb, .sbf-hide-mod-sponsored #tvcap { display: none !important; }
      .sbf-hide-mod-locations [data-attrid="local_universal"], .sbf-hide-mod-locations .L9S79c, .sbf-hide-mod-locations #lu_map { display: none !important; }
      .sbf-hide-favicons .XNo29b, .sbf-hide-favicons .kvH3mc img { visibility: hidden !important; width: 0 !important; margin: 0 !important; }
      
      /* Highlighting UI */
      .sbf-highlight { 
        border: 2px solid var(--sbf-highlight-color, #38bdf8) !important; 
        background: var(--sbf-highlight-bg, rgba(56, 189, 248, 0.05)) !important;
        border-radius: 12px !important;
        padding: 10px !important;
        margin: 5px -10px !important;
        box-shadow: 0 4px 15px var(--sbf-highlight-bg) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ==========================================================================
  // 2. STATE MANAGER
  // ==========================================================================
  // Maintains local copies of Chrome storage to prevent asynchronous latency 
  // during rapid DOM mutation events.
  
  let googleModules = {}, hiddenTabs = {}, searchFilters = [];
  let highlightFilters = [], highlightKeywords = [];
  let infiniteScrollEnabled = false, isFetching = false, loader = null;
  let navBtnColor = '#38bdf8', navBtnBgColor = '#1e293b', navBtnsEnabled = true;
  let highlightEnabled = false, highlightColor = '#38bdf8';

  /**
   * Fetches latest configuration from Chrome Storage and applies global CSS variables/classes.
   */
  async function loadConfig() {
    const data = await chrome.storage.local.get(null);
    googleModules = data.googleModules || {};
    hiddenTabs = data.hiddenTabs || {};
    searchFilters = data.searchFilters || [];
    highlightFilters = data.highlightFilters || [];
    highlightKeywords = data.highlightKeywords || [];
    infiniteScrollEnabled = data.infiniteScroll === true;
    navBtnColor = data.navBtnColor || '#38bdf8';
    navBtnBgColor = data.navBtnBgColor || '#1e293b';
    navBtnsEnabled = data.navBtnsEnabled !== false;
    highlightEnabled = !!data.highlightEnabled;
    highlightColor = data.highlightColor || '#38bdf8';
    
    if (document.body) {
      const b = document.body;
      
      // Toggle body classes to trigger CSS hiding rules
      b.classList.toggle('sbf-hide-more-btn', !!hiddenTabs.more);
      b.classList.toggle('sbf-show-nav-btns', navBtnsEnabled);
      Object.keys(googleModules).forEach(key => b.classList.toggle(`sbf-hide-mod-${key}`, !!googleModules[key]));
      b.classList.toggle('sbf-hide-favicons', !!googleModules.favicons);

      // Inject dynamically selected hex colors as CSS variables
      document.documentElement.style.setProperty('--sbf-nav-color', navBtnColor);
      document.documentElement.style.setProperty('--sbf-nav-bg', navBtnBgColor);
      document.documentElement.style.setProperty('--sbf-highlight-color', highlightColor);
      document.documentElement.style.setProperty('--sbf-highlight-bg', hexToRgba(highlightColor, 0.08));

      ensureNavBtns();
      updateNavBtns();
      incrementalScan(); 
    }
  }

  // ==========================================================================
  // 3. TAB & MODULE SCANNER
  // ==========================================================================
  // Scans the DOM for specific Google UI components and applies visual logic.
  
  function scanGoogleModules() {
    
    // Tag the "More" button in the navigation bar to allow targeted CSS hiding.
    const tagMoreButton = () => {
      document.querySelectorAll('div[role="navigation"] span, div[role="navigation"] div, #hdtb span, #hdtb div').forEach(el => {
        if (el.children.length > 1) return;
        const text = (el.textContent || '').toLowerCase().trim();
        if (text === 'more') {
          const wrapper = el.closest('.crJ18e') || el.closest('div[role="button"]') || el;
          // Ensure we do not hide popups or sub-menus by accident
          if (!wrapper.closest('g-popup') && !wrapper.closest('[role="menu"]')) {
            wrapper.classList.add('sbf-more-wrapper');
          }
        }
      });
    };
    tagMoreButton();

    /**
     * Hides or shows top navigation tabs based on matched inner text.
     * @param {string[]} texts - Keywords to match against tab text.
     * @param {boolean} active - If true, hides the tab.
     * @param {boolean} exactOnly - If true, requires strict string equality.
     */
    const killTabs = (texts, active, exactOnly = false) => {
      const allNativeTabs = document.querySelectorAll('div[role="navigation"] a, #hdtb a, #hdtb-tls, .t2051c, g-menu-item, div[role="button"]');
      allNativeTabs.forEach(el => {
        const text = (el.innerText || el.textContent || '').toLowerCase().trim();
        if (!text || text === 'more' || el.classList.contains('sbf-more-wrapper')) return; 
        
        const isMatch = texts.some(t => exactOnly ? text === t : text.includes(t));
        if (isMatch) {
          let target = el.closest('g-menu-item') || el;
          if (active) target.style.setProperty('display', 'none', 'important');
          else target.style.removeProperty('display');
        }
      });
    };
    
    // Execution list for Tabs
    killTabs(['books'], hiddenTabs.books, false);
    killTabs(['finance'], hiddenTabs.finance, false);
    killTabs(['forums'], hiddenTabs.forums, false);
    killTabs(['images'], hiddenTabs.images, false);
    killTabs(['maps'], hiddenTabs.maps, false);
    killTabs(['news'], hiddenTabs.news, false);
    killTabs(['places'], hiddenTabs.places, false);
    killTabs(['products'], hiddenTabs.products, false);
    killTabs(['product sites','productsites'], hiddenTabs.productsites, false);
    killTabs(['shopping'], hiddenTabs.shopping, false);
    killTabs(['short videos'], hiddenTabs.shortvideos, false);
    killTabs(['tools'], hiddenTabs.tools, false);
    killTabs(['videos'], hiddenTabs.videos, true);
    killTabs(['web'], hiddenTabs.web, true); 

    /**
     * Scans headers to find and hide larger module blocks (e.g. "People also ask").
     * @param {string[]} texts - Target header texts.
     * @param {boolean} active - If true, appends the hidden class to the parent container.
     */
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
    
    // Execution list for Modules
    bruteForceKill(['ai overview', 'ai search'], googleModules.ai);
    bruteForceKill(['images'], googleModules.images);
    bruteForceKill(['videos'], googleModules.videos);
    bruteForceKill(['people also ask'], googleModules.ask);
    bruteForceKill(['discussions and forums'], googleModules.forums);
    bruteForceKill(['products'], googleModules.products);
    bruteForceKill(['people also search for', 'related searches'], googleModules.pasf);
    bruteForceKill(['locations', 'map'], googleModules.locations);
  }

  // ==========================================================================
  // 4. NAVIGATION, HIGHLIGHTING & INFINITE SCROLL
  // ==========================================================================
  
  /**
   * Injects the DOM elements for the Scroll-to-Top and Scroll-to-Bottom buttons.
   */
  function ensureNavBtns() {
    if (!document.body || document.getElementById('sbf-nav-btns')) return;
    const c = document.createElement('div'); c.id = 'sbf-nav-btns';
    c.innerHTML = `<div class="sbf-nav-btn" id="sbf-scroll-top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="18 15 12 9 6 15"></polyline></svg></div><div class="sbf-nav-btn" id="sbf-scroll-bottom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg></div>`;
    document.body.appendChild(c);
    
    // Attach click events to control scroll position
    c.querySelector('#sbf-scroll-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    c.querySelector('#sbf-scroll-bottom').onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  /**
   * Adjusts the opacity/interactivity of navigation buttons based on current scroll depth.
   */
  function updateNavBtns() {
    const c = document.getElementById('sbf-nav-btns');
    if (c) {
      document.getElementById('sbf-scroll-top')?.classList.toggle('disabled', window.scrollY < 50);
      document.getElementById('sbf-scroll-bottom')?.classList.toggle('disabled', (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50));
    }
  }

  /**
   * The core processing loop. Evaluates individual search results for blocking, 
   * highlighting, and UI injection (Block button).
   */
  function incrementalScan() {
    scanGoogleModules();

    document.querySelectorAll('.yuRUbf').forEach(container => {
      const link = container.querySelector('a[href]');
      if (!link || !link.href.startsWith('http')) return; 

      try {
        const domain = new URL(link.href).hostname.replace(/^www\./, '');
        const resultBlock = container.closest('.MjjYud, .g, .tF2Cxc');
        if (!resultBlock) return;

        // 1. Evaluate Visibility (Blocking logic)
        const isBlocked = searchFilters.includes(domain);
        if (isBlocked) {
          resultBlock.classList.add('sbf-hidden');
        } else {
          resultBlock.classList.remove('sbf-hidden');
        }

        // 2. Evaluate Highlighting
        // If highlighting is enabled and the domain is NOT blocked, evaluate against keywords/filters.
        if (highlightEnabled && !isBlocked) {
            const snippetText = resultBlock.innerText.toLowerCase();
            const matchesKeyword = highlightKeywords.some(kw => snippetText.includes(kw.toLowerCase()));
            const matchesDomain = highlightFilters.includes(domain);
            
            resultBlock.classList.toggle('sbf-highlight', matchesKeyword || matchesDomain);
        } else {
            resultBlock.classList.remove('sbf-highlight');
        }

        // 3. Inject Block Button (Avoid duplicate injections)
        if (container.dataset.sbfBlockInjected) return;

        // Locate the reliable anchor point (the 3 vertical dots icon wrapper)
        const dotsSvg = container.querySelector('svg path[d^="M12 8c1.1"]')?.closest('svg');
        const dotsButton = dotsSvg?.closest('[role="button"], div[aria-haspopup="true"]');

        if (dotsButton && dotsButton.parentElement) {
          container.dataset.sbfBlockInjected = '1';

          const btn = document.createElement('button');
          btn.className = 'sbf-block-btn';
          btn.title = `Block ${domain}`;
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;

          // Force flex alignment to prevent the button from floating out of bounds
          const parent = dotsButton.parentElement;
          parent.style.display = 'inline-flex';
          parent.style.alignItems = 'center';
          parent.style.flexDirection = 'row';

          // Insert immediately preceding the native Google options button
          parent.insertBefore(btn, dotsButton);

          // Handle click: Add to filter array and push to Chrome Storage
          btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!searchFilters.includes(domain)) {
              searchFilters.push(domain);
              await chrome.storage.local.set({ searchFilters });
            }
          };
        }
      } catch(e) {
        // Fail silently to prevent interrupting the loop on malformed results
      }
    });

    // Hardcoded fallback logic for edge-case DOM structures ("People also search for")
    if (googleModules.pasf) {
      document.querySelectorAll('[data-pcu], .Cl89te, .EyBRub').forEach(el => {
        if (el.querySelector('svg path[d*="M15.5 14h-.79l-.28-.27"]')) {
          const container = el.closest('.MjjYud, .g, .hlcw0c');
          if (container) container.classList.add('sbf-hidden');
        }
      });
    }
  }

  /**
   * Tracks window scroll. Triggers the fetch protocol to load next page results
   * seamlessly before the user hits the bottom of the page.
   */
  async function onScroll() {
    updateNavBtns();
    if (!infiniteScrollEnabled || isFetching) return;
    
    // Trigger zone: 1200 pixels from the bottom of the document
    if ((document.body.offsetHeight - window.innerHeight - window.scrollY) < 1200) {
      const nextLink = document.querySelector('#pnnext');
      if (nextLink?.href) {
        isFetching = true; 
        loader = document.getElementById('sbf-loader');
        loader?.classList.add('active');
        
        try {
          const resp = await fetch(nextLink.href);
          const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
          const targetRso = document.getElementById('rso'); 
          const newRso = doc.querySelector('#rso');
          
          if (newRso && targetRso) {
            // Append incoming child nodes to the existing search results container
            Array.from(newRso.children).forEach(child => targetRso.appendChild(child.cloneNode(true)));
            
            // Re-map the native pagination link to the next incoming page
            const newNext = doc.querySelector('#pnnext'); 
            if (newNext) nextLink.href = newNext.href; else nextLink.remove();
            
            incrementalScan();
          }
        } catch (e) {
            console.error("Infinite scroll failed", e);
        } finally { 
          loader?.classList.remove('active'); 
          // Minimum artificial delay to prevent rapid-fire fetching
          setTimeout(() => { isFetching = false; }, 1000); 
        }
      }
    }
  }

  // ==========================================================================
  // 5. INIT
  // ==========================================================================
  
  // Listen for broadcasted configuration updates from popup.js
  chrome.runtime.onMessage.addListener((m) => { if (m.action === "live_update") loadConfig(); });
  chrome.storage.onChanged.addListener(() => loadConfig());
  
  // Primary bootstrapping
  loadConfig();
  
  // Attach MutationObserver to dynamically process single page app (SPA) DOM changes
  const obs = new MutationObserver(() => incrementalScan());
  obs.observe(document.body, { childList: true, subtree: true });
  
  // Attach passive scroll listener for high-performance scroll handling
  window.addEventListener('scroll', onScroll, { passive: true });
})();