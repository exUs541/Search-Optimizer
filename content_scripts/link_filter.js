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
    `;
    document.head.appendChild(style);
  }

  // ─── Config ───────────────────────────────────────────────────────────────
  let searchFilters = [];
  let googleModules = {};
  let activeDomains = [];
  let infiniteScrollEnabled = true;

  async function loadConfig() {
    const data = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll']);
    searchFilters = data.searchFilters || [];
    googleModules = data.googleModules || {};
    infiniteScrollEnabled = data.infiniteScroll !== false; // default true
    activeDomains = searchFilters.map(rule => rule.domain || rule);
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
  function scanGoogleModules() {
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
          let current = el, target = null;
          while (current && current.parentElement && current !== document.body) {
            const pid = current.parentElement.id;
            if (pid === 'rso' || pid === 'tvcap' || pid === 'tads') { target = current; break; }
            if (pid === 'botstuff') break;
            current = current.parentElement;
          }
          if (target) {
            target.classList.add('sbf-hidden');
          } else {
            const fallback = el.closest('.MjjYud, .hlcw0c, .O9g5cc, block-component, .RyIFgf');
            if (fallback) fallback.classList.add('sbf-hidden');
          }
        }
      }
    }

    if (googleModules.images)   killModuleByHeader(['images', 'bilder']);
    if (googleModules.latest)   killModuleByHeader([/^latest posts from/, /^neueste beiträge/, /^what people are saying/, /^trending posts/]);
    if (googleModules.products) killModuleByHeader(['products', 'produkte', 'popular products', /^shop for/, /^kaufen/]);
    if (googleModules.videos)   killModuleByHeader(['videos', 'short videos', 'kurzvideos']);
    if (googleModules.ask)      killModuleByHeader(['people also ask', 'ähnliche fragen', 'nutzer fragen auch']);
    if (googleModules.search)   killModuleByHeader(['people also search for', 'verwandte suchanfragen', 'related searches']);
  }

  // ─── Scan functions ────────────────────────────────────────────────────────
  function fullScan() {
    document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));
    document.querySelectorAll('a[href][data-sbf-done]').forEach(el => delete el.dataset.sbfDone);
    incrementalScan();
  }

  function incrementalScan() {
    document.querySelectorAll('a[href]:not([data-sbf-done])').forEach(link => hideDomainLinks(link));
    scanGoogleModules();
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
