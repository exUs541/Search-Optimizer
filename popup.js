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
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });
});
