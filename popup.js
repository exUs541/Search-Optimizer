document.addEventListener('DOMContentLoaded', async () => {
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');

  // Google Modules Setup
  const modSponsored = document.getElementById('mod-sponsored');
  const modLatest = document.getElementById('mod-latest');
  const modProducts = document.getElementById('mod-products');
  const modVideos = document.getElementById('mod-videos');
  const modAsk = document.getElementById('mod-ask');
  const modSearch = document.getElementById('mod-search');

  const storeData = await chrome.storage.local.get(['searchFilters', 'googleModules']);
  let searchFilters = storeData.searchFilters || [];
  
  const googleModules = storeData.googleModules || {
    sponsored: false,
    latest: false,
    products: false,
    videos: false,
    ask: false,
    search: false
  };

  modSponsored.checked = googleModules.sponsored;
  modLatest.checked = googleModules.latest;
  modProducts.checked = googleModules.products;
  modVideos.checked = googleModules.videos;
  modAsk.checked = googleModules.ask;
  modSearch.checked = googleModules.search;

  async function triggerLiveUpdate() {
      const tabs = await chrome.tabs.query({url: ["*://*.google.com/*", "*://*.google.de/*", "*://*.google.co.uk/*", "*://*.google.at/*", "*://*.google.ch/*"]});
      for (let tab of tabs) {
          try {
              await chrome.tabs.sendMessage(tab.id, { action: "live_update" });
          } catch (e) {}
      }
  }

  function saveModules() {
    chrome.storage.local.set({
      googleModules: {
        sponsored: modSponsored.checked,
        latest: modLatest.checked,
        products: modProducts.checked,
        videos: modVideos.checked,
        ask: modAsk.checked,
        search: modSearch.checked
      }
    }, () => {
        triggerLiveUpdate();
    });
  }

  [modSponsored, modLatest, modProducts, modVideos, modAsk, modSearch].forEach(chk => {
    chk.addEventListener('change', saveModules);
  });

  renderSites();

  function renderSites() {
    siteList.innerHTML = '';
    searchFilters.forEach((rule, index) => {
      const li = document.createElement('li');
      
      const content = document.createElement('div');
      content.className = 'li-content';
      
      const domainSpan = document.createElement('span');
      domainSpan.className = 'li-domain';
      domainSpan.textContent = rule.domain || rule; // Fallback for old data structures if any
      
      content.appendChild(domainSpan);
      
      const delBtn = document.createElement('button');
      delBtn.textContent = '×';
      delBtn.className = 'delete-btn';
      delBtn.title = 'Remove';
      delBtn.onclick = async () => {
        searchFilters.splice(index, 1);
        await chrome.storage.local.set({ searchFilters });
        renderSites();
        triggerLiveUpdate();
      };
      
      li.appendChild(content);
      li.appendChild(delBtn);
      siteList.appendChild(li);
    });
  }

  addBtn.addEventListener('click', async () => {
    let site = siteInput.value.trim().toLowerCase();
    site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
    site = site.split('/')[0];

    if (site) {
      // Clean up string representation if it existed, otherwise enforce new object
      const existingIndex = searchFilters.findIndex(r => r.domain === site || r === site);
      
      const newRule = { domain: site };

      if (existingIndex !== -1) {
        searchFilters[existingIndex] = newRule;
      } else {
        searchFilters.push(newRule);
      }
      
      await chrome.storage.local.set({ searchFilters });
      siteInput.value = '';
      renderSites();
      triggerLiveUpdate();
    }
  });

  siteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });
});
