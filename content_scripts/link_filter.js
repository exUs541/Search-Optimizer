(async function() {
  // ─── Styles ───────────────────────────────────────────────────────────────
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = `
      .sbf-hidden { display: none !important; }

      #sbf-loader {
        display: none;
        text-align: center;
        padding: 28px 0;
        color: #9aa0a6;
        font-family: Google Sans, Roboto, sans-serif;
        font-size: 14px;
        gap: 10px;
        align-items: center;
        justify-content: center;
      }
      #sbf-loader.active { display: flex; }

      #sbf-loader .sbf-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #444;
        border-top-color: #8ab4f8;
        border-radius: 50%;
        animation: sbf-spin 0.7s linear infinite;
      }
      @keyframes sbf-spin { to { transform: rotate(360deg); } }

      #sbf-end-msg {
        display: none;
        text-align: center;
        padding: 28px 0;
        color: #9aa0a6;
        font-family: Google Sans, Roboto, sans-serif;
        font-size: 13px;
      }

      .sbf-block-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        margin-left: 10px;
        background: #ef4444; /* Start red to be visible */
        border: 1px solid #dc2626;
        border-radius: 50%;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        vertical-align: middle;
        position: relative;
        z-index: 1000;
        padding: 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .sbf-block-btn:hover {
        background: #b91c1c;
        transform: scale(1.2);
      }
      .sbf-block-btn::after {
        content: 'Block Domain';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #0f172a;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        margin-bottom: 6px;
        border: 1px solid #334155;
      }
      .sbf-block-btn:hover::after {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Config ───────────────────────────────────────────────────────────────
  let searchFilters = [];
  let googleModules = {};
  let activeDomains = [];
  let infiniteScrollEnabled = true;
  let hiddenTabs = {};
  let preferredDomains = [];
  let keywordFilters = [];

  async function loadConfig() {
    const data = await chrome.storage.local.get(
      ['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'preferredDomains', 'keywordFilters']
    );
    searchFilters     = data.searchFilters     || [];
    googleModules     = data.googleModules     || {};
    infiniteScrollEnabled = data.infiniteScroll !== false;
    hiddenTabs        = data.hiddenTabs        || {};
    preferredDomains  = (data.preferredDomains || []).map(r => r.domain || r);
    keywordFilters    = (data.keywordFilters   || []).map(r => r.keyword || r);
    activeDomains     = searchFilters.map(rule => rule.domain || rule);
  }

  await loadConfig();

  // ─── Domain filter helpers ─────────────────────────────────────────────────
  function isBlockedUrl(urlString) {
    try {
      let checkUrl = urlString;
      if (urlString.includes('/url?')) {
        const params = new URL(urlString, window.location.origin).searchParams;
        checkUrl = params.get('q') || params.get('url') || urlString;
      }
      const url = new URL(checkUrl, window.location.origin);
      return activeDomains.some(site => url.hostname === site || url.hostname.endsWith('.' + site));
    } catch (e) { return false; }
  }

  function hideDomainLinks(linkElement) {
    if (activeDomains.length === 0) return;
    if (linkElement.dataset.sbfDone) return;

    if (isBlockedUrl(linkElement.href)) {
      linkElement.dataset.sbfDone = '1';

      let containerToHide = linkElement.closest(
        '.g, g-card, g-inner-card, [role="listitem"], .tF2Cxc, .v5yQqb, .dG2XIf, .Ww4FFb, .iELo6, .uMdZh, .YiHbdc, .hlcw0c'
      );

      if (!containerToHide) {
        let current = linkElement;
        while (current.parentElement && current.parentElement !== document.body) {
          if (current.parentElement.id === 'rso') { containerToHide = current; break; }
          current = current.parentElement;
        }
      }

      if (containerToHide && !containerToHide.classList.contains('sbf-hidden')) {
        containerToHide.classList.add('sbf-hidden');
      }
    }
  }

  // ─── Module filter ─────────────────────────────────────────────────────────
  // Only run on the "All" results tab, not Images/Videos/News/etc.
  function isAllTab() {
    const params = new URLSearchParams(window.location.search);
    const tbm = params.get('tbm');
    const udm = params.get('udm');
    // If tbm is set (isch, vid, etc.), it's definitely not the All tab.
    if (tbm) return false;
    // udm=2 is Images, udm=7 is Videos, etc. udm=null or udm=1 is All.
    if (udm && udm !== '1') return false;
    return true;
  }

  function scanGoogleModules() {
    if (!isAllTab()) return; // ← Only filter on the main "All" tab
    if (googleModules.sponsored) {
      document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad, [data-text-ad]')
        .forEach(el => el.classList.add('sbf-hidden'));
      document.querySelectorAll('span, div').forEach(el => {
        const txt = el.innerText ? el.innerText.trim() : '';
        if ((txt === 'Sponsored' || txt === 'Gesponsert') && el.children.length === 0) {
          const adBlock = el.closest('.MjjYud, .g, [data-hveid]');
          if (adBlock) adBlock.classList.add('sbf-hidden');
        }
      });
    }

    if (googleModules.products) {
      document.querySelectorAll(
        '.pla-unit-container, .cu-container, .mnr-c.pla-unit, #tvcap, .commercial-unit-desktop-top, .commercial-unit-desktop-rhs, [data-pla], .U307f, .wOPJ9c'
      ).forEach(el => {
        const wrapper = el.closest('.MjjYud, .hlcw0c, #tvcap, .cu-container, .O9g5cc');
        if (wrapper) wrapper.classList.add('sbf-hidden');
        else el.classList.add('sbf-hidden');
      });
      document.querySelectorAll('div[id^="pve_"], div[id^="vplap_"]').forEach(el => {
        const wrapper = el.closest('.MjjYud, .hlcw0c, .cu-container');
        if (wrapper) wrapper.classList.add('sbf-hidden');
      });
      document.querySelectorAll('g-scrolling-carousel').forEach(carousel => {
        if (carousel.innerHTML.includes('aclk?sa=') || carousel.innerHTML.includes('/shopping/product')) {
          const block = carousel.closest('.MjjYud, .hlcw0c');
          if (block) block.classList.add('sbf-hidden');
        }
      });
    }

    if (googleModules.images) {
      document.querySelectorAll('.F4CzCf, .WZKmLb, .oIk2Cb, g-section-with-header').forEach(el => {
        const heading = el.querySelector('h3, div[role="heading"]');
        if (heading) {
          const txt = (heading.innerText || '').trim().toLowerCase();
          if (txt === 'images' || txt === 'bilder') {
            const wrapper = el.closest('.MjjYud, .hlcw0c') || el;
            wrapper.classList.add('sbf-hidden');
          }
        }
      });
    }

    function killModuleByHeader(textConditions) {
      const headingEls = document.querySelectorAll('h1, h2, h3, h4, div[role="heading"], [aria-level]');
      for (let el of headingEls) {
        const text = (el.innerText || '').trim().toLowerCase();
        if (!text || text.length > 80) continue;

        const isMatch = textConditions.some(c =>
          typeof c === 'string' ? text === c : c instanceof RegExp ? c.test(text) : false
        );

        if (isMatch) {
          console.log('[Search Optimizer] Matched module header:', text);
          let current = el, target = null;
          while (current && current.parentElement && current !== document.body) {
            const pid = current.parentElement.id;
            const pcls = current.parentElement.className;
            if (pid === 'rso' || pid === 'tvcap' || pid === 'tads' || pcls.includes('v7W49e')) { target = current; break; }
            if (pid === 'botstuff') break;
            current = current.parentElement;
          }
          if (target) {
            target.classList.add('sbf-hidden');
          } else {
            const fallback = el.closest('.MjjYud, .hlcw0c, .O9g5cc, block-component, .RyIFgf, .g, .WwS1pe');
            if (fallback) fallback.classList.add('sbf-hidden');
          }
        }
      }
    }

    if (googleModules.images)   killModuleByHeader(['images', 'bilder', 'image results']);
    if (googleModules.latest)   killModuleByHeader([/^latest posts from/, /^neueste beiträge/, /^what people are saying/, /^trending posts/, 'latest news', 'discussions']);
    if (googleModules.products) killModuleByHeader(['products', 'produkte', 'popular products', /^shop for/, /^kaufen/, 'shopping results']);
    if (googleModules.videos)   killModuleByHeader(['videos', 'short videos', 'kurzvideos', 'reels', 'top stories']);
    if (googleModules.ask)      killModuleByHeader(['people also ask', 'ähnliche fragen', 'nutzer fragen auch', 'others also ask']);
    if (googleModules.search)   killModuleByHeader(['people also search for', 'verwandte suchanfragen', 'related searches', 'search results for', 'more to explore']);
    
    // Fallback: search for specific module classes
    if (googleModules.videos) {
      document.querySelectorAll('.uVp77e, .V1n97e, [data-video-id]').forEach(el => {
        const wrapper = el.closest('.MjjYud, .hlcw0c') || el;
        wrapper.classList.add('sbf-hidden');
      });
    }
  }

  // ─── Hide Search Tabs ──────────────────────────────────────────────────────
  function hideGoogleTabs() {
    // Map our storage keys to the text labels Google uses in the tab bar
    const tabTextMap = {
      'images':        ['images', 'bilder'],
      'videos':        ['videos'],
      'short-videos':  ['short videos', 'kurzvideos'],
      'products':      ['products', 'produkte'],
      'product-sites': ['product sites'],
      'news':          ['news', 'nachrichten'],
      'maps':          ['maps', 'karten'],
      'books':         ['books', 'bücher'],
      'shopping':      ['shopping'],
      'more':          ['more', 'mehr'],
      'tools':         ['tools', 'werkzeuge'],
    };

    const tabBar = document.querySelector('#hdtb, #top_nav, .crJ18e, .Uo8X3b, #hdtb-msb, .MUFdbf, .K9vS3e, .OIn58');
    if (!tabBar) {
      // Secondary attempt: look for elements with role="listitem" in the top section
      const topSection = document.querySelector('#rcnt, #cnt');
      if (!topSection) return;
    }

    const activeKeys = Object.keys(tabTextMap).filter(k => hiddenTabs[k]);
    if (activeKeys.length === 0) return;

    // Walk ALL elements — check their own text nodes only (not nested children).
    // This catches "More" and "Tools" which are custom Google components, not <a> tags.
    // More aggressive tab detection
    const elements = tabBar.querySelectorAll('a, div[role="link"], div[role="tab"], div[role="button"], span, .hdtb-mitem, .C6AK7c');
    elements.forEach(el => {
      const text = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (!text || text.length > 40) return;

      for (const key of activeKeys) {
        const labels = tabTextMap[key];
        const isHit = labels.some(l => text === l || text.startsWith(l + ' '));
        
        if (isHit) {
          // Find the top-level list item or flex item
          let current = el;
          while (current && current.parentElement && current.parentElement !== tabBar && 
                 !current.parentElement.classList.contains('crJ18e') && 
                 !current.parentElement.classList.contains('Uo8X3b') &&
                 !current.parentElement.classList.contains('OIn58') &&
                 current.parentElement.id !== 'hdtb-msb') {
            current = current.parentElement;
          }
          if (current) {
            current.classList.add('sbf-hidden');
            // Also hide the anchor if we found one
            const anchor = current.tagName === 'A' ? current : current.querySelector('a');
            if (anchor) anchor.classList.add('sbf-hidden');
          }
        }
      }
    });
  }


  // ─── Preferred Domains ────────────────────────────────────────────────────
  if (!document.getElementById('sbf-pref-style')) {
    const ps = document.createElement('style');
    ps.id = 'sbf-pref-style';
    ps.textContent = '.sbf-preferred { border-left: 3px solid #22c55e !important; padding-left: 8px; box-shadow: -2px 0 8px rgba(34,197,94,.12); }';
    document.head.appendChild(ps);
  }

  function highlightPreferred(linkEl) {
    if (!preferredDomains.length) return;
    if (linkEl.dataset.sbfPrefDone) return;
    linkEl.dataset.sbfPrefDone = '1';
    try {
      let checkUrl = linkEl.href;
      if (checkUrl.includes('/url?')) {
        const p = new URL(checkUrl, location.origin).searchParams;
        checkUrl = p.get('q') || p.get('url') || checkUrl;
      }
      const host = new URL(checkUrl, location.origin).hostname;
      const isPreferred = preferredDomains.some(d => host === d || host.endsWith('.' + d));
      if (isPreferred) {
        let container = linkEl.closest('.g, .tF2Cxc, .hlcw0c, .MjjYud');
        if (!container) {
          let c = linkEl;
          while (c.parentElement && c.parentElement.id !== 'rso') c = c.parentElement;
          container = c;
        }
        if (container) container.classList.add('sbf-preferred');
      }
    } catch(e) {}
  }

  // ─── Keyword Filter ───────────────────────────────────────────────────────
  function hideByKeyword() {
    if (!keywordFilters.length || !isAllTab()) return;
    const rso = document.getElementById('rso');
    if (!rso) return;
    rso.querySelectorAll('.g, .MjjYud').forEach(block => {
      if (block.classList.contains('sbf-hidden')) return;
      const text = (block.innerText || '').toLowerCase();
      const hit = keywordFilters.some(kw => {
        const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        return re.test(text);
      });
      if (hit) block.classList.add('sbf-hidden');
    });
  }

  function fullScan() {
    document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
    document.querySelectorAll('a[href][data-sbf-done]').forEach(el => delete el.dataset.sbfDone);
    incrementalScan();
  }

    hideGoogleTabs();
  }

  // ─── Inline Block Button ──────────────────────────────────────────────────
  function injectBlockButtons() {
    // Target common Google search result headers
    const headers = document.querySelectorAll('.yuRUbf, .v5yQqb, .ca_1');
    
    headers.forEach(header => {
      if (header.dataset.sbfBlockDone) return;
      
      const link = header.querySelector('a[href]');
      if (!link) return;

      // Extract domain
      let domain = '';
      try {
        let checkUrl = link.href;
        if (checkUrl.includes('/url?')) {
          const params = new URL(checkUrl, window.location.origin).searchParams;
          checkUrl = params.get('q') || params.get('url') || checkUrl;
        }
        domain = new URL(checkUrl, window.location.origin).hostname;
        domain = domain.replace(/^www\./, '');
      } catch(e) { return; }

      if (!domain) return;
      header.dataset.sbfBlockDone = '1';

      // Create the button
      const btn = document.createElement('button');
      btn.className = 'sbf-block-btn';
      btn.innerHTML = '🚫';
      btn.title = `Block ${domain}`;
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm(`Do you want to block ${domain}?`)) {
          const data = await chrome.storage.local.get('searchFilters');
          const filters = data.searchFilters || [];
          if (!filters.some(f => (f.domain || f) === domain)) {
            filters.push({ domain: domain });
            await chrome.storage.local.set({ searchFilters: filters });
            chrome.runtime.sendMessage({ action: 'live_update' });
            // Find container to hide
            const container = header.closest('.g, .MjjYud, .tF2Cxc') || header;
            container.classList.add('sbf-hidden');
          }
        }
      };

      // Inject near the three-dot menu or at the end of the header
      const menu = header.querySelector('.VqP7ub, .XNo29b, .rwoS6c');
      if (menu) {
        menu.parentElement.insertBefore(btn, menu);
      } else {
        header.appendChild(btn);
      }
    });
  }

  function incrementalScan() {
    document.querySelectorAll('a[href]:not([data-sbf-done])').forEach(link => {
      hideDomainLinks(link);
      highlightPreferred(link);
    });
    if (googleModules) scanGoogleModules();
    hideByKeyword();
    hideGoogleTabs();
    injectBlockButtons();
  }

  fullScan();

  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'live_update') {
      await loadConfig();
      fullScan();
    }
  });

  let scanTimeout = null;
  const domObserver = new MutationObserver((mutations) => {
    let hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
    if (hasNewNodes) {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(incrementalScan, 150);
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  // ─── Infinite Scroll ───────────────────────────────────────────────────────
  function getNextPageUrl() {
    const nextLink = document.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"]');
    return nextLink ? nextLink.href : null;
  }

  function setupInfiniteScroll() {
    const rso = document.getElementById('rso');
    const botstuff = document.getElementById('botstuff');
    if (!rso) return;

    // ── Mode A: Google has classic pagination with a Next button ──────────────
    const useClassicPagination = !!getNextPageUrl();

    // ── Mode B: Google already uses its own "More results" / continuous scroll ─
    // In this case, there may be no #botstuff at all, or no #pnnext.
    // We simply watch for a "More results" button that Google injects itself.
    if (!useClassicPagination) {
      // Google's own continuous scroll — just observe for their trigger button
      // and click it automatically when it enters the viewport
      const moreResultsObserver = new MutationObserver(() => {
        const moreBtn = document.querySelector(
          '[jsname="UUbT9"] button, .T3kxre button, button[data-async-context*="query"]'
        );
        if (moreBtn && !moreBtn.dataset.sbfAuto) {
          moreBtn.dataset.sbfAuto = '1';
          // Observe when it enters viewport and auto-click
          const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              setTimeout(() => moreBtn.click(), 300);
              io.disconnect();
            }
          }, { rootMargin: '400px' });
          io.observe(moreBtn);
        }
      });
      moreResultsObserver.observe(document.body, { childList: true, subtree: true });
      return; // Google handles the fetching, MutationObserver handles our filtering
    }

    // ── Classic pagination mode: we fetch and inject next pages ourselves ──────
    if (!botstuff) return;

    // Insert loader and end-of-results message below botstuff
    const loader = document.createElement('div');
    loader.id = 'sbf-loader';
    loader.innerHTML = '<div class="sbf-spinner"></div><span>Loading more results…</span>';
    botstuff.after(loader);

    const endMsg = document.createElement('div');
    endMsg.id = 'sbf-end-msg';
    endMsg.textContent = '— End of results —';
    loader.after(endMsg);

    // Hide the original pagination
    botstuff.style.visibility = 'hidden';
    botstuff.style.height = '0';
    botstuff.style.overflow = 'hidden';

    let isFetching = false;
    let nextUrl = getNextPageUrl();
    let pageNumber = 2;

    console.log('[Search Optimizer] Infinite scroll ready. Next URL:', nextUrl);

    async function fetchNextPage() {
      if (isFetching || !nextUrl) return;
      isFetching = true;
      loader.classList.add('active');
      console.log('[Search Optimizer] Fetching page', pageNumber, nextUrl);

      try {
        const response = await fetch(nextUrl, {
          headers: { 'Accept': 'text/html', 'X-Requested-With': '' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const newRso = doc.getElementById('rso');
        console.log('[Search Optimizer] Fetched RSO children:', newRso?.children?.length);

        if (newRso && newRso.children.length > 0) {
          const divider = document.createElement('div');
          divider.style.cssText = 'display:flex;align-items:center;gap:12px;padding:24px 0 12px;color:#9aa0a6;font-family:Google Sans,Roboto,sans-serif;font-size:12px;';
          divider.innerHTML = `<hr style="flex:1;border:none;border-top:1px solid #3c4043;"><span>Page ${pageNumber}</span><hr style="flex:1;border:none;border-top:1px solid #3c4043;">`;
          rso.appendChild(divider);
          pageNumber++;

          Array.from(newRso.children).forEach(child => {
            rso.appendChild(child.cloneNode(true));
          });
        }

        const newNextLink = doc.querySelector('#pnnext, a[aria-label="Next"], a[aria-label="Weiter"]');
        nextUrl = newNextLink ? newNextLink.href : null;
        console.log('[Search Optimizer] Next URL after fetch:', nextUrl);

        if (!nextUrl) {
          endMsg.style.display = 'block';
          window.removeEventListener('scroll', onScroll);
        }
      } catch (err) {
        console.error('[Search Optimizer] Fetch failed:', err);
        botstuff.style.visibility = '';
        botstuff.style.height = '';
        botstuff.style.overflow = '';
        nextUrl = null;
        endMsg.style.display = 'block';
        window.removeEventListener('scroll', onScroll);
      }

      loader.classList.remove('active');
      isFetching = false;
    }

    function onScroll() {
      // Trigger when user is within 600px of the bottom of the page
      const distanceFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (distanceFromBottom < 600) {
        fetchNextPage();
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Also try immediately in case the page is already short enough
    setTimeout(onScroll, 500);
  }

  if (document.readyState === 'complete') {
    if (infiniteScrollEnabled) setupInfiniteScroll();
  } else {
    window.addEventListener('load', () => {
      if (infiniteScrollEnabled) setupInfiniteScroll();
    }, { once: true });
  }
})();
