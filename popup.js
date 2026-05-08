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
  const navBtnsToggle = document.getElementById('nav-btns-enabled');
  const highlightEnabledToggle = document.getElementById('highlight-enabled');
  const highlightColorInput = document.getElementById('highlight-color');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const modSelectAll = document.getElementById('mod-select-all');
  const tabsSelectAll = document.getElementById('tabs-select-all');
  const saveBtn = document.getElementById('save-settings-btn') || document.querySelector('.save-btn');

  // Theme Elements
  const themePresets = document.querySelectorAll('.theme-preset');
  const colorPrimary = document.getElementById('color-primary');
  const colorBg = document.getElementById('color-bg');
  const colorSecondary = document.getElementById('color-secondary');

  const themes = {
    midnight: { p: '#38bdf8', b: '#0f172a', s: '#1e293b' },
    ocean: { p: '#0ea5e9', b: '#082f49', s: '#0c4a6e' },
    forest: { p: '#10b981', b: '#064e3b', s: '#065f46' },
    sunset: { p: '#f43f5e', b: '#450a0a', s: '#881337' },
    cyber: { p: '#d946ef', b: '#2e1065', s: '#4c1d95' },
    classic: { p: '#6366f1', b: '#111111', s: '#1f2937' }
  };

  function setupCollapsible(toggleId, contentId, arrowId, defaultFlex = 'flex') {
    const toggle = document.getElementById(toggleId);
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);
    if (!toggle || !content || !arrow) return;
    const isOpen = content.style.display !== 'none';
    arrow.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
    toggle.addEventListener('click', () => {
      const isNowOpen = content.style.display === 'none';
      content.style.display = isNowOpen ? defaultFlex : 'none';
      arrow.style.transform = isNowOpen ? 'rotate(90deg)' : 'rotate(0deg)';
    });
  }

  setupCollapsible('modules-toggle', 'modules-content', 'modules-arrow', 'flex');
  setupCollapsible('tabs-toggle', 'tabs-content', 'tabs-arrow', 'flex');
  setupCollapsible('block-domains-toggle', 'block-domains-content', 'block-domains-arrow', 'flex');
  setupCollapsible('pref-domains-toggle', 'pref-domains-content', 'pref-domains-arrow', 'flex');
  setupCollapsible('keywords-toggle', 'keywords-content', 'keywords-arrow', 'flex');
  setupCollapsible('highlight-toggle', 'highlight-content', 'highlight-arrow', 'flex');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  const storeData = await chrome.storage.local.get(['searchFilters', 'googleModules', 'infiniteScroll', 'hiddenTabs', 'advancedSearch', 'preferredDomains', 'blockedKeywords', 'highlightEnabled', 'highlightColor', 'navBtnsEnabled', 'themeColors']);
  
  const cleanList = (list) => (list || []).map(item => String(item.domain || item.keyword || item));

  let searchFilters = cleanList(storeData.searchFilters);
  let preferredDomains = cleanList(storeData.preferredDomains);
  let blockedKeywords = cleanList(storeData.blockedKeywords);
  let googleModules = storeData.googleModules || { ai: false, sponsored: false, latest: false, products: false, images: false, videos: false, ask: false, search: false, favicons: false, pasf: false, songs: false, knowledge: false, topstories: false, recipes: false, events: false, flights: false, hotels: false, twitter: false, forums: false };
  let hiddenTabs = storeData.hiddenTabs || {};

  infiniteToggle.checked = storeData.infiniteScroll === true;
  advSearchToggle.checked = storeData.advancedSearch !== false;
  navBtnsToggle.checked = storeData.navBtnsEnabled !== false;
  highlightEnabledToggle.checked = storeData.highlightEnabled === true;
  highlightColorInput.value = storeData.highlightColor || '#38bdf8';

  function updateEyeUI(btn, isHidden) {
    btn.innerHTML = isHidden ? EYE_CLOSED : EYE_OPEN;
    btn.classList.toggle('hidden', isHidden);
  }

  const unpackMoreToggle = document.getElementById('tab-unpack-more');
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

  const applyTheme = (colors) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.p);
    root.style.setProperty('--primary-hover', adjustColor(colors.p, 20));
    root.style.setProperty('--bg-main', colors.b);
    root.style.setProperty('--bg-card', colors.s);
    root.style.setProperty('--border', adjustColor(colors.s, 10));
    root.style.setProperty('--bg-input', adjustColor(colors.s, 15));
    root.style.setProperty('--accent-glow', colors.p + '22');
    colorPrimary.value = colors.p;
    colorBg.value = colors.b;
    colorSecondary.value = colors.s;
  };

  function adjustColor(hex, amt) {
    if (!hex) return '#000000';
    let usePound = hex[0] === "#";
    hex = usePound ? hex.slice(1) : hex;
    let num = parseInt(hex, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amt));
    let b = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    let g = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }

  if (storeData.themeColors) applyTheme(storeData.themeColors);
  else applyTheme(themes.midnight);

  themePresets.forEach(btn => {
    btn.addEventListener('click', () => {
      const colors = themes[btn.dataset.theme];
      if (colors) {
        themePresets.forEach(b => b.classList.toggle('active', b === btn));
        applyTheme(colors);
        chrome.storage.local.set({ themeColors: colors });
      }
    });
  });

  [colorPrimary, colorBg, colorSecondary].forEach(input => {
    input.addEventListener('input', () => {
      const colors = { p: colorPrimary.value, b: colorBg.value, s: colorSecondary.value };
      applyTheme(colors);
      chrome.storage.local.set({ themeColors: colors });
      themePresets.forEach(b => b.classList.remove('active'));
    });
  });

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
        chrome.storage.local.set({ [storageKey]: list }, () => { renderList(list, element, storageKey); triggerLiveUpdate(); });
      };
      li.appendChild(delBtn);
      element.appendChild(li);
    });
  }

  renderList(searchFilters, siteList, 'searchFilters');
  renderList(preferredDomains, prefSiteList, 'preferredDomains');
  renderList(blockedKeywords, keywordList, 'blockedKeywords');

  async function triggerLiveUpdate() {
    const tabs = await chrome.tabs.query({ url: "*://*.google.*/search*" });
    for (let tab of tabs) chrome.tabs.sendMessage(tab.id, { action: "live_update" }).catch(() => {});
  }

  function saveModules() { chrome.storage.local.set({ googleModules }, triggerLiveUpdate); updateSelectAllLabels(); }
  function saveTabs() { chrome.storage.local.set({ hiddenTabs }, triggerLiveUpdate); updateSelectAllLabels(); }

  function updateSelectAllLabels() {
    modSelectAll.textContent = Object.values(googleModules).every(v => v) ? 'Show All' : 'Hide All';
    tabsSelectAll.textContent = Object.values(hiddenTabs).every(v => v) ? 'Show All' : 'Hide All';
  }

  modSelectAll.addEventListener('click', () => {
    const newState = !Object.values(googleModules).every(v => v);
    Object.keys(googleModules).forEach(k => { googleModules[k] = newState; });
    document.querySelectorAll('[data-hide^="mod-"]').forEach(btn => updateEyeUI(btn, newState));
    saveModules();
  });

  tabsSelectAll.addEventListener('click', () => {
    const newState = !Object.values(hiddenTabs).every(v => v);
    Object.keys(hiddenTabs).forEach(k => { hiddenTabs[k] = newState; });
    document.querySelectorAll('[data-hide^="tab-"]').forEach(btn => updateEyeUI(btn, newState));
    saveTabs();
  });

  infiniteToggle.addEventListener('change', () => chrome.storage.local.set({ infiniteScroll: infiniteToggle.checked }, triggerLiveUpdate));
  advSearchToggle.addEventListener('change', () => chrome.storage.local.set({ advancedSearch: advSearchToggle.checked }, triggerLiveUpdate));
  navBtnsToggle.addEventListener('change', () => chrome.storage.local.set({ navBtnsEnabled: navBtnsToggle.checked }, triggerLiveUpdate));
  highlightEnabledToggle.addEventListener('change', () => chrome.storage.local.set({ highlightEnabled: highlightEnabledToggle.checked }, triggerLiveUpdate));
  highlightColorInput.addEventListener('change', () => chrome.storage.local.set({ highlightColor: highlightColorInput.value }, triggerLiveUpdate));

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

  saveBtn.addEventListener('click', () => {
    const data = { searchFilters, preferredDomains, blockedKeywords, googleModules, infiniteScroll: infiniteToggle.checked, hiddenTabs, highlightEnabled: highlightEnabledToggle.checked, highlightColor: colorPrimary.value, navBtnsEnabled: navBtnsToggle.checked };
    chrome.storage.local.set(data, () => {
      saveBtn.innerText = '✓ Saved';
      saveBtn.style.background = '#10b981';
      setTimeout(() => { saveBtn.innerText = 'Save Settings'; saveBtn.style.background = 'var(--primary)'; }, 2000);
    });
  });

  exportBtn.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `search-optimizer-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  });

  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const reader = new FileReader();
      reader.onload = async (re) => {
        const data = JSON.parse(re.target.result);
        await chrome.storage.local.clear();
        await chrome.storage.local.set(data);
        window.location.reload();
      };
      reader.readAsText(e.target.files[0]);
    };
    input.click();
  });

  updateSelectAllLabels();
});
