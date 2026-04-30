document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');
  
  const prefSiteInput = document.getElementById('pref-site-input');
  const addPrefBtn = document.getElementById('add-pref-btn');
  const prefSiteList = document.getElementById('pref-site-list');
  
  const keywordInput = document.getElementById('keyword-input');
  const addKeywordBtn = document.getElementById('add-keyword-btn');
  const keywordList = document.getElementById('keyword-list');
  
  const infiniteToggle = document.getElementById('infinite-scroll');
  const advSearchToggle = document.getElementById('advanced-search');
  const googleFunToggle = document.getElementById('google-fun');
  
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');

  // Google Modules Setup
  const modSponsored = document.getElementById('mod-sponsored');
  const modLatest = document.getElementById('mod-latest');
  const modProducts = document.getElementById('mod-products');
  const modImages = document.getElementById('mod-images');
  const modVideos = document.getElementById('mod-videos');
  const modAsk = document.getElementById('mod-ask');
  const modSearch = document.getElementById('mod-search');
  const modSelectAll = document.getElementById('mod-select-all');

  // Collapsibles
  const modulesToggle = document.getElementById('modules-toggle');
  const modulesContent = document.getElementById('modules-content');
  const modulesArrow = document.getElementById('modules-arrow');
  modulesToggle.addEventListener('click', () => {
    const isOpen = modulesContent.style.display !== 'none';
    modulesContent.style.display = isOpen ? 'none' : 'flex';
    modulesArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  });

  const funToggle = document.getElementById('fun-toggle');
  const funContent = document.getElementById('fun-content');
  const funArrow = document.getElementById('fun-arrow');
  funToggle.addEventListener('click', () => {
    const isOpen = funContent.style.display !== 'none';
    funContent.style.display = isOpen ? 'none' : 'block';
    funArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  // Fun Buttons Logic
  document.querySelectorAll('.fun-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.q;
      chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(q)}` });
    });
  });

  const tabsToggle = document.getElementById('tabs-toggle');
  const tabsContent = document.getElementById('tabs-content');
  const tabsArrow = document.getElementById('tabs-arrow');
  tabsToggle.addEventListener('click', () => {
    const isOpen = tabsContent.style.display !== 'none';
    tabsContent.style.display = isOpen ? 'none' : 'flex';
    tabsArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  // Tab switching logic
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Tab IDs
  const TAB_IDS = ['images','videos','short-videos','products','product-sites','news','maps','books','shopping','more','tools'];
  const tabCheckboxes = {};
  TAB_IDS.forEach(id => { tabCheckboxes[id] = document.getElementById('tab-' + id); });

  // Load Data
  const storeData = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'advancedSearch', 'googleFun', 'preferredDomains', 'blockedKeywords']);
  
  let searchFilters = storeData.searchFilters || [];
  let preferredDomains = storeData.preferredDomains || [];
  let blockedKeywords = storeData.blockedKeywords || [];
  
  infiniteToggle.checked = storeData.infiniteScroll !== false;
  advSearchToggle.checked = storeData.advancedSearch !== false;
  googleFunToggle.checked = storeData.googleFun === true;

  const googleModules = storeData.googleModules || { sponsored: false, latest: false, products: false, images: false, videos: false, ask: false, search: false };
  modSponsored.checked = googleModules.sponsored;
  modLatest.checked = googleModules.latest;
  modProducts.checked = googleModules.products;
  modImages.checked = googleModules.images;
  modVideos.checked = googleModules.videos;
  modAsk.checked = googleModules.ask;
  modSearch.checked = googleModules.search;

  const hiddenTabs = storeData.hiddenTabs || {};
  TAB_IDS.forEach(id => { tabCheckboxes[id].checked = hiddenTabs[id] || false; });

  // Render Functions
  function renderList(list, element, storageKey) {
    element.innerHTML = '';
    list.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = item;
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.className = 'delete-btn';
      delBtn.onclick = () => {
        list.splice(index, 1);
        chrome.storage.local.set({ [storageKey]: list }, () => {
          renderList(list, element, storageKey);
          triggerLiveUpdate();
        });
      };
      li.appendChild(delBtn);
      element.appendChild(li);
    });
  }

  renderList(searchFilters, siteList, 'searchFilters');
  renderList(preferredDomains, prefSiteList, 'preferredDomains');
  renderList(blockedKeywords, keywordList, 'blockedKeywords');

  // Event Handlers
  async function triggerLiveUpdate() {
    const tabs = await chrome.tabs.query({url: ["*://*.google.com/*", "*://*.google.de/*", "*://*.google.co.uk/*", "*://*.google.at/*", "*://*.google.ch/*"]});
    for (let tab of tabs) {
      try { await chrome.tabs.sendMessage(tab.id, { action: "live_update" }); } catch (e) {}
    }
  }

  function saveModules() {
    chrome.storage.local.set({
      googleModules: {
        sponsored: modSponsored.checked,
        latest: modLatest.checked,
        products: modProducts.checked,
        images: modImages.checked,
        videos: modVideos.checked,
        ask: modAsk.checked,
        search: modSearch.checked
      }
    }, triggerLiveUpdate);
    updateSelectAllLabel();
  }

  function saveTabs() {
    const hiddenTabs = {};
    TAB_IDS.forEach(id => { hiddenTabs[id] = tabCheckboxes[id].checked; });
    chrome.storage.local.set({ hiddenTabs }, triggerLiveUpdate);
  }

  function updateSelectAllLabel() {
    const allChecked = [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].every(c => c.checked);
    modSelectAll.textContent = allChecked ? 'Deselect All' : 'Select All';
  }

  // listeners
  [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].forEach(chk => chk.addEventListener('change', saveModules));
  TAB_IDS.forEach(id => { tabCheckboxes[id].addEventListener('change', saveTabs); });
  
  modSelectAll.addEventListener('click', () => {
    const allChecked = [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].every(c => c.checked);
    const newState = !allChecked;
    [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].forEach(c => c.checked = newState);
    saveModules();
  });

  infiniteToggle.addEventListener('change', () => chrome.storage.local.set({ infiniteScroll: infiniteToggle.checked }, triggerLiveUpdate));
  advSearchToggle.addEventListener('change', () => chrome.storage.local.set({ advancedSearch: advSearchToggle.checked }, triggerLiveUpdate));

  addBtn.addEventListener('click', () => {
    const site = siteInput.value.trim().toLowerCase();
    if (site && !searchFilters.includes(site)) {
      searchFilters.push(site);
      chrome.storage.local.set({ searchFilters }, () => { renderList(searchFilters, siteList, 'searchFilters'); siteInput.value = ''; triggerLiveUpdate(); });
    }
  });

  addPrefBtn.addEventListener('click', () => {
    const site = prefSiteInput.value.trim().toLowerCase();
    if (site && !preferredDomains.includes(site)) {
      preferredDomains.push(site);
      chrome.storage.local.set({ preferredDomains }, () => { renderList(preferredDomains, prefSiteList, 'preferredDomains'); prefSiteInput.value = ''; triggerLiveUpdate(); });
    }
  });

  addKeywordBtn.addEventListener('click', () => {
    const kw = keywordInput.value.trim().toLowerCase();
    if (kw && !blockedKeywords.includes(kw)) {
      blockedKeywords.push(kw);
      chrome.storage.local.set({ blockedKeywords }, () => { renderList(blockedKeywords, keywordList, 'blockedKeywords'); keywordInput.value = ''; triggerLiveUpdate(); });
    }
  });

  // Backup & Restore
  exportBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-optimizer-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  });

  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const data = JSON.parse(re.target.result);
          await chrome.storage.local.clear();
          await chrome.storage.local.set(data);
          window.location.reload();
        } catch (err) { alert('Invalid backup file'); }
      };
      reader.readAsText(file);
    };
    input.click();
  });
});
