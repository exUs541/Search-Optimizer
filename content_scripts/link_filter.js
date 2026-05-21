(async function () {
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

      /* Favorite Button UI */
      .sbf-fav-btn { 
        display: inline-flex !important; 
        align-items: center; 
        justify-content: center; 
        width: 22px; 
        height: 22px; 
        border-radius: 50%; 
        background: transparent; 
        border: none; 
        cursor: pointer; 
        color: #eab308; /* Gold/Yellow */
        margin: 0 !important;
        margin-left: 25px !important;
        padding: 0;
        transition: background 0.2s, transform 0.1s;
        flex-shrink: 0;
        position: static !important;
        transform: none !important;
        user-select: none !important;
      }

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
        margin: 0 !important;
        margin-left: 4px !important;
        padding: 0;
        transition: background 0.2s, transform 0.1s;
        flex-shrink: 0;
        position: static !important;
        transform: none !important;
        user-select: none !important;
      }
      .sbf-block-btn:hover { background: rgba(239, 68, 68, 0.15); }
      .sbf-block-btn svg { width: 14px; height: 14px; pointer-events: none; }
      
      .sbf-fav-btn:hover { background: rgba(234, 179, 8, 0.15); transform: scale(1.1) !important; }
      .sbf-fav-btn svg { width: 14px; height: 14px; pointer-events: none; fill: none; stroke: currentColor; transition: fill 0.2s; }
      .sbf-fav-btn.is-fav svg { fill: currentColor; } /* Ausgefüllter Stern, wenn markiert */
      
      /* Button Group Wrapper */
      .sbf-btn-group {
        display: inline-flex !important;
        align-items: center !important;
        margin-right: 8px !important;
        vertical-align: middle !important;
        z-index: 10 !important;
        position: relative !important;
        pointer-events: none;
      }

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
      body.sbf-infinite-active #botstuff div[role="navigation"],
      body.sbf-infinite-active table.AaVjTc,
      body.sbf-infinite-active .SJajHc { display: none !important; }

      .sbf-hide-mod-ai [data-component-type="22"], .sbf-hide-mod-ai .SGE_container, .sbf-hide-mod-ai #super_results { display: none !important; }
      .sbf-hide-mod-products .wOPJ9c, .sbf-hide-mod-products .pla-unit, .sbf-hide-mod-products #tvcap { display: none !important; }
      .sbf-hide-mod-images [data-attrid^="images"],
      .sbf-hide-mod-images [data-rich-metadata-type="images"],
      .sbf-hide-mod-images .FAZ4jd,
      .sbf-hide-mod-images .YLwVgc,
      .sbf-hide-mod-images .nbl55b,
      .sbf-hide-mod-images .s61xbe,
      .sbf-hide-mod-images [data-lpage],
      .sbf-hide-mod-images [jscontroller*="images"],
      .sbf-hide-mod-images .MjjYud:has(a[href*="tbm=isch"]),
      .sbf-hide-mod-images .MjjYud:has(a[href*="udm=2"]),
      .sbf-hide-mod-images .g:has(a[href*="tbm=isch"]),
      .sbf-hide-mod-images .g:has(a[href*="udm=2"]),
      .sbf-hide-mod-images .ULSxyf:has(a[href*="tbm=isch"]),
      .sbf-hide-mod-images .ULSxyf:has(a[href*="udm=2"]) { display: none !important; }
      .sbf-hide-mod-videos .MjjYud:has(.RzdJxc) { display: none !important; }
      .sbf-hide-mod-ask [data-attrid="wa_paa"], .sbf-hide-mod-ask .WwS1pe { display: none !important; }
      .sbf-hide-mod-pasf [data-attrid="people_also_search_for"], .sbf-hide-mod-pasf .nV_results, .sbf-hide-mod-pasf .K877S, .sbf-hide-mod-pasf .W67Drf, .sbf-hide-mod-pasf [jscontroller*="related_searches"] { display: none !important; }
      .sbf-hide-mod-forums [data-attrid="discussions_and_forums"], .sbf-hide-mod-forums .f4S95b { display: none !important; }
      .sbf-hide-mod-sponsored #tads, .sbf-hide-mod-sponsored #tadsb, .sbf-hide-mod-sponsored #tvcap { display: none !important; }
      .sbf-hide-mod-locations [data-attrid="local_universal"], .sbf-hide-mod-locations .L9S79c, .sbf-hide-mod-locations #lu_map { display: none !important; }
      .sbf-hide-mod-knowledge #rhs, .sbf-hide-mod-knowledge [data-attrid^="kc:/"] { display: none !important; }
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
  let lastQuery = '';

  function isAllTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tbm = urlParams.get('tbm');
    const udm = urlParams.get('udm');
    return !tbm && (!udm || udm === '14');
  }

  function cleanUpAllResultModifications() {
    const b = document.body;
    if (!b) return;
    b.classList.remove('sbf-show-nav-btns');
    b.classList.remove('sbf-infinite-active');
    b.classList.remove('sbf-hide-favicons');
    if (googleModules) {
      Object.keys(googleModules).forEach(key => {
        b.classList.remove(`sbf-hide-mod-${key}`);
      });
    }
    const navBtns = document.getElementById('sbf-nav-btns');
    if (navBtns) navBtns.remove();
    document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
    document.querySelectorAll('.sbf-highlight').forEach(el => el.classList.remove('sbf-highlight'));
    document.querySelectorAll('.sbf-btn-group').forEach(el => el.remove());
    document.querySelectorAll('[data-sbf-btns-injected]').forEach(el => delete el.dataset.sbfBtnsInjected);
  }

  function detectAndHideAIOverview() {
    let found = false;
    const selectors = [
      '[data-component-type="22"]', 
      '.SGE_container', 
      '#super_results',
      '.O99rdb', 
      '.iv23Mc',
      '.c2xzZc'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.classList.contains('noai-hidden-card')) {
          el.classList.add('noai-hidden-card');
          el.style.setProperty('display', 'none', 'important');
          found = true;
        }
      });
    });

    document.querySelectorAll('h1, h2, h3, h4, [role="heading"]').forEach(el => {
      const text = (el.innerText || el.textContent || '').toLowerCase().trim();
      if (
        text === 'ai overview' || 
        text.startsWith('ai overview') || 
        text === 'ai-übersicht' || 
        text.startsWith('ai-übersicht')
      ) {
        const container = el.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .ez8I9c, .ULSxyf');
        if (container && !container.classList.contains('noai-hidden-card')) {
          container.classList.add('noai-hidden-card');
          container.style.setProperty('display', 'none', 'important');
          found = true;
        }
      }
    });

    return found;
  }

  function handleNoAiBlocker() {
    if (!googleModules.ai) return;
    detectAndHideAIOverview();
  }

  function checkAndRedirectBlockedMode() {
    if (!googleModules.ai) return;
    const url = new URL(window.location.href);
    const q = url.searchParams.get('q');
    if (q && !q.toLowerCase().includes('-noai')) {
      url.searchParams.set('q', q + ' -noai');
      window.location.replace(url.toString());
    }
  }

  function cleanUIFromNoAiSuffix() {
    if (!googleModules.ai) return;

    document.querySelectorAll('input[name="q"], textarea[name="q"]').forEach(input => {
      if (input.value && input.value.toLowerCase().includes('-noai')) {
        input.value = input.value.replace(/\s*-noai/i, '');
      }
    });

    if (document.title.toLowerCase().includes('-noai')) {
      document.title = document.title.replace(/\s*-noai/i, '');
    }
  }

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

      // Apply global styles and tab modifications (runs on ALL tabs)
      b.classList.toggle('sbf-hide-more-btn', !!hiddenTabs.more);
      scanGoogleTabsOnly();

      if (!isAllTab()) {
        cleanUpAllResultModifications();
        return;
      }

      checkAndRedirectBlockedMode();
      cleanUIFromNoAiSuffix();
      handleNoAiBlocker();

      // Toggle body classes to trigger CSS hiding rules for search results
      const isImageTab = window.location.href.includes('tbm=isch') || window.location.href.includes('udm=2');
      b.classList.toggle('sbf-show-nav-btns', navBtnsEnabled);
      b.classList.toggle('sbf-infinite-active', infiniteScrollEnabled);
      Object.keys(googleModules).forEach(key => {
        let shouldHide = !!googleModules[key];
        if ((key === 'images' || key === 'pasf') && isImageTab) shouldHide = false;
        b.classList.toggle(`sbf-hide-mod-${key}`, shouldHide);
      });
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

  function scanGoogleTabsOnly() {
    const MORE_TRANSLATIONS = [
      'more', 'mehr', 'plus', 'más', 'altro', 'meer', 'mais', 'diğer', 'więcej', 'ещё', 'больше', 
      'повеche', 'mai mult', 'více', 'flere', 'mer', 'lisää', 'daugiau', 'vairāk', 'rohkem',
      'още', 'детальніше', 'több', 'več', 'viac', 'još', 'më shumë', 'daha', 'もっと見る', 
      '更多', '보기'
    ];

    const TOOLS_TRANSLATIONS = [
      'tools', 'suchfilter', 'optionen', 'instrumente', 'outils', 'outils de recherche', 
      'herramientas', 'strumenti', 'hulpmiddelen', 'ferramentas', 'araçlar', 'narzędzia', 
      'инструменты', 'nástroje', 'verktyg', 'verktøy', 'værktøjer', 'työkalut', 'ツール', 
      '工具', '도구'
    ];

    const tabMatchRules = {
      books: {
        params: { tbm: ['bks', 'pts'], udm: ['36'] },
        keywords: ['books', 'bücher', 'livres', 'libros', 'libri', 'boeken', 'livros', 'książki', 'kitaplar', 'knihy', 'böcker', 'bøker', 'bøger', 'kirjat']
      },
      finance: {
        params: { tbm: ['fin'], udm: ['15'] },
        domains: ['finance.google', 'google.com/finance', '/finance'],
        keywords: ['finance', 'finanzen', 'finanzas', 'finances', 'finanza', 'financiën', 'finanças', 'finanse', 'finans']
      },
      flights: {
        params: { tbm: ['flt'], udm: ['16'] },
        domains: ['google.com/flights', 'google.com/travel/flights', 'flights.google', '/flights'],
        keywords: ['flights', 'flüge', 'vols', 'vuelos', 'voli', 'vluchten', 'voos', 'loty', 'uçuşlar', 'flyg', 'flyreiser', 'flyrejser', 'lennot']
      },
      forums: {
        params: { tbm: ['dsc'], udm: ['18'] },
        keywords: ['forums', 'foren', 'discussions', 'diskussionen', 'forum', 'débats', 'foros', 'discussioni', 'discussies', 'discussões', 'dyskusje', 'tartışmalar']
      },
      images: {
        params: { tbm: ['isch'], udm: ['2'] },
        keywords: ['images', 'bilder', 'imágenes', 'immagini', 'afbeeldingen', 'imagens', 'grafika', 'görseller', 'obrázky', 'kuvat']
      },
      maps: {
        params: { udm: ['1'] },
        domains: ['maps.google', 'google.com/maps', '/maps'],
        keywords: ['maps', 'karten', 'cartes', 'mapas', 'mappe', 'kaarten', 'haritalar', 'mapy', 'kart', 'kartor', 'kort', 'kartat']
      },
      news: {
        params: { tbm: ['nws'], udm: ['12'] },
        keywords: ['news', 'nachrichten', 'actualités', 'noticias', 'notizie', 'nieuws', 'notícias', 'wiadomości', 'haberler', 'nyheter', 'nyheder', 'uutiset', 'zprávy']
      },
      places: {
        params: { udm: ['1'] },
        domains: ['google.com/local', '/local'],
        keywords: ['places', 'orte', 'lieux', 'lugares', 'luoghi', 'plaatsen', 'miejsca', 'yerler', 'platser', 'steder', 'paikat']
      },
      products: {
        params: { tbm: ['shop'], udm: ['3', '28', '37'] },
        keywords: ['products', 'produkte', 'produits', 'productos', 'prodotti', 'producten', 'produtos', 'produkty', 'ürünler', 'shopping', 'winkel', 'zakupy', 'alışveriş', 'produkter', 'tuotteet']
      },
      productsites: {
        params: { udm: ['56'] },
        keywords: ['product sites', 'productsites', 'produkt-websites', 'produkt-webseiten', 'sites de produits', 'sitios de productos', 'sito del prodotto', 'productwebsites', 'sites de produtos', 'strony produktów', 'ürün siteleri']
      },
      shopping: {
        params: { tbm: ['shop'], udm: ['3', '28', '37'] },
        keywords: ['shopping', 'winkel', 'zakupy', 'alışveriş', 'shopping', 'einkaufen', 'achat', 'compras']
      },
      shortvideos: {
        params: { udm: ['39'] },
        keywords: ['short videos', 'kurzvideos', 'vidéos courtes', 'videos cortos', 'brevi video', 'korte video\'s', 'vídeos curtos', 'krótkie filmy', 'kısa videolar', 'korta videor', 'lyhytvideot']
      },
      tools: {
        keywords: TOOLS_TRANSLATIONS
      },
      videos: {
        params: { tbm: ['vid'], udm: ['7'] },
        keywords: ['videos', 'vidéos', 'vídeos', 'video\'s', 'filmy', 'videolar', 'videoer', 'videot', 'videa']
      },
      web: {
        params: { udm: ['14'] },
        keywords: ['web', 'web results', 'web-ergebnisse', 'résultats du web', 'resultados web', 'risultati web', 'webresultaten', 'resultados da web', 'wyniki wyszukiwania', 'web sonuçları', 'webb', 'nettet']
      }
    };

    // Tag the "More" button in the navigation bar to allow targeted CSS hiding.
    const tagMoreButton = () => {
      document.querySelectorAll('div[role="navigation"] span, div[role="navigation"] div, #hdtb span, #hdtb div').forEach(el => {
        if (el.children.length > 1) return;
        const text = (el.textContent || '').toLowerCase().trim();
        if (MORE_TRANSLATIONS.includes(text)) {
          const wrapper = el.closest('.crJ18e') || el.closest('div[role="button"]') || el;
          if (!wrapper.closest('g-popup') && !wrapper.closest('[role="menu"]')) {
            wrapper.classList.add('sbf-more-wrapper');
          }
        }
      });
    };
    tagMoreButton();

    /**
     * Hides or shows top navigation tabs using URL analysis and translations.
     */
    const killTabs = (type, active, exactOnly = false) => {
      const allNativeTabs = document.querySelectorAll('div[role="navigation"] a, #hdtb a, #hdtb-tls, .t2051c, g-menu-item, div[role="button"]');
      const rule = tabMatchRules[type];
      if (!rule) return;

      allNativeTabs.forEach(el => {
        let isMatch = false;
        const text = (el.innerText || el.textContent || '').toLowerCase().trim();
        if (!text || MORE_TRANSLATIONS.includes(text) || el.classList.contains('sbf-more-wrapper')) return;

        // Check by URL/domain for links
        if (el.tagName.toLowerCase() === 'a' && el.href) {
          try {
            const url = new URL(el.href, window.location.origin);
            if (rule.params) {
              if (rule.params.tbm) {
                const tbmVal = url.searchParams.get('tbm');
                if (tbmVal && rule.params.tbm.includes(tbmVal)) isMatch = true;
              }
              if (!isMatch && rule.params.udm) {
                const udmVal = url.searchParams.get('udm');
                if (udmVal && rule.params.udm.includes(udmVal)) isMatch = true;
              }
            }
            if (!isMatch && rule.domains) {
              const fullHref = el.href.toLowerCase();
              if (rule.domains.some(d => fullHref.includes(d))) isMatch = true;
            }
          } catch (e) {}
        }

        // Check by multilingual keyword fallback
        if (!isMatch && rule.keywords) {
          isMatch = rule.keywords.some(kw => exactOnly ? text === kw : text.includes(kw));
        }

        if (isMatch) {
          let target = el.closest('g-menu-item') || el;
          if (target === el && el.parentElement && el.parentElement.children.length === 1) {
            target = el.parentElement;
          }
          if (active) target.style.setProperty('display', 'none', 'important');
          else target.style.removeProperty('display');
        }
      });
    };

    // Execution list for Tabs
    killTabs('books', hiddenTabs.books, false);
    killTabs('finance', hiddenTabs.finance, false);
    killTabs('flights', hiddenTabs.flights, false);
    killTabs('forums', hiddenTabs.forums, false);
    killTabs('images', hiddenTabs.images, false);
    killTabs('maps', hiddenTabs.maps, false);
    killTabs('news', hiddenTabs.news, false);
    killTabs('places', hiddenTabs.places, false);
    killTabs('products', hiddenTabs.products, false);
    killTabs('productsites', hiddenTabs.productsites, false);
    killTabs('shopping', hiddenTabs.shopping, false);
    killTabs('shortvideos', hiddenTabs.shortvideos, false);
    killTabs('tools', hiddenTabs.tools, false);
    killTabs('videos', hiddenTabs.videos, true);
    killTabs('web', hiddenTabs.web, true);
  }

  function scanGoogleModules() {
    /**
     * Scans headers to find and hide larger module blocks.
     */
    const bruteForceKill = (texts, active) => {
      document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"], a, g-section-title, #center_col span, #center_col div, #botstuff span, #botstuff div').forEach(el => {
        if (el.closest('div[role="navigation"], #hdtb, #searchform, #header')) return;

        const tagName = el.tagName.toLowerCase();
        if ((tagName === 'div' || tagName === 'span') && (el.children.length > 0 || el.textContent.length > 50)) return;

        const text = (el.textContent || el.innerText || '').toLowerCase().trim();
        if (texts.some(t => text === t || text.startsWith(t) || (t.length > 3 && text.includes(t)))) {
          let container = el.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .ez8I9c, .ULSxyf, [data-attrid="images universal"], [data-attrid="people_also_search_for"], .nV_results, .K877S, .W67Drf, .Cl89te, .EyBRub');
          if (!container) {
            let parent = el.parentElement;
            while (parent && parent !== document.body) {
              const pParent = parent.parentElement;
              if (pParent && (pParent.id === 'rso' || pParent.id === 'botstuff' || pParent.id === 'center_col' || pParent.classList.contains('v7W49e'))) {
                if (parent.id !== 'rso' && parent.id !== 'botstuff' && parent.id !== 'center_col') {
                  container = parent;
                  break;
                }
              }
              parent = parent.parentElement;
            }
          }
          if (container) {
            if (active) container.classList.add('sbf-hidden');
            else container.classList.remove('sbf-hidden');
          }
        }
      });
    };

    // Execution list for Modules
    const isImageTab = window.location.href.includes('tbm=isch') || window.location.href.includes('udm=2');

    if (document.body) {
      document.body.classList.toggle('sbf-hide-mod-images', isImageTab ? false : !!googleModules.images);
    }

    bruteForceKill([
      'ai overview', 'ai-übersicht', 'ai search', 'aperçu par ia', 'aperçu ia', 'información generada por ia', 
      'perspectiva general de ia', 'panoramica dell\'ia', 'overzicht door ai', 'visão geral da ia',
      'visão geral por ia', 'inteligentne podsumowanie', 'yapay zeka özeti'
    ], googleModules.ai);

    bruteForceKill([
      'images', 'bilder', 'bilderergebnisse', 'bilder für', 'imágenes', 'immagini', 'afbeeldingen', 
      'imagens', 'grafika', 'görseller', 'obrázky', 'kuvat'
    ], isImageTab ? false : googleModules.images);

    bruteForceKill([
      'videos', 'vidéos', 'vídeos', 'video\'s', 'filmy', 'videolar', 'videoer', 'videot', 'videa'
    ], googleModules.videos);

    bruteForceKill([
      'people also ask', 'nutzer fragen auch', 'ähnliche fragen', 'weitere fragen', 'autres questions posées', 
      'questions associées', 'preguntas relacionadas', 'otras preguntas', 'le persone hanno chiesto anche', 
      'domande frequenti', 'mensen vragen ook', 'as pessoas também perguntam', 'kullanıcılar bunları da sordu', 
      'ludzie pytają również'
    ], googleModules.ask);

    bruteForceKill([
      'discussions and forums', 'discussions & forums', 'foren', 'diskussionen', 'diskussionen und foren', 
      'foren und diskussionen', 'discussions et forums', 'forums de discussion', 'forums', 'discussions', 
      'debates y foros', 'foros y debates', 'foros', 'debates', 'discussioni e forum', 'forum e discussioni', 
      'discussies en forums', 'discussões e fóruns', 'dyskusje i fora', 'fora i dyskusje', 'fora', 'dyskusje',
      'tartışmalar ve forumlar', 'forumlar ve tartışmalar', 'forumlar', 'tartışmalar'
    ], googleModules.forums);

    bruteForceKill([
      'products', 'produkte', 'produits', 'productos', 'prodotti', 'producten', 'produtos', 'produkty', 'ürünler'
    ], googleModules.products);

    bruteForceKill([
      'people also search for', 'related searches', 'nutzer suchen auch nach', 'ähnliche suchanfragen', 
      'weitere suchanfragen', 'verwandte suchanfragen', 'recherches associées', 'les gens recherchent aussi', 
      'búsquedas relacionadas', 'otras personas también buscan', 'ricerche correlate', 'gerelateerde zoekopdrachten', 
      'pesquisas relacionadas', 'wyszukiwania powiązane', 'ilgili aramalar'
    ], isImageTab ? false : googleModules.pasf);

    bruteForceKill([
      'locations', 'map', 'karten', 'orte', 'standorte', 'adresses', 'carte', 'mapas', 'lugares', 
      'ubicaciones', 'luoghi', 'mappa', 'locaties', 'lokalizacje', 'haritalar', 'yerler', 'kartor', 'kart', 'harita'
    ], googleModules.locations);

    // Robust selector fallback to hide images modules containing search images links
    const hideImages = googleModules.images && !isImageTab;
    document.querySelectorAll('a[href*="tbm=isch"], a[href*="udm=2"]').forEach(link => {
      if (link.closest('div[role="navigation"], #hdtb, #searchform, #header')) return;
      
      const href = link.getAttribute('href') || '';
      const isGoogleSearchLink = href.startsWith('/') || href.includes('google.com/search') || href.includes('google.de/search') || href.includes('google.ch/search') || href.includes('google.at/search') || href.includes('google.co.uk/search');
      if (!isGoogleSearchLink) return;

      const container = link.closest('.MjjYud, .g, .hlcw0c, .v7W49e, .ez8I9c, .ULSxyf');
      if (container) {
        if (hideImages) {
          container.classList.add('sbf-hidden');
        } else {
          container.classList.remove('sbf-hidden');
        }
      }
    });
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
    // Apply global tab modifications (runs on ALL tabs)
    scanGoogleTabsOnly();

    if (!isAllTab()) {
      cleanUpAllResultModifications();
      return;
    }

    const currentQuery = new URLSearchParams(window.location.search).get('q') || '';
    if (currentQuery !== lastQuery) {
      lastQuery = currentQuery;
    }

    checkAndRedirectBlockedMode();
    cleanUIFromNoAiSuffix();
    handleNoAiBlocker();

    scanGoogleModules();

    // We use the 3-dots menu button as the universal anchor to find search result blocks.
    // This reliably captures all organic results, video results, and carousel items.
    document.querySelectorAll('svg path[d^="M12 8c1.1"]').forEach(path => {
      const dotsSvg = path.closest('svg');
      const dotsButton = dotsSvg?.closest('[role="button"], div[aria-haspopup="true"]');
      if (!dotsButton) return;

      // Do not inject block/fav buttons on elements inside specific modules (e.g. Images grid, Knowledge Panel, People Also Ask, etc.)
      const isInsideModule = dotsButton.closest(
        '[data-attrid="images universal"], [data-rich-metadata-type="images"], .FAZ4jd, .YLwVgc, .nbl55b, .s61xbe, [data-lpage], [jscontroller*="images"], ' +
        '#rhs, [data-attrid="wa_paa"], .WwS1pe, [data-attrid="discussions_and_forums"], .f4S95b, [data-attrid="local_universal"]'
      );
      if (isInsideModule) return;

      let resultBlock = dotsButton.closest('.g');
      const outerBlock = dotsButton.closest('.MjjYud');

      if (outerBlock) {
        // Count how many 3-dots menus are in this outer block
        const dotsCount = outerBlock.querySelectorAll('svg path[d^="M12 8c1.1"]').length;
        // If there is only one, the entire block (including sitelinks) belongs to this result.
        if (dotsCount === 1) {
          resultBlock = outerBlock;
        }
      }

      if (!resultBlock) {
        resultBlock = dotsButton.closest('.tF2Cxc, .Z26q7c, .Ww4FFb') || outerBlock || dotsButton.closest('div');
      }
      if (!resultBlock) return;

      // Find the primary external link for this result block
      const links = Array.from(resultBlock.querySelectorAll('a[href^="http"]'));
      const link = links.find(l => {
        try { 
            const hostname = new URL(l.href).hostname;
            // Only skip internal Google Search links, allow subdomains like support.google.com
            return hostname !== 'www.google.com' && hostname !== 'google.com'; 
        } catch (e) { return false; }
      });
      if (!link) return;

      try {
        const domain = new URL(link.href).hostname.replace(/^www\./, '');

        // 1. Evaluate Visibility (Blocking logic)
        const isBlocked = searchFilters.includes(domain);
        if (isBlocked) {
          resultBlock.classList.add('sbf-hidden');
        } else {
          resultBlock.classList.remove('sbf-hidden');
        }

        // 2. Evaluate Highlighting
        if (!isBlocked) {
          const snippetText = resultBlock.innerText.toLowerCase();
          const matchesKeyword = highlightKeywords.some(kw => snippetText.includes(kw.toLowerCase()));
          const matchesDomain = highlightFilters.includes(domain);

          // Allow highlighting if either global setting is ON or if it's explicitly favorited
          if ((highlightEnabled && matchesKeyword) || matchesDomain) {
            resultBlock.classList.add('sbf-highlight');
          } else {
            resultBlock.classList.remove('sbf-highlight');
          }
        } else {
          resultBlock.classList.remove('sbf-highlight');
        }

        // 3. Inject Block Button (Avoid duplicate injections)
        if (resultBlock.dataset.sbfBtnsInjected) {
          const existingFavBtn = resultBlock.querySelector('.sbf-fav-btn');
          if (existingFavBtn) {
            existingFavBtn.classList.toggle('is-fav', highlightFilters.includes(domain));
          }
          return;
        }

        if (dotsButton.parentElement) {
          resultBlock.dataset.sbfBtnsInjected = '1';

          // --- BLOCK BUTTON ---
          const blockBtn = document.createElement('span');
          blockBtn.className = 'sbf-block-btn';
          blockBtn.title = `Block ${domain}`;
          blockBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;

          blockBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!searchFilters.includes(domain)) {
              searchFilters.push(domain);
              await chrome.storage.local.set({ searchFilters });
            }
          };

          // --- FAVORITE BUTTON ---
          const favBtn = document.createElement('span');
          favBtn.className = 'sbf-fav-btn';
          if (highlightFilters.includes(domain)) favBtn.classList.add('is-fav');
          favBtn.title = `Highlight ${domain}`;
          favBtn.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

          favBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = highlightFilters.indexOf(domain);

            if (index > -1) {
              highlightFilters.splice(index, 1);
              favBtn.classList.remove('is-fav');
            } else {
              highlightFilters.push(domain);
              favBtn.classList.add('is-fav');
            }

            if (highlightFilters.includes(domain) || highlightKeywords.some(kw => resultBlock.innerText.toLowerCase().includes(kw.toLowerCase()))) {
              resultBlock.classList.add('sbf-highlight');
            } else {
              resultBlock.classList.remove('sbf-highlight');
            }

            await chrome.storage.local.set({ highlightFilters });
          };

          // --- INJECTION ---
          const btnGroup = document.createElement('div');
          btnGroup.className = 'sbf-btn-group';
          favBtn.style.pointerEvents = 'auto';
          blockBtn.style.pointerEvents = 'auto';

          btnGroup.appendChild(favBtn);
          btnGroup.appendChild(blockBtn);

          if (dotsButton.parentNode) {
            // Insert our group right before the 3-dots button
            dotsButton.parentNode.insertBefore(btnGroup, dotsButton);
          }
        }
      } catch (e) { }
    });

    // Hardcoded fallback logic for edge-case DOM structures ("People also search for")
    const isImageTabForFallback = window.location.href.includes('tbm=isch') || window.location.href.includes('udm=2');
    if (googleModules.pasf && !isImageTabForFallback) {
      document.querySelectorAll('[data-pcu], .Cl89te, .EyBRub').forEach(el => {
        if (el.querySelector('svg path[d*="M15.5 14h-.79l-.28-.27"]')) {
          const container = el.closest('.MjjYud, .g, .hlcw0c');
          if (container) container.classList.add('sbf-hidden');
        }
      });
    }

    // Auto-trigger infinite scroll if the page becomes too short to scroll
    // (e.g. because we blocked 90% of the results on the first page)
    if (infiniteScrollEnabled && !isFetching) {
      clearTimeout(window.sbfScrollCheckTimeout);
      window.sbfScrollCheckTimeout = setTimeout(onScroll, 500);
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
          setTimeout(() => {
            isFetching = false;
            onScroll(); // Re-check in case the newly fetched page was ALSO mostly blocked!
          }, 800);
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

  // Intercept form submissions to append -noai when AI Overview is set to hide
  document.addEventListener('submit', (e) => {
    if (!googleModules.ai) return;
    const form = e.target.closest('form');
    if (form && form.action && form.action.includes('/search')) {
      const input = form.querySelector('input[name="q"], textarea[name="q"]');
      if (input && input.value && !input.value.toLowerCase().includes('-noai')) {
        input.value = input.value.trim() + ' -noai';
      }
    }
  });
})();