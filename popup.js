document.addEventListener('DOMContentLoaded', async () => {
  // SVG Icons
  const EYE_OPEN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const EYE_CLOSED = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

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
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');

  const modSelectAll = document.getElementById('mod-select-all');

  // Helper for Collapsibles
  function setupCollapsible(toggleId, contentId, arrowId, defaultFlex = 'flex') {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);
    if (!toggle || !content || !arrow) return;
    
    // Sync initial arrow rotation
    const isOpen = content.style.display !== 'none';
    arrow.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';

    toggle.addEventListener('click', () => {
      const isNowOpen = content.style.display === 'none';
      content.style.display = isNowOpen ? defaultFlex : 'none';
      arrow.style.transform = isNowOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  setupCollapsible('modules-toggle', 'modules-content', 'modules-arrow', 'flex');
  setupCollapsible('tabs-toggle', 'tabs-content', 'tabs-arrow', 'flex');
  setupCollapsible('block-domains-toggle', 'block-domains-content', 'block-domains-arrow', 'flex');
  setupCollapsible('pref-domains-toggle', 'pref-domains-content', 'pref-domains-arrow', 'flex');
  setupCollapsible('keywords-toggle', 'keywords-content', 'keywords-arrow', 'flex');

  // Fun Buttons Logic
  document.querySelectorAll('.fun-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(btn.dataset.q)}` });
    });
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

  const TAB_IDS = ['unpack-more', 'tools', 'more', 'images', 'videos', 'short-videos', 'products', 'product-sites', 'news', 'web', 'finance', 'forums', 'maps', 'books', 'shopping'];

  // Load Data
  const storeData = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'advancedSearch', 'preferredDomains', 'blockedKeywords']);
  
  // Clean Data (ensure strings)
  const cleanList = (list) => (list || []).map(item => {
    if (typeof item === 'string') return item;
    if (item && item.domain) return item.domain;
    if (item && item.keyword) return item.keyword;
    if (typeof item === 'object') return JSON.stringify(item);
    return String(item);
  });

  let searchFilters = cleanList(storeData.searchFilters);
  let preferredDomains = cleanList(storeData.preferredDomains);
  let blockedKeywords = cleanList(storeData.blockedKeywords);
  let googleModules = storeData.googleModules || { ai: false, sponsored: false, latest: false, products: false, images: false, videos: false, ask: false, search: false };
  let hiddenTabs = storeData.hiddenTabs || {};

  infiniteToggle.checked = storeData.infiniteScroll === true;
  advSearchToggle.checked = storeData.advancedSearch !== false;

  // Eye Buttons Setup
  function updateEyeUI(btn, isHidden) {
    btn.innerHTML = isHidden ? EYE_CLOSED : EYE_OPEN;
    btn.classList.toggle('hidden', isHidden);
    btn.title = isHidden ? 'Hidden (Click to Show)' : 'Visible (Click to Hide)';
  }

  // Checkboxes for functional tab settings
  const unpackMoreToggle = document.getElementById('tab-unpack-more');

  // Initialize Checkboxes
  unpackMoreToggle.checked = hiddenTabs['unpack-more'] === true;

  unpackMoreToggle.addEventListener('change', () => {
    hiddenTabs['unpack-more'] = unpackMoreToggle.checked;
    saveTabs();
  });

  document.querySelectorAll('.eye-btn').forEach(btn => {
    const hideAttr = btn.dataset.hide;
    if (hideAttr.startsWith('mod-')) {
      const key = hideAttr.replace('mod-', '');
      updateEyeUI(btn, googleModules[key]);
      btn.addEventListener('click', () => {
        googleModules[key] = !googleModules[key];
        updateEyeUI(btn, googleModules[key]);
        saveModules();
      });
    } else if (hideAttr.startsWith('tab-') && hideAttr !== 'tab-unpack-more') {
      const key = hideAttr.replace('tab-', '');
      updateEyeUI(btn, hiddenTabs[key]);
      btn.addEventListener('click', () => {
        hiddenTabs[key] = !hiddenTabs[key];
        updateEyeUI(btn, hiddenTabs[key]);
        saveTabs();
      });
    }
  });

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
    const tabs = await chrome.tabs.query({ url: "*://*.google.*/search*" });
    for (let tab of tabs) {
      try { await chrome.tabs.sendMessage(tab.id, { action: "live_update" }); } catch (e) {}
    }
  }

  function saveModules() {
    chrome.storage.local.set({ googleModules }, triggerLiveUpdate);
    updateSelectAllLabel();
  }

  function saveTabs() {
    chrome.storage.local.set({ hiddenTabs }, triggerLiveUpdate);
  }

  function updateSelectAllLabel() {
    const allHidden = Object.values(googleModules).every(v => v);
    modSelectAll.textContent = allHidden ? 'Show All' : 'Hide All';
  }

  modSelectAll.addEventListener('click', () => {
    const allHidden = Object.values(googleModules).every(v => v);
    const newState = !allHidden;
    Object.keys(googleModules).forEach(k => { googleModules[k] = newState; });
    document.querySelectorAll('[data-hide^="mod-"]').forEach(btn => updateEyeUI(btn, newState));
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
  
  updateSelectAllLabel();
});
