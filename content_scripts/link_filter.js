(async function() {
  // Inject style tag for hiding
  if (!document.getElementById('sbf-style')) {
    const style = document.createElement('style');
    style.id = 'sbf-style';
    style.textContent = '.sbf-hidden { display: none !important; }';
    document.head.appendChild(style);
  }

  let searchFilters = [];
  let googleModules = {};
  let activeDomains = [];

  async function loadConfig() {
      const data = await chrome.storage.local.get(['searchFilters', 'googleModules']);
      searchFilters = data.searchFilters || [];
      googleModules = data.googleModules || {};
      activeDomains = searchFilters.map(rule => rule.domain || rule);
  }

  await loadConfig();

  function isBlockedUrl(urlString) {
    try {
        // Handle Google redirect URLs like /url?q=https://www.youtube.com/...
        let checkUrl = urlString;
        if (urlString.includes('/url?')) {
            const params = new URL(urlString, window.location.origin).searchParams;
            checkUrl = params.get('q') || params.get('url') || urlString;
        }
        const url = new URL(checkUrl, window.location.origin);
        return activeDomains.some(site => url.hostname === site || url.hostname.endsWith('.' + site));
    } catch(e) {
        return false;
    }
  }

  function hideDomainLinks(linkElement) {
    if (activeDomains.length === 0) return;
    if (linkElement.dataset.sbfDone) return;

    if (isBlockedUrl(linkElement.href)) {
      linkElement.dataset.sbfDone = '1';
      
      let containerToHide = linkElement.closest('.g, g-card, g-inner-card, [role="listitem"], .tF2Cxc, .v5yQqb, .dG2XIf, .Ww4FFb, .iELo6, .uMdZh, .YiHbdc, .hlcw0c');

      if (!containerToHide) {
          // Walk up until parent has multiple siblings (meaning we found the result block)
          let current = linkElement;
          while (current.parentElement && current.parentElement !== document.body) {
              if (current.parentElement.id === 'rso') {
                  containerToHide = current;
                  break;
              }
              current = current.parentElement;
          }
      }

      if (containerToHide && !containerToHide.classList.contains('sbf-hidden')) {
          containerToHide.classList.add('sbf-hidden');
      }
    }
  }

  function scanGoogleModules() {
      // 1. Sponsored Ads
      if (googleModules.sponsored) {
          document.querySelectorAll('#tads, #tadsb, #tvcap, .uEierd, .ads-ad, [data-text-ad]').forEach(el => el.classList.add('sbf-hidden'));
          document.querySelectorAll('span, div').forEach(el => {
              const txt = el.innerText ? el.innerText.trim() : '';
              if ((txt === 'Sponsored' || txt === 'Gesponsert') && el.children.length === 0) {
                  const adBlock = el.closest('.MjjYud, .g, [data-hveid]');
                  if (adBlock) adBlock.classList.add('sbf-hidden');
              }
          });
      }

      // 2. Products / Shopping (CSS selectors first)
      if (googleModules.products) {
          document.querySelectorAll('.pla-unit-container, .cu-container, .mnr-c.pla-unit, #tvcap, .commercial-unit-desktop-top, .commercial-unit-desktop-rhs, [data-pla], .U307f, .wOPJ9c').forEach(el => {
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

      // 3. Images block (Google uses specific class: .WZKmLb or section heading "Images")
      if (googleModules.images) {
          // Try direct class selectors first
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

      // 4. Text-based modules - crawl up to the #rso direct child
      function killModuleByHeader(textConditions) {
          // Query only heading-like elements (not all divs) for performance & accuracy
          const headingEls = document.querySelectorAll('h1, h2, h3, h4, div[role="heading"], [aria-level]');
          for (let el of headingEls) {
              const text = (el.innerText || '').trim().toLowerCase();
              if (!text || text.length > 80) continue;

              const isMatch = textConditions.some(condition => {
                  if (typeof condition === 'string') return text === condition;
                  if (condition instanceof RegExp) return condition.test(text);
                  return false;
              });

              if (isMatch) {
                  let current = el;
                  let target = null;
                  
                  while (current && current.parentElement && current !== document.body) {
                      const pid = current.parentElement.id;
                      if (pid === 'rso' || pid === 'tvcap' || pid === 'tads') {
                          target = current;
                          break;
                      }
                      if (pid === 'botstuff') break; // Don't hide pagination
                      current = current.parentElement;
                  }
                  
                  if (target) {
                      target.classList.add('sbf-hidden');
                  } else {
                      // Fallback: find closest known block class
                      const fallback = el.closest('.MjjYud, .hlcw0c, .O9g5cc, block-component, .RyIFgf');
                      if (fallback) fallback.classList.add('sbf-hidden');
                  }
              }
          }
      }

      if (googleModules.images) {
          killModuleByHeader(['images', 'bilder']);
      }
      if (googleModules.latest) {
          killModuleByHeader([/^latest posts from/, /^neueste beiträge/, /^what people are saying/, /^trending posts/]);
      }
      if (googleModules.products) {
          killModuleByHeader(['products', 'produkte', 'popular products', /^shop for/, /^kaufen/]);
      }
      if (googleModules.videos) {
          killModuleByHeader(['videos', 'short videos', 'kurzvideos']);
      }
      if (googleModules.ask) {
          killModuleByHeader(['people also ask', 'ähnliche fragen', 'nutzer fragen auch']);
      }
      if (googleModules.search) {
          killModuleByHeader(['people also search for', 'verwandte suchanfragen', 'related searches']);
      }
  }

  // Full scan: unhide all, then re-hide (only on live config changes)
  function fullScan() {
    document.querySelectorAll('.sbf-hidden').forEach(el => {
      el.classList.remove('sbf-hidden');
      delete el.dataset.sbfDone;
    });
    document.querySelectorAll('a[href][data-sbf-done]').forEach(el => delete el.dataset.sbfDone);
    incrementalScan();
  }

  // Incremental scan: only processes new/unprocessed elements
  function incrementalScan() {
    const links = document.querySelectorAll('a[href]:not([data-sbf-done])');
    for (let link of links) {
      hideDomainLinks(link);
    }
    scanGoogleModules();
  }

  // Initial full scan on page load
  fullScan();

  // Live updates from popup: do a full scan with fresh config
  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'live_update') {
      await loadConfig();
      fullScan();
    }
  });

  // MutationObserver: only incremental scan for new content (e.g. infinite scroll)
  // Throttled to avoid performance issues
  let scanTimeout = null;
  const observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (let m of mutations) {
      if (m.addedNodes.length > 0) { hasNewNodes = true; break; }
    }
    if (hasNewNodes) {
      if (scanTimeout) clearTimeout(scanTimeout);
      scanTimeout = setTimeout(incrementalScan, 150);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
