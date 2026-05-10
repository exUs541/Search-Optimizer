/**
 * Search Optimizer - Content Script (Link Filter)
 * This script runs in the context of Google Search pages.
 * It handles infinite scrolling, result filtering (blocking), 
 * and visual highlighting of specific domains/keywords.
 */

(async function() {
  'use strict';
  
  // --- 0. Helper Functions ---
  
  /**
   * Converts a HEX color code to an RGBA string.
   * @param {string} hex - The hex color code (e.g., #ffffff).
   * @param {number} alpha - The opacity value (0 to 1).
   * @returns {string} The RGBA color string.
   */
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // --- 1. CSS Injection ---
  
  // Inject global styles for the extension's UI elements on the Google page.
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      /* Hidden state for blocked results */
      .sbf-hidden { display: none !important; }
      body.sbf-hide-more-btn .sbf-more-wrapper { display: none !important; }

      /* Quick "Add to Blocklist" button styling */
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

      #sbf-loader { display: none; text-align: center; padding: 20px; color: #9aa0a6; gap: 10px; align-items: center; justify-content: center; }
      #sbf-loader.active { display: flex; }
      .sbf-spinner { width: 18px; height: 18px; border: 2px solid #444; border-top-color: #8ab4f8; border-radius: 50%; animation: sbf-spin 0.6s linear infinite; }
      @keyframes sbf-spin { to { transform: rotate(360deg); } }
      
      #sbf-nav-btns { position: fixed; bottom: 24px; left: 24px; z-index: 2147483640; display: none; flex-direction: column; gap: 8px; }
      .sbf-show-nav-btns #sbf-nav-btns { display: flex !important; }
      .sbf-nav-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--sbf-nav-bg, #1e293b) !important; color: var(--sbf-nav-color, #38bdf8) !important; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s; user-select: none; border: 1px solid rgba(255,255,255,0.1) !important; }
      .sbf-nav-btn.disabled { opacity: 0.15; pointer-events: none; filter: grayscale(1); } 
      .sbf-nav-btn svg { width: 22px; height: 22px; pointer-events: none; stroke: currentColor !important; }

      /* Module Selectors */
      .sbf-hide-mod-ai [data-component-type="22"], .sbf-hide-mod-ai .SGE_container, .sbf-hide-mod-ai #super_results { display: none !important; }
      .sbf-hide-mod-products .wOPJ9c, .sbf-hide-mod-products .pla-unit, .sbf-hide-mod-products #tvcap { display: none !important; }
      .sbf-hide-mod-images [data-attrid="images universal"] { display: none !important; }
      .sbf-hide-mod-videos .MjjYud:has(.RzdJxc) { display: none !important; }
      .sbf-hide-mod-ask [data-attrid="wa_paa"], .sbf-hide-mod-ask .WwS1pe { display: none !important; }
      .sbf-hide-mod-pasf [data-attrid="people_also_search_for"], .sbf-hide-mod-pasf .nV_results, .sbf-hide-mod-pasf .K877S, .sbf-hide-mod-pasf .W67Drf { display: none !important; }
      .sbf-hide-mod-forums [data-attrid="discussions_and_forums"], .sbf-hide-mod-forums .f4S95b { display: none !important; }
      .sbf-hide-mod-sponsored #tads, .sbf-hide-mod-sponsored #tadsb, .sbf-hide-mod-sponsored #tvcap { display: none !important; }
      .sbf-hide-favicons .XNo29b, .sbf-hide-favicons .kvH3mc img { visibility: hidden !important; width: 0 !important; margin: 0 !important; }
      .sbf-hide-mod-locations [data-attrid="local_universal"], 
      .sbf-hide-mod-locations .L9S79c, 
      .sbf-hide-mod-locations #lu_map { display: none !important; }

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

  // 2. STATE MANAGER
  let googleModules = {}, hiddenTabs = {}, searchFilters = [];
  let infiniteScrollEnabled = false, isFetching = false, loader = null;
  let navBtnColor = '#38bdf8', navBtnBgColor = '#1e293b', navBtnsEnabled = true;
  let highlightEnabled = false, highlightColor = '#38bdf8';

  async function loadConfig() {
    const data = await chrome.storage.local.get(null);
    googleModules = data.googleModules || {};
    hiddenTabs = data.hiddenTabs || {};
    searchFilters = data.searchFilters || [];
    infiniteScrollEnabled = data.infiniteScroll === true;
    navBtnColor = data.navBtnColor || '#38bdf8';
    navBtnBgColor = data.navBtnBgColor || '#1e293b';
    navBtnsEnabled = data.navBtnsEnabled !== false;
    highlightEnabled = !!data.highlightEnabled;
    highlightColor = data.highlightColor || '#38bdf8';
    
    if (document.body) {
      const b = document.body;
      b.classList.toggle('sbf-hide-more-btn', !!hiddenTabs.more);
      b.classList.toggle('sbf-show-nav-btns', navBtnsEnabled);
      Object.keys(googleModules).forEach(key => b.classList.toggle(`sbf-hide-mod-${key}`, !!googleModules[key]));
      b.classList.toggle('sbf-hide-favicons', !!googleModules.favicons);

      document.documentElement.style.setProperty('--sbf-nav-color', navBtnColor);
      document.documentElement.style.setProperty('--sbf-nav-bg', navBtnBgColor);
      document.documentElement.style.setProperty('--sbf-highlight-color', highlightColor);
      document.documentElement.style.setProperty('--sbf-highlight-bg', hexToRgba(highlightColor, 0.08));

      ensureNavBtns();
      updateNavBtns();
      incrementalScan(); 
    }
  }

  // 3. TAB & MODULE SCANNER
  function scanGoogleModules() {
    const tagMoreButton = () => {
      document.querySelectorAll('div[role="navigation"] span, div[role="navigation"] div, #hdtb span, #hdtb div').forEach(el => {
        if (el.children.length > 1) return;
        const text = (el.textContent || '').toLowerCase().trim();
        if (text === 'more') {
          const wrapper = el.closest('.crJ18e') || el.closest('div[role="button"]') || el;
          if (!wrapper.closest('g-popup') && !wrapper.closest('[role="menu"]')) {
            wrapper.classList.add('sbf-more-wrapper');
          }
        }
      });
    };
    tagMoreButton();

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
    
    killTabs(['tools'], hiddenTabs.tools, false);
    killTabs(['videos'], hiddenTabs.videos, true);
    killTabs(['short videos'], hiddenTabs.shortvideos, false);
    killTabs(['news'], hiddenTabs.news, false);
    killTabs(['finance'], hiddenTabs.finance, false);
    killTabs(['web'], hiddenTabs.web, true); 
    killTabs(['forums'], hiddenTabs.forums, false);
    killTabs(['images'], hiddenTabs.images, false);
    killTabs(['shopping'], hiddenTabs.shopping, false);
    killTabs(['books'], hiddenTabs.books, false);
    killTabs(['maps'], hiddenTabs.maps, false);

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
    bruteForceKill(['ai overview', 'ai search'], googleModules.ai);
    bruteForceKill(['images'], googleModules.images);
    bruteForceKill(['videos'], googleModules.videos);
    bruteForceKill(['people also ask'], googleModules.ask);
    bruteForceKill(['discussions and forums'], googleModules.forums);
    bruteForceKill(['products'], googleModules.products);
    bruteForceKill(['people also search for', 'related searches'], googleModules.pasf);
    bruteForceKill(['locations', 'map'], googleModules.locations);
  }

  // 4. NAVIGATION & INFINITE SCROLL
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

    document.querySelectorAll('.yuRUbf').forEach(container => {
      const link = container.querySelector('a[href]');
      if (!link || !link.href.startsWith('http')) return; 

      try {
        const domain = new URL(link.href).hostname.replace(/^www\./, '');
        const resultBlock = container.closest('.MjjYud, .g, .tF2Cxc');
        if (!resultBlock) return;

        // Visibility Toggle
        if (searchFilters.includes(domain)) {
          resultBlock.classList.add('sbf-hidden');
        } else {
          resultBlock.classList.remove('sbf-hidden');
        }

        // Highlight Logic
        if (highlightEnabled && searchFilters.includes(domain)) {
            // Technically hidden items won't show highlights, but for consistency:
            resultBlock.classList.remove('sbf-highlight');
        } else if (highlightEnabled) {
            // Check for keywords or domain highlighting if needed here
            // Currently using domain as the main toggle
            resultBlock.classList.toggle('sbf-highlight', false); // Placeholder for extension
        }

        // Block Button Injection
        if (container.dataset.sbfBlockInjected) return;

        const dotsSvg = container.querySelector('svg path[d^="M12 8c1.1"]')?.closest('svg');
        const dotsButton = dotsSvg?.closest('[role="button"], div[aria-haspopup="true"]');

        if (dotsButton && dotsButton.parentElement) {
          container.dataset.sbfBlockInjected = '1';

          const btn = document.createElement('button');
          btn.className = 'sbf-block-btn';
          btn.title = `Block ${domain}`;
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;

          const parent = dotsButton.parentElement;
          parent.style.display = 'inline-flex';
          parent.style.alignItems = 'center';
          parent.style.flexDirection = 'row';

          parent.insertBefore(btn, dotsButton);

          btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!searchFilters.includes(domain)) {
              searchFilters.push(domain);
              await chrome.storage.local.set({ searchFilters });
            }
          };
        }
      } catch(e) {}
    });

    // Hardcoded check for "People also search for"
    if (googleModules.pasf) {
      document.querySelectorAll('[data-pcu], .Cl89te, .EyBRub').forEach(el => {
        if (el.querySelector('svg path[d*="M15.5 14h-.79l-.28-.27"]')) {
          const container = el.closest('.MjjYud, .g, .hlcw0c');
          if (container) container.classList.add('sbf-hidden');
        }
      });
    }
  }

  async function onScroll() {
    updateNavBtns();
    if (!infiniteScrollEnabled || isFetching) return;
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
            Array.from(newRso.children).forEach(child => targetRso.appendChild(child.cloneNode(true)));
            const newNext = doc.querySelector('#pnnext'); 
            if (newNext) nextLink.href = newNext.href; else nextLink.remove();
            incrementalScan();
          }
        } catch (e) {} finally { 
          loader?.classList.remove('active'); 
          setTimeout(() => { isFetching = false; }, 1000); 
        }
      }
    }
  }

  // 5. INIT
  chrome.runtime.onMessage.addListener((m) => { if (m.action === "live_update") loadConfig(); });
  chrome.storage.onChanged.addListener(() => loadConfig());
  
  loadConfig();
  const obs = new MutationObserver(() => incrementalScan());
  obs.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('scroll', onScroll, { passive: true });
})();