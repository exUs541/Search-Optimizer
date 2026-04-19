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

  // Since manifest restricts this to Google, we can safely assume we are on Google.
  async function loadConfig() {
      const data = await chrome.storage.local.get(['searchFilters', 'googleModules']);
      searchFilters = data.searchFilters || [];
      googleModules = data.googleModules || {};
      activeDomains = searchFilters.map(rule => rule.domain || rule);
  }

  await loadConfig();

  function isBlockedUrl(urlString) {
    try {
        const url = new URL(urlString, window.location.origin);
        return activeDomains.some(site => url.hostname === site || url.hostname.endsWith('.' + site));
    } catch(e) {
        return false;
    }
  }

  function hideDomainLinks(linkElement) {
    if (activeDomains.length === 0) return;

    if (isBlockedUrl(linkElement.href)) {
      let containerToHide = linkElement.closest('.g, g-card, g-inner-card, [role="listitem"], .tF2Cxc, .v5yQqb, .dG2XIf, .Ww4FFb, .iELo6, .uMdZh, .YiHbdc');

      if (!containerToHide) {
          let current = linkElement;
          while (current.parentElement && current.parentElement.children.length === 1 && current.tagName !== 'BODY') {
              current = current.parentElement;
          }
          containerToHide = current;
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
              if (txt === 'Sponsored' || txt === 'Gesponsert') {
                  const adBlock = el.closest('.MjjYud, .g, [data-hveid]');
                  if (adBlock) adBlock.classList.add('sbf-hidden');
              }
          });
      }

      // 2. Products / Shopping
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

      // 3. Text-based Modules (Videos, Latest posts, People also ask)
      function killModuleByHeader(textConditions) {
          const allEls = document.querySelectorAll('h2, h3, div[role="heading"], span, div');
          for (let el of allEls) {
              if (el.children.length > 2) continue;
              
              const text = (el.innerText || '').trim().toLowerCase();
              if (!text) continue;

              const isMatch = textConditions.some(condition => {
                  if (typeof condition === 'string') return text === condition;
                  if (condition instanceof RegExp) return condition.test(text);
                  return false;
              });

              if (isMatch) {
                  let current = el;
                  let target = null;
                  
                  while (current && current.parentElement && current.tagName !== 'BODY') {
                      const pid = current.parentElement.id;
                      if (pid === 'rso' || pid === 'tvcap' || pid === 'tads') {
                          target = current;
                          break;
                      }
                      if (pid === 'botstuff') {
                          // Break without setting target, so we don't hide the entire bottom area
                          break;
                      }
                      current = current.parentElement;
                  }
                  
                  if (target) {
                      target.classList.add('sbf-hidden');
                  } else {
                      const fallback = el.closest('.MjjYud, .hlcw0c, .O9g5cc, block-component, .RyIFgf, [data-hveid]');
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

  function runScanner() {
    document.querySelectorAll('.sbf-hidden').forEach(el => el.classList.remove('sbf-hidden'));

    const links = document.querySelectorAll('a[href]');
    for (let link of links) {
      hideDomainLinks(link);
    }
    
    scanGoogleModules();
  }

  runScanner();

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'live_update') {
      await loadConfig();
      runScanner();
    }
  });

  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (let m of mutations) {
      if (m.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      runScanner();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
