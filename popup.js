document.addEventListener('DOMContentLoaded', async () => {
  const siteInput = document.getElementById('site-input');
  const addBtn = document.getElementById('add-btn');
  const siteList = document.getElementById('site-list');
  const toggleInfiniteScroll = document.getElementById('toggle-infinite-scroll');
  const advSearchToggle = document.getElementById('advanced-search');
  const googleFunToggle = document.getElementById('google-fun');

  // Google Modules Setup
  const modSponsored = document.getElementById('mod-sponsored');
  const modLatest = document.getElementById('mod-latest');
  const modProducts = document.getElementById('mod-products');
  const modImages = document.getElementById('mod-images');
  const modVideos = document.getElementById('mod-videos');
  const modAsk = document.getElementById('mod-ask');
  const modSearch = document.getElementById('mod-search');

  // Collapse toggle
  const modulesToggle = document.getElementById('modules-toggle');
  const modulesContent = document.getElementById('modules-content');
  const modulesArrow = document.getElementById('modules-arrow');
  modulesToggle.addEventListener('click', () => {
    const isOpen = modulesContent.style.display !== 'none';
    modulesContent.style.display = isOpen ? 'none' : 'flex';
    modulesArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  // Search Tabs collapse toggle
  const tabsToggle = document.getElementById('tabs-toggle');
  const tabsContent = document.getElementById('tabs-content');
  const tabsArrow = document.getElementById('tabs-arrow');
  tabsToggle.addEventListener('click', () => {
    const isOpen = tabsContent.style.display !== 'none';
    tabsContent.style.display = isOpen ? 'none' : 'flex';
    tabsArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  // Tab checkboxes
  const TAB_IDS = ['images','videos','short-videos','products','product-sites','news','maps','books','shopping','more','tools'];
  const tabCheckboxes = {};
  TAB_IDS.forEach(id => { tabCheckboxes[id] = document.getElementById('tab-' + id); });

  const storeData = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'advancedSearch', 'googleFun']);
  let searchFilters = storeData.searchFilters || [];
  const infiniteScrollEnabled = storeData.infiniteScroll !== false;
  toggleInfiniteScroll.checked = infiniteScrollEnabled;
  advSearchToggle.checked = storeData.advancedSearch !== false;
  googleFunToggle.checked = storeData.googleFun === true;
  const hiddenTabs = storeData.hiddenTabs || {};

  // Load tab checkbox states
  TAB_IDS.forEach(id => {
    tabCheckboxes[id].checked = hiddenTabs[id] || false;
  });
  // Open tabs section if any active
  if (TAB_IDS.some(id => hiddenTabs[id])) {
    tabsContent.style.display = 'flex';
    tabsArrow.style.transform = 'rotate(90deg)';
  }
  
  const googleModules = storeData.googleModules || {
    sponsored: false,
    latest: false,
    products: false,
    images: false,
    videos: false,
    ask: false,
    search: false
  };

  modSponsored.checked = googleModules.sponsored;
  modLatest.checked = googleModules.latest;
  modProducts.checked = googleModules.products;
  modImages.checked = googleModules.images;
  modVideos.checked = googleModules.videos;
  modAsk.checked = googleModules.ask;
  modSearch.checked = googleModules.search;

  // Show section open if any module is active
  const anyActive = Object.values(googleModules).some(v => v === true);
  if (anyActive) {
    modulesContent.style.display = 'flex';
    modulesArrow.style.transform = 'rotate(90deg)';
  }

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
        images: modImages.checked,
        videos: modVideos.checked,
        ask: modAsk.checked,
        search: modSearch.checked
      }
    }, () => {
        triggerLiveUpdate();
    });
  }

  function saveTabs() {
    const hiddenTabs = {};
    TAB_IDS.forEach(id => { hiddenTabs[id] = tabCheckboxes[id].checked; });
    chrome.storage.local.set({ hiddenTabs }, triggerLiveUpdate);
  }

  TAB_IDS.forEach(id => { tabCheckboxes[id].addEventListener('change', saveTabs); });

  toggleInfiniteScroll.addEventListener('change', () => {
    chrome.storage.local.set({ infiniteScroll: toggleInfiniteScroll.checked }, triggerLiveUpdate);
  });

  const modSelectAll = document.getElementById('mod-select-all');
  if (modSelectAll) {
    modSelectAll.addEventListener('click', () => {
      const allChecked = [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].every(c => c.checked);
      const newState = !allChecked;
      [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].forEach(c => c.checked = newState);
      modSelectAll.textContent = newState ? 'Deselect All' : 'Select All';
      saveModules();
    });
  }

  function updateSelectAllLabel() {
    if (!modSelectAll) return;
    const allChecked = [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].every(c => c.checked);
    modSelectAll.textContent = allChecked ? 'Deselect All' : 'Select All';
  }
  updateSelectAllLabel();

  [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch].forEach(chk => {
    chk.addEventListener('change', saveModules);
  });

  // Select All / Deselect All for modules
  const modSelectAllBtn = document.getElementById('mod-select-all');
  const allModChks = [modSponsored, modLatest, modProducts, modImages, modVideos, modAsk, modSearch];
  function updateSelectAllLabel() {
    const allChecked = allModChks.every(c => c.checked);
    modSelectAllBtn.textContent = allChecked ? 'Deselect All' : 'Select All';
    modSelectAllBtn.style.color = allChecked ? '#ef4444' : '#94a3b8';
    modSelectAllBtn.style.borderColor = allChecked ? '#ef4444' : '#334155';
  }
  updateSelectAllLabel();
  allModChks.forEach(c => c.addEventListener('change', updateSelectAllLabel));
  modSelectAllBtn.addEventListener('click', () => {
    const allChecked = allModChks.every(c => c.checked);
    allModChks.forEach(c => { c.checked = !allChecked; });
    saveModules();
    updateSelectAllLabel();
  });

  // Collapse toggles for Domains
  const domainsToggle = document.getElementById('domains-toggle');
  const domainsContent = document.getElementById('domains-content');
  const domainsArrow = document.getElementById('domains-arrow');
  domainsToggle.addEventListener('click', () => {
    const open = domainsContent.style.display !== 'none';
    domainsContent.style.display = open ? 'none' : 'block';
    domainsArrow.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  const prefToggle = document.getElementById('pref-toggle');
  const prefContent = document.getElementById('pref-content');
  const prefArrow = document.getElementById('pref-arrow');
  prefToggle.addEventListener('click', () => {
    const open = prefContent.style.display !== 'none';
    prefContent.style.display = open ? 'none' : 'block';
    prefArrow.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  const funToggle = document.getElementById('fun-toggle');
  const funContent = document.getElementById('fun-content');
  const funArrow = document.getElementById('fun-arrow');
  funToggle.addEventListener('click', () => {
    const open = funContent.style.display !== 'none';
    funContent.style.display = open ? 'none' : 'block';
    funArrow.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  const advToggle = document.getElementById('adv-toggle');
  const advContent = document.getElementById('adv-content');
  const advArrow = document.getElementById('adv-arrow');
  advToggle.addEventListener('click', () => {
    const open = advContent.style.display !== 'none';
    advContent.style.display = open ? 'none' : 'block';
    advArrow.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  renderSites();

  function renderSites() {
    siteList.innerHTML = '';
    searchFilters.forEach((rule, index) => {
      const domain = rule.domain || rule;
      const li = document.createElement('li');

      // --- View Mode ---
      const viewMode = document.createElement('div');
      viewMode.className = 'li-view';

      const domainSpan = document.createElement('span');
      domainSpan.className = 'li-domain';
      domainSpan.textContent = domain;

      const editBtn = document.createElement('button');
      editBtn.textContent = '✎';
      editBtn.className = 'edit-btn';
      editBtn.title = 'Edit';

      const delBtn = document.createElement('button');
      delBtn.textContent = '×';
      delBtn.className = 'delete-btn';
      delBtn.title = 'Remove';

      viewMode.appendChild(domainSpan);
      viewMode.appendChild(editBtn);
      viewMode.appendChild(delBtn);

      // --- Edit Mode ---
      const editMode = document.createElement('div');
      editMode.className = 'li-edit';
      editMode.style.display = 'none';

      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = domain;
      editInput.className = 'edit-input';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = '✓';
      saveBtn.className = 'save-btn';
      saveBtn.title = 'Save';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '✕';
      cancelBtn.className = 'cancel-btn';
      cancelBtn.title = 'Cancel';

      editMode.appendChild(editInput);
      editMode.appendChild(saveBtn);
      editMode.appendChild(cancelBtn);

      // Toggle to edit mode
      editBtn.onclick = () => {
        viewMode.style.display = 'none';
        editMode.style.display = 'flex';
        editInput.focus();
        editInput.select();
      };

      // Cancel edit
      cancelBtn.onclick = () => {
        editMode.style.display = 'none';
        viewMode.style.display = 'flex';
      };

      // Save edit
      const saveEdit = async () => {
        let newDomain = editInput.value.trim().toLowerCase();
        newDomain = newDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
        if (newDomain && newDomain !== domain) {
          searchFilters[index] = { domain: newDomain };
          await chrome.storage.local.set({ searchFilters });
          triggerLiveUpdate();
          renderSites();
        } else {
          cancelBtn.onclick();
        }
      };
      saveBtn.onclick = saveEdit;
      editInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveEdit(); });
      editInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') cancelBtn.onclick(); });

      // Delete
      delBtn.onclick = async () => {
        searchFilters.splice(index, 1);
        await chrome.storage.local.set({ searchFilters });
        renderSites();
        triggerLiveUpdate();
      };

      li.appendChild(viewMode);
      li.appendChild(editMode);
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
    if (e.key === 'Enter') addBtn.click();
  });

  // ─── Preferred Domains ────────────────────────────────────────────────────
  const prefInput = document.getElementById('pref-input');
  const prefBtn   = document.getElementById('pref-btn');
  const prefList  = document.getElementById('pref-list');
  const storeDataPref = await chrome.storage.local.get('preferredDomains');
  let preferredDomains = storeDataPref.preferredDomains || [];

  function renderPreferred() {
    prefList.innerHTML = '';
    preferredDomains.forEach((rule, i) => {
      const domain = rule.domain || rule;
      const li = document.createElement('li');
      const view = document.createElement('div');
      view.className = 'li-view';
      const span = document.createElement('span');
      span.className = 'li-domain';
      span.style.color = '#22c55e';
      span.textContent = domain;
      const del = document.createElement('button');
      del.textContent = '×'; del.className = 'delete-btn'; del.title = 'Remove';
      del.onclick = async () => {
        preferredDomains.splice(i, 1);
        await chrome.storage.local.set({ preferredDomains });
        renderPreferred(); triggerLiveUpdate();
      };
      view.appendChild(span); view.appendChild(del);
      li.appendChild(view); prefList.appendChild(li);
    });
  }
  renderPreferred();

  prefBtn.addEventListener('click', async () => {
    let d = prefInput.value.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    if (d && !preferredDomains.find(r => (r.domain||r) === d)) {
      preferredDomains.push({ domain: d });
      await chrome.storage.local.set({ preferredDomains });
      prefInput.value = ''; renderPreferred(); triggerLiveUpdate();
    }
  });
  prefInput.addEventListener('keypress', e => { if (e.key === 'Enter') prefBtn.click(); });

  // ─── Keyword Filter ───────────────────────────────────────────────────────
  const kwToggle = document.getElementById('kw-toggle');
  const kwContent = document.getElementById('kw-content');
  const kwArrow = document.getElementById('kw-arrow');
  kwToggle.addEventListener('click', () => {
    const open = kwContent.style.display !== 'none';
    kwContent.style.display = open ? 'none' : 'block';
    kwArrow.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
  });

  const kwInput = document.getElementById('kw-input');
  const kwBtn   = document.getElementById('kw-btn');
  const kwList  = document.getElementById('kw-list');
  const storeDataKw = await chrome.storage.local.get('keywordFilters');
  let keywordFilters = storeDataKw.keywordFilters || [];
  if (keywordFilters.length) { kwContent.style.display = 'block'; kwArrow.style.transform = 'rotate(90deg)'; }

  function renderKeywords() {
    kwList.innerHTML = '';
    keywordFilters.forEach((rule, i) => {
      const kw = rule.keyword || rule;
      const li = document.createElement('li');
      const view = document.createElement('div'); view.className = 'li-view';
      const span = document.createElement('span'); span.className = 'li-domain'; span.textContent = kw;
      const del = document.createElement('button');
      del.textContent = '×'; del.className = 'delete-btn';
      del.onclick = async () => {
        keywordFilters.splice(i, 1);
        await chrome.storage.local.set({ keywordFilters });
        renderKeywords(); triggerLiveUpdate();
      };
      view.appendChild(span); view.appendChild(del);
      li.appendChild(view); kwList.appendChild(li);
    });
  }
  renderKeywords();

  kwBtn.addEventListener('click', async () => {
    const kw = kwInput.value.trim().toLowerCase();
    if (kw && !keywordFilters.find(r => (r.keyword||r) === kw)) {
      keywordFilters.push({ keyword: kw });
      await chrome.storage.local.set({ keywordFilters });
      kwInput.value = ''; renderKeywords(); triggerLiveUpdate();
    }
  });
  kwInput.addEventListener('keypress', e => { if (e.key === 'Enter') kwBtn.click(); });

  // ─── Import / Export ──────────────────────────────────────────────────────
  document.getElementById('export-btn').addEventListener('click', async () => {
    const all = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'search-optimizer-settings.json'; a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      const allowed = ['searchFilters','googleModules','infiniteScroll','hiddenTabs','preferredDomains','keywordFilters'];
      const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
      await chrome.storage.local.set(filtered);
      await triggerLiveUpdate();
      window.location.reload();
    } catch(err) {
      alert('Invalid JSON file.');
    }
  });
});
